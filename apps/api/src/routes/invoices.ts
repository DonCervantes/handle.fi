import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { openai, AI_MODEL } from "../lib/openai";
import { evaluatePolicy, Policy } from "../services/policyEngine";
import { recordAuditOnChain } from "../services/blockchainService";
import { simulatePayment } from "../services/bitsoService";

const router = Router();

const submitInvoiceSchema = z.object({
  vendorId: z.string(),
  invoiceText: z.string().min(1).max(2000), // natural language or extracted text
  amount: z.number().positive().optional(),  // override if already known
  currency: z.string().optional(),
  dueDate: z.string().optional(),
  agentId: z.string(),                       // which agent processes this
});

// POST /invoices — submit invoice for AI processing + policy approval
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = submitInvoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { vendorId, invoiceText, agentId } = parsed.data;

  // Verify vendor ownership
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, ownerId: req.dbUserId! },
  });
  if (!vendor) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }

  // Get agent + active policy
  const agent = await prisma.agent.findFirst({
    where: { id: agentId, ownerId: req.dbUserId! },
    include: {
      credentials: {
        where: { active: true },
        include: { policies: { orderBy: { createdAt: "desc" }, take: 1 } },
        take: 1,
      },
    },
  });
  if (!agent || !agent.credentials[0]?.policies[0]) {
    res.status(400).json({ error: "Agent has no active policy" });
    return;
  }

  const policy = agent.credentials[0].policies[0].policyJson as unknown as Policy;
  const policyHash = agent.credentials[0].policyHash;

  // Step 1: AI extracts invoice data
  let aiExtracted: any;
  let aiResponse;
  try {
    aiResponse = await openai.chat.completions.create({
    model: AI_MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an invoice data extractor for a Mexican company. Extract structured data from invoice text.
Return JSON with:
- amount: number (total amount to pay)
- currency: string ("USD", "MXN", "USDC", "ARS", "COP", "BRL")
- description: string (what is this payment for)
- dueDate: string ISO date or null
- vendor: string (vendor/supplier name if mentioned)
- isDuplicate: boolean (true if this looks like a duplicate)
- confidence: number 0-1`,
      },
      { role: "user", content: invoiceText },
    ],
  });
    aiExtracted = JSON.parse(aiResponse.choices[0].message.content!);
  } catch (err) {
    console.error("AI invoice extraction failed:", err);
    // Fallback to manual data if AI fails
    aiExtracted = {
      amount: parsed.data.amount ?? 0,
      currency: parsed.data.currency ?? vendor.currency,
      description: "Invoice processing (AI unavailable)",
      confidence: 0.5,
      isDuplicate: false,
    };
  }
  const amount = parsed.data.amount ?? aiExtracted.amount;
  const currency = parsed.data.currency ?? aiExtracted.currency ?? vendor.currency;

  // Step 2: Evaluate policy
  const intent = {
    actionType: "PAYMENT" as const,
    amount,
    currency,
    recipient: vendor.name,
    confidence: aiExtracted.confidence ?? 0.9,
  };

  // Daily spent
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const approvedToday = await prisma.invoice.findMany({
    where: { ownerId: req.dbUserId!, status: "paid", paidAt: { gte: todayStart } },
    select: { amount: true },
  });
  const dailySpent = approvedToday.reduce((s: number, i: { amount: number }) => s + i.amount, 0);

  const decision = evaluatePolicy(intent, policy, dailySpent);

  // Step 3: Create invoice record
  const invoice = await prisma.invoice.create({
    data: {
      ownerId: req.dbUserId!,
      vendorId,
      amount,
      currency,
      description: aiExtracted.description,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      status: decision.approved ? "approved" : "rejected",
      aiExtracted,
    },
  });

  // Step 4: Record on-chain
  let txHash: string | null = null;
  let bitsoResult = null;

  try {
    const result = await recordAuditOnChain(
      `invoice-${invoice.id}`,
      decision.approved ? "APPROVED" : "REJECTED",
      policyHash
    );
    txHash = result.txHash;
  } catch (err) {
    console.error("On-chain audit failed:", err);
  }

  // Step 5: If approved, simulate Bitso payment
  if (decision.approved) {
    try {
      bitsoResult = await simulatePayment(amount, currency, vendor.name);
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "paid", txHash: txHash ?? bitsoResult.transactionId, paidAt: new Date() },
      });
    } catch (err) {
      console.error("Payment simulation failed:", err);
    }
  }

  res.status(201).json({
    invoice,
    vendor: { name: vendor.name, country: vendor.country, paymentMethod: vendor.paymentMethod },
    aiExtracted,
    decision: {
      approved: decision.approved,
      reason: decision.reason,
      checkedRules: decision.checkedRules,
    },
    payment: bitsoResult,
    audit: {
      txHash,
      arbiscanUrl: txHash ? `https://sepolia.arbiscan.io/tx/${txHash}` : null,
    },
  });
});

// GET /invoices — list invoices
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const status = req.query.status as string | undefined;

  const invoices = await prisma.invoice.findMany({
    where: {
      ownerId: req.dbUserId!,
      ...(status ? { status } : {}),
    },
    include: { vendor: { select: { name: true, country: true, currency: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  res.json({ invoices });
});

export default router;

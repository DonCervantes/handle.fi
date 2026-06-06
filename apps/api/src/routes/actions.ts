import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { parseIntent } from "../services/intentParser";
import { evaluatePolicy, Policy } from "../services/policyEngine";
import { recordAuditOnChain } from "../services/blockchainService";
import { simulatePayment } from "../services/bitsoService";
import { checkLiquidity } from "../services/etherfuseService";

const router = Router();

const submitActionSchema = z.object({
  agentId: z.string(),
  naturalLanguage: z.string().min(1).max(500),
});

router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = submitActionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { agentId, naturalLanguage } = parsed.data;

  // Verify agent ownership (demo agent is public)
  const isDemoAgent = agentId === "demo-agent-treasurybot";
  const agent = await prisma.agent.findFirst({
    where: isDemoAgent ? { id: agentId } : { id: agentId, ownerId: req.dbUserId! },
    include: {
      credentials: {
        where: { active: true },
        include: { policies: { orderBy: { createdAt: "desc" }, take: 1 } },
        take: 1,
      },
    },
  });

  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }

  const credential = agent.credentials[0];
  if (!credential || !credential.policies[0]) {
    res.status(400).json({ error: "Agent has no active credential or policy" });
    return;
  }

  const policy = credential.policies[0].policyJson as unknown as Policy;
  const policyHash = credential.policyHash;

  // Step 1: Parse intent with AI
  let intent;
  try {
    intent = await parseIntent(naturalLanguage);
  } catch (err) {
    console.error("Intent parsing failed:", err);
    res.status(502).json({ error: "AI intent parsing failed. Please try again." });
    return;
  }

  // Step 2: Check Etherfuse liquidity (mock)
  if (intent.amount) {
    await checkLiquidity(intent.amount);
  }

  // Step 3: Calculate daily spending for this agent
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Approximate daily spent from approved actions
  const approvedToday = await prisma.action.findMany({
    where: { agentId, status: "APPROVED", createdAt: { gte: todayStart } },
    select: { payload: true },
  });
  const dailySpentAmount = approvedToday.reduce((sum: number, a: { payload: unknown }) => {
    const p = a.payload as Record<string, unknown>;
    return sum + ((p?.amount as number) ?? 0);
  }, 0);

  // Step 4: Evaluate policy (deterministic, no AI)
  const decision = evaluatePolicy(intent, policy, dailySpentAmount);

  // Step 5: Create action record
  const action = await prisma.action.create({
    data: {
      agentId,
      actionType: intent.actionType,
      payload: { ...intent, naturalLanguage },
      status: decision.approved ? "APPROVED" : "REJECTED",
    },
  });

  // Step 6: Record audit on Arbitrum
  let txHash: string | null = null;
  let actionHash: string | null = null;

  try {
    const result = await recordAuditOnChain(
      action.id,
      decision.approved ? "APPROVED" : "REJECTED",
      policyHash,
      credential.id
    );
    txHash = result.txHash;
    actionHash = result.actionHash;
  } catch (err) {
    console.error("Blockchain audit failed (non-fatal):", err);
  }

  // Step 7: Create audit log
  const auditLog = await prisma.auditLog.create({
    data: {
      actionId: action.id,
      decision: decision.approved ? "APPROVED" : "REJECTED",
      reason: decision.reason,
      actionHash,
      txHash,
    },
  });

  // Step 8: If approved, simulate Bitso payment
  let bitsoResult = null;
  if (decision.approved && intent.amount && intent.currency) {
    try {
      bitsoResult = await simulatePayment(
        intent.amount,
        intent.currency,
        intent.recipient ?? "unknown"
      );
    } catch (err) {
      console.error("Bitso simulation failed:", err);
    }
  }

  res.json({
    action: {
      id: action.id,
      status: action.status,
      actionType: intent.actionType,
    },
    intent,
    decision: {
      approved: decision.approved,
      reason: decision.reason,
      checkedRules: decision.checkedRules,
    },
    audit: {
      id: auditLog.id,
      txHash,
      actionHash,
      arbiscanUrl: txHash
        ? `https://sepolia.arbiscan.io/tx/${txHash}`
        : null,
    },
    bitso: bitsoResult,
  });
});

export default router;

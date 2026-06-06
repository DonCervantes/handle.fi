import { Router, Response, Request } from "express";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import {
  getAssets,
  createQuote,
  onrampMXNtoCETES,
  offrampCETEStoMXN,
  getOrder,
} from "../services/etherfuseService";

const router = Router();

// ── GET /treasury ── positions + EtherFuse assets ─────────
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const positions = await prisma.treasuryPosition.findMany({
    where: { ownerId: req.dbUserId!, status: "active" },
    orderBy: { openedAt: "desc" },
  });

  const totalInvested = positions.reduce((s: number, p: { amountInvested: number }) => s + p.amountInvested, 0);
  const totalCurrentValue = positions.reduce((s: number, p: { currentValue: number }) => s + p.currentValue, 0);
  const weightedApy = positions.length > 0
    ? positions.reduce((s: number, p: { apy: number; amountInvested: number }) => s + p.apy * p.amountInvested, 0) / totalInvested
    : 0;

  // Get real EtherFuse assets
  let efAssets: Awaited<ReturnType<typeof getAssets>> = [];
  try {
    efAssets = await getAssets();
  } catch (err) {
    console.error("[EtherFuse] Failed to fetch assets:", err);
  }

  res.json({
    positions,
    summary: {
      totalInvested,
      totalCurrentValue,
      totalYield: totalCurrentValue - totalInvested,
      weightedApy: Math.round(weightedApy * 100) / 100,
    },
    etherfuse: {
      available: efAssets,
      sandbox: process.env.ETHERFUSE_API_URL?.includes("sand") ?? true,
    },
  });
});

// ── POST /treasury/quote ── get live exchange rate ─────────
router.post("/quote", requireAuth, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    type: z.enum(["onramp", "offramp"]),
    amount: z.number().positive(),
    walletAddress: z.string().default("demo-wallet"),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const quote = await createQuote(
      parsed.data.type,
      parsed.data.amount,
      process.env.ETHERFUSE_DEMO_CUSTOMER_ID ?? "demo-customer-001",
      parsed.data.walletAddress
    );
    res.json({ quote });
  } catch (err: any) {
    res.status(502).json({ error: `EtherFuse quote failed: ${err.message}` });
  }
});

// ── POST /treasury/onramp ── MXN → CETES ──────────────────
const onrampSchema = z.object({
  amountMXN: z.number().positive(),
  walletAddress: z.string().default(process.env.ETHERFUSE_DEMO_WALLET ?? ""),
  customerId: z.string().default(process.env.ETHERFUSE_DEMO_CUSTOMER_ID ?? ""),
  bankAccountId: z.string().default(process.env.ETHERFUSE_DEMO_BANK_ACCOUNT_ID ?? ""),
});

router.post("/onramp", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = onrampSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { amountMXN, walletAddress, customerId, bankAccountId } = parsed.data;

  try {
    const { quote, order } = await onrampMXNtoCETES(
      amountMXN,
      customerId,
      bankAccountId,
      walletAddress,
      true // auto-simulate in sandbox
    );

    // Save position in DB
    const destAmount = typeof quote.destinationAmount === "string"
      ? parseFloat(quote.destinationAmount)
      : quote.destinationAmount;
    const position = await prisma.treasuryPosition.create({
      data: {
        ownerId: req.dbUserId!,
        asset: "CETES",
        amountInvested: amountMXN,
        currentValue: destAmount,
        apy: 9.1,
        bondType: "CETES_MXN",
        redemptionEligibleAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({
      position,
      etherfuse: {
        orderId: order.orderId,
        status: order.status,
        depositClabe: order.depositClabe,
        statusPage: order.statusPage,
        exchangeRate: parseFloat(quote.exchangeRate as any),
        feeBps: parseInt(quote.feeBps as any),
        sourceMXN: amountMXN,
        destinationCETES: destAmount,
        isReal: true,
      },
      message: `✅ ${amountMXN.toLocaleString()} MXN → ${destAmount.toFixed(4)} CETES | APY: 9.1%`,
    });
  } catch (err: any) {
    console.error("[Treasury onramp]", err);
    res.status(502).json({ error: `Onramp failed: ${err.message}` });
  }
});

// ── POST /treasury/offramp ── CETES → MXN ─────────────────
const offrampSchema = z.object({
  positionId: z.string().optional(),
  amountCETES: z.number().positive(),
  walletAddress: z.string().default(process.env.ETHERFUSE_DEMO_WALLET ?? ""),
  customerId: z.string().default(process.env.ETHERFUSE_DEMO_CUSTOMER_ID ?? ""),
  bankAccountId: z.string().default(process.env.ETHERFUSE_DEMO_BANK_ACCOUNT_ID ?? ""),
});

router.post("/offramp", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = offrampSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { positionId, amountCETES, walletAddress, customerId, bankAccountId } = parsed.data;

  try {
    const { quote, order } = await offrampCETEStoMXN(
      amountCETES,
      customerId,
      bankAccountId,
      walletAddress
    );

    // Update DB position if provided
    if (positionId) {
      const position = await prisma.treasuryPosition.findFirst({
        where: { id: positionId, ownerId: req.dbUserId! },
      });
      if (position) {
        const daysHeld = (Date.now() - position.openedAt.getTime()) / (1000 * 60 * 60 * 24);
        const yieldEarned = (position.amountInvested * position.apy) / 100 / 365 * daysHeld;
        await prisma.treasuryPosition.update({
          where: { id: positionId },
          data: { status: "redeemed", currentValue: position.amountInvested + yieldEarned },
        });
      }
    }

    res.json({
      etherfuse: {
        orderId: order.orderId,
        status: order.status,
        statusPage: order.statusPage,
        burnTransaction: order.burnTransaction,
        exchangeRate: parseFloat(quote.exchangeRate as any),
        sourceCETES: amountCETES,
        destinationMXN: typeof quote.destinationAmount === "string" ? parseFloat(quote.destinationAmount) : quote.destinationAmount,
        isReal: true,
      },
      message: `✅ ${amountCETES} CETES → ${(typeof quote.destinationAmount === "string" ? parseFloat(quote.destinationAmount) : quote.destinationAmount).toFixed(2)} MXN | Pago procesado`,
    });
  } catch (err: any) {
    console.error("[Treasury offramp]", err);
    res.status(502).json({ error: `Offramp failed: ${err.message}` });
  }
});

// ── GET /treasury/order/:id ── track order status ─────────
router.get("/order/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const order = await getOrder(req.params.id);
    res.json({ order });
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

// ── POST /treasury/deposit ── legacy compat ────────────────
const depositSchema = z.object({
  bondType: z.enum(["CETES_MXN", "US_TREASURY"]),
  amount: z.number().positive(),
});

router.post("/deposit", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = depositSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  // Redirect to onramp for CETES
  if (parsed.data.bondType === "CETES_MXN") {
    req.body = { amountMXN: parsed.data.amount };
    return (router as any).handle({ ...req, url: "/onramp", path: "/onramp" }, res, () => {});
  }
  res.status(400).json({ error: "Use /treasury/onramp" });
});

// ── POST /treasury/redeem ── legacy compat ─────────────────
router.post("/redeem", requireAuth, async (req: AuthRequest, res: Response) => {
  const schema = z.object({ positionId: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const position = await prisma.treasuryPosition.findFirst({
    where: { id: parsed.data.positionId, ownerId: req.dbUserId!, status: "active" },
  });
  if (!position) {
    res.status(404).json({ error: "Position not found" });
    return;
  }

  const daysHeld = (Date.now() - position.openedAt.getTime()) / (1000 * 60 * 60 * 24);
  const yieldEarned = (position.amountInvested * position.apy) / 100 / 365 * daysHeld;

  await prisma.treasuryPosition.update({
    where: { id: position.id },
    data: { status: "redeemed", currentValue: position.amountInvested + yieldEarned },
  });

  res.json({
    redeemed: {
      principal: position.amountInvested,
      yield: yieldEarned.toFixed(2),
      total: (position.amountInvested + yieldEarned).toFixed(2),
      currency: position.bondType === "CETES_MXN" ? "MXN" : "USD",
    },
  });
});

// ── POST /treasury/webhook ── EtherFuse events ─────────────
router.post("/webhook", async (req: Request, res: Response) => {
  const signature = req.headers["x-etherfuse-signature"] as string;

  // Verify HMAC-SHA256 signature
  if (signature && process.env.ETHERFUSE_WEBHOOK_SECRET) {
    const expected = crypto
      .createHmac("sha256", process.env.ETHERFUSE_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");
    if (signature !== expected) {
      res.status(401).json({ error: "Invalid webhook signature" });
      return;
    }
  }

  const { event, data } = req.body;
  console.log(`[EtherFuse Webhook] ${event}:`, JSON.stringify(data).slice(0, 200));

  if (event === "order_updated") {
    console.log(`[EtherFuse] Order ${data.orderId} → ${data.status}`);
    // Could update DB here based on orderId
  }

  res.json({ received: true });
});

export default router;

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { getAuthContext } from "@/server/auth";
import { parseIntent } from "@/server/services/intentParser";
import { evaluatePolicy, Policy } from "@/server/services/policyEngine";
import { recordAuditOnChain } from "@/server/services/blockchainService";
import { simulatePayment } from "@/server/services/bitsoService";
import { checkLiquidity } from "@/server/services/etherfuseService";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  agentId: z.string(),
  naturalLanguage: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const isDemoAgent = parsed.data.agentId === "demo-agent-treasurybot";
  const auth = await getAuthContext(req, { demoCondition: isDemoAgent });
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { agentId, naturalLanguage } = parsed.data;

  const agent = await prisma.agent.findFirst({
    where: isDemoAgent ? { id: agentId } : { id: agentId, ownerId: auth.dbUserId },
    include: {
      credentials: {
        where: { active: true },
        include: { policies: { orderBy: { createdAt: "desc" }, take: 1 } },
        take: 1,
      },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const credential = agent.credentials[0];
  if (!credential || !credential.policies[0]) {
    return NextResponse.json({ error: "Agent has no active credential or policy" }, { status: 400 });
  }

  const policy = credential.policies[0].policyJson as unknown as Policy;
  const policyHash = credential.policyHash;

  let intent;
  try {
    intent = await parseIntent(naturalLanguage);
  } catch (err) {
    console.error("Intent parsing failed:", err);
    return NextResponse.json({ error: "AI intent parsing failed. Please try again." }, { status: 502 });
  }

  if (intent.amount) {
    await checkLiquidity(intent.amount);
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const approvedToday = await prisma.action.findMany({
    where: { agentId, status: "APPROVED", createdAt: { gte: todayStart } },
    select: { payload: true },
  });
  const dailySpentAmount = approvedToday.reduce((sum: number, a: { payload: unknown }) => {
    const p = a.payload as Record<string, unknown>;
    return sum + ((p?.amount as number) ?? 0);
  }, 0);

  const decision = evaluatePolicy(intent, policy, dailySpentAmount);

  const action = await prisma.action.create({
    data: {
      agentId,
      actionType: intent.actionType,
      payload: { ...intent, naturalLanguage },
      status: decision.approved ? "APPROVED" : "REJECTED",
    },
  });

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

  const auditLog = await prisma.auditLog.create({
    data: {
      actionId: action.id,
      decision: decision.approved ? "APPROVED" : "REJECTED",
      reason: decision.reason,
      actionHash,
      txHash,
    },
  });

  let bitsoResult = null;
  if (decision.approved && intent.amount && intent.currency) {
    try {
      bitsoResult = await simulatePayment(intent.amount, intent.currency, intent.recipient ?? "unknown");
    } catch (err) {
      console.error("Bitso simulation failed:", err);
    }
  }

  return NextResponse.json({
    action: { id: action.id, status: action.status, actionType: intent.actionType },
    intent,
    decision: {
      approved: decision.approved,
      reason: decision.reason,
      checkedRules: decision.checkedRules,
    },
    audit: {
      id: auditLog.id,
      txHash, actionHash,
      arbiscanUrl: txHash ? `https://sepolia.arbiscan.io/tx/${txHash}` : null,
    },
    bitso: bitsoResult,
  });
}

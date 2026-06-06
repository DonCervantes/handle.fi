import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

const DEMO_USER_ID = "cmq19dv6m0000gsx3ota0895n";
const DEMO_AGENT_ID = "demo-agent-treasurybot";

// GET /dashboard — public demo state endpoint
router.get("/", async (_req: Request, res: Response) => {
  try {
    const [agent, vendors, recentActions, auditLogs, treasury] = await Promise.all([
      // Agent + active credential + policy
      prisma.agent.findUnique({
        where: { id: DEMO_AGENT_ID },
        include: {
          credentials: {
            where: { active: true },
            include: { policies: { orderBy: { createdAt: "desc" }, take: 1 } },
            take: 1,
          },
        },
      }),
      // Vendors
      prisma.vendor.findMany({
        where: { ownerId: DEMO_USER_ID, status: "active" },
        include: { _count: { select: { invoices: true } } },
        orderBy: { createdAt: "asc" },
      }),
      // Recent actions (last 10)
      prisma.action.findMany({
        where: { agentId: DEMO_AGENT_ID },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          auditLogs: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
      // Audit logs (last 10)
      prisma.auditLog.findMany({
        where: { action: { agentId: DEMO_AGENT_ID } },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          action: { select: { actionType: true, payload: true, status: true } },
        },
      }),
      // Treasury positions
      prisma.treasuryPosition.findMany({
        where: { ownerId: DEMO_USER_ID, status: "active" },
      }),
    ]);

    // Stats
    const approvedCount = await prisma.action.count({
      where: { agentId: DEMO_AGENT_ID, status: "APPROVED" },
    });
    const rejectedCount = await prisma.action.count({
      where: { agentId: DEMO_AGENT_ID, status: "REJECTED" },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayApproved = await prisma.action.findMany({
      where: { agentId: DEMO_AGENT_ID, status: "APPROVED", createdAt: { gte: todayStart } },
      select: { payload: true },
    });
    const dailyVolume = todayApproved.reduce((s: number, a: { payload: unknown }) => {
      const p = a.payload as Record<string, unknown>;
      return s + ((p?.amount as number) ?? 0);
    }, 0);

    const treasurySummary = treasury.reduce(
      (acc, p) => ({ invested: acc.invested + p.amountInvested, yield: acc.yield + (p.currentValue - p.amountInvested) }),
      { invested: 0, yield: 0 }
    );

    res.json({
      agent: {
        id: agent?.id,
        name: agent?.name,
        description: agent?.description,
        policy: agent?.credentials[0]?.policies[0]?.policyJson ?? null,
        credentialActive: !!agent?.credentials[0]?.active,
      },
      vendors,
      recentActions,
      auditLogs,
      treasury: {
        positions: treasury,
        totalInvested: treasurySummary.invested,
        totalYield: treasurySummary.yield,
        apy: treasury[0]?.apy ?? 9.1,
      },
      stats: {
        totalApproved: approvedCount,
        totalRejected: rejectedCount,
        approvalRate: approvedCount + rejectedCount > 0
          ? Math.round((approvedCount / (approvedCount + rejectedCount)) * 100)
          : 0,
        dailyVolume,
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

export default router;

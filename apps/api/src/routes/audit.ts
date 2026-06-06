import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const agentId = req.query.agentId as string | undefined;

  const agentFilter = agentId
    ? { agentId, agent: { ownerId: req.dbUserId! } }
    : { agent: { ownerId: req.dbUserId! } };

  const logs = await prisma.auditLog.findMany({
    where: { action: agentFilter },
    include: {
      action: {
        select: {
          id: true,
          actionType: true,
          payload: true,
          status: true,
          createdAt: true,
          agentId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  res.json({ logs });
});

export default router;

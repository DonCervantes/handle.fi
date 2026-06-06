import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = createAgentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const agent = await prisma.agent.create({
    data: {
      ownerId: req.dbUserId!,
      name: parsed.data.name,
      description: parsed.data.description,
    },
  });

  res.status(201).json({ agent });
});

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const agents = await prisma.agent.findMany({
    where: { ownerId: req.dbUserId! },
    include: { credentials: { where: { active: true }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  res.json({ agents });
});

router.get("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const agent = await prisma.agent.findFirst({
    where: { id: req.params.id, ownerId: req.dbUserId! },
    include: {
      credentials: {
        where: { active: true },
        include: { policies: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });

  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }

  res.json({ agent });
});

export default router;

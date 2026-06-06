import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const router = Router();

const verifySchema = z.object({
  credentialId: z.string(),
});

router.post("/", async (req: Request, res: Response) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const credential = await prisma.credential.findUnique({
    where: { id: parsed.data.credentialId },
    include: {
      agent: { select: { name: true, id: true } },
      policies: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!credential) {
    res.status(404).json({ verified: false, error: "Credential not found" });
    return;
  }

  res.json({
    verified: credential.active,
    credential: {
      id: credential.id,
      agentId: credential.agentId,
      agentName: credential.agent.name,
      credentialHash: credential.credentialHash,
      policyHash: credential.policyHash,
      onChainTxHash: credential.onChainTxHash,
      active: credential.active,
      createdAt: credential.createdAt,
    },
  });
});

export default router;

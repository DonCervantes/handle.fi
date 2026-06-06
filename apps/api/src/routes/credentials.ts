import { Router, Response } from "express";
import { z } from "zod";
import { ethers } from "ethers";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { registerCredentialOnChain } from "../services/blockchainService";

const router = Router();

const policySchema = z.object({
  maxTransactionAmount: z.number().positive(),
  allowedCurrencies: z.array(z.string()).min(1),
  allowedActionTypes: z.array(z.string()).min(1),
  requireApprovalAbove: z.number().positive().optional(),
  allowedRecipients: z.array(z.string()).optional(),
  dailyLimit: z.number().positive().optional(),
});

const createCredentialSchema = z.object({
  agentId: z.string(),
  policyJson: policySchema,
  signature: z.string().optional(),
  signedMessage: z.string().optional(),
});

router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = createCredentialSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const agent = await prisma.agent.findFirst({
    where: { id: parsed.data.agentId, ownerId: req.dbUserId! },
  });

  if (!agent) {
    res.status(404).json({ error: "Agent not found or not owned by you" });
    return;
  }

  const policyStr = JSON.stringify(parsed.data.policyJson);
  const policyHash = ethers.keccak256(ethers.toUtf8Bytes(policyStr));
  const credentialHash = ethers.keccak256(
    ethers.toUtf8Bytes(`${agent.id}:${policyHash}:${Date.now()}`)
  );

  // Deactivate previous credentials
  await prisma.credential.updateMany({
    where: { agentId: agent.id, active: true },
    data: { active: false },
  });

  const credential = await prisma.credential.create({
    data: {
      agentId: agent.id,
      credentialHash,
      policyHash,
      policies: {
        create: { policyJson: parsed.data.policyJson, policyHash },
      },
    },
    include: { policies: true },
  });

  // Register on-chain (non-blocking for hackathon speed — log error if fails)
  registerCredentialOnChain(credential.id, credentialHash, policyHash)
    .then((txHash) => {
      prisma.credential.update({
        where: { id: credential.id },
        data: { onChainTxHash: txHash },
      }).catch(console.error);
    })
    .catch((err) => console.error("On-chain credential registration failed:", err));

  res.status(201).json({ credential });
});

router.get("/:agentId", requireAuth, async (req: AuthRequest, res: Response) => {
  const agent = await prisma.agent.findFirst({
    where: { id: req.params.agentId, ownerId: req.dbUserId! },
  });

  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }

  const credentials = await prisma.credential.findMany({
    where: { agentId: req.params.agentId },
    include: { policies: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  res.json({ credentials });
});

export default router;

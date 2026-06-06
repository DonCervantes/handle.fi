import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

const createVendorSchema = z.object({
  name: z.string().min(1).max(100),
  country: z.string().length(2).toUpperCase(), // ISO code: MX, US, CN, etc.
  currency: z.enum(["USD", "MXN", "USDC", "ARS", "COP", "BRL"]),
  paymentMethod: z.enum(["SPEI", "USDC", "WIRE", "PIX", "ACH"]),
  walletAddress: z.string().optional(),
  bankAccount: z.string().optional(),
  email: z.string().email().optional(),
});

// POST /vendors — create vendor
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = createVendorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const vendor = await prisma.vendor.create({
    data: { ...parsed.data, ownerId: req.dbUserId! },
  });

  res.status(201).json({ vendor });
});

// GET /vendors — list vendors
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const vendors = await prisma.vendor.findMany({
    where: { ownerId: req.dbUserId!, status: "active" },
    include: { _count: { select: { invoices: true } } },
    orderBy: { createdAt: "desc" },
  });

  res.json({ vendors });
});

// GET /vendors/:id
router.get("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const vendor = await prisma.vendor.findFirst({
    where: { id: req.params.id, ownerId: req.dbUserId! },
    include: {
      invoices: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!vendor) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }

  res.json({ vendor });
});

// DELETE /vendors/:id — soft delete
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  await prisma.vendor.updateMany({
    where: { id: req.params.id, ownerId: req.dbUserId! },
    data: { status: "inactive" },
  });

  res.json({ success: true });
});

export default router;

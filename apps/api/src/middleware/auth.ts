import { Request, Response, NextFunction } from "express";
import { PrivyClient } from "@privy-io/server-auth";
import { prisma } from "../lib/prisma";

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

export interface AuthRequest extends Request {
  userId?: string;
  walletAddress?: string;
  dbUserId?: string;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.header("authorization")?.replace("Bearer ", "");

  // Demo mode: allow unauthenticated access for demo resources
  const body = req.body as Record<string, unknown>;
  const isDemoAgent = body?.agentId === "demo-agent-treasurybot";
  const isDemoRoute = req.method === "GET"; // all GET list endpoints
  const isDemoVendor = typeof body?.vendorId === "string"; // invoice with demo vendor
  const isTreasuryDemo = req.baseUrl === "/treasury"; // EtherFuse demo endpoints

  if (!token && (isDemoAgent || isDemoVendor || isDemoRoute || isTreasuryDemo)) {
    req.userId = "demo-user";
    req.dbUserId = "cmq19dv6m0000gsx3ota0895n";
    next();
    return;
  }

  if (!token) {
    res.status(401).json({ error: "No authorization token provided" });
    return;
  }

  try {
    const claims = await privy.verifyAuthToken(token);
    req.userId = claims.userId;

    // Upsert user in DB
    const user = await prisma.user.upsert({
      where: { privyId: claims.userId },
      update: {},
      create: { privyId: claims.userId },
    });
    req.dbUserId = user.id;

    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

import { NextRequest } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";
import { prisma } from "./prisma";

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

export interface AuthContext {
  userId: string;
  dbUserId: string;
  isDemo: boolean;
}

const DEMO_USER_ID = "cmq19dv6m0000gsx3ota0895n";

export async function getAuthContext(
  req: NextRequest,
  options: { allowDemo?: boolean; demoCondition?: boolean } = {}
): Promise<AuthContext | { error: string; status: number }> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");

  // Demo mode bypass (when explicitly allowed by route)
  if (!token && (options.allowDemo || options.demoCondition)) {
    return { userId: "demo-user", dbUserId: DEMO_USER_ID, isDemo: true };
  }

  if (!token) {
    return { error: "No authorization token", status: 401 };
  }

  try {
    const claims = await privy.verifyAuthToken(token);
    const user = await prisma.user.upsert({
      where: { privyId: claims.userId },
      update: {},
      create: { privyId: claims.userId },
    });
    return { userId: claims.userId, dbUserId: user.id, isDemo: false };
  } catch {
    return { error: "Invalid token", status: 401 };
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { getAuthContext } from "@/server/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.dbUserId },
    include: { organization: true, agents: { take: 1 } },
  });

  return NextResponse.json({
    onboarded: !!user?.onboardedAt,
    organization: user?.organization ?? null,
    agentId: user?.agents[0]?.id ?? null,
  });
}

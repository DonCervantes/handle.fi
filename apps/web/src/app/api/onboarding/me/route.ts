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
    include: {
      organization: true,
      agents: {
        take: 1,
        include: {
          credentials: {
            where: { active: true },
            include: { policies: { orderBy: { createdAt: "desc" }, take: 1 } },
            take: 1,
          },
        },
      },
      vendors: { where: { status: "active" }, orderBy: { createdAt: "asc" } },
      employees: { where: { status: "active" }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const agent = user.agents[0];
  const policy = agent?.credentials[0]?.policies[0]?.policyJson ?? null;

  return NextResponse.json({
    organization: user.organization,
    agent: agent ? { id: agent.id, name: agent.name, description: agent.description } : null,
    policy,
    vendors: user.vendors.map((v) => ({
      id: v.id,
      name: v.name,
      country: v.country,
      currency: v.currency,
      paymentMethod: v.paymentMethod,
    })),
    employees: user.employees.map((e) => ({
      id: e.id, name: e.name, role: e.role, country: e.country, salary: e.salary, currency: e.currency,
    })),
  });
}

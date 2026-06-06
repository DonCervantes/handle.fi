import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ethers } from "ethers";
import { prisma } from "@/server/prisma";
import { getAuthContext } from "@/server/auth";
import { registerCredentialOnChain } from "@/server/services/blockchainService";

export const runtime = "nodejs";
export const maxDuration = 60;

const onboardingSchema = z.object({
  name: z.string().min(2).max(100),
  rfc: z.string().optional(),
  industry: z.enum(["manufacturing", "tech_saas", "commerce", "services", "agency", "construction"]),
  country: z.string().default("MX"),
  employeeCount: z.number().int().min(0).max(10000),
  monthlyRevenueUSD: z.number().min(0),
  hasIntlVendors: z.boolean().default(false),
  operatingCountries: z.array(z.string()).optional(),
  idleCashUSD: z.number().min(0).default(0),
  preferYield: z.boolean().default(true),
});

const VENDOR_TEMPLATES: Record<string, Array<{ name: string; country: string; currency: string; paymentMethod: string; email: string }>> = {
  manufacturing: [
    { name: "Shenzhen Tech Parts", country: "CN", currency: "USD", paymentMethod: "USDC", email: "billing@sztech.cn" },
    { name: "Acero Industrial MX", country: "MX", currency: "MXN", paymentMethod: "SPEI", email: "pagos@acero.mx" },
    { name: "Global Logistics US", country: "US", currency: "USD", paymentMethod: "WIRE", email: "ap@globallog.us" },
    { name: "Plásticos Monterrey", country: "MX", currency: "MXN", paymentMethod: "SPEI", email: "cobranza@plasticosmty.mx" },
  ],
  tech_saas: [
    { name: "AWS Cloud Services", country: "US", currency: "USD", paymentMethod: "USDC", email: "billing@aws.com" },
    { name: "Anna Kowalski Design", country: "PL", currency: "USD", paymentMethod: "USDC", email: "anna@design.pl" },
    { name: "Carlos Rodríguez Dev", country: "MX", currency: "MXN", paymentMethod: "SPEI", email: "carlos@dev.mx" },
    { name: "Stripe Inc.", country: "US", currency: "USD", paymentMethod: "WIRE", email: "billing@stripe.com" },
  ],
  commerce: [
    { name: "Alibaba Wholesale", country: "CN", currency: "USD", paymentMethod: "USDC", email: "ap@alibaba.com" },
    { name: "DHL Express MX", country: "MX", currency: "MXN", paymentMethod: "SPEI", email: "cobros@dhl.mx" },
    { name: "Mercado Libre", country: "MX", currency: "MXN", paymentMethod: "SPEI", email: "marketplace@ml.com" },
  ],
  services: [
    { name: "Despacho Contable Pérez", country: "MX", currency: "MXN", paymentMethod: "SPEI", email: "factura@perezcpa.mx" },
    { name: "Bufete Legal Galicia", country: "MX", currency: "MXN", paymentMethod: "SPEI", email: "pagos@galicia.legal" },
    { name: "Microsoft 365", country: "US", currency: "USD", paymentMethod: "WIRE", email: "billing@microsoft.com" },
  ],
  agency: [
    { name: "Adobe Creative Cloud", country: "US", currency: "USD", paymentMethod: "USDC", email: "billing@adobe.com" },
    { name: "Freelancer JP Tokyo", country: "JP", currency: "USD", paymentMethod: "USDC", email: "jp@freelance.jp" },
    { name: "Anna Kowalski Design", country: "PL", currency: "USD", paymentMethod: "USDC", email: "anna@design.pl" },
    { name: "Impresos del Sur", country: "MX", currency: "MXN", paymentMethod: "SPEI", email: "ventas@impresos.mx" },
  ],
  construction: [
    { name: "CEMEX México", country: "MX", currency: "MXN", paymentMethod: "SPEI", email: "facturacion@cemex.mx" },
    { name: "Acero Industrial MX", country: "MX", currency: "MXN", paymentMethod: "SPEI", email: "pagos@acero.mx" },
    { name: "Maquinaria Pesada Wong", country: "CN", currency: "USD", paymentMethod: "USDC", email: "sales@wongmach.cn" },
  ],
};

const EMPLOYEE_TEMPLATES: Record<string, Array<{ role: string; salary: number; currency: string; country: string }>> = {
  manufacturing: [
    { role: "Director Operaciones", salary: 65000, currency: "MXN", country: "MX" },
    { role: "Gerente Producción", salary: 38000, currency: "MXN", country: "MX" },
    { role: "Contador General", salary: 28000, currency: "MXN", country: "MX" },
  ],
  tech_saas: [
    { role: "Senior Engineer", salary: 4500, currency: "USD", country: "US" },
    { role: "Product Manager", salary: 3800, currency: "USD", country: "MX" },
    { role: "Designer", salary: 2800, currency: "USD", country: "AR" },
  ],
  commerce: [
    { role: "Gerente Ventas", salary: 42000, currency: "MXN", country: "MX" },
    { role: "Logística", salary: 25000, currency: "MXN", country: "MX" },
  ],
  services: [
    { role: "Director Servicios", salary: 55000, currency: "MXN", country: "MX" },
    { role: "Consultor Senior", salary: 32000, currency: "MXN", country: "MX" },
  ],
  agency: [
    { role: "Creative Director", salary: 48000, currency: "MXN", country: "MX" },
    { role: "Account Manager", salary: 32000, currency: "MXN", country: "MX" },
    { role: "Freelance Designer", salary: 2500, currency: "USD", country: "PL" },
  ],
  construction: [
    { role: "Project Manager", salary: 58000, currency: "MXN", country: "MX" },
    { role: "Arquitecto Senior", salary: 42000, currency: "MXN", country: "MX" },
  ],
};

function generatePolicy(input: z.infer<typeof onboardingSchema>) {
  const txLimit = Math.min(5000, Math.max(500, input.monthlyRevenueUSD * 0.10));
  const dailyLimit = Math.min(15000, Math.max(1500, input.monthlyRevenueUSD * 0.30));
  const allowedCurrencies = ["USD", "MXN"];
  if (input.hasIntlVendors) allowedCurrencies.push("USDC");
  return {
    maxTransactionAmount: Math.round(txLimit),
    allowedCurrencies,
    allowedActionTypes: ["PAYMENT", "TRANSFER", "TREASURY_DEPOSIT"],
    dailyLimit: Math.round(dailyLimit),
  };
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContext(req);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const userId = auth.dbUserId;

  try {
    const org = await prisma.organization.upsert({
      where: { ownerId: userId },
      update: {
        name: data.name, rfc: data.rfc, industry: data.industry, country: data.country,
        employeeCount: data.employeeCount, monthlyRevenueUSD: data.monthlyRevenueUSD,
        hasIntlVendors: data.hasIntlVendors,
        operatingCountries: (data.operatingCountries ?? [data.country]) as any,
        idleCashUSD: data.idleCashUSD, preferYield: data.preferYield,
      },
      create: {
        ownerId: userId, name: data.name, rfc: data.rfc, industry: data.industry, country: data.country,
        employeeCount: data.employeeCount, monthlyRevenueUSD: data.monthlyRevenueUSD,
        hasIntlVendors: data.hasIntlVendors,
        operatingCountries: (data.operatingCountries ?? [data.country]) as any,
        idleCashUSD: data.idleCashUSD, preferYield: data.preferYield,
      },
    });

    const policy = generatePolicy(data);
    const policyStr = JSON.stringify(policy);
    const policyHash = ethers.keccak256(ethers.toUtf8Bytes(policyStr));
    const credentialHash = ethers.keccak256(
      ethers.toUtf8Bytes(`${userId}:${policyHash}:${Date.now()}`)
    );

    const agent = await prisma.agent.create({
      data: {
        ownerId: userId,
        name: `${data.name} TreasuryBot`,
        description: `AI agent for ${data.industry} operations`,
        credentials: {
          create: {
            credentialHash, policyHash, active: true,
            policies: { create: { policyJson: policy, policyHash } },
          },
        },
      },
      include: { credentials: { take: 1 } },
    });

    const credentialDbId = agent.credentials[0]?.id;
    let credentialTxHash: string | null = null;
    if (credentialDbId) {
      try {
        credentialTxHash = await registerCredentialOnChain(credentialDbId, credentialHash, policyHash);
        await prisma.credential.update({
          where: { id: credentialDbId },
          data: { onChainTxHash: credentialTxHash },
        });
      } catch (err) {
        console.error("[Onboarding] On-chain credential failed:", err);
      }
    }

    const vendorTemplates = VENDOR_TEMPLATES[data.industry] ?? VENDOR_TEMPLATES.services;
    const vendors = await Promise.all(
      vendorTemplates.map((v) => prisma.vendor.create({
        data: { ...v, ownerId: userId, status: "active" },
      }))
    );

    const employeeTemplates = EMPLOYEE_TEMPLATES[data.industry] ?? EMPLOYEE_TEMPLATES.services;
    const numToCreate = Math.min(employeeTemplates.length, Math.max(1, Math.floor(data.employeeCount / 50)));
    const employees = await Promise.all(
      employeeTemplates.slice(0, numToCreate).map((e, i) => prisma.employee.create({
        data: {
          ownerId: userId,
          name: ["Carlos Hernández", "Ana García", "Luis Méndez", "María López"][i] ?? "Empleado " + (i + 1),
          ...e,
        },
      }))
    );

    const suggestedTreasuryMXN = Math.round(Math.min(500, data.idleCashUSD * 17.5 * 0.3));
    const treasurySuggestion = data.preferYield && data.idleCashUSD > 0
      ? {
          amountMXN: suggestedTreasuryMXN, asset: "CETES", apy: 9.1,
          estimatedYearlyYield: (suggestedTreasuryMXN * 0.091).toFixed(2),
        }
      : null;

    await prisma.user.update({ where: { id: userId }, data: { onboardedAt: new Date() } });

    return NextResponse.json({
      organization: org,
      agent: { id: agent.id, name: agent.name },
      policy,
      vendors: vendors.map((v) => ({ id: v.id, name: v.name, country: v.country, currency: v.currency })),
      employees: employees.map((e) => ({ id: e.id, name: e.name, role: e.role, salary: e.salary, currency: e.currency })),
      treasurySuggestion,
      onChain: credentialTxHash ? {
        credentialTxHash,
        arbiscanUrl: `https://sepolia.arbiscan.io/tx/${credentialTxHash}`,
        contract: process.env.HANDLE_REGISTRY_ADDRESS,
      } : null,
      summary: {
        vendorsCreated: vendors.length,
        employeesCreated: employees.length,
        policyTxLimit: policy.maxTransactionAmount,
        policyDailyLimit: policy.dailyLimit,
      },
    }, { status: 201 });
  } catch (err: any) {
    console.error("[Onboarding error]", err);
    return NextResponse.json({ error: err.message ?? "Onboarding failed" }, { status: 500 });
  }
}

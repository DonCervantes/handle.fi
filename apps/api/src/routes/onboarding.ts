import { Router, Response } from "express";
import { z } from "zod";
import { ethers } from "ethers";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { registerCredentialOnChain, getRegistryStats } from "../services/blockchainService";

const router = Router();

const onboardingSchema = z.object({
  // Step 1: Company
  name: z.string().min(2).max(100),
  rfc: z.string().optional(),
  industry: z.enum(["manufacturing", "tech_saas", "commerce", "services", "agency", "construction"]),
  country: z.string().default("MX"),

  // Step 2: Operation
  employeeCount: z.number().int().min(0).max(10000),
  monthlyRevenueUSD: z.number().min(0),
  hasIntlVendors: z.boolean().default(false),
  operatingCountries: z.array(z.string()).optional(),
  idleCashUSD: z.number().min(0).default(0),
  preferYield: z.boolean().default(true),
});

// ── Industry → Vendor templates ──
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

// ── Industry → Employee templates ──
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

// ── Policy generation based on company profile ──
function generatePolicy(input: z.infer<typeof onboardingSchema>) {
  // Per-tx limit: ~10% of monthly revenue, capped at $5000 USD
  const txLimit = Math.min(5000, Math.max(500, input.monthlyRevenueUSD * 0.10));

  // Daily limit: ~30% of monthly revenue
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

// ── POST /onboarding ── Setup user account from wizard data ──
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = onboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const data = parsed.data;
  const userId = req.dbUserId!;

  try {
    // 1. Upsert organization
    const org = await prisma.organization.upsert({
      where: { ownerId: userId },
      update: {
        name: data.name,
        rfc: data.rfc,
        industry: data.industry,
        country: data.country,
        employeeCount: data.employeeCount,
        monthlyRevenueUSD: data.monthlyRevenueUSD,
        hasIntlVendors: data.hasIntlVendors,
        operatingCountries: (data.operatingCountries ?? [data.country]) as any,
        idleCashUSD: data.idleCashUSD,
        preferYield: data.preferYield,
      },
      create: {
        ownerId: userId,
        name: data.name,
        rfc: data.rfc,
        industry: data.industry,
        country: data.country,
        employeeCount: data.employeeCount,
        monthlyRevenueUSD: data.monthlyRevenueUSD,
        hasIntlVendors: data.hasIntlVendors,
        operatingCountries: (data.operatingCountries ?? [data.country]) as any,
        idleCashUSD: data.idleCashUSD,
        preferYield: data.preferYield,
      },
    });

    // 2. Generate policy from profile
    const policy = generatePolicy(data);
    const policyStr = JSON.stringify(policy);
    const policyHash = ethers.keccak256(ethers.toUtf8Bytes(policyStr));
    const credentialHash = ethers.keccak256(
      ethers.toUtf8Bytes(`${userId}:${policyHash}:${Date.now()}`)
    );

    // 3. Create agent + credential + policy
    const agent = await prisma.agent.create({
      data: {
        ownerId: userId,
        name: `${data.name} TreasuryBot`,
        description: `AI agent for ${data.industry} operations`,
        credentials: {
          create: {
            credentialHash,
            policyHash,
            active: true,
            policies: { create: { policyJson: policy, policyHash } },
          },
        },
      },
      include: { credentials: { take: 1 } },
    });

    // 3.5. Register credential on-chain (HandleRegistry on Arbitrum)
    const credentialDbId = agent.credentials[0]?.id;
    let credentialTxHash: string | null = null;
    if (credentialDbId) {
      try {
        credentialTxHash = await registerCredentialOnChain(
          credentialDbId,
          credentialHash,
          policyHash
        );
        await prisma.credential.update({
          where: { id: credentialDbId },
          data: { onChainTxHash: credentialTxHash },
        });
        console.log(`[Onboarding] Credential registered on-chain: ${credentialTxHash}`);
      } catch (err) {
        console.error("[Onboarding] On-chain credential failed (non-fatal):", err);
      }
    }

    // 4. Create vendors based on industry
    const vendorTemplates = VENDOR_TEMPLATES[data.industry] ?? VENDOR_TEMPLATES.services;
    const vendors = await Promise.all(
      vendorTemplates.map((v) =>
        prisma.vendor.create({
          data: { ...v, ownerId: userId, status: "active" },
        })
      )
    );

    // 5. Create sample employees (proportional to declared count)
    const employeeTemplates = EMPLOYEE_TEMPLATES[data.industry] ?? EMPLOYEE_TEMPLATES.services;
    const numToCreate = Math.min(employeeTemplates.length, Math.max(1, Math.floor(data.employeeCount / 50)));
    const employees = await Promise.all(
      employeeTemplates.slice(0, numToCreate).map((e, i) =>
        prisma.employee.create({
          data: {
            ownerId: userId,
            name: ["Carlos Hernández", "Ana García", "Luis Méndez", "María López"][i] ?? "Empleado " + (i + 1),
            ...e,
          },
        })
      )
    );

    // 6. Treasury suggestion
    const suggestedTreasuryMXN = Math.round(Math.min(500, data.idleCashUSD * 17.5 * 0.3)); // 30% of idle cash in MXN, sandbox max 500
    const treasurySuggestion = data.preferYield && data.idleCashUSD > 0
      ? {
          amountMXN: suggestedTreasuryMXN,
          asset: "CETES",
          apy: 9.1,
          estimatedYearlyYield: (suggestedTreasuryMXN * 0.091).toFixed(2),
        }
      : null;

    // 7. Mark user as onboarded
    await prisma.user.update({
      where: { id: userId },
      data: { onboardedAt: new Date() },
    });

    res.status(201).json({
      organization: org,
      agent: { id: agent.id, name: agent.name },
      policy,
      vendors: vendors.map((v) => ({ id: v.id, name: v.name, country: v.country, currency: v.currency })),
      employees: employees.map((e) => ({ id: e.id, name: e.name, role: e.role, salary: e.salary, currency: e.currency })),
      treasurySuggestion,
      onChain: credentialTxHash
        ? {
            credentialTxHash,
            arbiscanUrl: `https://sepolia.arbiscan.io/tx/${credentialTxHash}`,
            contract: process.env.HANDLE_REGISTRY_ADDRESS,
          }
        : null,
      summary: {
        vendorsCreated: vendors.length,
        employeesCreated: employees.length,
        policyTxLimit: policy.maxTransactionAmount,
        policyDailyLimit: policy.dailyLimit,
      },
    });
  } catch (err: any) {
    console.error("[Onboarding error]", err);
    res.status(500).json({ error: err.message ?? "Onboarding failed" });
  }
});

// ── GET /onboarding/status ── Check if user already onboarded ──
router.get("/status", requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.dbUserId! },
    include: { organization: true, agents: { take: 1 } },
  });

  res.json({
    onboarded: !!user?.onboardedAt,
    organization: user?.organization ?? null,
    agentId: user?.agents[0]?.id ?? null,
  });
});

// ── GET /onboarding/registry-stats ── On-chain stats ──
router.get("/registry-stats", async (_req, res) => {
  const stats = await getRegistryStats();
  res.json(stats);
});

// ── GET /onboarding/me ── Full user context for dashboard ──
router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.dbUserId! },
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
    res.status(404).json({ error: "User not found" });
    return;
  }

  const agent = user.agents[0];
  const policy = agent?.credentials[0]?.policies[0]?.policyJson ?? null;

  res.json({
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
});

export default router;

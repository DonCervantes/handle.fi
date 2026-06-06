import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo data...");

  // Create demo user
  const user = await prisma.user.upsert({
    where: { privyId: "demo-user" },
    update: {},
    create: {
      privyId: "demo-user",
      walletAddress: "0x821B89a5928420983e7b1B9374CbC03DAa5E378E",
    },
  });
  console.log("✅ Demo user:", user.id);

  // Create TreasuryBot agent
  const agent = await prisma.agent.upsert({
    where: { id: "demo-agent-treasurybot" },
    update: {},
    create: {
      id: "demo-agent-treasurybot",
      ownerId: user.id,
      name: "TreasuryBot",
      description: "AI agent for automated treasury operations",
    },
  });
  console.log("✅ TreasuryBot agent:", agent.id);

  // Create demo policy
  const demoPolicy = {
    maxTransactionAmount: 500,
    allowedCurrencies: ["USD", "MXN", "USDC"],
    allowedActionTypes: ["PAYMENT", "TRANSFER"],
    dailyLimit: 1500,
  };

  const policyStr = JSON.stringify(demoPolicy);
  const policyHash = ethers.keccak256(ethers.toUtf8Bytes(policyStr));
  const credentialHash = ethers.keccak256(
    ethers.toUtf8Bytes(`${agent.id}:${policyHash}:demo`)
  );

  // Deactivate old credentials
  await prisma.credential.updateMany({
    where: { agentId: agent.id },
    data: { active: false },
  });

  const credential = await prisma.credential.create({
    data: {
      agentId: agent.id,
      credentialHash,
      policyHash,
      active: true,
      policies: {
        create: { policyJson: demoPolicy, policyHash },
      },
    },
  });
  console.log("✅ Credential created:", credential.id);

  // Create demo vendors (contractors in 3 countries)
  const demoVendors = [
    { name: "Shenzhen Tech Parts Co.", country: "CN", currency: "USD", paymentMethod: "USDC", email: "billing@sztech.cn" },
    { name: "Carlos Rodríguez Dev", country: "MX", currency: "MXN", paymentMethod: "SPEI", email: "carlos@freelance.mx" },
    { name: "Anna Kowalski Design", country: "PL", currency: "USD", paymentMethod: "USDC", email: "anna@design.pl" },
    { name: "Acero Industrial MX", country: "MX", currency: "MXN", paymentMethod: "SPEI", email: "pagos@acero.mx" },
    { name: "Global Logistics US", country: "US", currency: "USD", paymentMethod: "WIRE", email: "ap@globallog.us" },
  ];

  for (const v of demoVendors) {
    await prisma.vendor.upsert({
      where: { id: `demo-vendor-${v.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: { id: `demo-vendor-${v.name.toLowerCase().replace(/\s+/g, "-")}`, ownerId: user.id, ...v },
    });
  }
  console.log(`✅ ${demoVendors.length} demo vendors created`);

  // Create demo treasury position
  await prisma.treasuryPosition.upsert({
    where: { id: "demo-treasury-cetes" },
    update: {},
    create: {
      id: "demo-treasury-cetes",
      ownerId: user.id,
      asset: "CETES",
      amountInvested: 200000,
      currentValue: 201520,
      apy: 9.1,
      bondType: "CETES_MXN",
      redemptionEligibleAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
  });
  console.log("✅ Demo treasury position created");

  console.log("\n🎉 Demo seed complete!");
  console.log("=".repeat(50));
  console.log("Add this to apps/web/.env.local:");
  console.log(`NEXT_PUBLIC_DEMO_AGENT_ID=${agent.id}`);
  console.log("=".repeat(50));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

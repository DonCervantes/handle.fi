// Bootstrap script: creates a fully-onboarded EtherFuse customer for the Handle.Fi demo
// Run: npx ts-node scripts/setup-etherfuse-demo.ts
//
// What it does:
// 1. Generate new customerId + bankAccountId UUIDs
// 2. Generate presigned onboarding URL (creates the customer record)
// 3. Submit KYC identity via POST /ramp/customer/{id}/kyc
// 4. Create bank account programmatically via POST /ramp/customer/{id}/bank-account
// 5. Print the IDs to copy into .env

import crypto from "crypto";
import "dotenv/config";

const BASE_URL = process.env.ETHERFUSE_API_URL ?? "https://api.sand.etherfuse.com";
const API_KEY = process.env.ETHERFUSE_API_KEY ?? "";
// Fresh EVM wallet dedicated for EtherFuse (not the audit deployer)
const WALLET = process.env.ETHERFUSE_WALLET ?? "0xe59A7F138c6A86225D54430BA1Ab0d637A01E9B6";

async function ef(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { Authorization: API_KEY, "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

async function main() {
  // Force fresh customer (use --fresh flag)
  const forceFresh = process.argv.includes("--fresh");
  const customerId = forceFresh ? crypto.randomUUID() : (process.env.ETHERFUSE_DEMO_CUSTOMER_ID || crypto.randomUUID());
  const bankAccountId = forceFresh ? crypto.randomUUID() : (process.env.ETHERFUSE_DEMO_BANK_ACCOUNT_ID || crypto.randomUUID());

  if (forceFresh) console.log("🆕 Creating FRESH customer\n");

  console.log("🔧 Setting up EtherFuse demo customer on Base (EVM)...\n");
  console.log("customerId    :", customerId);
  console.log("bankAccountId :", bankAccountId);
  console.log("wallet (EVM)  :", WALLET);
  console.log("");

  // Step 1: Generate onboarding URL (creates the customer record if new)
  console.log("Step 1: Generate onboarding URL...");
  let presignedUrl = "";
  try {
    const onboarding = await ef("/ramp/onboarding-url", {
      method: "POST",
      body: JSON.stringify({
        customerId,
        bankAccountId,
        publicKey: WALLET,
        blockchain: "base",
        userInfo: { email: "treasurybot@handle.fi", displayName: "Handle.Fi TreasuryBot" },
      }),
    });
    presignedUrl = onboarding.presigned_url;
    console.log("✅ Customer registered\n");
  } catch (err: any) {
    if (err.message.includes("409")) {
      console.log("ℹ️  Customer already exists, requesting renewed URL...\n");
      // Re-request URL for existing customer
      const renewed = await ef("/ramp/onboarding-url", {
        method: "POST",
        body: JSON.stringify({
          customerId,
          bankAccountId,
          publicKey: WALLET,
          blockchain: "base",
          renewed: true,
          userInfo: { email: "treasurybot@handle.fi", displayName: "Handle.Fi TreasuryBot" },
        }),
      });
      presignedUrl = renewed.presigned_url;
    } else {
      throw err;
    }
  }

  // Step 1.5: Accept all 3 agreements
  console.log("Step 1.5: Accept agreements (terms, customer, e-sign)...");
  const customerInfo = {
    firstName: "Carlos",
    lastName: "Hernández",
    email: "treasurybot@handle.fi",
    phoneNumber: "+525555551234",
  };

  const agreementCalls = [
    { path: "/ramp/agreements/terms-and-conditions", body: { presignedUrl } },
    { path: "/ramp/agreements/customer-agreement", body: { presignedUrl, customerInfo } },
    { path: "/ramp/agreements/electronic-signature-consent", body: { presignedUrl, customerInfo } },
  ];
  for (const call of agreementCalls) {
    try {
      await ef(call.path, { method: "POST", body: JSON.stringify(call.body) });
      console.log(`  ✅ ${call.path.split("/").pop()}`);
    } catch (err: any) {
      console.log(`  ⚠️  ${call.path.split("/").pop()}: ${err.message.slice(0, 100)}`);
    }
  }
  console.log("");

  // Step 2: Submit KYC identity programmatically
  console.log("Step 2: Submit KYC identity...");
  const kycPayload = {
    id: crypto.randomUUID(),
    pubkey: WALLET,
    identity: {
      id: crypto.randomUUID(),
      name: { id: crypto.randomUUID(), givenName: "Carlos", familyName: "Hernández" },
      dateOfBirth: "1990-01-01",
      address: {
        id: crypto.randomUUID(),
        street: "Av. Reforma 123",
        city: "Ciudad de México",
        region: "CDMX",
        postalCode: "06600",
        country: "MX",
      },
      idNumbers: [{ id: crypto.randomUUID(), value: "XEXX010101000", type: "RFC" }],
    },
  };
  try {
    await ef(`/ramp/customer/${customerId}/kyc`, {
      method: "POST",
      body: JSON.stringify(kycPayload),
    });
    console.log("✅ KYC approved (sandbox)\n");
  } catch (err: any) {
    console.log("⚠️  KYC step:", err.message.slice(0, 200));
    console.log("Continuing — customer may already have KYC...\n");
  }

  // Step 3: Create bank account
  console.log("Step 3: Create bank account...");
  await ef(`/ramp/customer/${customerId}/bank-account`, {
    method: "POST",
    body: JSON.stringify({
      bankAccountId,
      account: {
        transactionId: crypto.randomUUID(),
        firstName: "Carlos",
        paternalLastName: "Hernández",
        maternalLastName: "Méndez",
        birthDate: "19900101",
        birthCountryIsoCode: "MX",
        curp: "HEMC900101HDFRRN09",
        rfc: "XEXX010101000", // Sandbox shortcut
        clabe: "012180001234567890",
      },
      label: "Handle.Fi Demo CLABE",
    }),
  });
  console.log("✅ Bank account verified (sandbox)\n");

  // Step 4: Test a quote to confirm it works
  console.log("Step 4: Test quote (500 MXN → CETES on Base)...");
  const quoteId = crypto.randomUUID();
  const quote = await ef("/ramp/quote", {
    method: "POST",
    body: JSON.stringify({
      quoteId,
      customerId,
      blockchain: "base",
      sourceAmount: "500",
      quoteAssets: {
        type: "onramp",
        sourceAsset: "MXN",
        targetAsset: "0xcC77c598d42f2f78Beb42C91d12B9d4041a5cE29",
      },
    }),
  });
  console.log("✅ Quote works! Exchange rate:", quote.exchangeRate);
  console.log("   500 MXN →", quote.destinationAmount, "CETES\n");

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("📋 Copy these to apps/api/.env:");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`ETHERFUSE_DEMO_CUSTOMER_ID=${customerId}`);
  console.log(`ETHERFUSE_DEMO_BANK_ACCOUNT_ID=${bankAccountId}`);
  console.log(`ETHERFUSE_DEMO_WALLET=${WALLET}`);
  console.log("═══════════════════════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("❌ Setup failed:", err.message);
  process.exit(1);
});

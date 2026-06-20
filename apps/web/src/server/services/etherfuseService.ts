import crypto from "crypto";

// ── EtherFuse Ramp API Integration ─────────────────────────
// Sandbox base: https://api.sand.etherfuse.com
// Auth: Authorization: <api_key>  (no Bearer prefix)
// Docs: docs.etherfuse.com

const BASE_URL = process.env.ETHERFUSE_API_URL ?? "https://api.sand.etherfuse.com";
const API_KEY  = process.env.ETHERFUSE_API_KEY ?? "";

// Multi-chain support for EtherFuse
export type Blockchain = "base" | "stellar" | "solana";

export const CHAIN_CONFIG: Record<Blockchain, {
  cetesIdentifier: string;
  customerId: string;
  bankAccountId: string;
  wallet: string;
  label: string;
  explorer: string;
}> = {
  base: {
    cetesIdentifier: "0xcC77c598d42f2f78Beb42C91d12B9d4041a5cE29",
    customerId: process.env.ETHERFUSE_DEMO_CUSTOMER_ID ?? "",
    bankAccountId: process.env.ETHERFUSE_DEMO_BANK_ACCOUNT_ID ?? "",
    wallet: process.env.ETHERFUSE_DEMO_WALLET ?? "",
    label: "Base (EVM)",
    explorer: "https://sepolia.basescan.org",
  },
  stellar: {
    cetesIdentifier: "CETES:GC3CW7EDYRTWQ635VDIGY6S4ZUF5L6TQ7AA4MWS7LEQDBLUSZXV7UPS4",
    customerId: process.env.ETHERFUSE_STELLAR_CUSTOMER_ID ?? "81d4aa26-bcf8-419a-b573-f5b401315c97",
    bankAccountId: process.env.ETHERFUSE_STELLAR_BANK_ACCOUNT_ID ?? "6885bacd-07b4-44e1-b954-fb6765f4d09f",
    wallet: process.env.ETHERFUSE_STELLAR_WALLET ?? "GCVVJDPEBCJLRBKDXETMSK7U4NWSP7FILJ55XRJXN2TY53VX5HC5HISE",
    label: "Stellar",
    explorer: "https://stellar.expert/explorer/testnet",
  },
  solana: {
    cetesIdentifier: "AvvetPGuuB5FD5m86fpw3LtDKyQoUFT1mG9WarNQLW4q",
    customerId: process.env.ETHERFUSE_SOLANA_CUSTOMER_ID ?? "",
    bankAccountId: process.env.ETHERFUSE_SOLANA_BANK_ACCOUNT_ID ?? "",
    wallet: process.env.ETHERFUSE_SOLANA_WALLET ?? "",
    label: "Solana",
    explorer: "https://explorer.solana.com",
  },
};

// Default for backwards compat
const DEFAULT_BLOCKCHAIN: Blockchain = "stellar";
const SANDBOX_MAX_MXN = 500;

function headers() {
  return { "Authorization": API_KEY, "Content-Type": "application/json" };
}

async function ef<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers: headers() });
  const text = await res.text();
  if (!res.ok) throw new Error(`EtherFuse ${res.status}: ${text}`);
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

// ── Types ──────────────────────────────────────────────────

export interface EfAsset {
  symbol: string;
  identifier: string;
  name: string;
  currency: string;
  balance: string | null;
}

export interface EfQuote {
  quoteId: string;
  type: "onramp" | "offramp";
  exchangeRate: number;
  feeBps: number;
  feeAmount: number;
  sourceAmount: number;
  destinationAmount: number;
  expiresAt: string;
}

export interface EfOrder {
  orderId: string;
  status: "created" | "funded" | "completed" | "finalized" | "failed";
  type: "onramp" | "offramp";
  depositClabe?: string;   // for onramp — customer deposits MXN here
  statusPage?: string;     // URL to track progress
  burnTransaction?: string; // for offramp — unsigned tx to sign
  sourceAmount: number;
  destinationAmount: number;
  createdAt: string;
}

export interface EfCustomer {
  customerId: string;
  onboardingUrl: string;  // presigned URL for KYC
}

// ── 1. Get available assets ────────────────────────────────

export async function getAssets(
  blockchain: Blockchain = DEFAULT_BLOCKCHAIN,
  wallet?: string
): Promise<EfAsset[]> {
  const w = wallet ?? CHAIN_CONFIG[blockchain].wallet;
  const res = await ef<{ assets: EfAsset[] } | EfAsset[]>(
    `/ramp/assets?blockchain=${blockchain}&currency=MXN&wallet=${w}`
  );
  return Array.isArray(res) ? res : res.assets;
}

// ── 2. Onboard customer (KYC) ─────────────────────────────

export async function createCustomer(
  customerId: string,
  bankAccountId: string
): Promise<EfCustomer> {
  const res = await ef<{ onboardingUrl: string }>("/ramp/customer", {
    method: "POST",
    body: JSON.stringify({ customerId, bankAccountId }),
  });
  return { customerId, onboardingUrl: res.onboardingUrl };
}

// ── 3. Create quote ───────────────────────────────────────

export async function createQuote(
  type: "onramp" | "offramp",
  sourceAmount: number,
  customerId: string,
  walletAddress: string,
  blockchain: Blockchain = DEFAULT_BLOCKCHAIN
): Promise<EfQuote> {
  const quoteId = crypto.randomUUID();
  const cetesId = CHAIN_CONFIG[blockchain].cetesIdentifier;

  const body = {
    quoteId,
    customerId,
    blockchain,
    sourceAmount: sourceAmount.toString(),
    quoteAssets: {
      type,
      sourceAsset: type === "onramp" ? "MXN" : cetesId,
      targetAsset: type === "onramp" ? cetesId : "MXN",
    },
  };

  const result = await ef<any>("/ramp/quote", { method: "POST", body: JSON.stringify(body) });
  return { ...result, quoteId } as EfQuote;
}

// ── 4. Create order ───────────────────────────────────────

export async function createOrder(
  quoteId: string,
  bankAccountId: string,
  walletAddress: string,
  type: "onramp" | "offramp" = "onramp"
): Promise<EfOrder> {
  const orderId = crypto.randomUUID();
  const raw = await ef<any>("/ramp/order", {
    method: "POST",
    body: JSON.stringify({ orderId, quoteId, bankAccountId, publicKey: walletAddress }),
  });

  // EtherFuse returns response nested under "onramp" or "offramp"
  const nested = raw[type] ?? raw;
  return {
    orderId: nested.orderId ?? orderId,
    status: nested.status ?? "created",
    type,
    depositClabe: nested.depositClabe,
    statusPage: nested.statusPage,
    burnTransaction: nested.burnTransaction,
    sourceAmount: parseFloat(nested.depositAmount ?? "0"),
    destinationAmount: parseFloat(nested.destinationAmount ?? "0"),
    createdAt: nested.createdAt ?? new Date().toISOString(),
  };
}

// ── 5. Simulate fiat received (sandbox only) ───────────────

export async function simulateFiatReceived(orderId: string): Promise<void> {
  await ef(`/ramp/order/fiat_received`, {
    method: "POST",
    body: JSON.stringify({ orderId }),
  });
}

// ── 6. Get order status ────────────────────────────────────

export async function getOrder(orderId: string): Promise<EfOrder> {
  return ef<EfOrder>(`/ramp/order/${orderId}`);
}

// ── 7. Register webhook ───────────────────────────────────

export async function registerWebhook(url: string): Promise<void> {
  await ef("/ramp/webhook", {
    method: "POST",
    body: JSON.stringify({ url, events: ["order_updated"] }),
  });
}

// ── High-level flows ──────────────────────────────────────

/**
 * Full onramp flow: MXN → CETES
 * Returns the order with depositClabe for the customer to fund
 */
export async function onrampMXNtoCETES(
  amountMXN: number,
  customerId: string,
  bankAccountId: string,
  walletAddress: string,
  simulateSandbox = true,
  blockchain: Blockchain = DEFAULT_BLOCKCHAIN
): Promise<{ quote: EfQuote; order: EfOrder; blockchain: Blockchain }> {
  const quote = await createQuote("onramp", amountMXN, customerId, walletAddress, blockchain);
  const order = await createOrder(quote.quoteId, bankAccountId, walletAddress, "onramp");

  // In sandbox: auto-simulate fiat deposit so we see the full flow
  if (simulateSandbox && process.env.ETHERFUSE_API_URL?.includes("sand")) {
    try {
      await simulateFiatReceived(order.orderId);
      console.log(`[EtherFuse] Simulated fiat received for order ${order.orderId}`);
    } catch (err) {
      console.error("[EtherFuse] Simulate fiat failed (non-fatal):", err);
    }
  }

  return { quote, order, blockchain };
}

/**
 * Full offramp flow: CETES → MXN
 * Returns the order + unsigned burn transaction
 */
export async function offrampCETEStoMXN(
  amountCETES: number,
  customerId: string,
  bankAccountId: string,
  walletAddress: string,
  blockchain: Blockchain = DEFAULT_BLOCKCHAIN
): Promise<{ quote: EfQuote; order: EfOrder; blockchain: Blockchain }> {
  const quote = await createQuote("offramp", amountCETES, customerId, walletAddress, blockchain);
  const order = await createOrder(quote.quoteId, bankAccountId, walletAddress, "offramp");
  return { quote, order, blockchain };
}

// ── Legacy compat ─────────────────────────────────────────

export async function getTreasuryBalance(_agentId: string): Promise<number> {
  return 10000; // Would need real wallet balance query
}

export async function checkLiquidity(amount: number): Promise<boolean> {
  const balance = await getTreasuryBalance("mock");
  return balance >= amount;
}

export async function mintBond(
  amount: number,
  bondType: "CETES" | "USTRY"
): Promise<{ txId: string; isReal: boolean; apy: number }> {
  const apy = bondType === "CETES" ? 9.1 : 4.8;
  await new Promise((r) => setTimeout(r, 200));
  return { txId: `EF-MOCK-${bondType}-${Date.now()}`, isReal: false, apy };
}

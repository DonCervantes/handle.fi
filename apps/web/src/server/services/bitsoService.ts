import crypto from "crypto";

export interface BitsoPaymentResult {
  transactionId: string;
  status: "completed" | "pending" | "failed";
  amount: number;
  currency: string;
  method: string;
  simulatedAt: string;
  isReal: boolean;
}

// ── Bitso Business API ──────────────────────────────────────
// Docs: https://developers.bitso.com/bitso-business/docs
// Sandbox: https://sandbox.bitso.com

function buildBitsoSignature(
  nonce: string,
  method: string,
  path: string,
  body: string,
  secret: string
): string {
  const message = `${nonce}${method}${path}${body}`;
  return crypto.createHmac("sha256", secret).update(message).digest("hex");
}

async function realBitsoPayment(
  amount: number,
  currency: string,
  recipient: string
): Promise<BitsoPaymentResult> {
  const apiKey = process.env.BITSO_API_KEY!;
  const apiSecret = process.env.BITSO_API_SECRET!;
  const baseUrl = process.env.BITSO_API_URL ?? "https://sandbox.bitso.com";

  const nonce = Date.now().toString();
  const path = "/api/v3/business/transfers/";
  const body = JSON.stringify({
    amount: amount.toFixed(2),
    currency: currency.toLowerCase(),
    beneficiary: recipient,
    payment_method: currency === "MXN" ? "spei" : "crypto",
    notes_ref: `handle-fi-${Date.now()}`,
  });

  const signature = buildBitsoSignature(nonce, "POST", path, body, apiSecret);
  const authHeader = `Bitso ${apiKey}:${nonce}:${signature}`;

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Bitso API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return {
    transactionId: data.payload?.wid ?? `BITSO-REAL-${Date.now()}`,
    status: data.payload?.status === "complete" ? "completed" : "pending",
    amount,
    currency,
    method: currency === "MXN" ? "SPEI" : "USDC/Crypto",
    simulatedAt: new Date().toISOString(),
    isReal: true,
  };
}

function mockBitsoPayment(
  amount: number,
  currency: string,
  _recipient: string
): BitsoPaymentResult {
  return {
    transactionId: `BITSO-MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    status: "completed",
    amount,
    currency,
    method: currency === "MXN" ? "SPEI" : "USDC",
    simulatedAt: new Date().toISOString(),
    isReal: false,
  };
}

// ── Public function — uses real API if credentials present, else mock ──
export async function simulatePayment(
  amount: number,
  currency: string,
  recipient: string
): Promise<BitsoPaymentResult> {
  const hasCredentials = !!(process.env.BITSO_API_KEY && process.env.BITSO_API_SECRET);

  if (hasCredentials) {
    try {
      const result = await realBitsoPayment(amount, currency, recipient);
      console.log(`[Bitso] Real payment sent: ${result.transactionId}`);
      return result;
    } catch (err) {
      console.error("[Bitso] Real API failed, falling back to mock:", err);
    }
  }

  // Simulate 300ms network latency
  await new Promise((r) => setTimeout(r, 300));
  return mockBitsoPayment(amount, currency, recipient);
}

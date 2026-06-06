import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { getAuthContext } from "@/server/auth";
import { onrampMXNtoCETES } from "@/server/services/etherfuseService";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  amountMXN: z.number().positive(),
  walletAddress: z.string().default(""),
  customerId: z.string().default(""),
  bankAccountId: z.string().default(""),
});

export async function POST(req: NextRequest) {
  const auth = await getAuthContext(req, { allowDemo: true });
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const amountMXN = parsed.data.amountMXN;
  const walletAddress = parsed.data.walletAddress || process.env.ETHERFUSE_DEMO_WALLET || "";
  const customerId = parsed.data.customerId || process.env.ETHERFUSE_DEMO_CUSTOMER_ID || "";
  const bankAccountId = parsed.data.bankAccountId || process.env.ETHERFUSE_DEMO_BANK_ACCOUNT_ID || "";

  try {
    const { quote, order } = await onrampMXNtoCETES(amountMXN, customerId, bankAccountId, walletAddress, true);
    const destAmount = typeof quote.destinationAmount === "string" ? parseFloat(quote.destinationAmount) : quote.destinationAmount;

    const position = await prisma.treasuryPosition.create({
      data: {
        ownerId: auth.dbUserId, asset: "CETES",
        amountInvested: amountMXN, currentValue: destAmount, apy: 9.1,
        bondType: "CETES_MXN",
        redemptionEligibleAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      position,
      etherfuse: {
        orderId: order.orderId,
        status: order.status,
        depositClabe: order.depositClabe,
        statusPage: order.statusPage,
        exchangeRate: parseFloat(quote.exchangeRate as any),
        feeBps: parseInt(quote.feeBps as any),
        sourceMXN: amountMXN,
        destinationCETES: destAmount,
        isReal: true,
      },
      message: `✅ ${amountMXN.toLocaleString()} MXN → ${destAmount.toFixed(4)} CETES | APY: 9.1%`,
    }, { status: 201 });
  } catch (err: any) {
    console.error("[Treasury onramp]", err);
    return NextResponse.json({ error: `Onramp failed: ${err.message}` }, { status: 502 });
  }
}

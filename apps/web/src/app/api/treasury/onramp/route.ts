import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { getAuthContext } from "@/server/auth";
import { onrampMXNtoCETES, CHAIN_CONFIG, type Blockchain } from "@/server/services/etherfuseService";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  amountMXN: z.number().positive(),
  blockchain: z.enum(["base", "stellar", "solana"]).default("stellar"),
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

  const { amountMXN, blockchain } = parsed.data as { amountMXN: number; blockchain: Blockchain };
  const config = CHAIN_CONFIG[blockchain];

  if (!config.customerId || !config.bankAccountId) {
    return NextResponse.json({
      error: `${config.label} no está configurado. Solo Stellar y Base están disponibles.`,
    }, { status: 400 });
  }

  try {
    const { quote, order } = await onrampMXNtoCETES(
      amountMXN, config.customerId, config.bankAccountId, config.wallet, true, blockchain
    );
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
        blockchain,
        blockchainLabel: config.label,
        cetesIdentifier: config.cetesIdentifier,
        wallet: config.wallet,
        explorerUrl: config.explorer,
        isReal: true,
      },
      message: `✅ ${amountMXN.toLocaleString()} MXN → ${destAmount.toFixed(4)} CETES en ${config.label} | APY: 9.1%`,
    }, { status: 201 });
  } catch (err: any) {
    console.error("[Treasury onramp]", err);
    return NextResponse.json({ error: `Onramp failed: ${err.message}` }, { status: 502 });
  }
}

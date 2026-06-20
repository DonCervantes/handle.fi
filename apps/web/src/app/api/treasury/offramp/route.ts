import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { getAuthContext } from "@/server/auth";
import { offrampCETEStoMXN, CHAIN_CONFIG, type Blockchain } from "@/server/services/etherfuseService";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  positionId: z.string().optional(),
  amountCETES: z.number().positive(),
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

  const { positionId, amountCETES, blockchain } = parsed.data as { positionId?: string; amountCETES: number; blockchain: Blockchain };
  const config = CHAIN_CONFIG[blockchain];

  if (!config.customerId || !config.bankAccountId) {
    return NextResponse.json({ error: `${config.label} no está configurado.` }, { status: 400 });
  }

  try {
    const { quote, order } = await offrampCETEStoMXN(
      amountCETES, config.customerId, config.bankAccountId, config.wallet, blockchain
    );

    if (positionId) {
      const position = await prisma.treasuryPosition.findFirst({
        where: { id: positionId, ownerId: auth.dbUserId },
      });
      if (position) {
        const daysHeld = (Date.now() - position.openedAt.getTime()) / (1000 * 60 * 60 * 24);
        const yieldEarned = (position.amountInvested * position.apy) / 100 / 365 * daysHeld;
        await prisma.treasuryPosition.update({
          where: { id: positionId },
          data: { status: "redeemed", currentValue: position.amountInvested + yieldEarned },
        });
      }
    }

    const destMXN = typeof quote.destinationAmount === "string" ? parseFloat(quote.destinationAmount) : quote.destinationAmount;
    return NextResponse.json({
      etherfuse: {
        orderId: order.orderId,
        status: order.status,
        statusPage: order.statusPage,
        burnTransaction: order.burnTransaction,
        exchangeRate: parseFloat(quote.exchangeRate as any),
        sourceCETES: amountCETES,
        destinationMXN: destMXN,
        blockchain,
        blockchainLabel: config.label,
        isReal: true,
      },
      message: `✅ ${amountCETES} CETES → ${destMXN.toFixed(2)} MXN desde ${config.label} | Pago procesado`,
    });
  } catch (err: any) {
    console.error("[Treasury offramp]", err);
    return NextResponse.json({ error: `Offramp failed: ${err.message}` }, { status: 502 });
  }
}

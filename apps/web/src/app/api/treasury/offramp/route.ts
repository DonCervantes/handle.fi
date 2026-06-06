import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { getAuthContext } from "@/server/auth";
import { offrampCETEStoMXN } from "@/server/services/etherfuseService";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  positionId: z.string().optional(),
  amountCETES: z.number().positive(),
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

  const { positionId, amountCETES } = parsed.data;
  const walletAddress = parsed.data.walletAddress || process.env.ETHERFUSE_DEMO_WALLET || "";
  const customerId = parsed.data.customerId || process.env.ETHERFUSE_DEMO_CUSTOMER_ID || "";
  const bankAccountId = parsed.data.bankAccountId || process.env.ETHERFUSE_DEMO_BANK_ACCOUNT_ID || "";

  try {
    const { quote, order } = await offrampCETEStoMXN(amountCETES, customerId, bankAccountId, walletAddress);

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

    return NextResponse.json({
      etherfuse: {
        orderId: order.orderId,
        status: order.status,
        statusPage: order.statusPage,
        burnTransaction: order.burnTransaction,
        exchangeRate: parseFloat(quote.exchangeRate as any),
        sourceCETES: amountCETES,
        destinationMXN: typeof quote.destinationAmount === "string" ? parseFloat(quote.destinationAmount) : quote.destinationAmount,
        isReal: true,
      },
      message: `✅ ${amountCETES} CETES → ${(typeof quote.destinationAmount === "string" ? parseFloat(quote.destinationAmount) : quote.destinationAmount).toFixed(2)} MXN | Pago procesado`,
    });
  } catch (err: any) {
    console.error("[Treasury offramp]", err);
    return NextResponse.json({ error: `Offramp failed: ${err.message}` }, { status: 502 });
  }
}

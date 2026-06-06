import { openai, AI_MODEL } from "../openai";

export interface ParsedIntent {
  actionType: "PAYMENT" | "SWAP" | "TRANSFER" | "TREASURY_DEPOSIT" | "UNKNOWN";
  amount?: number;
  currency?: string;
  recipient?: string;
  memo?: string;
  confidence: number;
}

export async function parseIntent(naturalLanguage: string): Promise<ParsedIntent> {
  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a financial intent classifier. Extract structured data from natural language financial instructions.
Return a JSON object with exactly these fields:
- actionType: one of "PAYMENT" | "SWAP" | "TRANSFER" | "TREASURY_DEPOSIT" | "UNKNOWN"
- amount: number (if mentioned, e.g. 300 for "$300")
- currency: string (e.g. "USD", "MXN", "USDC") — default to "USD" if not specified
- recipient: string (if mentioned, otherwise null)
- memo: string (short description of the action)
- confidence: number between 0 and 1

IMPORTANT: You only classify intent. You never approve or execute anything.`,
      },
      { role: "user", content: naturalLanguage },
    ],
  });

  const raw = JSON.parse(response.choices[0].message.content!);
  return raw as ParsedIntent;
}

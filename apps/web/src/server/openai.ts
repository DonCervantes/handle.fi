import OpenAI from "openai";

// Switch between Groq (free, fast) and OpenAI based on env
function getProvider() {
  return process.env.AI_PROVIDER === "groq" && !!process.env.GROQ_API_KEY;
}

let _openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (_openai) return _openai;

  const useGroq = getProvider();
  _openai = useGroq
    ? new OpenAI({
        apiKey: process.env.GROQ_API_KEY!,
        baseURL: "https://api.groq.com/openai/v1",
      })
    : new OpenAI({
        apiKey: process.env.OPENAI_API_KEY ?? "no-key",
      });
  return _openai;
}

// Use as `openai` for compatibility — proxy that lazy-inits
export const openai = new Proxy({} as OpenAI, {
  get(_, prop: keyof OpenAI) {
    return getOpenAI()[prop];
  },
});

export const AI_MODEL = getProvider() ? "llama-3.3-70b-versatile" : "gpt-4o-mini";

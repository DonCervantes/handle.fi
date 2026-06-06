import OpenAI from "openai";

// Switch between Groq (free, fast) and OpenAI based on env
const useGroq = process.env.AI_PROVIDER === "groq" && !!process.env.GROQ_API_KEY;

export const openai = useGroq
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY!,
      baseURL: "https://api.groq.com/openai/v1",
    })
  : new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

// Model selection per provider
export const AI_MODEL = useGroq
  ? "llama-3.3-70b-versatile"  // Groq's best general model, free
  : "gpt-4o-mini";              // OpenAI fallback

console.log(`[AI] Provider: ${useGroq ? "Groq" : "OpenAI"} | Model: ${AI_MODEL}`);

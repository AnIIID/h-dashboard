import { NextResponse } from "next/server";

const config = {
  modelRouting: [
    {
      component: "Embeddings",
      provider: "Requesty (openrouter)",
      model: "openai/text-embedding-3-small",
    },
    {
      component: "Dialectic minimal",
      provider: "Requesty (custom)",
      model: "google/gemini-2.5-flash-lite",
    },
    {
      component: "Dialectic low",
      provider: "Requesty (custom)",
      model: "google/gemini-2.5-flash-lite",
    },
    {
      component: "Dialectic medium",
      provider: "Requesty (custom)",
      model: "anthropic/claude-haiku-4-5",
    },
    {
      component: "Dialectic high",
      provider: "Requesty (custom)",
      model: "anthropic/claude-haiku-4-5",
    },
    {
      component: "Dialectic max",
      provider: "Requesty (custom)",
      model: "anthropic/claude-haiku-4-5",
    },
    {
      component: "Deriver",
      provider: "Requesty (custom)",
      model: "google/gemini-2.5-flash-lite",
    },
    {
      component: "Summary",
      provider: "Requesty (custom)",
      model: "google/gemini-2.5-flash",
    },
    {
      component: "Dream",
      provider: "Anthropic (nativ)",
      model: "claude-sonnet-4-20250514",
    },
  ],
  systemInfo: {
    workspace: "default",
    embeddingDimensions: 1536,
    vectorStore: "pgvector",
  },
};

export async function GET() {
  return NextResponse.json(config);
}

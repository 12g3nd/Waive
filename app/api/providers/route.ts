import { NextResponse } from "next/server";
import { readLlmConfig, ollamaAvailable } from "@/lib/llm";
import { engineLabel } from "@/lib/llm/model-label";
import type { ProviderOption } from "@/lib/api-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Which AI engines the person can pick from, with the real model name and what each
 * is good for. `available` reflects whether it's actually configured/reachable, so
 * the picker only offers ones that will work.
 */
export async function GET() {
  const cfg = readLlmConfig();
  const ollamaUp = !cfg.forceOffline && (await ollamaAvailable(cfg));
  const providers: ProviderOption[] = [
    {
      id: "anthropic",
      label: engineLabel("anthropic", { modelDraft: cfg.anthropicModel }),
      description: "Most accurate reading — best for photos, messy scans, and PDFs.",
      available: !cfg.forceOffline && !!cfg.anthropicApiKey,
    },
    {
      id: "ollama",
      label: engineLabel("ollama", { baseUrl: cfg.baseUrl, modelDraft: cfg.modelDraft }),
      description: "Faster and private — runs on your own Ollama, no per-use cost.",
      available: ollamaUp,
    },
  ];
  return NextResponse.json({ providers, default: cfg.provider });
}

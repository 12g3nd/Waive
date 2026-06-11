import { NextResponse } from "next/server";
import { readLlmConfig, localOllamaConfig, ollamaAvailable } from "@/lib/llm";
import { engineLabel } from "@/lib/llm/model-label";
import type { ProviderOption } from "@/lib/api-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Which AI engines the person can pick from, in display order:
 *   1. Ollama (Waive API) — the private default, hosted by Waive.
 *   2. Claude            — fastest/most accurate, via the Anthropic API.
 *   3. Ollama (Local)    — the person's own machine, for the privacy-conscious.
 * All are free to use (Waive supplies the keys/servers). `available` reflects whether
 * each is actually configured/reachable right now, so the picker can disable the rest.
 */
export async function GET() {
  const cfg = readLlmConfig();
  // A forced-offline deploy (LLM_OFFLINE=1) has no selectable engine — return none so
  // the picker hides entirely. Otherwise always offer the three choices (even when
  // none is reachable yet), so people can read the privacy notice / set-up guide and
  // see how to enable an engine. Each `available` flag just dims the unusable ones.
  if (cfg.forceOffline) {
    return NextResponse.json({ providers: [], default: cfg.provider });
  }
  // Probe the Waive-hosted server and the person's own machine independently.
  const [waiveUp, localUp] = await Promise.all([
    ollamaAvailable(cfg),
    ollamaAvailable(localOllamaConfig(cfg)),
  ]);

  const providers: ProviderOption[] = [
    {
      id: "ollama",
      label: "Ollama (Waive API)",
      description:
        "Runs through Waive's own Ollama server — nothing you send is stored or collected. Slower, but private.",
      available: waiveUp,
      link: { label: "Privacy notice", href: "/privacy" },
      unavailableHint: "Waive's server isn't reachable right now.",
    },
    {
      id: "anthropic",
      label: engineLabel("anthropic", { modelDraft: cfg.anthropicModel }),
      description:
        "Uses the Anthropic API — faster and more accurate, but your notice is read by a third-party service.",
      available: !!cfg.anthropicApiKey,
      unavailableHint: "Not configured for this deployment.",
    },
    {
      id: "ollama-local",
      label: "Ollama (Local)",
      description:
        "Runs entirely on your own computer if it detects Ollama — for the privacy-conscious and technical. Nothing ever leaves your machine.",
      available: localUp,
      link: { label: "Set-up guide", href: "/ollama-setup" },
      unavailableHint: "No Ollama detected on your system — see the set-up guide.",
    },
  ];
  return NextResponse.json({ providers, default: cfg.provider });
}

/**
 * LLM configuration. Three providers are offered (all free to the user — Waive
 * supplies the keys/servers):
 *  - "ollama"       — the Waive Ollama API: an Ollama server Waive hosts, reached via
 *                     `baseUrl` (+ `apiKey`). Private — nothing is stored or collected.
 *                     This is the DEFAULT.
 *  - "anthropic"    — Claude via the Anthropic API. Faster and more accurate, but runs
 *                     through a third-party service.
 *  - "ollama-local" — the person's OWN Ollama on this machine (`localhost:11434`). For
 *                     the privacy-conscious and technical; only works if it's detected.
 * Force one explicitly with LLM_PROVIDER.
 */
export type LlmProvider = "ollama" | "anthropic" | "ollama-local";

/** The person's own Ollama runs here by definition — not configurable. */
export const LOCAL_OLLAMA_BASE_URL = "http://localhost:11434";

export interface LlmConfig {
  provider: LlmProvider;
  baseUrl: string;
  apiKey: string; // empty for local Ollama; required by Ollama Cloud
  modelExtract: string; // vision/multimodal model
  modelDraft: string; // text model for explanation/translation/drafting
  timeoutMs: number;
  forceOffline: boolean;
  /** Anthropic API key; when present (and not forced offline) Claude is the default. */
  anthropicApiKey?: string;
  /** Claude model id used for read + explain + draft. */
  anthropicModel: string;
}

function bool(v: string | undefined): boolean {
  return v === "1" || v?.toLowerCase() === "true";
}

export function readLlmConfig(
  env: Record<string, string | undefined> = process.env,
): LlmConfig {
  const timeout = Number(env.LLM_TIMEOUT_MS);
  const anthropicApiKey = env.ANTHROPIC_API_KEY || undefined;
  // The Waive Ollama API is the default; the picker still offers Claude and local
  // Ollama when available. Override the default explicitly with LLM_PROVIDER.
  const provider: LlmProvider =
    env.LLM_PROVIDER === "anthropic" ||
    env.LLM_PROVIDER === "ollama" ||
    env.LLM_PROVIDER === "ollama-local"
      ? env.LLM_PROVIDER
      : "ollama";
  return {
    provider,
    baseUrl: (env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/+$/, ""),
    apiKey: env.OLLAMA_API_KEY || "",
    modelExtract: env.MODEL_EXTRACT || "llama3.2-vision",
    modelDraft: env.MODEL_DRAFT || "llama3.2",
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 60_000,
    forceOffline: bool(env.LLM_OFFLINE),
    anthropicApiKey,
    // Default to the most capable model. For a tight credit budget, set
    // ANTHROPIC_MODEL=claude-haiku-4-5 (cheaper) or claude-sonnet-4-6.
    anthropicModel: env.ANTHROPIC_MODEL || "claude-opus-4-8",
  };
}

/**
 * The same config pointed at the person's OWN Ollama (localhost, no auth) instead of
 * the Waive-hosted server — for the "ollama-local" provider. Everything else (models,
 * timeout) is shared.
 */
export function localOllamaConfig(cfg: LlmConfig): LlmConfig {
  return { ...cfg, baseUrl: LOCAL_OLLAMA_BASE_URL, apiKey: "" };
}

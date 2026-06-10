/**
 * LLM configuration. Two providers are supported:
 *  - "ollama"    — a vision/text model, local by default; point `baseUrl` at
 *                  https://ollama.com and set `apiKey` for Ollama Cloud (same API).
 *  - "anthropic" — Claude via the Anthropic API, for an online deploy with no local
 *                  model. Selected automatically when ANTHROPIC_API_KEY is set, or
 *                  forced with LLM_PROVIDER.
 */
export type LlmProvider = "ollama" | "anthropic";

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
  const provider: LlmProvider =
    env.LLM_PROVIDER === "anthropic" || env.LLM_PROVIDER === "ollama"
      ? env.LLM_PROVIDER
      : anthropicApiKey
        ? "anthropic"
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

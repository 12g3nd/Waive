/**
 * Configuration for the Ollama LLM layer. Defaults to a LOCAL server; point
 * `baseUrl` at https://ollama.com and set `apiKey` to use Ollama Cloud (same API,
 * just hosted). No other paid cloud vendor is used.
 */
export interface LlmConfig {
  baseUrl: string;
  apiKey: string; // empty for local Ollama; required by Ollama Cloud
  modelExtract: string; // vision/multimodal model
  modelDraft: string; // text model for explanation/translation/drafting
  timeoutMs: number;
  forceOffline: boolean;
}

function bool(v: string | undefined): boolean {
  return v === "1" || v?.toLowerCase() === "true";
}

export function readLlmConfig(
  env: Record<string, string | undefined> = process.env,
): LlmConfig {
  const timeout = Number(env.LLM_TIMEOUT_MS);
  return {
    baseUrl: (env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/+$/, ""),
    apiKey: env.OLLAMA_API_KEY || "",
    modelExtract: env.MODEL_EXTRACT || "llama3.2-vision",
    modelDraft: env.MODEL_DRAFT || "llama3.2",
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 60_000,
    forceOffline: bool(env.LLM_OFFLINE),
  };
}

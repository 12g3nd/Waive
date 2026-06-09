/** Configuration for the local Ollama LLM layer. No paid cloud API is used. */
export interface LlmConfig {
  baseUrl: string;
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
    modelExtract: env.MODEL_EXTRACT || "llama3.2-vision",
    modelDraft: env.MODEL_DRAFT || "llama3.2",
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 60_000,
    forceOffline: bool(env.LLM_OFFLINE),
  };
}

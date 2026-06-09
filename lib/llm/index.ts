import { DeterministicFallbackLlm, type LlmPort } from "@/engine";
import { readLlmConfig, type LlmConfig } from "./config";
import { OllamaLlm } from "./client";
import { ollamaAvailable } from "./ollama";

export { readLlmConfig } from "./config";
export type { LlmConfig } from "./config";
export { OllamaLlm } from "./client";
export { ollamaAvailable, ollamaChat } from "./ollama";
export { normalizeExtraction, extractWithOllama, EXTRACTION_SCHEMA } from "./extraction";

export interface LlmStatus {
  mode: "ollama" | "offline";
  reason: string;
  config: Pick<LlmConfig, "baseUrl" | "modelExtract" | "modelDraft">;
}

/**
 * Choose the active LLM. Returns the Ollama client when a local server is
 * reachable (and offline mode isn't forced); otherwise the deterministic fallback,
 * so the app always works. `explain`/`draft` additionally fall back per-call.
 */
export async function getLlm(
  cfg: LlmConfig = readLlmConfig(),
): Promise<{ llm: LlmPort; status: LlmStatus }> {
  const config = { baseUrl: cfg.baseUrl, modelExtract: cfg.modelExtract, modelDraft: cfg.modelDraft };
  if (cfg.forceOffline) {
    return {
      llm: new DeterministicFallbackLlm(),
      status: { mode: "offline", reason: "LLM_OFFLINE is set", config },
    };
  }
  const up = await ollamaAvailable(cfg);
  if (!up) {
    return {
      llm: new DeterministicFallbackLlm(),
      status: {
        mode: "offline",
        reason: `Ollama not reachable at ${cfg.baseUrl}; using deterministic fallback`,
        config,
      },
    };
  }
  return {
    llm: new OllamaLlm(cfg),
    status: { mode: "ollama", reason: `Ollama reachable at ${cfg.baseUrl}`, config },
  };
}

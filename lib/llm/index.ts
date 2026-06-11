import { DeterministicFallbackLlm, type LlmPort } from "@/engine";
import { readLlmConfig, type LlmConfig, type LlmProvider } from "./config";
import { OllamaLlm } from "./client";
import { AnthropicLlm } from "./anthropic";
import { ollamaAvailable } from "./ollama";

export { readLlmConfig } from "./config";
export type { LlmConfig, LlmProvider } from "./config";
export { OllamaLlm } from "./client";
export { AnthropicLlm } from "./anthropic";
export { ollamaAvailable, ollamaChat } from "./ollama";
export { normalizeExtraction, extractWithOllama, EXTRACTION_SCHEMA } from "./extraction";

export interface LlmStatus {
  mode: "anthropic" | "ollama" | "offline";
  reason: string;
  config: Pick<LlmConfig, "baseUrl" | "modelExtract" | "modelDraft">;
}

/**
 * Choose the active LLM:
 *  - Offline forced → deterministic fallback.
 *  - Anthropic (Claude) when configured with an API key → the online path; reads
 *    uploads and rephrases/translates via Claude. No reachability probe needed.
 *  - Otherwise Ollama when a local server is reachable; else deterministic fallback.
 * `explain`/`draft` additionally fall back per-call so the app always works.
 */
export async function getLlm(
  cfg: LlmConfig = readLlmConfig(),
  requested?: LlmProvider,
): Promise<{ llm: LlmPort; status: LlmStatus }> {
  if (cfg.forceOffline) {
    return {
      llm: new DeterministicFallbackLlm("forced"),
      status: {
        mode: "offline",
        reason: "LLM_OFFLINE is set",
        config: { baseUrl: cfg.baseUrl, modelExtract: cfg.modelExtract, modelDraft: cfg.modelDraft },
      },
    };
  }

  // The person can override the env default per request (the model picker).
  const provider = requested ?? cfg.provider;
  if (provider === "anthropic" && cfg.anthropicApiKey) {
    return {
      llm: new AnthropicLlm(cfg),
      status: {
        mode: "anthropic",
        reason: `Using Claude (${cfg.anthropicModel})`,
        config: {
          baseUrl: "api.anthropic.com",
          modelExtract: cfg.anthropicModel,
          modelDraft: cfg.anthropicModel,
        },
      },
    };
  }

  const ollamaConfig = {
    baseUrl: cfg.baseUrl,
    modelExtract: cfg.modelExtract,
    modelDraft: cfg.modelDraft,
  };
  const up = await ollamaAvailable(cfg);
  if (!up) {
    return {
      llm: new DeterministicFallbackLlm("unreachable"),
      status: {
        mode: "offline",
        reason: provider === "anthropic"
          ? "ANTHROPIC_API_KEY is not set and Ollama is unreachable; using deterministic fallback"
          : `Ollama not reachable at ${cfg.baseUrl}; using deterministic fallback`,
        config: ollamaConfig,
      },
    };
  }
  return {
    llm: new OllamaLlm(cfg),
    status: { mode: "ollama", reason: `Ollama reachable at ${cfg.baseUrl}`, config: ollamaConfig },
  };
}

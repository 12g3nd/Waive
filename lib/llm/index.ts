import { DeterministicFallbackLlm, type LlmPort } from "@/engine";
import { readLlmConfig, localOllamaConfig, type LlmConfig, type LlmProvider } from "./config";
import { OllamaLlm } from "./client";
import { AnthropicLlm } from "./anthropic";
import { ollamaAvailable } from "./ollama";

export { readLlmConfig, localOllamaConfig, LOCAL_OLLAMA_BASE_URL } from "./config";
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

  // "ollama-local" points at the person's own machine; "ollama" (Waive API) uses the
  // hosted server. Everything downstream is identical — just a different connection.
  const isLocal = provider === "ollama-local";
  const effective = isLocal ? localOllamaConfig(cfg) : cfg;
  const ollamaConfig = {
    baseUrl: effective.baseUrl,
    modelExtract: effective.modelExtract,
    modelDraft: effective.modelDraft,
  };
  const up = await ollamaAvailable(effective);
  if (!up) {
    return {
      llm: new DeterministicFallbackLlm("unreachable"),
      status: {
        mode: "offline",
        reason:
          provider === "anthropic"
            ? "ANTHROPIC_API_KEY is not set and Ollama is unreachable; using deterministic fallback"
            : isLocal
              ? `No local Ollama detected at ${effective.baseUrl}; using deterministic fallback`
              : `Waive Ollama API not reachable at ${effective.baseUrl}; using deterministic fallback`,
        config: ollamaConfig,
      },
    };
  }
  return {
    llm: new OllamaLlm(effective),
    status: {
      mode: "ollama",
      reason: isLocal
        ? `Local Ollama reachable at ${effective.baseUrl}`
        : `Waive Ollama API reachable at ${effective.baseUrl}`,
      config: ollamaConfig,
    },
  };
}

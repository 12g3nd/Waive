import type { LlmConfig } from "./config";

export interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
  images?: string[]; // base64-encoded image data (no data: prefix)
}

export interface OllamaChatOptions {
  model: string;
  messages: OllamaMessage[];
  /** A JSON schema object or the string "json" to force structured output. */
  format?: object | "json";
  timeoutMs: number;
}

export class OllamaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OllamaError";
  }
}

/** Bearer auth for Ollama Cloud; empty key (local Ollama) sends no auth header. */
function authHeaders(cfg: LlmConfig): Record<string, string> {
  return cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {};
}

/**
 * One non-streaming chat completion against a local Ollama server. temperature 0
 * for determinism. Throws OllamaError on any transport/HTTP failure so callers can
 * fall back to the deterministic path.
 */
export async function ollamaChat(
  cfg: LlmConfig,
  opts: OllamaChatOptions,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    const res = await fetch(`${cfg.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(cfg) },
      signal: controller.signal,
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        stream: false,
        ...(opts.format ? { format: opts.format } : {}),
        options: { temperature: 0 },
      }),
    });
    if (!res.ok) {
      throw new OllamaError(`Ollama HTTP ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as { message?: { content?: string } };
    const content = data.message?.content;
    if (typeof content !== "string") {
      throw new OllamaError("Ollama returned no message content");
    }
    return content;
  } catch (err) {
    if (err instanceof OllamaError) throw err;
    throw new OllamaError(
      `Ollama request failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Quick reachability probe so the app can choose offline mode before a heavy call. */
export async function ollamaAvailable(
  cfg: LlmConfig,
  timeoutMs = 2_000,
): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${cfg.baseUrl}/api/tags`, {
      headers: authHeaders(cfg),
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Extract the first JSON object/array from a model response that may wrap it in prose. */
export function parseJsonLoose(content: string): unknown {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Strip ```json fences or surrounding prose, then grab the outermost braces.
    const fenced = trimmed.replace(/^```(?:json)?/i, "").replace(/```$/, "");
    const start = fenced.search(/[[{]/);
    const end = Math.max(fenced.lastIndexOf("}"), fenced.lastIndexOf("]"));
    if (start !== -1 && end > start) {
      return JSON.parse(fenced.slice(start, end + 1));
    }
    throw new OllamaError("Model did not return parseable JSON");
  }
}

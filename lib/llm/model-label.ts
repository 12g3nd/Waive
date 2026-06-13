/**
 * Human-friendly display name for a model id — used by the model picker and the
 * "which AI is running" badge so the UI shows the real model (e.g. "Claude Opus
 * 4.8") instead of a generic "AI". Pure and client-safe (no server imports).
 */
const KNOWN: Record<string, string> = {
  "claude-opus-4-8": "Claude: Opus 4.8",
  "claude-sonnet-4-6": "Claude: Sonnet 4.6",
};

const cap = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

export function modelLabel(id: string | null | undefined): string {
  if (!id) return "model";
  if (KNOWN[id]) return KNOWN[id]!;
  if (id.startsWith("claude-")) {
    const rest = id.replace(/^claude-/, "").replace(/-\d{8}$/, ""); // drop any date suffix
    const parts = rest.split("-");
    const name = parts.filter((p) => !/^\d+$/.test(p)).map(cap).join(" ");
    const version = parts.filter((p) => /^\d+$/.test(p)).join(".");
    const tail = [name, version].filter(Boolean).join(" ");
    return tail ? `Claude: ${tail}` : "Claude";
  }
  // Ollama tag (e.g. "llama3.2-vision", "qwen3-vl:235b-cloud") — already clear enough.
  return id;
}

function isLocalBaseUrl(url?: string): boolean {
  return /localhost|127\.0\.0\.1/.test(url ?? "");
}

/**
 * A friendly, non-technical label for the active engine. Claude shows the specific
 * model ("Claude Opus 4.8"). Ollama shows which connection is in use — "Ollama (Waive
 * API)" for the hosted default or "Ollama (Local)" for the person's own machine —
 * never the raw model tag, which is meaningless to most people. The `provider` is the
 * reliable signal (the Waive default can also point at localhost); baseUrl is a
 * fallback when it isn't supplied.
 */
export function engineLabel(
  mode: "anthropic" | "ollama" | "offline",
  config: { baseUrl?: string; modelDraft?: string },
  provider?: "ollama" | "anthropic" | "ollama-local",
): string {
  if (mode === "offline") return "offline mode";
  if (mode === "anthropic") return modelLabel(config.modelDraft);
  const isLocal =
    provider === "ollama-local" || (provider === undefined && isLocalBaseUrl(config.baseUrl));
  return isLocal ? "Ollama (Local)" : "Ollama (Waive API)";
}

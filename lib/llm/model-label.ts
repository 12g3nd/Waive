/**
 * Human-friendly display name for a model id — used by the model picker and the
 * "which AI is running" badge so the UI shows the real model (e.g. "Claude Haiku
 * 4.5") instead of a generic "AI". Pure and client-safe (no server imports).
 */
const KNOWN: Record<string, string> = {
  "claude-opus-4-8": "Claude Opus 4.8",
  "claude-sonnet-4-6": "Claude Sonnet 4.6",
  "claude-haiku-4-5": "Claude Haiku 4.5",
  "claude-haiku-4-5-20251001": "Claude Haiku 4.5",
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
    return ["Claude", name, version].filter(Boolean).join(" ");
  }
  // Ollama tag (e.g. "llama3.2-vision", "qwen3-vl:235b-cloud") — already clear enough.
  return id;
}

/**
 * A friendly, non-technical label for the active engine. Claude shows the specific
 * model ("Claude Haiku 4.5"); Ollama shows just "Ollama" (or "Ollama (cloud)") rather
 * than the raw model tag, which is meaningless to most people.
 */
export function engineLabel(
  mode: "anthropic" | "ollama" | "offline",
  config: { baseUrl?: string; modelDraft?: string },
): string {
  if (mode === "offline") return "offline mode";
  if (mode === "anthropic") return modelLabel(config.modelDraft);
  const tag = (config.modelDraft ?? "").replace(/-cloud$/, "").replace(/:/g, " ").trim();
  return tag ? `Ollama: ${tag}` : "Ollama";
}

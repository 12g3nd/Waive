/**
 * Shared pieces for the LlmPort `translate` boundary, used by both real providers
 * (Ollama + Anthropic). Translation only ever touches already-vetted display text —
 * it never originates legal content.
 */

/** System prompt: translate every JSON value; keep keys and numbers/dates/forms verbatim. */
export const TRANSLATE_RULES =
  "You are a translator for a legal-aid tool. You are given a JSON object of short UI strings that are already legally vetted and TRUE. Translate every string VALUE into the requested language. Keep the JSON keys exactly as given. Keep every number, date, money amount, form name or number (e.g. SSA-632), statute or section citation, case number, and proper name EXACTLY as written. Do not add, remove, explain, or reorder anything. Return ONLY a JSON object with the same keys and the translated values.";

/** Merge a model's translation map back over the source, keeping English for any gap. */
export function mergeTranslations(
  source: Record<string, string>,
  parsed: unknown,
): Record<string, string> {
  const out: Record<string, string> = {};
  const got = (parsed ?? {}) as Record<string, unknown>;
  for (const [k, english] of Object.entries(source)) {
    const v = got[k];
    out[k] = typeof v === "string" && v.trim() ? v : english;
  }
  return out;
}

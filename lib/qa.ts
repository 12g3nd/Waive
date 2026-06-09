import { InMemoryCitationResolver, type CitationEntry, type ResolvedCitation } from "@/engine";
import { allCitations } from "@/corpus";

/**
 * Grounded Q&A retrieval over the citation corpus.
 *
 * This is the "ask a question about your notice" feature. It is deliberately NOT a
 * free-roaming chatbot: candidate answers are retrieved from the curated corpus by
 * lexical scoring, scoped to the notice's domain, and any generated text is grounded
 * strictly in those retrieved entries + the deterministic case facts. No new legal
 * claim can appear that isn't already a verified corpus entry.
 */

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "is", "are", "was", "were", "be", "to", "of", "in",
  "on", "for", "with", "this", "that", "it", "i", "you", "my", "me", "do", "does", "can", "what",
  "how", "why", "when", "will", "would", "should", "could", "have", "has", "had", "they", "them",
  "their", "your", "about", "from", "at", "as", "by", "not", "no", "yes", "am",
]);

// Small synonym expansion so natural questions land on the right rule.
const SYNONYMS: Record<string, string[]> = {
  cancel: ["waiver", "cancelled", "forgiven"],
  cancelled: ["waiver"],
  forgive: ["waiver"],
  old: ["limitation", "barred", "time"],
  expired: ["limitation", "barred"],
  garnish: ["default", "withhold", "recovery"],
  garnishment: ["default", "withhold"],
  afford: ["hardship", "rate", "income"],
  pay: ["repayment", "installment", "rate"],
  fault: ["fault", "without"],
  appeal: ["reconsideration", "dispute"],
  dispute: ["reconsideration"],
  deadline: ["deadline", "days", "window"],
  ignore: ["default", "recovery"],
  own: ["assignment", "standing", "buyer"],
  prove: ["assignment", "standing"],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
    .map((t) => (t.endsWith("s") && t.length > 4 ? t.slice(0, -1) : t)); // light plural strip
}

function expand(tokens: string[]): string[] {
  const out = new Set(tokens);
  for (const t of tokens) for (const syn of SYNONYMS[t] ?? []) out.add(syn);
  return [...out];
}

function score(entry: CitationEntry, queryTokens: string[]): number {
  const topic = new Set(tokenize(entry.topic));
  const summary = new Set(tokenize(entry.summary));
  let s = 0;
  for (const q of queryTokens) {
    if (topic.has(q)) s += 2; // topic hits weigh more
    else if (summary.has(q)) s += 1;
  }
  return s;
}

export interface RetrievedEntry extends CitationEntry {
  relevance: number;
}

/** Lexically retrieve the most relevant corpus entries for a question, by domain. */
export function retrieveForQuestion(
  domain: string,
  question: string,
  k = 3,
): RetrievedEntry[] {
  const resolver = new InMemoryCitationResolver(allCitations);
  const pool = resolver.list().filter((e) => e.domain === domain);
  const qTokens = expand(tokenize(question));
  if (qTokens.length === 0) return [];

  return pool
    .map((e) => ({ ...e, relevance: score(e, qTokens) }))
    .filter((e) => e.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, k);
}

/** Turn retrieved entries into citations for the UI (resolved, with usage context). */
export function toResolved(entries: RetrievedEntry[]): ResolvedCitation[] {
  return entries.map((e) => ({ ...e, usedFor: ["Answer to your question"] }));
}

/** Offline answer: compose directly from the retrieved corpus summaries — no model. */
export function composeOfflineAnswer(entries: RetrievedEntry[]): string {
  if (entries.length === 0) {
    return "I couldn't match your question to a rule in our sources. For anything specific, have a legal-aid clinic review your notice — this is information, not legal advice.";
  }
  const parts = entries.map((e) => `• ${e.topic}: ${e.summary}`);
  return `Here is what the most relevant rules say about your notice:\n\n${parts.join(
    "\n\n",
  )}\n\nThis is information, not legal advice.`;
}

/** Build the grounded prompt for a local model to answer in plain language. */
export function buildAskMessages(
  question: string,
  grounding: string,
  entries: RetrievedEntry[],
  language: string,
) {
  const langName = language === "es" ? "Spanish (Español)" : "English";
  const sources = entries
    .map((e, i) => `[${i + 1}] ${e.topic} — ${e.summary} (${e.officialCitation})`)
    .join("\n");
  return [
    {
      role: "system" as const,
      content:
        "You are a careful legal-aid explainer. Answer the person's question in plain language using ONLY the provided sources and case facts. Do NOT state any legal rule, deadline, form, or number that is not in the sources. If the answer isn't covered, say so plainly and suggest a legal-aid clinic. Keep it under 110 words. This is information, not legal advice.",
    },
    {
      role: "user" as const,
      content: `Write the answer in ${langName}.\n\nQuestion: ${question}\n\nThe person's case facts:\n${grounding}\n\nSources you may use (and nothing else):\n${sources}`,
    },
  ];
}

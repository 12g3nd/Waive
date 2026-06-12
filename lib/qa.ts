import { InMemoryCitationResolver, type CitationEntry, type ResolvedCitation } from "@/engine";
import { allCitations } from "@/corpus";
import type { AskSource } from "@/lib/api-types";
import { t as tr } from "@/lib/i18n";

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

// Greetings, acknowledgements, and noise. When a message is made up of ONLY these
// (plus the connective filler below), it's smalltalk, not a question about the notice.
const SMALLTALK = new Set([
  "hi", "hii", "hiii", "hey", "heya", "hiya", "hello", "helo", "hullo", "yo", "sup",
  "wassup", "whatsup", "greeting", "greetings", "howdy", "morning", "afternoon",
  "evening", "night", "gm", "gn", "thank", "thanks", "thankyou", "thx", "ty", "cheers",
  "cheer", "welcome", "ok", "okay", "okey", "kk", "cool", "nice", "great", "good",
  "awesome", "fine", "alright", "lol", "lmao", "rofl", "haha", "hah", "hehe", "wow",
  "yay", "test", "testing", "ping", "pong", "hmm", "hmmm", "yep", "yup", "yeah", "nope",
  "nah", "bye", "goodbye", "cya", "ttyl", "yes", "no", "sure", "maybe", "idk", "dunno",
]);

// Connective filler that often trails a greeting ("thank you", "hey there"). These
// don't make a message a question on their own, so they're allowed alongside greetings.
const FILLER = new Set([
  "a", "an", "the", "you", "youre", "u", "ur", "your", "me", "my", "mine", "i", "im",
  "we", "our", "us", "to", "of", "for", "please", "pls", "just", "so", "there", "here",
  "now", "again", "this", "that", "it", "and", "but", "well", "hi",
]);

// Words that signal an actual question — if any appear (or there's a "?"), it's a real
// question we should answer, even if it's otherwise vague ("what should I do").
const QUESTION_WORDS = new Set([
  "what", "whats", "how", "hows", "why", "when", "where", "who", "whom", "whose",
  "which", "can", "cant", "could", "do", "does", "did", "should", "would", "will",
  "shall", "is", "are", "am", "was", "were", "has", "have", "had", "may", "might",
  "must", "if", "need", "explain", "tell", "mean", "means", "deadline", "happen",
]);

function rawWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Is this actually a question about the notice, or just a greeting / acknowledgement /
 * noise like "hi", "thanks", or "test"? The Q&A feature should answer real questions —
 * even vague ones like "what should I do" — but a friendly "hi" must NOT trigger legal
 * advice. A message is smalltalk when it's empty/punctuation, or made up entirely of
 * greetings + filler AND shows no sign of being a question.
 */
export function isSmalltalk(question: string): boolean {
  const words = rawWords(question);
  if (words.length === 0) return true; // "??", "...", emoji-only
  if (question.includes("?")) return false; // explicitly a question
  if (words.some((w) => QUESTION_WORDS.has(w))) return false; // phrased as a question
  return words.every((w) => SMALLTALK.has(w) || FILLER.has(w));
}

/** A warm nudge back on-topic for smalltalk, instead of unprompted legal advice. */
export function composeSmalltalkReply(language = "en"): string {
  return tr(language, "ask.smalltalk");
}

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

/**
 * Sources to hand the model for a question — lexically ranked, but NEVER empty:
 * when nothing matches (e.g. a vague "what should I do?"), it still returns the
 * domain's key entries so the model always has material to ground its answer in.
 */
export function relevantSources(domain: string, question: string, k = 6): RetrievedEntry[] {
  const resolver = new InMemoryCitationResolver(allCitations);
  const pool = resolver.list().filter((e) => e.domain === domain);
  const qTokens = expand(tokenize(question));
  return pool
    .map((e) => ({ ...e, relevance: qTokens.length ? score(e, qTokens) : 0 }))
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, k);
}

/** Turn retrieved entries into citations for the UI (resolved, with usage context). */
export function toResolved(entries: RetrievedEntry[]): ResolvedCitation[] {
  return entries.map((e) => ({ ...e, usedFor: ["Answer to your question"] }));
}

/**
 * Offline answer: compose directly from the retrieved corpus summaries — no model.
 * The framing sentences are localized; each rule's topic/summary stays as the verbatim
 * (English) corpus text, since those are quoted sources.
 */
export function composeOfflineAnswer(entries: RetrievedEntry[], language = "en"): string {
  if (entries.length === 0) {
    return tr(language, "ask.offlineEmpty");
  }
  const parts = entries.map((e) => `• ${e.topic}: ${e.summary}`);
  return `${tr(language, "ask.offlinePrefix")}\n\n${parts.join("\n\n")}\n\n${tr(
    language,
    "ask.offlineSuffix",
  )}`;
}

/** Build the grounded prompt for the model to interpret + answer in plain language. */
export function buildAskMessages(
  question: string,
  grounding: string,
  sources: AskSource[],
  language: string,
) {
  const langName = language === "es" ? "Spanish (Español)" : language === "fr" ? "French (Français)" : "English";
  const sourceText = sources
    .map((s, i) => `[${i + 1}] ${s.topic} — ${s.summary}${s.cite ? ` (${s.cite})` : ""}`)
    .join("\n");
  return [
    {
      role: "system" as const,
      content:
        "You are a careful legal-aid explainer. The person's question may be short, casual, or vague — work out what they mean and answer it directly in plain language. Use ONLY the case facts and the sources below: point them to their deadline and recommended next step, and name the rule that backs it up. When a statement relies on a source, cite it inline as [1], [2], etc. (only those bracketed numbers), matching the numbered Sources list. Never state a rule, date, dollar amount, form, or number that is not in the case facts or sources. If the question truly isn't covered by them, say so plainly and suggest a free legal-aid clinic. Keep it under 120 words. This is information, not legal advice.",
    },
    {
      role: "user" as const,
      content: `Answer in ${langName}.\n\nQuestion: ${question}\n\nThe person's case (already worked out):\n${grounding}\n\nSources you may use and cite (and nothing else):\n${sourceText}`,
    },
  ];
}

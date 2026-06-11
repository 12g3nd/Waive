import { describe, expect, it } from "vitest";
import { composeOfflineAnswer, relevantSources, retrieveForQuestion } from "@/lib/qa";

describe("grounded Q&A retrieval", () => {
  it("routes a benefits 'can it be cancelled' question to the waiver rule", () => {
    const top = retrieveForQuestion("benefits", "Can this debt be cancelled?");
    expect(top[0]?.id).toBe("ssa-632-waiver");
  });

  it("routes an Ontario 'is this too old' question to the limitation rule", () => {
    const top = retrieveForQuestion("answer", "Is this debt too old to collect?");
    expect(top.map((e) => e.id)).toContain("ans-limitation-2yr");
  });

  it("stays scoped to the notice's domain (no cross-domain leakage)", () => {
    const top = retrieveForQuestion("answer", "waiver overpayment social security");
    expect(top.every((e) => e.domain === "answer")).toBe(true);
  });

  it("returns nothing for an unmatchable question, and composes an honest fallback", () => {
    const top = retrieveForQuestion("benefits", "zzzz qqqq");
    expect(top).toHaveLength(0);
    expect(composeOfflineAnswer(top)).toMatch(/legal-aid clinic/i);
  });

  it("composes an offline answer from the retrieved corpus summaries", () => {
    const top = retrieveForQuestion("answer", "deadline to respond");
    const answer = composeOfflineAnswer(top);
    expect(answer).toMatch(/not legal advice/i);
    expect(answer.length).toBeGreaterThan(40);
  });

  it("relevantSources always returns material, even for a vague question", () => {
    // "what should I do" is all stopwords — retrieval would be empty, but the model
    // path must still get sources to ground its answer in.
    const s = relevantSources("answer", "what should i do");
    expect(s.length).toBeGreaterThan(0);
    expect(s.every((e) => e.domain === "answer")).toBe(true);
  });
});

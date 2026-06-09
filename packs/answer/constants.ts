/**
 * Citation ids for the `answer` (Ontario debt-claim) pack. Resolves against
 * /corpus/answer.json. This pack is deliberately thin — it exists to prove the
 * engine is domain-blind by running an entirely different jurisdiction (Ontario,
 * Canada) and injustice (a debt-collection lawsuit) through the same pipeline.
 */
export const ACID = {
  defence20: "ans-defence-20-day", // Rule 9.01 — 20-day Defence
  defaultJudgment: "ans-default-judgment", // Rule 11 — noting in default
  limitation: "ans-limitation-2yr", // Limitations Act, 2002 s.4/5
  acknowledgment: "ans-acknowledgment", // s.13 — written acknowledgment restarts
  standing: "ans-assignment-standing", // CLPA s.53 — prove ownership/assignment
  proposeTerms: "ans-propose-terms", // admit + propose terms of payment
  defenceForm: "ans-defence-form-9a", // the Defence (Form 9A) itself
} as const;

export type AnswerCitationId = (typeof ACID)[keyof typeof ACID];

/** Ontario's basic limitation period: a debt claim is generally barred after this. */
export const ONTARIO_LIMITATION_YEARS = 2;

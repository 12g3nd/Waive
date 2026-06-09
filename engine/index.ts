/** Backstop engine — public surface. */

export * from "./types";
export * from "./dates";
export * from "./format";
export { assessConfidence } from "./confidence";
export {
  InMemoryCitationResolver,
  isVerified,
  toCitationEntry,
} from "./citations";
export { PackRegistry, UnknownPackError } from "./registry";
export {
  DeterministicFallbackLlm,
  LlmUnavailableError,
  buildExplanation,
  buildDraft,
} from "./fallback";
export { runPipeline } from "./pipeline";

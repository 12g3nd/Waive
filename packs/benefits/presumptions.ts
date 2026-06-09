import type { NoticeExtraction, PresumptionResult, UserFacts } from "@/engine";
import { CID } from "./constants";

type Strength = "automatic" | "likely" | "possible";

interface PresumptionRule {
  id: string;
  when: (f: UserFacts) => boolean;
  headline: string;
  explanation: string;
  citationId: string;
  strength: Strength;
}

const yes = (f: UserFacts, key: string) => f.answers[key] === true;

/**
 * SSA's own rules list situations where the agency PRESUMES the person was not at
 * fault. This is the "gotcha engine": a deterministic checklist over the intake
 * answers, each row mapped to a real corpus citation. When a strong row fires, the
 * waiver (SSA-632) — which can cancel the debt entirely — comes into play.
 *
 * Each rule references 20 CFR 404.510's enumerated circumstances (and related
 * sections). Additional 404.510 letters can be added the same way — config, not
 * code changes to the engine.
 */
const RULES: PresumptionRule[] = [
  {
    id: "timely-report",
    when: (f) => yes(f, "timelyReported"),
    headline: "You reported the change and SSA kept paying you — you are presumed not at fault.",
    explanation:
      "When you reported the event that caused the overpayment and SSA continued paying you the same amount, you accepted those payments in good faith. You can request a full waiver (SSA-632), and this debt can be cancelled entirely.",
    citationId: CID.wf510g,
    strength: "automatic",
  },
  {
    id: "relied-on-ssa",
    when: (f) => yes(f, "reliedOnSsaInfo"),
    headline: "SSA's own information led to this — you are presumed not at fault.",
    explanation:
      "If you relied on incorrect information from an official Social Security (or government) source, the resulting overpayment is not your fault. That opens the door to a waiver (SSA-632).",
    citationId: CID.wf510b,
    strength: "automatic",
  },
  {
    id: "pandemic-period",
    when: (f) => yes(f, "pandemicPeriod"),
    headline: "This falls in the COVID-19 period — SSA presumes you were not at fault.",
    explanation:
      "SSA's rules presume people are without fault for qualifying overpayments during the pandemic period, absent fraud or misuse. Confirm the exact dates, then a waiver (SSA-632) can cancel the debt.",
    citationId: CID.wfPandemic,
    strength: "automatic",
  },
  {
    id: "ssa-cannot-document",
    when: (f) => yes(f, "ssaCannotProduceDocs"),
    headline: "SSA can't document this overpayment — strong grounds to challenge it.",
    explanation:
      "SSA must be able to show that the overpayment happened and how it reached the amount. If it cannot, that is a strong basis to dispute it on reconsideration (SSA-561), and it undercuts any claim that you were at fault.",
    citationId: CID.substantiation,
    strength: "likely",
  },
  {
    id: "net-vs-gross",
    when: (f) => yes(f, "netVsGross"),
    headline: "You reasonably believed only take-home pay counted — that supports 'not at fault'.",
    explanation:
      "Believing that only your net take-home pay counted toward the earnings limit is a recognized without-fault situation.",
    citationId: CID.wf510a,
    strength: "likely",
  },
  {
    id: "bonus-vacation",
    when: (f) => yes(f, "bonusVacation"),
    headline: "You didn't know a bonus / vacation pay counted — that supports 'not at fault'.",
    explanation:
      "Not knowing that a bonus, vacation pay, or severance counted as earnings for the limit is a recognized without-fault situation.",
    citationId: CID.wf510h,
    strength: "likely",
  },
  {
    id: "retro-employer",
    when: (f) => yes(f, "retroOrEmployerError"),
    headline: "An unexpected raise / employer error pushed you over — that supports 'not at fault'.",
    explanation:
      "Being unaware your earnings exceeded the limit because of a retroactive raise, an employer's error, or an unusual extra payday is a recognized without-fault situation.",
    citationId: CID.wf510f,
    strength: "likely",
  },
  {
    id: "auxiliary-unaware",
    when: (f) => yes(f, "auxiliaryUnaware"),
    headline: "You're on someone else's record and didn't know — this may make you not at fault.",
    explanation:
      "A family beneficiary who did not know the primary earner's work caused deductions can be treated as without fault.",
    citationId: CID.wf510k,
    strength: "possible",
  },
  {
    id: "did-not-understand",
    when: (f) => yes(f, "didNotUnderstand"),
    headline: "You genuinely didn't understand the rule — SSA must weigh your circumstances.",
    explanation:
      "If your circumstances clearly show you didn't understand the rule, that can establish without fault. SSA must consider your age, education, and any health or language limitations.",
    citationId: CID.wf510n,
    strength: "possible",
  },
];

export function checkBenefitsPresumptions(
  _e: NoticeExtraction,
  f: UserFacts,
): PresumptionResult {
  const catches = RULES.filter((r) => r.when(f)).map((r) => ({
    id: r.id,
    headline: r.headline,
    explanation: r.explanation,
    citationId: r.citationId,
    strength: r.strength,
  }));
  return { catches };
}

/**
 * Routing helper: a person is treated as "not at fault" (waiver path) when at
 * least one strong (automatic or likely) presumption fires. "possible"-only
 * signals are noted as alternatives but do not by themselves route to the waiver.
 */
export function hasStrongNotAtFault(result: PresumptionResult): boolean {
  return result.catches.some(
    (c) => c.strength === "automatic" || c.strength === "likely",
  );
}

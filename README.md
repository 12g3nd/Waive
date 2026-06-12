# Waive

**Stop losing by silence.**

Waive reads an intimidating official notice, finds the deadline buried inside it, and routes the person to the remedy that already exists in law, while there is still time to use it.

[![Live demo](https://img.shields.io/badge/live%20demo-waivelegal.vercel.app-1a7f37?style=for-the-badge)](https://waivelegal.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-App%20Router-000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![AI](https://img.shields.io/badge/AI-local%20Ollama-0a0a0a?logo=ollama&logoColor=white)
![Tests](https://img.shields.io/badge/tests-105%20passing-2ea44f)
![Citations](https://img.shields.io/badge/legal%20claims-100%25%20cited-8a2be2)

> **Information and document preparation, not legal advice.** Waive is a force-multiplier for legal-aid orgs and advocates, not a lawyer.

<sub>This README doubles as our Devpost write-up. The "About the project" submission is everything from **Inspiration** onward.</sub>

---

## Inspiration

Every year, millions of people receive a letter from the Social Security Administration telling them they owe money, sometimes thousands of dollars.[^ssa] Most of them genuinely do. Many do not. Either way, the letter tells you only what you owe and when collection starts. That is it. The remedy you might qualify for, the [waiver][ssa-632] that can erase the debt, the [reconsideration][ssa-561] that can pause it, the short window in which any of it has to happen, none of that is on the page.

We built Waive because the justice gap is not only about lawyers being expensive. It is about a letter sitting on a kitchen table that nobody can decode, with a deadline nobody knows about, for a person who has no idea they hold rights worth exercising. The law already wrote them an escape hatch. Almost nobody finds it in time.

## What it does

You upload a photo or PDF of an official notice, for example a Social Security overpayment letter or a debt lawsuit. Waive then:

1. **Reads it** into structured fields (who sent it, the amount, the dates, the claim type).
2. **Computes your real deadline**, down to how many days you have left, accounting for weekends and holidays.
3. **Explains it in plain language** (English or Spanish, with read-aloud), and tells you your options.
4. **Drafts the form** you would actually file, ready to review and sign, when one applies.

Every deadline and every option traces back to a real, cited statute or rule, so a person, a legal-aid worker, or a judge can verify it.

> The law gave you a way out. Most people never find it. Waive makes the hidden remedy visible before the deadline passes.

## How we built it

Waive is one **domain-blind engine** (codenamed **Backstop**) plus pluggable **rule packs**. The engine never knows whether it is looking at an SSA overpayment or an Ontario debt claim. Each rule pack supplies all the legal logic behind a single, shared interface:

```ts
interface RulePack {
  id: string;                                          // "benefits" | "answer"
  computeDeadlines(e: NoticeExtraction): DeadlineResult;        // deterministic
  routeRemedy(e: NoticeExtraction, f: UserFacts): RemedyDecision;     // deterministic
  checkPresumptions(e: NoticeExtraction, f: UserFacts): PresumptionResult; // deterministic
  intake: IntakeQuestion[];      // the guided questions
  documents: DocumentSpec[];     // the templates the AI fills in
  citationIndex: string[];       // every claim must resolve to a real source here
}
```

The pipeline runs the same way every time, with **zero branches on domain or jurisdiction**:

```text
upload → [AI] read the notice into a structured schema
       → [code] compute the deadline (pure date math, golden-tested)
       → [code] route to the right remedy, with alternatives and "why not"
       → [code] check auto-qualifying presumptions and defences
       → [code] attach citations from the corpus by exact id
       → [AI] explain in plain language + draft the form
       → assemble: clock, routed remedy, catches, drafted doc, checklist, sources
```

**The boundary is the whole design.** The AI reads and rephrases. The code decides anything that can hurt you if it is wrong.

| Step | Who does it |
| --- | --- |
| Notice → structured fields | **AI** (vision model) |
| Deadline computation | **Code** (pure date math, unit + golden tested) |
| Remedy routing | **Code** (decision tree, tested) |
| Not-at-fault / limitations defences | **Code** (tested) |
| Plain-language explanation + translation | **AI** (grounded in the code's output) |
| Form / letter drafting | **AI** (grounded, fills a fixed template) |
| Citation attachment | **Code** (exact id map, no guessing) |

### The deadlines are arithmetic, not opinions

Every clock is a pure function with a "show your work" derivation. The anchor date (when the notice was issued or served) plus a statutory window, rolled forward off weekends and holidays:

$$
\text{due} \;=\; \mathrm{rollForwardToBusinessDay}\!\left(\text{anchorDate} + n\ \text{days},\ \text{holidays}\right)
$$

$$
n =
\begin{cases}
30 & \text{SSA protected window (freeze collection)} \\
20 & \text{Ontario defence} \\
14 & \text{British Columbia reply} \\
30 & \text{California answer}
\end{cases}
$$

```ts
const pauseRaw = addDays(notice, 30);
const pauseDue = rollForwardToBusinessDay(pauseRaw, US_FEDERAL_HOLIDAYS);
// → "Notice dated Jun 2, 2025 + 30 calendar days = Jul 2, 2025"
```

For SSA, that produces three dated events from one letter: a **30-day protected window**, a **60-day reconsideration** deadline (plus the 5-day mailing presumption under [20 CFR §404.909][cfr-909]), and the **90-day** clock on which, for notices dated on or after **April 25, 2025**, SSA's default is to withhold half the monthly benefit (EM-25029 REV):

$$
\text{withheld per month} \;=\; 0.50 \times (\text{monthly benefit}), \qquad \text{notice date} \ge \text{2025-04-25}
$$

The debt packs run the *same code* on a different injustice. A claim is **time-barred** when too much time has passed since the last activity on the account:

$$
\text{time-barred} \iff (\,t_{\text{claim}} - t_{\text{last activity}}\,) > L,
\qquad
L =
\begin{cases}
2\ \text{years} & \text{Ontario, British Columbia} \\
4\ \text{years} & \text{California}
\end{cases}
$$

Each jurisdiction is one verified profile (its own deadline, limitation period, court, and forms), turned into a rule pack by the same factory. Adding a new injustice or a new province is config, not a rebuild.

### Sources, never guesses

Every legal claim shown in the UI is mapped to a curated corpus entry by exact id, and each entry carries a **real, verified** citation: SSA forms ([SSA-632][ssa-632], [SSA-561][ssa-561]) and [20 CFR §404.510][cfr-510] / [§404.909][cfr-909]; Ontario's [Limitations Act, 2002][on-limit] and [Rules of the Small Claims Court][on-scc]; British Columbia's [Limitation Act][bc-limit]; California's [Code of Civil Procedure §412.20][ccp-412] and the [Fair Debt Buying Practices Act][ca-fdbpa]. Anything without a verified source is flagged `TODO_CITATION` and never rendered. A test enforces it.

**Stack:** [Next.js][nextjs] (App Router) and [TypeScript][typescript] in strict mode, the deterministic engine covered by [Vitest][vitest] unit and golden tests, and a local [Ollama][ollama] model (or Waive's own hosted Ollama API) for the reading and rephrasing. The model is always optional: if none is reachable, the app falls back to deterministic, citation-grounded text and everything still works.

## Challenges we ran into

1. **Trusting AI with a high-stakes outcome.** The hardest decision was not *how* to use AI, but *whether* it should touch anything load-bearing at all. A model that confidently invents a wrong date could cost someone their benefits. We resolved it by drawing a hard line: the model reads and translates, and tested code computes every deadline, route, and qualification.
2. **The Ollama dependency.** Running the model locally is excellent for privacy, but it asks the user to install Ollama, and that is a real barrier for the exact people Waive is for: elderly and low-income users who just need to read their letter. We answered it with a hosted **Waive Ollama API** as the private default (no install, nothing stored), keeping fully-local as an option for the privacy-conscious.
3. **Making legal language human.** Legal text is precise by design and baffling in practice. Turning its logic into plain language that a non-lawyer can act on, without losing accuracy or accidentally giving advice, was harder than most of the engineering.

## Accomplishments that we're proud of

1. **We drew a hard line on AI.** Most legal AI tools let the model decide your outcome. We did not. There is a real, enforced boundary: the AI reads, the code analyzes and produces the answer, and every number can show its work.
2. **It works for real people in real situations.** Waive is not a demo with mocked data. It draws on legitimate, cited sources a person can actually use. A judge, a legal-aid worker, or someone who just opened an SSA letter can run it right now and get a real, verifiable result.
3. **We kept the language human.** Every label, explanation, and error message was written for someone receiving their first government letter, not for a lawyer. That took more effort than any single feature, and we think it shows.

## What we learned

1. **You don't need AI for everything.** AI is powerful, but a project does not have to revolve around it. We used it purely to make the notice readable and the output human, and we stopped asking "should we use AI for this?" in favour of "should AI even *touch* this?"
2. **A cooperative team is the real engine.** We could not have built Waive without every member pulling their weight. With moral support and clear task ownership throughout, the work went smoothly. A team is only as strong as its weakest link, and ours held.

## What's next for Waive

1. **More languages.** Today Waive speaks English and Spanish. French is mandatory for Canadian federal notices, and millions of people facing these letters do not read English as a first language. Broadening language support is the top priority.
2. **More injustices, more jurisdictions.** The engine is built to grow. Evictions, CRA notices, and EI denials fit the same "notice + deadline + hidden remedy" shape, and adding Alberta or New York is one more verified profile.
3. **Closing the last access gap.** The hosted API already removed the install barrier; next is a deeper accessibility and low-bandwidth pass, and a path for legal-aid clinics to add their own rule packs.

---

## References

Load-bearing legal sources, verified against official publishers:

- SSA, *Overpayments* and forms [SSA-632 (waiver)][ssa-632] and [SSA-561 (reconsideration)][ssa-561]; EM-25029 REV (50% Title II default withholding, effective 2025-04-25).
- *20 CFR* [§404.510][cfr-510] (without-fault factors) and [§404.909][cfr-909] (reconsideration window), via Cornell LII.
- Ontario: [Limitations Act, 2002][on-limit]; [Rules of the Small Claims Court (O. Reg. 258/98)][on-scc].
- British Columbia: [Limitation Act, SBC 2012][bc-limit].
- California: [Code of Civil Procedure §412.20][ccp-412]; [Fair Debt Buying Practices Act (Civ. Code §1788.50)][ca-fdbpa].

Built with [Next.js][nextjs], [TypeScript][typescript], [Vitest][vitest], and [Ollama][ollama].

[^ssa]: For SSDI overpayment notices issued on or after April 25, 2025, SSA's default is to withhold 50% of the monthly benefit until the debt is repaid, unless the person first requests a lower rate, reconsideration, or a waiver (SSA EM-25029 REV).

[ssa-632]: https://www.ssa.gov/forms/ssa-632.html
[ssa-561]: https://www.ssa.gov/forms/ssa-561.html
[cfr-510]: https://www.law.cornell.edu/cfr/text/20/404.510
[cfr-909]: https://www.law.cornell.edu/cfr/text/20/404.909
[on-limit]: https://www.ontario.ca/laws/statute/02l24
[on-scc]: https://www.ontario.ca/laws/regulation/980258
[bc-limit]: https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/12013_01
[ccp-412]: https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=412.20
[ca-fdbpa]: https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1788.50
[nextjs]: https://nextjs.org
[typescript]: https://www.typescriptlang.org
[vitest]: https://vitest.dev
[ollama]: https://ollama.com

# Waive

**The engine that stops people from losing by silence.**

An official notice + a short deadline + a hidden remedy the person never finds in
time → automatic loss, by silence, before anyone reviews the merits. Waive reads
the intimidating notice and routes the person to the escape hatch that already
exists, **before their clock runs out**.

The domain-blind engine behind Waive is codenamed **Backstop**. It is *one engine,
not two apps*: a deterministic core plus pluggable **rule packs**. We demo it deep
on Social Security overpayments, then run the *same code* on an Ontario debt
lawsuit to prove it generalizes.

> **Information and document preparation, not legal advice.** Waive is a
> force-multiplier for legal-aid orgs and advocates — not a lawyer.

---

## The one machine behind two injustices

- **Benefit overpayments (`benefits` — the hero domain).** Social Security overpays
  someone through *its own* error, then years later demands the money back. Miss the
  short window and SSA claws it back automatically — for SSDI overpayment notices
  issued on/after **April 25, 2025**, SSA withholds **50% of the monthly benefit**
  until repaid unless the person acts (EM-25029 REV).
- **Debt claims (`answer` — the proof-of-generality domain).** A person is sued
  (often by a debt buyer on old debt), doesn't understand the claim or the deadline,
  doesn't file a defence, and **loses by default** — then faces garnishment, even
  when the debt was time-barred, paid, or not theirs. This build ships **three
  jurisdictions across Canada and the U.S.** — **Ontario** (20-day Defence, 2-yr
  limit), **British Columbia** (14-day Reply, 2-yr limit), and **California** (30-day
  Answer, 4-yr limit) — each a verified *config profile*, not new code. Same engine,
  same UI.

Same shape every time: **notice + short deadline + hidden remedy → automatic loss by
silence.** Adding a new injustice is **writing a new rule pack — config, not a
rebuild.**

---

## Five design principles (this is how the project wins)

1. **The high-stakes outputs are deterministic, not generated.** Deadlines, remedy
   routing, and "do you auto-qualify" checks are computed by tested, pure functions
   that **show their work**. The LLM never decides these.
2. **The LLM is a translator, not an oracle.** It does exactly three jobs: read the
   notice into a schema, explain in plain language / the user's language, and draft
   form text. It never invents legal conclusions. (Here, the deterministic text is
   built first and the model is only allowed to *rephrase and translate* it.)
3. **Every legal claim carries a real citation, or it isn't shown.** Claims come from
   deterministic rule evaluations mapped to a curated corpus by exact id. We **never
   fabricate** a statute, POMS section, form number, or URL — unverified entries are
   marked `TODO_CITATION` (see the list below).
4. **Integrity over engagement.** If the facts say the person genuinely owes the
   money or was at fault, Waive routes to the honest remedy and says so — no
   frivolous waivers, no manufactured defences.
5. **Information, not legal advice.** Low-confidence reads and genuine judgment calls
   (e.g. SSA hardship) escalate to "have a legal-aid clinic review this".

---

## Architecture — the domain-blind pipeline

```
upload → [LLM] extract to NoticeExtraction
       → [deterministic] DeadlineEngine.compute(extraction, pack)
       → [deterministic] RemedyRouter.route(extraction, userFacts, pack)
       → [deterministic] PresumptionChecker.evaluate(extraction, userFacts, pack)
       → [retrieval]     attach citations from corpus (exact id mapping)
       → [LLM]           plain-language explanation + draft selected form/letter
       → assemble Result (explanation, clock, routed remedy + alternatives,
                          presumption catches, drafted doc, filing checklist,
                          citations, confidence)
```

[`runPipeline`](engine/pipeline.ts) has **zero branches on pack id or domain**. The
pack supplies all the legal logic through the [`RulePack`](engine/types.ts)
interface; the LLM only translates and drafts.

### Where the boundary is enforced (in code structure)

| Module | Who does it | Where |
|---|---|---|
| Document → `NoticeExtraction` | **LLM (Ollama vision)** | [lib/llm/extraction.ts](lib/llm/extraction.ts) |
| Deadline computation | **Deterministic** | [packs/*/deadlines.ts](packs/) — pure date math, unit-tested |
| Remedy routing | **Deterministic** | [packs/*/router.ts](packs/) — decision tree, unit-tested |
| Not-at-fault / defence presumptions | **Deterministic** | [packs/*/presumptions.ts](packs/), [packs/answer/defenses.ts](packs/answer/defenses.ts) |
| Plain-language + translation | **LLM (grounded)** | [lib/llm/client.ts](lib/llm/client.ts) |
| Form/letter drafting | **LLM (grounded)** | [lib/llm/client.ts](lib/llm/client.ts) |
| Citation attachment | **Deterministic** | [engine/citations.ts](engine/citations.ts) — exact id map, no vector guessing |

---

## Repo structure

```
/app          Next.js routes + UI (App Router) + /api/analyze + /api/samples
/engine       Backstop — domain-blind core: types, pipeline, date math, citation resolver,
              confidence grading, deterministic fallback. No domain logic. No `any`.
/packs/benefits  SSA overpayment RulePack (built deep — the demo hero)
/packs/answer    Debt-claim RulePack, generated per jurisdiction from a verified
                 profile (Ontario, British Columbia, California) — proves generality
                 across domains AND jurisdictions
/corpus       citation-tagged rule snippets (JSON) + combined resolver
/samples      judge's-choice synthetic notices (data; dates computed live)
/public/samples  watermarked "SAMPLE — NOT A REAL NOTICE" notice artwork
/lib/llm      Ollama client: vision extraction, grounded translation/drafting, offline fallback
/components   UI: clock, reveal panels, sample board, upload, intake
/tests        unit + golden tests for the deterministic modules (92 tests)
```

---

## Running it locally

```bash
npm install
cp .env.example .env       # adjust Ollama model names if you want live extraction
npm run dev                # http://localhost:3000
npm test                   # 92 deterministic unit + golden tests
npm run build              # production build
```

Then open `http://localhost:3000` and pick a **judge's-choice sample** — the full
pipeline runs live.

### The LLM is local and optional

Vision extraction, plain-language explanation, translation, and drafting run against
a local [Ollama](https://ollama.com) server — **no paid cloud API**. Configure in
`.env`:

```bash
OLLAMA_BASE_URL=http://localhost:11434
MODEL_EXTRACT=llama3.2-vision   # any multimodal model: qwen2.5vl, llava, granite3.2-vision …
MODEL_DRAFT=llama3.2            # any text model: qwen2.5, mistral …
```

To enable live uploads and model-polished text:

```bash
ollama pull llama3.2-vision     # reads an uploaded notice image
ollama pull llama3.2            # explanation / translation / drafting
ollama serve
```

**If Ollama is unreachable or a model is missing, the app still works.** The
judge's-choice samples ship precomputed extractions, and explanation/drafting fall
back to deterministic, citation-grounded text. Set `LLM_OFFLINE=1` to force this.
Tests never touch a model.

### Live demo (zero-setup, runs anywhere)

Because of the offline fallback, Waive deploys to any Node host (e.g. Vercel) with a
single env var and **no model** — the judge's-choice samples run end-to-end, the
deterministic engine shows its work, and the grounded Q&A answers from the corpus.

Deploy to Vercel:

1. Import the repo at [vercel.com/new](https://vercel.com/new) (framework auto-detects
   as Next.js — no extra config).
2. Set one environment variable: **`LLM_OFFLINE=1`**.
3. Deploy. The sample board, clock, remedy routing, citations, and "Ask about your
   notice" all work. *(Live image upload, EN→ES translation, and model-polished text
   need a local Ollama and so run only on a local machine.)*

`npm run build` is the build command; nothing else is required.

---

## The scalability story — add an injustice in ~5 files, zero engine changes

The engine is domain-blind. To add a new injustice you implement the
[`RulePack`](engine/types.ts) interface; you never touch `runPipeline`.

1. **`packs/<id>/`** — implement `computeDeadlines`, `routeRemedy`,
   `checkPresumptions`, the `intake` questions, and the `documents` templates.
   Keep all legal logic deterministic and citation-tagged. Reuse the engine's date
   math ([`addDays`](engine/dates.ts), `rollForwardToBusinessDay`, …).
2. **`corpus/<id>.json`** — add a citation entry per rule snippet (paraphrased
   summary in your own words, a **real verified** `officialCitation` + `sourceUrl`,
   or a clearly-marked `TODO_CITATION`). Spread it into [corpus/index.ts](corpus/index.ts).
3. **`packs/index.ts`** — `register(yourPack)`.
4. **`samples/index.ts`** — add a judge's-choice sample (and watermarked artwork in
   `public/samples/`).
5. **`tests/packs/<id>.test.ts`** — golden tests for the deadline math and each
   presumption/defence.

That's the whole story the `answer` pack tells: a different **injustice** (a debt
lawsuit) — and within it, three **jurisdictions** across two countries — run through
the identical pipeline. Each jurisdiction is a `DebtJurisdiction` profile
([packs/answer/jurisdictions.ts](packs/answer/jurisdictions.ts)) with its verified
deadline, limitation period, court/forms, and citations; `makeDebtPack(profile)`
turns it into a pack. Adding Alberta or New York is one more profile.

---

## Testing & explainability

```bash
npm test
```

- The deterministic modules have real unit + **golden** tests (fixed input → fixed
  expected derivation + citations) — the deadline engine and the presumption /
  defence checkers especially.
- Every deterministic output exposes a human-readable **derivation string**, so the
  team can explain any number on stage. "How was this deadline computed?" is a test
  case, and the UI shows the derivation under **"Show your work"**.
- Integrity routing is tested: an at-fault SSDI claimant who can pay is **not** sent
  to a waiver; an admitted Ontario debt is **not** given a manufactured defence.

---

## Citation discipline & the `TODO_CITATION` list

Every legal claim shown in the UI links to a real, verified source. We verified the
load-bearing citations against official sources:

- **SSA**: forms SSA-561 / SSA-632-BK / SSA-634 (ssa.gov), the 30-day collection
  hold, EM-25029 REV (50% Title II default, eff. 2025-04-25), and 20 CFR
  404.506–404.510 / 404.909 (the without-fault, fault, waiver, and reconsideration
  rules).
- **Ontario**: Limitations Act, 2002 (ss. 4, 5, 13), Rules of the Small Claims Court
  O. Reg. 258/98 (r. 9.01 Defence, r. 11 default), and CLPA s. 53 (assignment).
- **British Columbia**: Limitation Act, SBC 2012 (ss. 6, 24), Small Claims Rules
  B.C. Reg. 261/93 (r. 3 Reply/default), and Law and Equity Act s. 36 (assignment).
- **California**: Code of Civil Procedure §§ 412.20 (30-day response), 585 (default),
  337 (4-yr limit), 360 (acknowledgment), and the Fair Debt Buying Practices Act
  (Civ. Code §§ 1788.50–1788.52).

**Outstanding `TODO_CITATION`: none.** Every citation rendered in the UI resolves to
a real, verified source (a test enforces this — see
[tests/packs/benefits.test.ts](tests/packs/benefits.test.ts) and
[tests/packs/answer.test.ts](tests/packs/answer.test.ts)).

Two items are correct but worth a domain-expert second look before real-world use:
the COVID-19 "pandemic period" exact date bounds (`ssa-without-fault-pandemic`), and
whether the local jurisdiction/venue (Small Claims vs. Superior Court) matches the
served claim in `answer`. These are scope/precision caveats, not fabricated
citations.

---

## Status — built phase by phase, green after each

- [x] Phase 0 — Scaffold
- [x] Phase 1 — Engine core (domain-blind)
- [x] Phase 2 — `benefits` pack (deterministic, citation-backed)
- [x] Phase 3 — LLM layer (local Ollama, grounded, offline fallback)
- [x] Phase 4 — UI / transformation reveal
- [x] Phase 5 — Seed samples + judge's-choice board
- [x] Phase 6 — `answer` pack (Ontario) + cross-domain reveal
- [x] Phase 7 — Hardening + accessibility
- [x] Phase 8 — Deliverables (this README, `DEMO_SCRIPT.md`)

See [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) for the 2–3 minute walkthrough.

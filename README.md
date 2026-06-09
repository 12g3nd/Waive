# Waive

**The engine that stops people from losing by silence.**

An official notice + a short deadline + a hidden remedy the person never finds in
time → automatic loss, by silence, before anyone reviews the merits. Waive reads
the intimidating notice and routes the person to the escape hatch that already
exists, before their clock runs out.

The domain-blind engine behind Waive is codenamed **Backstop**. It is *one engine,
not two apps*: a deterministic core plus pluggable **rule packs**. We demo it deep
on benefit overpayments, then run the *same code* on a debt claim to prove it
generalizes.

> **Information and document preparation, not legal advice.** Waive is a
> force-multiplier for legal-aid orgs and advocates, not a lawyer.

---

## Why it exists — two injustices, one machine

- **Benefit overpayments (`benefits` — the hero domain).** Social Security overpays
  someone through *its own* error, then years later demands the money back. Miss the
  short window and SSA claws it back automatically — for SSDI overpayment notices
  issued on/after **April 25, 2025**, SSA withholds **50% of the monthly benefit**
  until repaid unless the person acts.
- **Debt claims (`answer` — the proof-of-generality domain).** A person is sued (often
  by a debt buyer on old debt), doesn't understand the claim or the deadline, doesn't
  file a defence, and **loses by default** — then faces garnishment, even when the debt
  was time-barred, paid, or not theirs. This build configures the `answer` pack for
  **Ontario, Canada** (Small Claims Court).

Same shape every time. Adding a new injustice is **writing a new rule pack — config,
not a rebuild.**

---

## Design principles (non-negotiable)

1. **High-stakes outputs are deterministic, not generated.** Deadlines, remedy routing,
   and auto-qualify checks are computed by tested pure functions that **show their work**.
   The LLM never decides these.
2. **The LLM is a translator, not an oracle.** It only (a) reads a notice into a schema,
   (b) explains in plain language / the user's language, (c) drafts form text. It never
   invents legal conclusions.
3. **Every legal claim carries a real citation, or it isn't shown.** Claims come from
   deterministic rule evaluations mapped to a curated corpus. We **never fabricate** a
   statute, POMS section, form number, or URL — unverified entries are marked
   `TODO_CITATION`.
4. **Integrity over engagement.** If the facts say the person genuinely owes the money or
   was at fault, we route to the honest remedy and say so — no frivolous waivers.
5. **Information, not legal advice.** Low-confidence cases and genuine judgment calls
   escalate to "have a legal-aid clinic review this."

---

## Architecture (the domain-blind pipeline)

```
upload → [LLM] extract to NoticeExtraction
       → [deterministic] DeadlineEngine.compute(extraction, pack)
       → [deterministic] RemedyRouter.route(extraction, userFacts, pack)
       → [deterministic] PresumptionChecker.evaluate(extraction, userFacts, pack)
       → [retrieval]     attach citations from corpus
       → [LLM]           plain-language explanation + draft selected form/letter
       → assemble Result (explanation, clock, routed remedy + alternatives,
                          presumption catches, drafted doc, filing checklist,
                          citations, confidence)
```

The engine knows nothing about Social Security or debt — only the `RulePack`
interface. See [`/engine`](engine/) for the core and [`/packs`](packs/) for packs.

---

## Repo structure

```
/app          Next.js routes + UI
/engine       Backstop — domain-blind core: pipeline, types, deadline/router/presumption base
/packs/benefits  SSA overpayment RulePack (built deep — the demo hero)
/packs/answer    Ontario debt-claim RulePack (built thin — proves generality)
/corpus       citation-tagged rule snippets (JSON)
/samples      seeded synthetic, watermarked notices + expected extractions
/lib/llm      Ollama client: vision extraction, translation, drafting (+ offline fallback)
/tests        unit + golden tests for the deterministic modules
```

---

## Running it locally

```bash
npm install
cp .env.example .env      # adjust Ollama model names if needed
npm run dev               # http://localhost:3000
npm test                  # deterministic unit + golden tests
```

**LLM is local & optional.** Vision extraction / translation / drafting run against a
local [Ollama](https://ollama.com) server (configure `OLLAMA_BASE_URL`,
`MODEL_EXTRACT`, `MODEL_DRAFT` in `.env`). If Ollama is unreachable the engine
**falls back to each sample's precomputed extraction and deterministic-driven draft
text**, so the full demo runs offline with zero cloud setup. Tests never call a model.

To enable live uploads:

```bash
ollama pull llama3.2-vision   # vision extraction
ollama pull llama3.2          # explanation / translation / drafting
ollama serve
```

---

## Status

Built phase by phase (see the build plan). Each phase keeps the app runnable and the
tests green.

- [x] Phase 0 — Scaffold
- [ ] Phase 1 — Engine core
- [ ] Phase 2 — `benefits` pack (deterministic)
- [ ] Phase 3 — LLM layer (Ollama)
- [ ] Phase 4 — UI / transformation reveal
- [ ] Phase 5 — Seed samples + judge's-choice board
- [ ] Phase 6 — `answer` pack (Ontario) + cross-domain reveal
- [ ] Phase 7 — Hardening
- [ ] Phase 8 — Deliverables (full README, DEMO_SCRIPT, citation TODO list)

## Outstanding citation verification

Every `TODO_CITATION` placeholder in [`/corpus`](corpus/) must be filled from an
official source before any real-world use. A running list is maintained here in
Phase 8.

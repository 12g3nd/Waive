# AI use disclosure

Per the STEMINATE Hacks 2026 rules ("Teams should disclose significant use of
AI-generated code, models, or content"), here is a complete, honest account.

## Build-time AI assistance

This project was built **during the hackathon window** with significant help from an
**AI coding assistant (Anthropic's Claude / Claude Code)**, under our direction. No
pre-existing codebase was used; the repository was created from empty and developed
across the event (see the git history — nine+ phased commits).

**What the AI assistant did:** scaffolding, most of the implementation code, the unit
and golden tests, the UI components, and the documentation drafts — guided by our
specification and our decisions.

**What we directed and own:** the product concept and architecture (a domain-blind
engine + pluggable rule packs); the key constraints we set (run on a **local Ollama
model, no paid cloud API**; configure the second domain for **Ontario, Canada**); the
non-negotiable design principles (deterministic legal logic, the AI as a bounded
translator, verified-citations-only, integrity over engagement); and the legal-source
verification.

**We can explain it.** We understand and can walk through, on request: why the
high-stakes logic is deterministic rather than AI-generated; how each deadline is
computed (pure, golden-tested date math); how the system is prevented from
hallucinating law (legal claims come from a rule → corpus-id mapping, never the
model); and how a new injustice is added (implement the `RulePack` interface; the
engine doesn't change).

## Runtime AI in the product (by design, tightly bounded)

The product itself uses AI **only as a translator, never as an oracle**:

- **Vision extraction** — a local model reads an uploaded notice image into a
  structured schema (`lib/llm/extraction.ts`).
- **Plain-language explanation + EN/ES translation + form drafting** — the
  deterministic result is built first, and the model is only allowed to **rephrase
  and translate** it, never to add a legal claim (`lib/llm/client.ts`).
- **Grounded Q&A** — answers are retrieved from the curated, verified citation corpus
  and grounded strictly in those entries (`lib/qa.ts`).

The model runs **locally via Ollama** (no paid cloud API). If it is unavailable,
everything degrades gracefully to deterministic, citation-grounded behavior, so the
demo runs fully offline.

## Legal-content integrity

Every legal claim shown is mapped to a curated citation corpus and was **verified
against official sources** (ssa.gov, 20 CFR via Cornell LII, SSA EM-25029 REV,
Ontario e-Laws / O. Reg. 258/98 / Limitations Act, 2002). There are **no fabricated
citations**; the corpus currently contains **zero `TODO_CITATION`** placeholders, and
a test enforces it. Waive is positioned throughout as **information and document
preparation, not legal advice.**

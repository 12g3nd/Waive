# Waive — stop losing by silence

*STEMINATE Hacks 2026 · AI × Social Good · Equity & Justice*

## The problem

Every day, people lose legal and financial fights they could have won — not on the
merits, but by **silence**. An intimidating official notice arrives with a short
deadline and a remedy buried in fine print the person never finds in time. Two
examples of the same machine:

- **Benefit overpayments.** Social Security overpays someone through *its own* error,
  then years later demands it back. For SSDI overpayment notices issued on/after
  **April 25, 2025**, SSA automatically withholds **50% of the monthly benefit**
  unless the person acts in time (EM-25029 REV) — half a disabled person's check,
  gone, over a mistake they didn't make.
- **Debt lawsuits.** A debt buyer sues on old debt; the person doesn't understand the
  summons or the deadline, doesn't respond, and **loses by default** — then faces
  garnishment, even when the debt was time-barred, paid, or not theirs.

Same shape every time: **notice + short deadline + hidden remedy → automatic loss,
before anyone reviews the merits.**

## The solution

**Waive** reads the notice and routes the person to the escape hatch that already
exists, before their clock runs out. Its domain-blind engine, **Backstop**, is *one
engine, not many apps*: a deterministic core plus pluggable **rule packs**.

The non-negotiable design — and the reason it's trustworthy:

1. **High-stakes outputs are deterministic, not generated.** Deadlines, remedy
   routing, and "do you auto-qualify" checks are computed by tested, pure functions
   that **show their work**. The AI never decides them.
2. **The AI is a translator, not an oracle.** It reads a messy notice into structured
   data, explains in plain language (EN/ES, with read-aloud), drafts the form, and
   answers grounded questions — but never invents a legal conclusion.
3. **Every legal claim carries a real, verified citation, or it isn't shown.** Zero
   fabricated statutes; every claim links to its source (ssa.gov, 20 CFR, Ontario
   e-Laws).
4. **Integrity over engagement.** If the person genuinely owes it, Waive routes to the
   honest path and says so — no frivolous waivers, no manufactured defences.

We demo it deep on SSA overpayments, then run the **same code** on an Ontario debt
lawsuit — a different country *and* injustice — to prove it generalizes. Adding an
injustice is writing a rule pack: config, not a rebuild.

## Social impact

Legal aid is desperately under-resourced; most people facing these notices never see
a lawyer. Waive is a **force-multiplier for legal-aid orgs and advocates** — it turns
a dread-inducing letter into a countdown clock, a routed remedy, a pre-filled form,
and a filing checklist, in minutes, for free, running on a **local model with no
cloud**. It is *information and document preparation, not legal advice*, and it
escalates genuine judgment calls to a human clinic.

The thesis is one sentence: **nobody should lose by silence.** Waive makes the hidden
remedy visible before the deadline passes.

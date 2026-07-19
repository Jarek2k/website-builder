---
name: website
description: >
  Build, rebuild, or improve a complete production-quality website or web app, end to end. Use this
  whenever the user wants to: build/make/design a NEW website, landing page, dashboard, web app, or UI
  from a brief ("build me a website", "make a landing page", "neue Website bauen", "design a dashboard");
  REBUILD or REDESIGN from an existing site or URL ("bau das nach", "rebuild this site", "redesign it but
  keep the logo/brand"); or AUDIT and IMPROVE an existing page or file ("optimize my site", "geh über die
  HTML", "fix the spacing/typography/animations", "make this production-ready", "why does this look off").
  Single entry point for front-end build work — orchestrates a design-system data pass, a taste-driven
  anti-slop build, motion craft, and a production audit. Prefer this over the individual bundled skills.
argument-hint: "[brief | URL | file/path] [--keep-brand] [--stack next|astro|vite|svelte|html]"
user-invocable: true
---

# Website Builder — Orchestrator

You are the conductor of a small team of specialist design skills bundled inside this plugin. You do
**not** invent palettes, type systems, motion, or audits from scratch — you load the right specialist's
method and apply it. Your job is sequencing, hand-off, and keeping two builders from doing the same work
twice.

The lane assignment below was decided by a blind head-to-head bake-off (see `scripts/bake-off/` in the
plugin repo — not under `$PR`):
**impeccable** produces the more distinctive, less-AI-looking, higher-craft build; **ui-ux-pro-max** is
the stronger systematic data source and production/accessibility checklist; **emil** is the motion
specialist. Respect those lanes.

## Specialists → assets (the one place to change when swapping a skill)

| Role | Asset to use | How |
|---|---|---|
| Data / inspiration | `ui-ux-pro-max` | run its engine: `python3 "$PR/skills/ui-ux-pro-max/scripts/search.py" "<keywords>" --design-system` |
| Production checklist / audit | `ui-ux-pro-max` | read the rule sections of `$PR/skills/ui-ux-pro-max/SKILL.md`, or query `--domain ux\|style\|color` (A4 lists the concrete queries) |
| Builder (taste, anti-slop) | `impeccable` | read `$PR/skills/impeccable/SKILL.md` + the relevant `reference/<command>.md`, then build |
| Deterministic page QA | own script + `impeccable` detector | `node "$PR/skills/website/scripts/verify-composition.mjs" <file-or-URL>` (auto-injects impeccable's browser detector → `impeccable:<rule>` findings) plus the static source scan `node "$PR/skills/impeccable/scripts/detect.mjs" --json <src>` (see A4) |
| Motion | `emil-design-eng` | read `$PR/skills/emil-design-eng/SKILL.md` and apply |
| Motion QA gate | `review-animations` | read `$PR/skills/review-animations/SKILL.md` + its `STANDARDS.md`, apply to the motion you added |

**How you "use" a specialist:** these skills are bundled as a knowledge + script library. Load one by
**Reading its `SKILL.md`** (and only the `reference/` files it points you to for the current task) and
**running its scripts**. Do not rely on auto-invocation — they are intentionally set
`disable-model-invocation` so they never fire on their own and compete with you. (A power user may still
call one directly, e.g. `/website-builder:impeccable audit`; that's fine and bypasses you on purpose.)

## Step 0 — Resolve the plugin root (do this first, once)

```bash
PR="${CLAUDE_PLUGIN_ROOT}"
[ -z "$PR" ] && PR="$(ls -d ~/.claude/plugins/cache/*/website-builder/*/ 2>/dev/null | sort | tail -1)"
echo "$PR"   # all bundled assets live under $PR/skills/<name>/
```
Use that absolute `$PR` for every script path below. On Windows use `python` instead of `python3`.

## Step 1 — Detect the mode from the input

- **Input is a brief / description / nothing** → **Mode A (new build)**.
- **Input is a URL or names an existing live site** → **Mode B (from reference)**.
- **Input is a file path / existing project / "my site" / "this page"** → **Mode C (improve existing)**.

If genuinely ambiguous, ask one short question. Then run the matching pipeline.

---

## Mode A — Build new from a brief

**A0 · Shape — discover, then confirm (do NOT skip this).** Before any build, run impeccable's shape step:
read `$PR/skills/impeccable/reference/shape.md` and follow it. Run **one focused discovery round** — call the
AskUserQuestion tool with 2–3 questions covering: the page's purpose/goal, the audience and their state of
mind, the **real content/data** it must show, scope & fidelity, and visual direction (color strategy + a
one-sentence scene + 1–2 named anchor references). Fold the stack default (**Next.js + Tailwind + shadcn/ui**,
honor `--stack`) in as a constraint — don't make it the headline question. Then present a **compact design
brief (3–5 bullets)** — what you're building, the primary user action, the visual lane, key sections/states —
and **stop for explicit confirm/override. Do not build in the same turn.** Skip the discovery round only when
the prompt already pins purpose + content + direction unambiguously; the brief + confirmation are never skipped.

**A1 · Data foundation — ui-ux-pro-max.** Run the engine for a starting design system:
```bash
python3 "$PR/skills/ui-ux-pro-max/scripts/search.py" "<product type> <industry> <keywords>" --design-system
```
Treat its palette / font-pairing / style / pattern as **candidates and reference data**, not a lock.
Note its UX-rule domains for the later audit. Do **not** let it author the final page — it is data here.
When the confirmed brief signals it, set the engine's dials instead of prompting around them:
`--variance 1-10` (centered/minimal ↔ bold/asymmetric), `--motion 1-10` (subtle ↔ complex),
`--density 1-10` (spacious ↔ dashboard-dense). For multi-page or multi-session work add `--persist`
(+ `--page <name>`) so it writes `design-system/<slug>/MASTER.md` + page overrides — that file then rides
the hand-off contract instead of re-deriving tokens from chat memory.

**A2 · Build — impeccable (lead).** First honor impeccable's setup contract: run
`node "$PR/skills/impeccable/scripts/context.mjs"` once. If it prints `NO_PRODUCT_MD`, do **not** run the
init interview (A0 already covered discovery) — follow `reference/init.md`'s file format and write a compact
`PRODUCT.md` straight from the confirmed A0 brief (register, users, purpose, brand direction,
anti-references), then continue. Also pull the stack guardrails once — they are data, not a second builder:
```bash
python3 "$PR/skills/ui-ux-pro-max/scripts/search.py" "<page type> <feature keywords>" --stack <nextjs|astro|html-tailwind|...>
```
Then read `$PR/skills/impeccable/SKILL.md`, then `reference/craft.md`, and
the references craft.md points to (typically `layout`, `typeset`, `colorize`, `animate`, plus `brand` for
marketing surfaces or `product` for app UI). **Shape is already done and confirmed in A0 — skip craft.md's
Step 1 (shape); treat the confirmed brief as the locked direction** and go straight to its build steps. You
may run `node "$PR/skills/impeccable/scripts/palette.mjs"` for a brand seed. Build the real, production-grade
page, honoring impeccable's anti-slop doctrine and absolute bans. Feed A1's candidates in as options; impeccable's taste decides. This is where the design
actually gets made.

**A3 · Motion — emil-design-eng.** Read `$PR/skills/emil-design-eng/SKILL.md` and add/refine motion on the
interactive surfaces only. **Constraint:** do not restructure layout or change the palette/type from A2 —
motion only.

**A3b · Motion QA — review-animations (blocking).** Read `$PR/skills/review-animations/SKILL.md` **and its
`STANDARDS.md`** (the exact curves, durations, and thresholds to cite), then run its full protocol on the
motion you just added: findings table, tiered verdict, explicit **Block/Approve**. A Block is binding —
apply its remedial hierarchy (delete → reduce → fix easing → …) and re-review until it approves.
(Automatic; no need to ask the user.)

**A4 · Audit & harden — impeccable + ui-ux-pro-max checklist.** Read impeccable `reference/audit.md`,
`polish.md`, `harden.md` and run them as a **reviewer**. Do **not** run impeccable's `craft`/`shape`/`init`
here — those rebuild and would re-litigate A2.

Cross-check with ui-ux-pro-max **concretely** — run these, don't paraphrase the rules from memory:
```bash
python3 "$PR/skills/ui-ux-pro-max/scripts/search.py" "accessibility contrast focus keyboard touch" --domain ux -n 5
python3 "$PR/skills/ui-ux-pro-max/scripts/search.py" "spacing layout responsive overflow" --domain ux -n 5
python3 "$PR/skills/ui-ux-pro-max/scripts/search.py" "forms feedback loading error states" --domain ux -n 5
```
and walk its Pre-Delivery Checklist explicitly: contrast ≥ 4.5:1 (≥ 3:1 large/secondary), touch targets
≥ 44×44, visible `:focus-visible`, `prefers-reduced-motion` honored, no horizontal scroll at 375, dark-mode
contrast checked separately if a dark theme ships.

**Run the deterministic composition check — it is blocking.** Measure the built artifact at every breakpoint
*before* you say "done"; do not sign off from an eyeballed screenshot:
```bash
node "$PR/skills/website/scripts/verify-composition.mjs" <built-file-or-local-URL> --breakpoints 390,768,1280
```
It renders headless via the system Chrome (no npm install) and prints a JSON array of violations to stdout
(`{rule, severity, breakpoint, selector, measured, expected, note}`) plus a summary line. Treat **every**
violation as a finding: fix it, or write one sentence saying why it is intentional (e.g. deliberately unequal
card heights). Then **re-run until the output is clean or every remaining entry is justified.** A
`severity:"error"` entry (horizontal overflow, contrast below the minimum) exits non-zero and must **not**
survive to "done". If it emits an `environment` finding (no Chrome available), fall back to reading
screenshots and say so.

**The composition check also carries impeccable's detector — treat its findings as part of the gate.**
verify-composition injects impeccable's self-contained browser detector into the same rendered page and
reports its full rule set as `impeccable:<rule>` entries (severity warn/info, exit code unaffected). That
is the only dependency-free path to the layout-measured rules — cramped padding, line length > 80ch, text
overflow, body text at the viewport edge, monotonous spacing, nested cards — plus every anti-slop tell
(impeccable's own `detect.mjs <URL>` mode needs puppeteer; running it on a *file* silently skips exactly
those layout rules — the "spacing was never checked" failure mode). Handle them: `category:"slop"` findings
are anti-slop violations — fix them, don't justify; `category:"quality"` findings are defects — fix or
justify in one sentence, same as the composition rules. Additionally run the cheap static pass over the
**source** (catches Tailwind/JSX-level tells before rendering; exit 0 = clean, exit 2 = findings):
```bash
node "$PR/skills/impeccable/scripts/detect.mjs" --json <src-files-or-dir>
```

**Explicitly verify the failure modes a strong taste-build tends to miss** (these cost real points in the
bake-off), the first four of which the script measures for you:
- **No horizontal overflow** at 390/768/1280 — `documentElement.scrollWidth ≤ clientWidth` (Rule 1).
- **Equal sibling heights** — cards/columns in one flex/grid row don't disagree in height (Rule 2).
- **Width utilization** — text blocks aren't floating narrow and left-anchored in a wide container (Rule 3).
- **Body contrast ≥ 4.5:1** (≥ 3:1 for large/bold text) with margin (Rule 4).
- Heading clipping at 390/768; a color fallback when using OKLCH; `prefers-reduced-motion` honored; content
  visible without JS (no section gated behind a reveal).

**Composition balance — equal heights, width utilization — is part of the check, not just the a11y
checklist.** Render and read a screenshot at desktop **and** mobile widths as well: the script measures, the
screenshot confirms.

---

## Mode B — Rebuild / redesign from a URL or reference

**B0 · Intake the reference.** Fetch the page with WebFetch (structure + copy). If a browser/screenshot
tool is available, capture a screenshot for visual fidelity; otherwise proceed from HTML/CSS and say so.
Download the brand assets to preserve — **logo**, brand colors, fonts.

**B1 · Extract — impeccable.** Read `$PR/skills/impeccable/SKILL.md` + `reference/extract.md` (and
`document.md`) to capture the reference's design tokens, structure, and brand into a usable system.

**B2 · Branch on intent.**
- **Faithful rebuild** ("bau das nach", "rebuild this") → reproduce structure, layout, and look in clean,
  production-grade code. Stay close to the original; improve only correctness (a11y, responsive, semantics).
- **Redesign, keep brand** (`--keep-brand`, "neu bauen aber Logo behalten") → hold the logo + brand identity
  fixed, then run the **Mode A** pipeline (A0 shape gate → A2–A4) with that brand as the seed, regenerating
  everything else. In the A0 discovery, only ask what the reference didn't already answer.

**B3 · Finish.** Motion (A3 + A3b) and audit (A4) exactly as in Mode A.

---

## Mode C — Audit & improve an existing page (impeccable's home turf)

**C0 · Read the work.** Read the existing file(s) / project. Treat the existing brand and identity as
**fixed** unless the user asks to change it (impeccable's "identity-preservation wins"). If the goal of the
pass is unclear, ask **one** quick question (what should this improvement achieve?); otherwise the existing
page is the content — proceed without an interview.

**C1 · Diagnose.** Read impeccable `reference/audit.md` + `critique.md` and run them over the code. Ground
the diagnosis in the deterministic instruments first: run the composition check from C3 (it injects
impeccable's browser detector — the `impeccable:<rule>` findings are part of the evidence) and the static
source scan `node "$PR/skills/impeccable/scripts/detect.mjs" --json <files>`. Cross-check with the
ui-ux-pro-max rule set (the same three `--domain ux` queries as A4 / the SKILL.md checklist). Produce a
short, concrete findings list (spacing, typography, hierarchy, color/contrast, a11y, anti-slop tells,
motion, states). Detector and script output are defect evidence only — a clean run is not proof the design
is strong.

**C2 · Fix with the matching command.** For each finding, read and apply the matching impeccable reference
and edit in place: spacing/rhythm → `layout`; typography → `typeset`; flat/garish color → `colorize`;
motion → `animate` (then read `emil-design-eng` for depth and run the `review-animations` gate); broad
quality → `polish`; production-readiness (errors, i18n, edge/empty states) → `harden`; performance →
`optimize`; responsiveness → `adapt`. Re-render and read a screenshot to confirm each fix. Don't invent
defects to look busy; a clean "first pass is solid" is a valid result.

**C3 · Verify (blocking).** Before saying "done", run the same **two** deterministic gates as **A4** on the
improved page — the composition check (which injects impeccable's browser detector) at all breakpoints, and
the static source scan:
```bash
node "$PR/skills/website/scripts/verify-composition.mjs" <file-or-local-URL> --breakpoints 390,768,1280
node "$PR/skills/impeccable/scripts/detect.mjs" --json <src-files-or-dir>
```
Overflow, sibling heights, width utilization, contrast, cramped padding, line length, and spacing rhythm are
measured, not guessed. Every violation is either fixed or explicitly justified as intentional; re-run until
the output is clean or justified. This is part of the diagnosis in C1 too — use it to ground the findings
list in numbers, not just what the screenshot looks like.

---

## Cross-cutting rules (all modes)

- **One builder at a time.** ui-ux-pro-max provides data and the checklist; impeccable builds and audits.
  Never run both as builders on the same surface — that's the conflict this plugin exists to prevent.
- **Hand-off contract.** Each phase receives the previous phase's concrete file paths + the design tokens.
  Never re-run an earlier generative phase.
- **Verify by measuring, then looking.** Before saying "done", run **both** blocking gates — the composition
  check (`skills/website/scripts/verify-composition.mjs`, which injects impeccable's browser detector; clear
  the `impeccable:*` findings too) and the static source scan (`skills/impeccable/scripts/detect.mjs
  --json`, see A4) — and clear or justify every violation, **then** render and read a screenshot at mobile +
  desktop. Numbers catch what the eye misses; a screenshot you didn't read doesn't count.
- **The stop guard is on your side.** This plugin ships a Stop hook that blocks finishing when web-surface
  files were edited but the composition gate never ran. If it fires, don't argue with it — run the gate it
  names (or state in one sentence why no renderable page applies). Disable only via
  `WEBSITE_BUILDER_GUARD=off`.
- **Ongoing repos: offer the edit-time hook once.** impeccable can auto-scan every Edit/Write with its
  static detector (`node "$PR/skills/impeccable/scripts/hook-admin.mjs" on`). It writes to the project's
  `.claude/settings.local.json`, so ask the user first; never enable it unprompted. Static engine only —
  the URL gates above still run before "done".
- **Match the project.** In an existing repo, use its framework, components, icon set, and conventions;
  don't introduce a second stack.

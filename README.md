# website-builder

A Claude Code plugin that turns "build me a website" into one command. Describe
what you want and it produces a real, production-grade page — design system,
build, motion, and an anti-slop audit — without you installing or invoking a
single design skill by hand.

## How it works

One orchestrator skill, **`website`**, is the single entry point. It doesn't
invent palettes, type, or motion itself — it sequences three bundled specialist
skills and hands work between them so two builders never do the same job twice:

| Skill | Its job in the pipeline |
|---|---|
| **[impeccable](https://github.com/pbakaus/impeccable)** | the lead builder — taste-driven, anti-AI-slop craft + the final audit |
| **[ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)** | design-system data (161 palettes, font pairings, 99 UX rules) + the production/accessibility checklist |
| **[emil-design-eng](https://github.com/emilkowalski/skills)** | motion & micro-interactions, with a `review-animations` QA gate |

The specialists are kept out of autonomous routing, so only `website` fires on a
request and loads each specialist on demand. This lane split was decided by a
blind head-to-head bake-off; the mechanics live in
[`docs/maintaining.md`](docs/maintaining.md).

## Install

The way that works **everywhere** — including the VS Code / JetBrains extensions,
where the in-app `/plugin` command is disabled — is the terminal CLI:

```bash
claude plugin marketplace add Jarek2k/website-builder
claude plugin install website-builder@jarek-plugins
```

Then reload your editor (VS Code: **Cmd/Ctrl+Shift+P → "Developer: Reload
Window"**). Verify with `claude plugin list`. Update later with
`claude plugin update website-builder@jarek-plugins`.

Requirements: `python3` and `node` (both usually present). A browser/Playwright
MCP is optional but improves URL rebuilds and visual checks.

## Use it

Just describe what you want — the orchestrator picks the mode automatically:

```text
# New build from a brief
"Build me a landing page for a calm voice-notes second-brain app."

# Rebuild / redesign from a reference
"Rebuild https://example.com but cleaner."
"Redesign this site but keep our logo and brand colors." (--keep-brand)

# Audit & improve an existing page
"Go over ./index.html — fix the spacing, typography, and animations."
```

Three modes, picked from your input:

- **New** — from a brief → shape & confirm, then data → build → motion → audit.
- **From a reference** — from a URL or site → fetch & extract, then a faithful
  rebuild *or* a redesign that keeps the brand → motion → audit.
- **Improve** — from a file or project → diagnose, then targeted fixes in place.

You can still call any bundled skill directly, e.g.
`/website-builder:impeccable audit`.

## Credits & licenses

This plugin **vendors** the upstream skills; each keeps its own license (copies in
[`third_party/`](third_party/), summarized in [`NOTICE`](NOTICE)): ui-ux-pro-max
(MIT), emil-design-eng (MIT), impeccable (Apache-2.0). All credit for the design
intelligence belongs to their authors. The orchestrator and tooling here are MIT.

---

Maintaining, extending, or forking this plugin? See
[`docs/maintaining.md`](docs/maintaining.md) for the upstream-sync automation, how
to add/swap a skill, and how conflicts between the bundled builders are prevented.

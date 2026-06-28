# website-builder

A Claude Code plugin that turns "build me a website" into one command. It bundles
three best-in-class design skills and **orchestrates** them so you don't have to
install or invoke them by hand in every project:

- **[ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)** — design-system data engine (161 palettes, font pairings, product-type reasoning, 99 UX rules) + production/accessibility checklist.
- **[impeccable](https://github.com/pbakaus/impeccable)** — the lead builder: a taste-driven, anti-AI-slop craft + audit engine.
- **[emil-design-eng](https://github.com/emilkowalski/skills)** — motion & micro-interaction craft (+ a `review-animations` QA gate).

One orchestrator skill (`website`) is the single entry point; the three builders are
kept out of autonomous routing so they never fight over a request. The lane split
(impeccable builds, ui-ux-pro-max provides data + audits, emil does motion) was
decided by a blind head-to-head bake-off — see [`scripts/bake-off/`](scripts/bake-off/README.md).

## Install

Run these two commands in Claude Code (replace `Jarek2k` with this repo's GitHub owner):

```text
/plugin marketplace add Jarek2k/website-builder
/plugin install website-builder
```

That's it — **you never type your own name anywhere.** The only name in there is the
repo's GitHub address (where the code lives, like a `git clone` URL).

<details><summary>Why are there a couple of names? (the three layers)</summary>

| You see | What it is |
|---|---|
| `Jarek2k/website-builder` | the **GitHub repo address** (`owner/repo`) — only used by `marketplace add`. Same for everyone. |
| `jarek-plugins` | the **marketplace** (catalog) name — written once in this repo's `marketplace.json`, read automatically. You normally never type it. |
| `website-builder` | the **plugin** (the actual tool) — what you install and use. |

If the plugin name ever clashes with another installed plugin, disambiguate with
`/plugin install website-builder@jarek-plugins`. Otherwise the short form above is all you need.
</details>

Requirements on your machine: `python3` and `node` (both usually present). A
browser/Playwright MCP is optional but improves the URL-rebuild mode and visual checks.

## Use it

Just describe what you want — the orchestrator picks the mode automatically:

```text
# New build from a brief
"Build me a landing page for a calm voice-notes second-brain app."

# Rebuild / redesign from a reference
"Rebuild https://example.com but cleaner."
"Redesign this site but keep our logo and brand colors." (--keep-brand)

# Audit & improve an existing page
"Go over ./index.html — fix the spacing, typography, and animations, make it production-ready."
```

Three modes, one skill:

| Mode | Trigger | Pipeline |
|---|---|---|
| **A — New** | a brief | data (ui-ux-pro-max) → build (impeccable) → motion (emil) → motion-QA → audit |
| **B — Reference** | a URL/site | fetch + extract → faithful rebuild *or* redesign-keep-brand → motion → audit |
| **C — Improve** | a file/project | diagnose (impeccable + ui-ux-pro-max checklist) → targeted fixes in place |

You can still call any bundled skill directly, e.g. `/website-builder:impeccable audit`.

## Updates

The vendored skills are kept current automatically: a weekly GitHub Action
([`.github/workflows/sync.yml`](.github/workflows/sync.yml)) re-vendors each upstream
at the ref pinned in [`upstreams.json`](upstreams.json), re-patches, bumps the version,
and commits. **You** get updates with:

```text
/plugin marketplace update
```

To jump to a newer upstream **release**, bump its `ref` in `upstreams.json` and run
`bash scripts/sync-upstreams.sh` (the Action re-vendors the pinned ref; it doesn't move
pins on its own).

## Extend it (add / swap / remove a skill)

Everything is data-driven via [`upstreams.json`](upstreams.json):

- **Add** a skill → add one entry (repo, ref, source subpath, role, license, patch directives).
- **Swap** a skill → change its entry + repoint the role row in the orchestrator's table.
- **Remove** → delete the entry.

Then `bash scripts/sync-upstreams.sh`. The sync + [`patch-frontmatter.py`](scripts/patch-frontmatter.py)
scripts contain no skill-specific code, so most additions need zero code. To decide
*whether* a new builder is actually better than the current one, run the reusable
[bake-off harness](scripts/bake-off/README.md).

## How conflicts are prevented

Each vendored skill is patched to `disable-model-invocation: true`, so only the
`website` orchestrator auto-fires; the specialists are loaded by it on demand (it reads
their `SKILL.md` + runs their scripts). Hard-coded `.claude/skills/...` paths are
rewritten to `${CLAUDE_PLUGIN_ROOT}/...` during vendoring. impeccable's always-on
anti-slop hook and browser "live" mode are intentionally not wired (the audit phase
covers quality; the live mode needs a running browser).

## Credits & licenses

This plugin **vendors** the upstream skills; each keeps its own license (copies in
[`third_party/`](third_party/), summarized in [`NOTICE`](NOTICE)):
ui-ux-pro-max (MIT), emil-design-eng (MIT), impeccable (Apache-2.0). All credit for the
design intelligence belongs to their authors. The orchestrator and tooling here are MIT.

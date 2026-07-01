# Maintaining website-builder

Notes for whoever owns or forks this plugin. Regular users don't need any of
this — see the [README](../README.md) to install and use it.

## How conflicts are prevented

The plugin bundles three independent design skills that, on their own, would all
try to answer "build me a website" and fight over the request. The orchestration
keeps them in lanes:

- Each vendored skill is patched to `disable-model-invocation: true`, so only the
  `website` orchestrator auto-fires. The specialists are loaded by it on demand —
  it reads their `SKILL.md` and runs their scripts.
- Hard-coded `.claude/skills/...` paths are rewritten to `${CLAUDE_PLUGIN_ROOT}/...`
  during vendoring.
- impeccable's always-on anti-slop hook and browser "live" mode are intentionally
  not wired up: the audit phase covers quality, and the live mode needs a running
  browser.

The lane split (impeccable builds, ui-ux-pro-max provides data + audits, emil does
motion) was decided by a blind head-to-head bake-off — see
[`scripts/bake-off/`](../scripts/bake-off/README.md).

## First-party orchestrator code

The `website` skill is **not** vendored — it is this repo's own orchestrator. Any
tooling the orchestrator itself runs lives under
[`plugin/skills/website/scripts/`](../plugin/skills/website/scripts/README.md) and
is safe there: `sync-upstreams.sh` only `rm -rf`s the vendored skill targets, so a
file placed inside a vendored skill (e.g. `plugin/skills/impeccable/`) would be
wiped on the next upstream bump. Keep first-party scripts out of the vendored dirs.

The deterministic composition check (`verify-composition.mjs`) lives here and is
wired into the audit steps (Mode A · A4, Mode C · C3) as a blocking gate. It has
its own zero-dependency test suite:

```bash
node --test 'plugin/skills/website/scripts/test/*.test.mjs'
```

## Keeping upstreams current

**Upstream skills → this repo (automatic, PR-based).** A weekly GitHub Action
([`.github/workflows/sync.yml`](../.github/workflows/sync.yml)) checks each bundled
skill for a newer release (per the `update` policy in
[`upstreams.json`](../upstreams.json)). If there is one it bumps the pin,
re-vendors + re-patches, bumps the plugin version, and **opens a pull request**
with a changelog — nothing lands unreviewed. If nothing is newer, it does nothing.

> One-time: in **Settings → Actions → General → Workflow permissions**, enable
> *"Read and write permissions"* and *"Allow GitHub Actions to create and approve
> pull requests"* so the Action can open PRs.

To bump a pin yourself: `python3 scripts/check-upstreams.py` (resolves the latest
refs) or edit `upstreams.json` directly, then `bash scripts/sync-upstreams.sh --bump`.

## Extending it (add / swap / remove a skill)

Everything is data-driven via [`upstreams.json`](../upstreams.json):

- **Add** a skill → add one entry (repo, ref, source subpath, role, license, patch
  directives).
- **Swap** a skill → change its entry + repoint the role row in the orchestrator's
  table.
- **Remove** → delete the entry.

Then `bash scripts/sync-upstreams.sh`. The sync +
[`patch-frontmatter.py`](../scripts/patch-frontmatter.py) scripts contain no
skill-specific code, so most additions need zero code. To decide *whether* a new
builder is actually better than the current one, run the reusable
[bake-off harness](../scripts/bake-off/README.md).

## The names you'll see

You never type your own name anywhere. The only name you supply is the repo
address `Jarek2k/website-builder` (where the code lives, like a `git clone` URL).

| You see | What it is |
|---|---|
| `Jarek2k/website-builder` | the **GitHub repo address** (`owner/repo`) — only used by `marketplace add`. Same for everyone. |
| `jarek-plugins` | the **marketplace** (catalog) name — declared in this repo's `marketplace.json`, read automatically. |
| `website-builder` | the **plugin** (the actual tool) — what you install and use. |

`website-builder@jarek-plugins` just means "the `website-builder` plugin from the
`jarek-plugins` catalog".

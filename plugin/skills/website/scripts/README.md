# website orchestrator scripts

First-party tooling owned by the `website` orchestrator. Unlike the specialist
skills (`impeccable`, `ui-ux-pro-max`, …), this directory is **not** vendored
from an upstream, so it survives `scripts/sync-upstreams.sh` and is the right
home for checks the orchestrator itself runs.

## verify-composition.mjs

A deterministic UI composition checker. It renders a target headless and reports
layout defects with hard numbers, so the audit step (Mode A · A4, Mode C · C3)
catches what an eyeballed screenshot misses.

```bash
node verify-composition.mjs <file-or-url> [--breakpoints 390,768,1280]
node verify-composition.mjs --target ./dist/index.html -b 390,1280
```

**Checks** (thresholds are named constants at the top of the file):

| Rule | id | severity | what it catches |
|---|---|---|---|
| 1 | `horizontal-overflow` | error | `documentElement.scrollWidth > clientWidth` (+ the offending selectors) |
| 2 | `unequal-sibling-heights` | warn | cards/columns in one flex/grid row that differ > 4% **and** > 8px in height |
| 3 | `text-width-utilization` | info | a text block floating narrow (< 55%) and left-anchored in a wide (> 480px) container |
| 4 | `contrast` | error | effective text vs background below WCAG AA (4.5:1 normal, 3:1 large/bold) |

**Output.** A JSON array to **stdout** — one entry per violation
`{rule, severity, breakpoint, selector, measured, expected, note}` — and a
human-readable summary to **stderr**. Exit codes:

- `0` — rendered, no `error`-severity violations (warn/info are non-blocking)
- `1` — rendered, at least one `error`-severity violation
- `2` — could **not** render (no Chrome, launch/navigation failure); emits a
  single `environment` finding and a clear message instead of crashing

**Rendering.** Drives the **system Chrome/Chromium** directly over the Chrome
DevTools Protocol using Node's built-in `WebSocket`/`fetch` — no `puppeteer`, no
npm install, no bundle. Chrome is discovered from `VERIFY_COMPOSITION_CHROME` /
`CHROME_PATH` / `PUPPETEER_EXECUTABLE_PATH`, then platform defaults, then `PATH`.
Reveal-on-scroll content (IntersectionObserver / `opacity:0` transitions) is
forced visible and the page is scrolled through before measuring, so gated
sections are measured rather than read as empty.

Requires Node 18+ (global `fetch`/`WebSocket`) and a Chrome/Chromium install.

## Tests

Zero-dependency, `node:test` + `node:assert`, driving the real script over the
fixtures in `test/fixtures/`. The suite skips itself cleanly when no Chrome is
available.

```bash
node --test 'plugin/skills/website/scripts/test/*.test.mjs'
```

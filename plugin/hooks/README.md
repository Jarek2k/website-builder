# website-builder guard hooks

Harness-enforced verification guard. Ships with the plugin and is active for
every user with the plugin enabled — enforcement lives in the harness, not in
the model's diligence.

| File | Event | Job |
|---|---|---|
| `guard-track.mjs` | `PostToolUse` (Edit\|Write\|MultiEdit\|Bash) | records web-surface file edits (`.html/.jsx/.tsx/.vue/.svelte/.astro/.css/…`) and `verify-composition.mjs` runs in a session state file under the OS temp dir |
| `stop-guard.mjs` | `Stop` | blocks finishing **once** when web files were edited but the composition gate has not run since — with a reason naming the files and the exact command |

**Safety valves** (both scripts fail open on any error):

- at most one block per edit set — a block is recorded in the state; without
  *new* edits it never re-blocks (independent of `stop_hook_active`, which is
  honored too when present)
- the block reason offers a one-sentence out when no renderable page applies
  (email fragment, deleted file, …)
- kill switch: `WEBSITE_BUILDER_GUARD=off`
- state auto-prunes after 48 h; nothing is written outside the OS temp dir

Test locally by piping hook-event JSON:

```bash
echo '{"session_id":"s1","tool_name":"Edit","tool_input":{"file_path":"/x/index.html"}}' \
  | node plugin/hooks/guard-track.mjs
echo '{"session_id":"s1"}' | node plugin/hooks/stop-guard.mjs   # → {"decision":"block",...}
```

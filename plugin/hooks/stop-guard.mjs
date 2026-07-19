#!/usr/bin/env node
/**
 * stop-guard — Stop hook enforcing the website-builder verification gate.
 *
 * If web-surface files were edited this session (tracked by guard-track.mjs)
 * and verify-composition.mjs has NOT run since the last such edit, block the
 * stop once with a reason telling the model to run the gate. Harness-enforced:
 * "forgot to verify" becomes impossible rather than merely unlikely.
 *
 * Safety valves:
 *   - stop_hook_active true (we already blocked once) → always allow. No loops.
 *   - own loop-breaker independent of that field: a block is recorded in the
 *     state file, and without NEW edits since the last block we never block
 *     again — at most one block per edit set, whatever the harness sends.
 *   - the reason offers a one-sentence out when no page artifact applies.
 *   - WEBSITE_BUILDER_GUARD=off disables the guard entirely.
 *   - any error → fail open (exit 0).
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  if (process.env.WEBSITE_BUILDER_GUARD === 'off') return;
  const input = JSON.parse(await readStdin());
  if (input.stop_hook_active) return; // already blocked once — never loop
  const sessionId = input.session_id;
  if (!sessionId || !/^[\w.-]+$/.test(sessionId)) return;

  const stateFile = path.join(os.tmpdir(), 'website-builder-guard', `${sessionId}.json`);
  let state;
  try {
    state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch {
    return; // no web edits tracked this session
  }
  const lastEdit = state.lastEdit || 0;
  const lastVerify = state.lastVerify || 0;
  if (!lastEdit || lastVerify >= lastEdit) return;
  if ((state.lastBlock || 0) >= lastEdit) return; // already blocked for this edit set — never twice

  const pending = Object.entries(state.editedFiles || {})
    .filter(([, ts]) => ts > lastVerify)
    .map(([file]) => file)
    .slice(0, 5);
  if (pending.length === 0) return;

  const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const script = path.join(pluginRoot, 'skills', 'website', 'scripts', 'verify-composition.mjs');
  const reason =
    `Web-surface files were edited but the website-builder verification gate has not run since: ` +
    `${pending.join(', ')}. Before finishing, run ` +
    `\`node "${script}" <built-file-or-dev-URL> --breakpoints 390,768,1280\` against the affected ` +
    `page(s) and fix or justify every violation (the impeccable:* findings included). ` +
    `If these edits produce no renderable page (e.g. an email template fragment or a deleted file), ` +
    `state that explicitly in one sentence instead and finish.`;

  try {
    state.lastBlock = Date.now();
    fs.writeFileSync(stateFile, JSON.stringify(state));
  } catch { /* still block — worst case stop_hook_active catches round two */ }
  process.stdout.write(JSON.stringify({ decision: 'block', reason }) + '\n');
}

main().catch(() => {}).finally(() => process.exit(0));

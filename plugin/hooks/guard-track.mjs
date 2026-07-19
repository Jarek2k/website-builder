#!/usr/bin/env node
/**
 * guard-track — PostToolUse tracker for the website-builder stop guard.
 *
 * Records two things in a session-scoped state file under the OS temp dir:
 *   - edits to web-surface files (Edit/Write/MultiEdit on .html/.jsx/.css/…)
 *   - runs of verify-composition.mjs (Bash commands containing the script name)
 *
 * stop-guard.mjs compares the two timestamps on Stop. This script must never
 * break a turn: every failure path exits 0 silently, and non-web tool calls
 * exit within a few ms.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const WEB_EXTS = new Set([
  '.html', '.htm', '.jsx', '.tsx', '.vue', '.svelte', '.astro',
  '.css', '.scss', '.sass', '.less',
]);
const SKIP_PATH_RE = /node_modules|[\\/]\.git[\\/]|[\\/](dist|build|out|\.next|\.nuxt|coverage)[\\/]/;
const STATE_MAX_AGE_MS = 48 * 60 * 60 * 1000;

function stateDir() {
  const dir = path.join(os.tmpdir(), 'website-builder-guard');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function pruneStale(dir) {
  // Opportunistic cleanup — best effort, never throws outward.
  try {
    const now = Date.now();
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      try {
        if (now - fs.statSync(p).mtimeMs > STATE_MAX_AGE_MS) fs.rmSync(p, { force: true });
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
}

function readState(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return { editedFiles: {}, lastEdit: 0, lastVerify: 0 };
  }
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  if (process.env.WEBSITE_BUILDER_GUARD === 'off') return;
  const input = JSON.parse(await readStdin());
  const sessionId = input.session_id;
  if (!sessionId || !/^[\w.-]+$/.test(sessionId)) return;

  const toolName = input.tool_name || '';
  const now = Date.now();
  let update = null;

  if (toolName === 'Edit' || toolName === 'Write' || toolName === 'MultiEdit') {
    const filePath = input.tool_input?.file_path || '';
    const ext = path.extname(filePath).toLowerCase();
    if (!WEB_EXTS.has(ext) || SKIP_PATH_RE.test(filePath)) return;
    update = (state) => {
      state.editedFiles[filePath] = now;
      state.lastEdit = now;
    };
  } else if (toolName === 'Bash') {
    const cmd = String(input.tool_input?.command || '');
    if (!cmd.includes('verify-composition.mjs')) return;
    update = (state) => {
      state.lastVerify = now;
    };
  } else {
    return;
  }

  const dir = stateDir();
  pruneStale(dir);
  const file = path.join(dir, `${sessionId}.json`);
  const state = readState(file);
  if (!state.editedFiles) state.editedFiles = {};
  update(state);
  fs.writeFileSync(file, JSON.stringify(state));
}

main().catch(() => {}).finally(() => process.exit(0));

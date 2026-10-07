#!/usr/bin/env node
/**
 * `npm run status` — one command, the whole verified state of the repo.
 *
 * Why this exists: every session used to start the same way — list the tree, cat
 * a few files, run git log, git status, count tests — four or five round trips
 * spent rediscovering things that had not changed. This prints all of it at once,
 * from the filesystem and git rather than from a document that can go stale.
 *
 * Deliberately does NOT run the test suite: this has to stay instant so it is
 * cheap to call. `npm test` is the source of truth for whether tests pass; this
 * only reports how many are declared.
 */

import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const git = (cmd, fallback = '—') => {
  try {
    return execSync(`git ${cmd}`, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return fallback;
  }
};

/** Every file under `dir` matching `exts`, recursively. */
function walk(dir, exts, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}

const lines = (p) => readFileSync(p, 'utf8').split('\n').length;

function inventory(dir, label) {
  const files = walk(join(ROOT, dir), ['.ts', '.tsx']).sort();
  if (files.length === 0) return null;
  const total = files.reduce((n, f) => n + lines(f), 0);
  const names = files.map((f) => relative(join(ROOT, dir), f).replace(/\\/g, '/'));
  return { label, count: files.length, total, names };
}

/* ---------- git ---------- */
const branch = git('rev-parse --abbrev-ref HEAD');
const dirty = git('status --short').split('\n').filter(Boolean);
const unpushed = git(`log --oneline origin/${branch}..HEAD`).split('\n').filter((l) => l && l !== '—');
const recent = git('log --oneline -5').split('\n').filter(Boolean);

/* ---------- tests ---------- */
const testFiles = walk(join(ROOT, 'tests'), ['.test.ts']).sort();
// Counts declared cases, not passing ones — see the note at the top.
const declared = testFiles.reduce((n, f) => {
  const src = readFileSync(f, 'utf8');
  return n + (src.match(/^\s*it\(/gm) ?? []).length;
}, 0);

/* ---------- deps ---------- */
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const prodDeps = Object.keys(pkg.dependencies ?? {});

/* ---------- docs ---------- */
const DOCS = ['INDEX.md', 'PROYECTO.md', 'BENCHMARK.md', 'ESTADO.md', 'README.md', 'docs/ARCHITECTURE.md'];

/* ---------- output ---------- */
const out = [];
const p = (s = '') => out.push(s);

p(`FRETWISE — estado  (${new Date().toISOString().slice(0, 10)})`);
p('='.repeat(60));
p(`rama           ${branch}`);
p(`sin pushear    ${unpushed.length === 0 ? 'nada' : `${unpushed.length} commit(s)`}`);
for (const c of unpushed) p(`               ↑ ${c}`);
p(`sin commitear  ${dirty.length === 0 ? 'nada (limpio)' : `${dirty.length} archivo(s)`}`);
for (const d of dirty) p(`               • ${d}`);
p();
p('últimos commits');
for (const c of recent) p(`  ${c}`);
p();
// Parameterised suites loop inside a single it(), so this undercounts on purpose —
// it is a shape-of-the-suite number, not a pass count. `npm test` reports the real total.
p(`tests          ${testFiles.length} suites · ${declared} bloques it() (los parametrizados expanden — total real: npm test)`);
p(`deps prod      ${prodDeps.length} (${prodDeps.join(', ')})  ·  versión ${pkg.version}`);
p();

p('código');
for (const dir of ['src/data', 'src/engine', 'src/audio', 'src/ui']) {
  const inv = inventory(dir, dir);
  if (!inv) continue;
  p(`  ${inv.label.padEnd(12)} ${String(inv.count).padStart(2)} archivos · ${inv.total} líneas`);
  p(`               ${inv.names.join(', ')}`);
}
p();

p('docs internos');
for (const d of DOCS) {
  const f = join(ROOT, d);
  p(`  ${existsSync(f) ? '✓' : '·'} ${d}${existsSync(f) ? `  (${lines(f)} líneas)` : '  — no existe'}`);
}
p();
p('en vivo        https://fretwiseapp.github.io/  ·  /app/');
p('dev            npm run dev → :5180   (preview config: fretwise-app)');

console.log(out.join('\n'));

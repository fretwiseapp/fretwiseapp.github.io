// Post-build assembly for GitHub Pages.
//
// Vite builds the app into dist/app/ (see vite.config.ts). This step copies the
// marketing landing into dist/ so the published site is:
//   dist/index.html      -> landing (site root, fretwiseapp.github.io/)
//   dist/fonts/          -> landing's self-hosted Inter woff2
//   dist/app/index.html  -> the app (fretwiseapp.github.io/app/)
//
// waitlist.gs is backend source (Google Apps Script) and must NOT be served.

import { cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const landing = join(root, 'landing');
const dist = join(root, 'dist');

// index.html at the site root.
await cp(join(landing, 'index.html'), join(dist, 'index.html'));
// Self-hosted fonts.
await cp(join(landing, 'fonts'), join(dist, 'fonts'), { recursive: true });
// Ensure backend source never ships even if a stale copy exists.
await rm(join(dist, 'waitlist.gs'), { force: true });

console.log('assemble-site: landing copied to dist/ (app stays in dist/app/)');

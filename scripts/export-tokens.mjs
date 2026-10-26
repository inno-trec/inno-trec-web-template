#!/usr/bin/env node
/**
 * Copies the design tokens into another project, for example the Expo mobile app.
 *
 *   npm run export:tokens -- ../my-mobile-app/src/tokens
 *
 * Writes three files into the target folder:
 *   tailwind-preset.js   Tailwind preset: add it to `presets` in tailwind.config.js
 *   tokens.js            plain constants (colors, fontSize, spacing, radius)
 *   tokens.d.ts          types for tokens.js
 *
 * They are CommonJS files with a .js extension, which Metro and Node both read in a project
 * that does not set "type": "module". Run this again after `npm run sync:ds` changes the tokens.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'packages/tokens/dist');
const target = process.argv[2];

if (!target) {
  console.error('Usage: npm run export:tokens -- <target-folder>');
  process.exit(1);
}
const out = path.resolve(process.cwd(), target);
fs.mkdirSync(out, { recursive: true });

const files = [
  ['tailwind-preset.cjs', 'tailwind-preset.js'],
  ['tokens.cjs', 'tokens.js'],
  ['tokens.d.ts', 'tokens.d.ts'],
];
for (const [from, to] of files) fs.copyFileSync(path.join(dist, from), path.join(out, to));

const lock = JSON.parse(fs.readFileSync(path.join(root, 'design-system.lock.json'), 'utf8'));
console.log(`Copied ${files.length} files to ${out}`);
console.log(`Design system version: ${lock.publishedVersion ?? 'unknown'} (synced ${lock.syncedAt})`);

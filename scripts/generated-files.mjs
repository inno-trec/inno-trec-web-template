/**
 * The files written by scripts/sync-design-system.mjs, and their SHA-256 hashes.
 * The sync stores the hashes in design-system.lock.json; scripts/check-generated.mjs compares them.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const GENERATED = [
  'packages/tokens/tokens.json',
  'packages/tokens/dist',
  'packages/ui-web/src',
  'packages/ui-web/assets',
  'docs/reference',
];

const walk = (abs) =>
  fs.statSync(abs).isDirectory()
    ? fs.readdirSync(abs).filter((f) => f !== '.DS_Store').flatMap((f) => walk(path.join(abs, f)))
    : [abs];

/** Returns { "relative/path": "sha256" } for every generated file, sorted by path. */
export function hashGenerated(root) {
  const files = GENERATED.flatMap((p) => (fs.existsSync(path.join(root, p)) ? walk(path.join(root, p)) : []));
  return Object.fromEntries(
    files
      .map((abs) => [path.relative(root, abs).split(path.sep).join('/'), crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex')])
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

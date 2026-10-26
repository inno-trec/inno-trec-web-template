#!/usr/bin/env node
/**
 * Fails when a generated file was edited, added or removed by hand.
 * The expected hashes are written by `npm run sync:ds` into design-system.lock.json.
 *
 *   npm run check:generated
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashGenerated } from './generated-files.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lock = JSON.parse(fs.readFileSync(path.join(root, 'design-system.lock.json'), 'utf8'));
if (!lock.files) {
  console.error('design-system.lock.json has no "files" hashes. Run npm run sync:ds once to record them.');
  process.exit(1);
}

const actual = hashGenerated(root);
const problems = [
  ...Object.keys(lock.files).filter((f) => !(f in actual)).map((f) => `missing:  ${f}`),
  ...Object.keys(actual).filter((f) => !(f in lock.files)).map((f) => `added:    ${f}`),
  ...Object.keys(actual).filter((f) => f in lock.files && lock.files[f] !== actual[f]).map((f) => `changed:  ${f}`),
];

if (problems.length) {
  console.error(`Generated files differ from the last design system sync:\n  ${problems.join('\n  ')}`);
  console.error('Do not edit generated files. Change the design system and run npm run sync:ds.');
  process.exit(1);
}
console.log(`${Object.keys(actual).length} generated files match design-system.lock.json`);

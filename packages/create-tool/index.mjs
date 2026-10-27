#!/usr/bin/env node
/**
 * Creates a new INNO-TREC web tool from the starter.
 *
 *   npm create @inno-trec/tool my-tool
 *
 * Copies template/ (a copy of apps/web-starter, added when the package is published) into a new
 * folder and sets the project name. It has no dependencies, so `npm create` starts at once.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const template = path.join(path.dirname(fileURLToPath(import.meta.url)), 'template');
const DOCS = 'https://glpages.up.pt/inno-trec/inno-trec-web-template/';

/** npm drops some dotfiles from packages, so the template stores them under another name. */
const RENAME = { _gitignore: '.gitignore', _nvmrc: '.nvmrc' };

async function askName() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question('Folder for the new tool (for example energy-monitor): ')).trim();
  rl.close();
  return answer;
}

const target = process.argv[2] ?? (process.stdin.isTTY ? await askName() : '');
if (!target) {
  console.error('Usage: npm create @inno-trec/tool <folder>');
  process.exit(1);
}

const dir = path.resolve(process.cwd(), target);
const name = path.basename(dir).toLowerCase().replace(/[^a-z0-9-._~]+/g, '-');
if (fs.existsSync(dir) && fs.readdirSync(dir).length > 0) {
  console.error(`${target} already exists and is not empty. Choose another folder.`);
  process.exit(1);
}

fs.cpSync(template, dir, { recursive: true });
for (const [from, to] of Object.entries(RENAME)) {
  if (fs.existsSync(path.join(dir, from))) fs.renameSync(path.join(dir, from), path.join(dir, to));
}

const manifest = path.join(dir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8'));
fs.writeFileSync(manifest, `${JSON.stringify({ ...pkg, name }, null, 2)}\n`);

const readme = path.join(dir, 'README.md');
fs.writeFileSync(readme, fs.readFileSync(readme, 'utf8').replaceAll('{{name}}', name));

const cd = path.relative(process.cwd(), dir) || '.';
console.log(`
Created ${name} in ${dir}.

Next:
  cd ${cd}
  npm install
  npm run dev

Sign in as ana.ribeiro@example.org with the password sample-password.
Guide: ${DOCS}getting-started
`);

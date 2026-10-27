#!/usr/bin/env node
/**
 * Publishes the packages that teams install from npmjs.com, all with the template's version
 * (the root package.json):
 *
 *   @inno-trec/tokens        the design tokens
 *   @inno-trec/ui-web        the components
 *   @inno-trec/create-tool   `npm create @inno-trec/tool`, with a copy of apps/web-starter as its template
 *
 *   node scripts/publish-packages.mjs          publish (the npm-publish job in release.yml, on a vX.Y.Z tag; npm trusted publishing)
 *   node scripts/publish-packages.mjs --pack   write the .tgz files to .publish/ instead, to test them
 *
 * The repository does not change: each package is copied to .publish/, and its manifest is set there
 * (version, no "private"). A version that is already on npm is skipped, so the job can run again.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, '.publish');
const pack = process.argv.includes('--pack');
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const SCOPE = '@inno-trec/';

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' });
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, data) => fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);

/** The files Git tracks in a folder, so node_modules, builds and test reports never get in. */
const tracked = (dir) => run('git', ['ls-files', '-z', dir], root).split('\0').filter(Boolean);

function copyTracked(from, to, skip = []) {
  for (const file of tracked(from)) {
    const rel = path.relative(from, file);
    if (skip.includes(rel)) continue;
    fs.mkdirSync(path.dirname(path.join(to, rel)), { recursive: true });
    fs.copyFileSync(path.join(root, file), path.join(to, rel));
  }
}

/** Sets the version, drops "private" and pins the @inno-trec dependencies to this version. */
function setManifest(file, extra = {}) {
  const pkg = readJson(file);
  delete pkg.private;
  pkg.version = version;
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
    for (const dep of Object.keys(pkg[field] ?? {})) if (dep.startsWith(SCOPE)) pkg[field][dep] = `^${version}`;
  }
  writeJson(file, { ...pkg, ...extra });
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);

/* tokens and ui-web: the package folders as they are in Git. */
for (const name of ['tokens', 'ui-web']) {
  const dir = path.join(out, name);
  copyTracked(`packages/${name}`, dir);
  fs.copyFileSync(path.join(root, 'LICENSE'), path.join(dir, 'LICENSE'));
  setManifest(path.join(dir, 'package.json'));
}

/* create-tool: its script, plus the starter as template/ (its own README and .gitignore replace the starter's). */
{
  const dir = path.join(out, 'create-tool');
  copyTracked('packages/create-tool', dir, ['files/README.md', 'files/_gitignore']);
  fs.rmSync(path.join(dir, 'files'), { recursive: true, force: true });
  fs.copyFileSync(path.join(root, 'LICENSE'), path.join(dir, 'LICENSE'));
  setManifest(path.join(dir, 'package.json'));

  const template = path.join(dir, 'template');
  copyTracked('apps/web-starter', template, ['README.md']);
  for (const file of ['README.md', '_gitignore']) fs.copyFileSync(path.join(root, 'packages/create-tool/files', file), path.join(template, file));
  fs.copyFileSync(path.join(root, '.nvmrc'), path.join(template, '_nvmrc'));
  setManifest(path.join(template, 'package.json'), { version: '0.1.0', private: true, engines: { node: '>=24' } });
}

for (const name of ['tokens', 'ui-web', 'create-tool']) {
  const dir = path.join(out, name);
  const id = `${readJson(path.join(dir, 'package.json')).name}@${version}`;
  if (pack) {
    run('npm', ['pack', '--pack-destination', out], dir);
    console.log(`packed ${id}`);
    continue;
  }
  let published = '';
  try {
    published = run('npm', ['view', id, 'version'], dir).trim();
  } catch {
    /* not on npm yet */
  }
  if (published === version) {
    console.log(`skipped ${id}: already on npm`);
    continue;
  }
  run('npm', ['publish', '--access', 'public'], dir);
  console.log(`published ${id}`);
}

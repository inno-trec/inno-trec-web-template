/**
 * Builds the component gallery for the documentation site into docs/public/gallery/ (git-ignored):
 * one page per component, from docs/reference/previews/ (copied from the design system by npm run sync:ds).
 *
 * Each page loads gallery.js and gallery.css: React, ReactDOM and @inno-trec/ui-web from this repository
 * (docs/.vitepress/gallery/runtime.js). The component guide shows the pages in frames, so the components'
 * styles never mix with the site's. Nothing is loaded from claude.ai.
 *
 * npm run docs:dev and npm run pages:build run this first.
 */
import { cpSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const previews = path.join(root, 'docs/reference/previews');
const out = path.join(root, 'docs/public/gallery');

if (!existsSync(previews)) {
  console.error(`No previews in ${path.relative(root, previews)}. Run npm run sync:ds first.`);
  process.exit(1);
}

await build({
  root,
  logLevel: 'warn',
  configFile: false,
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: out,
    emptyOutDir: true,
    lib: { entry: path.join(root, 'docs/.vitepress/gallery/runtime.js'), name: 'innoTrecGallery', formats: ['iife'], fileName: () => 'gallery.js', cssFileName: 'gallery' },
  },
});

// Logos and the EU emblem, at the paths the previews use (assets/logos/…, assets/funding/…).
cpSync(path.join(root, 'packages/ui-web/assets'), path.join(out, 'assets'), { recursive: true });

const head = '<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="gallery.css"><script src="gallery.js"></script>';
const pages = readdirSync(previews).filter((f) => f.endsWith('.html'));
for (const file of pages) {
  const html = readFileSync(path.join(previews, file), 'utf8');
  if (!html.includes('<head>')) throw new Error(`${file} has no <head>`);
  writeFileSync(path.join(out, file), html.replace('<head>', `<head>${head}`));
}
console.log(`gallery: ${pages.length} component previews in ${path.relative(root, out)}`);

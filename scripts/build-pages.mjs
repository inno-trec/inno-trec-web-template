/**
 * Builds the documentation site (GitLab Pages): the documentation (VitePress, from docs/) with the component gallery
 * (scripts/build-gallery.mjs) and the starter app as a live demo under demo/. The result is docs/.vitepress/dist.
 *
 * Pages has no rewrites, so an address inside the demo (…/demo/alerts) would get the site's 404
 * page. The 404 page sends such addresses to demo/?p=<address>, and the demo puts the address back before
 * the router starts. Both small scripts are added here, so the starter itself stays unchanged.
 */
import { execSync } from 'node:child_process';
import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const base = process.env.DOCS_BASE ?? '/inno-trec-template/';
const demoBase = `${base}demo/`;
const site = 'docs/.vitepress/dist';
const demoOut = 'apps/web-starter/dist-pages';

const run = (command) => execSync(command, { stdio: 'inherit', env: { ...process.env, DOCS_BASE: base } });

run('node scripts/build-gallery.mjs');
run('npx vitepress build docs');
run(`npm exec -w web-starter -- vite build --base ${demoBase} --outDir dist-pages --emptyOutDir`);
cpSync(demoOut, `${site}/demo`, { recursive: true });
rmSync(demoOut, { recursive: true, force: true });

const insertAfterHead = (file, script) => {
  const html = readFileSync(file, 'utf8');
  if (!html.includes('<head>')) throw new Error(`${file} has no <head>`);
  writeFileSync(file, html.replace('<head>', `<head><script>${script}</script>`));
};

insertAfterHead(
  `${site}/404.html`,
  `if(location.pathname.indexOf(${JSON.stringify(demoBase)})===0){location.replace(${JSON.stringify(demoBase)}+'?p='+encodeURIComponent(location.pathname+location.search+location.hash))}`,
);
insertAfterHead(`${site}/demo/index.html`, `(function(){var p=new URLSearchParams(location.search).get('p');if(p)history.replaceState(null,'',p)})()`);

console.log(`Site ready in ${site} (base ${base}, demo at ${demoBase})`);

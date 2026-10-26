import path from 'node:path';
import { defineConfig } from 'vitepress';

/**
 * The documentation site (GitHub Pages). The pages are the Markdown files in docs/, so the site and the
 * repository never disagree. `npm run docs:dev` previews it; `npm run pages:build` builds it with the demo.
 */

const REPO = 'https://github.com/joaocarlos/inno-trec-template';

export default defineConfig({
  title: 'INNO-TREC template',
  description: 'Starter template for INNO-TREC web tools, built on the INNO-TREC design system.',
  lang: 'en-US',
  base: process.env.DOCS_BASE ?? '/inno-trec-template/',
  cleanUrls: true,
  ignoreDeadLinks: 'localhostLinks',
  lastUpdated: false,
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'Components', link: '/reference/components' },
      // The demo is a separate app copied next to the site; `_self` loads it as a full page.
      { text: 'Demo', link: '/demo/', target: '_self' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting started', link: '/getting-started' },
          { text: 'Architecture', link: '/architecture' },
          { text: 'Tokens and Tailwind', link: '/tokens-and-tailwind' },
          { text: 'Design rules', link: '/design-rules' },
          { text: 'Page patterns', link: '/page-patterns' },
          { text: 'Mobile', link: '/mobile' },
          { text: 'Contributing', link: '/contributing' },
          { text: 'Troubleshooting', link: '/troubleshooting' },
        ],
      },
      {
        text: 'Design system',
        items: [
          { text: 'Components', link: '/reference/components' },
          { text: 'Brand book', link: '/reference/brand-book' },
          { text: 'DESIGN.md', link: '/reference/DESIGN' },
          { text: 'Open questions (ECMS)', link: '/reference/open-questions' },
        ],
      },
      {
        text: 'Project',
        items: [
          { text: 'Decisions', link: '/decisions' },
          { text: 'Tracking', link: '/tracking' },
        ],
      },
    ],
    search: { provider: 'local' },
    outline: { level: [2, 3] },
    footer: {
      message: 'INNO-TREC is supported by the European Union’s Horizon Europe programme under agreement 101230578.',
    },
  },
  vite: {
    plugins: [
      {
        // DESIGN.md starts with its tokens as YAML after a comment, which Markdown would read as one long
        // heading. On the site, show them in a collapsed code block. The file itself stays as generated.
        name: 'design-md-tokens',
        enforce: 'pre',
        transform(code, id) {
          if (!id.endsWith('/reference/DESIGN.md')) return;
          return code.replace(/^(<!--[\s\S]*?-->\s*)---\n([\s\S]*?)\n---\n/, (_m, comment, yaml) =>
            `${comment}\n::: details Tokens (YAML)\n\n\`\`\`yaml\n${yaml}\n\`\`\`\n\n:::\n`);
        },
      },
    ],
  },
  markdown: {
    config(md) {
      // Links from docs/ to source files (../apps/…) point at the repository on GitHub.
      const render = md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
      md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
        const href = tokens[idx].attrGet('href');
        if (href && !/^([a-z]+:|#|\/)/i.test(href)) {
          const target = path.posix.normalize(path.posix.join('docs', path.posix.dirname(env.relativePath), href));
          if (!target.startsWith('docs/')) tokens[idx].attrSet('href', `${REPO}/blob/main/${target}`);
        }
        return render(tokens, idx, options, env, self);
      };
    },
  },
});

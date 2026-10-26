# Tokens and Tailwind

The design tokens are the colors, type styles, spacing steps and corner radii of the design system. This repository turns them into three things you can use.

## How tokens reach your code

```text
tokens.json  ──►  Tailwind preset        class names:       bg-light-blue, text-title, gap-space-4
(design system)   CSS variables          in your CSS:       var(--ink-muted)
                  JavaScript constants   in your code:      colors['light-blue']
```

You never edit these outputs. To change a token, change `tokens.json` in the design system repository and run `npm run sync:ds`.

## Tailwind class names

Add the preset in `tailwind.config.js`. The starter already does:

```js
import preset from '@inno-trec/tokens/tailwind-preset';

export default {
  presets: [preset],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
};
```

### Colors

Every color token is a class suffix: `bg-…`, `text-…`, `border-…`.

| Use for | Classes |
| --- | --- |
| Page and cards | `bg-surface-muted`, `bg-surface` |
| Text | `text-ink`, `text-ink-muted` |
| Brand fills | `bg-green`, `bg-light-blue`, `bg-orange` |
| Text on brand fills | `text-on-green`, `text-on-light-blue`, `text-on-orange` |
| Tinted backgrounds | `bg-green-tint`, `bg-light-blue-tint`, `bg-orange-tint`, `bg-danger-tint` |
| Dividers and borders | `border-line` (decorative), `border-line-strong` (controls) |
| Errors | `text-danger`, `bg-danger` |

Pair a fill with its own text color: `bg-light-blue text-on-light-blue`.

### Type

The type scale is named after its role. Each class sets size, line height and weight.

| Class | Use | Size |
| --- | --- | --- |
| `font-display text-display` | Section titles, in capitals | 48 / 52, Figtree Bold |
| `font-display text-title` | Page and card titles | 28 / 34, Figtree Bold |
| `font-display text-heading` | Sub-headings | 18 / 24, Figtree Bold |
| `text-body` | Running text | 16 / 24, Open Sans |
| `text-body-light` | Lead paragraphs | 16 / 24, Open Sans Light |
| `text-label` | Labels, table headers | 13 / 18, Open Sans Bold |
| `text-caption` | Captions and footnotes | 12 / 16, Open Sans |
| `font-mono text-mono` | Identifiers on manager screens | 13 / 18, monospace |

`font-sans` is Open Sans. Headings need `font-display` as well, because the size class does not choose the family.

### Spacing

The design system has four steps, and the preset names them:

| Class suffix | Value | Use |
| --- | --- | --- |
| `space-1` | 4px | An icon and its label |
| `space-2` | 8px | Inside a component |
| `space-4` | 16px | Card padding, gaps between blocks |
| `space-8` | 32px | Between sections, page margins |

Write `gap-space-4`, `p-space-4`, `mt-space-8`. Tailwind's default numbers (`gap-4`) still exist and match the same pixel values, but the named steps show intent, so prefer them.

### What the preset removes

| Removed | Use instead |
| --- | --- |
| `rounded`, `rounded-md`, `rounded-lg` and the rest | `rounded-none` (default), `rounded-sm` (4px, small controls), `rounded-full` (avatars, dots) |
| `shadow`, `shadow-md` and the rest | A border (`border border-line`) and a tinted background |

These are removed because the design system is flat and square. If you need one of them, the design system needs to change first.

## Tailwind's reset is off

The preset sets `corePlugins: { preflight: false }`. Tailwind's reset removes the default styles of headings, paragraphs and buttons. The component stylesheet sets its own base styles and expects the browser defaults around them, so the reset stays off.

What this means for your own markup:

- A bare `<h1>` or `<p>` keeps the browser's margins. Put layout around it with Tailwind (`m-0`, `gap-…`) or use a component.
- The shell draws the page heading, so most pages need no `<h1>` of their own.
- `<button>` elements should be `Button` components.

## Component styles and CSS variables

`@inno-trec/ui-web/styles.css` defines the variables on `:root`: `--ink`, `--ink-muted`, `--surface`, `--surface-muted`, `--light-blue`, `--line`, and the rest. Use them in your own CSS when a class does not fit:

```css
.my-banner {
  background: var(--light-blue-tint);
  border: 1px solid var(--line);
  padding: var(--space-4);
}
```

Prefer a component or a Tailwind class first.

## JavaScript constants

For places that cannot use a class, such as a chart series color:

```ts
import { colors } from '@inno-trec/tokens';

const pvColor = colors['series-pv'];      // '#d26a12'
```

For charts, use the four series colors: `series-consumption`, `series-pv`, `series-storage` and `series-grid`. Each one always means the same series. See [Charts](design-rules.md#charts).

`ColorName` is a union of every token name, so a typo fails the type check.

## Token status

Many token values are marked **proposed** in the token notes, which means the brand manual does not specify them: `ink`, the gray lines, the type sizes, `danger` and the spacing steps among them. They can change. Use the token, never the hex value, so a change reaches your tool at the next sync.

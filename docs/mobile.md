# Mobile

The mobile app for wallet management is built with Expo and NativeWind, and it lives in its own repository. It shares the design **tokens** with the web tools. It does not share components.

This page is for the person who builds the mobile app. Web teams do not need it.

## What is shared and what is not

| Shared | Not shared |
| --- | --- |
| Colors, type scale, spacing steps, square corners | Components: `@inno-trec/ui-web` is DOM-based React and does not run in React Native |
| The Tailwind preset (the same class names on both) | The component styles in `styles.css` |
| Rules: [design rules](design-rules.md), [brand book](reference/brand-book.md) | |

The mobile app builds its own components from React Native primitives and styles them with the preset's class names, so a `bg-light-blue` button is the same blue on both. For what each component must do, use the [component guide](reference/components.md) and the design system's previews as the specification.

## Why the app is not in this repository

- Expo pins exact React versions (the template used React 19.3.0), and the web starter uses a newer 19.x. Two versions in one workspace cause duplicate React copies.
- The Metro bundler does not read files outside the project folder by default.

A separate repository avoids both. The tokens travel by copy.

## Set up an Expo app with the tokens

These steps were run on a new app and produced a working JavaScript bundle (see [What was checked](#what-was-checked)). The versions were current in October 2026.

**1. Create the app and install NativeWind**

```sh
npx create-expo-app@latest my-wallet-app --template blank-typescript
cd my-wallet-app
npx expo install react-native-reanimated react-native-safe-area-context react-native-worklets
npm install nativewind@4.2.7 "tailwindcss@^3.4.19"
```

NativeWind 4 needs Tailwind 3. Its runtime package declares `tailwindcss ~3` as a peer dependency, so do not install Tailwind 4 here.

**2. Copy the tokens in.** From the template repository:

```sh
npm run export:tokens -- ../my-wallet-app/src/tokens
```

This writes `tailwind-preset.js`, `tokens.js` and `tokens.d.ts`. Run it again whenever the tokens change.

**3. Add the configuration files** to the root of the app.

`tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset'), require('./src/tokens/tailwind-preset')],
};
```

`global.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
```

`metro.config.js`:

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

module.exports = withNativeWind(getDefaultConfig(__dirname), { input: './global.css' });
```

`nativewind-env.d.ts`:

```ts
/// <reference types="nativewind/types" />

// CSS files are imported for their side effects only.
declare module '*.css';
```

The `declare module '*.css'` line is needed with TypeScript 6, which the Expo template installs. It checks side-effect imports and otherwise reports that `./global.css` has no type declarations.

**4. Import the stylesheet once** at the top of `App.tsx` and use the classes:

```tsx
import './global.css';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center gap-space-4 bg-surface-muted p-space-4">
      <View className="w-full border border-line bg-surface p-space-4">
        <Text className="font-display text-title text-ink">133 credits</Text>
        <Text className="text-body text-ink-muted">Updated today</Text>
      </View>
    </View>
  );
}
```

For values a class cannot carry (a status bar color, an SVG fill):

```ts
import { colors } from './src/tokens/tokens';

colors['light-blue']; // '#1978b8'
```

## Differences from the web

- **Fonts.** The preset names the web fonts (`Figtree`, `Open Sans`). On a phone, a font must be loaded first (for example with `expo-font` or `@expo-google-fonts/figtree`), and the family name in the style must match the loaded name. Load Figtree Bold and the Open Sans weights you use, then override `fontFamily` in the app's `tailwind.config.js` after the preset. This part is not verified yet.
- **No hover or focus rings.** Use pressed states and keep touch targets as large as the design rules ask: 52px tall controls and rows of at least 60px.
- **No tables.** Lists replace the web's `DataTable` on a phone.
- **Preflight does not apply.** The preset turns it off, and it has no meaning in React Native.

## Keeping the tokens current

1. A design system change reaches the template: `npm run sync:ds` in the template repository.
2. Copy it to the app: `npm run export:tokens -- <path-to-app>/src/tokens`.
3. The command prints the design system version it copied. Record it in your commit message.

## What was checked

On a new Expo app (Expo 58, React Native 0.88, React 19.3.0, NativeWind 4.2.7, Tailwind 3.4):

- The type check passed.
- `expo export --platform ios` produced a JavaScript bundle without errors.
- The classes from the preset compiled to React Native styles with the right values (`bg-light-blue` became `backgroundColor: "#1978b8"`, `p-space-4` became `padding: 16`, `text-title` became size 28, line height 34, weight 700).

What was **not** checked: running the app on a simulator or a device, the Android and web targets, and fonts. Test those before you rely on this setup.

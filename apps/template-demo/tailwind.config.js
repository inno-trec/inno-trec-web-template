import preset from '@inno-trec/tokens/tailwind-preset';

/** @type {import('tailwindcss').Config} */
export default {
  // Colors, type scale, spacing, square corners and "no shadows" all come from the preset.
  presets: [preset],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
};

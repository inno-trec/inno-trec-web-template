import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import ComponentPreview from './ComponentPreview.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ComponentPreview', ComponentPreview);
  },
} satisfies Theme;

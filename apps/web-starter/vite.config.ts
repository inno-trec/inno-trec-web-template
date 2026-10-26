import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    // The chart chunk (ECharts, about 520 kB, 175 kB compressed) loads only on pages with a chart.
    chunkSizeWarningLimit: 600,
  },
});

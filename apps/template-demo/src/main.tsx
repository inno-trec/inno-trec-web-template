import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import '@inno-trec/ui-web/styles.css'; // fonts, design tokens and component styles
import './index.css'; // Tailwind
import { App } from './App';
import { SessionProvider } from './auth/session';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* The basename follows `base` in vite.config.ts, so the app also works under a sub-path. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <SessionProvider>
        <App />
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
);

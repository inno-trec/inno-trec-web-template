/**
 * What a design system preview expects on the page: React, ReactDOM and the components as globals, as in the
 * design system gallery. Here they come from this repository (React 19 and packages/ui-web), so the
 * previews show the version the template uses.
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import * as InnoTrec from '@inno-trec/ui-web';
import '@inno-trec/ui-web/styles.css';

Object.assign(window, { React, ReactDOM, InnoTrec });

// Tell the documentation page how tall the preview is, so the frame fits it without a scroll bar.
function report() {
  if (window.parent !== window) window.parent.postMessage({ type: 'inno-trec-preview', height: document.documentElement.scrollHeight }, '*');
}
window.addEventListener('load', () => {
  new ResizeObserver(report).observe(document.body);
  report();
});

import { expect, type Page } from '@playwright/test';

/** Records console errors and uncaught exceptions for the whole test. */
export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

/** Fails when the page itself scrolls sideways. A wide table in its own scroll container is allowed. */
export async function expectNoSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'page scrolls sideways').toBeLessThanOrEqual(0);
}

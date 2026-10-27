import { expect, type Locator, type Page } from '@playwright/test';

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

/** Puts a file of the given size into a file input, the way the browser's picker would. */
export async function chooseFile(input: Locator, name: string, sizeBytes: number, type = 'image/jpeg') {
  await input.evaluate(
    (el: HTMLInputElement, file) => {
      const transfer = new DataTransfer();
      transfer.items.add(new File([new Uint8Array(file.sizeBytes)], file.name, { type: file.type }));
      el.files = transfer.files;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    { name, sizeBytes, type },
  );
}

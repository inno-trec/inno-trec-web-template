import { expect, test, type Page } from '@playwright/test';

/** Records console errors and uncaught exceptions for the whole test. */
function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

/** Fails when the page itself scrolls sideways. A wide table in its own scroll container is allowed. */
async function expectNoSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'page scrolls sideways').toBeLessThanOrEqual(0);
}

/** Pages come from the side navigation, so a new NAV entry is tested without editing this file. */
async function navPages(page: Page) {
  await page.goto('/');
  const links = page.locator('.it-sidenav a[href]');
  await expect(links.first()).toBeAttached();
  return links.evaluateAll((els) => els.map((el) => ({ href: el.getAttribute('href')!, label: el.textContent!.trim() })));
}

test('every page renders its heading and footer without sideways scroll or console errors', async ({ page }) => {
  const errors = collectErrors(page);
  const pages = await navPages(page);
  expect(pages.length).toBeGreaterThan(0);

  for (const { href, label } of pages) {
    await test.step(href, async () => {
      await page.goto(href);
      await expect(page.locator('.it-shell-main > h1')).toHaveText(label);
      // The heading comes from NAV, so also check that a route renders a real page, not the fallback.
      await expect(page.locator('[data-not-found]'), `no route for ${href} in App.tsx`).toHaveCount(0);
      // Every INNO-TREC tool shows the EU funding emblem in the footer.
      await expect(page.getByRole('img', { name: 'Funded by the European Union' })).toBeVisible();
      await expectNoSidewaysScroll(page);
    });
  }

  expect(errors).toEqual([]);
});

test('an unknown address shows the not-found page', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/no-such-page');
  await expect(page.locator('.it-shell-main > h1')).toHaveText('Page not found');
  await expect(page.locator('[data-not-found]')).toHaveCount(1);
  await expectNoSidewaysScroll(page);
  expect(errors).toEqual([]);
});

test('side navigation changes page without a full reload', async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) < 560, 'navigation layout differs on phones');
  const pages = await navPages(page);
  const target = pages.find((p) => p.href !== '/');
  test.skip(!target, 'only one page');

  await page.evaluate(() => ((window as unknown as { __marker: boolean }).__marker = true));
  await page.locator(`.it-sidenav a[href="${target!.href}"]`).click();
  await expect(page).toHaveURL(target!.href);
  await expect(page.locator('.it-shell-main > h1')).toHaveText(target!.label);
  expect(await page.evaluate(() => (window as unknown as { __marker?: boolean }).__marker)).toBe(true);
});

test('the overview draws its charts', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.locator('[data-chart] canvas')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('a user can be invited and deactivated', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/users');
  await page.getByRole('button', { name: 'Invite user' }).click();
  const dialog = page.getByRole('dialog', { name: 'Invite a user' });

  // The form checks empty fields; the backend checks the rest and answers per field.
  await dialog.getByRole('button', { name: 'Invite user' }).click();
  await expect(dialog.getByText('Enter the person’s name.')).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Name' }).fill('Teresa Lima');
  await dialog.getByRole('textbox', { name: 'Email' }).fill('ana.ribeiro@example.org');
  await dialog.getByRole('button', { name: 'Invite user' }).click();
  await expect(dialog.getByText(/already uses this email/)).toBeVisible();

  await dialog.getByRole('textbox', { name: 'Email' }).fill('teresa.lima@example.org');
  await dialog.getByLabel('Technician').check();
  await dialog.getByRole('button', { name: 'Invite user' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Invitation sent to teresa.lima@example.org')).toBeVisible();

  // Taking access away asks for confirmation first.
  await page.getByRole('button', { name: 'Deactivate' }).click();
  const confirm = page.getByRole('dialog', { name: 'Deactivate Teresa Lima?' });
  await confirm.getByRole('button', { name: 'Deactivate' }).click();
  await expect(page.getByText('Teresa Lima is deactivated')).toBeVisible();
  expect(errors).toEqual([]);
});

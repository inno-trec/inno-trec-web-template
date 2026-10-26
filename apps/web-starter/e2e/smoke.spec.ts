import { expect, test, type Page } from '@playwright/test';
import { collectErrors, expectNoSidewaysScroll } from './helpers';

/** These tests start signed in as an administrator. The sign-in screens are tested in accounts.spec.ts. */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const session = { userId: 'u-1', name: 'Ana Ribeiro', email: 'ana.ribeiro@example.org', role: 'admin', roleLabel: 'Administrator' };
    sessionStorage.setItem('inno-trec.session', JSON.stringify(session));
  });
});

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

test('the performance and data checks pages draw their charts', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/performance');
  await expect(page.locator('[data-chart] canvas')).toHaveCount(1);
  await expect(page.getByText('Below normal').first()).toBeVisible();
  await page.goto('/data-checks');
  await expect(page.locator('[data-chart] canvas')).toHaveCount(1);
  await expect(page.getByText('Outside tolerance').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('an alert can be acknowledged and resolved', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/alerts');
  await expect(page.getByRole('heading', { name: 'Inverter 3 stopped with fault F07' })).toBeVisible();
  await page.getByRole('button', { name: 'Acknowledge' }).click();
  await expect(page.getByText('Alert acknowledged')).toBeVisible();

  await page.getByRole('button', { name: 'Resolve' }).click();
  const dialog = page.getByRole('dialog', { name: 'Resolve the alert' });
  await dialog.getByRole('button', { name: 'Resolve alert' }).click();
  await expect(dialog.getByText('Write what was done.')).toBeVisible();
  await dialog.getByRole('textbox', { name: 'What was done' }).fill('Inverter replaced.');
  await dialog.getByRole('button', { name: 'Resolve alert' }).click();
  await expect(page.getByText('Alert resolved')).toBeVisible();
  expect(errors).toEqual([]);
});

test('the account page saves the profile and checks the current password', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await page.getByRole('link', { name: 'Account' }).click();
  await expect(page.locator('.it-shell-main > h1')).toHaveText('Your account');

  await page.getByRole('textbox', { name: 'Name' }).fill('Ana M. Ribeiro');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Your profile is saved')).toBeVisible();

  await page.getByLabel('Current password').fill('not-my-password');
  await page.getByLabel('New password').fill('a-new-long-password');
  await page.getByRole('button', { name: 'Change password' }).click();
  await expect(page.getByText('This is not your current password.')).toBeVisible();
  expect(errors).toEqual([]);
});


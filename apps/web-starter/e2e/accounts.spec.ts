import { expect, test, type Page } from '@playwright/test';
import { collectErrors, expectNoSidewaysScroll } from './helpers';

/** Screens without a session. Each test starts signed out. */
const SCREENS = [
  { path: '/sign-in', heading: 'Sign in' },
  { path: '/sign-up', heading: 'Ask for an account' },
  { path: '/forgot-password', heading: 'Reset your password' },
  { path: '/reset-password?token=sample', heading: 'Choose a new password' },
  { path: '/invitation?token=invite-u-4', heading: 'Join Community Energy' },
];

const heading = (page: Page) => page.locator('.it-auth-panel > h1');

async function signIn(page: Page, email: string, password: string) {
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByLabel(/^Password/).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test('every screen without a session renders its heading and footer', async ({ page }) => {
  const errors = collectErrors(page);
  for (const screen of SCREENS) {
    await test.step(screen.path, async () => {
      await page.goto(screen.path);
      await expect(heading(page)).toHaveText(screen.heading);
      await expect(page.getByRole('img', { name: 'Funded by the European Union' })).toBeVisible();
      await expectNoSidewaysScroll(page);
    });
  }
  expect(errors).toEqual([]);
});

test('a page without a session asks to sign in, then opens', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/users');
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fusers$/);

  await signIn(page, 'ana.ribeiro@example.org', 'wrong-password');
  await expect(page.getByText('The email or password is wrong')).toBeVisible();

  await signIn(page, 'ana.ribeiro@example.org', 'sample-password');
  await expect(page.locator('.it-shell-main > h1')).toHaveText('Users');

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByText('You are signed out.')).toBeVisible();
  expect(errors).toEqual([]);
});

test('a request for an account waits until a manager approves it', async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) < 560, 'the flow is the same on phones');
  const errors = collectErrors(page);
  await page.goto('/sign-up');
  await page.getByRole('textbox', { name: 'Name' }).fill('Teresa Lima');
  await page.getByRole('textbox', { name: 'Email' }).fill('teresa.lima@example.org');
  await page.getByLabel(/^Password/).fill('short');
  await page.getByLabel('I accept the').check();
  await page.getByRole('button', { name: 'Ask for an account' }).click();
  await expect(page.getByText('Use at least 12 characters.')).toBeVisible();

  await page.getByLabel(/^Password/).fill('a-long-enough-password');
  await page.getByRole('button', { name: 'Ask for an account' }).click();
  await expect(heading(page)).toHaveText('Request sent');

  // The sample backend keeps its data until the page reloads, so move with links from here on.
  await page.getByRole('link', { name: 'Back to sign in' }).click();
  await signIn(page, 'teresa.lima@example.org', 'a-long-enough-password');
  await expect(page.getByText('Your account is waiting for approval')).toBeVisible();

  await signIn(page, 'ana.ribeiro@example.org', 'sample-password');
  await page.locator('.it-sidenav a', { hasText: 'Users' }).click();
  await page.getByRole('cell', { name: 'Teresa Lima' }).click();
  await page.getByRole('button', { name: 'Approve' }).click();
  const dialog = page.getByRole('dialog', { name: 'Approve Teresa Lima' });
  await dialog.getByLabel('Technician').check();
  await dialog.getByRole('button', { name: 'Approve' }).click();
  await expect(page.getByText('Teresa Lima can sign in now')).toBeVisible();
  expect(errors).toEqual([]);
});

test('an invitation sets a password and signs the person in', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/invitation?token=no-such-token');
  await expect(heading(page)).toHaveText('This invitation link does not work');

  await page.goto('/invitation?token=invite-u-4');
  await page.getByLabel(/^Password/).fill('a-long-enough-password');
  await page.getByLabel('I accept the').check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.locator('.it-shell-main > h1')).toHaveText('Home');
  // A viewer does not see the Users page.
  await expect(page.locator('.it-sidenav a', { hasText: 'Users' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a forgotten password can be reset from the email link', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/forgot-password');
  await page.getByRole('textbox', { name: 'Email' }).fill('someone@example.org');
  await page.getByRole('button', { name: 'Send the link' }).click();
  await expect(heading(page)).toHaveText('Check your email');

  await page.getByRole('link', { name: 'open the link from the email' }).click();
  await page.getByLabel('New password').fill('a-new-long-password');
  await page.getByRole('button', { name: 'Save password' }).click();
  await expect(page.getByText('Your new password is saved. Sign in with it.')).toBeVisible();

  await page.goto('/reset-password?token=old');
  await expect(heading(page)).toHaveText('This link does not work');
  expect(errors).toEqual([]);
});

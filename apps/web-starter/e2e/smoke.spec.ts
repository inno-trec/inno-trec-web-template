import { expect, test, type Page } from '@playwright/test';
import { chooseFromUserMenu, collectErrors, expectLoaded, expectNoSidewaysScroll } from './helpers';

/** These tests start signed in as an administrator. The sign-in screens are tested in accounts.spec.ts. */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const session = { userId: 'u-1', name: 'Ana Ribeiro', email: 'ana.ribeiro@example.org', role: 'admin', roleLabel: 'Administrator' };
    sessionStorage.setItem('inno-trec.session', JSON.stringify(session));
  });
});

/** Pages come from the side navigation, so a new NAV_SECTIONS entry is tested without editing this file. */
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
      // The heading comes from NAV_SECTIONS, so also check that a route renders a real page, not the fallback.
      await expect(page.locator('[data-not-found]'), `no route for ${href} in App.tsx`).toHaveCount(0);
      // Every INNO-TREC tool shows the EU funding emblem in the footer.
      await expect(page.getByRole('img', { name: 'Funded by the European Union' })).toBeVisible();
      await expectLoaded(page);
      await expectNoSidewaysScroll(page);
    });
  }

  expect(errors).toEqual([]);
});

/** Pages in the user menu (Account, Notifications, ...), without Sign out. A new menu item is tested without editing this file. */
async function userMenuPages(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /^Ana Ribeiro/ }).click();
  const items = page.getByRole('menuitem');
  await expect(items.first()).toBeVisible();
  const hrefs = await items.evaluateAll((els) => els.map((el) => el.getAttribute('href')));
  return hrefs.filter((href): href is string => !!href && !href.endsWith('/sign-out'));
}

test('every page in the user menu renders its heading and footer without sideways scroll or console errors', async ({ page }) => {
  const errors = collectErrors(page);
  const hrefs = await userMenuPages(page);
  expect(hrefs.length).toBeGreaterThan(0);

  for (const href of hrefs) {
    await test.step(href, async () => {
      await page.goto(href);
      // The heading comes from OTHER_PAGES, and it need not equal the menu item's label ("Account" opens "Your account").
      await expect(page.locator('.it-shell-main > h1')).toHaveText(/\S/);
      await expect(page.locator('[data-not-found]'), `no route for ${href} in App.tsx`).toHaveCount(0);
      await expect(page.getByRole('img', { name: 'Funded by the European Union' })).toBeVisible();
      await expectLoaded(page);
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

test('the home page shows its records, the empty state and the error state', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.getByRole('cell', { name: 'First record' })).toBeVisible();
  await page.goto('/?demo=empty');
  await expect(page.getByRole('heading', { name: 'No records yet' })).toBeVisible();
  expect(errors).toEqual([]);

  // A failed request shows a message and a way to try again, not an empty page.
  await page.goto('/?demo=error');
  await expect(page.getByText('The records could not be loaded')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
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

test('the account page saves the profile and checks the current password', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await chooseFromUserMenu(page, 'Account');
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

test('the user menu holds Account, Notifications and Sign out, and works with the keyboard', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  const trigger = page.getByRole('button', { name: /^Ana Ribeiro/ });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  // The arrow key opens the menu and moves to the first item; Esc closes it and returns to the button.
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Account' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Notifications' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(trigger).toBeFocused();

  // A click outside closes it.
  await trigger.click();
  await expect(page.getByRole('menuitem')).toHaveText(['Account', 'Notifications', 'Sign out']);
  await page.locator('.it-shell-main').click({ position: { x: 4, y: 4 } });
  await expect(page.getByRole('menu')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the notifications page lists messages, and marking them read updates the count', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  // The count is on the avatar and in the button's name.
  const trigger = page.getByRole('button', { name: /3 unread notifications$/ });
  await expect(trigger).toBeVisible();

  await chooseFromUserMenu(page, 'Notifications');
  await expect(page.locator('.it-shell-main > h1')).toHaveText('Notifications');
  await expect(page.getByText('3 unread')).toBeVisible();
  await expectNoSidewaysScroll(page);

  // A link in a notification uses the brand blue, not the browser's default.
  await expect(page.locator('.it-shell-main a').first()).toHaveCSS('color', 'rgb(25, 120, 184)');

  await page.getByRole('button', { name: /^Mark “.*” as read$/ }).first().click();
  await expect(page.getByText('2 unread')).toBeVisible();
  await expect(page.getByRole('button', { name: /2 unread notifications$/ })).toBeVisible();

  await page.getByRole('button', { name: 'Mark all as read' }).click();
  await expect(page.getByText('All read')).toBeVisible();
  // With nothing unread, the button's name carries no count.
  await expect(page.getByRole('button', { name: 'Ana Ribeiro, Administrator', exact: true })).toBeVisible();

  await page.goto('/notifications?demo=empty');
  await expect(page.getByRole('heading', { name: 'No notifications' })).toBeVisible();
  await page.goto('/notifications?demo=error');
  await expect(page.getByText('The notifications could not be loaded')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  expect(errors.filter((e) => !/Failed to load resource/.test(e))).toEqual([]);
});

test('the side navigation groups pages under headings', async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) < 720, 'headings are hidden when the navigation becomes a row');
  await page.goto('/');
  await expect(page.locator('.it-sidenav .it-nav-section').first()).toBeVisible();
});

test('a modified click on the user menu leaves navigation to the browser', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^Ana Ribeiro/ }).click();
  const opened = context.waitForEvent('page');
  await page.getByRole('menuitem', { name: 'Notifications' }).click({ modifiers: ['ControlOrMeta'] });
  const tab = await opened;
  // The sample session lives in one tab's storage, so the new tab may ask to sign in. It still aims at the page.
  await expect(tab).toHaveURL(/notifications/);
  // The first tab did not navigate.
  await expect(page).toHaveURL(/\/$/);
});

test('a menu opened with Enter focuses its first item, and a choice returns focus to the button', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: /^Ana Ribeiro/ });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitem', { name: 'Account' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();

  // Choosing an item closes the menu and leaves focus on the button, where the person was.
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('notifications are read per person', async ({ page }) => {
  await page.goto('/notifications');
  await expect(page.getByText('3 unread')).toBeVisible();
  await page.getByRole('button', { name: 'Mark all as read' }).click();
  await expect(page.getByText('All read')).toBeVisible();

  // Another person signs in without a page reload: their messages are still unread.
  await chooseFromUserMenu(page, 'Sign out');
  await expect(page.getByText('You are signed out.')).toBeVisible();
  await page.getByRole('textbox', { name: 'Email' }).fill('manuel.ferreira@example.org');
  await page.getByLabel(/^Password/).fill('sample-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('button', { name: /^Manuel Ferreira/ }).click();
  await page.getByRole('menuitem', { name: 'Notifications' }).click();
  await expect(page.getByText('3 unread')).toBeVisible();
});

import { AppShell, Footer, InlineAlert, type NavItem, type NavSection } from '@inno-trec/ui-web';
import euEmblem from '@inno-trec/ui-web/assets/funding/eu-funded-negative.png';
import logo from '@inno-trec/ui-web/assets/logos/logo-landscape-colour.png';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { allowed, useSession } from '../auth/session';
import { FOOTER_LINKS, TOOL_NAME } from '../config';
import type { RoleId } from '../data/api';
import { useNotifications } from '../notifications/notifications';

type Page = NavItem & { href: string; roles?: RoleId[] };

type Section = { title?: string; items: Page[] };

/**
 * `id` is the route path. `label` is also the page heading. `roles` limits who sees the page (no list:
 * everyone). Manager tools may use more than five items; member tools should not.
 * Sections organize a longer menu. A `title` shows a heading above the section. A section without a
 * `title`, after the first one, shows a dividing line. A section with no visible item disappears.
 */
const NAV_SECTIONS: Section[] = [
  { items: [{ id: '/', href: '/', label: 'Home', icon: 'sun' }] },
  { title: 'Administration', items: [{ id: '/users', href: '/users', label: 'Users', icon: 'person', roles: ['admin', 'manager'] }] },
];
const NAV = NAV_SECTIONS.flatMap((section) => section.items);

/** Links include the base path (`base` in vite.config.ts), so they also work when opened in a new tab. */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Pages reached from the top bar instead of the side navigation. */
const OTHER_PAGES: Page[] = [
  { id: '/account', href: '/account', label: 'Your account' },
  { id: '/notifications', href: '/notifications', label: 'Notifications' },
];

/**
 * The page frame every tool shares: top bar, side navigation, a pale gray main area and the footer.
 * The footer carries the EU funding emblem and statement that every INNO-TREC tool must show.
 * Navigation items are real links, and clicks are handled by the router without a page load.
 */
export function ToolShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { session } = useSession();
  const role = session!.role;
  const { unread } = useNotifications();
  const navSections: NavSection[] = NAV_SECTIONS.map((section) => ({
    title: section.title,
    items: section.items.filter((item) => allowed(role, item.roles)).map((item) => ({ ...item, href: BASE + item.href })),
  })).filter((section) => section.items.length > 0);
  const active = [...NAV, ...OTHER_PAGES].find((item) => item.href === pathname);
  const permitted = !active || allowed(role, active.roles);

  return (
    <AppShell
      logoSrc={logo}
      title={TOOL_NAME}
      user={{ name: session!.name, role: session!.roleLabel }}
      userMenu={{
        items: [
          { id: '/account', href: `${BASE}/account`, label: 'Account', icon: 'person' },
          { id: '/notifications', href: `${BASE}/notifications`, label: 'Notifications', icon: 'bell' },
          { id: '/sign-out', href: `${BASE}/sign-out`, label: 'Sign out', icon: 'signOut', divider: true },
        ],
        // `unread` is undefined while the count is unknown, and then no number shows.
        count: unread,
        countLabel: 'unread notifications',
        onSelect: (id, event) => {
          event.preventDefault();
          navigate(id);
        },
      }}
      navSections={navSections}
      activeId={active?.id}
      heading={active?.label ?? 'Page not found'}
      onNavigate={(id, event) => {
        event.preventDefault();
        navigate(id);
      }}
      footer={<Footer emblemSrc={euEmblem} links={FOOTER_LINKS} />}
    >
      {/* Pages render here. Lay them out with Tailwind: gap-space-4 between blocks, p-space-4 inside them. */}
      {permitted ? (
        <Outlet />
      ) : (
        <div className="max-w-[640px]">
          <InlineAlert tone="info" title="You do not have access to this page">
            Your role is {session!.roleLabel}. Ask an administrator if you need this page.
          </InlineAlert>
        </div>
      )}
    </AppShell>
  );
}

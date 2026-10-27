import { AppShell, Button, Footer, InlineAlert, type NavItem } from '@inno-trec/ui-web';
import euEmblem from '@inno-trec/ui-web/assets/funding/eu-funded-negative.png';
import logo from '@inno-trec/ui-web/assets/logos/logo-landscape-colour.png';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { allowed, useSession } from '../auth/session';
import { FOOTER_LINKS, TOOL_NAME } from '../config';
import type { RoleId } from '../data/api';

type Page = NavItem & { href: string; roles?: RoleId[] };

/**
 * `id` is the route path. `label` is also the page heading. `roles` limits who sees the page (no list:
 * everyone). Manager tools may use more than five items; member tools should not.
 */
const NAV: Page[] = [
  { id: '/', href: '/', label: 'Home', icon: 'sun' },
  { id: '/users', href: '/users', label: 'Users', icon: 'person', roles: ['admin', 'manager'] },
];

/** Links include the base path (`base` in vite.config.ts), so they also work when opened in a new tab. */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Pages reached from the top bar instead of the side navigation. */
const OTHER_PAGES: Page[] = [{ id: '/account', href: '/account', label: 'Your account' }];

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
  const nav = NAV.filter((item) => allowed(role, item.roles)).map((item) => ({ ...item, href: BASE + item.href }));
  const active = [...NAV, ...OTHER_PAGES].find((item) => item.href === pathname);
  const permitted = !active || allowed(role, active.roles);

  return (
    <AppShell
      logoSrc={logo}
      title={TOOL_NAME}
      user={{ name: session!.name, role: session!.roleLabel }}
      topActions={
        <>
          <Link className="it-btn it-btn-ghost it-btn-sm no-underline" to="/account">
            Account
          </Link>
          <Button variant="ghost" size="sm" onClick={() => navigate('/sign-out')}>
            Sign out
          </Button>
        </>
      }
      navItems={nav}
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

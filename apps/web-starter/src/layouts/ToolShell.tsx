import { AppShell, type NavItem } from '@inno-trec/ui-web';
import logo from '@inno-trec/ui-web/assets/logos/logo-landscape-colour.png';
import { Outlet, useLocation, useNavigate } from 'react-router';

/** Name of your tool, shown in the top bar. */
const TOOL_NAME = 'Community Ledger';

/** Replace with the signed-in user from your auth layer. */
const USER = { name: 'Sample User', role: 'Community manager' };

/** `id` is the route path. `label` is also the page heading. Manager tools may use more than five items; member tools should not. */
const NAV: Array<NavItem & { href: string }> = [
  { id: '/', href: '/', label: 'Overview', icon: 'panel' },
  { id: '/wallets', href: '/wallets', label: 'Wallets', icon: 'coins' },
  { id: '/send', href: '/send', label: 'Send credits', icon: 'arrowOut' },
];

/**
 * The page frame every tool shares: top bar, side navigation and a pale gray main area.
 * Navigation items are real links, and clicks are handled by the router without a page load.
 */
export function ToolShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = NAV.find((item) => item.href === pathname);

  return (
    <AppShell
      logoSrc={logo}
      title={TOOL_NAME}
      user={USER}
      navItems={NAV}
      activeId={active?.id}
      heading={active?.label ?? 'Page not found'}
      onNavigate={(id, event) => {
        event.preventDefault();
        navigate(id);
      }}
    >
      {/* Pages render here. Lay them out with Tailwind: gap-space-4 between blocks, p-space-4 inside them. */}
      <Outlet />
    </AppShell>
  );
}

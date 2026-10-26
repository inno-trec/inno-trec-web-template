import { AppShell, Footer, type NavItem } from '@inno-trec/ui-web';
import euEmblem from '@inno-trec/ui-web/assets/funding/eu-funded-negative.png';
import logo from '@inno-trec/ui-web/assets/logos/logo-landscape-colour.png';
import { Outlet, useLocation, useNavigate } from 'react-router';

/** Name of your tool, shown in the top bar. */
const TOOL_NAME = 'Community Energy';

/** Replace with the signed-in user from your auth layer. */
const USER = { name: 'Sample User', role: 'Community manager' };

/** `id` is the route path. `label` is also the page heading. Manager tools may use more than five items; member tools should not. */
const NAV: Array<NavItem & { href: string }> = [
  { id: '/', href: '/', label: 'Overview', icon: 'sun' },
  { id: '/performance', href: '/performance', label: 'PV performance', icon: 'panel' },
  { id: '/data-checks', href: '/data-checks', label: 'Data checks', icon: 'check' },
  { id: '/alerts', href: '/alerts', label: 'Alerts', icon: 'alert' },
  { id: '/assets', href: '/assets', label: 'Assets', icon: 'wrench' },
  { id: '/users', href: '/users', label: 'Users', icon: 'person' },
];

/** Legal links in the footer. Point the privacy policy at your tool's own policy if it has one. */
const FOOTER_LINKS = [{ label: 'Privacy Policy', href: 'https://inno-trec.eu/privacy-policy/' }];

/**
 * The page frame every tool shares: top bar, side navigation, a pale gray main area and the footer.
 * The footer carries the EU funding emblem and statement that every INNO-TREC tool must show.
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
      footer={<Footer emblemSrc={euEmblem} links={FOOTER_LINKS} />}
    >
      {/* Pages render here. Lay them out with Tailwind: gap-space-4 between blocks, p-space-4 inside them. */}
      <Outlet />
    </AppShell>
  );
}

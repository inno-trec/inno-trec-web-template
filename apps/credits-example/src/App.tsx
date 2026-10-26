import { Route, Routes } from 'react-router';
import { ToolShell } from './layouts/ToolShell';
import { DashboardPage } from './pages/DashboardPage';
import { MyWalletPage } from './pages/MyWalletPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SendCreditsPage } from './pages/SendCreditsPage';
import { WalletsPage } from './pages/WalletsPage';

/**
 * Add a page in three steps:
 *   1. create it in src/pages/
 *   2. add a <Route> below
 *   3. add an entry to NAV in src/layouts/ToolShell.tsx
 */
export function App() {
  return (
    <Routes>
      <Route element={<ToolShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="wallets" element={<WalletsPage />} />
        <Route path="send" element={<SendCreditsPage />} />
        <Route path="my-wallet" element={<MyWalletPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

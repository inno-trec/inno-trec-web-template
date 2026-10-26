import { Route, Routes } from 'react-router';
import { ToolShell } from './layouts/ToolShell';
import { AssetsPage } from './pages/AssetsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OverviewPage } from './pages/OverviewPage';
import { UsersPage } from './pages/UsersPage';

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
        <Route index element={<OverviewPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

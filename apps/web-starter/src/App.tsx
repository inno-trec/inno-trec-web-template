import { Route, Routes } from 'react-router';
import { RequireSession, SignOut } from './auth/session';
import { ToolShell } from './layouts/ToolShell';
import { AccountPage } from './pages/AccountPage';
import { AlertsPage } from './pages/AlertsPage';
import { AssetsPage } from './pages/AssetsPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { InvitationPage } from './pages/auth/InvitationPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { SignInPage } from './pages/auth/SignInPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { DataChecksPage } from './pages/DataChecksPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OverviewPage } from './pages/OverviewPage';
import { PerformancePage } from './pages/PerformancePage';
import { UsersPage } from './pages/UsersPage';

/**
 * Add a page in three steps:
 *   1. create it in src/pages/
 *   2. add a <Route> below (inside ToolShell for signed-in pages)
 *   3. add an entry to NAV in src/layouts/ToolShell.tsx
 */
export function App() {
  return (
    <Routes>
      {/* Screens without a session */}
      <Route path="sign-in" element={<SignInPage />} />
      <Route path="sign-up" element={<SignUpPage />} />
      <Route path="invitation" element={<InvitationPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />
      <Route path="sign-out" element={<SignOut />} />

      {/* Everything else needs a session */}
      <Route
        element={
          <RequireSession>
            <ToolShell />
          </RequireSession>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="performance" element={<PerformancePage />} />
        <Route path="data-checks" element={<DataChecksPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

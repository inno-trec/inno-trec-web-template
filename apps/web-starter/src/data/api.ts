import { ApiError } from './errors';
import * as server from './fakeServer';
import type { Invitation, RoleId, UserChanges } from './types';

/**
 * CLIENT of the backend. Pages call these functions only.
 *
 * Today each function calls the fake backend in fakeServer.ts. To use your backend, replace the call
 * with fetch (for example `fetch(`${API}/records`)`) and keep the rest: adapt the JSON here when the
 * screens need another shape (times as numbers for charts, for example), and `call` turns every failure
 * into an ApiError (one message per field for forms).
 */

export { ApiError };
export type { ExampleRecord, Role, RoleId, Session, User } from './types';

/** Runs a request. A backend error passes through; anything else (no network, a crash) becomes `network`. */
async function call<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('network');
  }
}

/* ---------- Example ---------- */

export const listRecords = () => call(() => server.listRecords()).then((r) => r.records);

/* ---------- Users ---------- */

export const listUsers = () => call(() => server.listUsers());
export const inviteUser = (input: Invitation) => call(() => server.inviteUser(input));
export const updateUser = (id: string, changes: UserChanges) => call(() => server.updateUser(id, changes));
export const approveRequest = (id: string, role: RoleId) => call(() => server.approveRequest(id, role));
export const declineRequest = (id: string) => call(() => server.declineRequest(id));

/* ---------- Accounts ----------
 * With an OpenID Connect provider (for example Keycloak), signing in, invitations and password resets may
 * happen on the provider's own pages; these screens then serve as the design for its theme.
 */

export type { AccountRequest } from './fakeServer';
export const SAMPLE_PASSWORD = server.SAMPLE_PASSWORD;
export const signIn = (email: string, password: string) => call(() => server.signIn(email, password));
export const requestAccount = (input: server.AccountRequest) => call(() => server.requestAccount(input));
export const getInvitation = (token: string) => call(() => server.getInvitation(token));
export const acceptInvitation = (token: string, input: { name: string; password: string; acceptPolicy: boolean }) => call(() => server.acceptInvitation(token, input));
export const requestPasswordReset = (email: string) => call(() => server.requestPasswordReset(email));
export const checkResetLink = (token: string) => call(() => server.checkResetLink(token));
export const resetPassword = (token: string, password: string) => call(() => server.resetPassword(token, password));
export const getAccount = (userId: string) => call(() => server.getAccount(userId));
export const updateAccount = (userId: string, changes: { name: string; emailAlerts: boolean }) => call(() => server.updateAccount(userId, changes));
export const changePassword = (userId: string, current: string, next: string) => call(() => server.changePassword(userId, current, next));

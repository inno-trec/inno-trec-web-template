import { ApiError } from './errors';
import type { ExampleRecord, Invitation, Role, Session, User, UserChanges } from './types';

/**
 * FAKE BACKEND. It answers with sample data in the shapes of types.ts, so the client in api.ts can later
 * call your real backend with fetch and keep everything else. It also does the backend's work, such as
 * the checks that forms rely on (taken email, password length, expired links). Delete this file when
 * api.ts calls your backend.
 *
 * Add one of these to the address to see the other states:
 *   ?demo=empty   no data
 *   ?demo=error   every request fails
 */

const demo = () => new URLSearchParams(window.location.search).get('demo');
const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const iso = (ms: number) => new Date(ms).toISOString();
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const ago = (ms: number) => iso(Date.now() - ms);

async function respond(ms: number) {
  await delay(ms);
  if (demo() === 'error') throw new ApiError('unavailable');
}

function invalid(field: string, code: string, message: string): never {
  throw new ApiError(code, { [field]: message });
}

/* ---------- Example ---------- */

const RECORDS: ExampleRecord[] = [
  { id: 'r-1', name: 'First record', status: 'active', updatedAt: ago(2 * HOUR) },
  { id: 'r-2', name: 'Second record', status: 'active', updatedAt: ago(DAY) },
  { id: 'r-3', name: 'Third record', status: 'paused', updatedAt: null },
];

export async function listRecords(): Promise<{ records: ExampleRecord[] }> {
  await respond(400);
  return { records: demo() === 'empty' ? [] : RECORDS };
}

/* ---------- Users ---------- */
const ROLES: Role[] = [
  { id: 'viewer', label: 'Viewer', description: 'Sees the data in the tool.' },
  { id: 'technician', label: 'Technician', description: 'Also handles tasks, such as alerts.' },
  { id: 'manager', label: 'Community manager', description: 'Also manages members and settings.' },
  { id: 'admin', label: 'Administrator', description: 'Also manages users and roles.' },
];

let users: User[] = [
  { id: 'u-1', name: 'Ana Ribeiro', email: 'ana.ribeiro@example.org', role: 'admin', status: 'active', lastActiveAt: ago(2 * HOUR), accessUntil: null, emailAlerts: true, note: '' },
  { id: 'u-2', name: 'Manuel Ferreira', email: 'manuel.ferreira@example.org', role: 'manager', status: 'active', lastActiveAt: ago(DAY), accessUntil: null, emailAlerts: true, note: '' },
  { id: 'u-3', name: 'Carla Sousa', email: 'carla.sousa@example.org', role: 'technician', status: 'active', lastActiveAt: ago(3 * DAY), accessUntil: '2027-03-31', emailAlerts: true, note: 'Installer contract until the end of March.' },
  { id: 'u-4', name: 'José Pinto', email: 'jose.pinto@example.org', role: 'viewer', status: 'invited', lastActiveAt: null, accessUntil: null, emailAlerts: false, note: '' },
  { id: 'u-5', name: 'Rosa Almeida', email: 'rosa.almeida@example.org', role: 'viewer', status: 'deactivated', lastActiveAt: ago(60 * DAY), accessUntil: null, emailAlerts: false, note: 'Moved out of the community.' },
  { id: 'u-6', name: 'Paulo Costa', email: 'paulo.costa@example.org', role: 'viewer', status: 'requested', lastActiveAt: null, accessUntil: null, emailAlerts: false, note: '', requestMessage: 'I live at Rua do Sol 12 and joined the community in September.' },
];

export async function listUsers(): Promise<{ users: User[]; roles: Role[] }> {
  await respond(400);
  return { users: demo() === 'empty' ? [] : users, roles: ROLES };
}

export async function inviteUser(input: Invitation): Promise<User> {
  await respond(600);
  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) invalid('email', 'email_invalid', 'Enter an email address like name@example.org.');
  if (users.some((u) => u.email === email)) invalid('email', 'email_taken', 'Someone already uses this email. Choose that person in the list instead.');
  const user: User = { id: `u-${Date.now()}`, name: input.name.trim(), email, role: input.role, status: 'invited', lastActiveAt: null, accessUntil: null, emailAlerts: false, note: '' };
  users = [...users, user];
  return user;
}

/** Approving a request sets the person's role and makes the account active. Declining deletes the request. */
export async function approveRequest(id: string, role: User['role']): Promise<User> {
  await respond(500);
  return updateUser(id, { role, status: 'active' });
}

export async function declineRequest(id: string): Promise<void> {
  await respond(500);
  users = users.filter((u) => u.id !== id);
}

export async function updateUser(id: string, changes: UserChanges): Promise<User> {
  await respond(500);
  const today = new Date().toISOString().slice(0, 10);
  if (changes.accessUntil && changes.accessUntil < today) invalid('accessUntil', 'date_past', 'Choose today or a later day.');
  users = users.map((u) => (u.id === id ? { ...u, ...changes } : u));
  return users.find((u) => u.id === id)!;
}

/* ---------- Accounts ----------
 * A real backend (or the identity provider) keeps password hashes, sends the emails and issues the session.
 * Here every sample account uses the password SAMPLE_PASSWORD, and links carry fixed tokens:
 *   /invitation?token=invite-u-4     José Pinto's invitation
 *   /reset-password?token=sample     a valid reset link; any other token has expired
 */

export const SAMPLE_PASSWORD = 'sample-password';
const passwords = new Map<string, string>();
const MIN_PASSWORD = 12;

const passwordOf = (u: User) => passwords.get(u.id) ?? SAMPLE_PASSWORD;
const roleLabel = (id: User['role']) => ROLES.find((r) => r.id === id)?.label ?? id;
const toSession = (u: User): Session => ({ userId: u.id, name: u.name, email: u.email, role: u.role, roleLabel: roleLabel(u.role) });

function checkPassword(password: string, field = 'password') {
  if (password.length < MIN_PASSWORD) invalid(field, 'password_short', `Use at least ${MIN_PASSWORD} characters.`);
}

function checkEmail(raw: string) {
  const email = raw.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) invalid('email', 'email_invalid', 'Enter an email address like name@example.org.');
  return email;
}

export async function signIn(email: string, password: string): Promise<Session> {
  await respond(600);
  const user = users.find((u) => u.email === email.trim().toLowerCase());
  // Never say which of the two was wrong.
  if (!user || user.status === 'invited' || passwordOf(user) !== password) throw new ApiError('invalid_credentials');
  if (user.status === 'requested') throw new ApiError('account_requested');
  if (user.status === 'deactivated') throw new ApiError('account_deactivated');
  users = users.map((u) => (u.id === user.id ? { ...u, lastActiveAt: iso(Date.now()) } : u));
  return toSession(user);
}

export interface AccountRequest {
  name: string;
  email: string;
  password: string;
  message: string;
  acceptPolicy: boolean;
}

/** Self sign-up: the account waits for a manager's approval. */
export async function requestAccount(input: AccountRequest): Promise<void> {
  await respond(700);
  const email = checkEmail(input.email);
  if (users.some((u) => u.email === email)) invalid('email', 'email_taken', 'An account already uses this email. Sign in, or reset your password.');
  checkPassword(input.password);
  if (!input.acceptPolicy) invalid('acceptPolicy', 'required', 'Accept the privacy policy to continue.');
  const user: User = { id: `u-${Date.now()}`, name: input.name.trim(), email, role: 'viewer', status: 'requested', lastActiveAt: null, accessUntil: null, emailAlerts: false, note: '', requestMessage: input.message.trim() };
  users = [...users, user];
  passwords.set(user.id, input.password);
}

const invitedUser = (token: string) => users.find((u) => u.status === 'invited' && token === `invite-${u.id}`);

export async function getInvitation(token: string): Promise<{ name: string; email: string; roleLabel: string; invitedBy: string }> {
  await respond(400);
  const user = invitedUser(token);
  if (!user) throw new ApiError('link_expired');
  return { name: user.name, email: user.email, roleLabel: roleLabel(user.role), invitedBy: 'Ana Ribeiro' };
}

export async function acceptInvitation(token: string, input: { name: string; password: string; acceptPolicy: boolean }): Promise<Session> {
  await respond(700);
  const user = invitedUser(token);
  if (!user) throw new ApiError('link_expired');
  checkPassword(input.password);
  if (!input.acceptPolicy) invalid('acceptPolicy', 'required', 'Accept the privacy policy to continue.');
  passwords.set(user.id, input.password);
  return updateUser(user.id, { status: 'active' }).then((u) => {
    users = users.map((x) => (x.id === u.id ? { ...x, name: input.name.trim() || x.name, lastActiveAt: iso(Date.now()) } : x));
    return toSession(users.find((x) => x.id === u.id)!);
  });
}

/** Always answers the same way, so nobody can learn which emails have an account. */
export async function requestPasswordReset(email: string): Promise<void> {
  await respond(600);
  checkEmail(email);
}

export async function checkResetLink(token: string): Promise<void> {
  await respond(300);
  if (token !== 'sample') throw new ApiError('link_expired');
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await respond(600);
  if (token !== 'sample') throw new ApiError('link_expired');
  checkPassword(password);
}

export async function getAccount(userId: string): Promise<User> {
  await respond(400);
  const user = users.find((u) => u.id === userId);
  if (!user) throw new ApiError('not_found');
  return user;
}

export async function updateAccount(userId: string, changes: { name: string; emailAlerts: boolean }): Promise<User> {
  await respond(500);
  if (!changes.name.trim()) invalid('name', 'required', 'Enter your name.');
  users = users.map((u) => (u.id === userId ? { ...u, name: changes.name.trim(), emailAlerts: changes.emailAlerts } : u));
  return users.find((u) => u.id === userId)!;
}

export async function changePassword(userId: string, current: string, next: string): Promise<void> {
  await respond(600);
  const user = users.find((u) => u.id === userId);
  if (!user || passwordOf(user) !== current) invalid('currentPassword', 'password_wrong', 'This is not your current password.');
  checkPassword(next, 'newPassword');
  if (next === current) invalid('newPassword', 'password_same', 'Choose a password you have not used here before.');
  passwords.set(userId, next);
}


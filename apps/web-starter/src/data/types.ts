/**
 * The shapes of the data the backend sends. They are examples: replace them with the types of your
 * own backend (if it publishes an OpenAPI description, `npx openapi-typescript <url> -o src/data/schema.d.ts`
 * generates them). Conventions the pages expect: instants as ISO strings in UTC, the unit in each field
 * name, and `null` (never 0) for missing data.
 */

/* ---------- Example ----------
 * The records that HomePage lists. Replace them with the data of your tool's first page.
 */

export interface ExampleRecord {
  id: string;
  name: string;
  status: 'active' | 'paused';
  updatedAt: string | null;
}

/* ---------- Users and accounts ---------- */

export type RoleId = 'viewer' | 'technician' | 'manager' | 'admin';

export interface Role {
  id: RoleId;
  label: string;
  description: string;
}

/** `requested`: the person created an account and waits for a manager to approve it. */
export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleId;
  status: 'requested' | 'invited' | 'active' | 'deactivated';
  lastActiveAt: string | null;
  accessUntil: string | null;
  emailAlerts: boolean;
  note: string;
  /** What the person wrote when they asked for an account. */
  requestMessage?: string;
}

export interface Invitation {
  name: string;
  email: string;
  role: RoleId;
  sendEmail: boolean;
}

export interface UserChanges {
  role?: RoleId;
  accessUntil?: string | null;
  emailAlerts?: boolean;
  note?: string;
  status?: 'active' | 'deactivated';
}

/* ---------- Notifications ---------- */

/** A message for the signed-in person. `readAt` is `null` until the person has read it. */
export interface UserNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
  /** A page of this tool that the message is about, for example `/users`. */
  href: string | null;
}

/** The person who is signed in. */
export interface Session {
  userId: string;
  name: string;
  email: string;
  role: RoleId;
  roleLabel: string;
}

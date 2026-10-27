import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import type { RoleId, Session } from '../data/api';

/**
 * WHO IS SIGNED IN. The starter keeps the session in the browser so the sample works without a server.
 * A real tool gets it from its backend or identity provider (a cookie set by the server, or an OpenID
 * Connect library), and keeps only what the screens show here: name, role, and whether someone is signed in.
 * The backend checks the role on every request; hiding a page is for clarity, not for security.
 */

const KEY = 'inno-trec.session';

function read(): Session | null {
  for (const store of [sessionStorage, localStorage]) {
    try {
      const raw = store.getItem(KEY);
      if (raw) return JSON.parse(raw) as Session;
    } catch {
      // Storage can be blocked (private windows). Then nobody stays signed in after a reload.
    }
  }
  return null;
}

function write(session: Session | null, remember = false) {
  try {
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
    if (session) (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(session));
  } catch {
    // See read().
  }
}

interface SessionContext {
  session: Session | null;
  signedIn: (session: Session, remember?: boolean) => void;
  signOut: () => void;
  /** Changes what the screens show (for example a new name) and keeps the "keep me signed in" choice. */
  update: (changes: Partial<Session>) => void;
}

const Context = createContext<SessionContext | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(read);
  const value: SessionContext = {
    session,
    signedIn: (s, remember) => {
      write(s, remember);
      setSession(s);
    },
    signOut: () => {
      write(null);
      setSession(null);
    },
    update: (changes) => {
      if (!session) return;
      let remember = false;
      try {
        remember = localStorage.getItem(KEY) !== null;
      } catch {
        // See read().
      }
      const next = { ...session, ...changes };
      write(next, remember);
      setSession(next);
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSession() {
  const context = useContext(Context);
  if (!context) throw new Error('useSession needs a SessionProvider');
  return context;
}

/** Sends people without a session to the sign-in screen, and back to the page they asked for afterwards. */
export function RequireSession({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const { pathname, search } = useLocation();
  if (!session) {
    const next = pathname === '/' && !search ? '' : `?next=${encodeURIComponent(pathname + search)}`;
    return <Navigate to={`/sign-in${next}`} replace />;
  }
  return children;
}

/**
 * The /sign-out route. It sits outside RequireSession, so ending the session does not first send the
 * person to sign in with a `next` address. A real tool also tells the backend to end the session here.
 */
export function SignOut() {
  const { session, signOut } = useSession();
  useEffect(() => {
    if (session) signOut();
  }, [session, signOut]);
  return session ? null : <Navigate to="/sign-in?reason=signed-out" replace />;
}

/** True when the role may open a page that lists `roles`. No list means everyone. */
export const allowed = (role: RoleId, roles?: RoleId[]) => !roles || roles.includes(role);

/** Only follow `next` inside this app, never to another site. */
export function safeNext(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

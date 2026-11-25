import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { NOTIFICATIONS_REFRESH_MS } from '../config';
import { listNotifications, markAllNotificationsRead, markNotificationRead, type UserNotification } from '../data/api';

/**
 * THE SIGNED-IN PERSON'S NOTIFICATIONS. The top bar shows how many are unread, and the notifications page
 * lists them. The backend decides what a notification is and when it exists; this file only loads the list,
 * refreshes it (every NOTIFICATIONS_REFRESH_MS and when the browser tab becomes visible again) and marks
 * messages as read. For push updates, replace the refresh with your backend's channel (for example
 * Server-Sent Events) and keep `useNotifications` as it is.
 */

type Load = { state: 'loading' } | { state: 'error' } | { state: 'ready'; items: UserNotification[] };

interface NotificationsContext {
  load: Load;
  /** Unread count. `undefined` while the count is unknown: an unknown count is not zero, so no badge shows. */
  unread: number | undefined;
  reload: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const Context = createContext<NotificationsContext | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const ready = useRef(false);

  const reload = useCallback(() => {
    listNotifications().then(
      (items) => {
        ready.current = true;
        setLoad({ state: 'ready', items });
      },
      // A failed refresh keeps the list the person already has. Only a failed first load is an error.
      () => {
        if (!ready.current) setLoad({ state: 'error' });
      },
    );
  }, []);

  useEffect(() => {
    reload();
    const timer = window.setInterval(reload, NOTIFICATIONS_REFRESH_MS);
    const onVisible = () => document.visibilityState === 'visible' && reload();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [reload]);

  const value = useMemo<NotificationsContext>(
    () => ({
      load,
      unread: load.state === 'ready' ? load.items.filter((n) => n.readAt === null).length : undefined,
      reload: () => {
        ready.current = false;
        setLoad({ state: 'loading' });
        reload();
      },
      markRead: async (id) => {
        const changed = await markNotificationRead(id);
        setLoad((current) => (current.state === 'ready' ? { state: 'ready', items: current.items.map((n) => (n.id === id ? changed : n)) } : current));
      },
      markAllRead: async () => {
        await markAllNotificationsRead();
        const now = new Date().toISOString();
        setLoad((current) => (current.state === 'ready' ? { state: 'ready', items: current.items.map((n) => ({ ...n, readAt: n.readAt ?? now })) } : current));
      },
    }),
    [load, reload],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useNotifications() {
  const context = useContext(Context);
  if (!context) throw new Error('useNotifications needs a NotificationsProvider');
  return context;
}

import { Badge, Button, Card, DataTable, EmptyState, InlineAlert, type Column } from '@inno-trec/ui-web';
import { useState } from 'react';
import { Link } from 'react-router';
import type { UserNotification } from '../data/api';
import { formatRelative } from '../charts/format';
import { useNotifications } from '../notifications/notifications';

/**
 * The signed-in person's notifications, newest first. Unread ones show the word "New" with the badge.
 * Opening a notification's page, or choosing "Mark as read", marks it as read.
 */
export function NotificationsPage() {
  const { load, unread, reload, markRead, markAllRead } = useNotifications();
  const [failed, setFailed] = useState(false);

  const run = (action: () => Promise<void>) => {
    setFailed(false);
    action().catch(() => setFailed(true));
  };

  const columns: Column<UserNotification>[] = [
    { key: 'status', header: 'Status', render: (n) => (n.readAt === null ? <Badge tone="info" dot>New</Badge> : <Badge tone="neutral">Read</Badge>) },
    {
      key: 'title',
      header: 'Notification',
      render: (n) => (
        <div>
          <div className={n.readAt === null ? 'font-bold' : undefined}>
            {n.href ? (
              <Link to={n.href} onClick={() => n.readAt === null && run(() => markRead(n.id))}>
                {n.title}
              </Link>
            ) : (
              n.title
            )}
          </div>
          <div className="text-ink-muted">{n.message}</div>
        </div>
      ),
    },
    { key: 'createdAt', header: 'Received', render: (n) => formatRelative(n.createdAt) },
    {
      key: 'action',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      render: (n) =>
        n.readAt === null ? (
          <Button variant="ghost" size="sm" aria-label={`Mark “${n.title}” as read`} onClick={() => run(() => markRead(n.id))}>
            Mark as read
          </Button>
        ) : null,
    },
  ];

  if (load.state === 'loading') {
    return (
      <Card>
        <p role="status" className="m-0 text-ink-muted">
          Loading notifications…
        </p>
      </Card>
    );
  }

  if (load.state === 'error') {
    return (
      <div className="flex max-w-[640px] flex-col gap-space-4">
        <InlineAlert tone="error" title="The notifications could not be loaded">
          Check your connection and try again.
        </InlineAlert>
        <div>
          <Button onClick={reload}>Try again</Button>
        </div>
      </div>
    );
  }

  if (load.items.length === 0) {
    return <EmptyState title="No notifications">Messages for you appear here.</EmptyState>;
  }

  return (
    <div className="flex flex-col gap-space-4">
      {failed && (
        <div className="max-w-[640px]">
          <InlineAlert tone="error" title="The change could not be saved">
            Check your connection and try again.
          </InlineAlert>
        </div>
      )}
      <Card
        title="Notifications"
        subtitle={unread ? `${unread} unread` : 'All read'}
        actions={
          <Button variant="secondary" size="sm" disabled={!unread} onClick={() => run(markAllRead)}>
            Mark all as read
          </Button>
        }
        flush
      >
        <DataTable columns={columns} rows={load.items} rowKey="id" />
      </Card>
    </div>
  );
}

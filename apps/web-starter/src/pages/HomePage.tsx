import { Badge, Button, Card, DataTable, EmptyState, InlineAlert, type Column } from '@inno-trec/ui-web';
import { useEffect, useState } from 'react';
import { listRecords, type ExampleRecord } from '../data/api';
import { formatRelative } from '../format';
import { RECORD_STATUS } from '../labels';

const COLUMNS: Column<ExampleRecord>[] = [
  { key: 'name', header: 'Name' },
  { key: 'status', header: 'Status', render: (r) => <Badge tone={RECORD_STATUS[r.status].tone} dot>{RECORD_STATUS[r.status].label}</Badge> },
  { key: 'updatedAt', header: 'Last update', render: (r) => formatRelative(r.updatedAt) },
];

type Load = { state: 'loading' } | { state: 'error' } | { state: 'ready'; records: ExampleRecord[] };

/**
 * An example page: replace it with your tool's first page. It shows the three states every page needs
 * while it loads data from the backend: loading, empty and error.
 * Add ?demo=empty or ?demo=error to the address to see the other states.
 * For complete pages (charts, filters, forms in dialogs), see apps/template-demo.
 */
export function HomePage() {
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setLoad({ state: 'loading' });
    listRecords().then(
      (records) => current && setLoad({ state: 'ready', records }),
      () => current && setLoad({ state: 'error' }),
    );
    return () => {
      current = false;
    };
  }, [attempt]);

  if (load.state === 'loading') {
    return (
      <Card>
        <p role="status" className="m-0 text-ink-muted">
          Loading records…
        </p>
      </Card>
    );
  }

  if (load.state === 'error') {
    return (
      <div className="flex max-w-[640px] flex-col gap-space-4">
        <InlineAlert tone="error" title="The records could not be loaded">
          Check your connection and try again.
        </InlineAlert>
        <div>
          <Button onClick={() => setAttempt((n) => n + 1)}>Try again</Button>
        </div>
      </div>
    );
  }

  if (load.records.length === 0) {
    return <EmptyState title="No records yet">Records appear here once the backend has some.</EmptyState>;
  }

  return (
    <Card title="Records" subtitle="Sample data from src/data/fakeServer.ts" flush>
      <DataTable columns={COLUMNS} rows={load.records} rowKey="id" />
    </Card>
  );
}

import { Badge, Button, Card, ConfidenceBadge, DataTable, InlineAlert, type Column } from '@inno-trec/ui-web';
import { useEffect, useState } from 'react';
import { getAssets, type Asset, type AssetStatus } from '../data/api';

/** Status always shows a word with its color. */
const STATUS: Record<AssetStatus, { tone: 'success' | 'warning' | 'danger' | 'neutral'; label: string }> = {
  RUNNING: { tone: 'success', label: 'Running' },
  ATTENTION: { tone: 'warning', label: 'Needs attention' },
  FAULT: { tone: 'danger', label: 'Fault' },
  OFFLINE: { tone: 'neutral', label: 'Offline' },
};

const COLUMNS: Column<Asset>[] = [
  { key: 'name', header: 'Asset' },
  { key: 'type', header: 'Type' },
  { key: 'site', header: 'Site' },
  { key: 'status', header: 'Status', render: (a) => <Badge tone={STATUS[a.status].tone} dot>{STATUS[a.status].label}</Badge> },
  { key: 'dataQuality', header: 'Data', render: (a) => <ConfidenceBadge level={a.dataQuality} /> },
];

type Load = { state: 'loading' } | { state: 'error' } | { state: 'ready'; assets: Asset[] };

/**
 * Pattern: list with detail. The table lists the community's assets; the panel shows the selected one
 * with the maintenance suggestions the backend writes for the person responsible.
 * Add ?demo=empty or ?demo=error to the address to see the other states.
 */
export function AssetsPage() {
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [selectedId, setSelectedId] = useState<string>();

  useEffect(() => {
    let current = true;
    setLoad({ state: 'loading' });
    getAssets().then(
      (assets) => current && setLoad({ state: 'ready', assets }),
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
          Loading assets…
        </p>
      </Card>
    );
  }

  if (load.state === 'error') {
    return (
      <div className="flex max-w-[640px] flex-col gap-space-4">
        <InlineAlert tone="error" title="The assets could not be loaded">
          Check your connection and try again.
        </InlineAlert>
        <div>
          <Button onClick={() => setAttempt((n) => n + 1)}>Try again</Button>
        </div>
      </div>
    );
  }

  const { assets } = load;
  if (assets.length === 0) {
    return (
      <InlineAlert tone="info" title="No assets yet">
        Assets appear here once they are registered.
      </InlineAlert>
    );
  }
  // Select the first asset on load, so the detail panel is never empty.
  const selected = assets.find((a) => a.id === selectedId) ?? assets[0];

  return (
    <div className="grid items-start gap-space-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card title="Assets" subtitle="Choose an asset to see its details" flush>
        <DataTable
          columns={COLUMNS}
          rows={assets}
          rowKey="id"
          selectedKey={selected?.id}
          onRowClick={(a) => setSelectedId(a.id)}
        />
      </Card>

      <AssetDetail asset={selected} />
    </div>
  );
}

function AssetDetail({ asset }: { asset: Asset }) {
  const facts: Array<[string, string]> = [
    ['Type', asset.type],
    ['Site', asset.site],
    ['Rating', asset.rating],
    ['Installed', asset.installed],
    ['Last reading', asset.lastReading],
  ];

  return (
    <Card
      title={asset.name}
      subtitle={`${asset.type} · ${asset.site}`}
      actions={<Badge tone={STATUS[asset.status].tone} dot>{STATUS[asset.status].label}</Badge>}
    >
      <div className="flex flex-col gap-space-4">
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-space-4 gap-y-space-2">
          {facts.map(([term, value]) => (
            <div key={term} className="contents">
              <dt className="text-ink-muted">{term}</dt>
              <dd className="m-0">{value}</dd>
            </div>
          ))}
          <dt className="text-ink-muted">Data</dt>
          <dd className="m-0">
            <ConfidenceBadge level={asset.dataQuality} />
          </dd>
        </dl>

        {/* The backend decides what to suggest and writes the text. The interface shows it as it comes. */}
        {asset.suggestions.length === 0 ? (
          <p className="m-0 text-ink-muted">Nothing to do for this asset.</p>
        ) : (
          asset.suggestions.map((s) => (
            <InlineAlert key={s.title} tone={s.tone} title={s.title}>
              {s.text}
            </InlineAlert>
          ))
        )}

        <div>
          {/* TODO: connect to your work-order system. It does nothing in the starter. */}
          <Button size="sm" onClick={() => console.info('TODO: create a work order for', asset.id)}>
            Create work order
          </Button>
        </div>
      </div>
    </Card>
  );
}

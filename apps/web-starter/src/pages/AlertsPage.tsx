import { Badge, Button, Card, DataTable, Dialog, InlineAlert, Select, Textarea, type Column } from '@inno-trec/ui-web';
import { useEffect, useState, type FormEvent } from 'react';
import { formatNumber, formatRelative } from '../charts/format';
import { acknowledgeAlert, ApiError, listAlerts, resolveAlert, type Alert } from '../data/api';
import { ALERT_KIND, ALERT_SEVERITY, ALERT_STATE } from '../labels';

type Show = 'open' | 'new' | 'acknowledged' | 'resolved' | 'all';
type Kind = 'all' | Alert['kind'];

const SHOW: Array<{ value: Show; label: string }> = [
  { value: 'open', label: 'Open (new and acknowledged)' },
  { value: 'new', label: 'New' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'all', label: 'All' },
];
const KINDS: Array<{ value: Kind; label: string }> = [
  { value: 'all', label: 'Corrective and predictive' },
  { value: 'corrective', label: 'Corrective: a failure to repair' },
  { value: 'predictive', label: 'Predictive: performance below normal' },
];

const COLUMNS: Column<Alert>[] = [
  { key: 'severity', header: 'Severity', render: (a) => <Badge tone={ALERT_SEVERITY[a.severity].tone} dot>{ALERT_SEVERITY[a.severity].label}</Badge> },
  { key: 'title', header: 'Alert', render: (a) => <span>{a.title}<span className="block text-ink-muted">{a.assetName}</span></span> },
  { key: 'kind', header: 'Type', render: (a) => ALERT_KIND[a.kind] },
  { key: 'raisedAt', header: 'Raised', render: (a) => formatRelative(a.raisedAt) },
  { key: 'state', header: 'State', render: (a) => <Badge tone={ALERT_STATE[a.state].tone}>{ALERT_STATE[a.state].label}</Badge> },
];

type Load = { state: 'loading' } | { state: 'error' } | { state: 'ready'; alerts: Alert[] };

/**
 * Pattern: an inbox of alerts. Filters on top, the list with severity and state, and the selected alert
 * with its actions. The alert engine (backend) raises the alerts, writes their text and notifies the people
 * responsible; this screen shows them and records who handles them.
 * Add ?demo=empty or ?demo=error to the address to see the other states.
 */
export function AlertsPage() {
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [show, setShow] = useState<Show>('open');
  const [kind, setKind] = useState<Kind>('all');
  const [selectedId, setSelectedId] = useState<string>();
  const [resolving, setResolving] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string }>();

  useEffect(() => {
    let current = true;
    setLoad({ state: 'loading' });
    listAlerts().then(
      (alerts) => current && setLoad({ state: 'ready', alerts }),
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
          Loading alerts…
        </p>
      </Card>
    );
  }

  if (load.state === 'error') {
    return (
      <div className="flex max-w-[640px] flex-col gap-space-4">
        <InlineAlert tone="error" title="The alerts could not be loaded">
          Check your connection and try again.
        </InlineAlert>
        <div>
          <Button onClick={() => setAttempt((n) => n + 1)}>Try again</Button>
        </div>
      </div>
    );
  }

  const visible = load.alerts.filter(
    (a) => (show === 'all' || (show === 'open' ? a.state !== 'resolved' : a.state === show)) && (kind === 'all' || a.kind === kind),
  );
  const selected = visible.find((a) => a.id === selectedId) ?? visible[0];

  function replace(alert: Alert, text: string) {
    if (load.state !== 'ready') return;
    setLoad({ ...load, alerts: load.alerts.map((a) => (a.id === alert.id ? alert : a)) });
    setSelectedId(alert.id);
    setNotice({ tone: 'success', text });
  }

  return (
    <div className="flex flex-col gap-space-4">
      <div className="grid gap-space-4 sm:grid-cols-[repeat(2,minmax(0,280px))]">
        <Select label="Show" value={show} options={SHOW} onChange={(e) => setShow(e.target.value as Show)} />
        <Select label="Type" value={kind} options={KINDS} onChange={(e) => setKind(e.target.value as Kind)} />
      </div>

      {notice && (
        <InlineAlert tone={notice.tone} title={notice.text}>
          {notice.tone === 'success' ? 'The change is saved.' : 'Check your connection and try again. Nothing was changed.'}
        </InlineAlert>
      )}

      {visible.length === 0 ? (
        <InlineAlert tone="info" title="No alerts to show">
          {load.alerts.length === 0 ? 'Alerts appear here when an asset fails or performs below normal.' : 'Choose another filter to see more alerts.'}
        </InlineAlert>
      ) : (
        <div className="grid items-start gap-space-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Card title="Alerts" subtitle={`${visible.length} shown, newest first`} flush>
            <DataTable columns={COLUMNS} rows={visible} rowKey="id" selectedKey={selected.id} onRowClick={(a) => setSelectedId(a.id)} />
          </Card>
          <AlertDetail
            alert={selected}
            onAcknowledge={() => {
              setNotice(undefined);
              acknowledgeAlert(selected.id).then(
                (a) => replace(a, 'Alert acknowledged'),
                () => setNotice({ tone: 'error', text: 'The alert could not be acknowledged' }),
              );
            }}
            onResolve={() => {
              setNotice(undefined);
              setResolving(true);
            }}
          />
        </div>
      )}

      {selected && (
        <ResolveDialog
          open={resolving}
          alert={selected}
          onClose={() => setResolving(false)}
          onSaved={(a) => {
            setResolving(false);
            replace(a, 'Alert resolved');
          }}
        />
      )}
    </div>
  );
}

function AlertDetail({ alert, onAcknowledge, onResolve }: { alert: Alert; onAcknowledge: () => void; onResolve: () => void }) {
  const facts: Array<[string, string]> = [
    ['Asset', alert.assetName],
    ['Type', ALERT_KIND[alert.kind]],
    ['Raised', formatRelative(alert.raisedAt)],
  ];
  if (alert.indicator) {
    const i = alert.indicator;
    facts.push([i.name, `${formatNumber(i.value)} ${i.unit} (usually ${formatNumber(i.reference)} ${i.unit})`]);
  }
  if (alert.acknowledgedBy) facts.push(['Acknowledged by', `${alert.acknowledgedBy}, ${formatRelative(alert.acknowledgedAt ?? null).toLowerCase()}`]);
  if (alert.resolvedAt) facts.push(['Resolved', formatRelative(alert.resolvedAt)]);

  return (
    <Card title={alert.title} actions={<Badge tone={ALERT_STATE[alert.state].tone}>{ALERT_STATE[alert.state].label}</Badge>}>
      <div className="flex flex-col gap-space-4">
        {/* The backend writes what happened and what to do. */}
        <InlineAlert tone={ALERT_SEVERITY[alert.severity].alertTone} title={ALERT_SEVERITY[alert.severity].label}>
          {alert.text}
        </InlineAlert>
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-space-4 gap-y-space-2">
          {facts.map(([term, value]) => (
            <div key={term} className="contents">
              <dt className="text-ink-muted">{term}</dt>
              <dd className="m-0">{value}</dd>
            </div>
          ))}
        </dl>
        {alert.resolution && <p className="m-0">What was done: {alert.resolution}</p>}
        {alert.state !== 'resolved' && (
          <div className="flex flex-wrap gap-space-2">
            {alert.state === 'new' && (
              <Button size="sm" onClick={onAcknowledge}>
                Acknowledge
              </Button>
            )}
            <Button size="sm" onClick={onResolve}>
              Resolve
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function ResolveDialog({ open, alert, onClose, onSaved }: { open: boolean; alert: Alert; onClose: () => void; onSaved: (a: Alert) => void }) {
  const [resolution, setResolution] = useState('');
  const [error, setError] = useState<string>();
  const [failed, setFailed] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!open) return;
    setResolution('');
    setError(undefined);
    setFailed(false);
  }, [open]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!resolution.trim()) return setError('Write what was done.');
    setWorking(true);
    setFailed(false);
    try {
      onSaved(await resolveAlert(alert.id, resolution));
    } catch (err) {
      if (err instanceof ApiError && err.fields.resolution) setError(err.fields.resolution);
      else setFailed(true);
    } finally {
      setWorking(false);
    }
  }

  return (
    <Dialog
      open={open}
      title="Resolve the alert"
      onClose={onClose}
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="resolve-alert" disabled={working}>
            {working ? 'Saving…' : 'Resolve alert'}
          </Button>
        </>
      }
    >
      <form id="resolve-alert" className="flex flex-col gap-space-4" onSubmit={onSubmit} noValidate>
        {failed && <InlineAlert tone="error" title="Not saved">The alert could not be resolved. Check your connection and try again. Nothing was changed.</InlineAlert>}
        <p className="m-0">{alert.title}</p>
        <Textarea
          label="What was done"
          required
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          error={error}
          maxLength={500}
          rows={3}
          hint="For example: “Panels cleaned on 26 October.” Up to 500 characters."
        />
      </form>
    </Dialog>
  );
}

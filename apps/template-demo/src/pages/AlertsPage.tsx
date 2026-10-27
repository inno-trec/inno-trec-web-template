import {
  Badge,
  Button,
  Card,
  DataTable,
  Dialog,
  EmptyState,
  FileUpload,
  InlineAlert,
  Pagination,
  Select,
  Tabs,
  Textarea,
  Toast,
  type Column,
} from '@inno-trec/ui-web';
import { useEffect, useState, type FormEvent } from 'react';
import { formatNumber, formatRelative } from '../charts/format';
import { acknowledgeAlert, ApiError, listAlerts, resolveAlert, type Alert, type AlertPageDto, type AlertShow } from '../data/api';
import { ALERT_KIND, ALERT_SEVERITY, ALERT_STATE } from '../labels';

type Kind = 'all' | Alert['kind'];

const PAGE_SIZE = 5;
const SHOW: Array<{ id: AlertShow; label: string }> = [
  { id: 'open', label: 'Open' },
  { id: 'new', label: 'New' },
  { id: 'acknowledged', label: 'Acknowledged' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'all', label: 'All' },
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

/**
 * Pattern: an inbox of alerts. Tabs by state with the backend's counts, a filter, one page of the list with
 * Previous and Next, and the selected alert with its actions. The alert engine (backend) raises the alerts,
 * writes their text and notifies the people responsible; this screen shows them and records who handles them.
 * Add ?demo=empty or ?demo=error to the address to see the other states.
 */
export function AlertsPage() {
  const [data, setData] = useState<AlertPageDto>();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [show, setShow] = useState<AlertShow>('open');
  const [kind, setKind] = useState<Kind>('all');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string>();
  const [resolving, setResolving] = useState(false);
  const [saved, setSaved] = useState<string>();
  const [problem, setProblem] = useState<string>();

  // The backend filters, counts and pages. Ask again when the view changes or after a change.
  useEffect(() => {
    let current = true;
    setLoading(true);
    listAlerts({ show, kind, page, pageSize: PAGE_SIZE }).then(
      (result) => {
        if (!current) return;
        setData(result);
        setFailed(false);
        setLoading(false);
      },
      () => {
        if (!current) return;
        setFailed(true);
        setLoading(false);
      },
    );
    return () => {
      current = false;
    };
  }, [show, kind, page, attempt]);

  if (!data && loading) {
    return (
      <Card>
        <p role="status" className="m-0 text-ink-muted">
          Loading alerts…
        </p>
      </Card>
    );
  }

  if (!data || failed) {
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

  const selected = data.alerts.find((a) => a.id === selectedId) ?? data.alerts[0];

  // A change can move the alert to another tab and change the counts, so load the page again.
  function changed(alert: Alert, message: string) {
    setSelectedId(alert.id);
    setSaved(message);
    setAttempt((n) => n + 1);
  }

  function view(next: { show?: AlertShow; kind?: Kind }) {
    if (next.show) setShow(next.show);
    if (next.kind) setKind(next.kind);
    setPage(1);
    setSelectedId(undefined);
  }

  return (
    <div className="flex flex-col gap-space-4">
      <div className="max-w-[280px]">
        <Select label="Type" value={kind} options={KINDS} onChange={(e) => view({ kind: e.target.value as Kind })} />
      </div>

      {problem && (
        <InlineAlert tone="error" title={problem}>
          Check your connection and try again. Nothing was changed.
        </InlineAlert>
      )}

      <Tabs label="Alerts by state" activeId={show} onChange={(id) => view({ show: id as AlertShow })} tabs={SHOW.map((t) => ({ ...t, count: data.counts[t.id] }))}>
        {data.total === 0 ? (
          <EmptyState icon={data.counts.all === 0 ? 'check' : 'info'} title={data.counts.all === 0 ? 'No alerts yet' : 'No alerts here'}>
            {data.counts.all === 0 ? 'Alerts appear here when an asset fails or performs below normal.' : 'Choose another tab or type to see more alerts.'}
          </EmptyState>
        ) : (
          <div className="grid items-start gap-space-4 lg:grid-cols-[minmax(0,1fr)_380px]">
            <Card
              title="Alerts"
              subtitle="Newest first"
              flush
              footer={<Pagination page={page} pageSize={PAGE_SIZE} total={data.total} itemLabel="alerts" disabled={loading} onChange={setPage} />}
            >
              <DataTable columns={COLUMNS} rows={data.alerts} rowKey="id" selectedKey={selected?.id} onRowClick={(a) => setSelectedId(a.id)} />
            </Card>
            {selected && (
              <AlertDetail
                alert={selected}
                onAcknowledge={() => {
                  setProblem(undefined);
                  acknowledgeAlert(selected.id).then(
                    (a) => changed(a, 'Alert acknowledged'),
                    () => setProblem('The alert could not be acknowledged'),
                  );
                }}
                onResolve={() => {
                  setProblem(undefined);
                  setResolving(true);
                }}
              />
            )}
          </div>
        )}
      </Tabs>

      {selected && (
        <ResolveDialog
          open={resolving}
          alert={selected}
          onClose={() => setResolving(false)}
          onSaved={(a) => {
            setResolving(false);
            changed(a, 'Alert resolved');
          }}
        />
      )}
      <Toast open={!!saved} onClose={() => setSaved(undefined)}>
        {saved}
      </Toast>
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
  if (alert.photos?.length) facts.push(['Photos', alert.photos.map((p) => p.name).join(', ')]);

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
  const [photos, setPhotos] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!open) return;
    setResolution('');
    setPhotos([]);
    setErrors({});
    setFailed(false);
  }, [open]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!resolution.trim()) return setErrors({ resolution: 'Write what was done.' });
    setWorking(true);
    setFailed(false);
    setErrors({});
    try {
      onSaved(await resolveAlert(alert.id, resolution, photos));
    } catch (err) {
      // Keep what the person wrote and chose, so they only fix what the backend rejected.
      if (err instanceof ApiError && Object.keys(err.fields).length) setErrors(err.fields);
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
          error={errors.resolution}
          maxLength={500}
          rows={3}
          hint="For example: “Panels cleaned on 26 October.” Up to 500 characters."
        />
        <FileUpload
          label="Photos (optional)"
          multiple
          accept="image/*"
          hint="Photos of the work, up to 10 MB each."
          error={errors.photos}
          files={photos.map((f) => ({ name: f.name, size: f.size }))}
          onAdd={(added) => setPhotos((list) => [...list, ...added])}
          onRemove={(_, index) => setPhotos((list) => list.filter((_, i) => i !== index))}
        />
      </form>
    </Dialog>
  );
}

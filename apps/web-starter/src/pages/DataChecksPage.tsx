import { colors } from '@inno-trec/tokens';
import { Badge, Button, Card, DataTable, InlineAlert, Select, type Column } from '@inno-trec/ui-web';
import { useEffect, useMemo, useState } from 'react';
import { formatNumber } from '../charts/format';
import { LazyTimeSeriesChart as TimeSeriesChart } from '../charts/LazyCharts';
import type { SeriesSpec } from '../charts/TimeSeriesChart';
import { getSourceChecks, PERIODS, type Comparison, type Deviation, type Period, type QuantityCheckView } from '../data/api';

type Quantity = QuantityCheckView['quantity'];

/** Each quantity keeps its series color here too, so the deviation reads as "PV" or "consumption". */
const QUANTITY: Record<Quantity, { label: string; color: string }> = {
  consumption: { label: 'Consumption', color: colors['series-consumption'] },
  pv: { label: 'PV production', color: colors['series-pv'] },
  storage: { label: 'Storage', color: colors['series-storage'] },
  grid: { label: 'Grid', color: colors['series-grid'] },
};

const STATUS: Record<Comparison['status'], { tone: 'success' | 'warning' | 'neutral'; label: string }> = {
  within_tolerance: { tone: 'success', label: 'Within tolerance' },
  outside_tolerance: { tone: 'warning', label: 'Outside tolerance' },
  missing: { tone: 'neutral', label: 'No data' },
};

interface Row {
  key: string;
  check: QuantityCheckView;
  comparison: Comparison;
}

const signed = (n: number) => `${n > 0 ? '+' : ''}${formatNumber(n)}`;

const COLUMNS: Column<Row>[] = [
  { key: 'quantity', header: 'Quantity', render: (r) => QUANTITY[r.check.quantity].label },
  { key: 'source', header: 'Source', render: (r) => <span>{r.comparison.label}<span className="block text-ink-muted">against {r.check.referenceLabel}</span></span> },
  { key: 'coverage', header: 'Readings received', align: 'right', render: (r) => `${formatNumber(r.comparison.coveragePct)} %` },
  {
    key: 'deviation',
    header: 'Deviation',
    align: 'right',
    render: (r) => (r.comparison.deviationPct == null ? <span className="text-ink-muted">No data</span> : <span className="whitespace-nowrap">{signed(r.comparison.deviationPct)} %<span className="block text-ink-muted">tolerance ±{formatNumber(r.check.tolerancePct)} %</span></span>),
  },
  { key: 'status', header: 'Status', render: (r) => <Badge tone={STATUS[r.comparison.status].tone} dot>{STATUS[r.comparison.status].label}</Badge> },
];

type Load = { state: 'loading' } | { state: 'error' } | { state: 'ready'; timeZone: string; quantities: QuantityCheckView[] };

/**
 * Pattern: checking that data sources agree. For each quantity, one source is the reference (usually the meter);
 * every other source shows how far it is from it. The table lists every source; the chart shows one source's
 * deviation over time, in the quantity's color, with the tolerance as a band. Never overlay several sources of the
 * same quantity. The backend computes the deviations, the tolerances and the statuses.
 * Add ?demo=empty or ?demo=error to the address to see the other states.
 */
export function DataChecksPage() {
  const [period, setPeriod] = useState<Period>('7d');
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string>();

  useEffect(() => {
    let current = true;
    setLoad({ state: 'loading' });
    getSourceChecks(period).then(
      (report) => current && setLoad({ state: 'ready', ...report }),
      () => current && setLoad({ state: 'error' }),
    );
    return () => {
      current = false;
    };
  }, [period, attempt]);

  const rows = useMemo<Row[]>(
    () => (load.state === 'ready' ? load.quantities.flatMap((check) => check.comparisons.map((comparison) => ({ key: `${check.quantity}/${comparison.source}`, check, comparison }))) : []),
    [load],
  );
  // Start with the first source outside its tolerance, since that is what needs a look.
  const selected = rows.find((r) => r.key === selectedKey) ?? rows.find((r) => r.comparison.status === 'outside_tolerance') ?? rows[0];

  return (
    <div className="flex flex-col gap-space-4">
      <div className="flex flex-wrap items-end gap-space-4">
        <div className="w-full max-w-[240px]">
          <Select label="Period" value={period} options={PERIODS} onChange={(e) => setPeriod(e.target.value as Period)} />
        </div>
        {load.state === 'ready' && <p className="m-0 pb-space-2 text-ink-muted">Times in {load.timeZone}</p>}
      </div>

      {load.state === 'loading' && (
        <Card>
          <p role="status" className="m-0 text-ink-muted">
            Loading data checks…
          </p>
        </Card>
      )}

      {load.state === 'error' && (
        <div className="flex max-w-[640px] flex-col gap-space-4">
          <InlineAlert tone="error" title="The data checks could not be loaded">
            Check your connection and try again.
          </InlineAlert>
          <div>
            <Button onClick={() => setAttempt((n) => n + 1)}>Try again</Button>
          </div>
        </div>
      )}

      {load.state === 'ready' && rows.length === 0 && (
        <InlineAlert tone="info" title="Nothing to compare for this period">
          Checks appear here once more than one source sends data for a quantity.
        </InlineAlert>
      )}

      {load.state === 'ready' && selected && (
        <>
          <Card title="Sources" subtitle="Choose a source to see its deviation over time" flush>
            <DataTable columns={COLUMNS} rows={rows} rowKey="key" selectedKey={selected.key} onRowClick={(r) => setSelectedKey(r.key)} />
          </Card>
          <DeviationCard row={selected} timeZone={load.timeZone} />
        </>
      )}
    </div>
  );
}

function DeviationCard({ row, timeZone }: { row: Row; timeZone: string }) {
  const { check, comparison } = row;
  const quantity = QUANTITY[check.quantity];
  const series = useMemo<SeriesSpec<Deviation>[]>(() => [{ name: comparison.label, color: quantity.color, value: (d) => d.deviationPct }], [comparison.label, quantity.color]);
  const title = `${quantity.label}: ${comparison.label} against ${check.referenceLabel}`;

  if (comparison.status === 'missing') {
    return (
      <Card title={title}>
        <InlineAlert tone="info" title={`No data from ${comparison.label} in this period`}>
          Nothing can be compared until this source sends readings again.
        </InlineAlert>
      </Card>
    );
  }

  const tolerance = check.tolerancePct;
  return (
    <Card title={title} subtitle="Deviation from the reference source. Inside the gray band the sources agree.">
      <TimeSeriesChart
        points={comparison.deviations}
        series={series}
        unit="%"
        timeZone={timeZone}
        height={260}
        band={{ from: -tolerance, to: tolerance, label: `Tolerance ±${formatNumber(tolerance)} %` }}
        label={`Deviation of ${comparison.label} from ${check.referenceLabel} for ${quantity.label.toLowerCase()} over time`}
      />
    </Card>
  );
}

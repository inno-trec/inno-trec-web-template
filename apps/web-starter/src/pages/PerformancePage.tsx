import type { PerformancePeriod } from '@inno-trec/api-contract';
import { colors } from '@inno-trec/tokens';
import { Badge, Button, Card, DataTable, InlineAlert, Select, StatTile, type Column } from '@inno-trec/ui-web';
import { useEffect, useState } from 'react';
import { formatNumber } from '../charts/format';
import { LazyBarChart } from '../charts/LazyCharts';
import { getPvPerformance, PERFORMANCE_PERIODS, type Indicator, type PvPerformanceReport, type SystemPerformance } from '../data/api';

type Load = { state: 'loading' } | { state: 'error' } | { state: 'ready'; report: PvPerformanceReport };

/** An indicator with its unit, and the system's own history in muted text. Missing values are words. */
function IndicatorCell({ indicator }: { indicator: Indicator }) {
  if (indicator.value == null) return <span className="text-ink-muted">No data</span>;
  const below = indicator.status === 'below_normal';
  return (
    <span className="whitespace-nowrap">
      <span className={below ? 'font-bold' : undefined}>
        {formatNumber(indicator.value)} {indicator.unit}
      </span>
      {indicator.historicalReference != null && (
        <span className="block text-ink-muted">usually {formatNumber(indicator.historicalReference)}</span>
      )}
    </span>
  );
}

/** Below normal when any indicator is: the backend decides each status. */
const belowNormal = (s: SystemPerformance) =>
  [s.performanceRatio, s.availability, s.specificYield, s.efficiency].some((i) => i.status === 'below_normal');

const COLUMNS: Column<SystemPerformance>[] = [
  { key: 'name', header: 'PV system', render: (s) => <span>{s.name}<span className="block text-ink-muted">{formatNumber(s.peakPowerKwp)} kWp</span></span> },
  { key: 'pr', header: 'Performance ratio', align: 'right', render: (s) => <IndicatorCell indicator={s.performanceRatio} /> },
  { key: 'availability', header: 'Availability', align: 'right', render: (s) => <IndicatorCell indicator={s.availability} /> },
  { key: 'yield', header: 'Specific yield', align: 'right', render: (s) => <IndicatorCell indicator={s.specificYield} /> },
  { key: 'efficiency', header: 'Efficiency', align: 'right', render: (s) => <IndicatorCell indicator={s.efficiency} /> },
  {
    key: 'status',
    header: 'Status',
    render: (s) => (belowNormal(s) ? <Badge tone="warning" dot>Below normal</Badge> : <Badge tone="success" dot>Normal</Badge>),
  },
];

/**
 * Pattern: performance against references. Community indicators on top, one bar per system with the
 * community's value as a dotted reference line, and every indicator in a table with each system's history.
 * The backend computes the indicators and decides which are below normal; their definitions are still to be
 * agreed (docs/tracking.md, D2). Add ?demo=empty or ?demo=error to the address to see the other states.
 */
export function PerformancePage() {
  const [period, setPeriod] = useState<PerformancePeriod>('last30days');
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setLoad({ state: 'loading' });
    getPvPerformance(period).then(
      (report) => current && setLoad({ state: 'ready', report }),
      () => current && setLoad({ state: 'error' }),
    );
    return () => {
      current = false;
    };
  }, [period, attempt]);

  return (
    <div className="flex flex-col gap-space-4">
      <div className="flex flex-wrap items-end gap-space-4">
        <div className="w-full max-w-[240px]">
          <Select label="Period" value={period} options={PERFORMANCE_PERIODS} onChange={(e) => setPeriod(e.target.value as PerformancePeriod)} />
        </div>
      </div>

      {load.state === 'loading' && (
        <Card>
          <p role="status" className="m-0 text-ink-muted">
            Loading performance…
          </p>
        </Card>
      )}

      {load.state === 'error' && (
        <div className="flex max-w-[640px] flex-col gap-space-4">
          <InlineAlert tone="error" title="The performance data could not be loaded">
            Check your connection and try again.
          </InlineAlert>
          <div>
            <Button onClick={() => setAttempt((n) => n + 1)}>Try again</Button>
          </div>
        </div>
      )}

      {load.state === 'ready' && load.report.systems.length === 0 && (
        <InlineAlert tone="info" title="No PV systems to evaluate">
          Systems appear here once they send production data.
        </InlineAlert>
      )}

      {load.state === 'ready' && load.report.systems.length > 0 && <Report report={load.report} />}
    </div>
  );
}

function Report({ report }: { report: PvPerformanceReport }) {
  const { community, systems } = report;
  const below = systems.filter(belowNormal).length;
  const show = (v: number | null) => (v == null ? '—' : v);
  return (
    <>
      <div className="grid gap-space-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Performance ratio" value={show(community.performanceRatioPct)} unit="%" accent="green" />
        <StatTile label="Availability" value={show(community.availabilityPct)} unit="%" accent="green" digits={1} />
        <StatTile label="Specific yield" value={show(community.specificYieldKwhPerKwp)} unit="kWh/kWp" accent="orange" />
        <StatTile label="Systems below normal" value={below} unit={`of ${systems.length}`} accent="light-blue" />
      </div>

      <Card title="Specific yield by system" subtitle="Energy per installed kWp. The dotted line is the community as a whole.">
        <LazyBarChart
          categories={systems.map((s) => s.name)}
          values={systems.map((s) => s.specificYield.value)}
          name="Specific yield"
          color={colors['series-pv']}
          unit="kWh/kWp"
          reference={{ name: 'Community', value: community.specificYieldKwhPerKwp }}
          label="Specific yield of each PV system, compared with the community"
        />
      </Card>

      <Card title="Indicators" subtitle="Each value with the system's usual value below it" flush>
        <DataTable columns={COLUMNS} rows={systems} rowKey="assetId" />
      </Card>
    </>
  );
}

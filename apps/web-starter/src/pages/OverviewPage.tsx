import { colors } from '@inno-trec/tokens';
import { Button, Card, DataTable, InlineAlert, Select, StatTile, type Column } from '@inno-trec/ui-web';
import { useEffect, useState } from 'react';
import { formatDay, formatHour, formatNumber } from '../charts/format';
import { LazyTimeSeriesChart as TimeSeriesChart } from '../charts/LazyTimeSeriesChart';
import type { SeriesSpec } from '../charts/TimeSeriesChart';
import { getEnergyReport, PERIODS, type EnergyReport, type EnergyRow, type Period } from '../data/api';
import type { Reading } from '../data/synthetic';

/*
 * Each series always has its own color token, in every chart. Kept outside the component
 * so the charts are not redrawn on every render.
 */
const POWER: SeriesSpec<Reading>[] = [
  { name: 'Consumption', color: colors['series-consumption'], value: (r) => r.consumption },
  { name: 'PV production', color: colors['series-pv'], value: (r) => r.pv },
  { name: 'Storage', color: colors['series-storage'], value: (r) => r.storage },
  { name: 'Grid', color: colors['series-grid'], value: (r) => r.grid },
];
const CHARGE: SeriesSpec<Reading>[] = [{ name: 'Battery charge', color: colors['series-storage'], value: (r) => r.soc }];

type Load = { state: 'loading' } | { state: 'error' } | { state: 'ready'; report: EnergyReport };

/**
 * Pattern: monitoring over time. A period filter on top, headline numbers, then one chart per unit
 * (power in kW, battery charge in %) sharing the time axis, and the same numbers as a table.
 * Add ?demo=empty or ?demo=error to the address to see the other states.
 */
export function OverviewPage() {
  const [period, setPeriod] = useState<Period>('today');
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    let current = true; // ignore an answer that arrives after the period changed
    setLoad({ state: 'loading' });
    getEnergyReport(period).then(
      (report) => current && setLoad({ state: 'ready', report }),
      () => current && setLoad({ state: 'error' }),
    );
    return () => {
      current = false;
    };
  }, [period, attempt]);

  return (
    <div className="flex flex-col gap-space-4">
      {/* Filters go in one row above the charts. */}
      <div className="flex flex-wrap items-end gap-space-4">
        <div className="w-full max-w-[240px]">
          <Select
            label="Period"
            value={period}
            options={PERIODS}
            onChange={(e) => setPeriod(e.target.value as Period)}
          />
        </div>
        {/* Times follow the community's clock, so the page names its time zone. */}
        {load.state === 'ready' && <p className="m-0 pb-space-2 text-ink-muted">Times in {load.report.timeZone}</p>}
      </div>

      {load.state === 'loading' && (
        <Card>
          <p role="status" className="m-0 text-ink-muted">
            Loading energy data…
          </p>
        </Card>
      )}

      {load.state === 'error' && (
        <div className="flex max-w-[640px] flex-col gap-space-4">
          <InlineAlert tone="error" title="The energy data could not be loaded">
            Check your connection and try again.
          </InlineAlert>
          <div>
            <Button onClick={() => setAttempt((n) => n + 1)}>Try again</Button>
          </div>
        </div>
      )}

      {load.state === 'ready' && load.report.readings.length === 0 && (
        <InlineAlert tone="info" title="No readings for this period">
          Readings appear here once the meters send data.
        </InlineAlert>
      )}

      {load.state === 'ready' && load.report.readings.length > 0 && (
        <Report report={load.report} showTable={showTable} onToggleTable={() => setShowTable((v) => !v)} />
      )}
    </div>
  );
}

/** Missing data is shown as words, never as zero. */
const kwh = (value: number | null) => (value == null ? 'No data' : formatNumber(value));

function Report({ report, showTable, onToggleTable }: { report: EnergyReport; showTable: boolean; onToggleTable: () => void }) {
  const { totals } = report;
  const columns: Column<EnergyRow>[] = [
    { key: 'time', header: report.rowUnit === 'hour' ? 'Hour' : 'Day', render: (r) => (report.rowUnit === 'hour' ? formatHour(r.time, report.timeZone) : formatDay(r.time, report.timeZone)) },
    { key: 'consumptionKwh', header: 'Consumption (kWh)', align: 'right', render: (r) => kwh(r.consumptionKwh) },
    { key: 'pvKwh', header: 'PV production (kWh)', align: 'right', render: (r) => kwh(r.pvKwh) },
    { key: 'storageKwh', header: 'Storage (kWh)', align: 'right', render: (r) => kwh(r.storageKwh) },
    { key: 'gridKwh', header: 'Grid (kWh)', align: 'right', render: (r) => kwh(r.gridKwh) },
    { key: 'missingReadings', header: 'Missing readings', align: 'right', render: (r) => (r.missingReadings > 0 ? r.missingReadings : '—') },
  ];

  return (
    <>
      {/* The backend computes these totals. The interface only formats them. */}
      <div className="grid gap-space-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Consumption" value={totals.consumptionKwh} unit="kWh" accent="light-blue" />
        <StatTile label="PV production" value={totals.pvKwh} unit="kWh" accent="orange" />
        <StatTile label="PV used in the community" value={totals.selfConsumptionPct} unit="%" accent="green" />
        <StatTile label="Bought from the grid" value={totals.gridImportKwh} unit="kWh" accent="light-blue" />
      </div>

      <Card
        title="Power"
        subtitle="Every 15 minutes. Storage is positive while the battery charges; grid is positive while the community buys. Dashed: not yet confirmed by the meters."
        actions={
          <Button variant="ghost" size="sm" onClick={onToggleTable}>
            {showTable ? 'Hide table' : 'Show as table'}
          </Button>
        }
      >
        <TimeSeriesChart points={report.readings} series={POWER} unit="kW" timeZone={report.timeZone} label="Power of consumption, PV production, storage and grid over time" />
      </Card>

      {/* A second unit gets its own chart, never a second y-axis. */}
      <Card title="Battery charge" subtitle="State of charge of the community battery">
        <TimeSeriesChart points={report.readings} series={CHARGE} unit="%" min={0} max={100} height={200} timeZone={report.timeZone} label="Battery state of charge over time" />
      </Card>

      {showTable && (
        <Card title="Energy" subtitle={report.rowUnit === 'hour' ? 'Per hour' : 'Per day'} flush>
          <DataTable columns={columns} rows={report.rows} rowKey="time" />
        </Card>
      )}
    </>
  );
}

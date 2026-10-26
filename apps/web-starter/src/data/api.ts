import type {
  Alert,
  EnergyPeriod,
  EnergyReport as EnergyReportDto,
  Invitation,
  PerformancePeriod,
  Problem,
  QuantityCheck,
  SourceComparison,
  UserChanges,
} from '@inno-trec/api-contract';
import * as server from './fakeServer';

/**
 * CLIENT of the INNO-TREC data API. Pages call these functions only.
 *
 * Today each function calls the fake provider in fakeServer.ts. To use the real API, replace the call
 * with fetch (for example `fetch(`${API}/communities/${id}/energy?period=today`)`) and keep the rest:
 * the types come from the contract (@inno-trec/api-contract), and the adapters below turn its JSON
 * into what the screens need (times as numbers for charts, errors per field for forms).
 */

export type { Alert, Asset, Indicator, PvPerformanceReport, Role, RoleId, SystemPerformance, User } from '@inno-trec/api-contract';

/** An error from the API, ready for a form: one message per field, or a code for the whole request. */
export class ApiError extends Error {
  constructor(
    public code: string,
    public fields: Record<string, string> = {},
  ) {
    super(code);
  }
}

function toApiError(problem: Problem) {
  const fields = Object.fromEntries((problem.errors ?? []).map((e) => [e.field, e.message]));
  return new ApiError(problem.type, fields);
}

/** Runs a request and turns a problem response (RFC 9457) into an ApiError. */
async function call<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof server.ProblemResponse) throw toApiError(error.problem);
    throw new ApiError('/errors/network');
  }
}

const ms = (time: string) => Date.parse(time);

/* ---------- Energy ---------- */

export type Period = 'today' | '7d' | '30d';

export const PERIODS: Array<{ value: Period; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

const API_PERIOD: Record<Period, EnergyPeriod> = { today: 'today', '7d': 'last7days', '30d': 'last30days' };

/** One reading, with its time as a number for the charts. Power in kW. */
export interface Reading {
  time: number;
  consumption: number | null;
  pv: number | null;
  storage: number | null;
  grid: number | null;
  soc: number | null;
  estimated: boolean;
}

export type EnergyRow = Omit<EnergyReportDto['rows'][number], 'time'> & { time: number };

export interface EnergyReport extends Omit<EnergyReportDto, 'readings' | 'rows' | 'from' | 'to'> {
  readings: Reading[];
  rows: EnergyRow[];
}

export async function getEnergyReport(period: Period): Promise<EnergyReport> {
  const dto = await call(() => server.getEnergyReport(API_PERIOD[period]));
  return {
    ...dto,
    readings: dto.readings.map((r) => ({
      time: ms(r.time),
      consumption: r.consumptionKw,
      pv: r.pvKw,
      storage: r.storageKw,
      grid: r.gridKw,
      soc: r.storageSocPct,
      estimated: r.estimated,
    })),
    rows: dto.rows.map((row) => ({ ...row, time: ms(row.time) })),
  };
}

/* ---------- PV performance ---------- */

export const PERFORMANCE_PERIODS: Array<{ value: PerformancePeriod; label: string }> = [
  { value: 'last30days', label: 'Last 30 days' },
  { value: 'last12months', label: 'Last 12 months' },
];

export const getPvPerformance = (period: PerformancePeriod) => call(() => server.getPvPerformance(period));

/* ---------- Data checks ---------- */

export interface Deviation {
  time: number;
  deviationPct: number | null;
}
export type Comparison = Omit<SourceComparison, 'deviations'> & { deviations: Deviation[] };
export type QuantityCheckView = Omit<QuantityCheck, 'comparisons'> & { comparisons: Comparison[] };

export async function getSourceChecks(period: Period): Promise<{ timeZone: string; quantities: QuantityCheckView[] }> {
  const dto = await call(() => server.getSourceChecks(API_PERIOD[period]));
  return {
    timeZone: dto.timeZone,
    quantities: dto.quantities.map((q) => ({
      ...q,
      comparisons: q.comparisons.map((c) => ({ ...c, deviations: c.deviations.map((d) => ({ time: ms(d.time), deviationPct: d.deviationPct })) })),
    })),
  };
}

/* ---------- Alerts and assets ---------- */

export const listAlerts = () => call(() => server.listAlerts()).then((r) => r.alerts);
export const acknowledgeAlert = (id: string): Promise<Alert> => call(() => server.acknowledgeAlert(id));
export const resolveAlert = (id: string, resolution: string): Promise<Alert> => call(() => server.resolveAlert(id, resolution));
export const listAssets = () => call(() => server.listAssets()).then((r) => r.assets);

/* ---------- Users ---------- */

export const listUsers = () => call(() => server.listUsers());
export const inviteUser = (input: Invitation) => call(() => server.inviteUser(input));
export const updateUser = (id: string, changes: UserChanges) => call(() => server.updateUser(id, changes));

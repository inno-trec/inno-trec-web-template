import { ApiError } from './errors';
import * as server from './fakeServer';
import type {
  Alert,
  AlertQuery,
  EnergyPeriod,
  EnergyReportDto,
  Invitation,
  PerformancePeriod,
  RoleId,
  QuantityCheckDto,
  SourceComparisonDto,
  UserChanges,
} from './types';

/**
 * CLIENT of the backend. Pages call these functions only.
 *
 * Today each function calls the fake backend in fakeServer.ts. To use your backend, replace the call
 * with fetch (for example `fetch(`${API}/communities/${id}/energy?period=today`)`) and keep the rest:
 * the adapters below turn the JSON into what the screens need (times as numbers for charts), and
 * `call` turns every failure into an ApiError (one message per field for forms).
 */

export { ApiError };
export type { Alert, AlertPageDto, AlertQuery, AlertShow, Asset, Indicator, PerformancePeriod, PvPerformanceReport, Role, RoleId, Session, SystemPerformance, User } from './types';

/** Runs a request. A backend error passes through; anything else (no network, a crash) becomes `network`. */
async function call<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('network');
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
export type Comparison = Omit<SourceComparisonDto, 'deviations'> & { deviations: Deviation[] };
export type QuantityCheckView = Omit<QuantityCheckDto, 'comparisons'> & { comparisons: Comparison[] };

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

export const listAlerts = (query: AlertQuery) => call(() => server.listAlerts(query));
export const acknowledgeAlert = (id: string): Promise<Alert> => call(() => server.acknowledgeAlert(id));
/** With fetch, send a FormData with `resolution` and one `photos` entry per file. */
export const resolveAlert = (id: string, resolution: string, photos: File[] = []): Promise<Alert> =>
  call(() => server.resolveAlert(id, resolution, photos.map((f) => ({ name: f.name, sizeBytes: f.size, type: f.type }))));
export const listAssets = () => call(() => server.listAssets()).then((r) => r.assets);

/* ---------- Users ---------- */

export const listUsers = () => call(() => server.listUsers());
export const inviteUser = (input: Invitation) => call(() => server.inviteUser(input));
export const updateUser = (id: string, changes: UserChanges) => call(() => server.updateUser(id, changes));
export const approveRequest = (id: string, role: RoleId) => call(() => server.approveRequest(id, role));
export const declineRequest = (id: string) => call(() => server.declineRequest(id));

/* ---------- Accounts ----------
 * With an OpenID Connect provider (for example Keycloak), signing in, invitations and password resets may
 * happen on the provider's own pages; these screens then serve as the design for its theme.
 */

export type { AccountRequest } from './fakeServer';
export const SAMPLE_PASSWORD = server.SAMPLE_PASSWORD;
export const signIn = (email: string, password: string) => call(() => server.signIn(email, password));
export const requestAccount = (input: server.AccountRequest) => call(() => server.requestAccount(input));
export const getInvitation = (token: string) => call(() => server.getInvitation(token));
export const acceptInvitation = (token: string, input: { name: string; password: string; acceptPolicy: boolean }) => call(() => server.acceptInvitation(token, input));
export const requestPasswordReset = (email: string) => call(() => server.requestPasswordReset(email));
export const checkResetLink = (token: string) => call(() => server.checkResetLink(token));
export const resetPassword = (token: string, password: string) => call(() => server.resetPassword(token, password));
export const getAccount = (userId: string) => call(() => server.getAccount(userId));
export const updateAccount = (userId: string, changes: { name: string; emailAlerts: boolean }) => call(() => server.updateAccount(userId, changes));
export const changePassword = (userId: string, current: string, next: string) => call(() => server.changePassword(userId, current, next));

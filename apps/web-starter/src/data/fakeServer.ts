import type {
  Alert,
  Asset,
  EnergyPeriod,
  EnergyReport,
  EnergyRow,
  Indicator,
  Invitation,
  PerformancePeriod,
  Problem,
  PvPerformanceReport,
  QuantityCheck,
  Reading,
  Role,
  SourceCheckReport,
  SystemPerformance,
  User,
  UserChanges,
} from '@inno-trec/api-contract';
import { startOfDay, startOfHour } from '../time/zone';
import { COMMUNITY, generateReadings, type Sample } from './synthetic';

/**
 * FAKE DATA PROVIDER. It plays the part of the WP2 data API, in the shapes of the contract
 * (packages/api-contract/openapi.yaml), so the client in api.ts can later call the real API with fetch
 * and keep everything else. It also does the provider's work: totals, indicators, statuses.
 *
 * Add one of these to the address to see the other states:
 *   ?demo=empty   no data
 *   ?demo=error   every request fails
 */

const demo = () => new URLSearchParams(window.location.search).get('demo');
const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const iso = (ms: number) => new Date(ms).toISOString();
const round1 = (n: number) => Math.round(n * 10) / 10;
const QUARTER = 15 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const zone = COMMUNITY.timeZone;

/** A problem as the API returns it (RFC 9457). The client turns it into an ApiError. */
export class ProblemResponse extends Error {
  constructor(public problem: Problem) {
    super(problem.title);
  }
}

async function respond(ms: number) {
  await delay(ms);
  if (demo() === 'error') throw new ProblemResponse({ type: '/errors/unavailable', title: 'The service is not available.', status: 503 });
}

function invalid(field: string, code: string, message: string): never {
  throw new ProblemResponse({ type: '/errors/validation', title: 'Some fields need a change.', status: 422, errors: [{ field, code, message }] });
}

/* ---------- Energy ---------- */

function periodStart(now: number, period: EnergyPeriod) {
  return startOfDay(now, zone, period === 'last7days' ? -6 : period === 'last30days' ? -29 : 0);
}

function samplesFor(period: EnergyPeriod) {
  const now = Math.floor(Date.now() / QUARTER) * QUARTER;
  const from = periodStart(now, period);
  return { from, now, samples: demo() === 'empty' ? [] : generateReadings(from, now, now - HOUR) };
}

const toReading = (s: Sample): Reading => ({
  time: iso(s.time),
  consumptionKw: s.consumption,
  pvKw: s.pv,
  storageKw: s.storage,
  gridKw: s.grid,
  storageSocPct: s.soc,
  estimated: s.estimated,
});

export async function getEnergyReport(period: EnergyPeriod): Promise<EnergyReport> {
  await respond(500);
  const { from, now, samples } = samplesFor(period);
  const rowUnit = period === 'today' ? 'hour' : 'day';

  const kwh = (kw: number | null) => (kw ?? 0) * 0.25;
  const buckets = new Map<number, { consumption: number; pv: number; storage: number; grid: number; missing: number; present: number }>();
  let consumption = 0;
  let pv = 0;
  let gridImport = 0;
  let gridExport = 0;
  for (const s of samples) {
    const key = rowUnit === 'hour' ? startOfHour(s.time, zone) : startOfDay(s.time, zone);
    const b = buckets.get(key) ?? { consumption: 0, pv: 0, storage: 0, grid: 0, missing: 0, present: 0 };
    if (s.consumption == null) b.missing += 1;
    else b.present += 1;
    b.consumption += kwh(s.consumption);
    b.pv += kwh(s.pv);
    b.storage += kwh(s.storage);
    b.grid += kwh(s.grid);
    buckets.set(key, b);
    consumption += kwh(s.consumption);
    pv += kwh(s.pv);
    if ((s.grid ?? 0) > 0) gridImport += kwh(s.grid);
    else gridExport -= kwh(s.grid);
  }
  const rows: EnergyRow[] = [...buckets].map(([time, b]) => {
    const value = (n: number) => (b.present === 0 ? null : round1(n));
    return { time: iso(time), consumptionKwh: value(b.consumption), pvKwh: value(b.pv), storageKwh: value(b.storage), gridKwh: value(b.grid), missingReadings: b.missing };
  });

  return {
    timeZone: zone,
    from: iso(from),
    to: iso(now),
    resolutionMinutes: 15,
    readings: samples.map(toReading),
    rowUnit,
    rows,
    totals: {
      consumptionKwh: Math.round(consumption),
      pvKwh: Math.round(pv),
      gridImportKwh: Math.round(gridImport),
      selfConsumptionPct: pv > 0 ? Math.round(((pv - gridExport) / pv) * 100) : 0,
    },
  };
}

/* ---------- PV performance ---------- */

type SystemSeed = { assetId: string; name: string; kwp: number; pr: [number, number]; availability: [number, number]; yield30: [number, number]; efficiency: [number, number] };

// [current value, historical reference]. The definitions are still to be agreed (tracking D2).
const SYSTEMS: SystemSeed[] = [
  { assetId: 'pv-01', name: 'School roof', kwp: 18, pr: [82, 83], availability: [99.6, 99.5], yield30: [112, 115], efficiency: [17.8, 18.0] },
  { assetId: 'pv-02', name: 'Sports hall roof', kwp: 24, pr: [66, 81], availability: [99.1, 99.3], yield30: [88, 110], efficiency: [14.6, 17.6] },
  { assetId: 'pv-03', name: 'Community center roof', kwp: 10, pr: [79, 81], availability: [94.2, 99.4], yield30: [99, 108], efficiency: [17.1, 17.4] },
  { assetId: 'pv-04', name: 'Library roof', kwp: 8, pr: [80, 80], availability: [99.8, 99.7], yield30: [104, 105], efficiency: [17.4, 17.5] },
];
const COMMUNITY_REF = { pr: 78, availability: 98.3, yield30: 101, efficiency: 16.9 };

function indicator(unit: Indicator['unit'], [value, historical]: [number, number], community: number, scale = 1): Indicator {
  // The provider decides the status. Here: more than 5% below the system's own history.
  const status = value < historical * 0.95 ? 'below_normal' : 'normal';
  return { value: round1(value * scale), unit, historicalReference: round1(historical * scale), communityReference: round1(community * scale), status };
}

export async function getPvPerformance(period: PerformancePeriod): Promise<PvPerformanceReport> {
  await respond(500);
  const now = Date.now();
  const yearly = period === 'last12months';
  const yieldScale = yearly ? 12.4 : 1;
  const systems: SystemPerformance[] =
    demo() === 'empty'
      ? []
      : SYSTEMS.map((s) => ({
          assetId: s.assetId,
          name: s.name,
          peakPowerKwp: s.kwp,
          performanceRatio: indicator('%', s.pr, COMMUNITY_REF.pr),
          availability: indicator('%', s.availability, COMMUNITY_REF.availability),
          specificYield: indicator('kWh/kWp', s.yield30, COMMUNITY_REF.yield30, yieldScale),
          efficiency: indicator('%', s.efficiency, COMMUNITY_REF.efficiency),
        }));
  return {
    timeZone: zone,
    from: iso(startOfDay(now, zone, yearly ? -364 : -29)),
    to: iso(now),
    systems,
    community: {
      performanceRatioPct: COMMUNITY_REF.pr,
      availabilityPct: COMMUNITY_REF.availability,
      specificYieldKwhPerKwp: round1(COMMUNITY_REF.yield30 * yieldScale),
      efficiencyPct: COMMUNITY_REF.efficiency,
    },
  };
}

/* ---------- Data checks ---------- */

type ComparisonSeed = { source: string; label: string; deviation: number | null; coverage: number };
type QuantitySeed = { quantity: QuantityCheck['quantity']; referenceSource: string; referenceLabel: string; tolerancePct: number; comparisons: ComparisonSeed[] };

const CHECKS: QuantitySeed[] = [
  { quantity: 'consumption', referenceSource: 'community_meter', referenceLabel: 'Community meter', tolerancePct: 3, comparisons: [
    { source: 'member_meters', label: 'Member smart meters', deviation: 1.4, coverage: 98.6 },
    { source: 'dss', label: 'DSS model', deviation: -5.2, coverage: 100 },
  ] },
  { quantity: 'pv', referenceSource: 'production_meters', referenceLabel: 'Production meters', tolerancePct: 3, comparisons: [
    { source: 'inverters', label: 'Inverter monitoring', deviation: -2.1, coverage: 99.2 },
    { source: 'dss', label: 'DSS model', deviation: 2.6, coverage: 100 },
  ] },
  { quantity: 'storage', referenceSource: 'bms', referenceLabel: 'Battery management system', tolerancePct: 5, comparisons: [
    { source: 'battery_portal', label: 'Battery supplier portal', deviation: null, coverage: 0 },
  ] },
  { quantity: 'grid', referenceSource: 'dso_meter', referenceLabel: 'Grid operator meter', tolerancePct: 2, comparisons: [
    { source: 'community_meter', label: 'Community meter', deviation: 0.6, coverage: 98.6 },
  ] },
];

function noise(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x) - 0.5;
}

export async function getSourceChecks(period: EnergyPeriod): Promise<SourceCheckReport> {
  await respond(500);
  const { from, now, samples } = samplesFor(period);
  const step = period === 'today' ? HOUR : DAY;
  const totals = { consumption: 0, pv: 0, storage: 0, grid: 0 };
  for (const s of samples) {
    totals.consumption += (s.consumption ?? 0) * 0.25;
    totals.pv += (s.pv ?? 0) * 0.25;
    totals.storage += Math.abs(s.storage ?? 0) * 0.25;
    totals.grid += Math.max(s.grid ?? 0, 0) * 0.25;
  }
  const lastDay = startOfDay(now, zone);
  const quantities: QuantityCheck[] = samples.length === 0 ? [] : CHECKS.map((q, qi) => {
    const reference = totals[q.quantity];
    return {
      quantity: q.quantity,
      referenceSource: q.referenceSource,
      referenceLabel: q.referenceLabel,
      referenceEnergyKwh: Math.round(reference),
      tolerancePct: q.tolerancePct,
      comparisons: q.comparisons.map((c, ci) => {
        const deviations = [];
        for (let t = period === 'today' ? startOfHour(from, zone) : from; t < now; t += step) {
          // The meters were offline for an hour last night: no comparison for that hour.
          const offline = period === 'today' && t >= lastDay + 3 * HOUR && t < lastDay + 4 * HOUR;
          const value = c.deviation == null || offline ? null : round1(c.deviation + noise(t / step + qi * 7 + ci) * q.tolerancePct);
          deviations.push({ time: iso(t), deviationPct: value });
        }
        return {
          source: c.source,
          label: c.label,
          energyKwh: c.deviation == null ? null : Math.round(reference * (1 + c.deviation / 100)),
          coveragePct: c.coverage,
          deviationPct: c.deviation,
          status: c.deviation == null ? 'missing' : Math.abs(c.deviation) <= q.tolerancePct ? 'within_tolerance' : 'outside_tolerance',
          deviations,
        };
      }),
    };
  });
  return { timeZone: zone, from: iso(from), to: iso(now), quantities };
}

/* ---------- Alerts ---------- */

const ago = (ms: number) => iso(Date.now() - ms);

let alerts: Alert[] = [
  {
    id: 'al-1', kind: 'corrective', severity: 'critical', state: 'new', assetId: 'inv-03', assetName: 'Inverter 3',
    title: 'Inverter 3 stopped with fault F07', text: 'Send a technician. Restart the inverter only after the cause is known.',
    raisedAt: ago(40 * 60 * 1000),
  },
  {
    id: 'al-2', kind: 'predictive', severity: 'warning', state: 'new', assetId: 'pv-02', assetName: 'Sports hall roof',
    title: 'Performance ratio below normal for 5 days', text: 'The other roofs performed as expected on the same days. Check the panels for dirt or new shade.',
    raisedAt: ago(5 * HOUR), indicator: { name: 'Performance ratio', value: 66, reference: 81, unit: '%' },
  },
  {
    id: 'al-3', kind: 'corrective', severity: 'warning', state: 'acknowledged', assetId: 'mtr-01', assetName: 'Community meter',
    title: 'No readings from 03:00 to 04:00', text: 'The missing values are estimated. Check the meter’s network connection if it happens again.',
    raisedAt: ago(7 * HOUR), acknowledgedAt: ago(6 * HOUR), acknowledgedBy: 'Manuel Ferreira',
  },
  {
    id: 'al-4', kind: 'predictive', severity: 'info', state: 'new', assetId: 'bat-01', assetName: 'Community battery',
    title: 'Usable capacity 4% below last year', text: 'No action needed now. Include it in the yearly inspection next month.',
    raisedAt: ago(2 * DAY), indicator: { name: 'Usable capacity', value: 96, reference: 100, unit: '%' },
  },
  {
    id: 'al-5', kind: 'corrective', severity: 'warning', state: 'resolved', assetId: 'pv-04', assetName: 'Library roof',
    title: 'Inverter monitoring lost', text: 'The inverter stopped sending data. Check its network connection.',
    raisedAt: ago(4 * DAY), acknowledgedAt: ago(4 * DAY - HOUR), acknowledgedBy: 'Carla Sousa', resolvedAt: ago(3 * DAY), resolution: 'Router restarted on site.',
  },
];

export async function listAlerts(): Promise<{ alerts: Alert[] }> {
  await respond(400);
  return { alerts: demo() === 'empty' ? [] : [...alerts].sort((a, b) => b.raisedAt.localeCompare(a.raisedAt)) };
}

function changeAlert(id: string, change: Partial<Alert>) {
  alerts = alerts.map((a) => (a.id === id ? { ...a, ...change } : a));
  return alerts.find((a) => a.id === id)!;
}

export async function acknowledgeAlert(id: string): Promise<Alert> {
  await respond(400);
  return changeAlert(id, { state: 'acknowledged', acknowledgedAt: iso(Date.now()), acknowledgedBy: 'Sample User' });
}

export async function resolveAlert(id: string, resolution: string): Promise<Alert> {
  await respond(400);
  if (!resolution.trim()) invalid('resolution', 'required', 'Write what was done.');
  return changeAlert(id, { state: 'resolved', resolvedAt: iso(Date.now()), resolution: resolution.trim() });
}

/* ---------- Assets ---------- */

const ASSETS: Omit<Asset, 'openAlerts'>[] = [
  { id: 'pv-01', name: 'School roof', type: 'pv_system', site: 'Primary school', status: 'running', dataQuality: 'MEASURED', ratings: [{ value: 18, unit: 'kWp' }], installedOn: '2024-03-12', lastReadingAt: ago(15 * 60 * 1000) },
  { id: 'pv-02', name: 'Sports hall roof', type: 'pv_system', site: 'Sports hall', status: 'attention', dataQuality: 'MEASURED', ratings: [{ value: 24, unit: 'kWp' }], installedOn: '2024-06-03', lastReadingAt: ago(15 * 60 * 1000) },
  { id: 'pv-03', name: 'Community center roof', type: 'pv_system', site: 'Community center', status: 'attention', dataQuality: 'MEASURED', ratings: [{ value: 10, unit: 'kWp' }], installedOn: '2024-09-20', lastReadingAt: ago(15 * 60 * 1000) },
  { id: 'pv-04', name: 'Library roof', type: 'pv_system', site: 'Library', status: 'running', dataQuality: 'MEASURED', ratings: [{ value: 8, unit: 'kWp' }], installedOn: '2025-02-14', lastReadingAt: ago(15 * 60 * 1000) },
  { id: 'inv-03', name: 'Inverter 3', type: 'inverter', site: 'Community center', status: 'fault', dataQuality: 'MEASURED', ratings: [{ value: 10, unit: 'kW' }], installedOn: '2024-09-20', lastReadingAt: ago(40 * 60 * 1000) },
  { id: 'bat-01', name: 'Community battery', type: 'battery', site: 'Community center', status: 'running', dataQuality: 'MEASURED', ratings: [{ value: 100, unit: 'kWh' }, { value: 25, unit: 'kW' }], installedOn: '2024-09-20', lastReadingAt: ago(15 * 60 * 1000) },
  { id: 'mtr-01', name: 'Community meter', type: 'meter', site: 'Community center', status: 'running', dataQuality: 'ESTIMATED', ratings: [], installedOn: '2024-03-12', lastReadingAt: ago(15 * 60 * 1000) },
];

export async function listAssets(): Promise<{ assets: Asset[] }> {
  await respond(400);
  if (demo() === 'empty') return { assets: [] };
  return { assets: ASSETS.map((a) => ({ ...a, openAlerts: alerts.filter((al) => al.assetId === a.id && al.state !== 'resolved') })) };
}

/* ---------- Users ---------- */

const ROLES: Role[] = [
  { id: 'viewer', label: 'Viewer', description: 'Sees energy data and assets.' },
  { id: 'technician', label: 'Technician', description: 'Also handles maintenance alerts and work orders.' },
  { id: 'manager', label: 'Community manager', description: 'Also manages members, assets and settings.' },
  { id: 'admin', label: 'Administrator', description: 'Also manages users and roles.' },
];

let users: User[] = [
  { id: 'u-1', name: 'Ana Ribeiro', email: 'ana.ribeiro@example.org', role: 'admin', status: 'active', lastActiveAt: ago(2 * HOUR), accessUntil: null, emailAlerts: true, note: '' },
  { id: 'u-2', name: 'Manuel Ferreira', email: 'manuel.ferreira@example.org', role: 'manager', status: 'active', lastActiveAt: ago(DAY), accessUntil: null, emailAlerts: true, note: '' },
  { id: 'u-3', name: 'Carla Sousa', email: 'carla.sousa@example.org', role: 'technician', status: 'active', lastActiveAt: ago(3 * DAY), accessUntil: '2027-03-31', emailAlerts: true, note: 'Installer contract until the end of March.' },
  { id: 'u-4', name: 'José Pinto', email: 'jose.pinto@example.org', role: 'viewer', status: 'invited', lastActiveAt: null, accessUntil: null, emailAlerts: false, note: '' },
  { id: 'u-5', name: 'Rosa Almeida', email: 'rosa.almeida@example.org', role: 'viewer', status: 'deactivated', lastActiveAt: ago(60 * DAY), accessUntil: null, emailAlerts: false, note: 'Moved out of the community.' },
];

export async function listUsers(): Promise<{ users: User[]; roles: Role[] }> {
  await respond(400);
  return { users: demo() === 'empty' ? [] : users, roles: ROLES };
}

export async function inviteUser(input: Invitation): Promise<User> {
  await respond(600);
  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) invalid('email', 'email_invalid', 'Enter an email address like name@example.org.');
  if (users.some((u) => u.email === email)) invalid('email', 'email_taken', 'Someone already uses this email. Choose that person in the list instead.');
  const user: User = { id: `u-${Date.now()}`, name: input.name.trim(), email, role: input.role, status: 'invited', lastActiveAt: null, accessUntil: null, emailAlerts: false, note: '' };
  users = [...users, user];
  return user;
}

export async function updateUser(id: string, changes: UserChanges): Promise<User> {
  await respond(500);
  const today = new Date().toISOString().slice(0, 10);
  if (changes.accessUntil && changes.accessUntil < today) invalid('accessUntil', 'date_past', 'Choose today or a later day.');
  users = users.map((u) => (u.id === id ? { ...u, ...changes } : u));
  return users.find((u) => u.id === id)!;
}

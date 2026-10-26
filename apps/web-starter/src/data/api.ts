import type { DataConfidence } from '@inno-trec/ui-web';
import { startOfDay, startOfHour } from '../time/zone';
import { COMMUNITY, generateReadings, type Reading } from './synthetic';

/**
 * FAKE BACKEND. It stands in for your API client while you build the interface.
 * Replace each function with a real request and keep the shapes. The backend computes every
 * figure the interface shows (totals, shares, indicators); the interface plots and formats them.
 *
 * To see the other states without a backend, add one of these to the address:
 *   ?demo=empty   no readings for the period
 *   ?demo=error   every request fails
 */

export class ApiError extends Error {
  /**
   * @param code A code for the whole request, for example UNAVAILABLE or VALIDATION.
   * @param fields Messages per form field, written by the backend, for example { email: 'Someone already uses this email.' }.
   */
  constructor(
    public code: string,
    public fields: Record<string, string> = {},
  ) {
    super(code);
  }
}

function demo() {
  return new URLSearchParams(window.location.search).get('demo');
}

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/* ---------- Energy ---------- */

export type Period = 'today' | '7d' | '30d';

export const PERIODS: Array<{ value: Period; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

/**
 * One row of the table view: energy in kWh for an hour (today) or a day (longer periods).
 * Values are null when no reading arrived in that hour or day: missing data is never zero.
 */
export interface EnergyRow {
  /** Start of the hour or day, in milliseconds since 1970 (UTC). */
  time: number;
  consumptionKwh: number | null;
  pvKwh: number | null;
  /** Net energy into the battery: positive when it charged more than it discharged. */
  storageKwh: number | null;
  /** Net energy from the grid: positive for import, negative for export. */
  gridKwh: number | null;
  /** 15-minute readings that did not arrive. The totals of this row leave them out. */
  missingReadings: number;
}

export interface EnergyReport {
  period: Period;
  /** The community's time zone (IANA name). Show every time in it, and name it on the page. */
  timeZone: string;
  /** Minutes between readings. The backend sets it; the interface does not assume 15. */
  resolution: number;
  readings: Reading[];
  rows: EnergyRow[];
  /** One row per hour for today, one per day for longer periods. */
  rowUnit: 'hour' | 'day';
  totals: {
    consumptionKwh: number;
    pvKwh: number;
    gridImportKwh: number;
    /** Share of the PV energy used inside the community, in percent. */
    selfConsumptionPct: number;
  };
}

const QUARTER = 15 * 60 * 1000;
const round1 = (n: number) => Math.round(n * 10) / 10;

export async function getEnergyReport(period: Period): Promise<EnergyReport> {
  await delay(500);
  if (demo() === 'error') throw new ApiError('UNAVAILABLE');

  const zone = COMMUNITY.timeZone;
  const now = Math.floor(Date.now() / QUARTER) * QUARTER;
  // Periods start at midnight in the community's time zone, not the reader's.
  const start = startOfDay(now, zone, period === '7d' ? -6 : period === '30d' ? -29 : 0);

  const readings = demo() === 'empty' ? [] : generateReadings(start, now, now - 60 * 60 * 1000);
  const rowUnit = period === 'today' ? 'hour' : 'day';

  // Everything below is the backend's arithmetic. A real interface receives these figures.
  const kwh = (kw: number | null) => (kw ?? 0) * 0.25;
  const buckets = new Map<number, { time: number; consumptionKwh: number; pvKwh: number; storageKwh: number; gridKwh: number; missingReadings: number; readings: number }>();
  let consumption = 0;
  let pv = 0;
  let gridImport = 0;
  let gridExport = 0;
  for (const r of readings) {
    const key = rowUnit === 'hour' ? startOfHour(r.time, zone) : startOfDay(r.time, zone);
    const row = buckets.get(key) ?? { time: key, consumptionKwh: 0, pvKwh: 0, storageKwh: 0, gridKwh: 0, missingReadings: 0, readings: 0 };
    if (r.consumption == null) row.missingReadings += 1;
    else row.readings += 1;
    row.consumptionKwh += kwh(r.consumption);
    row.pvKwh += kwh(r.pv);
    row.storageKwh += kwh(r.storage);
    row.gridKwh += kwh(r.grid);
    buckets.set(row.time, row);
    consumption += kwh(r.consumption);
    pv += kwh(r.pv);
    if ((r.grid ?? 0) > 0) gridImport += kwh(r.grid);
    else gridExport -= kwh(r.grid);
  }
  const rows: EnergyRow[] = [...buckets.values()].map((row) => {
    const value = (n: number) => (row.readings === 0 ? null : round1(n));
    return {
      time: row.time,
      consumptionKwh: value(row.consumptionKwh),
      pvKwh: value(row.pvKwh),
      storageKwh: value(row.storageKwh),
      gridKwh: value(row.gridKwh),
      missingReadings: row.missingReadings,
    };
  });

  return {
    period,
    timeZone: zone,
    resolution: 15,
    readings,
    rows,
    rowUnit,
    totals: {
      consumptionKwh: Math.round(consumption),
      pvKwh: Math.round(pv),
      gridImportKwh: Math.round(gridImport),
      selfConsumptionPct: pv > 0 ? Math.round(((pv - gridExport) / pv) * 100) : 0,
    },
  };
}

/* ---------- Assets ---------- */

export type AssetStatus = 'RUNNING' | 'ATTENTION' | 'FAULT' | 'OFFLINE';

/** A maintenance suggestion written by the backend for the person responsible for the asset. */
export interface Suggestion {
  tone: 'warning' | 'error' | 'info';
  title: string;
  text: string;
}

export interface Asset {
  id: string;
  name: string;
  type: 'PV system' | 'Inverter' | 'Battery' | 'Meter';
  site: string;
  status: AssetStatus;
  /** How the latest data was obtained. */
  dataQuality: DataConfidence;
  /** Already formatted by the backend, for example "42 kWp". */
  rating: string;
  installed: string;
  lastReading: string;
  suggestions: Suggestion[];
}

const ASSETS: Asset[] = [
  {
    id: 'pv-01',
    name: 'School roof',
    type: 'PV system',
    site: 'Primary school',
    status: 'RUNNING',
    dataQuality: 'MEASURED',
    rating: '24 kWp',
    installed: 'March 2024',
    lastReading: '15 minutes ago',
    suggestions: [],
  },
  {
    id: 'pv-02',
    name: 'Sports hall roof',
    type: 'PV system',
    site: 'Sports hall',
    status: 'ATTENTION',
    dataQuality: 'MEASURED',
    rating: '36 kWp',
    installed: 'June 2024',
    lastReading: '15 minutes ago',
    suggestions: [
      {
        tone: 'warning',
        title: 'Yield 18% below expected for 5 days',
        text: 'The other roofs produced as expected on the same days. Check the panels for dirt or new shade.',
      },
    ],
  },
  {
    id: 'inv-03',
    name: 'Inverter 3',
    type: 'Inverter',
    site: 'Sports hall',
    status: 'FAULT',
    dataQuality: 'MEASURED',
    rating: '20 kW',
    installed: 'June 2024',
    lastReading: 'Today at 10:42',
    suggestions: [
      {
        tone: 'error',
        title: 'Stopped with fault F07 at 10:42',
        text: 'Send a technician. Restart the inverter only after the cause is known.',
      },
    ],
  },
  {
    id: 'bat-01',
    name: 'Community battery',
    type: 'Battery',
    site: 'Community center',
    status: 'RUNNING',
    dataQuality: 'MEASURED',
    rating: '100 kWh, 25 kW',
    installed: 'September 2024',
    lastReading: '15 minutes ago',
    suggestions: [
      {
        tone: 'info',
        title: 'Yearly inspection due in 3 weeks',
        text: 'Book the inspection with the installer before the end of the month.',
      },
    ],
  },
  {
    id: 'mtr-01',
    name: 'Community meter',
    type: 'Meter',
    site: 'Community center',
    status: 'OFFLINE',
    dataQuality: 'ESTIMATED',
    rating: '3-phase, 15-minute readings',
    installed: 'March 2024',
    lastReading: 'Today at 03:00',
    suggestions: [
      {
        tone: 'warning',
        title: 'No readings for one hour last night',
        text: 'The missing values are estimated. Check the meter’s network connection if it happens again.',
      },
    ],
  },
];

export async function getAssets(): Promise<Asset[]> {
  await delay(400);
  if (demo() === 'error') throw new ApiError('UNAVAILABLE');
  if (demo() === 'empty') return [];
  return ASSETS;
}

/* ---------- Users ---------- */

export type RoleId = 'viewer' | 'technician' | 'manager' | 'admin';
export type UserStatus = 'ACTIVE' | 'INVITED' | 'DEACTIVATED';

/** A role as the backend describes it. The backend decides what each role may do. */
export interface Role {
  value: RoleId;
  label: string;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleId;
  status: UserStatus;
  /** Already formatted by the backend, for example "Today at 09:12". */
  lastActive: string;
  /** Last day of access, "YYYY-MM-DD", or "" for no end date. */
  accessUntil: string;
  emailAlerts: boolean;
  /** Visible to administrators only. */
  note: string;
}

export interface UserChanges {
  role: RoleId;
  accessUntil: string;
  emailAlerts: boolean;
  note: string;
}

const ROLES: Role[] = [
  { value: 'viewer', label: 'Viewer', description: 'Sees energy data and assets.' },
  { value: 'technician', label: 'Technician', description: 'Also handles maintenance suggestions and work orders.' },
  { value: 'manager', label: 'Community manager', description: 'Also manages members, assets and settings.' },
  { value: 'admin', label: 'Administrator', description: 'Also manages users and roles.' },
];

// Kept in memory, so changes last until the page reloads.
let users: User[] = [
  { id: 'u-1', name: 'Ana Ribeiro', email: 'ana.ribeiro@example.org', role: 'admin', status: 'ACTIVE', lastActive: 'Today at 09:12', accessUntil: '', emailAlerts: true, note: '' },
  { id: 'u-2', name: 'Manuel Ferreira', email: 'manuel.ferreira@example.org', role: 'manager', status: 'ACTIVE', lastActive: 'Yesterday', accessUntil: '', emailAlerts: true, note: '' },
  { id: 'u-3', name: 'Carla Sousa', email: 'carla.sousa@example.org', role: 'technician', status: 'ACTIVE', lastActive: '3 days ago', accessUntil: '2027-03-31', emailAlerts: true, note: 'Installer contract until the end of March.' },
  { id: 'u-4', name: 'José Pinto', email: 'jose.pinto@example.org', role: 'viewer', status: 'INVITED', lastActive: 'Never', accessUntil: '', emailAlerts: false, note: '' },
  { id: 'u-5', name: 'Rosa Almeida', email: 'rosa.almeida@example.org', role: 'viewer', status: 'DEACTIVATED', lastActive: '2 months ago', accessUntil: '', emailAlerts: false, note: 'Moved out of the community.' },
];

export async function getUsers(): Promise<{ users: User[]; roles: Role[] }> {
  await delay(400);
  if (demo() === 'error') throw new ApiError('UNAVAILABLE');
  return { users: demo() === 'empty' ? [] : users, roles: ROLES };
}

export async function inviteUser(input: { name: string; email: string; role: RoleId; sendEmail: boolean }): Promise<User> {
  await delay(600);
  if (demo() === 'error') throw new ApiError('UNAVAILABLE');
  // The backend validates the rules. The form only checked that the fields are filled in.
  const email = input.email.trim().toLowerCase();
  if (users.some((u) => u.email === email)) throw new ApiError('VALIDATION', { email: 'Someone already uses this email. Choose that person in the list instead.' });
  const user: User = { id: `u-${Date.now()}`, name: input.name.trim(), email, role: input.role, status: 'INVITED', lastActive: 'Never', accessUntil: '', emailAlerts: false, note: '' };
  users = [...users, user];
  return user;
}

export async function updateUser(id: string, changes: UserChanges): Promise<User> {
  await delay(500);
  if (demo() === 'error') throw new ApiError('UNAVAILABLE');
  const today = new Date().toISOString().slice(0, 10);
  if (changes.accessUntil && changes.accessUntil < today) throw new ApiError('VALIDATION', { accessUntil: 'Choose today or a later day.' });
  users = users.map((u) => (u.id === id ? { ...u, ...changes } : u));
  return users.find((u) => u.id === id)!;
}

export async function setUserActive(id: string, active: boolean): Promise<User> {
  await delay(500);
  if (demo() === 'error') throw new ApiError('UNAVAILABLE');
  users = users.map((u) => (u.id === id ? { ...u, status: active ? 'ACTIVE' : 'DEACTIVATED' } : u));
  return users.find((u) => u.id === id)!;
}

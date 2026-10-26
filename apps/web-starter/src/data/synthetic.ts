/**
 * SYNTHETIC DATA for a small energy community. It stands in for real meter readings.
 * Replace it with your backend. Nothing here is a model of a real site.
 *
 * The community: 24 households, 60 kWp of rooftop PV and a 100 kWh shared battery.
 * Readings are every 15 minutes. The same day always gives the same values, so screenshots
 * and tests stay stable.
 */

export const COMMUNITY = { households: 24, pvKwp: 60, batteryKwh: 100, batteryKw: 25 };

/** One 15-minute reading. Power in kW: storage is positive while charging, grid is positive while importing. */
export interface Reading {
  /** Start of the interval, in milliseconds since 1970 (UTC). */
  time: number;
  consumption: number | null;
  pv: number | null;
  storage: number | null;
  grid: number | null;
  /** Battery state of charge, in percent. */
  soc: number | null;
  /** True for the latest readings, which the meters have not confirmed yet. */
  estimated: boolean;
}

const STEP_MS = 15 * 60 * 1000;

/** A small seeded random number generator (mulberry32), so a day always looks the same. */
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dayNumber = (time: number) => Math.floor(time / 86_400_000);

/** How clear the sky is on a given day, from 0.35 (overcast) to 1 (clear). */
function clearness(day: number) {
  return 0.35 + 0.65 * random(day * 7919)();
}

function pvAt(time: number, rnd: () => number) {
  const date = new Date(time);
  const hour = date.getHours() + date.getMinutes() / 60;
  const sun = Math.sin((Math.PI * (hour - 6.5)) / 13);
  if (sun <= 0) return 0;
  const clouds = clearness(dayNumber(time)) * (0.85 + 0.15 * rnd());
  return COMMUNITY.pvKwp * 0.8 * Math.pow(sun, 1.3) * clouds;
}

function consumptionAt(time: number, rnd: () => number) {
  const date = new Date(time);
  const hour = date.getHours() + date.getMinutes() / 60;
  const morning = 10 * Math.exp(-((hour - 7.5) ** 2) / 1.5);
  const evening = 18 * Math.exp(-((hour - 19.5) ** 2) / 3);
  const weekend = date.getDay() === 0 || date.getDay() === 6 ? 1.15 : 1;
  return (8 + morning + evening) * weekend * (0.9 + 0.2 * rnd());
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Readings from `from` up to (not including) `to`, every 15 minutes.
 * Readings at or after `estimatedAfter` are marked as estimated. The meters are offline from
 * 03:00 to 04:00 on the last day, to show a gap in the data.
 */
export function generateReadings(from: number, to: number, estimatedAfter: number): Reading[] {
  const readings: Reading[] = [];
  let socKwh = COMMUNITY.batteryKwh * 0.4;
  const lastDay = new Date(to - 1).toDateString();

  for (let time = from; time < to; time += STEP_MS) {
    const rnd = random(Math.floor(time / STEP_MS));
    const pv = pvAt(time, rnd);
    const consumption = consumptionAt(time, rnd);

    // A simple battery: store the surplus, cover the deficit, within its power and size.
    const surplus = pv - consumption;
    let storage = 0;
    if (surplus > 0) storage = Math.min(surplus, COMMUNITY.batteryKw, ((COMMUNITY.batteryKwh - socKwh) / 0.25) / 0.95);
    else storage = -Math.min(-surplus, COMMUNITY.batteryKw, socKwh / 0.25);
    socKwh += storage > 0 ? storage * 0.25 * 0.95 : storage * 0.25;
    const grid = consumption - pv + storage;

    const date = new Date(time);
    const offline = date.toDateString() === lastDay && date.getHours() === 3;
    readings.push(
      offline
        ? { time, consumption: null, pv: null, storage: null, grid: null, soc: null, estimated: false }
        : {
            time,
            consumption: round(consumption),
            pv: round(pv),
            storage: round(storage),
            grid: round(grid),
            soc: round((socKwh / COMMUNITY.batteryKwh) * 100),
            estimated: time >= estimatedAfter,
          },
    );
  }
  return readings;
}

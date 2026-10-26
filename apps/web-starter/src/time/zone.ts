/**
 * Clock time in a given time zone (an IANA name such as "Europe/Lisbon"), with the browser's Intl API only.
 * The tool shows times in the community's time zone, which the backend sends, so a reader in another
 * time zone sees the same days, solar peaks and alarm times as the community.
 */

/** The browser's own time zone. Use it only when the backend sends none. */
export const BROWSER_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

const partsFormats = new Map<string, Intl.DateTimeFormat>();

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** The calendar date and clock time of an instant in `timeZone`. */
export function zonedParts(ms: number, timeZone: string): ZonedParts {
  let format = partsFormats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'short',
    });
    partsFormats.set(timeZone, format);
  }
  const parts = Object.fromEntries(format.formatToParts(ms).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: WEEKDAYS.indexOf(parts.weekday),
  };
}

/** How far `timeZone` is ahead of UTC at that instant, in milliseconds (summer time included). */
export function zoneOffset(ms: number, timeZone: string) {
  const p = zonedParts(ms, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return asUtc - Math.floor(ms / 60_000) * 60_000;
}

/** Midnight at the start of the day that contains `ms` in `timeZone`, moved by `addDays` days. */
export function startOfDay(ms: number, timeZone: string, addDays = 0) {
  const p = zonedParts(ms, timeZone);
  const wall = Date.UTC(p.year, p.month - 1, p.day + addDays);
  // Two passes, because the offset at midnight can differ from the offset now (summer time).
  const guess = wall - zoneOffset(ms, timeZone);
  return wall - zoneOffset(guess, timeZone);
}

/** The start of the hour that contains `ms` in `timeZone`. */
export function startOfHour(ms: number, timeZone: string) {
  const p = zonedParts(ms, timeZone);
  return Math.floor(ms / 60_000) * 60_000 - p.minute * 60_000;
}

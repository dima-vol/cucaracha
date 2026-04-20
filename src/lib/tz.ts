// Timezone math using the browser's built-in Intl API — no extra deps.

export type CityEntry = {
  id: string;
  city: string;
  country: string;
  iso2: string;
  timezone: string; // IANA, e.g. "Europe/Paris"
};

export type HourCell = {
  /** Hour in 12-hour clock, 1..12 */
  hour12: number;
  /** "am" | "pm" */
  ampm: "am" | "pm";
  /** Day of month in that city at that moment */
  day: number;
  /** Short month name in that city at that moment, e.g. "Apr" */
  month: string;
  /** 0..23 in that city at that moment */
  hour24: number;
};

/** Format a date into a city's local parts. */
export function cityParts(tz: string, date: Date): HourCell {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    hour12: true,
    day: "numeric",
    month: "short",
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hour12 = parseInt(get("hour"), 10);
  const ampm = (get("dayPeriod").toLowerCase() as "am" | "pm") || "am";
  const day = parseInt(get("day"), 10);
  const month = get("month");
  const hour24 =
    ampm === "am"
      ? hour12 === 12
        ? 0
        : hour12
      : hour12 === 12
        ? 12
        : hour12 + 12;
  return { hour12, ampm, day, month, hour24 };
}

/** Full local clock HH:MM am/pm for display on the right-hand side. */
export function cityClock(tz: string, date: Date): { time: string; ampm: string } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const parts = fmt.formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "";
  const dp = (parts.find((p) => p.type === "dayPeriod")?.value ?? "AM").toLowerCase();
  return { time: `${hour}:${minute}`, ampm: dp };
}

/** Short timezone abbreviation ("BST", "CEST", "GMT-3"). */
export function cityTzAbbr(tz: string, date: Date): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "short",
  });
  const parts = fmt.formatToParts(date);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
}

/** Offset in minutes between two IANA zones at a given instant (toTz − fromTz). */
export function offsetMinutesBetween(fromTz: string, toTz: string, date: Date): number {
  return zoneOffsetMinutes(toTz, date) - zoneOffsetMinutes(fromTz, date);
}

/** Absolute offset in minutes from UTC for an IANA zone at a given instant. */
export function zoneOffsetMinutes(tz: string, date: Date): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "longOffset",
  });
  const parts = fmt.formatToParts(date);
  const raw = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  // "GMT+01:00", "GMT-05:30", "GMT"
  const m = raw.match(/GMT(?:([+-])(\d{1,2})(?::(\d{2}))?)?/);
  if (!m || !m[1]) return 0;
  const sign = m[1] === "+" ? 1 : -1;
  const h = parseInt(m[2] ?? "0", 10);
  const mm = parseInt(m[3] ?? "0", 10);
  return sign * (h * 60 + mm);
}

/** Human-readable offset-from-home indicator like "+4", "-2", or "" if zero. */
export function offsetFromHomeLabel(
  homeTz: string,
  cityTz: string,
  date: Date
): string {
  const mins = offsetMinutesBetween(homeTz, cityTz, date);
  if (mins === 0) return "";
  const hours = mins / 60;
  if (Number.isInteger(hours)) {
    return (hours > 0 ? "+" : "") + hours;
  }
  // fractional offsets (e.g. India +5.5)
  const sign = mins > 0 ? "+" : "-";
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}:${String(m).padStart(2, "0")}`;
}

/** Two-tier classification of a local hour: "night" is the do-not-disturb
 *  window (9 PM through 9 AM, 12 hours); the rest of the day is fair game
 *  for communication. Keeping it to two tiers — instead of also calling
 *  out an "evening" — produces a much calmer bar with a single
 *  unambiguous "this is uncomfortable" stripe per timezone. */
export function hourTier(hour24: number): "day" | "night" {
  if (hour24 >= 9 && hour24 < 21) return "day";
  return "night";
}

/** A pure y-m-d integer for a city's local date at an instant. Used to
 *  compare "is it the next day there?" without timezone math headaches. */
export function cityDateNumber(tz: string, date: Date): number {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA gives YYYY-MM-DD reliably across browsers.
  const parts = fmt.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const y = parseInt(get("year"), 10);
  const m = parseInt(get("month"), 10);
  const d = parseInt(get("day"), 10);
  return y * 10000 + m * 100 + d;
}

/** Returns -1 / 0 / +1 if `cityTz`'s local date is earlier / same / later
 *  than `homeTz`'s local date at the given absolute instant. */
export function dateDeltaDays(
  homeTz: string,
  cityTz: string,
  date: Date
): number {
  const home = cityDateNumber(homeTz, date);
  const city = cityDateNumber(cityTz, date);
  if (city === home) return 0;
  return city > home ? 1 : -1;
}

/** Render a HH:MM am/pm — HH:MM am/pm range in a city's local time. */
export function cityRange(
  tz: string,
  fromMs: number,
  toMs: number
): string {
  const fmt = (ms: number) => {
    const c = cityClock(tz, new Date(ms));
    return `${c.time}${c.ampm}`;
  };
  return `${fmt(fromMs)} – ${fmt(toMs)}`;
}

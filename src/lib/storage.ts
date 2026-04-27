import type { CityEntry } from "./tz";

const KEY = "cucaracha-tz:v1";

export type PersistedState = {
  cities: CityEntry[];
  homeId: string | null;
};

function isValidCity(c: unknown): c is CityEntry {
  if (!c || typeof c !== "object") return false;
  const obj = c as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.city === "string" &&
    typeof obj.country === "string" &&
    typeof obj.iso2 === "string" &&
    typeof obj.timezone === "string" &&
    obj.timezone.length > 0
  );
}

export function loadState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!Array.isArray(parsed.cities)) return null;
    // Filter out any malformed entries to prevent downstream Intl crashes.
    const cities = parsed.cities.filter(isValidCity);
    const homeId = typeof parsed.homeId === "string" ? parsed.homeId : null;
    return { cities, homeId };
  } catch {
    return null;
  }
}

export function saveState(state: PersistedState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota or privacy mode — silently ignore; the app still works in-memory.
  }
}

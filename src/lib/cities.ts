// Search helpers over the bundled city-timezones dataset.
import rawCityMap from "city-timezones/data/cityMap.json";

export type RawCity = {
  city: string;
  city_ascii: string;
  lat: number;
  lng: number;
  pop: number | string;
  country: string;
  iso2: string;
  iso3: string;
  province: string;
  timezone: string;
};

const ALL_CITIES = rawCityMap as RawCity[];

function pop(c: RawCity): number {
  const n = typeof c.pop === "string" ? parseInt(c.pop, 10) : c.pop;
  return Number.isFinite(n) ? n : 0;
}

/** Fuzzy-ish prefix+substring search, ranked by population. */
export function searchCities(query: string, limit = 30): RawCity[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    // Default: top cities by population (useful for empty state)
    return [...ALL_CITIES]
      .filter((c) => pop(c) > 0)
      .sort((a, b) => pop(b) - pop(a))
      .slice(0, limit);
  }
  const starts: RawCity[] = [];
  const contains: RawCity[] = [];
  for (const c of ALL_CITIES) {
    const city = c.city_ascii.toLowerCase();
    const country = c.country.toLowerCase();
    const prov = c.province?.toLowerCase?.() ?? "";
    if (city.startsWith(q) || country.startsWith(q)) {
      starts.push(c);
    } else if (city.includes(q) || country.includes(q) || prov.includes(q)) {
      contains.push(c);
    }
  }
  const rank = (a: RawCity, b: RawCity) => pop(b) - pop(a);
  starts.sort(rank);
  contains.sort(rank);
  return [...starts, ...contains].slice(0, limit);
}

export function cityKey(c: RawCity): string {
  // Stable, reasonably unique key
  return `${c.city_ascii}-${c.iso2}-${c.province || "_"}-${c.timezone}`.replace(
    /\s+/g,
    "_"
  );
}

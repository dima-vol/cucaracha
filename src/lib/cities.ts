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

// BGN/PCGN-flavored map for Russian / Ukrainian / Bulgarian inputs. The
// bundled dataset only stores Latin city names ("Krasnoyarsk", "Moscow"),
// so a user typing "Красноярск" wouldn't match anything otherwise.
const CYR_TO_LAT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", ґ: "g", д: "d", е: "e", є: "ye",
  ё: "yo", ж: "zh", з: "z", и: "i", і: "i", ї: "yi", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch",
  ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
  я: "ya",
};

function transliterate(s: string): string {
  let out = "";
  for (const ch of s) {
    out += CYR_TO_LAT[ch] ?? ch;
  }
  return out;
}

/** Fuzzy-ish prefix+substring search, ranked by population. Cyrillic input
 *  is transliterated to Latin first so users can search in either script. */
export function searchCities(query: string, limit = 30): RawCity[] {
  const raw = query.trim().toLowerCase();
  if (!raw) {
    return [...ALL_CITIES]
      .filter((c) => pop(c) > 0)
      .sort((a, b) => pop(b) - pop(a))
      .slice(0, limit);
  }
  const q = transliterate(raw);
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
  return `${c.city_ascii}-${c.iso2}-${c.province || "_"}-${c.timezone}`.replace(
    /\s+/g,
    "_"
  );
}

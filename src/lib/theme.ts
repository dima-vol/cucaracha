/**
 * Which home-city timezones unlock a themed visual treatment for the
 * app. Today: only Buenos Aires triggers the tarot theme. Add more IANA
 * zones here as themed artwork lands — one edit unlocks the theme in
 * every place that reads this set (no hard-coded timezone checks
 * scattered through components).
 */
export const TAROT_HOME_TZS: ReadonlySet<string> = new Set([
  "America/Argentina/Buenos_Aires",
]);

/** Returns the theme slug to apply for the given home timezone, or null
 *  for the default minimalist look. */
export function cityThemeForTz(tz: string): "tarot" | null {
  if (TAROT_HOME_TZS.has(tz)) return "tarot";
  return null;
}

/** Map of curated city → landmark asset slug (file at
 *  /public/landmarks/{slug}.png). Keyed by city name + iso2 to avoid the
 *  false positives a pure-timezone key would produce (Asia/Dubai covers
 *  many cities, not just Dubai). */
const LANDMARK_SLUGS: Record<string, string> = {
  "buenos aires|ar": "buenos-aires",
  "dubai|ae": "dubai",
  "moscow|ru": "moscow",
};

export function landmarkSlugFor(city: {
  city: string;
  iso2: string;
}): string | null {
  const key = `${city.city.toLowerCase()}|${city.iso2.toLowerCase()}`;
  return LANDMARK_SLUGS[key] ?? null;
}

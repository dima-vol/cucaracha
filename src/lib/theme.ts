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

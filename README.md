# Cucaracha

**Time zones are broken for people who live across cities.**

The world moved to remote. Your team is in Buenos Aires, Berlin, and Bangkok. Every scheduling tool makes you do the math — it's either a spreadsheet or a prayer. This is the tool we wished existed.

**[cucaracha.ai](https://cucaracha.ai)** — open in any browser, add to home screen, done.

---

## What it does

A single scrollable timeline. All your cities, locked in step. You see everyone's day at once. Drag to pick a time that works. No accounts. No backend. No nonsense.

- Tap a column, see that hour highlighted across every city simultaneously
- Swipe left to look ahead, right to look back — haptic feedback on every column boundary
- Add any of 7,300+ cities in seconds, including Cyrillic search
- Works offline. Installs as a native-feeling app. No App Store needed.

---

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind v4
- `city-timezones` — 7,300+ cities with IANA zones, fully bundled
- Native `Intl.DateTimeFormat` — no moment, no luxon
- PWA: service worker, offline-first, installable
- localStorage — no backend, no database, no account

---

## Get started

```bash
git clone https://github.com/dima-vol/cucaracha
cd cucaracha
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000).

```bash
npm run build   # icons + version.json + next build
npm run lint
```

---

## Project layout

```
src/
├── app/
│   ├── layout.tsx            root layout, manifest/meta, SW registration
│   ├── page.tsx              landing page
│   ├── app/page.tsx          the time-zone app
│   └── globals.css
├── components/
│   ├── AddCitySheet.tsx      city picker bottom sheet
│   ├── CityRow.tsx           single city row with time bar
│   ├── DateStrip.tsx         scrollable date header
│   ├── InstallHint.tsx       "add to home screen" prompt
│   ├── TimeBar.tsx           24h horizontal time bar
│   └── TimeColumnOverlay.tsx hour-column tap targets
├── hooks/
│   ├── useCities.ts          city list state + persistence
│   └── useHaptic.ts          iOS/Android haptic engine
└── lib/
    ├── tz.ts                 Intl-based timezone helpers
    ├── cities.ts             fuzzy city search
    ├── storage.ts            localStorage persistence
    └── cn.ts

public/
├── sw.js                     offline service worker
├── version.json              build SHA + timestamp
└── icon-*.png                generated from icon.svg

scripts/
├── gen-version.mjs           writes version.json at build time
└── generate-icons.mjs        renders icon.svg → PNG variants
```

---

## Contributing

Issues and PRs welcome. Keep it simple — this tool does one thing.

---

MIT © [Dima Vol](https://github.com/dima-vol)

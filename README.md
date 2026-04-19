# Cucaracha — Time Zones

A beautifully simple time-zone companion for people scheduling across
cities. Built as a progressive web app: open in a browser, then add to the
home screen to get an app-like launcher icon — no App Store needed.

Live at **[cucaracha.ai](https://cucaracha.ai)**.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind v4
- `city-timezones` bundled dataset (7,300+ cities with IANA zones)
- `@dnd-kit` for drag-to-reorder
- Native `Intl.DateTimeFormat` for all timezone math (no moment/luxon needed)
- PWA: manifest + service worker, offline-first
- localStorage for state (no backend — yet)

## Scripts

```bash
npm run dev       # next dev
npm run build     # regenerate icons + next build
npm run start     # production server
npm run lint
```

## Project layout

```
src/
├── app/
│   ├── layout.tsx            root layout, manifest/meta, SW registration
│   ├── page.tsx              landing page at /
│   ├── app/page.tsx          the time-zone app at /app
│   └── globals.css
├── components/
│   ├── CityRow.tsx
│   ├── TimeBar.tsx
│   ├── AddCitySheet.tsx
│   ├── InstallHint.tsx
│   ├── ScrollSync.tsx
│   └── ServiceWorkerRegister.tsx
├── hooks/
│   └── useCities.ts
└── lib/
    ├── tz.ts                 Intl-based time helpers
    ├── cities.ts             search over bundled dataset
    ├── storage.ts            localStorage persistence
    └── cn.ts

public/
├── manifest.webmanifest
├── sw.js
├── icon.svg
└── icon-*.png                generated from icon.svg
```

## Archived

The previous marketing landing (Cucaracha AI demo + game) lives on the
[`archive/marketing-demo`](https://github.com/satoshiarch/cucaracha/tree/archive/marketing-demo)
branch.

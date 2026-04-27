# Cucaracha

> Faster than asking an AI. Faster than Googling. Five seconds to see every timezone you work with — or your money back (it's free).

I'm a remote founder. The moment I use this most: I'm about to schedule a call with someone and I need to know if 3pm my time is reasonable for them — right now, without context-switching to a browser tab, without asking an AI and waiting for a response.

Every existing tool I tried was either paywalled after four cities, covered in ads, or slow enough that I'd already forgotten why I opened it.

So I built my own. And then open-sourced it, because a timezone lookup is a calculator. It should be free. Forever.

**[cucaracha.ai](https://cucaracha.ai)** — open in any browser, add to home screen, done.

---

## How it works

Open the app. Tap your city. See every timezone you work with, side by side on a single scrollable timeline. The dates at the top aren't just functional — they're a visual anchor that lets your brain parse "tomorrow afternoon in Tokyo" in one glance instead of doing the math.

Under 5 seconds from unlock to answer. No account. No ads. No limit on cities.

---

## Why a PWA

This started as an experiment: can you build an app that installs on every device — iPhone, Android, desktop — without touching the App Store or Google Play?

Yes. You can. Open in Safari, add to home screen, get an icon, offline support, and a native feel. This is how I think all MVPs should be built. Separate iOS and Android apps are a complexity tax you shouldn't pay until you've proven the idea.

---

## Features

- **Lockstep horizontal scroll** — all city bars move together, one finger
- **Range selection** — tap or drag to highlight a time window across all zones simultaneously
- **Haptic feedback** — tactile ratchet on every column boundary while swiping (iOS Safari 17.4+ / Android Chrome)
- **Date strip** — scrollable header that anchors your sense of "which day"
- **Now indicator** — live hairline on the current hour
- **City search** — 7,300+ cities, Cyrillic supported
- **Drag-to-reorder** — long-press to rearrange your list
- **Offline-first** — service worker caches everything, works without network

---

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind v4
- `city-timezones` — 7,300+ cities with IANA zones, fully bundled
- Native `Intl.DateTimeFormat` — no moment, no luxon, no BS
- PWA: service worker, offline-first, installable on any device
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

Issues and PRs welcome. If you think timezone lookup should cost money — we disagree, but you're welcome to fork it.

---

MIT © [Dima Vol](https://github.com/dima-vol)

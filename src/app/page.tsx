import Link from "next/link";
import { ArrowRight, Globe, Plus, Share, Home, Star } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-white text-[var(--foreground)]">
      <header className="px-6 sm:px-10 h-16 flex items-center justify-between border-b border-[var(--border)]">
        <div className="flex items-baseline gap-2">
          <span className="text-[18px] font-semibold tracking-tight">
            Cucaracha
          </span>
          <span className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
            Time Zones
          </span>
        </div>
        <Link
          href="/app"
          className="text-[14px] font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
        >
          Open app <ArrowRight size={14} />
        </Link>
      </header>

      <main className="flex-1">
        <section className="px-6 sm:px-10 pt-16 sm:pt-24 pb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-[12px] font-medium mb-6">
            <Globe size={12} /> Works offline · Installs to home screen
          </div>
          <h1 className="text-[40px] sm:text-[56px] leading-[1.05] font-semibold tracking-tight">
            Every timezone,
            <br />
            <span className="text-slate-400">in under 5 seconds.</span>
          </h1>
          <p className="mt-6 text-[17px] sm:text-[18px] text-slate-600 max-w-xl leading-relaxed">
            Built for remote founders who schedule calls across cities.
            Open the app, see everyone&apos;s time at once. No ads, no paywall, no account.
            A timezone lookup is a calculator — it should always be free.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-black text-white text-[15px] font-medium hover:bg-slate-800"
            >
              Open the app <ArrowRight size={16} />
            </Link>
            <a
              href="#install"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-[var(--border)] text-[15px] font-medium text-slate-700 hover:bg-slate-50"
            >
              How to install
            </a>
          </div>
          <div className="mt-5">
            <a
              href="https://github.com/dima-vol/cucaracha"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-8 px-3 rounded-md border border-[#d0d7de] bg-[#f6f8fa] hover:bg-[#edf0f3] text-[13px] font-medium text-slate-800 shadow-sm transition-colors"
            >
              <Star size={14} className="text-slate-500" />
              Star on GitHub
            </a>
          </div>
        </section>

        <section className="px-6 sm:px-10 pb-16 max-w-3xl mx-auto">
          <div className="rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
            <div className="h-10 flex items-center gap-1.5 px-4 border-b border-[var(--border)] bg-slate-50">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="ml-3 text-[12px] text-slate-400">
                cucaracha.ai/app
              </span>
            </div>
            <PreviewRows />
          </div>
        </section>

        <section
          id="install"
          className="px-6 sm:px-10 py-16 max-w-3xl mx-auto border-t border-[var(--border)]"
        >
          <h2 className="text-[28px] font-semibold tracking-tight">
            Install it on your phone
          </h2>
          <p className="mt-3 text-slate-600 text-[15px] leading-relaxed max-w-xl">
            Cucaracha is a progressive web app. It runs in the browser, then
            tucks itself onto your home screen like any other app — no App
            Store needed.
          </p>

          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            <InstallCard
              platform="iPhone / iPad"
              steps={[
                "Open cucaracha.ai in Safari.",
                "Tap the Share button.",
                "Tap Add to Home Screen.",
                "Launch from the home-screen icon.",
              ]}
              icon={<Share size={16} />}
            />
            <InstallCard
              platform="Android"
              steps={[
                "Open cucaracha.ai in Chrome.",
                "Tap the menu (three dots).",
                "Tap Install app or Add to Home screen.",
                "Launch from the home-screen icon.",
              ]}
              icon={<Plus size={16} />}
            />
          </div>
        </section>
      </main>

      <footer className="px-6 sm:px-10 py-8 border-t border-[var(--border)] text-[12px] text-slate-400 flex items-center justify-between">
        <span>© {new Date().getFullYear()} Cucaracha</span>
        <Link href="/app" className="hover:text-slate-700">
          Open app →
        </Link>
      </footer>
    </div>
  );
}

function InstallCard({
  platform,
  steps,
  icon,
}: {
  platform: string;
  steps: string[];
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-5">
      <div className="flex items-center gap-2 text-[13px] font-medium text-slate-900">
        <span className="w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
          {icon}
        </span>
        {platform}
      </div>
      <ol className="mt-4 space-y-2 text-[14px] text-slate-600">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="flex-none w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium flex items-center justify-center">
              {i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}

function PreviewRows() {
  const rows = [
    {
      city: "San Francisco",
      abbr: "PDT",
      offset: null as string | null,
      clock: "9:00 am",
      home: true,
    },
    { city: "New York", abbr: "EDT", offset: "+3", clock: "12:00 pm", home: false },
    { city: "London", abbr: "BST", offset: "+8", clock: "5:00 pm", home: false },
    { city: "Tokyo", abbr: "JST", offset: "+16", clock: "1:00 am", home: false },
  ];
  return (
    <div className="divide-y divide-[var(--border)]">
      {rows.map((r) => (
        <div
          key={r.city}
          className={`px-4 py-3 ${r.home ? "bg-[var(--home-tint)]" : ""}`}
        >
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 flex items-center justify-center text-slate-400">
              {r.home ? (
                <Home size={16} fill="currentColor" className="text-amber-600" />
              ) : (
                <span className="text-[11px] font-semibold text-slate-400">
                  {r.offset}
                </span>
              )}
            </span>
            <div className="flex-1 flex items-baseline gap-1.5">
              <span className="text-[18px] font-medium">{r.city}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 relative -top-1.5">
                {r.abbr}
              </span>
            </div>
            <span className="tabular-nums text-[18px] font-medium text-slate-700">
              {r.clock}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

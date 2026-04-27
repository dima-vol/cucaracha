"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CalendarDays, List, LayoutList, Plus } from "lucide-react";
import { useCities } from "@/hooks/useCities";
import { useHaptic } from "@/hooks/useHaptic";
import { CityRow } from "@/components/CityRow";
import { AddCitySheet } from "@/components/AddCitySheet";
import { TimeColumnOverlay } from "@/components/TimeColumnOverlay";
import { DateStrip } from "@/components/DateStrip";
import { InstallHint } from "@/components/InstallHint";
import {
  cityDateNumber,
  dateNumberDiffDays,
  homeTzMidnightMs,
} from "@/lib/tz";

const HOURS_WINDOW = 168;      // 7 days of hour cells
const START_OFFSET = -24;      // window starts 24h before now
const COL_WIDTH = 52;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const BAR_TOTAL_WIDTH = HOURS_WINDOW * COL_WIDTH;
const HAPTIC_MIN_INTERVAL_MS = 150;

type ViewMode = "bars" | "list";

export default function AppPage() {
  const { cities, homeId, hydrated, addCity, removeCity, makeHome } =
    useCities();
  const [realNow, setRealNow] = useState<Date>(() => new Date());
  const [dayOffset, setDayOffset] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("bars");
  const dateInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const initialScrolledRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const lastHapticColRef = useRef(-999);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartScrollLeftRef = useRef<number>(0);
  const lastHapticTimeRef = useRef<number>(0);
  const haptic = useHaptic();

  // Refresh on every minute boundary so city clocks never lag the wall
  // clock by more than a few ms.
  useEffect(() => {
    let timeoutId: number;
    const tick = () => {
      setRealNow(new Date());
      const msUntilNextMinute = MINUTE_MS - (Date.now() % MINUTE_MS);
      timeoutId = window.setTimeout(tick, msUntilNextMinute);
    };
    const msUntilNextMinute = MINUTE_MS - (Date.now() % MINUTE_MS);
    timeoutId = window.setTimeout(tick, msUntilNextMinute);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const homeTz = useMemo(() => {
    const home = cities.find((c) => c.id === homeId) ?? cities[0];
    return home?.timezone ?? "UTC";
  }, [cities, homeId]);

  const existingIds = useMemo(
    () => new Set(cities.map((c) => c.id)),
    [cities]
  );

  // Window base: whole-hour floor of now, then START_OFFSET hours back.
  const baseMs = useMemo(() => {
    const t = realNow.getTime();
    return t - (t % HOUR_MS) + START_OFFSET * HOUR_MS;
  }, [realNow]);

  // Selected hour range comes straight from activeIdx (column index) plus
  // the bar's baseMs — the same absolute instant in every city.
  const selectedRange = useMemo(() => {
    if (activeIdx == null) return null;
    const fromMs = baseMs + activeIdx * HOUR_MS;
    return { fromMs, toMs: fromMs + HOUR_MS };
  }, [activeIdx, baseMs]);

  // Scroll the bar so a specific home-local day is near the viewport center.
  const scrollToDayOffset = useCallback(
    (offset: number, smooth: boolean) => {
      const el = scrollRef.current;
      if (!el) return;
      const targetMs = homeTzMidnightMs(homeTz, realNow) + offset * 24 * HOUR_MS;
      const targetColIdx = (targetMs - baseMs) / HOUR_MS;
      // Put that day's 09:00 near the left edge of the viewport — most of a
      // working day is visible without scrolling.
      const targetX =
        Math.max(0, (targetColIdx + 9) * COL_WIDTH - el.clientWidth / 2);
      isProgrammaticScrollRef.current = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { isProgrammaticScrollRef.current = false; });
      });
      el.scrollTo({
        left: Math.min(targetX, BAR_TOTAL_WIDTH - el.clientWidth),
        behavior: smooth ? "smooth" : "auto",
      });
    },
    [baseMs, homeTz, realNow]
  );

  // Place the scroll near "now" when bars first mount so the user doesn't
  // land on yesterday's column 0. Reset the flag when leaving bars mode so
  // re-entering bars always scrolls to now.
  useEffect(() => {
    if (viewMode !== "bars") {
      initialScrolledRef.current = false;
      return;
    }
    if (initialScrolledRef.current) return;
    if (!hydrated || cities.length === 0) return;
    const el = scrollRef.current;
    if (!el) return;
    initialScrolledRef.current = true;
    isProgrammaticScrollRef.current = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { isProgrammaticScrollRef.current = false; });
    });
    const nowColIdx = Math.floor((realNow.getTime() - baseMs) / HOUR_MS);
    const targetX = Math.max(
      0,
      nowColIdx * COL_WIDTH - el.clientWidth / 2 + COL_WIDTH / 2
    );
    el.scrollLeft = Math.min(targetX, BAR_TOTAL_WIDTH - el.clientWidth);
  }, [viewMode, hydrated, cities.length, realNow, baseMs]);

  // As the user scrolls the bar, infer which home-local day is centered in
  // the viewport and reflect it in the date strip.
  const todayDateNumber = useMemo(
    () => cityDateNumber(homeTz, realNow),
    [homeTz, realNow]
  );
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const centerX = el.scrollLeft + el.clientWidth / 2;
      const centerColIdx = Math.max(
        0,
        Math.min(HOURS_WINDOW - 1, Math.round(centerX / COL_WIDTH))
      );

      // Tick haptic on every column crossing — roulette / dial feel.
      // Android: navigator.vibrate() works from scroll events.
      // iOS: touchmove handler below fires haptic instead (user-gesture context).
      if (!isProgrammaticScrollRef.current && centerColIdx !== lastHapticColRef.current) {
        haptic(8);
        lastHapticColRef.current = centerColIdx;
      }

      const centerMs = baseMs + centerColIdx * HOUR_MS;
      const centerDate = cityDateNumber(homeTz, new Date(centerMs));
      const offset = dateNumberDiffDays(centerDate, todayDateNumber);
      setDayOffset((cur) => (cur === offset ? cur : offset));
    },
    [baseMs, homeTz, todayDateNumber, haptic]
  );

  // Capture touch start position so touchmove can compute a reliable estimated
  // scroll position. iOS does NOT update el.scrollLeft synchronously during
  // touchmove — the browser defers it until after the gesture ends — so reading
  // scrollLeft in touchmove always returns the pre-gesture value.
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length !== 1) {
        // Multi-touch (pinch/zoom) — invalidate snapshot so touchmove bails.
        touchStartXRef.current = null;
        return;
      }
      touchStartXRef.current = e.touches[0].clientX;
      touchStartScrollLeftRef.current = e.currentTarget.scrollLeft;
    },
    []
  );

  // System cancelled gesture (incoming call, Control Center, etc.) — reset.
  const handleTouchCancel = useCallback(() => {
    touchStartXRef.current = null;
    touchStartScrollLeftRef.current = 0;
  }, []);

  // iOS requires haptic to be called from within a user-gesture handler.
  // Estimate scroll position via clientX delta — works synchronously on iOS
  // unlike el.scrollLeft which is deferred. lastHapticColRef is shared with
  // handleScroll so whichever fires first wins; the other skips — no double-fire.
  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (isProgrammaticScrollRef.current) return;
      if (e.touches.length !== 1) return;
      if (touchStartXRef.current === null) return;

      const el = e.currentTarget;
      const touchDelta = touchStartXRef.current - e.touches[0].clientX;
      const maxScrollLeft = HOURS_WINDOW * COL_WIDTH - el.clientWidth;
      const estimatedScrollLeft = Math.max(
        0,
        Math.min(maxScrollLeft, touchStartScrollLeftRef.current + touchDelta)
      );
      const centerX = estimatedScrollLeft + el.clientWidth / 2;
      const centerColIdx = Math.max(
        0,
        Math.min(HOURS_WINDOW - 1, Math.round(centerX / COL_WIDTH))
      );
      if (centerColIdx !== lastHapticColRef.current) {
        const now = Date.now();
        if (now - lastHapticTimeRef.current >= HAPTIC_MIN_INTERVAL_MS) {
          haptic(8);
          lastHapticTimeRef.current = now;
        }
        lastHapticColRef.current = centerColIdx;
      }
    },
    [haptic]
  );

  const changeDay = useCallback(
    (offset: number) => {
      setActiveIdx(null);
      scrollToDayOffset(offset, true);
    },
    [scrollToDayOffset]
  );

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === "function") {
        el.showPicker();
        return;
      }
    } catch {
      /* fall through to click */
    }
    el.click();
    el.focus();
  };

  const onPickDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) return;
    // Parse date parts directly to avoid browser-TZ interpretation of the
    // date string. Compute the offset relative to today in the home timezone.
    const [py, pmo, pd] = value.split("-").map(Number);
    const pickedDateNumber = py * 10000 + pmo * 100 + pd;
    const offset = dateNumberDiffDays(pickedDateNumber, todayDateNumber);
    changeDay(offset);
  };

  const toggleViewMode = () =>
    setViewMode((v) => (v === "bars" ? "list" : "bars"));

  return (
    <div className="app-shell min-h-dvh bg-white text-[var(--foreground)] flex flex-col">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[var(--border)]">
        <div className="px-3 h-11 flex items-center">
          <button
            type="button"
            onClick={openDatePicker}
            aria-label="Jump to date"
            className="flex-none w-8 h-8 rounded-full text-slate-500 hover:bg-slate-100 flex items-center justify-center"
          >
            <CalendarDays size={18} strokeWidth={1.8} />
          </button>
          <div className="flex-1 flex items-baseline justify-center gap-1.5">
            <span className="text-[16px] font-semibold tracking-tight text-slate-900 leading-none">
              Cucaracha
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400 leading-none">
              Time Zones
            </span>
          </div>
          <div className="flex-none flex items-center">
            <button
              type="button"
              onClick={toggleViewMode}
              aria-label={
                viewMode === "bars"
                  ? "Switch to list view"
                  : "Switch to bar view"
              }
              aria-pressed={viewMode === "list"}
              className="w-8 h-8 rounded-full text-slate-500 hover:bg-slate-100 flex items-center justify-center"
            >
              {viewMode === "bars" ? (
                <List size={18} strokeWidth={1.8} />
              ) : (
                <LayoutList size={18} strokeWidth={1.8} />
              )}
            </button>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="w-8 h-8 rounded-full text-slate-700 hover:bg-slate-100 flex items-center justify-center"
              aria-label="Add city"
            >
              <Plus size={20} strokeWidth={2} />
            </button>
          </div>
        </div>
        {viewMode === "bars" && (
          <DateStrip
            realNow={realNow}
            homeTz={homeTz}
            dayOffset={dayOffset}
            onSelect={changeDay}
          />
        )}
        <input
          ref={dateInputRef}
          type="date"
          className="sr-only"
          tabIndex={-1}
          onChange={onPickDate}
        />
      </header>

      <InstallHint />

      <main className="flex-1">
        {!hydrated ? null : cities.length === 0 ? (
          <EmptyState onAdd={() => setAddOpen(true)} />
        ) : viewMode === "list" ? (
          <div>
            {cities.map((city) => (
              <CityRow
                key={city.id}
                city={city}
                isHome={city.id === homeId}
                homeTz={homeTz}
                now={realNow}
                referenceNow={realNow}
                startOffsetHours={START_OFFSET}
                hours={HOURS_WINDOW}
                colWidth={COL_WIDTH}
                compact
                selectedRange={null}
                activeIdx={null}
                onCellTap={() => {}}
                onMakeHome={() => makeHome(city.id)}
              />
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchCancel={handleTouchCancel}
            className="overflow-x-auto overflow-y-hidden no-scrollbar snap-hours"
          >
            <div className="relative" style={{ width: BAR_TOTAL_WIDTH }}>
              {cities.map((city) => (
                <CityRow
                  key={city.id}
                  city={city}
                  isHome={city.id === homeId}
                  homeTz={homeTz}
                  now={realNow}
                  referenceNow={realNow}
                  startOffsetHours={START_OFFSET}
                  hours={HOURS_WINDOW}
                  colWidth={COL_WIDTH}
                  compact={false}
                  selectedRange={selectedRange}
                  activeIdx={activeIdx}
                  onCellTap={(i) =>
                    setActiveIdx((cur) => (cur === i ? null : i))
                  }
                  onMakeHome={() => makeHome(city.id)}
                />
              ))}
              <TimeColumnOverlay
                activeIdx={activeIdx}
                colWidth={COL_WIDTH}
              />
            </div>
          </div>
        )}
      </main>

      <AddCitySheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        cities={cities}
        homeId={homeId}
        onPick={(c) => addCity(c)}
        onRemove={(id) => removeCity(id)}
        onMakeHome={(id) => makeHome(id)}
        existingIds={existingIds}
      />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="text-[15px] text-slate-500 mb-4">
        No cities yet. Add one to get started.
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-[var(--accent)] text-white text-[14px] font-medium hover:brightness-95"
      >
        <Plus size={16} /> Add city
      </button>
    </div>
  );
}

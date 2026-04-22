"use client";

import { Home } from "lucide-react";
import type { CityEntry } from "@/lib/tz";
import {
  cityClock,
  cityRange,
  cityTzAbbr,
  dateDeltaDays,
  offsetFromHomeLabel,
} from "@/lib/tz";
import { cn } from "@/lib/cn";
import { landmarkSlugFor } from "@/lib/theme";
import { TimeBar } from "./TimeBar";

type SelectedRange = { fromMs: number; toMs: number } | null;

type Props = {
  city: CityEntry;
  isHome: boolean;
  homeTz: string;
  now: Date;
  referenceNow: Date;
  startOffsetHours: number;
  hours: number;
  colWidth: number;
  compact: boolean;
  selectedRange: SelectedRange;
  activeIdx: number | null;
  onCellTap: (idx: number) => void;
  onMakeHome: () => void;
};

export function CityRow({
  city,
  isHome,
  homeTz,
  now,
  referenceNow,
  startOffsetHours,
  hours,
  colWidth,
  compact,
  selectedRange,
  activeIdx,
  onCellTap,
  onMakeHome,
}: Props) {
  const abbr = cityTzAbbr(city.timezone, now);
  const offsetLabel = isHome ? "" : offsetFromHomeLabel(homeTz, city.timezone, now);

  const rightText = selectedRange
    ? cityRange(city.timezone, selectedRange.fromMs, selectedRange.toMs)
    : null;
  const localClock = cityClock(city.timezone, now);

  const referenceMs = selectedRange ? selectedRange.fromMs : now.getTime();
  const dayDelta = isHome
    ? 0
    : dateDeltaDays(homeTz, city.timezone, new Date(referenceMs));
  const dayLabel =
    dayDelta === 1 ? "NEXT DAY" : dayDelta === -1 ? "DAY BEFORE" : "";
  const landmarkSlug = landmarkSlugFor(city);

  return (
    <div
      style={{
        width: compact ? "100%" : hours * colWidth,
        backdropFilter: "var(--row-backdrop)",
        WebkitBackdropFilter: "var(--row-backdrop)",
      }}
      className={cn(
        "group relative tz-row",
        isHome ? "bg-[var(--row-home-bg)]" : "bg-[var(--row-bg)]",
        compact && "border-b border-[var(--border)]"
      )}
    >
      <div
        className={cn(
          "tz-row-header sticky left-0 z-10 flex items-center gap-2 px-4 h-9",
          isHome ? "bg-[var(--row-home-bg)]" : "bg-[var(--row-bg)]"
        )}
        style={{
          width: "100vw",
          backdropFilter: "var(--row-backdrop)",
          WebkitBackdropFilter: "var(--row-backdrop)",
        }}
      >
        <button
          type="button"
          onClick={onMakeHome}
          aria-label={isHome ? "Home city" : "Make this home"}
          className="tz-home-btn flex-none w-7 h-7 -ml-1 rounded-md flex items-center justify-center"
        >
          {isHome ? (
            <Home
              size={15}
              strokeWidth={2}
              fill="currentColor"
              className="text-amber-600"
            />
          ) : offsetLabel ? (
            <span className="text-[11px] font-semibold tabular-nums text-slate-400">
              {offsetLabel}
            </span>
          ) : (
            <Home size={15} strokeWidth={1.8} className="text-slate-300" />
          )}
        </button>

        {landmarkSlug && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/landmarks/${landmarkSlug}.png`}
            alt=""
            aria-hidden
            className="tz-landmark flex-none"
          />
        )}

        <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
          <h3 className="tz-city-name truncate text-[17px] font-semibold tracking-tight text-slate-900 leading-none">
            {city.city}
          </h3>
          {abbr && (
            <span className="tz-city-abbr flex-none text-[9px] font-medium uppercase tracking-[0.08em] text-slate-400 relative -top-[4px]">
              {abbr}
            </span>
          )}
        </div>

        <div className="flex-none flex items-center gap-1.5 whitespace-nowrap">
          {dayLabel && (
            <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-red-500 leading-none">
              {dayLabel}
            </span>
          )}
          {rightText ? (
            <span className="tz-clock text-[15px] font-medium tabular-nums tracking-tight leading-none text-[var(--selection)]">
              {rightText}
            </span>
          ) : (
            <span className="tz-clock text-[17px] font-medium tabular-nums tracking-tight leading-none text-slate-900">
              {localClock.time}
              <span className="tz-clock-ampm ml-0.5 text-[11px] font-normal text-slate-400">
                {localClock.ampm}
              </span>
            </span>
          )}
        </div>
      </div>

      {compact ? null : (
        <TimeBar
          timezone={city.timezone}
          referenceNow={referenceNow}
          startOffsetHours={startOffsetHours}
          hours={hours}
          colWidth={colWidth}
          activeIdx={activeIdx}
          onCellTap={onCellTap}
        />
      )}
    </div>
  );
}

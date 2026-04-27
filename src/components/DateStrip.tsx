"use client";

import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/cn";
import { cityDateNumber } from "@/lib/tz";

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type Props = {
  realNow: Date;
  homeTz: string;
  dayOffset: number;
  onSelect: (offset: number) => void;
  back?: number;
  forward?: number;
};

export function DateStrip({
  realNow,
  homeTz,
  dayOffset,
  onSelect,
  back = 1,
  forward = 13,
}: Props) {
  // Rebuild only when the home-tz calendar date rolls over, not on every minute tick.
  // cityDateNumber returns a YYYYMMDD integer in the home timezone.
  const todayKey = cityDateNumber(homeTz, realNow);
  const days = useMemo(() => {
    // Extract y/m/d from the home-tz today key (YYYYMMDD integer).
    const ty = Math.floor(todayKey / 10000);
    const tm = Math.floor((todayKey % 10000) / 100);
    const td = todayKey % 100;
    return Array.from({ length: back + forward + 1 }, (_, i) => {
      const offset = i - back;
      // Represent each home-tz date as a UTC Date so getUTC* methods give
      // the correct home-tz year/month/day regardless of browser timezone.
      const date = new Date(Date.UTC(ty, tm - 1, td + offset));
      return { offset, date };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recomputed per day
  }, [todayKey, back, forward]);

  const selectedRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [dayOffset]);

  return (
    <div className="overflow-x-auto no-scrollbar border-b border-[var(--border)] bg-white">
      <div className="flex items-center gap-0 px-2 py-2 min-w-max">
        {days.map((d) => {
          const isToday = d.offset === 0;
          const isSelected = d.offset === dayOffset;
          const day = d.date.getUTCDay();
          const dom = d.date.getUTCDate();
          const month = d.date.getUTCMonth();
          // Show the month next to the number only on today, the currently
          // selected day, or when the month rolls over — keeps the strip
          // readable during month boundaries.
          const showMonth = isToday || isSelected || dom === 1;
          return (
            <button
              key={d.offset}
              ref={isSelected ? selectedRef : undefined}
              type="button"
              onClick={() => onSelect(d.offset)}
              aria-pressed={isSelected}
              aria-label={`${MONTH_LABELS[month]} ${dom}`}
              className={cn(
                "flex-none w-[60px] h-11 flex flex-col items-center justify-center rounded-lg",
                "active:bg-slate-100 active:scale-[0.97] transition-transform duration-75",
                "[touch-action:manipulation] [-webkit-tap-highlight-color:transparent]",
                isSelected
                  ? "border border-slate-900"
                  : "border border-transparent hover:bg-slate-50"
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-[0.1em] leading-none",
                  isToday ? "text-[var(--accent)]" : "text-slate-400"
                )}
              >
                {DAY_LABELS[day]}
              </span>
              <span
                className={cn(
                  "mt-[3px] text-[13px] font-semibold tabular-nums tracking-tight leading-none",
                  isToday ? "text-[var(--accent)]" : "text-slate-900"
                )}
              >
                {showMonth ? `${MONTH_LABELS[month]} ${dom}` : dom}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

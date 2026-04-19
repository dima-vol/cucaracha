"use client";

import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/cn";

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type Props = {
  realNow: Date;
  dayOffset: number;
  onSelect: (offset: number) => void;
  /** Days back from today to render. */
  back?: number;
  /** Days forward from today to render. */
  forward?: number;
};

export function DateStrip({
  realNow,
  dayOffset,
  onSelect,
  back = 1,
  forward = 13,
}: Props) {
  // Rebuild the strip only when the calendar date changes, not on every
  // minute tick — `realNow` updates frequently but the strip is identical
  // for the whole day.
  const todayKey =
    realNow.getFullYear() * 10000 +
    (realNow.getMonth() + 1) * 100 +
    realNow.getDate();
  const days = useMemo(
    () =>
      Array.from({ length: back + forward + 1 }, (_, i) => {
        const offset = i - back;
        const d = new Date(realNow);
        d.setDate(d.getDate() + offset);
        return { offset, date: d };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuilt per calendar day
    [todayKey, back, forward]
  );

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
      <div className="flex items-center gap-0.5 px-2 py-1.5 min-w-max">
        {days.map((d) => {
          const isToday = d.offset === 0;
          const isSelected = d.offset === dayOffset;
          const day = d.date.getDay();
          const dom = d.date.getDate();
          const month = d.date.getMonth();
          const showMonth = isToday || isSelected || dom === 1;
          return (
            <button
              key={d.offset}
              ref={isSelected ? selectedRef : undefined}
              type="button"
              onClick={() => onSelect(d.offset)}
              aria-pressed={isSelected}
              className={cn(
                "flex-none flex flex-col items-center justify-center px-2.5 py-1.5 rounded-md",
                isSelected
                  ? "border border-slate-900"
                  : "border border-transparent hover:bg-slate-50"
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-medium uppercase tracking-wider leading-tight",
                  isToday ? "text-[var(--accent)]" : "text-slate-400"
                )}
              >
                {DAY_LABELS[day]}
              </span>
              <span
                className={cn(
                  "text-[14px] font-semibold tabular-nums leading-tight mt-0.5",
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

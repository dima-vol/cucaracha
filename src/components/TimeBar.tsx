"use client";

import { cn } from "@/lib/cn";
import { cityParts, hourTier } from "@/lib/tz";

const HOUR_MS = 60 * 60 * 1000;

type Props = {
  timezone: string;
  /** Reference instant (usually "now") */
  now: Date;
  /** Start of the visible window, as an offset in hours from `now` */
  startOffsetHours: number;
  /** Number of hour columns rendered */
  hours: number;
  /** Column width in px */
  colWidth?: number;
  /** Active/selected column index, highlights a column across all rows */
  activeIdx?: number | null;
  onCellTap?: (idx: number) => void;
};

export function TimeBar({
  timezone,
  now,
  startOffsetHours,
  hours,
  colWidth = 52,
  activeIdx = null,
  onCellTap,
}: Props) {
  // Align the reference start to a whole hour so every column lands on :00.
  const baseMs =
    now.getTime() + startOffsetHours * HOUR_MS - (now.getTime() % HOUR_MS);

  const cells = Array.from({ length: hours }, (_, i) => {
    const t = new Date(baseMs + i * HOUR_MS);
    const parts = cityParts(timezone, t);
    return { t, parts };
  });

  const nowIdx = Math.floor((now.getTime() - baseMs) / HOUR_MS);

  return (
    <div
      className="flex items-stretch select-none"
      style={{ width: hours * colWidth, height: 52 }}
    >
      {cells.map((c, i) => {
        const tier = hourTier(c.parts.hour24);
        const isMidnight = c.parts.hour24 === 0;
        const isNow = i === nowIdx;
        const isActive = activeIdx === i;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onCellTap?.(i)}
            data-now={isNow || undefined}
            data-active={isActive || undefined}
            className={cn(
              "tz-cell relative flex-none flex flex-col items-center justify-center transition-colors",
              tier === "day" && "bg-[var(--day-tint)]",
              tier === "evening" && "bg-[var(--evening-tint)]",
              tier === "night" && "bg-[var(--night-tint)]"
            )}
            style={{ width: colWidth }}
            aria-label={`${c.parts.hour12}${c.parts.ampm} ${c.parts.month} ${c.parts.day}`}
          >
            {isMidnight ? (
              <span className="flex flex-col items-center leading-tight">
                <span className="text-[10px] font-medium uppercase tracking-wide text-white/95 bg-[var(--daychip)] rounded px-1.5 py-0.5">
                  {c.parts.month.toUpperCase()}
                </span>
                <span className="text-[11px] font-semibold mt-0.5 text-white/95">
                  {c.parts.day}
                </span>
              </span>
            ) : (
              <span className="flex flex-col items-center leading-tight">
                <span
                  className={cn(
                    "text-[15px] font-medium tabular-nums",
                    tier === "night" ? "text-white" : "text-slate-700"
                  )}
                >
                  {c.parts.hour12}
                </span>
                <span
                  className={cn(
                    "text-[9px] uppercase tracking-wide",
                    tier === "night" ? "text-white/80" : "text-slate-500"
                  )}
                >
                  {c.parts.ampm}
                </span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

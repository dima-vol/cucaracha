"use client";

import { cn } from "@/lib/cn";
import { cityParts, hourTier } from "@/lib/tz";

const HOUR_MS = 60 * 60 * 1000;

type Props = {
  timezone: string;
  now: Date;
  startOffsetHours: number;
  hours: number;
  colWidth?: number;
  onCellTap?: (idx: number) => void;
};

export function TimeBar({
  timezone,
  now,
  startOffsetHours,
  hours,
  colWidth = 52,
  onCellTap,
}: Props) {
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
      style={{ width: hours * colWidth, height: 48 }}
    >
      {cells.map((c, i) => {
        const tier = hourTier(c.parts.hour24);
        const isMidnight = c.parts.hour24 === 0;
        const isNow = i === nowIdx;
        const night = tier === "night";
        return (
          <button
            key={i}
            type="button"
            onClick={() => onCellTap?.(i)}
            className={cn(
              "tz-cell relative flex-none flex items-center justify-center",
              tier === "day" && "bg-[var(--day-tint)]",
              tier === "evening" && "bg-[var(--evening-tint)]",
              night && "bg-[var(--night-tint)]"
            )}
            style={{ width: colWidth }}
            aria-label={`${c.parts.hour12}${c.parts.ampm} ${c.parts.month} ${c.parts.day}`}
            aria-current={isNow ? "time" : undefined}
          >
            {isMidnight ? (
              <span className="flex flex-col items-center justify-center leading-none rounded-[3px] bg-[var(--daychip)] px-1.5 py-1">
                <span className="text-[8px] font-semibold uppercase tracking-[0.08em] text-white/95">
                  {c.parts.month}
                </span>
                <span className="mt-0.5 text-[11px] font-semibold tabular-nums text-white leading-none">
                  {c.parts.day}
                </span>
              </span>
            ) : (
              <span className="flex flex-col items-center justify-center leading-none">
                <span
                  className={cn(
                    "text-[14px] font-medium tabular-nums leading-none",
                    night ? "text-white" : "text-slate-700"
                  )}
                >
                  {c.parts.hour12}
                </span>
                <span
                  className={cn(
                    "mt-[3px] text-[9px] font-medium uppercase tracking-[0.04em] leading-none",
                    night ? "text-white/85" : "text-slate-400"
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

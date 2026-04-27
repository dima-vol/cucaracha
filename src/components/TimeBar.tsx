"use client";

import { cn } from "@/lib/cn";
import { cityParts, hourTier } from "@/lib/tz";
import { hapticPulse } from "@/hooks/useHaptic";

const HOUR_MS = 60 * 60 * 1000;

type Props = {
  timezone: string;
  referenceNow: Date;
  startOffsetHours: number;
  hours: number;
  colWidth?: number;
  activeIdx?: number | null;
  onCellTap?: (idx: number) => void;
};

export function TimeBar({
  timezone,
  referenceNow,
  startOffsetHours,
  hours,
  colWidth = 52,
  activeIdx = null,
  onCellTap,
}: Props) {
  const refMs = referenceNow.getTime();
  const baseMs = refMs + startOffsetHours * HOUR_MS - (refMs % HOUR_MS);

  // Column of the current real hour (the one that contains `referenceNow`).
  // Used to mark the "now" cell typographically — accent colour + semibold
  // — so the present hour reads as a property of the cell itself, not as
  // an overlay layer.
  const nowIdx = Math.floor((refMs - baseMs) / HOUR_MS);

  const cells = Array.from({ length: hours }, (_, i) => {
    const t = new Date(baseMs + i * HOUR_MS);
    const parts = cityParts(timezone, t);
    return { t, parts };
  });

  return (
    <div
      className={cn(
        "flex items-stretch select-none",
        activeIdx != null && "tz-bar-selecting"
      )}
      style={{ width: hours * colWidth, height: 48 }}
    >
      {cells.map((c, i) => {
        const tier = hourTier(c.parts.hour24);
        const isMidnight = c.parts.hour24 === 0;
        const isActive = activeIdx === i;
        const isNow = i === nowIdx;
        const night = tier === "night";
        return (
          <button
            key={i}
            type="button"
            onClick={() => { hapticPulse(8); onCellTap?.(i); }}
            className={cn(
              "tz-cell relative flex-none flex items-center justify-center",
              night && "bg-[var(--night-tint)]",
              isActive && "tz-cell-active"
            )}
            style={{ width: colWidth }}
            aria-label={`${c.parts.hour12}${c.parts.ampm} ${c.parts.month} ${c.parts.day}`}
            aria-current={isNow ? "time" : undefined}
          >
            {isMidnight ? (
              <span
                className={cn(
                  "flex flex-col items-center justify-center leading-none rounded-[3px] px-1.5 py-1",
                  isNow ? "bg-[var(--accent)]" : "bg-[var(--daychip)]"
                )}
              >
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
                    "tabular-nums leading-none",
                    isNow
                      ? "text-[14px] font-semibold text-[var(--accent)]"
                      : "text-[14px] font-medium text-slate-700"
                  )}
                >
                  {c.parts.hour12}
                </span>
                <span
                  className={cn(
                    "mt-[3px] text-[9px] font-medium uppercase tracking-[0.04em] leading-none",
                    isNow ? "text-[var(--accent)]" : "text-slate-400"
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

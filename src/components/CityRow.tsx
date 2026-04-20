"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Home, X } from "lucide-react";
import type { CityEntry } from "@/lib/tz";
import {
  cityClock,
  cityRange,
  cityTzAbbr,
  dateDeltaDays,
  offsetFromHomeLabel,
} from "@/lib/tz";
import { cn } from "@/lib/cn";
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
  onRemove: () => void;
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
  onRemove,
  onMakeHome,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: city.id });

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

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
        // Each row is at least the bar's full width so its child header can
        // sit sticky-pinned to the scroll container's visible left edge.
        width: compact ? "100%" : hours * colWidth,
      }}
      className={cn(
        "group relative",
        isHome ? "bg-[var(--home-tint)]" : "bg-white",
        compact && "border-b border-[var(--border)]"
      )}
    >
      {/* The header is pinned to the visible left edge of the shared
          horizontal scroll container, so as bars scroll the city name and
          the time/range stay readable at all times. z-10 keeps the
          opaque header above the selection overlay below it. */}
      <div
        className={cn(
          "sticky left-0 z-10 flex items-center gap-2 px-4 h-9",
          isHome ? "bg-[var(--home-tint)]" : "bg-white"
        )}
        style={{ width: "100vw" }}
      >
        <button
          type="button"
          onClick={onMakeHome}
          aria-label={isHome ? "Home city" : "Make this home"}
          className="flex-none w-7 h-7 -ml-1 rounded-md flex items-center justify-center"
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

        <h3 className="flex-1 min-w-0 truncate text-[17px] font-semibold tracking-tight text-slate-900 leading-none">
          {city.city}
          {abbr && (
            <sup className="ml-1 text-[9px] font-medium uppercase tracking-[0.08em] text-slate-400 align-super relative -top-[1px]">
              {abbr}
            </sup>
          )}
        </h3>

        <div className="flex-none flex items-center gap-1.5 whitespace-nowrap">
          {dayLabel && (
            <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-red-500 leading-none">
              {dayLabel}
            </span>
          )}
          {rightText ? (
            <span className="text-[15px] font-medium tabular-nums tracking-tight leading-none text-[var(--selection)]">
              {rightText}
            </span>
          ) : (
            <span className="text-[17px] font-medium tabular-nums tracking-tight leading-none text-slate-900">
              {localClock.time}
              <span className="ml-0.5 text-[11px] font-normal text-slate-400">
                {localClock.ampm}
              </span>
            </span>
          )}
        </div>

        <div className="flex-none flex items-center gap-0.5 -mr-1">
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove city"
            className="w-7 h-7 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center"
          >
            <X size={14} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="Drag to reorder"
            className="w-7 h-7 rounded-md text-slate-300 hover:text-slate-500 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={16} strokeWidth={1.8} />
          </button>
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

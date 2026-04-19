"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Home, X } from "lucide-react";
import type { CityEntry } from "@/lib/tz";
import { cityClock, cityTzAbbr, offsetFromHomeLabel } from "@/lib/tz";
import { cn } from "@/lib/cn";
import { TimeBar } from "./TimeBar";
import { useScrollSync } from "./ScrollSync";

type Props = {
  city: CityEntry;
  isHome: boolean;
  homeTz: string;
  /** Wall-clock "now" used to pick out the current hour cell. */
  now: Date;
  /** Reference instant for the bar window — differs from `now` when the
   *  user has paged forward or back in the date strip. */
  referenceNow: Date;
  startOffsetHours: number;
  hours: number;
  colWidth: number;
  compact: boolean;
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
  activeIdx,
  onCellTap,
  onRemove,
  onMakeHome,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: city.id });

  const setBarRef = useScrollSync();

  // Use `referenceNow` as the visible window anchor but `now` as the
  // wall-clock reference for the city's own clock display.
  const clock = cityClock(city.timezone, now);
  const abbr = cityTzAbbr(city.timezone, now);
  const offsetLabel = isHome ? "" : offsetFromHomeLabel(homeTz, city.timezone, now);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
      }}
      className={cn(
        "group",
        compact && "border-b border-[var(--border)]"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-4 h-9",
          isHome ? "bg-[var(--home-tint)]" : "bg-white"
        )}
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

        <div className="flex-none text-[17px] font-medium tabular-nums tracking-tight text-slate-900 leading-none whitespace-nowrap">
          {clock.time}
          <span className="ml-0.5 text-[11px] font-normal text-slate-400">
            {clock.ampm}
          </span>
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
        <div
          ref={setBarRef}
          className="overflow-x-auto no-scrollbar snap-hours"
        >
          <TimeBar
            timezone={city.timezone}
            now={now}
            referenceNow={referenceNow}
            startOffsetHours={startOffsetHours}
            hours={hours}
            colWidth={colWidth}
            activeIdx={activeIdx}
            onCellTap={onCellTap}
          />
        </div>
      )}
    </div>
  );
}

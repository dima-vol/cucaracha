"use client";

import { useRef } from "react";
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
  now: Date;
  startOffsetHours: number;
  hours: number;
  colWidth: number;
  /** If true, hide the hour bar and show only the summary row. */
  compact: boolean;
  onCellTap: (idx: number) => void;
  onRemove: () => void;
  onMakeHome: () => void;
};

export function CityRow({
  city,
  isHome,
  homeTz,
  now,
  startOffsetHours,
  hours,
  colWidth,
  compact,
  onCellTap,
  onRemove,
  onMakeHome,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: city.id });

  const barScrollRef = useRef<HTMLDivElement | null>(null);
  useScrollSync(barScrollRef);

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
      className={cn("group", isHome && "bg-[var(--home-tint)]")}
    >
      <div className="flex items-center gap-3 px-4 pt-1.5 pb-1">
        <button
          type="button"
          onClick={onMakeHome}
          aria-label={isHome ? "Home city" : "Make home"}
          className={cn(
            "flex-none w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700",
            isHome && "text-amber-600 hover:text-amber-700"
          )}
        >
          {isHome ? (
            <Home size={15} strokeWidth={2.4} fill="currentColor" />
          ) : offsetLabel ? (
            <span className="text-[11px] font-semibold tabular-nums">
              {offsetLabel}
            </span>
          ) : (
            <Home size={15} strokeWidth={2} />
          )}
        </button>

        <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
          <span className="text-[18px] font-medium tracking-tight truncate">
            {city.city}
          </span>
          {abbr && (
            <span className="flex-none text-[10px] font-medium uppercase tracking-wider text-slate-400 relative -top-1.5">
              {abbr}
            </span>
          )}
        </div>

        <div className="flex-none flex items-center gap-1.5">
          <div className="text-right">
            <div className="text-[19px] font-medium tabular-nums leading-none whitespace-nowrap">
              {clock.time}
              <span className="text-[11px] text-slate-400 ml-0.5">
                {clock.ampm}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove city"
            className="w-6 h-6 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
          >
            <X size={14} />
          </button>
          <button
            type="button"
            aria-label="Reorder"
            className="w-6 h-6 rounded-md text-slate-300 hover:text-slate-700 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={16} />
          </button>
        </div>
      </div>

      {compact ? (
        <div className="h-1" />
      ) : (
        <div ref={barScrollRef} className="overflow-x-auto no-scrollbar">
          <TimeBar
            timezone={city.timezone}
            now={now}
            startOffsetHours={startOffsetHours}
            hours={hours}
            colWidth={colWidth}
            onCellTap={onCellTap}
          />
        </div>
      )}
    </div>
  );
}

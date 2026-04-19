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
  startOffsetHours,
  hours,
  colWidth,
  activeIdx,
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
      className={cn(
        "group border-b border-[var(--border)] px-4 py-3",
        isHome && "bg-[var(--home-tint)]"
      )}
    >
      <div className="flex items-center gap-3">
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
            <Home size={16} strokeWidth={2.4} fill="currentColor" />
          ) : offsetLabel ? (
            <span className="text-[11px] font-semibold tabular-nums">
              {offsetLabel}
            </span>
          ) : (
            <Home size={16} strokeWidth={2} />
          )}
        </button>

        <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
          <span className="text-[20px] font-medium tracking-tight truncate">
            {city.city}
          </span>
          {abbr && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 relative -top-2">
              {abbr}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-[22px] font-medium tabular-nums leading-none">
              {clock.time}
              <span className="text-[12px] text-slate-400 ml-0.5">
                {clock.ampm}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove city"
            className="w-7 h-7 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
          <button
            type="button"
            aria-label="Reorder"
            className="w-7 h-7 rounded-md text-slate-300 hover:text-slate-700 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={18} />
          </button>
        </div>
      </div>

      <div
        ref={barScrollRef}
        className="mt-2 overflow-x-auto no-scrollbar -mx-1 px-1"
      >
        <TimeBar
          timezone={city.timezone}
          now={now}
          startOffsetHours={startOffsetHours}
          hours={hours}
          colWidth={colWidth}
          activeIdx={activeIdx}
          onCellTap={onCellTap}
        />
      </div>
    </div>
  );
}

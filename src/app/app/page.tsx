"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CalendarDays, List, LayoutList, Plus } from "lucide-react";
import { useCities } from "@/hooks/useCities";
import { CityRow } from "@/components/CityRow";
import { AddCitySheet } from "@/components/AddCitySheet";
import { TimeColumnOverlay } from "@/components/TimeColumnOverlay";
import { DateStrip } from "@/components/DateStrip";
import { InstallHint } from "@/components/InstallHint";

const HOURS_WINDOW = 36;
const START_OFFSET = -6;
const COL_WIDTH = 52;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MINUTE_MS = 60 * 1000;
const BAR_TOTAL_WIDTH = HOURS_WINDOW * COL_WIDTH;

type ViewMode = "bars" | "list";

export default function AppPage() {
  const { cities, homeId, hydrated, addCity, removeCity, makeHome, reorder } =
    useCities();
  const [realNow, setRealNow] = useState<Date>(() => new Date());
  const [dayOffset, setDayOffset] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("bars");
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Refresh on every minute boundary so city clocks never lag the wall
  // clock by more than a few ms.
  useEffect(() => {
    let timeoutId: number;
    const tick = () => {
      setRealNow(new Date());
      const msUntilNextMinute = MINUTE_MS - (Date.now() % MINUTE_MS);
      timeoutId = window.setTimeout(tick, msUntilNextMinute);
    };
    const msUntilNextMinute = MINUTE_MS - (Date.now() % MINUTE_MS);
    timeoutId = window.setTimeout(tick, msUntilNextMinute);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const homeTz = useMemo(() => {
    const home = cities.find((c) => c.id === homeId) ?? cities[0];
    return home?.timezone ?? "UTC";
  }, [cities, homeId]);

  const existingIds = useMemo(
    () => new Set(cities.map((c) => c.id)),
    [cities]
  );

  const referenceNow = useMemo(() => {
    if (dayOffset === 0) return realNow;
    return new Date(realNow.getTime() + dayOffset * DAY_MS);
  }, [realNow, dayOffset]);

  const selectedRange = useMemo(() => {
    if (activeIdx == null) return null;
    const t = referenceNow.getTime();
    const baseMs = t + START_OFFSET * HOUR_MS - (t % HOUR_MS);
    const fromMs = baseMs + activeIdx * HOUR_MS;
    return { fromMs, toMs: fromMs + HOUR_MS };
  }, [activeIdx, referenceNow]);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    reorder(String(active.id), String(over.id));
  };

  const changeDay = (offset: number) => {
    setDayOffset(offset);
    setActiveIdx(null);
  };

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === "function") {
        el.showPicker();
        return;
      }
    } catch {
      /* fall through to click */
    }
    el.click();
    el.focus();
  };

  const onPickDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) return;
    const picked = new Date(value + "T00:00:00");
    const today = new Date(realNow);
    today.setHours(0, 0, 0, 0);
    const offset = Math.round((picked.getTime() - today.getTime()) / DAY_MS);
    changeDay(offset);
  };

  const toggleViewMode = () =>
    setViewMode((v) => (v === "bars" ? "list" : "bars"));

  return (
    <div className="app-shell min-h-dvh bg-white text-[var(--foreground)] flex flex-col">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[var(--border)]">
        <div className="px-3 h-11 flex items-center">
          <button
            type="button"
            onClick={openDatePicker}
            aria-label="Jump to date"
            className="flex-none w-8 h-8 rounded-full text-slate-500 hover:bg-slate-100 flex items-center justify-center"
          >
            <CalendarDays size={18} strokeWidth={1.8} />
          </button>
          <div className="flex-1 flex items-baseline justify-center gap-1.5">
            <span className="text-[16px] font-semibold tracking-tight text-slate-900 leading-none">
              Cucaracha
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400 leading-none">
              Time Zones
            </span>
          </div>
          <div className="flex-none flex items-center">
            <button
              type="button"
              onClick={toggleViewMode}
              aria-label={
                viewMode === "bars"
                  ? "Switch to list view"
                  : "Switch to bar view"
              }
              aria-pressed={viewMode === "list"}
              className="w-8 h-8 rounded-full text-slate-500 hover:bg-slate-100 flex items-center justify-center"
            >
              {viewMode === "bars" ? (
                <List size={18} strokeWidth={1.8} />
              ) : (
                <LayoutList size={18} strokeWidth={1.8} />
              )}
            </button>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="w-8 h-8 rounded-full text-slate-700 hover:bg-slate-100 flex items-center justify-center"
              aria-label="Add city"
            >
              <Plus size={20} strokeWidth={2} />
            </button>
          </div>
        </div>
        {viewMode === "bars" && (
          <DateStrip
            realNow={realNow}
            dayOffset={dayOffset}
            onSelect={changeDay}
          />
        )}
        <input
          ref={dateInputRef}
          type="date"
          className="sr-only"
          tabIndex={-1}
          onChange={onPickDate}
        />
      </header>

      <InstallHint />

      <main className="flex-1">
        {!hydrated ? null : cities.length === 0 ? (
          <EmptyState onAdd={() => setAddOpen(true)} />
        ) : viewMode === "list" ? (
          // Compact list — no horizontal scroll, no bars.
          <div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={cities.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {cities.map((city) => (
                  <CityRow
                    key={city.id}
                    city={city}
                    isHome={city.id === homeId}
                    homeTz={homeTz}
                    now={realNow}
                    referenceNow={referenceNow}
                    startOffsetHours={START_OFFSET}
                    hours={HOURS_WINDOW}
                    colWidth={COL_WIDTH}
                    compact
                    selectedRange={null}
                    activeIdx={null}
                    onCellTap={() => {}}
                    onMakeHome={() => makeHome(city.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        ) : (
          // Bars view — ONE shared horizontal scroll holds every row's bar
          // so they're physically the same scrolling element. No JS sync,
          // no possible drift between rows.
          <div className="overflow-x-auto overflow-y-hidden no-scrollbar snap-hours">
            <div
              className="relative"
              style={{ width: BAR_TOTAL_WIDTH }}
            >
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={cities.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {cities.map((city) => (
                    <CityRow
                      key={city.id}
                      city={city}
                      isHome={city.id === homeId}
                      homeTz={homeTz}
                      now={realNow}
                      referenceNow={referenceNow}
                      startOffsetHours={START_OFFSET}
                      hours={HOURS_WINDOW}
                      colWidth={COL_WIDTH}
                      compact={false}
                      selectedRange={selectedRange}
                      activeIdx={activeIdx}
                      onCellTap={(i) =>
                        setActiveIdx((cur) => (cur === i ? null : i))
                      }
                      onMakeHome={() => makeHome(city.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              <TimeColumnOverlay activeIdx={activeIdx} colWidth={COL_WIDTH} />
            </div>
          </div>
        )}
      </main>

      <AddCitySheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        cities={cities}
        homeId={homeId}
        onPick={(c) => addCity(c)}
        onRemove={(id) => removeCity(id)}
        onMakeHome={(id) => makeHome(id)}
        existingIds={existingIds}
      />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="text-[15px] text-slate-500 mb-4">
        No cities yet. Add one to get started.
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-[var(--accent)] text-white text-[14px] font-medium hover:brightness-95"
      >
        <Plus size={16} /> Add city
      </button>
    </div>
  );
}

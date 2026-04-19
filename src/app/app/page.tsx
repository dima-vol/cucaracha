"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Plus } from "lucide-react";
import { useCities } from "@/hooks/useCities";
import { CityRow } from "@/components/CityRow";
import { AddCitySheet } from "@/components/AddCitySheet";
import { ScrollSyncProvider } from "@/components/ScrollSync";
import { InstallHint } from "@/components/InstallHint";

const HOURS_WINDOW = 36;          // total hour columns rendered
const START_OFFSET = -6;          // start 6h before "now"
const COL_WIDTH = 52;

export default function AppPage() {
  const { cities, homeId, hydrated, addCity, removeCity, makeHome, reorder } =
    useCities();
  const [now, setNow] = useState<Date>(() => new Date());
  const [addOpen, setAddOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const homeTz = useMemo(() => {
    const home = cities.find((c) => c.id === homeId) ?? cities[0];
    return home?.timezone ?? "UTC";
  }, [cities, homeId]);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    reorder(String(active.id), String(over.id));
  };

  return (
    <ScrollSyncProvider>
      <div className="app-shell min-h-dvh bg-white text-[var(--foreground)] flex flex-col">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[var(--border)] px-4 h-14 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-[17px] font-semibold tracking-tight">
              Cucaracha
            </span>
            <span className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
              Time Zones
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="w-9 h-9 rounded-full border border-[var(--border)] hover:bg-slate-50 flex items-center justify-center"
            aria-label="Add city"
          >
            <Plus size={18} strokeWidth={2.2} />
          </button>
        </header>

        <InstallHint />

        <main className="flex-1">
          {!hydrated ? null : cities.length === 0 ? (
            <EmptyState onAdd={() => setAddOpen(true)} />
          ) : (
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
                    now={now}
                    startOffsetHours={START_OFFSET}
                    hours={HOURS_WINDOW}
                    colWidth={COL_WIDTH}
                    activeIdx={activeIdx}
                    onCellTap={(i) =>
                      setActiveIdx((cur) => (cur === i ? null : i))
                    }
                    onRemove={() => removeCity(city.id)}
                    onMakeHome={() => makeHome(city.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </main>

        <AddCitySheet
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onPick={(c) => addCity(c)}
        />
      </div>
    </ScrollSyncProvider>
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

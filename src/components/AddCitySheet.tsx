"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Home, MapPin, Search, Trash2, X } from "lucide-react";
import { searchCities, cityKey, type RawCity } from "@/lib/cities";
import { cityTzAbbr, type CityEntry } from "@/lib/tz";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  cities: CityEntry[];
  homeId: string | null;
  onPick: (c: CityEntry) => void;
  onRemove: (id: string) => void;
  onMakeHome: (id: string) => void;
  existingIds: Set<string>;
};

export function AddCitySheet(props: Props) {
  if (!props.open) return null;
  return <SheetInner {...props} />;
}

function SheetInner({
  onClose,
  cities,
  homeId,
  onPick,
  onRemove,
  onMakeHome,
  existingIds,
}: Props) {
  const [q, setQ] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results = useMemo(() => (q ? searchCities(q, 50) : []), [q]);
  const searching = q.trim().length > 0;

  const handlePick = (c: RawCity) => {
    const id = cityKey(c);
    if (existingIds.has(id)) {
      onClose();
      return;
    }
    onPick({
      id,
      city: c.city,
      country: c.country,
      iso2: c.iso2,
      timezone: c.timezone,
    });
    setQ("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh] sm:max-h-[80vh]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-[var(--border)]">
          <span className="text-[15px] font-semibold text-slate-900">
            Time Zones
          </span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-[var(--border)]">
          <Search size={16} className="text-slate-400 flex-none" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search city or country"
            className="flex-1 outline-none text-[16px] placeholder:text-slate-400"
          />
          {q && (
            <button
              type="button"
              aria-label="Clear"
              onClick={() => setQ("")}
              className="w-6 h-6 rounded-full text-slate-400 hover:text-slate-700 flex items-center justify-center"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="overflow-y-auto flex-1">
          {searching ? (
            results.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No cities found
              </div>
            ) : (
              <ul>
                {results.map((c) => {
                  const id = cityKey(c);
                  const added = existingIds.has(id);
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => handlePick(c)}
                        disabled={added}
                        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 border-b border-[var(--border)] last:border-b-0 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <MapPin size={16} className="text-slate-300 flex-none" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] text-slate-900 truncate">
                            {c.city}
                          </div>
                          <div className="text-[12px] text-slate-400 truncate">
                            {c.province ? `${c.province}, ` : ""}
                            {c.country}
                          </div>
                        </div>
                        {added ? (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                            <Check size={12} strokeWidth={2.5} /> Added
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 tabular-nums">
                            {c.timezone}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )
          ) : (
            <ManageList
              cities={cities}
              homeId={homeId}
              onRemove={onRemove}
              onMakeHome={onMakeHome}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ManageList({
  cities,
  homeId,
  onRemove,
  onMakeHome,
}: {
  cities: CityEntry[];
  homeId: string | null;
  onRemove: (id: string) => void;
  onMakeHome: (id: string) => void;
}) {
  if (cities.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        No cities yet. Start typing to add one.
      </div>
    );
  }
  return (
    <div>
      <div className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        Your cities
      </div>
      <ul>
        {cities.map((c) => {
          const isHome = c.id === homeId;
          const abbr = cityTzAbbr(c.timezone, new Date());
          return (
            <li
              key={c.id}
              className="px-4 py-2.5 flex items-center gap-3 border-b border-[var(--border)] last:border-b-0"
            >
              <button
                type="button"
                onClick={() => onMakeHome(c.id)}
                aria-label={isHome ? "Home city" : "Make home"}
                className={cn(
                  "flex-none w-8 h-8 rounded-full flex items-center justify-center",
                  isHome
                    ? "text-amber-600 bg-amber-50"
                    : "text-slate-300 hover:text-slate-600 hover:bg-slate-50"
                )}
              >
                <Home
                  size={15}
                  strokeWidth={isHome ? 2.4 : 1.8}
                  fill={isHome ? "currentColor" : "none"}
                />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-[15px] font-medium text-slate-900 truncate">
                    {c.city}
                  </span>
                  {abbr && (
                    <span className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                      {abbr}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {c.country}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(c.id)}
                aria-label="Remove city"
                className="flex-none w-8 h-8 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center"
              >
                <Trash2 size={15} strokeWidth={1.8} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

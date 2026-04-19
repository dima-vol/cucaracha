"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, MapPin, Search, X } from "lucide-react";
import { searchCities, cityKey, type RawCity } from "@/lib/cities";
import type { CityEntry } from "@/lib/tz";

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (c: CityEntry) => void;
  /** IDs of cities already on the list — used to mark them as "Added" in
   *  results and make the pick a no-op if re-tapped. */
  existingIds: Set<string>;
};

export function AddCitySheet({ open, onClose, onPick, existingIds }: Props) {
  if (!open) return null;
  return (
    <AddCitySheetInner
      onClose={onClose}
      onPick={onPick}
      existingIds={existingIds}
    />
  );
}

function AddCitySheetInner({
  onClose,
  onPick,
  existingIds,
}: {
  onClose: () => void;
  onPick: (c: CityEntry) => void;
  existingIds: Set<string>;
}) {
  const [q, setQ] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results = useMemo(() => searchCities(q, 50), [q]);

  const handlePick = (c: RawCity) => {
    const id = cityKey(c);
    if (existingIds.has(id)) {
      // Still close — tapping an existing entry is a "move on" gesture.
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
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[85vh] sm:max-h-[70vh]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-4 pb-3 flex items-center gap-2 border-b border-[var(--border)]">
          <Search size={18} className="text-slate-400 flex-none" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search city or country"
            className="flex-1 outline-none text-[16px] placeholder:text-slate-400"
          />
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {results.length === 0 ? (
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
                      <MapPin
                        size={16}
                        className="text-slate-300 flex-none"
                      />
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
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CityEntry } from "@/lib/tz";
import { loadState, saveState, type PersistedState } from "@/lib/storage";

const DEFAULTS: PersistedState = {
  cities: [
    {
      id: "default-sf",
      city: "San Francisco",
      country: "United States",
      iso2: "US",
      timezone: "America/Los_Angeles",
    },
    {
      id: "default-ny",
      city: "New York",
      country: "United States",
      iso2: "US",
      timezone: "America/New_York",
    },
    {
      id: "default-london",
      city: "London",
      country: "United Kingdom",
      iso2: "GB",
      timezone: "Europe/London",
    },
    {
      id: "default-tokyo",
      city: "Tokyo",
      country: "Japan",
      iso2: "JP",
      timezone: "Asia/Tokyo",
    },
  ],
  homeId: "default-sf",
};

export function useCities() {
  const [cities, setCities] = useState<CityEntry[]>([]);
  const [homeId, setHomeId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const didHydrate = useRef(false);

  useEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;
    const loaded = loadState();
    const initial = loaded ?? DEFAULTS;
    setCities(initial.cities);
    setHomeId(initial.homeId);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState({ cities, homeId });
  }, [cities, homeId, hydrated]);

  const addCity = useCallback((c: CityEntry) => {
    setCities((prev) => {
      if (prev.some((p) => p.id === c.id)) return prev;
      return [...prev, c];
    });
    setHomeId((h) => h ?? c.id);
  }, []);

  const removeCity = useCallback((id: string) => {
    setCities((prev) => {
      const next = prev.filter((c) => c.id !== id);
      return next;
    });
    setHomeId((h) => (h === id ? null : h));
  }, []);

  const makeHome = useCallback((id: string) => {
    setHomeId(id);
  }, []);

  const reorder = useCallback((fromId: string, toId: string) => {
    setCities((prev) => {
      const fromIdx = prev.findIndex((c) => c.id === fromId);
      const toIdx = prev.findIndex((c) => c.id === toId);
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }, []);

  return {
    cities,
    homeId,
    hydrated,
    addCity,
    removeCity,
    makeHome,
    reorder,
  };
}

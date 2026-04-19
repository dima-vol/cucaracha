"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

type Ctx = {
  register: (el: HTMLElement) => () => void;
};

const ScrollSyncCtx = createContext<Ctx | null>(null);

export function ScrollSyncProvider({ children }: { children: ReactNode }) {
  // A Set of scroll containers that should share a scrollLeft. The ref holds
  // a long-lived collection — we only mutate the DOM elements in it, not the
  // set identity — so React fast-refresh is happy.
  const nodesRef = useRef<Set<HTMLElement>>(new Set());
  const applyingRef = useRef(false);

  const handleScroll = useCallback((e: Event) => {
    if (applyingRef.current) return;
    const src = e.currentTarget as HTMLElement;
    const left = src.scrollLeft;
    applyingRef.current = true;
    const nodes = nodesRef.current;
    nodes.forEach((el) => {
      if (el !== src) el.scrollLeft = left;
    });
    requestAnimationFrame(() => {
      applyingRef.current = false;
    });
  }, []);

  const register = useCallback(
    (el: HTMLElement) => {
      nodesRef.current.add(el);
      el.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        el.removeEventListener("scroll", handleScroll);
        nodesRef.current.delete(el);
      };
    },
    [handleScroll]
  );

  return (
    <ScrollSyncCtx.Provider value={{ register }}>
      {children}
    </ScrollSyncCtx.Provider>
  );
}

export function useScrollSync(ref: React.RefObject<HTMLElement | null>) {
  const ctx = useContext(ScrollSyncCtx);
  useEffect(() => {
    if (!ctx || !ref.current) return;
    return ctx.register(ref.current);
  }, [ctx, ref]);
  return ctx;
}

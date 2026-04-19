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
  /** Register a scrollable bar so horizontal scroll mirrors across all bars. */
  registerScroller: (el: HTMLElement) => () => void;
  /** Register the list container that should receive the `--scroll-x` CSS
   *  variable on every scroll tick. Overlays read that var to track the bars. */
  registerContainer: (el: HTMLElement | null) => void;
};

const ScrollSyncCtx = createContext<Ctx | null>(null);

export function ScrollSyncProvider({ children }: { children: ReactNode }) {
  const nodesRef = useRef<Set<HTMLElement>>(new Set());
  const containerRef = useRef<HTMLElement | null>(null);
  const applyingRef = useRef(false);

  const broadcast = useCallback((left: number) => {
    const c = containerRef.current;
    if (c) c.style.setProperty("--scroll-x", `${left}px`);
  }, []);

  const handleScroll = useCallback(
    (e: Event) => {
      if (applyingRef.current) return;
      const src = e.currentTarget as HTMLElement;
      const left = src.scrollLeft;
      applyingRef.current = true;
      nodesRef.current.forEach((el) => {
        if (el !== src) el.scrollLeft = left;
      });
      broadcast(left);
      requestAnimationFrame(() => {
        applyingRef.current = false;
      });
    },
    [broadcast]
  );

  const registerScroller = useCallback(
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

  const registerContainer = useCallback((el: HTMLElement | null) => {
    containerRef.current = el;
    if (el) el.style.setProperty("--scroll-x", "0px");
  }, []);

  return (
    <ScrollSyncCtx.Provider value={{ registerScroller, registerContainer }}>
      {children}
    </ScrollSyncCtx.Provider>
  );
}

export function useScrollSync(ref: React.RefObject<HTMLElement | null>) {
  const ctx = useContext(ScrollSyncCtx);
  useEffect(() => {
    if (!ctx || !ref.current) return;
    return ctx.registerScroller(ref.current);
  }, [ctx, ref]);
  return ctx;
}

export function useScrollSyncContainer(
  ref: React.RefObject<HTMLElement | null>
) {
  const ctx = useContext(ScrollSyncCtx);
  useEffect(() => {
    if (!ctx) return;
    ctx.registerContainer(ref.current);
    return () => ctx.registerContainer(null);
  }, [ctx, ref]);
}

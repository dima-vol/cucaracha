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
  registerScroller: (el: HTMLElement) => () => void;
  registerContainer: (el: HTMLElement | null) => void;
};

const ScrollSyncCtx = createContext<Ctx | null>(null);

type ProviderProps = {
  children: ReactNode;
  /** If set, the scroll is debounced-snapped to the nearest multiple of
   *  this pixel value on scroll end. Feels like iOS picker wheels: free
   *  momentum, then a gentle settle onto the grid. */
  snapWidth?: number;
  /** Debounce in ms before we consider scrolling "ended". */
  snapIdleMs?: number;
};

export function ScrollSyncProvider({
  children,
  snapWidth,
  snapIdleMs = 110,
}: ProviderProps) {
  const nodesRef = useRef<Set<HTMLElement>>(new Set());
  const containerRef = useRef<HTMLElement | null>(null);
  const applyingRef = useRef(false);
  const idleTimerRef = useRef<number | null>(null);
  const lastSourceRef = useRef<HTMLElement | null>(null);

  const broadcast = useCallback((left: number) => {
    const c = containerRef.current;
    if (c) c.style.setProperty("--scroll-x", `${left}px`);
  }, []);

  const scheduleSnap = useCallback(() => {
    if (!snapWidth) return;
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      const src = lastSourceRef.current;
      if (!src || !src.isConnected) return;
      const raw = src.scrollLeft;
      const snapped = Math.round(raw / snapWidth) * snapWidth;
      if (Math.abs(snapped - raw) < 0.5) {
        applyingRef.current = true;
        nodesRef.current.forEach((el) => {
          if (el !== src) el.scrollLeft = snapped;
        });
        broadcast(snapped);
        requestAnimationFrame(() => {
          applyingRef.current = false;
        });
        return;
      }
      applyingRef.current = true;
      try {
        src.scrollTo({ left: snapped, behavior: "smooth" });
      } catch {
        src.scrollLeft = snapped;
      }
      nodesRef.current.forEach((el) => {
        if (el === src) return;
        try {
          el.scrollTo({ left: snapped, behavior: "smooth" });
        } catch {
          el.scrollLeft = snapped;
        }
      });
      broadcast(snapped);
      window.setTimeout(() => {
        applyingRef.current = false;
      }, 320);
    }, snapIdleMs);
  }, [snapWidth, snapIdleMs, broadcast]);

  const handleScroll = useCallback(
    (e: Event) => {
      if (applyingRef.current) return;
      const src = e.currentTarget as HTMLElement;
      const left = src.scrollLeft;
      lastSourceRef.current = src;
      applyingRef.current = true;
      nodesRef.current.forEach((el) => {
        if (el !== src) el.scrollLeft = left;
      });
      broadcast(left);
      requestAnimationFrame(() => {
        applyingRef.current = false;
      });
      scheduleSnap();
    },
    [broadcast, scheduleSnap]
  );

  const registerScroller = useCallback(
    (el: HTMLElement) => {
      // Idempotent: if this exact element is already registered, return the
      // existing cleanup. Guards against double-register when a consumer
      // re-fires the ref callback with the same DOM node.
      if (nodesRef.current.has(el)) {
        return () => {
          el.removeEventListener("scroll", handleScroll);
          nodesRef.current.delete(el);
        };
      }
      nodesRef.current.add(el);
      // Sync this new node's scrollLeft to the shared --scroll-x so it
      // immediately matches its siblings (e.g. when a row re-mounts after
      // a list-view toggle and the others had already scrolled).
      const c = containerRef.current;
      if (c) {
        const raw = getComputedStyle(c).getPropertyValue("--scroll-x");
        const shared = parseFloat(raw) || 0;
        if (shared && shared !== el.scrollLeft) {
          applyingRef.current = true;
          el.scrollLeft = shared;
          requestAnimationFrame(() => {
            applyingRef.current = false;
          });
        }
      }
      el.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        el.removeEventListener("scroll", handleScroll);
        nodesRef.current.delete(el);
        if (lastSourceRef.current === el) lastSourceRef.current = null;
      };
    },
    [handleScroll]
  );

  const registerContainer = useCallback((el: HTMLElement | null) => {
    containerRef.current = el;
    if (el) {
      // Preserve any existing --scroll-x if the container is re-mounting
      // in an already-scrolled state; default to 0 on a fresh mount.
      const current = getComputedStyle(el).getPropertyValue("--scroll-x");
      if (!current || current.trim() === "") {
        el.style.setProperty("--scroll-x", "0px");
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, []);

  return (
    <ScrollSyncCtx.Provider value={{ registerScroller, registerContainer }}>
      {children}
    </ScrollSyncCtx.Provider>
  );
}

/**
 * Returns a ref callback to attach to a horizontally scrollable bar. The
 * callback fires on every mount AND unmount (including re-mounts caused
 * by toggling list-view mode, drag-drop reorders, or empty-state flips),
 * so the provider always has an accurate view of the live DOM nodes. The
 * previous `useRef + useEffect` version only ran on first mount and
 * silently lost registrations across re-mounts.
 */
export function useScrollSync() {
  const ctx = useContext(ScrollSyncCtx);
  const cleanupRef = useRef<(() => void) | null>(null);
  return useCallback(
    (el: HTMLElement | null) => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      if (el && ctx) {
        cleanupRef.current = ctx.registerScroller(el);
      }
    },
    [ctx]
  );
}

/**
 * Returns a ref callback to attach to the list container — the element
 * whose `--scroll-x` CSS variable drives the TimeColumnOverlay. Same
 * rationale as useScrollSync: a callback ref guarantees we track mount
 * and unmount, even when the container is rendered conditionally (empty
 * state, etc.).
 */
export function useScrollSyncContainer() {
  const ctx = useContext(ScrollSyncCtx);
  return useCallback(
    (el: HTMLElement | null) => {
      if (ctx) ctx.registerContainer(el);
    },
    [ctx]
  );
}

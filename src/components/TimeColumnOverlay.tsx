"use client";

/**
 * Vertical column indicators that span the entire city list — one for the
 * current hour ("now") and one for any column the user has tapped on
 * ("active"). The overlay is rendered once at the list level so the lines
 * read as single continuous strokes from the first city's bar through to
 * the last, passing over every per-city header.
 *
 * Horizontal tracking is done via a CSS variable (`--scroll-x`) that the
 * ScrollSyncProvider updates on every scroll tick — this keeps the overlay
 * synced with the bars without any React re-renders.
 */
type Props = {
  nowIdx: number | null;
  activeIdx: number | null;
  colWidth: number;
  hours: number;
};

export function TimeColumnOverlay({
  nowIdx,
  activeIdx,
  colWidth,
  hours,
}: Props) {
  const totalWidth = hours * colWidth;

  const showNow = nowIdx != null && nowIdx >= 0 && nowIdx < hours;
  const showActive = activeIdx != null && activeIdx >= 0 && activeIdx < hours;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="absolute inset-y-0 left-0"
        style={{
          width: totalWidth,
          transform:
            "translate3d(calc(-1 * var(--scroll-x, 0px)), 0, 0)",
          willChange: "transform",
        }}
      >
        {showNow && (
          <span
            className="absolute inset-y-0 border-l-[2px] border-r-[2px] border-[var(--accent)]/80"
            style={{ left: nowIdx * colWidth, width: colWidth }}
          />
        )}
        {showActive && (
          <span
            className="absolute inset-y-0 border-l-[2px] border-r-[2px] border-slate-900"
            style={{ left: activeIdx * colWidth, width: colWidth }}
          />
        )}
      </div>
    </div>
  );
}

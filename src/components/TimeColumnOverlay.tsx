"use client";

/**
 * Vertical indicators that span the entire city list:
 *   - "now": a thin rectangle outline around the current hour cell.
 *     Snapped to the hour grid and drawn in a subtle neutral tone —
 *     meant to be a reference, not a CTA.
 *   - "active": a bolder rectangle outline around the column the user
 *     tapped. Drawn on top of "now" so the selection always reads first.
 *
 * Both live as a single absolutely-positioned layer at the list level so the
 * line is unbroken through every per-city header. Horizontal tracking is
 * driven by the `--scroll-x` CSS variable that ScrollSyncProvider keeps in
 * sync with the bars.
 */
type Props = {
  /** Index of the current real hour within the bar (0..hours-1), or null
   *  if real-now is outside the visible window. */
  nowIdx: number | null;
  /** Index of a tapped column (0..hours-1), or null. */
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
  const showActive =
    activeIdx != null && activeIdx >= 0 && activeIdx < hours;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="absolute inset-y-0 left-0"
        style={{
          width: totalWidth,
          transform: "translate3d(calc(-1 * var(--scroll-x, 0px)), 0, 0)",
          willChange: "transform",
        }}
      >
        {showNow && (
          <span
            className="absolute inset-y-0 border border-slate-500/60 rounded-[3px]"
            style={{ left: nowIdx * colWidth, width: colWidth }}
          />
        )}
        {showActive && (
          <span
            className="absolute inset-y-0 border border-slate-900 rounded-[3px] bg-slate-900/[0.04]"
            style={{ left: activeIdx * colWidth, width: colWidth }}
          />
        )}
      </div>
    </div>
  );
}

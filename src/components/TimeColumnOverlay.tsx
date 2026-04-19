"use client";

/**
 * Vertical indicators that span the entire city list:
 *   - "now": a single 1-px hairline placed with minute precision (not snapped
 *     to an hour cell). Subtle neutral colour — meant to be a hint, not a
 *     CTA.
 *   - "active": a 4-sided rectangle outline around the column the user
 *     tapped. Drawn on top of "now" so the selection always reads first.
 *
 * Both live as a single absolutely-positioned layer at the list level so the
 * line is unbroken through every per-city header. Horizontal tracking is
 * driven by the `--scroll-x` CSS variable that ScrollSyncProvider keeps in
 * sync with the bars.
 */
type Props = {
  /** Pixel offset of the current real moment from the start of the bar.
   *  Sub-cell precision (i.e. accounts for minutes within the hour). */
  nowOffsetPx: number | null;
  /** Index of a tapped column (0..hours-1), or null. */
  activeIdx: number | null;
  colWidth: number;
  hours: number;
};

export function TimeColumnOverlay({
  nowOffsetPx,
  activeIdx,
  colWidth,
  hours,
}: Props) {
  const totalWidth = hours * colWidth;
  const showNow =
    nowOffsetPx != null && nowOffsetPx >= 0 && nowOffsetPx <= totalWidth;
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
            className="absolute inset-y-0 bg-slate-900/35"
            style={{ left: nowOffsetPx - 0.5, width: 1 }}
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

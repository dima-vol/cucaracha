"use client";

/**
 * Vertical indicators that span the entire city list:
 *   - "now": a subtle 1-px rectangle around the current hour column.
 *   - "active": a crisper 1.5-px rectangle around the column the user
 *     tapped. Drawn on top of "now".
 *
 * Both live as a single absolutely-positioned layer at the list level so
 * the strokes are unbroken through every per-city header. Horizontal
 * tracking is driven by the `--scroll-x` CSS variable that
 * ScrollSyncProvider keeps in sync with the bars.
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
            className="absolute inset-y-0 border border-slate-500/55 rounded-[4px]"
            style={{ left: nowIdx * colWidth, width: colWidth }}
          />
        )}
        {showActive && (
          <span
            className="absolute inset-y-0 border-[1.5px] border-slate-900 rounded-[4px] bg-slate-900/[0.035]"
            style={{ left: activeIdx * colWidth, width: colWidth }}
          />
        )}
      </div>
    </div>
  );
}

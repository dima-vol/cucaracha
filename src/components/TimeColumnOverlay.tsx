"use client";

/**
 * Absolute vertical indicators drawn inside the shared horizontal scroll
 * container so they track the bars natively — no JS sync.
 *   - "now": a soft 1-px hairline marking the current real hour.
 *   - "active": a 2-px blue rectangle around the tap-selected column.
 *
 * Sticky row headers (z-10) sit above this overlay (z-default) and clip
 * it visually, so the rectangle reads as one tall pill that only shows
 * across the bar strips.
 */
type Props = {
  activeIdx: number | null;
  nowIdx: number | null;
  colWidth: number;
};

export function TimeColumnOverlay({ activeIdx, nowIdx, colWidth }: Props) {
  return (
    <>
      {nowIdx != null && (
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 bottom-0"
          style={{
            left: (nowIdx + 0.5) * colWidth - 0.5,
            width: 1,
            background: "rgba(15, 23, 42, 0.2)",
          }}
        />
      )}
      {activeIdx != null && (
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 bottom-0"
          style={{ left: activeIdx * colWidth, width: colWidth }}
        >
          <div
            className="absolute inset-0 border-2 rounded-[6px]"
            style={{
              borderColor: "var(--selection)",
              background: "var(--selection-soft)",
            }}
          />
        </div>
      )}
    </>
  );
}

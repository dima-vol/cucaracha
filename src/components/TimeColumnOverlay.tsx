"use client";

/**
 * Tap-selected hour column, drawn as a single absolute rectangle inside
 * the shared horizontal scroll container so it tracks the bars natively.
 * Sticky row headers (z-10) sit above this overlay and clip it visually,
 * so the rectangle reads as one tall pill that only shows across the bar
 * strips.
 */
type Props = {
  activeIdx: number | null;
  colWidth: number;
};

export function TimeColumnOverlay({ activeIdx, colWidth }: Props) {
  if (activeIdx == null) return null;
  return (
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
  );
}

"use client";

/**
 * One absolutely-positioned vertical rectangle marking the user-tapped
 * column. Lives INSIDE the shared horizontal scroll container so it
 * tracks the bars by being part of the same scroll plane — no JS sync,
 * zero lag, zero ripple.
 *
 * Vertical extent spans the entire list. Per-row sticky headers (z-10)
 * sit above this overlay (z-default) and visually clip it, so the
 * rectangle reads as a single tall pill that's only visible across the
 * bar areas — same striped silhouette as the reference.
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
      style={{
        left: activeIdx * colWidth,
        width: colWidth,
      }}
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

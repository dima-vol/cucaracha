"use client";

import { useEffect, useState } from "react";

type Props = {
  /** Path to an image/video asset, or null to hide. */
  src: string | null;
};

/**
 * Full-bleed ambient wallpaper for the app, Telegram-style: static,
 * cover-fit, softly blurred, with a white wash so the UI stays readable.
 * Fades in only once the asset has actually loaded so the user never
 * sees a flash of bare overlay.
 */
export function CityBackground({ src }: Props) {
  // Keep the asset mounted briefly after `src` goes null so the opacity
  // transition can complete before we unmount the <img>.
  const [mountedSrc, setMountedSrc] = useState<string | null>(src);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (src) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMountedSrc(src);
      setLoaded(false);
      return;
    }
    const t = window.setTimeout(() => {
      setMountedSrc(null);
      setLoaded(false);
    }, 600);
    return () => window.clearTimeout(t);
  }, [src]);

  const visible = src != null && loaded && mountedSrc === src;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-[500ms] ease-out"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {mountedSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={mountedSrc}
          src={mountedSrc}
          alt=""
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(false)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
    </div>
  );
}

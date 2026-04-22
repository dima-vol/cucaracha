"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** Path to the asset, or null to hide. Extension decides rendering:
   *  `.mp4`/`.webm` → looping silent video; anything else → static image
   *  with a slow Ken-Burns pan to give the blurred colour field some life. */
  src: string | null;
};

function isVideo(src: string): boolean {
  return /\.(mp4|webm|mov)$/i.test(src);
}

/**
 * Full-bleed ambient background for the app. Heavily blurred and
 * desaturated under an 85% white wash — reads as an atmospheric colour
 * layer, not a postcard. Crossfades in once the asset is actually
 * playable/loaded so the user never sees a flash of plain overlay.
 */
export function CityBackground({ src }: Props) {
  // Asset currently mounted in the DOM. Lags `src` so that a fade-out
  // transition can complete before we yank the <video>/<img> element.
  const [mountedSrc, setMountedSrc] = useState<string | null>(src);
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  // Derived: show once the asset is loaded AND the caller still wants it.
  const visible = src != null && loaded && mountedSrc === src;
  const showVideo = mountedSrc != null && isVideo(mountedSrc);
  const showImage = mountedSrc != null && !isVideo(mountedSrc);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-[600ms] ease-out"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {showVideo && (
        <video
          ref={videoRef}
          key={mountedSrc}
          src={mountedSrc!}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => setLoaded(true)}
          onError={() => setLoaded(false)}
          className="absolute inset-0 w-full h-full object-cover scale-110"
          style={{ filter: "blur(60px) saturate(0.75)" }}
        />
      )}
      {showImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={mountedSrc}
          src={mountedSrc!}
          alt=""
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(false)}
          className="absolute inset-0 w-full h-full object-cover bg-kenburns"
          style={{ filter: "blur(60px) saturate(0.75)" }}
        />
      )}
      <div className="absolute inset-0 bg-white/85" />
    </div>
  );
}

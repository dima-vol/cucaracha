"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** Absolute or /-prefixed path to a looping MP4/WebM, or null to hide. */
  src: string | null;
};

/**
 * Full-bleed ambient background for the app. Plays a silent looping video
 * heavily blurred under a white wash, so it reads as a colour/mood layer
 * rather than a postcard. Crossfades in/out when `src` changes.
 */
export function CityBackground({ src }: Props) {
  const [mountedSrc, setMountedSrc] = useState<string | null>(src);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (src) {
      setMountedSrc(src);
      setLoaded(false);
    } else {
      setVisible(false);
      const t = window.setTimeout(() => {
        setMountedSrc(null);
        setLoaded(false);
      }, 500);
      return () => window.clearTimeout(t);
    }
  }, [src]);

  // Only fade in once the video is actually playable — avoids a flash of
  // white-overlay-over-nothing that reads as "something about to load".
  useEffect(() => {
    if (loaded && src) setVisible(true);
  }, [loaded, src]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-[600ms] ease-out"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {mountedSrc && (
        <video
          ref={videoRef}
          key={mountedSrc}
          src={mountedSrc}
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
      <div className="absolute inset-0 bg-white/85" />
    </div>
  );
}

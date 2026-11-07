/* eslint-disable @next/next/no-img-element -- recursos ya optimizados en WebP */
import s from "./ui.module.css";

export function Isotipo({ size = 96, floating = false }: { size?: number; floating?: boolean }) {
  return (
    <img
      src="/brand/isotipo.webp"
      alt=""
      width={size}
      height={Math.round((size * 329) / 360)}
      className={[s.isotipo, floating && s.floating].filter(Boolean).join(" ")}
      style={{ width: size }}
    />
  );
}

export function Wordmark({ height = 14 }: { height?: number }) {
  return (
    <img
      src="/brand/wordmark.webp"
      alt="ELEVATE"
      width={Math.round((height * 600) / 61)}
      height={height}
      style={{ height, width: "auto" }}
    />
  );
}

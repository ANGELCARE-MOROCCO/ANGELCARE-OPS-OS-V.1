"use client";
import { ATLAS_SIZE, ICON_RECTS } from "./artwork";
import s from "./reference.module.css";
export function Art({
  index,
  className = "",
}: {
  index: number;
  className?: string;
}) {
  const [x, y, ww, hh] = ICON_RECTS[Math.max(0, Math.min(35, index))],
    [w, h] = ATLAS_SIZE,
    side = Math.max(ww, hh);
  return (
    <span aria-hidden="true" className={`${s.artIcon} ${className}`}>
      <span
        className={s.artInner}
        style={{
          width: `${(ww / side) * 100}%`,
          height: `${(hh / side) * 100}%`,
          backgroundSize: `${(w / ww) * 100}% ${(h / hh) * 100}%`,
          backgroundPosition: `${(x / (w - ww)) * 100}% ${(y / (h - hh)) * 100}%`,
        }}
      />
    </span>
  );
}

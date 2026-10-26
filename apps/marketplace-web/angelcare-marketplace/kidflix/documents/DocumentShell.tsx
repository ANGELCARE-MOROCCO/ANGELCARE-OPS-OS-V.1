"use client";
import type { CSSProperties } from "react";
import { I } from "../Icons";
import { ART } from "./model";
import s from "./documents.module.css";
// Native authoring consumers retain their existing context names; there is one shared provider.
export {
  WorldSettingsProvider as DocumentsSettingsProvider,
  useWorldSettings as useDocumentsSettings,
} from "../world/Settings";
export function ArtIcon({
  index,
  nav = false,
  className = "",
  size,
}: {
  index: number;
  nav?: boolean;
  className?: string;
  size?: number;
}) {
  if (index === 30 && !nav)
    return (
      <span className={s.targetIcon} aria-hidden="true">
        <I name="ArrowUpRight" size={22} />
      </span>
    );
  const columns = nav ? 4 : 6,
    rows = nav ? 4 : 5;
  return (
    <span
      aria-hidden="true"
      className={`${s.artIcon} ${className}`}
      style={
        {
          backgroundImage: `url(${ART}${nav ? "navigation" : "icons"}.png)`,
          backgroundSize: `${columns * 100}% ${rows * 100}%`,
          backgroundPosition: `${((index % columns) * 100) / (columns - 1)}% ${(Math.floor(index / columns) * 100) / (rows - 1)}%`,
          ...(size ? { width: size, height: size } : {}),
        } as CSSProperties
      }
    />
  );
}

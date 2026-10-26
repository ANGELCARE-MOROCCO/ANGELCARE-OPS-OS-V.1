"use client";
import {Artwork} from "../imagery/Runtime";
import { ART } from "./content";
import s from "./home.module.css";
export function Atlas({
  slot,
  sequence,
  sheet,
  cell,
  columns = 4,
  rows = 4,
  className = "",
  label,
}: {
  slot?:string;
  sequence?:boolean;
  sheet: string;
  cell: number;
  columns?: number;
  rows?: number;
  className?: string;
  label?: string;
}) {
  // The generated artwork contains nonuniform paper panels. Sample each measured
  // rectangle directly, so adjacent covers never leak into another topic card.
  const bounds =
    sheet === "topics-01"
      ? {
          x: [0, 423, 783, 1154, 1448],
          y: [0, 275, 551, 814, 1086],
          width: 1448,
          height: 1086,
        }
      : sheet === "collections-01"
        ? {
            x: [0, 362, 724, 1086, 1448],
            y: [0, 279, 543, 803, 1086],
            width: 1448,
            height: 1086,
          }
        : null;
  const column = cell % columns,
    row = Math.floor(cell / columns);
  const x = bounds ? bounds.x[column] + 2 : 0;
  const y = bounds ? bounds.y[row] + 2 : 0;
  const width = bounds ? bounds.x[column + 1] - bounds.x[column] - 4 : 1;
  const height = bounds ? bounds.y[row + 1] - bounds.y[row] - 4 : 1;
  return (
    <Artwork kind="sprite" slot={slot} sequence={sequence}
      className={`${s.atlas} ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={!label}
      style={{
        backgroundImage: `url(${ART}${sheet}.png)`,
        backgroundSize: bounds
          ? `${(bounds.width / width) * 100}% ${(bounds.height / height) * 100}%`
          : `${columns * 100}% ${rows * 100}%`,
        backgroundPosition: bounds
          ? `${(x / (bounds.width - width)) * 100}% ${(y / (bounds.height - height)) * 100}%`
          : `${((cell % columns) * 100) / (columns - 1)}% ${(Math.floor(cell / columns) * 100) / (rows - 1)}%`,
      }}
    />
  );
}

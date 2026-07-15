"use client";

import type { AmbassadorOperationalStatus, AmbassadorRiskLevel, PayoutRiskStatus } from "@/lib/market-os/ambassadors/phase4-types";

type BadgeTone = "green" | "yellow" | "red" | "blue" | "slate";

function getClassName(tone: BadgeTone): string {
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1";
  const tones: Record<BadgeTone, string> = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    yellow: "bg-amber-50 text-amber-700 ring-amber-200",
    red: "bg-rose-50 text-rose-700 ring-rose-200",
    blue: "bg-sky-50 text-sky-700 ring-sky-200",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  return `${base} ${tones[tone]}`;
}

export function AmbassadorRiskBadge({ risk }: { risk: AmbassadorRiskLevel }) {
  const tone: BadgeTone = risk === "low" ? "green" : risk === "medium" ? "yellow" : "red";
  return <span className={getClassName(tone)}>{risk.toUpperCase()}</span>;
}

export function AmbassadorStatusBadge({ status }: { status: AmbassadorOperationalStatus }) {
  const tone: BadgeTone =
    status === "active" ? "green" : status === "watchlist" ? "yellow" : status === "paused" ? "blue" : "red";
  return <span className={getClassName(tone)}>{status.replace("_", " ").toUpperCase()}</span>;
}

export function PayoutRiskBadge({ status }: { status: PayoutRiskStatus }) {
  const tone: BadgeTone = status === "clear" ? "green" : status === "review" ? "yellow" : "red";
  return <span className={getClassName(tone)}>{status.toUpperCase()}</span>;
}

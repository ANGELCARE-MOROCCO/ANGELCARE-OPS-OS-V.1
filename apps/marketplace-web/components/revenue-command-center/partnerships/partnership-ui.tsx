"use client";

import type { ReactNode } from "react";
import {
  Activity,
  BarChart3,
  Building2,
  CalendarDays,
  FileText,
  GraduationCap,
  Hotel,
  Network,
  ShieldCheck,
  Stethoscope,
  UsersRound,
} from "lucide-react";

export function money(value: number) {
  if (value >= 1000000) return `MAD ${(value / 1000000).toFixed(2)}M`;
  return `MAD ${Number(value || 0).toLocaleString("en-US")}`;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[30px] border border-white/15 bg-[linear-gradient(145deg,rgba(18,30,54,.98),rgba(8,16,31,.99))] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,.25)] ${className}`}>
      {children}
    </section>
  );
}

export function Kpi({ icon: Icon, label, value, delta }: { icon: any; label: string; value: string | number; delta: string }) {
  return (
    <Card className="min-h-[118px]">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/30">
          <Icon className="h-6 w-6 text-white" />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white">{label}</p>
          <p className="mt-1 text-2xl font-black text-white">{value}</p>
          <p className="mt-2 text-xs font-black text-emerald-200">↑ {delta}</p>
        </div>
      </div>
    </Card>
  );
}

export function PartnerIcon({ type }: { type: string }) {
  const Icon = type.includes("Preschool")
    ? GraduationCap
    : type.includes("Maternity")
      ? Stethoscope
      : type.includes("Ortho")
        ? Activity
        : type.includes("Hotel")
          ? Hotel
          : type.includes("Corporate")
            ? Building2
            : Network;

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.08]">
      <Icon className="h-6 w-6 text-white" />
    </div>
  );
}

export const icons = {
  UsersRound,
  ShieldCheck,
  BarChart3,
  CalendarDays,
  FileText,
  Activity,
};

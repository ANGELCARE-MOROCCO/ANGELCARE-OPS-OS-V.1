"use client";

import type { AmbassadorRegionalSignal } from "@/lib/market-os/ambassadors/phase4-types";
import { AmbassadorRiskBadge } from "./ambassador-status-badge";

type Props = {
  signals: AmbassadorRegionalSignal[];
};

export function RegionalExecutionMonitor({ signals }: Props) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Regional execution</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">Coverage, conversion and territory gap monitoring</h2>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {signals.map((signal) => (
          <article key={signal.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-950">{signal.city}</h3>
                <p className="text-xs font-semibold text-slate-500">{signal.region}</p>
              </div>
              <AmbassadorRiskBadge risk={signal.riskLevel} />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Mini label="Coverage" value={`${signal.coverageScore}%`} />
              <Mini label="Active" value={signal.activeAmbassadors.toString()} />
              <Mini label="Missions" value={signal.openMissions.toString()} />
            </div>

            <p className="mt-4 rounded-2xl bg-white p-3 text-sm text-slate-600 ring-1 ring-slate-200">{signal.opportunity}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 font-black text-slate-950">{value}</p>
    </div>
  );
}

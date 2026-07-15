"use client";

import { useMemo, useState } from "react";
import type { AmbassadorHealthRecord } from "@/lib/market-os/ambassadors/phase4-types";
import { formatMad, summarizeHealth } from "@/lib/market-os/ambassadors/phase4-intelligence";
import { AmbassadorRiskBadge, AmbassadorStatusBadge } from "./ambassador-status-badge";

type Props = {
  records: AmbassadorHealthRecord[];
};

export function AmbassadorHealthEngine({ records }: Props) {
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  const summary = useMemo(() => summarizeHealth(records), [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesQuery = `${record.ambassadorName} ${record.city} ${record.region}`
        .toLowerCase()
        .includes(query.toLowerCase());

      const matchesRisk = riskFilter === "all" || record.riskLevel === riskFilter;
      return matchesQuery && matchesRisk;
    });
  }, [query, records, riskFilter]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-9500">Ambassador health engine</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Operational health, risk and next action control</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Monitor execution quality, engagement, compliance, overdue missions and revenue impact from one control layer.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <Kpi label="Avg health" value={`${summary.averageHealth}%`} />
          <Kpi label="Active" value={summary.active.toString()} />
          <Kpi label="Watchlist" value={summary.watchlist.toString()} />
          <Kpi label="Revenue" value={formatMad(summary.revenueMad)} />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row">
        <input
          className="min-h-11 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none ring-slate-300 transition focus:bg-white focus:ring-2"
          placeholder="Search ambassador, city or region..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <select
          className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none ring-slate-300 transition focus:bg-white focus:ring-2"
          value={riskFilter}
          onChange={(event) => setRiskFilter(event.target.value)}
        >
          <option value="all">All risks</option>
          <option value="low">Low risk</option>
          <option value="medium">Medium risk</option>
          <option value="high">High risk</option>
          <option value="critical">Critical risk</option>
        </select>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
        <div className="grid grid-cols-12 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-9500">
          <span className="col-span-3">Ambassador</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2">Health</span>
          <span className="col-span-2">Revenue</span>
          <span className="col-span-3">Recommended action</span>
        </div>

        {filteredRecords.map((record) => (
          <div key={record.id} className="grid grid-cols-12 items-center gap-2 border-t border-slate-100 px-4 py-4 text-sm">
            <div className="col-span-3">
              <p className="font-bold text-slate-950">{record.ambassadorName}</p>
              <p className="text-xs text-slate-9500">{record.city} · {record.tier}</p>
            </div>
            <div className="col-span-2">
              <AmbassadorStatusBadge status={record.status} />
            </div>
            <div className="col-span-2">
              <div className="flex items-center gap-3">
                <span className="font-black text-slate-950">{record.healthScore}%</span>
                <AmbassadorRiskBadge risk={record.riskLevel} />
              </div>
            </div>
            <div className="col-span-2 font-semibold text-slate-800">{formatMad(record.revenueMad)}</div>
            <div className="col-span-3 text-slate-600">{record.recommendedAction}</div>
          </div>
        ))}

        {filteredRecords.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-9500">No ambassador matches the current filters.</div>
        ) : null}
      </div>
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold text-slate-9500">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

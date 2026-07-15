"use client";

import type { AmbassadorComplianceEscalation, AmbassadorPayoutRisk } from "@/lib/market-os/ambassadors/phase4-types";
import { formatMad, getPayoutDecision } from "@/lib/market-os/ambassadors/phase4-intelligence";
import { AmbassadorRiskBadge, PayoutRiskBadge } from "./ambassador-status-badge";

type Props = {
  escalations: AmbassadorComplianceEscalation[];
  payoutRisks: AmbassadorPayoutRisk[];
};

export function ComplianceAndPayoutControl({ escalations, payoutRisks }: Props) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-9500">Compliance control</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">Escalations and resolution plans</h2>

        <div className="mt-5 space-y-3">
          {escalations.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-950">{item.ambassadorName}</h3>
                  <p className="text-xs font-semibold uppercase text-slate-9500">{item.category} · {item.status}</p>
                </div>
                <AmbassadorRiskBadge risk={item.severity} />
              </div>
              <p className="mt-3 text-sm text-slate-600">{item.resolutionPlan}</p>
              <p className="mt-3 text-xs font-semibold text-slate-9500">Owner: {item.owner} · Opened: {item.openedAt}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-9500">Payout risk monitoring</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">Approve, review or block payouts safely</h2>

        <div className="mt-5 space-y-3">
          {payoutRisks.map((risk) => (
            <article key={risk.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-950">{risk.ambassadorName}</h3>
                  <p className="text-xs font-semibold text-slate-9500">{formatMad(risk.payoutMad)} · proof {risk.proofStatus}</p>
                </div>
                <PayoutRiskBadge status={risk.status} />
              </div>
              <p className="mt-3 text-sm text-slate-600">{risk.reason}</p>
              <div className="mt-3 rounded-xl bg-white p-3 text-sm font-bold text-slate-950 ring-1 ring-slate-200">
                Decision: {getPayoutDecision(risk.status)}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

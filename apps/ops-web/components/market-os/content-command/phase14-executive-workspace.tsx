'use client';

import React from 'react';
import {
  phase14DecisionQueue,
  phase14ExecutiveKpis,
  phase14RiskItems,
} from './phase14-executive-data';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase14ExecutiveWorkspace(): React.ReactElement {
  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Content Command Center
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 14 Executive Oversight
        </h2>

        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Strategic oversight layer for executive KPI monitoring, campaign risk escalation,
          publishing velocity, and decision management.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {phase14ExecutiveKpis.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {item.label}
              </p>

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-3xl font-bold text-slate-950">{item.value}</p>
                <Badge>{item.trend}</Badge>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Risk Escalation</h3>

          <div className="mt-5 space-y-3">
            {phase14RiskItems.map((risk) => (
              <article key={risk.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{risk.title}</p>
                    <p className="mt-1 text-xs text-slate-500">Owner: {risk.owner}</p>
                    <p className="mt-3 text-sm text-slate-600">{risk.recommendation}</p>
                  </div>

                  <Badge>{risk.severity}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Executive Decision Queue</h3>

          <div className="mt-5 space-y-3">
            {phase14DecisionQueue.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.area}</p>
                  </div>

                  <div className="flex gap-2">
                    <Badge>{item.urgency}</Badge>
                    <Badge>{item.status}</Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase14ExecutiveWorkspace;
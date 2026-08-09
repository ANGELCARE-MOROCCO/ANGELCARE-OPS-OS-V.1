'use client';

import React from 'react';
import {
  phase13CampaignHealth,
  phase13OperationalAlerts,
  phase13WorkloadMembers,
} from './phase13-operations-data';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase13OperationsWorkspace(): React.ReactElement {
  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Content Command Center
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 13 Operations Intelligence
        </h2>
        <p className="mt-2 text-sm text-slate-600 max-w-3xl">
          Operational monitoring layer for workload distribution, campaign readiness,
          bottlenecks, overdue work, and execution health.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-1">
          <h3 className="text-lg font-bold text-slate-950">Workload Distribution</h3>

          <div className="mt-5 space-y-3">
            {phase13WorkloadMembers.map((member) => (
              <article key={member.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{member.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Active: {member.activeTasks} · Overdue: {member.overdueTasks}
                    </p>
                  </div>
                  <Badge>{member.capacityScore}%</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <h3 className="text-lg font-bold text-slate-950">Campaign Readiness</h3>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {phase13CampaignHealth.map((campaign) => (
              <article key={campaign.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{campaign.campaign}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Blocked: {campaign.blockedItems} · Overdue: {campaign.overdueItems}
                    </p>
                  </div>
                  <Badge>{campaign.status}</Badge>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Readiness</span>
                    <span>{campaign.readiness}%</span>
                  </div>

                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-white"
                      style={{ width: `${campaign.readiness}%` }}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">Operational Alerts</h3>

        <div className="mt-5 space-y-3">
          {phase13OperationalAlerts.map((alert) => (
            <article key={alert.id} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-950">{alert.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{alert.area}</p>
                  <p className="mt-3 text-sm text-slate-600">{alert.recommendation}</p>
                </div>

                <Badge>{alert.severity}</Badge>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase13OperationsWorkspace;
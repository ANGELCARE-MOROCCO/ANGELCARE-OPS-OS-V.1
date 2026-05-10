'use client';

import React, { useMemo } from 'react';
import {
  phase24CampaignCommandSummaries,
  phase24CommandKpis,
  phase24EscalationBoard,
  phase24ExecutiveDecisionItems,
} from './phase24-command-data';
import {
  getPhase24CampaignsAtRisk,
  getPhase24CommandConfidence,
  getPhase24CriticalKpis,
  getPhase24EscalationsByRisk,
} from './phase24-command-helpers';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase24ExecutiveCommandWorkspace(): React.ReactElement {
  const criticalKpis = useMemo(() => getPhase24CriticalKpis(phase24CommandKpis), []);
  const campaignsAtRisk = useMemo(() => getPhase24CampaignsAtRisk(phase24CampaignCommandSummaries), []);
  const escalations = useMemo(() => getPhase24EscalationsByRisk(phase24EscalationBoard), []);
  const confidence = useMemo(() => getPhase24CommandConfidence(phase24CampaignCommandSummaries), []);

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Content Command Center
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 24 Executive Command Layer
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Leadership visibility layer for strategic campaign command, executive decisions,
          risk escalation, publishing confidence, and operational command readiness.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Command Confidence</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{confidence}%</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Critical KPIs</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{criticalKpis.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Campaigns At Risk</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{campaignsAtRisk.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Escalations</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{escalations.length}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">Leadership KPI Board</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {phase24CommandKpis.map((kpi) => (
            <article key={kpi.id} className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{kpi.label}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-2xl font-bold text-slate-950">{kpi.value}</p>
                <div className="flex gap-2">
                  <Badge>{kpi.trend}</Badge>
                  <Badge>{kpi.risk}</Badge>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Campaign Command Summaries</h3>
          <div className="mt-5 space-y-3">
            {phase24CampaignCommandSummaries.map((campaign) => (
              <article key={campaign.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{campaign.campaign}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Blocked: {campaign.blockedItems} · Approvals: {campaign.pendingApprovals}
                    </p>
                    <p className="mt-3 text-sm text-slate-600">{campaign.recommendation}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{campaign.readiness}%</Badge>
                    <Badge>{campaign.publishingRisk}</Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">Executive Decision Queue</h3>
            <div className="mt-5 space-y-3">
              {phase24ExecutiveDecisionItems.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.area}</p>
                      <p className="mt-3 text-sm text-slate-600">{item.requiredDecision}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{item.urgency}</Badge>
                      <Badge>{item.status}</Badge>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">Escalation Board</h3>
            <div className="mt-5 space-y-3">
              {escalations.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">Owner: {item.owner}</p>
                      <p className="mt-3 text-sm text-slate-600">{item.nextAction}</p>
                    </div>
                    <Badge>{item.severity}</Badge>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase24ExecutiveCommandWorkspace;
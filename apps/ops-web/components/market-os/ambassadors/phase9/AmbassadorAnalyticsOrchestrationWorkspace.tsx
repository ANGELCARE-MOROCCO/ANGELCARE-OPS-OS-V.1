"use client";

import * as React from "react";
import { ambassadorAnalyticsSnapshot } from "./ambassador-analytics-data";
import {
  getAmbassadorAnalyticsExecutiveSummary,
  getCriticalActions,
  getHighRetentionRisks,
} from "./ambassador-analytics-engine";

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const tones = {
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-9500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-9500">{helper}</p>
    </article>
  );
}

export default function AmbassadorAnalyticsOrchestrationWorkspace() {
  const snapshot = ambassadorAnalyticsSnapshot;
  const summary = getAmbassadorAnalyticsExecutiveSummary(snapshot);
  const criticalActions = getCriticalActions(snapshot.orchestrationActions);
  const retentionRisks = getHighRetentionRisks(snapshot.retentionRisks);

  return (
    <section className="space-y-6 p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <Badge tone="info">Phase 9 · Analytics Orchestration</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
          Ambassador Analytics & Revenue Orchestration
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
          This workspace connects ambassador performance, campaign attribution, retention risk,
          regional expansion, and executive action planning into one operational analytics layer.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Analytics readiness" value={`${summary.analyticsReadinessScore}%`} helper="Computed from ROI, attribution quality, risk, and bottlenecks." />
        <MetricCard label="Revenue influenced" value={`${summary.totalRevenueMad.toLocaleString()} MAD`} helper={`${summary.totalConversions} conversions from ${summary.totalLeads} leads.`} />
        <MetricCard label="Conversion rate" value={`${summary.conversionRate}%`} helper="Cross-campaign ambassador conversion rate." />
        <MetricCard label="Clean attribution" value={`${summary.cleanAttributionRate}%`} helper="Records with clean ambassador/channel attribution." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-bold text-slate-950">Campaign performance orchestration</h2>
            <p className="mt-1 text-sm text-slate-9500">Identify where campaign performance is strong and where execution is blocked.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {snapshot.campaigns.map((campaign) => (
              <article key={campaign.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">{campaign.campaignName}</h3>
                    <p className="mt-1 text-sm text-slate-9500">{campaign.city} · Bottleneck: {campaign.bottleneck}</p>
                  </div>
                  <Badge tone={campaign.roiScore >= 85 ? "success" : campaign.roiScore >= 70 ? "warning" : "danger"}>
                    ROI {campaign.roiScore}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-4">
                  <span><strong className="text-slate-900">Active:</strong> {campaign.activeAmbassadors}/{campaign.assignedAmbassadors}</span>
                  <span><strong className="text-slate-900">Proofs:</strong> {campaign.proofsApproved}/{campaign.proofsSubmitted}</span>
                  <span><strong className="text-slate-900">Leads:</strong> {campaign.generatedLeads}</span>
                  <span><strong className="text-slate-900">Revenue:</strong> {campaign.revenueMad.toLocaleString()} MAD</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-950">Critical action queue</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {criticalActions.map((action) => (
                <article key={action.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-slate-950">{action.title}</h3>
                    <Badge tone="danger">{action.priority}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-9500">
                    Owner: {action.owner} · Impact: {action.expectedImpactMad.toLocaleString()} MAD · Due: {action.dueDate}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-950">Retention risk</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {retentionRisks.map((risk) => (
                <article key={risk.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-slate-950">{risk.ambassadorName}</h3>
                    <Badge tone={risk.riskScore >= 80 ? "danger" : "warning"}>{risk.riskScore}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-9500">{risk.riskReason}</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">{risk.recommendedAction}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-950">Attribution intelligence</h2>
          <p className="mt-1 text-sm text-slate-9500">Track who generated what, from which channel, and with what confidence.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-9500">
              <tr>
                <th className="px-5 py-3">Ambassador</th>
                <th className="px-5 py-3">Channel</th>
                <th className="px-5 py-3">Campaign</th>
                <th className="px-5 py-3">Leads</th>
                <th className="px-5 py-3">Conversions</th>
                <th className="px-5 py-3">Revenue</th>
                <th className="px-5 py-3">Confidence</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {snapshot.attribution.map((record) => (
                <tr key={record.id}>
                  <td className="px-5 py-4 font-medium text-slate-950">{record.ambassadorName}</td>
                  <td className="px-5 py-4 text-slate-600">{record.channel}</td>
                  <td className="px-5 py-4 text-slate-600">{record.campaignName}</td>
                  <td className="px-5 py-4 text-slate-600">{record.leads}</td>
                  <td className="px-5 py-4 text-slate-600">{record.conversions}</td>
                  <td className="px-5 py-4 text-slate-600">{record.revenueMad.toLocaleString()} MAD</td>
                  <td className="px-5 py-4 text-slate-600">{record.confidenceScore}%</td>
                  <td className="px-5 py-4">
                    <Badge tone={record.attributionStatus === "clean" ? "success" : record.attributionStatus === "conflict" ? "danger" : "warning"}>
                      {record.attributionStatus}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-950">Regional expansion scoring</h2>
        </div>
        <div className="grid gap-4 p-5 lg:grid-cols-3">
          {snapshot.regionalExpansion.map((region) => (
            <article key={region.city} className="rounded-2xl border border-slate-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-slate-950">{region.city}</h3>
                <Badge tone={region.recruitmentPriority === "critical" ? "danger" : region.recruitmentPriority === "high" ? "warning" : "neutral"}>
                  {region.recruitmentPriority}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Coverage: {region.currentAmbassadors}/{region.targetAmbassadors} ambassadors · Demand score: {region.leadDemandScore}
              </p>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-700">{region.suggestedAction}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

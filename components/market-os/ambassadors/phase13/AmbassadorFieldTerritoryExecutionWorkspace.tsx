"use client";

import * as React from "react";
import { ambassadorFieldSnapshot } from "./ambassador-field-data";
import { calculateTerritoryCoverage, getAmbassadorFieldMetrics, getCriticalRecruitmentGaps, getCriticalTerritories, getOpenFieldTasks } from "./ambassador-field-engine";

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  const tones = {
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function MetricCard({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </article>
  );
}

export default function AmbassadorFieldTerritoryExecutionWorkspace() {
  const snapshot = ambassadorFieldSnapshot;
  const metrics = getAmbassadorFieldMetrics(snapshot);
  const criticalTerritories = getCriticalTerritories(snapshot.territories);
  const openTasks = getOpenFieldTasks(snapshot.tasks);
  const criticalGaps = getCriticalRecruitmentGaps(snapshot.recruitmentGaps);

  return (
    <section className="space-y-6 p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <Badge tone="info">Phase 13 · Field & Territory Execution</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">Ambassador Field Operations & Territory Command</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
          Control city coverage, recruitment gaps, field tasks, local activations, regional managers, and Morocco expansion execution.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Field readiness" value={`${metrics.fieldReadinessScore}%`} helper="Computed from coverage, gaps, tasks, and activations." />
        <MetricCard label="Coverage" value={`${metrics.coveragePercent}%`} helper={`${metrics.totalAmbassadors}/${metrics.totalTargetAmbassadors} target ambassadors.`} />
        <MetricCard label="Critical territories" value={metrics.criticalTerritories} helper="Cities requiring immediate manager action." />
        <MetricCard label="Open field tasks" value={metrics.openFieldTasks} helper={`${metrics.criticalRecruitmentGaps} urgent recruitment gap(s).`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-bold text-slate-950">Territory coverage</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {snapshot.territories.map((zone) => (
              <article key={zone.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">{zone.city}</h3>
                    <p className="mt-1 text-sm text-slate-500">{zone.region} · Manager: {zone.manager}</p>
                  </div>
                  <Badge tone={zone.priority === "critical" ? "danger" : zone.priority === "high" ? "warning" : "neutral"}>{zone.status}</Badge>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-4">
                  <span><strong className="text-slate-900">Coverage:</strong> {calculateTerritoryCoverage(zone)}%</span>
                  <span><strong className="text-slate-900">Ambassadors:</strong> {zone.currentAmbassadors}/{zone.targetAmbassadors}</span>
                  <span><strong className="text-slate-900">Campaigns:</strong> {zone.activeCampaigns}</span>
                  <span><strong className="text-slate-900">Demand:</strong> {zone.leadDemandScore}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5"><h2 className="text-lg font-bold text-slate-950">Critical territories</h2></div>
            <div className="divide-y divide-slate-100">
              {criticalTerritories.map((zone) => (
                <article key={zone.id} className="p-5">
                  <div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-slate-950">{zone.city}</h3><Badge tone="danger">{zone.priority}</Badge></div>
                  <p className="mt-2 text-sm text-slate-500">Coverage {calculateTerritoryCoverage(zone)}% · Demand {zone.leadDemandScore}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5"><h2 className="text-lg font-bold text-slate-950">Recruitment gaps</h2></div>
            <div className="divide-y divide-slate-100">
              {criticalGaps.map((gap) => (
                <article key={gap.id} className="p-5">
                  <div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-slate-950">{gap.city}</h3><Badge tone={gap.urgency === "critical" ? "danger" : "warning"}>{gap.urgency}</Badge></div>
                  <p className="mt-2 text-sm text-slate-500">{gap.reason}</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">Need {gap.missingAmbassadors} · Source: {gap.recommendedSource}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5"><h2 className="text-lg font-bold text-slate-950">Field task queue</h2></div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-5 py-3">Task</th><th className="px-5 py-3">City</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Assignee</th><th className="px-5 py-3">Due</th><th className="px-5 py-3">Priority</th><th className="px-5 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {openTasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-5 py-4 font-medium text-slate-950">{task.title}</td>
                  <td className="px-5 py-4 text-slate-600">{task.city}</td>
                  <td className="px-5 py-4 text-slate-600">{task.type}</td>
                  <td className="px-5 py-4 text-slate-600">{task.assignee}</td>
                  <td className="px-5 py-4 text-slate-600">{task.dueDate}</td>
                  <td className="px-5 py-4"><Badge tone={task.priority === "critical" ? "danger" : task.priority === "high" ? "warning" : "neutral"}>{task.priority}</Badge></td>
                  <td className="px-5 py-4"><Badge tone={task.status === "blocked" ? "danger" : task.status === "doing" ? "info" : "neutral"}>{task.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5"><h2 className="text-lg font-bold text-slate-950">Local activations</h2></div>
        <div className="grid gap-4 p-5 lg:grid-cols-3">
          {snapshot.activations.map((activation) => (
            <article key={activation.id} className="rounded-2xl border border-slate-100 p-5">
              <Badge tone={activation.status === "completed" ? "success" : activation.status === "live" ? "info" : "neutral"}>{activation.status}</Badge>
              <h3 className="mt-4 font-bold text-slate-950">{activation.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{activation.city} · {activation.location} · {activation.date}</p>
              <p className="mt-3 text-sm text-slate-500">Owner: {activation.owner}</p>
              <p className="mt-3 text-sm font-medium text-slate-700">Check-ins: {activation.checkedInAmbassadors}/{activation.expectedAmbassadors} · Leads: {activation.generatedLeads}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

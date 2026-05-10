"use client";

import * as React from "react";
import { ambassadorApiRoutePlans, ambassadorDataTables, ambassadorSyncRecords } from "./ambassador-sync-data";
import { getAmbassadorSyncHealth, getRecordsNeedingAttention } from "./ambassador-sync-engine";

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

function MetricCard({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

export default function AmbassadorDataSyncFoundationWorkspace() {
  const health = getAmbassadorSyncHealth(ambassadorSyncRecords);
  const attentionRecords = getRecordsNeedingAttention(ambassadorSyncRecords);

  return (
    <section className="space-y-6 p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <Badge tone="info">Phase 6 · Data Sync Foundation</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
          Ambassador Production Data & Sync Foundation
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
          This workspace prepares the Ambassador unit to move from browser-only state toward real persisted workflows:
          database tables, API route planning, audit logs, payout safety, proof validation, and sync conflict visibility.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Sync readiness" value={`${health.syncReadinessScore}%`} helper="Computed from synced, pending, conflict, failed, and risk states." />
        <MetricCard label="Synced records" value={health.syncedRecords} helper={`${health.totalRecords} tracked operational records.`} />
        <MetricCard label="Pending/conflict" value={health.pendingRecords + health.conflictRecords} helper="Needs server persistence or audit resolution." />
        <MetricCard label="High-risk records" value={health.highRiskRecords} helper="Proofs, payouts, and compliance need strongest controls." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-bold text-slate-950">Records needing attention</h2>
            <p className="mt-1 text-sm text-slate-500">Use this as the production migration control list.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {attentionRecords.map((record) => (
              <article key={record.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">{record.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{record.notes}</p>
                  </div>
                  <Badge tone={record.riskLevel === "critical" ? "danger" : record.riskLevel === "high" ? "warning" : "neutral"}>
                    {record.riskLevel}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-4">
                  <span><strong className="text-slate-900">Entity:</strong> {record.entityKind}</span>
                  <span><strong className="text-slate-900">Action:</strong> {record.action}</span>
                  <span><strong className="text-slate-900">Status:</strong> {record.status}</span>
                  <span><strong className="text-slate-900">Owner:</strong> {record.owner}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-bold text-slate-950">API route plan</h2>
            <p className="mt-1 text-sm text-slate-500">Backend-ready route map without forcing backend injection yet.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {ambassadorApiRoutePlans.map((route) => (
              <article key={`${route.method}-${route.path}`} className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={route.method === "GET" ? "info" : route.method === "DELETE" ? "danger" : "success"}>
                    {route.method}
                  </Badge>
                  <code className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700">{route.path}</code>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{route.purpose}</p>
                <p className="mt-2 text-xs font-medium text-slate-500">Roles: {route.protectedByRole.join(", ")}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-950">Recommended production tables</h2>
          <p className="mt-1 text-sm text-slate-500">Database blueprint for making Ambassador OS real and synchronized.</p>
        </div>
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {ambassadorDataTables.map((table) => (
            <article key={table.name} className="rounded-2xl border border-slate-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-950">{table.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{table.purpose}</p>
                </div>
                <Badge tone={table.requiredForProduction ? "success" : "neutral"}>
                  {table.requiredForProduction ? "required" : "optional"}
                </Badge>
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Columns</p>
              <p className="mt-2 text-sm text-slate-600">{table.recommendedColumns.join(", ")}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Linked tables</p>
              <p className="mt-2 text-sm text-slate-600">{table.linkedTables.join(", ")}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

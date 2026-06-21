"use client";

import * as React from "react";
import { ambassadorComplianceSnapshot } from "./ambassador-compliance-data";
import { getAmbassadorComplianceMetrics, getCriticalCases, getProofsNeedingReview } from "./ambassador-compliance-engine";

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  const tones = {
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-blue-200 bg-blue-50 text-blue-700"
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function MetricCard({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-9500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-9500">{helper}</p>
    </article>
  );
}

export default function AmbassadorComplianceProofGovernanceWorkspace() {
  const snapshot = ambassadorComplianceSnapshot;
  const metrics = getAmbassadorComplianceMetrics(snapshot);
  const criticalCases = getCriticalCases(snapshot.cases);
  const reviewProofs = getProofsNeedingReview(snapshot.proofs);

  return (
    <section className="space-y-6 p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <Badge tone="info">Phase 14 · Compliance & Proof Governance</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">Ambassador Compliance, Brand Safety & Proof Governance</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
          Control proof validation, unsafe claims, brand rules, coaching workflows, compliance cases, and campaign eligibility locks before rewards or payouts are generated.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Governance readiness" value={`${metrics.governanceReadinessScore}%`} helper="Computed from proof quality, claim rules, critical cases, and coaching load." />
        <MetricCard label="Proof quality" value={`${metrics.averageProofQuality}%`} helper={`${metrics.approvedProofs}/${metrics.totalProofs} approved proofs.`} />
        <MetricCard label="Needs review" value={metrics.proofsNeedingReview} helper="Pending, revision, or flagged proofs." />
        <MetricCard label="Eligibility locks" value={metrics.lockedAmbassadors} helper={`${metrics.criticalCases} critical open case(s).`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5"><h2 className="text-lg font-bold text-slate-950">Proof evidence review queue</h2></div>
          <div className="divide-y divide-slate-100">
            {snapshot.proofs.map((proof) => (
              <article key={proof.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">{proof.ambassadorName}</h3>
                    <p className="mt-1 text-sm text-slate-9500">{proof.campaignName} · Reviewer: {proof.reviewer}</p>
                  </div>
                  <Badge tone={proof.decision === "approved" ? "success" : proof.decision === "revision_requested" ? "warning" : "info"}>{proof.decision}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{proof.reviewNotes}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone={proof.qualityScore >= 80 ? "success" : proof.qualityScore >= 60 ? "warning" : "danger"}>quality {proof.qualityScore}%</Badge>
                  {proof.riskFlags.map((flag) => <Badge key={flag} tone="danger">{flag}</Badge>)}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5"><h2 className="text-lg font-bold text-slate-950">Critical cases</h2></div>
            <div className="divide-y divide-slate-100">
              {criticalCases.map((item) => (
                <article key={item.id} className="p-5">
                  <div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-slate-950">{item.ambassadorName}</h3><Badge tone="danger">{item.severity}</Badge></div>
                  <p className="mt-2 text-sm text-slate-9500">{item.issue}</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">{item.nextAction}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5"><h2 className="text-lg font-bold text-slate-950">Proofs needing review</h2></div>
            <div className="divide-y divide-slate-100">
              {reviewProofs.map((proof) => (
                <article key={proof.id} className="p-5">
                  <h3 className="font-semibold text-slate-950">{proof.ambassadorName}</h3>
                  <p className="mt-2 text-sm text-slate-9500">{proof.reviewNotes}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5"><h2 className="text-lg font-bold text-slate-950">Claim control rules</h2></div>
        <div className="grid gap-4 p-5 lg:grid-cols-3">
          {snapshot.claimRules.map((rule) => (
            <article key={rule.id} className="rounded-2xl border border-slate-100 p-5">
              <Badge tone={rule.severity === "critical" ? "danger" : rule.severity === "high" ? "warning" : "neutral"}>{rule.severity}</Badge>
              <h3 className="mt-4 font-bold text-slate-950">{rule.label}</h3>
              <p className="mt-2 text-sm text-slate-600">{rule.allowedPattern}</p>
              <p className="mt-3 text-sm font-medium text-slate-700">{rule.requiredAction}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

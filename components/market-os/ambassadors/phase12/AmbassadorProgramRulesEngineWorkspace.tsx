"use client";

import * as React from "react";
import { ambassadorProgramSnapshot } from "./ambassador-program-data";
import {
  calculateProgramCoverage,
  getAmbassadorProgramMetrics,
  getCriticalGovernanceItems,
} from "./ambassador-program-engine";

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
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </article>
  );
}

export default function AmbassadorProgramRulesEngineWorkspace() {
  const snapshot = ambassadorProgramSnapshot;
  const metrics = getAmbassadorProgramMetrics(snapshot);
  const criticalGovernance = getCriticalGovernanceItems(snapshot.governance);

  return (
    <section className="space-y-6 p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <Badge tone="info">Phase 12 · Program Rules Engine</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
          Ambassador Program Builder, Tiers & Reward Rules
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
          This workspace makes ambassador programs configurable: eligibility rules,
          tiers, commission rules, payout policies, proof requirements, governance,
          and manager controls for scaling different Ambassador models.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Program readiness" value={`${metrics.programReadinessScore}%`} helper="Computed from coverage, active programs, reward rules, and governance risks." />
        <MetricCard label="Active programs" value={metrics.activePrograms} helper={`${metrics.totalActiveAmbassadors}/${metrics.totalTargetAmbassadors} target ambassadors.`} />
        <MetricCard label="Coverage" value={`${metrics.coveragePercent}%`} helper="Coverage across configured programs." />
        <MetricCard label="Reward rules" value={metrics.activeRewardRules} helper={`${metrics.financeApprovalRuleCount} require finance approval.`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {snapshot.programs.map((program) => (
            <article key={program.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">{program.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {program.type} · Owner: {program.owner} · Cities: {program.cityScope.join(", ")}
                    </p>
                  </div>
                  <Badge tone={program.status === "active" ? "success" : "neutral"}>{program.status}</Badge>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                  <span><strong className="text-slate-900">Coverage:</strong> {calculateProgramCoverage(program)}%</span>
                  <span><strong className="text-slate-900">Ambassadors:</strong> {program.activeAmbassadors}/{program.targetAmbassadors}</span>
                  <span><strong className="text-slate-900">Rewards:</strong> {program.rewardRules.length}</span>
                </div>
              </div>

              <div className="grid gap-4 p-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 p-4">
                  <h3 className="font-bold text-slate-950">Eligibility rules</h3>
                  <div className="mt-3 space-y-3">
                    {program.eligibilityRules.map((rule) => (
                      <div key={rule.id} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                        <strong className="text-slate-900">{rule.label}</strong>: {rule.metric} {rule.operator} {rule.value}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 p-4">
                  <h3 className="font-bold text-slate-950">Reward rules</h3>
                  <div className="mt-3 space-y-3">
                    {program.rewardRules.map((rule) => (
                      <div key={rule.id} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                        <div className="flex items-center justify-between gap-3">
                          <strong className="text-slate-900">{rule.name}</strong>
                          <Badge tone={rule.financeApprovalRequired ? "warning" : "success"}>
                            {rule.financeApprovalRequired ? "finance" : "auto"}
                          </Badge>
                        </div>
                        <p className="mt-1">{rule.type} · trigger: {rule.trigger}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-950">Critical governance</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {criticalGovernance.map((item) => (
                <article key={item.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-slate-950">{item.title}</h3>
                    <Badge tone="danger">{item.severity}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{item.recommendation}</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">Owner: {item.owner}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-950">Tier rule matrix</h2>
              <p className="mt-1 text-sm text-slate-500">Reusable progression rules for ambassador tiers.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {snapshot.programs[0]?.tierRules.map((tier) => (
                <article key={tier.tier} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-slate-950">{tier.label}</h3>
                    <Badge tone="info">{tier.commissionRate}%</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Health {tier.minHealthScore}+ · Proofs {tier.minApprovedProofs}+ · Revenue {tier.minRevenueMad.toLocaleString()} MAD+
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-700">Bonus: {tier.monthlyBonusMad.toLocaleString()} MAD/month</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-950">Program policies</h2>
        </div>
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {snapshot.programs.flatMap((program) =>
            program.policies.map((policy) => (
              <article key={policy.id} className="rounded-2xl border border-slate-100 p-5">
                <h3 className="font-bold text-slate-950">{policy.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{policy.description}</p>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                  <span>Proof required: {policy.proofRequired ? "yes" : "no"}</span>
                  <span>Max missions/week: {policy.maxMissionsPerWeek}</span>
                  <span>Payout: {policy.payoutCycle}</span>
                  <span>Manager approval: {policy.managerApprovalRequired ? "yes" : "no"}</span>
                </div>
              </article>
            )),
          )}
        </div>
      </div>
    </section>
  );
}

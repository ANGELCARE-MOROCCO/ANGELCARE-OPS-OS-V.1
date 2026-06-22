'use client';

import React, { useMemo } from 'react';
import {
  phase37AutonomyBoundaries,
  phase37AutonomyReadiness,
  phase37HumanGates,
  phase37RollbackPlans,
  phase37SafetyChecks,
} from './phase37-safety-data';
import {
  getPhase37AverageAutonomyReadiness,
  getPhase37FailedRequiredChecks,
  getPhase37MandatoryHumanGates,
  getPhase37PendingRollbackPlans,
} from './phase37-safety-helpers';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase37AutonomySafetyWorkspace(): React.ReactElement {
  const mandatoryGates = useMemo(() => getPhase37MandatoryHumanGates(phase37HumanGates), []);
  const failedChecks = useMemo(() => getPhase37FailedRequiredChecks(phase37SafetyChecks), []);
  const pendingRollback = useMemo(() => getPhase37PendingRollbackPlans(phase37RollbackPlans), []);
  const readiness = useMemo(() => getPhase37AverageAutonomyReadiness(phase37AutonomyReadiness), []);

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Content Command Center
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 37 Autonomy Safety Governance
        </h2>

        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Safety governance layer for autonomous recommendations, human-in-the-loop controls,
          intervention boundaries, rollback plans, required checks, and AI coordination safety.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Readiness</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{readiness}%</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Human Gates</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{mandatoryGates.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Failed Checks</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{failedChecks.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rollback Pending</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{pendingRollback.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Human-in-the-loop Gates</h3>
          <div className="mt-5 space-y-3">
            {phase37HumanGates.map((gate) => (
              <article key={gate.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{gate.gate}</p>
                    <p className="mt-1 text-xs text-slate-500">{gate.appliesTo}</p>
                    <p className="mt-3 text-sm text-slate-600">Required role: {gate.requiredRole}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{gate.risk}</Badge>
                    <Badge>{gate.mandatory ? 'Mandatory' : 'Optional'}</Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Autonomy Boundaries</h3>
          <div className="mt-5 space-y-3">
            {phase37AutonomyBoundaries.map((boundary) => (
              <article key={boundary.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{boundary.actionType}</p>
                    <p className="mt-2 text-sm text-slate-600">{boundary.notes}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{boundary.autonomyLevel}</Badge>
                    <Badge>{boundary.maxAllowedRisk}</Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Required Safety Checks</h3>
          <div className="mt-5 space-y-3">
            {phase37SafetyChecks.map((check) => (
              <article key={check.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{check.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{check.category}</p>
                    <p className="mt-3 text-sm text-slate-600">{check.recommendation}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{check.required ? 'Required' : 'Optional'}</Badge>
                    <Badge>{check.passed ? 'Passed' : 'Failed'}</Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Rollback Plans</h3>
          <div className="mt-5 space-y-3">
            {phase37RollbackPlans.map((plan) => (
              <article key={plan.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{plan.scenario}</p>
                    <p className="mt-1 text-xs text-slate-500">Owner: {plan.rollbackOwner}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {plan.steps.map((step) => (
                        <Badge key={step}>{step}</Badge>
                      ))}
                    </div>
                  </div>
                  <Badge>{plan.ready ? 'Ready' : 'Pending'}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">Autonomy Readiness</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {phase37AutonomyReadiness.map((item) => (
            <article key={item.label} className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">{item.score}%</p>
              <p className="mt-2 text-sm text-slate-600">{item.blocker}</p>
              <div className="mt-3">
                <Badge>{item.risk}</Badge>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase37AutonomySafetyWorkspace;
'use client';

import React from 'react';
import {
  phase15EscalationRoutes,
  phase15PipelineSteps,
  phase15ReleaseGates,
} from './phase15-orchestration-data';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase15OrchestrationWorkspace(): React.ReactElement {
  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-9500">
          Content Command Center
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 15 Production Orchestration
        </h2>

        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Operational orchestration layer for release pipelines, dependency chains,
          readiness gates, and escalation routing.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Pipeline Steps</h3>

          <div className="mt-5 space-y-3">
            {phase15PipelineSteps.map((step) => (
              <article key={step.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{step.title}</p>
                    <p className="mt-1 text-xs text-slate-9500">
                      {step.owner} · Dependencies: {step.dependencyCount}
                    </p>
                  </div>

                  <Badge>{step.status}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Release Gates</h3>

          <div className="mt-5 space-y-3">
            {phase15ReleaseGates.map((gate) => (
              <article key={gate.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{gate.title}</p>
                    <p className="mt-1 text-xs text-slate-9500">
                      Severity: {gate.severity}
                    </p>
                  </div>

                  <Badge>{gate.passed ? 'Passed' : 'Blocked'}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Escalation Routes</h3>

          <div className="mt-5 space-y-3">
            {phase15EscalationRoutes.map((route) => (
              <article key={route.id} className="rounded-2xl border border-slate-100 p-4">
                <div>
                  <p className="text-sm font-bold text-slate-950">{route.area}</p>
                  <p className="mt-1 text-xs text-slate-9500">
                    Owner: {route.escalationOwner}
                  </p>
                  <p className="mt-3 text-sm text-slate-600">
                    Trigger: {route.trigger}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase15OrchestrationWorkspace;
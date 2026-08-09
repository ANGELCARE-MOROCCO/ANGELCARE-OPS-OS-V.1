'use client';

import React, { useMemo } from 'react';
import {
  phase23AuditChecks,
  phase23FallbackStates,
  phase23ReadinessScores,
  phase23SafetyGates,
} from './phase23-qa-data';
import {
  getFailedPhase23AuditChecks,
  getFailedPhase23SafetyGates,
  getMissingPhase23Fallbacks,
  getPhase23OverallReadiness,
} from './phase23-qa-helpers';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase23QaWorkspace(): React.ReactElement {
  const failedGates = useMemo(() => getFailedPhase23SafetyGates(phase23SafetyGates), []);
  const missingFallbacks = useMemo(() => getMissingPhase23Fallbacks(phase23FallbackStates), []);
  const failedAudits = useMemo(() => getFailedPhase23AuditChecks(phase23AuditChecks), []);
  const readiness = useMemo(() => getPhase23OverallReadiness(phase23ReadinessScores), []);

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Content Command Center
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 23 QA Hardening
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Production safety layer for QA gates, fallback coverage, audit checks,
          scope isolation, TypeScript safety, and readiness scoring.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Readiness</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{readiness}%</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Failed Gates</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{failedGates.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Missing Fallbacks</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{missingFallbacks.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Failed Audits</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{failedAudits.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Safety Gates</h3>
          <div className="mt-5 space-y-3">
            {phase23SafetyGates.map((gate) => (
              <article key={gate.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{gate.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{gate.area} · {gate.severity}</p>
                    <p className="mt-3 text-sm text-slate-600">{gate.recommendation}</p>
                  </div>
                  <Badge>{gate.passed ? 'Passed' : 'Failed'}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Fallback Coverage</h3>
          <div className="mt-5 space-y-3">
            {phase23FallbackStates.map((fallback) => (
              <article key={fallback.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{fallback.component}</p>
                    <p className="mt-1 text-xs text-slate-500">{fallback.fallbackType}</p>
                  </div>
                  <Badge>{fallback.implemented ? 'Implemented' : 'Needed'}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase23QaWorkspace;
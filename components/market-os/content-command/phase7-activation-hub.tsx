'use client';

import React from 'react';
import { getEnabledContentCommandNavigation } from './phase7-workspace-navigation';
import { contentCommandReadinessScores, getOverallContentCommandReadiness } from './phase7-module-readiness';
import { getProductionQaPassRate, phase7ProductionQaChecklist } from './phase7-production-qa';

export function ContentCommandActivationHub(): React.ReactElement {
  const navigation = getEnabledContentCommandNavigation();
  const readiness = getOverallContentCommandReadiness();
  const qaPassRate = getProductionQaPassRate();

  return (
    <section className="w-full space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Content Command Center
        </p>
        <h2 className="text-2xl font-bold text-slate-950">Phase 7 Activation Hub</h2>
        <p className="max-w-3xl text-sm text-slate-600">
          Stabilization layer for workspace navigation, production readiness, QA status, and safe activation inside the Content Command Center submodule only.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Readiness</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{readiness}%</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">QA Pass Rate</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{qaPassRate}%</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Enabled Workspaces</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{navigation.length}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-950">Workspace Navigation</h3>
          <div className="mt-4 space-y-3">
            {navigation.map((item) => (
              <div key={item.key} className="rounded-xl border border-slate-100 bg-white p-3">
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="mt-1 text-xs text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-950">Readiness Areas</h3>
            <div className="mt-4 space-y-3">
              {contentCommandReadinessScores.map((item) => (
                <div key={item.area} className="rounded-xl border border-slate-100 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="text-sm font-bold text-slate-950">{item.score}%</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{item.notes.join(' ')}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-950">Production QA</h3>
            <div className="mt-4 space-y-3">
              {phase7ProductionQaChecklist.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-100 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                      {item.passed ? 'Passed' : 'Review'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{item.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentCommandActivationHub;
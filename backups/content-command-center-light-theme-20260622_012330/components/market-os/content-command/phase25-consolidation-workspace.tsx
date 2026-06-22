'use client';

import React, { useMemo, useState } from 'react';
import {
  phase25ActivationMap,
  phase25IntegrityChecks,
  phase25ModuleSummary,
  phase25WorkspaceManifest,
} from './phase25-consolidation-data';
import {
  getPhase25ActiveWorkspaces,
  getPhase25BuildSafePercent,
  getPhase25FailedIntegrityChecks,
  getPhase25WorkspacesByCategory,
} from './phase25-consolidation-helpers';
import type { Phase25WorkspaceCategory } from './phase25-consolidation-types';

const categories: Phase25WorkspaceCategory[] = [
  'foundation',
  'operations',
  'governance',
  'analytics',
  'ai',
  'publishing',
  'executive',
  'qa',
];

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase25ConsolidationWorkspace(): React.ReactElement {
  const [selectedCategory, setSelectedCategory] = useState<Phase25WorkspaceCategory>('operations');

  const activeWorkspaces = useMemo(() => getPhase25ActiveWorkspaces(phase25WorkspaceManifest), []);
  const failedChecks = useMemo(() => getPhase25FailedIntegrityChecks(phase25IntegrityChecks), []);
  const buildSafePercent = useMemo(() => getPhase25BuildSafePercent(phase25WorkspaceManifest), []);
  const filteredWorkspaces = useMemo(
    () => getPhase25WorkspacesByCategory(phase25WorkspaceManifest, selectedCategory),
    [selectedCategory]
  );

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-9500">
          Content Command Center
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 25 Module Consolidation
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Unified registry layer for organizing all Content Command Center workspaces,
          activation paths, integrity checks, and final module readiness.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {phase25ModuleSummary.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">{item.value}</p>
              <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Active workspaces: {activeWorkspaces.length} · Build-safe registry: {buildSafePercent}% · Failed integrity checks: {failedChecks.length}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Workspace Categories</h3>
          <div className="mt-5 space-y-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold capitalize text-slate-950">{selectedCategory} Workspaces</h3>
          <div className="mt-5 space-y-3">
            {filteredWorkspaces.length > 0 ? (
              filteredWorkspaces.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">Phase {item.phase} — {item.title}</p>
                      <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{item.active ? 'Active' : 'Inactive'}</Badge>
                      <Badge>{item.buildSafe ? 'Build-safe' : 'Review'}</Badge>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                No workspace registered in this category yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Activation Map</h3>
          <div className="mt-5 space-y-3">
            {phase25ActivationMap.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-sm font-bold text-slate-950">{item.importName}</p>
                <p className="mt-1 text-xs text-slate-9500">{item.importPath}</p>
                <p className="mt-3 text-sm text-slate-600">{item.recommendedPlacement}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Integrity Checks</h3>
          <div className="mt-5 space-y-3">
            {phase25IntegrityChecks.map((check) => (
              <article key={check.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{check.label}</p>
                    <p className="mt-2 text-sm text-slate-600">{check.notes}</p>
                  </div>
                  <Badge>{check.passed ? 'Passed' : 'Failed'}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase25ConsolidationWorkspace;
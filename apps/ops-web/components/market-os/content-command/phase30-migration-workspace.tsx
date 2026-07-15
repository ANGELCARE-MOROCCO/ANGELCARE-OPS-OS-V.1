'use client';

import React, { useMemo } from 'react';
import {
  phase30DependencyPlan,
  phase30MigrationSteps,
  phase30RolloutChecklist,
  phase30SqlBlueprints,
} from './phase30-migration-data';
import {
  getPhase30BlockedSteps,
  getPhase30IncompleteChecklist,
  getPhase30OrderedSteps,
  getPhase30UnsafeSql,
} from './phase30-migration-helpers';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase30MigrationWorkspace(): React.ReactElement {
  const orderedSteps = useMemo(() => getPhase30OrderedSteps(phase30MigrationSteps), []);
  const blockedSteps = useMemo(() => getPhase30BlockedSteps(phase30MigrationSteps), []);
  const unsafeSql = useMemo(() => getPhase30UnsafeSql(phase30SqlBlueprints), []);
  const incompleteChecklist = useMemo(() => getPhase30IncompleteChecklist(phase30RolloutChecklist), []);

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Content Command Center
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 30 SQL Migration Planning
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Safe migration planning layer for SQL blueprints, dependency order, RLS rollout,
          audit planning, migration blockers, and verification readiness. This does not execute database changes.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Migration Steps</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{orderedSteps.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Blocked Steps</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{blockedSteps.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">SQL Needs Review</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{unsafeSql.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Checklist Open</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{incompleteChecklist.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Migration Sequence</h3>
          <div className="mt-5 space-y-3">
            {orderedSteps.map((step) => (
              <article key={step.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">
                      {step.order}. {step.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{step.stage} · {step.sqlObject}</p>
                    <p className="mt-3 text-sm text-slate-600">{step.notes}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{step.risk}</Badge>
                    <Badge>{step.ready ? 'Ready' : 'Blocked'}</Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">SQL Blueprint Preview</h3>
          <div className="mt-5 space-y-3">
            {phase30SqlBlueprints.map((blueprint) => (
              <article key={blueprint.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{blueprint.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{blueprint.tableName}</p>
                  </div>
                  <Badge>{blueprint.safeToRun ? 'Safe' : 'Review first'}</Badge>
                </div>
                <pre className="mt-4 overflow-auto rounded-2xl bg-white p-4 text-xs text-slate-900">
                  {blueprint.sqlPreview}
                </pre>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Dependency Plan</h3>
          <div className="mt-5 space-y-3">
            {phase30DependencyPlan.map((dependency) => (
              <article key={dependency.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-sm font-bold text-slate-950">{dependency.objectName}</p>
                <p className="mt-2 text-sm text-slate-600">{dependency.reason}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {dependency.dependsOn.map((item) => (
                    <Badge key={item}>{item}</Badge>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Rollout Checklist</h3>
          <div className="mt-5 space-y-3">
            {phase30RolloutChecklist.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{item.label}</p>
                    <p className="mt-2 text-sm text-slate-600">{item.blocker}</p>
                  </div>
                  <Badge>{item.completed ? 'Completed' : 'Open'}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase30MigrationWorkspace;
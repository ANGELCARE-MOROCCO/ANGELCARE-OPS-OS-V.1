'use client';

import React, { useMemo } from 'react';
import {
  phase39ActivationScores,
  phase39ActivationSteps,
  phase39EnvironmentChecks,
  phase39RepositoryContracts,
  phase39RuntimeRisks,
  phase39ServerActionScaffolds,
} from './phase39-runtime-activation-data';
import {
  getPhase39AverageActivationScore,
  getPhase39BlockedServerActions,
  getPhase39BlockedSteps,
  getPhase39CriticalRisks,
  getPhase39ReadyRepositories,
} from './phase39-runtime-activation-helpers';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase39RuntimeActivationWorkspace(): React.ReactElement {
  const blockedSteps = useMemo(() => getPhase39BlockedSteps(phase39ActivationSteps), []);
  const readyRepositories = useMemo(() => getPhase39ReadyRepositories(phase39RepositoryContracts), []);
  const blockedActions = useMemo(() => getPhase39BlockedServerActions(phase39ServerActionScaffolds), []);
  const criticalRisks = useMemo(() => getPhase39CriticalRisks(phase39RuntimeRisks), []);
  const activationScore = useMemo(() => getPhase39AverageActivationScore(phase39ActivationScores), []);

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Content Command Center
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 39 Controlled Runtime Activation
        </h2>

        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          First live-runtime activation scaffold for Supabase readiness, server actions,
          safe CRUD, repository wiring, audit persistence, environment checks, and runtime risk control.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Activation Score</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{activationScore}%</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Blocked Steps</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{blockedSteps.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ready Repos</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{readyRepositories.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Blocked Actions</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{blockedActions.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Critical Risks</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{criticalRisks.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Environment Readiness</h3>
          <div className="mt-5 space-y-3">
            {phase39EnvironmentChecks.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{item.key}</p>
                    <p className="mt-2 text-sm text-slate-600">{item.purpose}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{item.required ? 'Required' : 'Optional'}</Badge>
                    <Badge>{item.safeClientExposure ? 'Client-safe' : 'Server-only'}</Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Live Repository Contracts</h3>
          <div className="mt-5 space-y-3">
            {phase39RepositoryContracts.map((repo) => (
              <article key={repo.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{repo.entity}</p>
                    <p className="mt-1 text-xs text-slate-500">{repo.tableName}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {repo.requiredMethods.map((method) => (
                        <Badge key={method}>{method}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{repo.state}</Badge>
                    <Badge>{repo.risk}</Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Runtime Activation Steps</h3>
          <div className="mt-5 space-y-3">
            {phase39ActivationSteps
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((step) => (
                <article key={step.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{step.order}. {step.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{step.area}</p>
                      <p className="mt-3 text-sm text-slate-600">{step.instruction}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{step.state}</Badge>
                      <Badge>{step.risk}</Badge>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Server Action Scaffolds</h3>
          <div className="mt-5 space-y-3">
            {phase39ServerActionScaffolds.map((action) => (
              <article key={action.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{action.actionName}</p>
                    <p className="mt-1 text-xs text-slate-500">{action.mutationType}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{action.serverOnly ? 'Server-only' : 'Client'}</Badge>
                    <Badge>{action.requiresAudit ? 'Audit' : 'No audit'}</Badge>
                    <Badge>{action.requiresPermission ? 'Permission' : 'Open'}</Badge>
                    <Badge>{action.state}</Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Runtime Risks</h3>
          <div className="mt-5 space-y-3">
            {phase39RuntimeRisks.map((risk) => (
              <article key={risk.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{risk.risk}</p>
                    <p className="mt-3 text-sm text-slate-600">{risk.mitigation}</p>
                  </div>
                  <Badge>{risk.severity}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Activation Scores</h3>
          <div className="mt-5 space-y-3">
            {phase39ActivationScores.map((score) => (
              <article key={score.label} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{score.label}</p>
                    <p className="mt-2 text-sm text-slate-600">{score.blocker}</p>
                  </div>
                  <Badge>{score.score}%</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase39RuntimeActivationWorkspace;
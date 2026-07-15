'use client';

import React, { useMemo, useState } from 'react';
import {
  phase26CommandActions,
  phase26DefaultProductionState,
  phase26WorkspaceHealth,
  phase26WorkspaceTabs,
} from './phase26-unified-data';
import {
  filterPhase26Tabs,
  getPhase26OrderedTabs,
  getPhase26OverallReadiness,
  getPhase26ProductionStateLabel,
  getPhase26TotalBlockers,
} from './phase26-unified-helpers';
import type { Phase26UnifiedFilterState, Phase26WorkspaceKey, Phase26WorkspaceStatus } from './phase26-unified-types';

const workspaceOptions: Array<Phase26WorkspaceKey | 'all'> = [
  'all',
  'overview',
  'operations',
  'management',
  'media',
  'publishing',
  'analytics',
  'ai',
  'collaboration',
  'qa',
  'executive',
];

const statusOptions: Array<Phase26WorkspaceStatus | 'all'> = ['all', 'ready', 'review', 'future'];

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase26UnifiedWorkspace(): React.ReactElement {
  const [filter, setFilter] = useState<Phase26UnifiedFilterState>({
    search: '',
    workspace: 'all',
    status: 'all',
  });

  const orderedTabs = useMemo(() => getPhase26OrderedTabs(phase26WorkspaceTabs), []);
  const filteredTabs = useMemo(() => filterPhase26Tabs(orderedTabs, filter), [orderedTabs, filter]);
  const readiness = useMemo(() => getPhase26OverallReadiness(phase26WorkspaceHealth), []);
  const blockers = useMemo(() => getPhase26TotalBlockers(phase26WorkspaceHealth), []);
  const productionLabel = getPhase26ProductionStateLabel(phase26DefaultProductionState);

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Content Command Center
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 26 Unified Production Integration
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Unified shell for organizing the Content Command Center into a coherent production workspace
          with launcher tabs, shared filters, command actions, health summaries, and safe mounting guidance.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overall Readiness</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{readiness}%</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Workspaces</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{phase26WorkspaceTabs.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Blockers</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{blockers}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Production State</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{productionLabel}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">Unified Command Toolbar</h3>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {phase26CommandActions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={!action.enabled}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <p className="text-sm font-bold text-slate-950">{action.label}</p>
              <p className="mt-1 text-xs text-slate-500">{action.workspace}</p>
              <p className="mt-3 text-sm text-slate-600">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Shared Filters</h3>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search</span>
              <input
                value={filter.search}
                onChange={(event) => setFilter((current) => ({ ...current, search: event.target.value }))}
                placeholder="Search workspaces"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Workspace</span>
              <select
                value={filter.workspace}
                onChange={(event) => setFilter((current) => ({ ...current, workspace: event.target.value as Phase26WorkspaceKey | 'all' }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              >
                {workspaceOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
              <select
                value={filter.status}
                onChange={(event) => setFilter((current) => ({ ...current, status: event.target.value as Phase26WorkspaceStatus | 'all' }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Workspace Launcher Registry</h3>
          <div className="mt-5 space-y-3">
            {filteredTabs.length > 0 ? (
              filteredTabs.map((tab) => (
                <article key={tab.key} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{tab.label}</p>
                      <p className="mt-2 text-sm text-slate-600">{tab.description}</p>
                      <p className="mt-2 text-xs text-slate-500">Component: {tab.recommendedComponent}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{tab.status}</Badge>
                      <Badge>Priority {tab.priority}</Badge>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                No workspace matches the current filters.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">Workspace Health Summary</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {phase26WorkspaceHealth.map((item) => (
            <article key={item.workspace} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold capitalize text-slate-950">{item.workspace}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.notes}</p>
                </div>
                <Badge>{item.readiness}%</Badge>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Blockers: {item.blockers}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase26UnifiedWorkspace;
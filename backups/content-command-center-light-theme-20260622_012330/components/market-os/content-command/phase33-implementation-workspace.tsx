'use client';

import React, { useMemo, useState } from 'react';
import {
  phase33ConnectionScores,
  phase33CutoverChecklist,
  phase33Dependencies,
  phase33ReadinessItems,
} from './phase33-implementation-data';
import {
  getPhase33AverageConnectionScore,
  getPhase33CriticalItems,
  getPhase33OpenCutoverItems,
  getPhase33ReadyToConnect,
  getPhase33UnresolvedDependencies,
} from './phase33-implementation-helpers';
import type { Phase33ImplementationArea } from './phase33-implementation-types';

const areas: Array<Phase33ImplementationArea | 'all'> = [
  'all',
  'data',
  'api',
  'media',
  'ai',
  'analytics',
  'publishing',
  'realtime',
  'permissions',
  'qa',
];

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase33ImplementationWorkspace(): React.ReactElement {
  const [selectedArea, setSelectedArea] = useState<Phase33ImplementationArea | 'all'>('all');

  const readyToConnect = useMemo(() => getPhase33ReadyToConnect(phase33ReadinessItems), []);
  const criticalItems = useMemo(() => getPhase33CriticalItems(phase33ReadinessItems), []);
  const unresolvedDependencies = useMemo(() => getPhase33UnresolvedDependencies(phase33Dependencies), []);
  const openCutover = useMemo(() => getPhase33OpenCutoverItems(phase33CutoverChecklist), []);
  const connectionScore = useMemo(() => getPhase33AverageConnectionScore(phase33ConnectionScores), []);

  const filteredReadiness = useMemo(
    () =>
      selectedArea === 'all'
        ? phase33ReadinessItems
        : phase33ReadinessItems.filter((item) => item.area === selectedArea),
    [selectedArea]
  );

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-9500">
          Content Command Center
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 33 Implementation Readiness
        </h2>

        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Transition map from mock/planned architecture into real backend, API, media,
          AI, analytics, publishing, realtime, and permission implementation.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Connection Score</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{connectionScore}%</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Ready</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{readyToConnect.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Critical</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{criticalItems.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Dependencies</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{unresolvedDependencies.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Cutover Open</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{openCutover.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Implementation Area</h3>
          <div className="mt-5 space-y-2">
            {areas.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setSelectedArea(area)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Readiness Registry</h3>
          <div className="mt-5 space-y-3">
            {filteredReadiness.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-9500">{item.area}</p>
                    <p className="mt-3 text-sm text-slate-600">{item.nextStep}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{item.state}</Badge>
                    <Badge>{item.priority}</Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Implementation Dependencies</h3>
          <div className="mt-5 space-y-3">
            {phase33Dependencies.map((dependency) => (
              <article key={dependency.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{dependency.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{dependency.blocker}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {dependency.dependsOn.map((item) => (
                        <Badge key={item}>{item}</Badge>
                      ))}
                    </div>
                  </div>
                  <Badge>{dependency.resolved ? 'Resolved' : 'Open'}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Production Cutover Checklist</h3>
          <div className="mt-5 space-y-3">
            {phase33CutoverChecklist.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{item.label}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{item.risk}</Badge>
                    <Badge>{item.completed ? 'Completed' : 'Open'}</Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">Connection Priority Scores</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {phase33ConnectionScores.map((item) => (
            <article key={item.label} className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">{item.score}%</p>
              <p className="mt-2 text-sm text-slate-600">{item.recommendation}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase33ImplementationWorkspace;
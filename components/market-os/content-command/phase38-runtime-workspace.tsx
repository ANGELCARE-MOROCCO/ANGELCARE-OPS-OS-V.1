'use client';

import React, { useMemo, useState } from 'react';
import {
  phase38CutoverStages,
  phase38MutationBlueprints,
  phase38RuntimeAdapters,
  phase38RuntimeEvents,
  phase38RuntimeGuardrails,
  phase38RuntimeScores,
} from './phase38-runtime-data';
import {
  getPhase38AverageRuntimeScore,
  getPhase38BlockedAdapters,
  getPhase38BlockedCutoverStages,
  getPhase38EnabledGuardrails,
  getPhase38HumanApprovedMutations,
  getPhase38ReadyAdapters,
} from './phase38-runtime-helpers';
import type { Phase38RuntimeLayer } from './phase38-runtime-types';

const layers: Array<Phase38RuntimeLayer | 'all'> = [
  'all',
  'client_ui',
  'server_action',
  'api_route',
  'repository',
  'database',
  'storage',
  'ai_provider',
  'analytics_provider',
  'realtime_provider',
];

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase38RuntimeBridgeWorkspace(): React.ReactElement {
  const [selectedLayer, setSelectedLayer] = useState<Phase38RuntimeLayer | 'all'>('all');

  const readyAdapters = useMemo(() => getPhase38ReadyAdapters(phase38RuntimeAdapters), []);
  const blockedAdapters = useMemo(() => getPhase38BlockedAdapters(phase38RuntimeAdapters), []);
  const humanApprovedMutations = useMemo(() => getPhase38HumanApprovedMutations(phase38MutationBlueprints), []);
  const blockedCutover = useMemo(() => getPhase38BlockedCutoverStages(phase38CutoverStages), []);
  const enabledGuardrails = useMemo(() => getPhase38EnabledGuardrails(phase38RuntimeGuardrails), []);
  const runtimeScore = useMemo(() => getPhase38AverageRuntimeScore(phase38RuntimeScores), []);

  const filteredAdapters = useMemo(
    () =>
      selectedLayer === 'all'
        ? phase38RuntimeAdapters
        : phase38RuntimeAdapters.filter((adapter) => adapter.layer === selectedLayer),
    [selectedLayer]
  );

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Content Command Center
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 38 Runtime Foundation Bridge
        </h2>

        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Progressive runtime bridge for moving from architecture into real controlled execution:
          runtime adapters, mutation safety, server/client boundaries, event bus planning,
          guardrails, and cutover sequencing.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-6">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Runtime Score</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{runtimeScore}%</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ready Adapters</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{readyAdapters.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Blocked</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{blockedAdapters.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Human Mutations</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{humanApprovedMutations.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cutover Blocks</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{blockedCutover.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Guardrails</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{enabledGuardrails.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Runtime Layers</h3>
          <div className="mt-5 space-y-2">
            {layers.map((layer) => (
              <button
                key={layer}
                type="button"
                onClick={() => setSelectedLayer(layer)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {layer}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Runtime Adapter Registry</h3>
          <div className="mt-5 space-y-3">
            {filteredAdapters.map((adapter) => (
              <article key={adapter.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{adapter.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{adapter.layer} · {adapter.boundary}</p>
                    <p className="mt-3 text-sm text-slate-600">{adapter.nextStep}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{adapter.status}</Badge>
                    <Badge>{adapter.risk}</Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Mutation Engine Blueprint</h3>
          <div className="mt-5 space-y-3">
            {phase38MutationBlueprints.map((mutation) => (
              <article key={mutation.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{mutation.mutationName}</p>
                    <p className="mt-1 text-xs text-slate-500">{mutation.entity}</p>
                    <p className="mt-3 text-sm text-slate-600">{mutation.rollbackStrategy}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{mutation.safety}</Badge>
                    <Badge>{mutation.requiresAudit ? 'Audit' : 'No audit'}</Badge>
                    <Badge>{mutation.requiresPermission ? 'Permission' : 'Open'}</Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Runtime Event Bus Plan</h3>
          <div className="mt-5 space-y-3">
            {phase38RuntimeEvents.map((event) => (
              <article key={event.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-sm font-bold text-slate-950">{event.eventName}</p>
                <p className="mt-1 text-xs text-slate-500">Emitted by: {event.emittedBy}</p>
                <p className="mt-3 text-sm text-slate-600">{event.notes}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {event.consumedBy.map((consumer) => (
                    <Badge key={consumer}>{consumer}</Badge>
                  ))}
                  <Badge>{event.persistenceRequired ? 'Persistent' : 'Transient'}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Progressive Cutover Plan</h3>
          <div className="mt-5 space-y-3">
            {phase38CutoverStages.map((stage) => (
              <article key={stage.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{stage.stage}</p>
                    <p className="mt-2 text-sm text-slate-600">{stage.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {stage.blockedBy.length > 0 ? (
                        stage.blockedBy.map((blocker) => <Badge key={blocker}>{blocker}</Badge>)
                      ) : (
                        <Badge>No blockers</Badge>
                      )}
                    </div>
                  </div>
                  <Badge>{stage.readiness}%</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Runtime Guardrails</h3>
          <div className="mt-5 space-y-3">
            {phase38RuntimeGuardrails.map((guardrail) => (
              <article key={guardrail.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{guardrail.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{guardrail.protection}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{guardrail.enabled ? 'Enabled' : 'Disabled'}</Badge>
                    <Badge>{guardrail.riskReduced}</Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">Runtime Readiness Scores</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {phase38RuntimeScores.map((score) => (
            <article key={score.label} className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{score.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">{score.score}%</p>
              <p className="mt-2 text-sm text-slate-600">{score.recommendation}</p>
              <div className="mt-3">
                <Badge>{score.status}</Badge>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase38RuntimeBridgeWorkspace;
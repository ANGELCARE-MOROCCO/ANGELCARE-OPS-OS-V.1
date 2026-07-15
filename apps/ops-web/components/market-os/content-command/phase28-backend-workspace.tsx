'use client';

import React, { useMemo } from 'react';
import {
  phase28BackendReadiness,
  phase28MutationGuards,
  phase28ProviderContracts,
  phase28RepositoryAdapters,
  phase28SyncQueue,
} from './phase28-backend-data';
import {
  getPhase28BackendReadyRepositories,
  getPhase28FailedSyncItems,
  getPhase28OverallBackendReadiness,
  getPhase28ReadyProviders,
} from './phase28-backend-helpers';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase28BackendPrepWorkspace(): React.ReactElement {
  const readyProviders = useMemo(
    () => getPhase28ReadyProviders(phase28ProviderContracts),
    []
  );

  const backendRepositories = useMemo(
    () => getPhase28BackendReadyRepositories(phase28RepositoryAdapters),
    []
  );

  const failedSyncItems = useMemo(
    () => getPhase28FailedSyncItems(phase28SyncQueue),
    []
  );

  const readiness = useMemo(
    () => getPhase28OverallBackendReadiness(phase28BackendReadiness),
    []
  );

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Content Command Center
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 28 Backend Integration Preparation
        </h2>

        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Backend-ready preparation architecture for provider contracts,
          repository adapters, synchronization queues, mutation safety,
          realtime preparation, and operational backend readiness.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Backend Readiness
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{readiness}%</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ready Providers
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {readyProviders.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Backend Repositories
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {backendRepositories.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Failed Sync Items
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {failedSyncItems.length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Provider Contracts</h3>

          <div className="mt-5 space-y-3">
            {phase28ProviderContracts.map((provider) => (
              <article key={provider.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">
                      {provider.provider}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {provider.category}
                    </p>
                    <p className="mt-3 text-sm text-slate-600">
                      {provider.notes}
                    </p>
                  </div>

                  <Badge>{provider.status}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Repository Adapters</h3>

          <div className="mt-5 space-y-3">
            {phase28RepositoryAdapters.map((repository) => (
              <article key={repository.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">
                      {repository.entity}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {repository.methods.map((method) => (
                        <Badge key={method}>{method}</Badge>
                      ))}
                    </div>
                  </div>

                  <Badge>
                    {repository.backendReady ? 'Backend-ready' : 'Pending'}
                  </Badge>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Synchronization Queue</h3>

          <div className="mt-5 space-y-3">
            {phase28SyncQueue.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">
                      {item.entity}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {item.action}
                    </p>

                    <p className="mt-3 text-sm text-slate-600">
                      Retries: {item.retries}
                    </p>
                  </div>

                  <Badge>{item.state}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Mutation Guards</h3>

          <div className="mt-5 space-y-3">
            {phase28MutationGuards.map((guard) => (
              <article key={guard.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">
                      {guard.title}
                    </p>

                    <p className="mt-3 text-sm text-slate-600">
                      {guard.protection}
                    </p>
                  </div>

                  <Badge>{guard.enabled ? 'Enabled' : 'Disabled'}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">
          Backend Readiness Dashboard
        </h3>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {phase28BackendReadiness.map((item) => (
            <article key={item.label} className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {item.label}
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-950">
                {item.percent}%
              </p>

              <p className="mt-2 text-sm text-slate-600">
                {item.detail}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase28BackendPrepWorkspace;
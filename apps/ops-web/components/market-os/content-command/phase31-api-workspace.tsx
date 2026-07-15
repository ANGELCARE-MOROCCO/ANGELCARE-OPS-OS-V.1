'use client';

import React, { useMemo } from 'react';
import {
  phase31ApiContracts,
  phase31ApiEndpoints,
  phase31ApiQaChecks,
  phase31ServerActionPlans,
} from './phase31-api-data';
import {
  getPhase31AuditedServerActions,
  getPhase31FailedQaChecks,
  getPhase31HighRiskEndpoints,
  getPhase31ReadyEndpoints,
} from './phase31-api-helpers';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase31ApiContractsWorkspace(): React.ReactElement {
  const readyEndpoints = useMemo(() => getPhase31ReadyEndpoints(phase31ApiEndpoints), []);
  const highRiskEndpoints = useMemo(() => getPhase31HighRiskEndpoints(phase31ApiEndpoints), []);
  const failedQa = useMemo(() => getPhase31FailedQaChecks(phase31ApiQaChecks), []);
  const auditedActions = useMemo(() => getPhase31AuditedServerActions(phase31ServerActionPlans), []);

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Content Command Center
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 31 API Contracts
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          API planning layer for endpoint contracts, request and response schemas,
          server action readiness, validation boundaries, and backend QA checks. No API routes are created here.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Endpoints</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{phase31ApiEndpoints.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ready</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{readyEndpoints.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">High Risk</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{highRiskEndpoints.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Failed QA</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{failedQa.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Endpoint Registry</h3>
          <div className="mt-5 space-y-3">
            {phase31ApiEndpoints.map((endpoint) => (
              <article key={endpoint.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{endpoint.method} {endpoint.path}</p>
                    <p className="mt-2 text-sm text-slate-600">{endpoint.purpose}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{endpoint.risk}</Badge>
                    <Badge>{endpoint.readyForImplementation ? 'Ready' : 'Planned'}</Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Server Action Plan</h3>
          <p className="mt-1 text-sm text-slate-600">Audited actions: {auditedActions.length}</p>
          <div className="mt-5 space-y-3">
            {phase31ServerActionPlans.map((action) => (
              <article key={action.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{action.actionName}</p>
                    <p className="mt-1 text-xs text-slate-500">{action.entity} · {action.mutation}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{action.requiresAudit ? 'Audit' : 'No audit'}</Badge>
                    <Badge>{action.requiresPermission ? 'Permission' : 'Open'}</Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Request / Response Contracts</h3>
          <div className="mt-5 space-y-3">
            {phase31ApiContracts.map((contract) => (
              <article key={contract.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{contract.endpointId}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Request</p>
                    <p className="mt-1 text-sm text-slate-600">{contract.requestShape.join(', ')}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Response</p>
                    <p className="mt-1 text-sm text-slate-600">{contract.responseShape.join(', ')}</p>
                  </div>
                  <Badge>{contract.validationRequired ? 'Validation' : 'No validation'}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">API QA Checks</h3>
          <div className="mt-5 space-y-3">
            {phase31ApiQaChecks.map((check) => (
              <article key={check.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{check.label}</p>
                    <p className="mt-2 text-sm text-slate-600">{check.blocker}</p>
                  </div>
                  <Badge>{check.passed ? 'Passed' : 'Blocked'}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase31ApiContractsWorkspace;
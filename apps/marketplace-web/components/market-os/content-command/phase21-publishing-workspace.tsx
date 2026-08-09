'use client';

import React, { useMemo, useState } from 'react';
import {
  phase21ChannelRules,
  phase21ComplianceChecks,
  phase21PublicationQueue,
  phase21PublishingHandoffs,
} from './phase21-publishing-data';
import {
  getBlockedPhase21Publications,
  getFailedPhase21Checks,
  getPhase21PublicationRisk,
  getPhase21StatusLabel,
  getReadyPhase21Publications,
} from './phase21-publishing-helpers';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase21PublishingWorkspace(): React.ReactElement {
  const [selectedPublicationId, setSelectedPublicationId] = useState<string>(phase21PublicationQueue[0]?.id ?? '');

  const blocked = useMemo(() => getBlockedPhase21Publications(phase21PublicationQueue), []);
  const ready = useMemo(() => getReadyPhase21Publications(phase21PublicationQueue), []);
  const failedChecks = useMemo(() => getFailedPhase21Checks(phase21ComplianceChecks), []);

  const selectedChecks = useMemo(
    () => phase21ComplianceChecks.filter((check) => check.publicationId === selectedPublicationId),
    [selectedPublicationId]
  );

  const selectedHandoffs = useMemo(
    () => phase21PublishingHandoffs.filter((handoff) => handoff.publicationId === selectedPublicationId),
    [selectedPublicationId]
  );

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Content Command Center
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 21 Publishing Execution
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Publishing readiness layer for publication queues, channel rules, compliance checks,
          scheduling windows, and final publishing handoffs.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Queued Items</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{phase21PublicationQueue.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ready</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{ready.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Blocked</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{blocked.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Failed Checks</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{failedChecks.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Publication Queue</h3>
          <div className="mt-5 space-y-3">
            {phase21PublicationQueue.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedPublicationId(item.id)}
                className="w-full rounded-2xl border border-slate-100 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.channel} · {item.campaign} · Owner: {item.owner} · Window: {item.scheduledWindow}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{getPhase21StatusLabel(item.status)}</Badge>
                    <Badge>{getPhase21PublicationRisk(item)} risk</Badge>
                    <Badge>{item.readiness}%</Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">Selected Compliance Checks</h3>
            <div className="mt-5 space-y-3">
              {selectedChecks.length > 0 ? (
                selectedChecks.map((check) => (
                  <article key={check.id} className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{check.label}</p>
                        <p className="mt-1 text-xs text-slate-500">Severity: {check.severity}</p>
                      </div>
                      <Badge>{check.passed ? 'Passed' : 'Failed'}</Badge>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                  No compliance checks attached to this publication yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">Publishing Handoff</h3>
            <div className="mt-5 space-y-3">
              {selectedHandoffs.length > 0 ? (
                selectedHandoffs.map((handoff) => (
                  <article key={handoff.id} className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">
                          {handoff.fromOwner} → {handoff.toOwner}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">{handoff.notes}</p>
                      </div>
                      <Badge>{handoff.state}</Badge>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                  No handoff attached to this publication yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">Channel Publishing Rules</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {phase21ChannelRules.map((rule) => (
            <article key={rule.id} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-950">{rule.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{rule.channel}</p>
                  <p className="mt-3 text-sm text-slate-600">{rule.description}</p>
                </div>
                <Badge>{rule.required ? 'Required' : 'Optional'}</Badge>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase21PublishingWorkspace;
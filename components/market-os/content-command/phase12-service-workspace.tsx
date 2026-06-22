'use client';

import React, { useMemo, useState } from 'react';
import { buildPhase12ExportPayload } from './phase12-import-export';
import { clearPhase12PayloadFromLocalStorage, readPhase12PayloadFromLocalStorage, savePhase12PayloadToLocalStorage } from './phase12-local-persistence';
import { listPhase12Activity, listPhase12Entities } from './phase12-repository';
import { phase12ServiceHealth } from './phase12-service-health';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase12ServiceWorkspace(): React.ReactElement {
  const entities = useMemo(() => listPhase12Entities(), []);
  const activity = useMemo(() => listPhase12Activity(), []);
  const [message, setMessage] = useState<string>('Service layer ready.');

  function handleSaveSnapshot(): void {
    const payload = buildPhase12ExportPayload();
    const saved = savePhase12PayloadToLocalStorage(payload);
    setMessage(saved ? `Snapshot saved locally with ${payload.entities.length} entities.` : 'Local storage is unavailable in this environment.');
  }

  function handleReadSnapshot(): void {
    const payload = readPhase12PayloadFromLocalStorage();
    setMessage(payload ? `Snapshot found from ${payload.exportedAt}.` : 'No local snapshot found.');
  }

  function handleClearSnapshot(): void {
    const cleared = clearPhase12PayloadFromLocalStorage();
    setMessage(cleared ? 'Local snapshot cleared.' : 'Local storage is unavailable in this environment.');
  }

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Content Command Center
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">Phase 12 Service Layer</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Integration-ready service foundation for repositories, local persistence, activity logs, import/export payloads, and service health.
        </p>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">
          {message}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-950">Repository Entities</h3>
              <p className="mt-1 text-sm text-slate-600">Typed repository layer ready for future backend mapping.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={handleSaveSnapshot} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                Save Snapshot
              </button>
              <button type="button" onClick={handleReadSnapshot} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                Read
              </button>
              <button type="button" onClick={handleClearSnapshot} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                Clear
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {entities.map((entity) => (
              <article key={entity.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{entity.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {entity.kind} · Owner: {entity.owner} · Updated: {entity.updatedAt}
                    </p>
                  </div>
                  <Badge>{entity.status}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">Activity Log</h3>
            <div className="mt-5 space-y-3">
              {activity.map((entry) => (
                <article key={entry.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{entry.message}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {entry.actor} · {entry.entityKind} · {entry.createdAt}
                      </p>
                    </div>
                    <Badge>{entry.verb}</Badge>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">Service Health</h3>
            <div className="mt-5 space-y-3">
              {phase12ServiceHealth.map((item) => (
                <article key={item.service} className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{item.service}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.notes}</p>
                    </div>
                    <Badge>{item.status}</Badge>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase12ServiceWorkspace;
'use client';

import React, { useMemo, useState } from 'react';
import type { Phase16BaseRecord, Phase16CreateRecordInput } from './phase16-data-types';
import { createPhase16MemoryAdapter } from './phase16-repository-adapter';
import { phase16SupabaseTableMap } from './phase16-supabase-mapping';
import { validatePhase16CreateInput } from './phase16-data-validation';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase16DataWorkspace(): React.ReactElement {
  const adapter = useMemo(() => createPhase16MemoryAdapter(), []);
  const [records, setRecords] = useState<Phase16BaseRecord[]>([]);
  const [message, setMessage] = useState<string>('Data readiness layer is ready.');
  const [draft, setDraft] = useState<Phase16CreateRecordInput>({
    kind: 'content_asset',
    title: '',
    owner: '',
    status: 'draft',
  });

  async function handleList(): Promise<void> {
    const result = await adapter.list();
    if (result.ok && result.data) {
      setRecords(result.data);
      setMessage(`Loaded ${result.data.length} records from the memory adapter.`);
    } else {
      setMessage(result.error ?? 'Unable to load records.');
    }
  }

  async function handleCreate(): Promise<void> {
    const validation = validatePhase16CreateInput(draft);
    if (!validation.ok) {
      setMessage(validation.error ?? 'Invalid input.');
      return;
    }

    const result = await adapter.create(draft);
    if (result.ok) {
      setMessage('Created record through typed CRUD adapter.');
      await handleList();
      setDraft({ kind: 'content_asset', title: '', owner: '', status: 'draft' });
    } else {
      setMessage(result.error ?? 'Create failed.');
    }
  }

  async function handleArchive(id: string): Promise<void> {
    const result = await adapter.archive(id);
    setMessage(result.ok ? 'Record archived through typed CRUD adapter.' : result.error ?? 'Archive failed.');
    await handleList();
  }

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-9500">
          Content Command Center
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">Phase 16 Data Readiness</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Typed CRUD contracts, repository adapter interface, in-memory service, validation helpers,
          and Supabase-ready table mapping.
        </p>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">
          {message}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Typed Create Contract</h3>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Kind</span>
              <select
                value={draft.kind}
                onChange={(event) => setDraft((current) => ({ ...current, kind: event.target.value as Phase16CreateRecordInput['kind'] }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              >
                {phase16SupabaseTableMap.map((item) => (
                  <option key={item.entityKind} value={item.entityKind}>{item.entityKind}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Title</span>
              <input
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                placeholder="Content record title"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Owner</span>
              <input
                value={draft.owner}
                onChange={(event) => setDraft((current) => ({ ...current, owner: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                placeholder="Assigned owner"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={handleCreate} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                Create via Adapter
              </button>
              <button type="button" onClick={handleList} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                Load Records
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Repository Records</h3>
          <div className="mt-5 space-y-3">
            {records.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                No records loaded yet. Use “Load Records” to test the adapter.
              </div>
            ) : (
              records.map((record) => (
                <article key={record.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{record.title}</p>
                      <p className="mt-1 text-xs text-slate-9500">
                        {record.kind} · Owner: {record.owner}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{record.status}</Badge>
                      <button type="button" onClick={() => void handleArchive(record.id)} className="rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        Archive
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">Supabase-Ready Table Mapping</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {phase16SupabaseTableMap.map((item) => (
            <article key={item.entityKind} className="rounded-2xl border border-slate-100 p-4">
              <p className="text-sm font-bold text-slate-950">{item.tableName}</p>
              <p className="mt-1 text-xs text-slate-9500">{item.entityKind}</p>
              <p className="mt-3 text-sm text-slate-600">{item.notes}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase16DataWorkspace;
'use client';

import React, { useMemo, useState } from 'react';
import { phase10FormFields, phase10ManagedEntities } from './phase10-management-data';
import type { Phase10EntityStatus, Phase10EntityType, Phase10ManagedEntity } from './phase10-management-types';
import { validatePhase10Entity } from './phase10-validation';

const entityTypes: Phase10EntityType[] = ['asset', 'deliverable', 'product_sheet', 'brand_asset', 'social_post'];
const statuses: Phase10EntityStatus[] = ['draft', 'review', 'approved', 'scheduled', 'published', 'archived'];

function SmallBadge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

function EmptyState(): React.ReactElement {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <p className="text-sm font-bold text-slate-950">No matching records</p>
      <p className="mt-1 text-sm text-slate-600">Adjust the filters or create a new managed content entity.</p>
    </div>
  );
}

export function ContentCommandPhase10ManagementWorkspace(): React.ReactElement {
  const [typeFilter, setTypeFilter] = useState<Phase10EntityType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<Phase10EntityStatus | 'all'>('all');
  const [draft, setDraft] = useState<Partial<Phase10ManagedEntity>>({
    title: '',
    owner: '',
    campaign: '',
    language: 'fr',
  });

  const filteredEntities = useMemo(() => {
    return phase10ManagedEntities.filter((entity) => {
      const typeMatch = typeFilter === 'all' || entity.type === typeFilter;
      const statusMatch = statusFilter === 'all' || entity.status === statusFilter;
      return typeMatch && statusMatch;
    });
  }, [typeFilter, statusFilter]);

  const validation = validatePhase10Entity(draft);

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-9500">
          Content Command Center
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">Phase 10 Management Forms</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Create/edit form shell, validation helpers, entity manager table, and safer empty/error states for production workflows.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Create / Edit Form Shell</h3>
          <p className="mt-1 text-sm text-slate-600">Reusable form structure for assets, deliverables, product sheets, brand assets, and social posts.</p>

          <div className="mt-5 space-y-4">
            {phase10FormFields.map((field) => (
              <label key={String(field.key)} className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-9500">
                  {field.label}{field.required ? ' *' : ''}
                </span>
                <input
                  value={String(draft[field.key] ?? '')}
                  onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                  placeholder={field.placeholder}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-950">
              Validation: {validation.valid ? 'Ready' : 'Needs attention'}
            </p>
            {validation.errors.length > 0 ? (
              <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
                {validation.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">This form is ready to connect to a save/create workflow.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-950">Managed Content Entities</h3>
              <p className="mt-1 text-sm text-slate-600">Filterable management table for current content records.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as Phase10EntityType | 'all')}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              >
                <option value="all">All types</option>
                {entityTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as Phase10EntityStatus | 'all')}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              >
                <option value="all">All statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {filteredEntities.length === 0 ? (
              <EmptyState />
            ) : (
              filteredEntities.map((entity) => (
                <article key={entity.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{entity.title}</p>
                      <p className="mt-1 text-xs text-slate-9500">
                        {entity.type} · Owner: {entity.owner} · Updated: {entity.updatedAt}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <SmallBadge>{entity.status}</SmallBadge>
                      {entity.language ? <SmallBadge>{entity.language.toUpperCase()}</SmallBadge> : null}
                    </div>
                  </div>
                  {entity.campaign ? (
                    <p className="mt-3 text-sm text-slate-600">Campaign: {entity.campaign}</p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase10ManagementWorkspace;
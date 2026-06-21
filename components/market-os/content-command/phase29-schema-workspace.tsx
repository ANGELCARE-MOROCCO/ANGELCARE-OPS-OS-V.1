'use client';

import React, { useMemo, useState } from 'react';
import {
  phase29MigrationReadiness,
  phase29Relationships,
  phase29RlsPolicies,
  phase29TableBlueprints,
} from './phase29-schema-data';
import {
  getPhase29AuditRequiredTables,
  getPhase29AverageMigrationReadiness,
  getPhase29PendingRlsPolicies,
  getPhase29RlsRequiredTables,
} from './phase29-schema-helpers';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase29SchemaWorkspace(): React.ReactElement {
  const [selectedTableId, setSelectedTableId] = useState<string>(phase29TableBlueprints[0]?.id ?? '');

  const selectedTable = useMemo(
    () => phase29TableBlueprints.find((table) => table.id === selectedTableId),
    [selectedTableId]
  );

  const rlsTables = useMemo(() => getPhase29RlsRequiredTables(phase29TableBlueprints), []);
  const auditTables = useMemo(() => getPhase29AuditRequiredTables(phase29TableBlueprints), []);
  const pendingPolicies = useMemo(() => getPhase29PendingRlsPolicies(phase29RlsPolicies), []);
  const readiness = useMemo(() => getPhase29AverageMigrationReadiness(phase29MigrationReadiness), []);

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-9500">
          Content Command Center
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 29 Supabase Schema Blueprint
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Database planning layer for table blueprints, field definitions, relationships,
          RLS policy planning, audit persistence, and migration readiness.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Migration Readiness</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{readiness}%</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Tables</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{phase29TableBlueprints.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">RLS Tables</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{rlsTables.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Pending Policies</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{pendingPolicies.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Table Registry</h3>
          <div className="mt-5 space-y-3">
            {phase29TableBlueprints.map((table) => (
              <button
                key={table.id}
                type="button"
                onClick={() => setSelectedTableId(table.id)}
                className="w-full rounded-2xl border border-slate-100 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{table.tableName}</p>
                    <p className="mt-2 text-sm text-slate-600">{table.purpose}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{table.rlsRequired ? 'RLS' : 'Open'}</Badge>
                    <Badge>{table.auditRequired ? 'Audit' : 'No audit'}</Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Selected Table Columns</h3>
          {selectedTable ? (
            <div className="mt-5 space-y-3">
              {selectedTable.columns.map((column) => (
                <article key={column.name} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{column.name}</p>
                      <p className="mt-2 text-sm text-slate-600">{column.notes}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{column.type}</Badge>
                      <Badge>{column.required ? 'Required' : 'Optional'}</Badge>
                      <Badge>{column.indexed ? 'Indexed' : 'No index'}</Badge>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-600">No table selected.</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Relationship Map</h3>
          <div className="mt-5 space-y-3">
            {phase29Relationships.map((relationship) => (
              <article key={relationship.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-sm font-bold text-slate-950">
                  {relationship.fromTable} → {relationship.toTable}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge>{relationship.relation}</Badge>
                </div>
                <p className="mt-3 text-sm text-slate-600">{relationship.notes}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">RLS Policy Plan</h3>
          <div className="mt-5 space-y-3">
            {phase29RlsPolicies.map((policy) => (
              <article key={policy.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{policy.policyName}</p>
                    <p className="mt-1 text-xs text-slate-9500">{policy.tableName} · {policy.action}</p>
                    <p className="mt-3 text-sm text-slate-600">{policy.ruleDescription}</p>
                  </div>
                  <Badge>{policy.readyForMigration ? 'Ready' : 'Planned'}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">Migration Readiness</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {phase29MigrationReadiness.map((item) => (
            <article key={item.label} className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">{item.percent}%</p>
              <p className="mt-2 text-sm text-slate-600">{item.blocker}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase29SchemaWorkspace;
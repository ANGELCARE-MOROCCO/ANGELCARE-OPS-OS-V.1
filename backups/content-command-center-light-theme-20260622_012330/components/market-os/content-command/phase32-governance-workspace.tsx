'use client';

import React, { useMemo, useState } from 'react';
import {
  phase32ActionPermissions,
  phase32ApprovalAuthorities,
  phase32GovernancePolicies,
  phase32GovernanceReadiness,
  phase32PermissionMatrix,
  phase32VisibilityScopes,
} from './phase32-governance-data';
import {
  getPhase32AverageGovernanceReadiness,
  getPhase32CapabilitiesForRole,
  getPhase32EnabledPolicies,
  getPhase32HighRiskActions,
} from './phase32-governance-helpers';
import type { Phase32Role } from './phase32-governance-types';

const roles: Phase32Role[] = [
  'viewer',
  'creator',
  'reviewer',
  'publisher',
  'brand_manager',
  'marketing_director',
  'executive',
  'admin',
];

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase32GovernanceWorkspace(): React.ReactElement {
  const [selectedRole, setSelectedRole] = useState<Phase32Role>('creator');

  const selectedCapabilities = useMemo(
    () => getPhase32CapabilitiesForRole(phase32PermissionMatrix, selectedRole),
    [selectedRole]
  );

  const highRiskActions = useMemo(
    () => getPhase32HighRiskActions(phase32ActionPermissions),
    []
  );

  const enabledPolicies = useMemo(
    () => getPhase32EnabledPolicies(phase32GovernancePolicies),
    []
  );

  const readiness = useMemo(
    () => getPhase32AverageGovernanceReadiness(phase32GovernanceReadiness),
    []
  );

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-9500">
          Content Command Center
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 32 Permission Governance
        </h2>

        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Operational governance architecture for permission matrix planning,
          role capability mapping, approval authority, visibility scopes, audit access,
          and enterprise workflow safety.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">
              Governance Readiness
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{readiness}%</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">
              Roles
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{phase32PermissionMatrix.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">
              High-risk Actions
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{highRiskActions.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">
              Enabled Policies
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{enabledPolicies.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Role Selector</h3>
          <div className="mt-5 space-y-2">
            {roles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Capabilities for {selectedRole}</h3>
          <div className="mt-5 flex flex-wrap gap-2">
            {selectedCapabilities.map((capability) => (
              <Badge key={capability}>{capability}</Badge>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            {phase32PermissionMatrix.map((row) => (
              <article key={row.role} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-sm font-bold text-slate-950">{row.role}</p>
                <p className="mt-2 text-sm text-slate-600">{row.description}</p>
                <p className="mt-3 text-xs text-slate-9500">{row.capabilities.length} capabilities</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Action-level Permissions</h3>
          <div className="mt-5 space-y-3">
            {phase32ActionPermissions.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{item.action}</p>
                    <p className="mt-1 text-xs text-slate-9500">
                      Capability: {item.requiredCapability} · Minimum role: {item.minimumRole}
                    </p>
                  </div>
                  <Badge>{item.risk}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Approval Authority</h3>
          <div className="mt-5 space-y-3">
            {phase32ApprovalAuthorities.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-sm font-bold text-slate-950">{item.area}</p>
                <p className="mt-1 text-xs text-slate-9500">
                  Required: {item.requiredRole} · Escalates to: {item.canEscalateTo}
                </p>
                <p className="mt-3 text-sm text-slate-600">{item.notes}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Visibility Scopes</h3>
          <div className="mt-5 space-y-3">
            {phase32VisibilityScopes.map((scope) => (
              <article key={scope.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-sm font-bold text-slate-950">{scope.scope}</p>
                <p className="mt-2 text-sm text-slate-600">{scope.notes}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {scope.allowedRoles.map((role) => (
                    <Badge key={role}>{role}</Badge>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Governance Policies</h3>
          <div className="mt-5 space-y-3">
            {phase32GovernancePolicies.map((policy) => (
              <article key={policy.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{policy.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{policy.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{policy.risk}</Badge>
                    <Badge>{policy.enabled ? 'Enabled' : 'Disabled'}</Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">Governance Readiness</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {phase32GovernanceReadiness.map((item) => (
            <article key={item.label} className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">
                {item.label}
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-950">{item.percent}%</p>
              <p className="mt-2 text-sm text-slate-600">{item.blocker}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase32GovernanceWorkspace;
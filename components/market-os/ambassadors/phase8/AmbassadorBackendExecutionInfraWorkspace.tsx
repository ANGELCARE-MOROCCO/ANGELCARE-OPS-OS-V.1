"use client";

import * as React from "react";
import { ambassadorRolePermissions } from "./ambassador-permissions";
import { ambassadorSupabaseSchemaSql } from "./ambassador-supabase-schema";
import type { AmbassadorPermission, AmbassadorRole } from "./ambassador-backend-types";

const productionBlocks = [
  {
    title: "Server service layer",
    description: "Typed service functions for creating ambassadors, reviewing proofs, and approving payouts.",
    status: "ready",
  },
  {
    title: "Permission guard layer",
    description: "Role-to-permission map for protecting sensitive ambassador actions.",
    status: "ready",
  },
  {
    title: "Audit trail model",
    description: "Immutable audit log generator for approvals, rejects, sync operations, and payout decisions.",
    status: "ready",
  },
  {
    title: "Supabase schema blueprint",
    description: "SQL-ready table foundation for ambassadors, proofs, payouts, and audit logs.",
    status: "ready",
  },
];

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {children}
    </span>
  );
}

function PermissionList({ role, permissions }: { role: AmbassadorRole; permissions: AmbassadorPermission[] }) {
  return (
    <article className="rounded-2xl border border-slate-100 p-5">
      <h3 className="font-bold text-slate-950">{role}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {permissions.map((permission) => (
          <Badge key={`${role}-${permission}`}>{permission}</Badge>
        ))}
      </div>
    </article>
  );
}

export default function AmbassadorBackendExecutionInfraWorkspace() {
  return (
    <section className="space-y-6 p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <Badge>Phase 8 · Backend Execution Infrastructure</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
          Ambassador Backend Execution Infrastructure
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
          This phase gives the Ambassador unit backend-ready foundations:
          typed server service functions, permissions, audit logs, validation,
          payout safety, proof review control, and a Supabase schema blueprint.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {productionBlocks.map((block) => (
          <article key={block.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Badge>{block.status}</Badge>
            <h2 className="mt-4 font-bold text-slate-950">{block.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{block.description}</p>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-950">Role permission matrix</h2>
          <p className="mt-1 text-sm text-slate-9500">Use this to prevent unsafe ambassador, proof, reward, and payout actions.</p>
        </div>
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {(Object.entries(ambassadorRolePermissions) as [AmbassadorRole, AmbassadorPermission[]][]).map(([role, permissions]) => (
            <PermissionList key={role} role={role} permissions={permissions} />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-950">Supabase schema blueprint</h2>
          <p className="mt-1 text-sm text-slate-9500">
            SQL-ready foundation. Review before running in production.
          </p>
        </div>
        <pre className="max-h-[460px] overflow-auto whitespace-pre-wrap p-5 text-xs leading-6 text-slate-700">
          {ambassadorSupabaseSchemaSql}
        </pre>
      </div>
    </section>
  );
}

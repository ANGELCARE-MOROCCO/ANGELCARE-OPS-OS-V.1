'use client';

import * as React from 'react';

const layers = [
  ['Supabase CRUD', 'ready to connect', 'Schema, repositories, and API GET routes prepared.'],
  ['Authenticated APIs', 'guarded', 'Write routes blocked until actor context is wired.'],
  ['Real Permissions', 'modeled', 'RBAC matrix and guards prepared for server enforcement.'],
  ['Realtime', 'registry ready', 'Channel registry and subscription permission checks prepared.'],
  ['Queues/Workers', 'foundation', 'Queue job model, retry rules, and persistence schema prepared.'],
  ['Notifications', 'foundation', 'Queued notification model prepared; provider integration still required.'],
  ['AI Runtime', 'governed', 'AI action records and approval blocking logic prepared.'],
  ['Telemetry', 'foundation', 'Telemetry table and event builder prepared.'],
  ['Security Hardening', 'guarded', 'High-risk actions blocked by default until full auth is connected.'],
  ['Stabilization', 'tooling ready', 'Scripts and release checklists included.']
];

function Badge({ children }: { children: React.ReactNode }) {
  return <span className='inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700'>{children}</span>;
}

export default function FinalProductionTransitionDashboard() {
  return (
    <section className='space-y-6 p-6'>
      <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
        <Badge>Final Production Transition</Badge>
        <h1 className='mt-4 text-3xl font-bold text-slate-950'>Ambassador OS Final Production Transition Dashboard</h1>
        <p className='mt-3 max-w-4xl text-sm leading-6 text-slate-600'>
          One-shot production transition pack covering real connection foundations, stabilization,
          simplification, security hardening, AI runtime persistence, queues, realtime, telemetry,
          and deployment control.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {layers.map(([title, status, detail]) => (
          <article key={title} className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
            <Badge>{status}</Badge>
            <h2 className='mt-4 font-bold text-slate-950'>{title}</h2>
            <p className='mt-2 text-sm leading-6 text-slate-600'>{detail}</p>
          </article>
        ))}
      </div>

      <div className='rounded-2xl border border-amber-200 bg-amber-50 p-5'>
        <h2 className='font-bold text-amber-950'>Critical production rule</h2>
        <p className='mt-2 text-sm leading-6 text-amber-900'>
          High-risk writes remain blocked until real authenticated actor context, RBAC, RLS,
          audit logging, and approval flows are tested.
        </p>
      </div>
    </section>
  );
}

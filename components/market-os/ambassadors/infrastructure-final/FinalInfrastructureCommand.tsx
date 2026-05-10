'use client';

import * as React from 'react';

const layers = [
  { title: 'Supabase Core', status: 'blueprint', detail: 'Tables, RLS, audit logs, AI memory, jobs, notifications.' },
  { title: 'API Layer', status: 'placeholder', detail: 'Profiles, missions, proofs, payouts, AI actions, events.' },
  { title: 'Realtime Layer', status: 'registry', detail: 'Channels prepared for alerts, missions, proofs, revenue, AI actions.' },
  { title: 'Queue Layer', status: 'foundation', detail: 'Job structure, retry rules, worker readiness.' },
  { title: 'AI Runtime', status: 'governed', detail: 'Human approval rules for high-risk AI actions.' },
  { title: 'Observability', status: 'foundation', detail: 'Telemetry event model and runtime diagnostics.' }
];

function Badge({ children }: { children: React.ReactNode }) {
  return <span className='inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700'>{children}</span>;
}

export default function FinalInfrastructureCommand() {
  return (
    <section className='space-y-6 p-6'>
      <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
        <Badge>Secondary Complex Infrastructure · One Shot</Badge>
        <h1 className='mt-4 text-3xl font-bold text-slate-950'>Ambassador OS Final Infrastructure Command</h1>
        <p className='mt-3 max-w-4xl text-sm leading-6 text-slate-600'>
          Massive backend and infrastructure starter pack for moving Ambassador OS from advanced architecture
          toward real operational infrastructure. Review everything before connecting live services.
        </p>
      </div>

      <div className='grid gap-4 lg:grid-cols-3'>
        {layers.map((layer) => (
          <article key={layer.title} className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
            <Badge>{layer.status}</Badge>
            <h2 className='mt-4 font-bold text-slate-950'>{layer.title}</h2>
            <p className='mt-2 text-sm leading-6 text-slate-600'>{layer.detail}</p>
          </article>
        ))}
      </div>

      <div className='rounded-2xl border border-amber-200 bg-amber-50 p-5'>
        <h2 className='font-bold text-amber-950'>Important production warning</h2>
        <p className='mt-2 text-sm leading-6 text-amber-900'>
          This pack is intentionally safe: high-risk write actions return 501 until you connect real authentication,
          Supabase persistence, RBAC, audit logging, and human approval flows.
        </p>
      </div>
    </section>
  );
}

'use client';

import * as React from 'react';
import { ambassadorEnterpriseSnapshot } from './ambassador-enterprise-registry';

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) {
  const tones = {
    neutral: 'border-slate-200 bg-slate-50 text-slate-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-rose-200 bg-rose-50 text-rose-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700'
  };
  return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export default function AmbassadorBackendReadinessWorkspace() {
  return (
    <section className='space-y-6 p-6'>
      <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
        <Badge tone='info'>Backend Readiness</Badge>
        <h1 className='mt-4 text-3xl font-bold text-slate-950'>Ambassador Backend Connector Readiness</h1>
        <p className='mt-3 max-w-4xl text-sm leading-6 text-slate-600'>
          Safe connector readiness notes and engineering transition map for Supabase, APIs, realtime,
          queues, AI memory, webhooks, and notification infrastructure.
        </p>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        {ambassadorEnterpriseSnapshot.connectors.map((connector) => (
          <article key={connector.id} className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <h2 className='font-bold text-slate-950'>{connector.name}</h2>
                <p className='mt-1 text-sm text-slate-500'>{connector.target}</p>
              </div>
              <Badge tone={connector.status === 'connected' ? 'success' : connector.status === 'blocked' ? 'danger' : 'warning'}>
                {connector.status}
              </Badge>
            </div>
            <p className='mt-4 text-sm text-slate-600'>{connector.safetyNote}</p>
            <p className='mt-3 text-sm font-medium text-slate-700'>{connector.nextEngineeringStep}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

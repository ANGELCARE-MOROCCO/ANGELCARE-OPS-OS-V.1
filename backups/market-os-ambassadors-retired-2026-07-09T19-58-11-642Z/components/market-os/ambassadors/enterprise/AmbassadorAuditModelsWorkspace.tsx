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

export default function AmbassadorAuditModelsWorkspace() {
  return (
    <section className='space-y-6 p-6'>
      <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
        <Badge tone='info'>Audit Models</Badge>
        <h1 className='mt-4 text-3xl font-bold text-slate-950'>Ambassador Audit & Event Models</h1>
        <p className='mt-3 max-w-4xl text-sm leading-6 text-slate-600'>
          Required event models for payout approvals, proof reviews, AI actions, mission assignment,
          and future operational traceability.
        </p>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        {ambassadorEnterpriseSnapshot.auditModels.map((model) => (
          <article key={model.id} className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <h2 className='font-bold text-slate-950'>{model.eventName}</h2>
                <p className='mt-1 text-sm text-slate-9500'>{model.entity}</p>
              </div>
              <Badge tone={model.retention === 'permanent' ? 'danger' : 'info'}>{model.retention}</Badge>
            </div>
            <p className='mt-4 text-sm text-slate-600'>Required fields: {model.requiredFields.join(', ')}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

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

export default function AmbassadorProductionTransitionWorkspace() {
  return (
    <section className='space-y-6 p-6'>
      <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
        <Badge tone='warning'>Production Transition</Badge>
        <h1 className='mt-4 text-3xl font-bold text-slate-950'>Ambassador OS Production Transition Checklist</h1>
        <p className='mt-3 max-w-4xl text-sm leading-6 text-slate-600'>
          The safe path from architecture to real backend infrastructure. This does not mutate your database or live systems.
        </p>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        {ambassadorEnterpriseSnapshot.checklist.map((item) => (
          <article key={item.id} className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <h2 className='font-bold text-slate-950'>{item.title}</h2>
                <p className='mt-1 text-sm text-slate-500'>{item.area}</p>
              </div>
              <Badge tone={item.status === 'passed' ? 'success' : item.status === 'blocked' ? 'danger' : 'warning'}>{item.status}</Badge>
            </div>
            <p className='mt-4 text-sm text-slate-600'>{item.instruction}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

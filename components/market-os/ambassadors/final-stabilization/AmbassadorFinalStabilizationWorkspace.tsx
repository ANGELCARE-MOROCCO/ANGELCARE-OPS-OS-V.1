'use client';

import * as React from 'react';
import { finalStabilizationSnapshot } from './final-stabilization-data';
import { getFinalStabilizationMetrics } from './final-stabilization-engine';

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

function MetricCard({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <article className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
      <p className='text-sm text-slate-500'>{label}</p>
      <p className='mt-2 text-3xl font-bold text-slate-950'>{value}</p>
      <p className='mt-2 text-sm text-slate-500'>{helper}</p>
    </article>
  );
}

export default function AmbassadorFinalStabilizationWorkspace() {
  const snapshot = finalStabilizationSnapshot;
  const metrics = getFinalStabilizationMetrics(snapshot);

  return (
    <section className='space-y-6 p-6'>
      <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
        <Badge tone='info'>Final Stabilization Ultra Pack</Badge>
        <h1 className='mt-4 text-3xl font-bold text-slate-950'>Ambassador OS Stabilization Control Center</h1>
        <p className='mt-3 max-w-4xl text-sm leading-6 text-slate-600'>
          Final control layer for route validation, build safety, backend readiness,
          production transition, navigation consolidation, security gating, and deployment QA.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard label='Stabilization score' value={`${metrics.stabilizationScore}%`} helper='Estimated readiness after final checks.' />
        <MetricCard label='Checks' value={metrics.totalChecks} helper={`${metrics.criticalChecks} critical checks.`} />
        <MetricCard label='Pending' value={metrics.pending} helper={`${metrics.warnings} warning check(s).`} />
        <MetricCard label='Sidebar routes' value={metrics.sidebarRoutes} helper='Recommended exposed routes only.' />
      </div>

      <div className='grid gap-6 xl:grid-cols-[1.1fr_0.9fr]'>
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>Final stabilization checklist</h2>
          </div>
          <div className='divide-y divide-slate-100'>
            {snapshot.checks.map((check) => (
              <article key={check.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold text-slate-950'>{check.title}</h3>
                    <p className='mt-1 text-sm text-slate-500'>{check.area} · {check.priority}</p>
                  </div>
                  <Badge tone={check.status === 'passed' ? 'success' : check.status === 'failed' ? 'danger' : check.status === 'warning' ? 'warning' : 'info'}>
                    {check.status}
                  </Badge>
                </div>
                <p className='mt-3 text-sm text-slate-600'>{check.instruction}</p>
              </article>
            ))}
          </div>
        </div>

        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>Recommended navigation registry</h2>
          </div>
          <div className='divide-y divide-slate-100'>
            {snapshot.routes.map((route) => (
              <article key={route.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold text-slate-950'>{route.label}</h3>
                    <p className='mt-1 text-sm text-slate-500'>{route.group}</p>
                  </div>
                  <Badge tone={route.shouldExposeInSidebar ? 'success' : 'neutral'}>
                    {route.shouldExposeInSidebar ? 'sidebar' : 'hidden'}
                  </Badge>
                </div>
                <p className='mt-2 text-xs font-medium text-slate-500'>{route.href}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

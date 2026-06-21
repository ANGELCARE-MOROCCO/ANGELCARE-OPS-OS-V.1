'use client';

import * as React from 'react';
import { productionHardeningSnapshot } from './production-hardening-data';
import { getProductionHardeningMetrics } from './production-hardening-engine';

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
      <p className='text-sm text-slate-9500'>{label}</p>
      <p className='mt-2 text-3xl font-bold text-slate-950'>{value}</p>
      <p className='mt-2 text-sm text-slate-9500'>{helper}</p>
    </article>
  );
}

export default function AmbassadorProductionHardeningWorkspace() {
  const snapshot = productionHardeningSnapshot;
  const metrics = getProductionHardeningMetrics(snapshot);

  return (
    <section className='space-y-6 p-6'>
      <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
        <Badge tone='info'>Phase 22 · Production Hardening</Badge>
        <h1 className='mt-4 text-3xl font-bold text-slate-950'>
          Ambassador Production Hardening & Release Readiness
        </h1>
        <p className='mt-3 max-w-4xl text-sm leading-6 text-slate-600'>
          Build-safety, route coverage, governance checks, release gates, deployment diagnostics,
          and production readiness scoring for the Ambassador OS.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard label='Production readiness' value={`${metrics.productionReadinessScore}%`} helper='Computed from diagnostics, routes, build checks, and release gates.' />
        <MetricCard label='Available routes' value={metrics.availableRoutes} helper='Ambassador routes currently mapped.' />
        <MetricCard label='Warnings' value={metrics.warnings} helper={`${metrics.failed} failed check(s).`} />
        <MetricCard label='Release blockers' value={metrics.releaseBlockers} helper='Must be cleared before production push.' />
      </div>

      <div className='grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>Production diagnostics</h2>
          </div>
          <div className='divide-y divide-slate-100'>
            {snapshot.diagnostics.map((item) => (
              <article key={item.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold text-slate-950'>{item.title}</h3>
                    <p className='mt-1 text-sm text-slate-9500'>{item.area}</p>
                  </div>
                  <Badge tone={item.status === 'passed' ? 'success' : item.severity === 'critical' ? 'danger' : 'warning'}>
                    {item.status}
                  </Badge>
                </div>
                <p className='mt-3 text-sm text-slate-600'>{item.recommendation}</p>
              </article>
            ))}
          </div>
        </div>

        <div className='space-y-6'>
          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>Release gates</h2>
            </div>
            <div className='divide-y divide-slate-100'>
              {snapshot.releaseGates.map((gate) => (
                <article key={gate.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <h3 className='font-semibold text-slate-950'>{gate.gate}</h3>
                    <Badge tone={gate.status === 'passed' ? 'success' : gate.blocker ? 'danger' : 'warning'}>
                      {gate.status}
                    </Badge>
                  </div>
                  <p className='mt-2 text-sm text-slate-9500'>{gate.nextAction}</p>
                </article>
              ))}
            </div>
          </div>

          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>Build safety checks</h2>
            </div>
            <div className='divide-y divide-slate-100'>
              {snapshot.buildChecks.map((check) => (
                <article key={check.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <h3 className='font-semibold text-slate-950'>{check.checkName}</h3>
                    <Badge tone={check.status === 'passed' ? 'success' : 'warning'}>{check.status}</Badge>
                  </div>
                  <p className='mt-2 text-sm text-slate-9500'>{check.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
        <div className='border-b border-slate-100 p-5'>
          <h2 className='text-lg font-bold text-slate-950'>Route coverage</h2>
        </div>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-slate-100 text-sm'>
            <thead className='bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-9500'>
              <tr>
                <th className='px-5 py-3'>Route</th>
                <th className='px-5 py-3'>Phase</th>
                <th className='px-5 py-3'>Owner</th>
                <th className='px-5 py-3'>Status</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100'>
              {snapshot.routes.map((route) => (
                <tr key={route.id}>
                  <td className='px-5 py-4 font-medium text-slate-950'>{route.route}</td>
                  <td className='px-5 py-4 text-slate-600'>{route.phase}</td>
                  <td className='px-5 py-4 text-slate-600'>{route.owner}</td>
                  <td className='px-5 py-4'>
                    <Badge tone={route.status === 'available' ? 'success' : 'warning'}>{route.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

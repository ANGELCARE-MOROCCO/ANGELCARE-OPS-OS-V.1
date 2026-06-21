'use client';

import * as React from 'react';
import { ambassadorEnterpriseSnapshot } from './ambassador-enterprise-registry';
import {
  getAmbassadorEnterpriseMetrics,
  getCriticalChecklist,
  getModulesNeedingBackend
} from './ambassador-enterprise-engine';

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

export default function AmbassadorEnterpriseDashboard() {
  const snapshot = ambassadorEnterpriseSnapshot;
  const metrics = getAmbassadorEnterpriseMetrics(snapshot);
  const backendModules = getModulesNeedingBackend(snapshot);
  const criticalChecklist = getCriticalChecklist(snapshot);

  return (
    <section className='space-y-6 p-6'>
      <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
        <Badge tone='info'>Primary Enterprise Layer v1</Badge>
        <h1 className='mt-4 text-3xl font-bold text-slate-950'>
          Ambassador OS Enterprise Edition
        </h1>
        <p className='mt-3 max-w-4xl text-sm leading-6 text-slate-600'>
          Safe consolidated enterprise layer for Ambassador OS: module registry,
          backend connector readiness, permission matrix, audit models,
          production transition checklist, and route-ready command pages.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard label='Enterprise readiness' value={`${metrics.enterpriseReadinessScore}%`} helper='Architecture maturity before live backend infrastructure.' />
        <MetricCard label='Enterprise modules' value={metrics.totalModules} helper={`${metrics.averageMaturity}% average maturity.`} />
        <MetricCard label='Backend-ready areas' value={metrics.backendReadyModules} helper='Prepared for secondary infrastructure layer.' />
        <MetricCard label='Critical permissions' value={metrics.criticalPermissions} helper={`${metrics.blockedChecklistItems} blocked checklist item(s).`} />
      </div>

      <div className='grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>Enterprise module registry</h2>
          </div>
          <div className='divide-y divide-slate-100'>
            {snapshot.modules.map((module) => (
              <article key={module.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold text-slate-950'>{module.title}</h3>
                    <p className='mt-1 text-sm text-slate-9500'>{module.layer} · Phase {module.phaseRange} · Owner: {module.owner}</p>
                  </div>
                  <Badge tone={module.maturityScore >= 90 ? 'success' : module.maturityScore >= 84 ? 'warning' : 'danger'}>
                    {module.maturityScore}%
                  </Badge>
                </div>
                <p className='mt-3 text-sm text-slate-600'>{module.purpose}</p>
                <p className='mt-3 text-xs font-medium text-slate-9500'>{module.route}</p>
              </article>
            ))}
          </div>
        </div>

        <div className='space-y-6'>
          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>Backend transition focus</h2>
            </div>
            <div className='divide-y divide-slate-100'>
              {backendModules.map((module) => (
                <article key={module.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <h3 className='font-semibold text-slate-950'>{module.title}</h3>
                    <Badge tone='warning'>{module.productionStatus}</Badge>
                  </div>
                  <p className='mt-2 text-sm text-slate-9500'>{module.purpose}</p>
                </article>
              ))}
            </div>
          </div>

          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>Critical checklist</h2>
            </div>
            <div className='divide-y divide-slate-100'>
              {criticalChecklist.map((item) => (
                <article key={item.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <h3 className='font-semibold text-slate-950'>{item.title}</h3>
                    <Badge tone={item.status === 'blocked' ? 'danger' : 'warning'}>{item.status}</Badge>
                  </div>
                  <p className='mt-2 text-sm text-slate-9500'>{item.instruction}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

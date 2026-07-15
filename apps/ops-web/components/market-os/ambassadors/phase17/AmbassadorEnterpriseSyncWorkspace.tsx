'use client';

import * as React from 'react';
import { enterpriseSyncSnapshot } from './enterprise-sync-data';
import { getCriticalSyncs, getEnterpriseSyncMetrics } from './enterprise-sync-engine';

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

export default function AmbassadorEnterpriseSyncWorkspace() {
  const snapshot = enterpriseSyncSnapshot;
  const metrics = getEnterpriseSyncMetrics(snapshot);
  const criticalSyncs = getCriticalSyncs(snapshot.syncs);

  return (
    <section className='space-y-6 p-6'>
      <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
        <Badge tone='info'>Phase 17 · Enterprise Sync Engine</Badge>

        <h1 className='mt-4 text-3xl font-bold text-slate-950'>
          Ambassador Enterprise Synchronization Command
        </h1>

        <p className='mt-3 max-w-4xl text-sm leading-6 text-slate-600'>
          Cross-module operational orchestration connecting Ambassador OS with Revenue Command,
          HR, Academy, CRM, Partnerships, Email OS, and enterprise execution workflows.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard label='Sync readiness' value={`${metrics.syncReadinessScore}%`} helper='Enterprise orchestration health score.' />
        <MetricCard label='Healthy connections' value={metrics.healthyConnections} helper={`${metrics.totalConnections} synchronized systems.`} />
        <MetricCard label='Critical issues' value={metrics.criticalConnections} helper={`${metrics.warningConnections} warning connection(s).`} />
        <MetricCard label='Blocked operations' value={metrics.blockedDependencies} helper='Dependencies blocking execution flow.' />
      </div>

      <div className='grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>Cross-module synchronization map</h2>
          </div>

          <div className='divide-y divide-slate-100'>
            {snapshot.syncs.map((sync) => (
              <article key={sync.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold text-slate-950'>
                      {sync.sourceModule} → {sync.targetModule}
                    </h3>

                    <p className='mt-1 text-sm text-slate-9500'>
                      {sync.syncType} · {sync.recordsProcessed} records
                    </p>
                  </div>

                  <Badge tone={
                    sync.syncHealth === 'healthy'
                      ? 'success'
                      : sync.syncHealth === 'warning'
                      ? 'warning'
                      : 'danger'
                  }>
                    {sync.syncHealth}
                  </Badge>
                </div>

                {sync.issue ? (
                  <p className='mt-3 text-sm text-rose-700'>{sync.issue}</p>
                ) : null}
              </article>
            ))}
          </div>
        </div>

        <div className='space-y-6'>
          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>Critical synchronization risks</h2>
            </div>

            <div className='divide-y divide-slate-100'>
              {criticalSyncs.map((item) => (
                <article key={item.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <h3 className='font-semibold text-slate-950'>
                      {item.targetModule}
                    </h3>

                    <Badge tone={item.syncHealth === 'critical' ? 'danger' : 'warning'}>
                      {item.syncHealth}
                    </Badge>
                  </div>

                  <p className='mt-2 text-sm text-slate-9500'>{item.issue ?? "No issue reported."}</p>
                </article>
              ))}
            </div>
          </div>

          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>Dependency map</h2>
            </div>

            <div className='divide-y divide-slate-100'>
              {snapshot.dependencies.map((item) => (
                <article key={item.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <h3 className='font-semibold text-slate-950'>{item.operation}</h3>

                    <Badge tone={item.blocked ? 'danger' : 'success'}>
                      {item.blocked ? 'blocked' : 'ready'}
                    </Badge>
                  </div>

                  <p className='mt-2 text-sm text-slate-9500'>
                    Dependencies: {item.dependsOn.join(', ')}
                  </p>

                  {item.blockerReason ? (
                    <p className='mt-2 text-sm text-rose-700'>{item.blockerReason}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>Unified operational feed</h2>
          </div>

          <div className='divide-y divide-slate-100'>
            {snapshot.feeds.map((feed) => (
              <article key={feed.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold text-slate-950'>{feed.title}</h3>
                    <p className='mt-1 text-sm text-slate-9500'>{feed.module}</p>
                  </div>

                  <Badge tone={
                    feed.priority === 'critical'
                      ? 'danger'
                      : feed.priority === 'high'
                      ? 'warning'
                      : 'info'
                  }>
                    {feed.priority}
                  </Badge>
                </div>

                <p className='mt-3 text-sm text-slate-600'>{feed.summary}</p>
              </article>
            ))}
          </div>
        </div>

        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>Task propagation engine</h2>
          </div>

          <div className='divide-y divide-slate-100'>
            {snapshot.propagations.map((item) => (
              <article key={item.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold text-slate-950'>{item.generatedTask}</h3>
                    <p className='mt-1 text-sm text-slate-9500'>
                      {item.originModule} → {item.assignedTeam}
                    </p>
                  </div>

                  <Badge tone={
                    item.status === 'done'
                      ? 'success'
                      : item.status === 'blocked'
                      ? 'danger'
                      : 'warning'
                  }>
                    {item.status}
                  </Badge>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

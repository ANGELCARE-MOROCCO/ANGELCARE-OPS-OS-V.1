'use client';

import * as React from 'react';
import { infrastructureSnapshot } from './infrastructure-data';
import { getInfrastructureMetrics } from './infrastructure-engine';

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

export default function AmbassadorInfrastructureWorkspace() {
  const metrics = getInfrastructureMetrics(infrastructureSnapshot);

  return (
    <section className='space-y-6 p-6'>
      <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
        <Badge tone='info'>Phase 20 · Infrastructure Architecture</Badge>

        <h1 className='mt-4 text-3xl font-bold text-slate-950'>
          Ambassador Operational Infrastructure Control Center
        </h1>

        <p className='mt-3 max-w-4xl text-sm leading-6 text-slate-600'>
          Enterprise-grade infrastructure foundations for realtime orchestration,
          background execution, queue processing, telemetry, operational resilience,
          approval governance, and infrastructure observability.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard label='Infrastructure readiness' value={`${metrics.infrastructureReadinessScore}%`} helper='Operational infrastructure maturity score.' />
        <MetricCard label='Healthy channels' value={metrics.healthyChannels} helper='Realtime synchronization infrastructure.' />
        <MetricCard label='Retrying jobs' value={metrics.retryingJobs} helper='Jobs currently in retry/recovery loop.' />
        <MetricCard label='Approval flows' value={metrics.approvalFlows} helper='Autonomous actions requiring approval.' />
      </div>

      <div className='grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>Realtime event bus</h2>
          </div>

          <div className='divide-y divide-slate-100'>
            {infrastructureSnapshot.channels.map((channel) => (
              <article key={channel.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold text-slate-950'>{channel.name}</h3>
                    <p className='mt-1 text-sm text-slate-500'>
                      {channel.throughputPerMinute} events/min · {channel.latencyMs}ms latency
                    </p>
                  </div>

                  <Badge tone={
                    channel.status === 'healthy'
                      ? 'success'
                      : channel.status === 'warning'
                      ? 'warning'
                      : 'danger'
                  }>
                    {channel.status}
                  </Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className='space-y-6'>
          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>Infrastructure alerts</h2>
            </div>

            <div className='divide-y divide-slate-100'>
              {infrastructureSnapshot.alerts.map((alert) => (
                <article key={alert.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <h3 className='font-semibold text-slate-950'>{alert.title}</h3>

                    <Badge tone={
                      alert.severity === 'critical'
                        ? 'danger'
                        : alert.severity === 'warning'
                        ? 'warning'
                        : 'success'
                    }>
                      {alert.severity}
                    </Badge>
                  </div>

                  <p className='mt-2 text-sm text-slate-500'>{alert.summary}</p>
                </article>
              ))}
            </div>
          </div>

          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>Execution audit log</h2>
            </div>

            <div className='divide-y divide-slate-100'>
              {infrastructureSnapshot.audits.map((audit) => (
                <article key={audit.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <h3 className='font-semibold text-slate-950'>{audit.actor}</h3>
                      <p className='mt-1 text-sm text-slate-500'>{audit.module}</p>
                    </div>

                    <Badge tone={audit.approvalRequired ? 'warning' : 'success'}>
                      {audit.approvalRequired ? 'approval required' : 'approved'}
                    </Badge>
                  </div>

                  <p className='mt-3 text-sm text-slate-600'>{audit.action}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
        <div className='border-b border-slate-100 p-5'>
          <h2 className='text-lg font-bold text-slate-950'>Background orchestration engine</h2>
        </div>

        <div className='grid gap-4 p-5 lg:grid-cols-2'>
          {infrastructureSnapshot.jobs.map((job) => (
            <article key={job.id} className='rounded-2xl border border-slate-100 p-5'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <h3 className='font-bold text-slate-950'>{job.jobName}</h3>
                  <p className='mt-1 text-sm text-slate-500'>{job.queue}</p>
                </div>

                <Badge tone={
                  job.status === 'running'
                    ? 'success'
                    : job.status === 'retrying'
                    ? 'warning'
                    : job.status === 'failed'
                    ? 'danger'
                    : 'info'
                }>
                  {job.status}
                </Badge>
              </div>

              <p className='mt-3 text-sm text-slate-600'>
                Owner: {job.owner}
              </p>

              <p className='mt-2 text-sm text-slate-500'>
                Retries: {job.retries}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

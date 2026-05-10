'use client';

import * as React from 'react';
import { executionHealthSnapshot } from './live-execution-data';
import { getExecutionRuntimeMetrics } from './live-execution-engine';

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

export default function AmbassadorLiveExecutionWorkspace() {
  const snapshot = executionHealthSnapshot;
  const metrics = getExecutionRuntimeMetrics(snapshot);

  return (
    <section className='space-y-6 p-6'>
      <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
        <Badge tone='info'>Phase 26 · Live Execution Infrastructure</Badge>

        <h1 className='mt-4 text-3xl font-bold text-slate-950'>
          Ambassador Live Execution & Orchestration Runtime
        </h1>

        <p className='mt-3 max-w-4xl text-sm leading-6 text-slate-600'>
          Runtime orchestration foundations for live workflows, execution queues,
          dependency graphs, event ingestion, realtime synchronization, retries,
          escalation pipelines, and operational execution governance.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard label='Orchestration readiness' value={`${metrics.orchestrationReadinessScore}%`} helper='Execution runtime infrastructure maturity.' />
        <MetricCard label='Running runtimes' value={metrics.runningRuntimes} helper='Currently active orchestration runtimes.' />
        <MetricCard label='Healthy queues' value={metrics.healthyQueues} helper='Queues operating within acceptable latency.' />
        <MetricCard label='Blocked dependencies' value={metrics.blockedDependencies} helper='Workflow dependencies waiting on upstream actions.' />
      </div>

      <div className='grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>Workflow orchestration runtimes</h2>
          </div>

          <div className='divide-y divide-slate-100'>
            {snapshot.runtimes.map((runtime) => (
              <article key={runtime.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold text-slate-950'>{runtime.workflow}</h3>
                    <p className='mt-1 text-sm text-slate-500'>{runtime.owner}</p>
                  </div>

                  <Badge tone={
                    runtime.status === 'running'
                      ? 'success'
                      : runtime.status === 'paused'
                      ? 'warning'
                      : runtime.status === 'failed'
                      ? 'danger'
                      : 'info'
                  }>
                    {runtime.status}
                  </Badge>
                </div>

                <div className='mt-4 flex flex-wrap gap-2'>
                  <Badge tone='info'>{runtime.progress}% progress</Badge>
                  <Badge tone='neutral'>{runtime.latencyMs}ms latency</Badge>
                  <Badge tone='warning'>{runtime.retryCount} retries</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className='space-y-6'>
          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>Execution queues</h2>
            </div>

            <div className='divide-y divide-slate-100'>
              {snapshot.queues.map((queue) => (
                <article key={queue.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <h3 className='font-semibold text-slate-950'>{queue.queue}</h3>

                    <Badge tone={queue.health === 'healthy' ? 'success' : 'warning'}>
                      {queue.health}
                    </Badge>
                  </div>

                  <div className='mt-3 space-y-1 text-sm text-slate-600'>
                    <p>{queue.throughputPerMinute} events/minute</p>
                    <p>{queue.activeWorkers} workers active</p>
                    <p>{queue.backlog} pending backlog</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>Dependency graph</h2>
            </div>

            <div className='divide-y divide-slate-100'>
              {snapshot.dependencies.map((dependency) => (
                <article key={dependency.id} className='p-5'>
                  <h3 className='font-semibold text-slate-950'>{dependency.parentWorkflow}</h3>
                  <p className='mt-2 text-sm text-slate-500'>Depends on: {dependency.dependentWorkflow}</p>

                  <div className='mt-3'>
                    <Badge tone={
                      dependency.state === 'ready'
                        ? 'success'
                        : dependency.state === 'blocked'
                        ? 'danger'
                        : 'warning'
                    }>
                      {dependency.state}
                    </Badge>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
        <div className='border-b border-slate-100 p-5'>
          <h2 className='text-lg font-bold text-slate-950'>Runtime event ingestion stream</h2>
        </div>

        <div className='divide-y divide-slate-100'>
          {snapshot.events.map((event) => (
            <article key={event.id} className='p-5'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <h3 className='font-semibold text-slate-950'>{event.source}</h3>
                  <p className='mt-1 text-sm text-slate-500'>{event.type} · {event.timestamp}</p>
                </div>

                <Badge tone={
                  event.status === 'processed'
                    ? 'success'
                    : event.status === 'retrying'
                    ? 'warning'
                    : 'danger'
                }>
                  {event.status}
                </Badge>
              </div>

              <p className='mt-3 text-sm text-slate-600'>{event.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

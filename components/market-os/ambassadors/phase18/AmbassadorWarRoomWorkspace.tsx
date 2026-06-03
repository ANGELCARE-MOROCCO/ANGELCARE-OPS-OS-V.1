'use client';

import * as React from 'react';
import { warRoomSnapshot } from './war-room-data';
import { getCriticalAlerts, getWarRoomMetrics } from './war-room-engine';

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

export default function AmbassadorWarRoomWorkspace() {
  const snapshot = warRoomSnapshot;
  const metrics = getWarRoomMetrics(snapshot);
  const criticalAlerts = getCriticalAlerts(snapshot.alerts);

  return (
    <section className='space-y-6 p-6'>
      <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
        <Badge tone='danger'>Phase 18 · Central Operations War Room</Badge>

        <h1 className='mt-4 text-3xl font-bold text-slate-950'>
          Ambassador Central Operations War Room
        </h1>

        <p className='mt-3 max-w-4xl text-sm leading-6 text-slate-600'>
          Real-time operational command infrastructure with live monitoring,
          active intelligence, anomaly detection, escalation routing,
          and autonomous operational intervention signals.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard label='War room health' value={`${metrics.warRoomHealthScore}%`} helper='Enterprise operational health score.' />
        <MetricCard label='Active signals' value={metrics.activeAlerts} helper={`${metrics.criticalAlerts} critical notifications.`} />
        <MetricCard label='Live signals' value={metrics.liveSignals} helper='Real-time ambassador execution stream.' />
        <MetricCard label='Critical operations' value={metrics.criticalOperations} helper='Operations requiring immediate escalation.' />
      </div>

      <div className='grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>Live alert center</h2>
          </div>

          <div className='divide-y divide-slate-100'>
            {snapshot.alerts.map((alert) => (
              <article key={alert.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold text-slate-950'>{alert.title}</h3>
                    <p className='mt-1 text-sm text-slate-500'>
                      {alert.city} · {alert.category}
                    </p>
                  </div>

                  <Badge tone={
                    alert.severity === 'critical'
                      ? 'danger'
                      : alert.severity === 'high'
                      ? 'warning'
                      : 'info'
                  }>
                    {alert.severity}
                  </Badge>
                </div>

                <p className='mt-3 text-sm text-slate-600'>{alert.summary}</p>

                {alert.autoAction ? (
                  <p className='mt-3 text-sm font-medium text-slate-700'>
                    Auto-action: {alert.autoAction}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </div>

        <div className='space-y-6'>
          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>Critical escalation center</h2>
            </div>

            <div className='divide-y divide-slate-100'>
              {criticalAlerts.map((item) => (
                <article key={item.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <h3 className='font-semibold text-slate-950'>{item.title}</h3>

                    <Badge tone='danger'>
                      {item.severity}
                    </Badge>
                  </div>

                  <p className='mt-2 text-sm text-slate-500'>{item.summary}</p>
                </article>
              ))}
            </div>
          </div>

          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>Operational heartbeat</h2>
            </div>

            <div className='divide-y divide-slate-100'>
              {snapshot.heartbeat.map((item) => (
                <article key={item.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <h3 className='font-semibold text-slate-950'>{item.operation}</h3>
                      <p className='mt-1 text-sm text-slate-500'>
                        {item.owner} · {item.latencyMs}ms
                      </p>
                    </div>

                    <Badge tone={
                      item.status === 'healthy'
                        ? 'success'
                        : item.status === 'warning'
                        ? 'warning'
                        : 'danger'
                    }>
                      {item.status}
                    </Badge>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>Live activity stream</h2>
          </div>

          <div className='divide-y divide-slate-100'>
            {snapshot.activity.map((item) => (
              <article key={item.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold text-slate-950'>{item.ambassadorName}</h3>
                    <p className='mt-1 text-sm text-slate-500'>
                      {item.city} · {item.timestamp}
                    </p>
                  </div>

                  <Badge tone='info'>
                    live
                  </Badge>
                </div>

                <p className='mt-3 text-sm text-slate-600'>{item.action}</p>
                <p className='mt-2 text-sm font-medium text-slate-700'>{item.impact}</p>
              </article>
            ))}
          </div>
        </div>

        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>Live territory performance</h2>
          </div>

          <div className='divide-y divide-slate-100'>
            {snapshot.territories.map((item) => (
              <article key={item.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold text-slate-950'>{item.city}</h3>
                    <p className='mt-1 text-sm text-slate-500'>
                      {item.activeAmbassadors} active ambassadors
                    </p>
                  </div>

                  <Badge tone={
                    item.operationalHealth >= 80
                      ? 'success'
                      : item.operationalHealth >= 60
                      ? 'warning'
                      : 'danger'
                  }>
                    {item.operationalHealth}%
                  </Badge>
                </div>

                <div className='mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600'>
                  <span>Live leads: {item.liveLeads}</span>
                  <span>Conversion: {item.conversionRate}%</span>
                  <span>Engagement: {item.engagementScore}%</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

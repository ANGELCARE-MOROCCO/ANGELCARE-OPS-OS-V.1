'use client';

import * as React from 'react';
import { finalOperatingModelSnapshot } from './operating-model-data';
import { getOperatingModelMetrics } from './operating-model-engine';

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

export default function AmbassadorOperatingModelWorkspace() {
  const snapshot = finalOperatingModelSnapshot;
  const metrics = getOperatingModelMetrics(snapshot);

  return (
    <section className='space-y-6 p-6'>
      <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
        <Badge tone='info'>Phase 25 · Operating Model & Governance</Badge>
        <h1 className='mt-4 text-3xl font-bold text-slate-950'>
          Ambassador OS Final Operating Model & Governance Blueprint
        </h1>
        <p className='mt-3 max-w-4xl text-sm leading-6 text-slate-600'>
          The operating system for how Ambassador OS should be run: ownership, approval gates,
          execution rhythms, AI governance, risk controls, and production operating standards.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard label='Governance readiness' value={`${metrics.governanceReadinessScore}%`} helper='Operating model maturity and safety score.' />
        <MetricCard label='Operating pillars' value={metrics.pillarCount} helper={`${metrics.averageMaturity}% average maturity.`} />
        <MetricCard label='Critical gates' value={metrics.criticalApprovalGates} helper={`${metrics.autoExecutionGates} gates allow safe auto-execution.`} />
        <MetricCard label='Critical controls' value={metrics.criticalControls} helper='Controls requiring executive supervision.' />
      </div>

      <div className='grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>Operating model pillars</h2>
          </div>
          <div className='divide-y divide-slate-100'>
            {snapshot.pillars.map((pillar) => (
              <article key={pillar.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold text-slate-950'>{pillar.title}</h3>
                    <p className='mt-1 text-sm text-slate-9500'>Owner: {pillar.owner}</p>
                  </div>
                  <Badge tone={pillar.maturityScore >= 90 ? 'success' : 'warning'}>{pillar.maturityScore}%</Badge>
                </div>
                <p className='mt-3 text-sm text-slate-600'>{pillar.description}</p>
                <p className='mt-3 text-sm font-medium text-slate-700'>{pillar.requiredRhythm}</p>
              </article>
            ))}
          </div>
        </div>

        <div className='space-y-6'>
          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>Approval gates</h2>
            </div>
            <div className='divide-y divide-slate-100'>
              {snapshot.approvalGates.map((gate) => (
                <article key={gate.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <h3 className='font-semibold text-slate-950'>{gate.gate}</h3>
                    <Badge tone={gate.priority === 'critical' ? 'danger' : gate.priority === 'high' ? 'warning' : 'info'}>{gate.priority}</Badge>
                  </div>
                  <p className='mt-2 text-sm text-slate-9500'>Approver: {gate.requiredApprover}</p>
                  <p className='mt-2 text-sm font-medium text-slate-700'>{gate.rule}</p>
                </article>
              ))}
            </div>
          </div>

          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>Risk controls</h2>
            </div>
            <div className='divide-y divide-slate-100'>
              {snapshot.controls.map((control) => (
                <article key={control.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <h3 className='font-semibold text-slate-950'>{control.risk}</h3>
                    <Badge tone={control.severity === 'critical' ? 'danger' : 'warning'}>{control.severity}</Badge>
                  </div>
                  <p className='mt-2 text-sm text-slate-600'>{control.control}</p>
                  <p className='mt-2 text-sm font-medium text-slate-700'>Escalation: {control.escalationOwner}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
        <div className='border-b border-slate-100 p-5'>
          <h2 className='text-lg font-bold text-slate-950'>Execution rhythms</h2>
        </div>
        <div className='grid gap-4 p-5 lg:grid-cols-2'>
          {snapshot.rhythms.map((rhythm) => (
            <article key={rhythm.id} className='rounded-2xl border border-slate-100 p-5'>
              <div className='flex items-start justify-between gap-3'>
                <h3 className='font-bold text-slate-950'>{rhythm.ritual}</h3>
                <Badge tone='info'>{rhythm.cadence}</Badge>
              </div>
              <p className='mt-2 text-sm text-slate-9500'>Owner: {rhythm.owner}</p>
              <p className='mt-3 text-sm font-medium text-slate-700'>{rhythm.expectedOutput}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

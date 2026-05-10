'use client';

import * as React from 'react';
import { autonomousGrowthSnapshot } from './autonomous-growth-data';
import {
  getAutonomousGrowthMetrics,
  getCriticalOptimizationLoops,
  getGovernanceBlocks,
  getTopGrowthScenarios,
} from './autonomous-growth-engine';

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

export default function AmbassadorAutonomousGrowthWorkspace() {
  const snapshot = autonomousGrowthSnapshot;
  const metrics = getAutonomousGrowthMetrics(snapshot);
  const criticalLoops = getCriticalOptimizationLoops(snapshot.optimizationLoops);
  const topScenarios = getTopGrowthScenarios(snapshot.simulations);
  const governanceBlocks = getGovernanceBlocks(snapshot.governance);

  return (
    <section className='space-y-6 p-6'>
      <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
        <Badge tone='info'>Phase 19 · Autonomous Growth Optimization</Badge>
        <h1 className='mt-4 text-3xl font-bold text-slate-950'>
          Ambassador Autonomous Growth Optimization Center
        </h1>
        <p className='mt-3 max-w-4xl text-sm leading-6 text-slate-600'>
          Semi-autonomous optimization for campaign routing, mission redistribution,
          territory balancing, recruitment triggers, KPI recalibration, growth simulations,
          and governance-safe execution acceleration.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard label='Automation readiness' value={`${metrics.automationReadinessScore}%`} helper='Confidence-adjusted autonomous execution score.' />
        <MetricCard label='Expected impact' value={`${metrics.expectedImpactMad.toLocaleString()} MAD`} helper='Projected impact from active optimization loops.' />
        <MetricCard label='Active loops' value={metrics.activeOptimizationLoops} helper={`${metrics.criticalOptimizations} critical/high priority loops.`} />
        <MetricCard label='Governance blocks' value={metrics.autonomousBlockedItems} helper={`${metrics.humanApprovalRequired} require human approval.`} />
      </div>

      <div className='grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>Autonomous optimization loops</h2>
          </div>

          <div className='divide-y divide-slate-100'>
            {snapshot.optimizationLoops.map((loop) => (
              <article key={loop.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold text-slate-950'>{loop.title}</h3>
                    <p className='mt-1 text-sm text-slate-500'>{loop.domain} · Owner: {loop.owner}</p>
                  </div>
                  <Badge tone={loop.priority === 'critical' ? 'danger' : loop.priority === 'high' ? 'warning' : 'info'}>
                    {loop.priority}
                  </Badge>
                </div>
                <p className='mt-3 text-sm text-slate-600'>{loop.recommendation}</p>
                <div className='mt-4 flex flex-wrap gap-2'>
                  <Badge tone='success'>{loop.confidenceScore}% confidence</Badge>
                  <Badge tone='info'>{loop.expectedImpactMad.toLocaleString()} MAD impact</Badge>
                  <Badge tone='neutral'>{loop.status}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className='space-y-6'>
          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>Critical loops</h2>
            </div>
            <div className='divide-y divide-slate-100'>
              {criticalLoops.map((loop) => (
                <article key={loop.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <h3 className='font-semibold text-slate-950'>{loop.title}</h3>
                    <Badge tone={loop.priority === 'critical' ? 'danger' : 'warning'}>{loop.priority}</Badge>
                  </div>
                  <p className='mt-2 text-sm text-slate-500'>{loop.expectedImpactMad.toLocaleString()} MAD expected impact</p>
                </article>
              ))}
            </div>
          </div>

          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>Governance safety</h2>
            </div>
            <div className='divide-y divide-slate-100'>
              {governanceBlocks.map((item) => (
                <article key={item.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <h3 className='font-semibold text-slate-950'>{item.title}</h3>
                    <Badge tone={item.severity === 'critical' ? 'danger' : 'warning'}>{item.severity}</Badge>
                  </div>
                  <p className='mt-2 text-sm text-slate-500'>{item.mitigation}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
        <div className='border-b border-slate-100 p-5'>
          <h2 className='text-lg font-bold text-slate-950'>Mission redistribution engine</h2>
        </div>
        <div className='grid gap-4 p-5 lg:grid-cols-2'>
          {snapshot.redistributions.map((item) => (
            <article key={item.id} className='rounded-2xl border border-slate-100 p-5'>
              <div className='flex items-start justify-between gap-3'>
                <h3 className='font-bold text-slate-950'>{item.campaignName}</h3>
                <Badge tone='info'>{item.status}</Badge>
              </div>
              <p className='mt-2 text-sm text-slate-600'>{item.reason}</p>
              <p className='mt-3 text-sm font-medium text-slate-700'>
                Move {item.movedMissions} missions: {item.sourceSegment} → {item.targetSegment}
              </p>
              <p className='mt-2 text-sm text-slate-500'>Expected lift: {item.expectedConversionLift}%</p>
            </article>
          ))}
        </div>
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>Predictive recruitment triggers</h2>
          </div>
          <div className='divide-y divide-slate-100'>
            {snapshot.recruitmentTriggers.map((item) => (
              <article key={item.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <h3 className='font-semibold text-slate-950'>{item.city}</h3>
                  <Badge tone={item.urgency === 'critical' ? 'danger' : 'warning'}>{item.urgency}</Badge>
                </div>
                <p className='mt-2 text-sm text-slate-500'>{item.triggerReason}</p>
                <p className='mt-3 text-sm font-medium text-slate-700'>
                  Need {item.requiredAmbassadors} ambassadors via {item.suggestedSource} · Capacity {item.expectedRevenueCapacityMad.toLocaleString()} MAD
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>Growth simulation engine</h2>
          </div>
          <div className='divide-y divide-slate-100'>
            {topScenarios.map((item) => (
              <article key={item.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <h3 className='font-semibold text-slate-950'>{item.title}</h3>
                  <Badge tone={item.riskScore >= 40 ? 'warning' : 'success'}>{item.riskScore}% risk</Badge>
                </div>
                <p className='mt-2 text-sm text-slate-500'>{item.targetCity} · {item.scenarioType}</p>
                <p className='mt-3 text-sm font-medium text-slate-700'>
                  {item.expectedLeads} leads · {item.expectedConversions} conversions · {item.expectedRevenueMad.toLocaleString()} MAD
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

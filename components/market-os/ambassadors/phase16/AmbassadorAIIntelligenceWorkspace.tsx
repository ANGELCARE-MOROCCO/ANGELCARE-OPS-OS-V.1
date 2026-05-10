'use client';

import * as React from 'react';
import { ambassadorAISnapshot } from './ambassador-ai-data';
import { getAmbassadorAIMetrics, getCriticalRisks, getExpansionPriority } from './ambassador-ai-engine';

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

export default function AmbassadorAIIntelligenceWorkspace() {
  const snapshot = ambassadorAISnapshot;
  const metrics = getAmbassadorAIMetrics(snapshot);
  const risks = getCriticalRisks(snapshot.risks);
  const expansions = getExpansionPriority(snapshot.expansionSignals);

  return (
    <section className='space-y-6 p-6'>
      <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
        <Badge tone='info'>Phase 16 · AI Intelligence Command</Badge>
        <h1 className='mt-4 text-3xl font-bold text-slate-950'>
          Ambassador Intelligence Command Center
        </h1>
        <p className='mt-3 max-w-4xl text-sm leading-6 text-slate-600'>
          AI-powered orchestration for expansion, campaign optimization, risk prediction,
          intelligent assignment, and executive strategic guidance.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard label='Strategic readiness' value={`${metrics.strategicReadinessScore}%`} helper='AI-driven growth orchestration score.' />
        <MetricCard label='AI confidence' value={`${metrics.averageAIConfidence}%`} helper='Average confidence across risks and recommendations.' />
        <MetricCard label='Expansion opportunities' value={metrics.expansionOpportunities} helper='Cities recommended for scaling.' />
        <MetricCard label='Critical risks' value={metrics.activeRisks} helper='High-priority operational or growth risks.' />
      </div>

      <div className='grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>AI strategic recommendations</h2>
          </div>

          <div className='divide-y divide-slate-100'>
            {snapshot.recommendations.map((item) => (
              <article key={item.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold text-slate-950'>{item.title}</h3>
                    <p className='mt-1 text-sm text-slate-500'>{item.city} · {item.category}</p>
                  </div>

                  <Badge tone={item.priority === 'critical' ? 'danger' : item.priority === 'high' ? 'warning' : 'info'}>
                    {item.priority}
                  </Badge>
                </div>

                <p className='mt-3 text-sm text-slate-600'>{item.recommendation}</p>

                <div className='mt-4 flex flex-wrap gap-2'>
                  <Badge tone='success'>{item.aiConfidence}% confidence</Badge>
                  <Badge tone='info'>{item.expectedImpactMad.toLocaleString()} MAD impact</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className='space-y-6'>
          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>AI risk detection</h2>
            </div>

            <div className='divide-y divide-slate-100'>
              {risks.map((risk) => (
                <article key={risk.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <h3 className='font-semibold text-slate-950'>{risk.ambassadorName}</h3>
                    <Badge tone={risk.severity === 'critical' ? 'danger' : 'warning'}>
                      {risk.severity}
                    </Badge>
                  </div>

                  <p className='mt-2 text-sm text-slate-500'>{risk.type}</p>
                  <p className='mt-2 text-sm font-medium text-slate-700'>{risk.suggestedAction}</p>
                </article>
              ))}
            </div>
          </div>

          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>Expansion priority map</h2>
            </div>

            <div className='divide-y divide-slate-100'>
              {expansions.map((item) => (
                <article key={item.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <h3 className='font-semibold text-slate-950'>{item.city}</h3>
                    <Badge tone={item.expansionScore >= 85 ? 'success' : 'info'}>
                      {item.expansionScore}
                    </Badge>
                  </div>

                  <p className='mt-2 text-sm text-slate-500'>{item.recommendedAction}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
        <div className='border-b border-slate-100 p-5'>
          <h2 className='text-lg font-bold text-slate-950'>Executive AI briefing</h2>
        </div>

        <div className='grid gap-4 p-5 lg:grid-cols-2'>
          {snapshot.briefings.map((brief) => (
            <article key={brief.id} className='rounded-2xl border border-slate-100 p-5'>
              <h3 className='font-bold text-slate-950'>{brief.title}</h3>
              <p className='mt-3 text-sm text-slate-600'>{brief.summary}</p>

              <div className='mt-4 flex flex-wrap gap-2'>
                {brief.strategicFocus.map((item) => (
                  <Badge key={item} tone='info'>{item}</Badge>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

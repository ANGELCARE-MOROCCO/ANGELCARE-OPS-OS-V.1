'use client';

import * as React from 'react';
import { marketDominanceSnapshot } from './market-dominance-data';
import { getCriticalOpportunities, getMarketDominanceMetrics, getTopRegions } from './market-dominance-engine';

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

export default function AmbassadorMarketDominanceWorkspace() {
  const snapshot = marketDominanceSnapshot;
  const metrics = getMarketDominanceMetrics(snapshot);
  const topRegions = getTopRegions(snapshot.regions);
  const topOpportunities = getCriticalOpportunities(snapshot.opportunities);

  return (
    <section className='space-y-6 p-6'>
      <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
        <Badge tone='info'>Phase 24 · Market Dominance Intelligence</Badge>
        <h1 className='mt-4 text-3xl font-bold text-slate-950'>
          Ambassador Market Dominance Intelligence Center
        </h1>
        <p className='mt-3 max-w-4xl text-sm leading-6 text-slate-600'>
          External market intelligence for competitor monitoring, demand heatmaps,
          opportunity scoring, social sentiment, expansion timing, and strategic
          territory penetration across Morocco.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard label='Dominance readiness' value={`${metrics.dominanceReadinessScore}%`} helper='Market opportunity and positioning score.' />
        <MetricCard label='Strongest city' value={metrics.strongestCity} helper='Highest combined market signal.' />
        <MetricCard label='Opportunity value' value={`${metrics.expectedOpportunityMad.toLocaleString()} MAD`} helper='Projected strategic opportunity value.' />
        <MetricCard label='Critical threats' value={metrics.criticalThreats} helper={`${metrics.criticalOpportunities} critical opportunity signal(s).`} />
      </div>

      <div className='grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>Regional opportunity intelligence</h2>
          </div>
          <div className='divide-y divide-slate-100'>
            {topRegions.map((region) => (
              <article key={region.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold text-slate-950'>{region.city}</h3>
                    <p className='mt-1 text-sm text-slate-9500'>Demand {region.demandScore} · Momentum {region.growthMomentum}</p>
                  </div>
                  <Badge tone={region.demandScore >= 85 ? 'success' : 'warning'}>{region.ambassadorInfluenceScore}% influence</Badge>
                </div>
                <p className='mt-3 text-sm text-slate-600'>{region.recommendedMove}</p>
              </article>
            ))}
          </div>
        </div>

        <div className='space-y-6'>
          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>Executive market briefings</h2>
            </div>
            <div className='divide-y divide-slate-100'>
              {snapshot.briefings.map((brief) => (
                <article key={brief.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <h3 className='font-semibold text-slate-950'>{brief.title}</h3>
                    <Badge tone={brief.urgency === 'critical' ? 'danger' : 'warning'}>{brief.urgency}</Badge>
                  </div>
                  <p className='mt-2 text-sm text-slate-600'>{brief.summary}</p>
                  <p className='mt-3 text-sm font-medium text-slate-700'>{brief.strategicDecision}</p>
                </article>
              ))}
            </div>
          </div>

          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>Top opportunities</h2>
            </div>
            <div className='divide-y divide-slate-100'>
              {topOpportunities.map((item) => (
                <article key={item.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <h3 className='font-semibold text-slate-950'>{item.title}</h3>
                    <Badge tone={item.priority === 'critical' ? 'danger' : 'warning'}>{item.priority}</Badge>
                  </div>
                  <p className='mt-2 text-sm text-slate-9500'>{item.city} · {item.category} · {item.timing}</p>
                  <p className='mt-3 text-sm font-medium text-slate-700'>{item.expectedImpactMad.toLocaleString()} MAD · {item.actionPlan}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>Competitive signal monitoring</h2>
          </div>
          <div className='divide-y divide-slate-100'>
            {snapshot.competitors.map((item) => (
              <article key={item.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold text-slate-950'>{item.competitorName}</h3>
                    <p className='mt-1 text-sm text-slate-9500'>{item.city} · {item.activityType}</p>
                  </div>
                  <Badge tone={item.threatLevel === 'critical' ? 'danger' : item.threatLevel === 'high' ? 'warning' : 'info'}>{item.threatLevel}</Badge>
                </div>
                <p className='mt-3 text-sm text-slate-600'>{item.summary}</p>
                <p className='mt-3 text-sm font-medium text-slate-700'>Counter-move: {item.counterMove}</p>
              </article>
            ))}
          </div>
        </div>

        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>Sentiment intelligence</h2>
          </div>
          <div className='divide-y divide-slate-100'>
            {snapshot.sentiment.map((item) => (
              <article key={item.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold text-slate-950'>{item.topic}</h3>
                    <p className='mt-1 text-sm text-slate-9500'>{item.channel} · {item.trend}</p>
                  </div>
                  <Badge tone={item.sentimentScore >= 80 ? 'success' : item.sentimentScore >= 65 ? 'warning' : 'danger'}>{item.sentimentScore}%</Badge>
                </div>
                <p className='mt-3 text-sm text-slate-600'>{item.insight}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

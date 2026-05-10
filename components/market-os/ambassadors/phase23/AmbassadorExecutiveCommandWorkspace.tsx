'use client';

import * as React from 'react';
import { executiveCommandSnapshot } from './executive-command-data';
import { getExecutiveCommandMetrics } from './executive-command-engine';

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

export default function AmbassadorExecutiveCommandWorkspace() {
  const snapshot = executiveCommandSnapshot;
  const metrics = getExecutiveCommandMetrics(snapshot);

  return (
    <section className='space-y-6 p-6'>
      <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
        <Badge tone='info'>Phase 23 · Executive Command Layer</Badge>

        <h1 className='mt-4 text-3xl font-bold text-slate-950'>
          AngelCare Executive Headquarters Command Center
        </h1>

        <p className='mt-3 max-w-4xl text-sm leading-6 text-slate-600'>
          Executive-grade strategic command infrastructure for enterprise forecasting,
          expansion orchestration, AI workforce oversight, risk governance,
          growth acceleration, and long-term operational dominance.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard
          label='Executive readiness'
          value={`${metrics.executiveReadinessScore}%`}
          helper='Strategic command maturity score.'
        />

        <MetricCard
          label='Annual projection'
          value={`${metrics.projectedAnnualRevenueMad.toLocaleString()} MAD`}
          helper='Projected annual enterprise revenue.'
        />

        <MetricCard
          label='Expansion trajectory'
          value={metrics.projectedExpansionCities}
          helper='Projected cities under active operations.'
        />

        <MetricCard
          label='Forecast confidence'
          value={`${metrics.averageForecastConfidence}%`}
          helper='AI strategic forecasting confidence.'
        />
      </div>

      <div className='grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>
              Strategic initiatives orchestration
            </h2>
          </div>

          <div className='divide-y divide-slate-100'>
            {snapshot.initiatives.map((item) => (
              <article key={item.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold text-slate-950'>{item.title}</h3>
                    <p className='mt-1 text-sm text-slate-500'>
                      Owner: {item.owner}
                    </p>
                  </div>

                  <Badge tone={
                    item.priority === 'critical'
                      ? 'danger'
                      : item.priority === 'high'
                      ? 'warning'
                      : 'info'
                  }>
                    {item.priority}
                  </Badge>
                </div>

                <p className='mt-3 text-sm text-slate-600'>
                  {item.strategicGoal}
                </p>

                <div className='mt-4 flex flex-wrap gap-2'>
                  <Badge tone='success'>
                    {item.expectedImpactMad.toLocaleString()} MAD impact
                  </Badge>

                  <Badge tone='neutral'>
                    {item.status}
                  </Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className='space-y-6'>
          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>
                Enterprise risk matrix
              </h2>
            </div>

            <div className='divide-y divide-slate-100'>
              {snapshot.risks.map((risk) => (
                <article key={risk.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <h3 className='font-semibold text-slate-950'>
                      {risk.title}
                    </h3>

                    <Badge tone={
                      risk.severity === 'critical'
                        ? 'danger'
                        : risk.severity === 'high'
                        ? 'warning'
                        : 'info'
                    }>
                      {risk.severity}
                    </Badge>
                  </div>

                  <p className='mt-2 text-sm text-slate-500'>
                    {risk.mitigation}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>
                Executive AI briefings
              </h2>
            </div>

            <div className='divide-y divide-slate-100'>
              {snapshot.briefings.map((brief) => (
                <article key={brief.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <h3 className='font-semibold text-slate-950'>
                        {brief.title}
                      </h3>

                      <p className='mt-1 text-sm text-slate-500'>
                        {brief.source}
                      </p>
                    </div>

                    <Badge tone={
                      brief.urgency === 'critical'
                        ? 'danger'
                        : brief.urgency === 'high'
                        ? 'warning'
                        : 'info'
                    }>
                      {brief.urgency}
                    </Badge>
                  </div>

                  <p className='mt-3 text-sm text-slate-600'>
                    {brief.summary}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
        <div className='border-b border-slate-100 p-5'>
          <h2 className='text-lg font-bold text-slate-950'>
            Strategic forecasting engine
          </h2>
        </div>

        <div className='grid gap-4 p-5 lg:grid-cols-3'>
          {snapshot.forecasts.map((forecast) => (
            <article key={forecast.id} className='rounded-2xl border border-slate-100 p-5'>
              <div className='flex items-start justify-between gap-3'>
                <h3 className='font-bold text-slate-950'>
                  {forecast.horizon} Forecast
                </h3>

                <Badge tone='info'>
                  {forecast.confidenceScore}% confidence
                </Badge>
              </div>

              <div className='mt-4 space-y-2 text-sm text-slate-600'>
                <p>
                  Revenue: {forecast.projectedRevenueMad.toLocaleString()} MAD
                </p>

                <p>
                  Cities: {forecast.projectedExpansionCities}
                </p>

                <p>
                  Ambassadors: {forecast.projectedAmbassadors}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

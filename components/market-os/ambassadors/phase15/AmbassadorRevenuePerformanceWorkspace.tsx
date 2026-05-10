'use client';

import * as React from 'react';
import { ambassadorRevenueSnapshot } from './ambassador-revenue-data';
import { getAmbassadorRevenueMetrics, getAttributionRisks, getCriticalPerformers } from './ambassador-revenue-engine';

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) {
  const tones = {
    neutral: 'border-slate-200 bg-slate-50 text-slate-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-rose-200 bg-rose-50 text-rose-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700'
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function MetricCard({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <article className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
      <p className='text-sm font-medium text-slate-500'>{label}</p>
      <p className='mt-2 text-3xl font-bold tracking-tight text-slate-950'>{value}</p>
      <p className='mt-2 text-sm text-slate-500'>{helper}</p>
    </article>
  );
}

export default function AmbassadorRevenuePerformanceWorkspace() {
  const snapshot = ambassadorRevenueSnapshot;
  const metrics = getAmbassadorRevenueMetrics(snapshot);
  const criticalPerformers = getCriticalPerformers(snapshot.rankings);
  const attributionRisks = getAttributionRisks(snapshot.attribution);

  return (
    <section className='space-y-6 p-6'>
      <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
        <Badge tone='info'>Phase 15 · Revenue Performance Engine</Badge>
        <h1 className='mt-4 text-3xl font-bold tracking-tight text-slate-950'>Ambassador Revenue Performance & Attribution Command</h1>
        <p className='mt-3 max-w-4xl text-sm leading-6 text-slate-600'>
          Connect ambassador activity to revenue: attribution quality, lead qualification, conversion tracking, payout forecasting, ROI governance, and underperformance intervention.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard label='Revenue readiness' value={`${metrics.revenueReadinessScore}%`} helper='Computed from attribution, conversions, qualification, and risks.' />
        <MetricCard label='Revenue influenced' value={`${metrics.totalRevenueMad.toLocaleString()} MAD`} helper={`${metrics.totalConversions} conversions from ${metrics.totalLeads} leads.`} />
        <MetricCard label='Conversion rate' value={`${metrics.conversionRate}%`} helper={`${metrics.qualificationRate}% qualification rate.`} />
        <MetricCard label='Reward ratio' value={`${metrics.rewardToRevenueRatio}%`} helper={`${metrics.totalPayoutMad.toLocaleString()} MAD payout exposure.`} />
      </div>

      <div className='grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'><h2 className='text-lg font-bold text-slate-950'>Revenue attribution pipeline</h2></div>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-slate-100 text-sm'>
              <thead className='bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500'>
                <tr><th className='px-5 py-3'>Ambassador</th><th className='px-5 py-3'>City</th><th className='px-5 py-3'>Channel</th><th className='px-5 py-3'>Leads</th><th className='px-5 py-3'>Conv.</th><th className='px-5 py-3'>Revenue</th><th className='px-5 py-3'>Payout</th><th className='px-5 py-3'>Status</th></tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {snapshot.attribution.map((item) => (
                  <tr key={item.id}>
                    <td className='px-5 py-4 font-medium text-slate-950'>{item.ambassadorName}</td>
                    <td className='px-5 py-4 text-slate-600'>{item.city}</td>
                    <td className='px-5 py-4 text-slate-600'>{item.channel}</td>
                    <td className='px-5 py-4 text-slate-600'>{item.leads}</td>
                    <td className='px-5 py-4 text-slate-600'>{item.conversions}</td>
                    <td className='px-5 py-4 text-slate-600'>{item.revenueMad.toLocaleString()} MAD</td>
                    <td className='px-5 py-4 text-slate-600'>{item.payoutMad.toLocaleString()} MAD</td>
                    <td className='px-5 py-4'><Badge tone={item.status === 'clean' ? 'success' : item.status === 'missing' ? 'danger' : 'warning'}>{item.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className='space-y-6'>
          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'><h2 className='text-lg font-bold text-slate-950'>Critical performers</h2></div>
            <div className='divide-y divide-slate-100'>
              {criticalPerformers.map((item) => (
                <article key={item.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'><h3 className='font-semibold text-slate-950'>{item.ambassadorName}</h3><Badge tone='danger'>{item.performanceStatus}</Badge></div>
                  <p className='mt-2 text-sm text-slate-500'>ROI {item.roiScore} · Reward ratio {item.rewardToRevenueRatio}%</p>
                  <p className='mt-2 text-sm font-medium text-slate-700'>{item.nextBestAction}</p>
                </article>
              ))}
            </div>
          </div>

          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'><h2 className='text-lg font-bold text-slate-950'>Attribution risks</h2></div>
            <div className='divide-y divide-slate-100'>
              {attributionRisks.map((item) => (
                <article key={item.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'><h3 className='font-semibold text-slate-950'>{item.ambassadorName}</h3><Badge tone={item.status === 'missing' ? 'danger' : 'warning'}>{item.confidenceScore}%</Badge></div>
                  <p className='mt-2 text-sm text-slate-500'>{item.campaign} · {item.status}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
        <div className='border-b border-slate-100 p-5'><h2 className='text-lg font-bold text-slate-950'>Performance leaderboard</h2></div>
        <div className='grid gap-4 p-5 lg:grid-cols-2'>
          {snapshot.rankings.map((rank) => (
            <article key={rank.id} className='rounded-2xl border border-slate-100 p-5'>
              <div className='flex items-start justify-between gap-3'>
                <div><h3 className='font-bold text-slate-950'>{rank.ambassadorName}</h3><p className='mt-1 text-sm text-slate-500'>{rank.city} · {rank.tier}</p></div>
                <Badge tone={rank.performanceStatus === 'excellent' ? 'success' : rank.performanceStatus === 'critical' ? 'danger' : 'warning'}>{rank.performanceStatus}</Badge>
              </div>
              <div className='mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600'>
                <span>Revenue: {rank.revenueMad.toLocaleString()} MAD</span><span>Conversions: {rank.conversions}</span><span>ROI score: {rank.roiScore}</span><span>Reward ratio: {rank.rewardToRevenueRatio}%</span>
              </div>
              <p className='mt-3 text-sm font-medium text-slate-700'>{rank.nextBestAction}</p>
            </article>
          ))}
        </div>
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'><h2 className='text-lg font-bold text-slate-950'>Payout forecast</h2></div>
          <div className='divide-y divide-slate-100'>
            {snapshot.payoutForecasts.map((forecast) => (
              <article key={forecast.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'><h3 className='font-semibold text-slate-950'>{forecast.period}</h3><Badge tone={forecast.financeRisk === 'high' ? 'warning' : 'neutral'}>{forecast.financeRisk}</Badge></div>
                <p className='mt-2 text-sm text-slate-500'>{forecast.note}</p>
                <p className='mt-3 text-sm font-medium text-slate-700'>Expected {forecast.expectedPayoutMad.toLocaleString()} MAD · Pending {forecast.pendingPayoutMad.toLocaleString()} MAD · Blocked {forecast.blockedPayoutMad.toLocaleString()} MAD</p>
              </article>
            ))}
          </div>
        </div>

        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'><h2 className='text-lg font-bold text-slate-950'>Intervention queue</h2></div>
          <div className='divide-y divide-slate-100'>
            {snapshot.interventions.map((item) => (
              <article key={item.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'><h3 className='font-semibold text-slate-950'>{item.ambassadorName}</h3><Badge tone={item.priority === 'critical' ? 'danger' : 'warning'}>{item.priority}</Badge></div>
                <p className='mt-2 text-sm text-slate-500'>{item.reason}</p>
                <p className='mt-3 text-sm font-medium text-slate-700'>Owner: {item.owner} · Recovery: {item.expectedRecoveryMad.toLocaleString()} MAD · Due: {item.dueDate}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

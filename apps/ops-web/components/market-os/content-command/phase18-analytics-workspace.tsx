'use client';

import React, { useMemo } from 'react';
import {
  phase18CampaignAttribution,
  phase18ChannelMatrix,
  phase18ContentPerformance,
  phase18FunnelStages,
} from './phase18-analytics-data';
import {
  calculatePhase18ConversionRate,
  calculatePhase18EngagementRate,
  calculatePhase18RoiSummary,
  formatPhase18Mad,
} from './phase18-analytics-helpers';
import { phase18AttributionReadiness } from './phase18-attribution-readiness';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase18AnalyticsWorkspace(): React.ReactElement {
  const summary = useMemo(() => calculatePhase18RoiSummary(phase18ContentPerformance), []);

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Content Command Center
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 18 Analytics + Attribution
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Analytics readiness layer for asset performance, campaign attribution, conversion funnels,
          channel matrices, ROI summaries, and future platform ingestion.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attributed Revenue</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{formatPhase18Mad(summary.totalRevenueMad)}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Leads</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{summary.totalLeads}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conversion Rate</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{summary.estimatedRoiPercent}%</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Asset Performance</h3>
          <div className="mt-5 space-y-3">
            {phase18ContentPerformance.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{item.assetTitle}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.format} · {item.channel} · {formatPhase18Mad(item.revenueMad)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{calculatePhase18EngagementRate(item)}% engagement</Badge>
                    <Badge>{calculatePhase18ConversionRate(item)}% conversion</Badge>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Views: {item.views} · Engagements: {item.engagements} · Leads: {item.leads} · Conversions: {item.conversions}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">Conversion Funnel</h3>
            <div className="mt-5 space-y-3">
              {phase18FunnelStages.map((stage) => (
                <article key={stage.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{stage.label}</p>
                      <p className="mt-1 text-xs text-slate-500">{stage.count.toLocaleString('fr-MA')} records</p>
                    </div>
                    <Badge>{stage.conversionRate}%</Badge>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">Campaign Attribution</h3>
            <div className="mt-5 space-y-3">
              {phase18CampaignAttribution.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{item.campaign}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.sourceChannel} · {item.influencedLeads} leads · {item.influencedConversions} conversions
                      </p>
                    </div>
                    <Badge>{item.confidence}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{formatPhase18Mad(item.attributedRevenueMad)}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Channel Matrix</h3>
          <div className="mt-5 space-y-3">
            {phase18ChannelMatrix.map((row) => (
              <article key={row.channel} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{row.channel}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Assets: {row.assets} · Reach: {row.reach.toLocaleString('fr-MA')}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{row.engagementRate}% engagement</Badge>
                    <Badge>{row.leadContribution} leads</Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Attribution Readiness</h3>
          <div className="mt-5 space-y-3">
            {phase18AttributionReadiness.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{item.label}</p>
                    <p className="mt-2 text-sm text-slate-600">{item.notes}</p>
                  </div>
                  <Badge>{item.ready ? 'Ready' : 'Future'}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase18AnalyticsWorkspace;
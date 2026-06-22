'use client';

import React, { useMemo } from 'react';
import {
  phase35CampaignForecasts,
  phase35ExecutiveDigest,
  phase35ExecutiveInsights,
  phase35IntelligenceScores,
  phase35OperationalAnomalies,
  phase35WorkloadForecasts,
} from './phase35-intelligence-data';
import {
  getPhase35AverageIntelligenceScore,
  getPhase35CampaignsAtRisk,
  getPhase35CriticalInsights,
  getPhase35DecisionDigestItems,
  getPhase35HighPressureTeams,
  getPhase35HighSeverityAnomalies,
} from './phase35-intelligence-helpers';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase35ExecutiveIntelligenceWorkspace(): React.ReactElement {
  const criticalInsights = useMemo(() => getPhase35CriticalInsights(phase35ExecutiveInsights), []);
  const campaignsAtRisk = useMemo(() => getPhase35CampaignsAtRisk(phase35CampaignForecasts), []);
  const highPressureTeams = useMemo(() => getPhase35HighPressureTeams(phase35WorkloadForecasts), []);
  const highAnomalies = useMemo(() => getPhase35HighSeverityAnomalies(phase35OperationalAnomalies), []);
  const decisionItems = useMemo(() => getPhase35DecisionDigestItems(phase35ExecutiveDigest), []);
  const intelligenceScore = useMemo(() => getPhase35AverageIntelligenceScore(phase35IntelligenceScores), []);

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-9500">
          Content Command Center
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 35 Executive Operational Intelligence
        </h2>

        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Executive-grade intelligence layer for campaign risk forecasting, workload pressure,
          anomaly detection, recommendation synthesis, decision digests, and command-level risk radar.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-6">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Intel Score</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{intelligenceScore}%</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Critical Insights</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{criticalInsights.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Campaigns Risk</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{campaignsAtRisk.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Pressure Teams</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{highPressureTeams.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Anomalies</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{highAnomalies.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Decisions</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{decisionItems.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Strategic Operational Insights</h3>
          <div className="mt-5 space-y-3">
            {phase35ExecutiveInsights.map((insight) => (
              <article key={insight.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{insight.title}</p>
                    <p className="mt-1 text-xs text-slate-9500">{insight.area} · confidence {insight.confidence}%</p>
                    <p className="mt-3 text-sm text-slate-600">{insight.summary}</p>
                    <p className="mt-3 text-sm font-semibold text-slate-800">{insight.recommendation}</p>
                  </div>
                  <Badge>{insight.severity}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">Executive Digest</h3>
            <div className="mt-5 space-y-3">
              {phase35ExecutiveDigest.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{item.headline}</p>
                      <p className="mt-1 text-xs text-slate-9500">Owner: {item.owner}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{item.priority}</Badge>
                      <Badge>{item.decisionRequired ? 'Decision' : 'Monitor'}</Badge>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">Command Intelligence Scores</h3>
            <div className="mt-5 space-y-3">
              {phase35IntelligenceScores.map((score) => (
                <article key={score.label} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{score.label}</p>
                      <p className="mt-2 text-sm text-slate-600">{score.note}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{score.score}%</Badge>
                      <Badge>{score.direction}</Badge>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Campaign Forecasting</h3>
          <div className="mt-5 space-y-3">
            {phase35CampaignForecasts.map((forecast) => (
              <article key={forecast.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-sm font-bold text-slate-950">{forecast.campaign}</p>
                <p className="mt-1 text-xs text-slate-9500">Delivery probability: {forecast.deliveryProbability}%</p>
                <p className="mt-3 text-sm text-slate-600">{forecast.predictedBlocker}</p>
                <p className="mt-3 text-sm font-semibold text-slate-800">{forecast.recommendedMove}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{forecast.riskLevel}</Badge>
                  <Badge>{forecast.forecastDirection}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Workload Forecasting</h3>
          <div className="mt-5 space-y-3">
            {phase35WorkloadForecasts.map((forecast) => (
              <article key={forecast.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-sm font-bold text-slate-950">{forecast.team}</p>
                <p className="mt-1 text-xs text-slate-9500">Pressure: {forecast.pressureScore}%</p>
                <p className="mt-3 text-sm text-slate-600">{forecast.predictedRisk}</p>
                <p className="mt-3 text-sm font-semibold text-slate-800">{forecast.recommendedAction}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{forecast.forecastDirection}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Anomaly Detection</h3>
          <div className="mt-5 space-y-3">
            {phase35OperationalAnomalies.map((anomaly) => (
              <article key={anomaly.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-sm font-bold text-slate-950">{anomaly.title}</p>
                <p className="mt-1 text-xs text-slate-9500">{anomaly.detectedIn}</p>
                <p className="mt-3 text-sm text-slate-600">{anomaly.signal}</p>
                <p className="mt-3 text-sm font-semibold text-slate-800">{anomaly.response}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{anomaly.severity}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase35ExecutiveIntelligenceWorkspace;
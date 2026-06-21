'use client';

import React, { useMemo } from 'react';
import {
  phase36CoordinationConflicts,
  phase36DecisionRoutes,
  phase36ExecutiveBriefings,
  phase36Recommendations,
  phase36ScenarioSimulations,
  phase36WorkloadRedistributions,
} from './phase36-coordination-data';
import {
  getPhase36AverageRecommendationConfidence,
  getPhase36AverageSimulationConfidence,
  getPhase36DecisionBriefings,
  getPhase36HighRiskRecommendations,
  getPhase36HighSeverityConflicts,
  getPhase36HumanApprovalRoutes,
} from './phase36-coordination-helpers';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase36CoordinationWorkspace(): React.ReactElement {
  const highRiskRecommendations = useMemo(() => getPhase36HighRiskRecommendations(phase36Recommendations), []);
  const approvalRoutes = useMemo(() => getPhase36HumanApprovalRoutes(phase36DecisionRoutes), []);
  const highConflicts = useMemo(() => getPhase36HighSeverityConflicts(phase36CoordinationConflicts), []);
  const decisionBriefings = useMemo(() => getPhase36DecisionBriefings(phase36ExecutiveBriefings), []);
  const simulationConfidence = useMemo(() => getPhase36AverageSimulationConfidence(phase36ScenarioSimulations), []);
  const recommendationConfidence = useMemo(() => getPhase36AverageRecommendationConfidence(phase36Recommendations), []);

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-9500">
          Content Command Center
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 36 Autonomous Operational Coordination
        </h2>

        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          AI-native coordination blueprint for autonomous recommendations, decision routing,
          workload redistribution proposals, scenario simulation, conflict detection, and executive briefing support.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-6">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Rec Confidence</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{recommendationConfidence}%</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Simulation</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{simulationConfidence}%</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">High Risk Recs</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{highRiskRecommendations.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Human Routes</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{approvalRoutes.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Conflicts</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{highConflicts.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Briefings</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{decisionBriefings.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Autonomous Recommendation Queue</h3>
          <div className="mt-5 space-y-3">
            {phase36Recommendations.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-9500">
                      {item.type} · confidence {item.confidence}%
                    </p>
                    <p className="mt-3 text-sm text-slate-600">{item.rationale}</p>
                    <p className="mt-3 text-sm font-semibold text-slate-800">{item.proposedAction}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{item.risk}</Badge>
                    <Badge>{item.state}</Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">Decision Routing</h3>
            <div className="mt-5 space-y-3">
              {phase36DecisionRoutes.map((route) => (
                <article key={route.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{route.decision}</p>
                      <p className="mt-1 text-xs text-slate-9500">Route to: {route.routedTo}</p>
                      <p className="mt-3 text-sm text-slate-600">{route.reason}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{route.urgency}</Badge>
                      <Badge>{route.requiresHumanApproval ? 'Human approval' : 'Auto'}</Badge>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">Executive Briefings</h3>
            <div className="mt-5 space-y-3">
              {phase36ExecutiveBriefings.map((briefing) => (
                <article key={briefing.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{briefing.headline}</p>
                      <p className="mt-2 text-sm text-slate-600">{briefing.summary}</p>
                      <p className="mt-2 text-xs text-slate-9500">Owner: {briefing.owner}</p>
                    </div>
                    <Badge>{briefing.decisionNeeded ? 'Decision' : 'Monitor'}</Badge>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Workload Redistribution</h3>
          <div className="mt-5 space-y-3">
            {phase36WorkloadRedistributions.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-sm font-bold text-slate-950">{item.taskTitle}</p>
                <p className="mt-1 text-xs text-slate-9500">{item.fromOwner} → {item.toOwner}</p>
                <p className="mt-3 text-sm text-slate-600">{item.expectedImpact}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{item.risk}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Scenario Simulation</h3>
          <div className="mt-5 space-y-3">
            {phase36ScenarioSimulations.map((scenario) => (
              <article key={scenario.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-sm font-bold text-slate-950">{scenario.scenario}</p>
                <p className="mt-3 text-sm text-slate-600">{scenario.predictedOutcome}</p>
                <p className="mt-3 text-sm font-semibold text-slate-800">{scenario.recommendedMove}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{scenario.confidence}% confidence</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Coordination Conflicts</h3>
          <div className="mt-5 space-y-3">
            {phase36CoordinationConflicts.map((conflict) => (
              <article key={conflict.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-sm font-bold text-slate-950">{conflict.conflict}</p>
                <p className="mt-1 text-xs text-slate-9500">{conflict.affectedArea}</p>
                <p className="mt-3 text-sm text-slate-600">{conflict.resolutionProposal}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{conflict.severity}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase36CoordinationWorkspace;
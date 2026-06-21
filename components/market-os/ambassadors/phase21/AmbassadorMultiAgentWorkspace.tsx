'use client';

import * as React from 'react';
import { multiAgentSnapshot } from './multi-agent-data';
import { getAutoBlockedRules, getCriticalDelegations, getMultiAgentMetrics } from './multi-agent-engine';

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

export default function AmbassadorMultiAgentWorkspace() {
  const snapshot = multiAgentSnapshot;
  const metrics = getMultiAgentMetrics(snapshot);
  const criticalDelegations = getCriticalDelegations(snapshot.delegations);
  const blockedRules = getAutoBlockedRules(snapshot.governance);

  return (
    <section className='space-y-6 p-6'>
      <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
        <Badge tone='info'>Phase 21 · Multi-Agent Operations</Badge>

        <h1 className='mt-4 text-3xl font-bold text-slate-950'>
          Ambassador Multi-Agent Operations Command
        </h1>

        <p className='mt-3 max-w-4xl text-sm leading-6 text-slate-600'>
          Coordinated AI operational agents for growth strategy, campaign optimization,
          ambassador success, compliance governance, recruitment, recovery,
          revenue intelligence, delegation, consensus, auditability, and human override.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <MetricCard label='Agent readiness' value={`${metrics.agentReadinessScore}%`} helper='Confidence-adjusted multi-agent operating score.' />
        <MetricCard label='Active agents' value={metrics.activeAgents} helper={`${metrics.reviewRequiredAgents} agent(s) need review.`} />
        <MetricCard label='Consensus required' value={metrics.consensusRequired} helper={`${metrics.humanApprovalsRequired} human approval touchpoints.`} />
        <MetricCard label='Governance blocks' value={metrics.autoBlockedRules} helper='Auto-blocking rules protecting execution.' />
      </div>

      <div className='grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>AI agent registry</h2>
          </div>

          <div className='divide-y divide-slate-100'>
            {snapshot.agents.map((agent) => (
              <article key={agent.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold text-slate-950'>{agent.name}</h3>
                    <p className='mt-1 text-sm text-slate-9500'>{agent.role} · Owner: {agent.owner}</p>
                  </div>

                  <Badge tone={
                    agent.status === 'active'
                      ? 'success'
                      : agent.status === 'review_required'
                      ? 'warning'
                      : 'danger'
                  }>
                    {agent.status}
                  </Badge>
                </div>

                <p className='mt-3 text-sm text-slate-600'>{agent.currentObjective}</p>

                <div className='mt-4 flex flex-wrap gap-2'>
                  <Badge tone='info'>{agent.confidenceScore}% confidence</Badge>
                  {agent.humanOverrideRequired ? <Badge tone='warning'>human override</Badge> : null}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className='space-y-6'>
          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>Critical delegations</h2>
            </div>

            <div className='divide-y divide-slate-100'>
              {criticalDelegations.map((item) => (
                <article key={item.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <h3 className='font-semibold text-slate-950'>{item.objective}</h3>
                    <Badge tone={item.priority === 'critical' ? 'danger' : 'warning'}>{item.priority}</Badge>
                  </div>
                  <p className='mt-2 text-sm text-slate-9500'>Lead: {item.leadAgent}</p>
                  <p className='mt-2 text-sm font-medium text-slate-700'>
                    Impact: {item.expectedImpactMad.toLocaleString()} MAD · Status: {item.status}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
            <div className='border-b border-slate-100 p-5'>
              <h2 className='text-lg font-bold text-slate-950'>Governance auto-blocks</h2>
            </div>

            <div className='divide-y divide-slate-100'>
              {blockedRules.map((rule) => (
                <article key={rule.id} className='p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <h3 className='font-semibold text-slate-950'>{rule.title}</h3>
                    <Badge tone={rule.severity === 'critical' ? 'danger' : 'warning'}>{rule.severity}</Badge>
                  </div>
                  <p className='mt-2 text-sm text-slate-9500'>{rule.rule}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>Consensus engine</h2>
          </div>

          <div className='divide-y divide-slate-100'>
            {snapshot.consensus.map((item) => (
              <article key={item.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <h3 className='font-semibold text-slate-950'>{item.topic}</h3>
                  <Badge tone={item.requiresHumanApproval ? 'warning' : 'success'}>
                    {item.consensusScore}% consensus
                  </Badge>
                </div>
                <p className='mt-2 text-sm text-slate-600'>{item.decision}</p>
                {item.riskReason ? <p className='mt-2 text-sm text-rose-700'>{item.riskReason}</p> : null}
              </article>
            ))}
          </div>
        </div>

        <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
          <div className='border-b border-slate-100 p-5'>
            <h2 className='text-lg font-bold text-slate-950'>Agent auditability</h2>
          </div>

          <div className='divide-y divide-slate-100'>
            {snapshot.audits.map((audit) => (
              <article key={audit.id} className='p-5'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <h3 className='font-semibold text-slate-950'>{audit.agentName}</h3>
                    <p className='mt-1 text-sm text-slate-9500'>{audit.timestamp}</p>
                  </div>
                  <Badge tone='info'>{audit.confidenceScore}%</Badge>
                </div>
                <p className='mt-3 text-sm text-slate-600'>{audit.action}</p>
                <p className='mt-2 text-sm font-medium text-slate-700'>{audit.explainability}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

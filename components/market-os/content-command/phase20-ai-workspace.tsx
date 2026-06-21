'use client';

import React, { useMemo } from 'react';
import {
  phase20AiOutputs,
  phase20AiTasks,
  phase20PromptTemplates,
  phase20SafetyGates,
} from './phase20-ai-data';
import {
  getPhase20AverageQuality,
  getPhase20FailedSafetyGates,
  getPhase20HighRiskTasks,
  getPhase20TasksNeedingReview,
  getPhase20TaskStatusLabel,
} from './phase20-ai-helpers';
import { phase20AiProviderReadiness } from './phase20-provider-readiness';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase20AiExecutionWorkspace(): React.ReactElement {
  const reviewTasks = useMemo(() => getPhase20TasksNeedingReview(phase20AiTasks), []);
  const highRiskTasks = useMemo(() => getPhase20HighRiskTasks(phase20AiTasks), []);
  const averageQuality = useMemo(() => getPhase20AverageQuality(phase20AiOutputs), []);
  const failedGates = useMemo(() => getPhase20FailedSafetyGates(phase20SafetyGates), []);

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-9500">
          Content Command Center
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 20 AI Execution Engine
        </h2>

        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          AI execution foundation for prompt orchestration, multilingual generation,
          content rewriting, SEO optimization, output scoring, and approval safety gates.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">AI Tasks</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{phase20AiTasks.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Needs Review</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{reviewTasks.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">High Risk</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{highRiskTasks.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-9500">Avg Quality</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{averageQuality}%</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">AI Task Queue</h3>
          <div className="mt-5 space-y-3">
            {phase20AiTasks.map((task) => (
              <article key={task.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{task.title}</p>
                    <p className="mt-1 text-xs text-slate-9500">
                      {task.action} · {task.language.toUpperCase()} · Owner: {task.owner} · {task.createdAt}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{getPhase20TaskStatusLabel(task.status)}</Badge>
                    <Badge>{task.riskLevel}</Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">Prompt Templates</h3>
            <div className="mt-5 space-y-3">
              {phase20PromptTemplates.map((template) => (
                <article key={template.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{template.title}</p>
                      <p className="mt-1 text-xs text-slate-9500">
                        {template.action} · {template.language.toUpperCase()}
                      </p>
                      <p className="mt-3 text-sm text-slate-600">{template.systemInstruction}</p>
                    </div>
                    <Badge>{template.requiresHumanReview ? 'Review' : 'Auto'}</Badge>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">AI Safety Gates</h3>
            <p className="mt-1 text-sm text-slate-600">
              Failed required gates: {failedGates.length}
            </p>
            <div className="mt-5 space-y-3">
              {phase20SafetyGates.map((gate) => (
                <article key={gate.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{gate.title}</p>
                      <p className="mt-2 text-sm text-slate-600">{gate.description}</p>
                    </div>
                    <Badge>{gate.passed ? 'Passed' : 'Blocked'}</Badge>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">AI Outputs</h3>
          <div className="mt-5 space-y-3">
            {phase20AiOutputs.map((output) => (
              <article key={output.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{output.summary}</p>
                    <p className="mt-1 text-xs text-slate-9500">
                      Task: {output.taskId}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Quality {output.qualityScore}%</Badge>
                    <Badge>Brand {output.brandFitScore}%</Badge>
                    <Badge>SEO {output.seoScore}%</Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Provider Readiness</h3>
          <div className="mt-5 space-y-3">
            {phase20AiProviderReadiness.map((provider) => (
              <article key={provider.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{provider.provider}</p>
                    <p className="mt-2 text-sm text-slate-600">{provider.notes}</p>
                  </div>
                  <Badge>{provider.ready ? 'Ready' : 'Future'}</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase20AiExecutionWorkspace;
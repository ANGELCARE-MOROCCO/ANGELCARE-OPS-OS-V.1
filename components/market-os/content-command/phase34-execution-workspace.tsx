'use client';

import React, { useMemo, useState } from 'react';
import {
  phase34DependencyBlockers,
  phase34EscalationTriggers,
  phase34ExecutionHealth,
  phase34ExecutionTasks,
  phase34OperatorLoads,
} from './phase34-execution-data';
import {
  getPhase34AverageExecutionHealth,
  getPhase34BlockedTasks,
  getPhase34CriticalBlockers,
  getPhase34OverloadedOperators,
  getPhase34SlaBreachedTasks,
  getPhase34TaskPressure,
} from './phase34-execution-helpers';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandPhase34ExecutionWorkspace(): React.ReactElement {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(phase34ExecutionTasks[0]?.id ?? '');

  const blockedTasks = useMemo(() => getPhase34BlockedTasks(phase34ExecutionTasks), []);
  const slaBreached = useMemo(() => getPhase34SlaBreachedTasks(phase34ExecutionTasks), []);
  const criticalBlockers = useMemo(() => getPhase34CriticalBlockers(phase34DependencyBlockers), []);
  const overloadedOperators = useMemo(() => getPhase34OverloadedOperators(phase34OperatorLoads), []);
  const health = useMemo(() => getPhase34AverageExecutionHealth(phase34ExecutionHealth), []);

  const selectedBlockers = useMemo(
    () => phase34DependencyBlockers.filter((blocker) => blocker.taskId === selectedTaskId),
    [selectedTaskId]
  );

  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Content Command Center
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Phase 34 Operational Execution Engine
        </h2>

        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Real execution-engine layer for task orchestration, SLA pressure, blockers,
          workload balancing, escalation triggers, bottleneck detection, and execution health.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Execution Health</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{health}%</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tasks</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{phase34ExecutionTasks.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Blocked</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{blockedTasks.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">SLA Breach</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{slaBreached.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overloaded</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{overloadedOperators.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Execution Queue</h3>
          <div className="mt-5 space-y-3">
            {phase34ExecutionTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => setSelectedTaskId(task.id)}
                className="w-full rounded-2xl border border-slate-100 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{task.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {task.campaign} · Owner: {task.owner} · Due: {task.dueLabel}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      SLA: {task.elapsedHours}/{task.slaHours} hours · Dependencies: {task.dependencies.length}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{task.state}</Badge>
                    <Badge>{task.priority}</Badge>
                    <Badge>{getPhase34TaskPressure(task)}</Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">Selected Task Blockers</h3>
            <div className="mt-5 space-y-3">
              {selectedBlockers.length > 0 ? (
                selectedBlockers.map((blocker) => (
                  <article key={blocker.id} className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">{blocker.blocker}</p>
                        <p className="mt-1 text-xs text-slate-500">Blocking since: {blocker.blockingSince}</p>
                        <p className="mt-3 text-sm text-slate-600">{blocker.recommendedAction}</p>
                      </div>
                      <Badge>{blocker.severity}</Badge>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                  No blockers attached to this task.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">Escalation Triggers</h3>
            <div className="mt-5 space-y-3">
              {phase34EscalationTriggers.map((trigger) => (
                <article key={trigger.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{trigger.trigger}</p>
                      <p className="mt-1 text-xs text-slate-500">{trigger.condition}</p>
                      <p className="mt-3 text-sm text-slate-600">Escalate to: {trigger.escalateTo}</p>
                    </div>
                    <Badge>{trigger.enabled ? 'Enabled' : 'Disabled'}</Badge>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Operator Workload</h3>
          <div className="mt-5 space-y-3">
            {phase34OperatorLoads.map((load) => (
              <article key={load.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{load.operator}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Active: {load.activeTasks} · Urgent: {load.urgentTasks}
                    </p>
                  </div>
                  <Badge>{load.capacityPercent}% capacity</Badge>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Execution Health Areas</h3>
          <div className="mt-5 space-y-3">
            {phase34ExecutionHealth.map((item) => (
              <article key={item.label} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{item.label}</p>
                    <p className="mt-2 text-sm text-slate-600">{item.recommendation}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{item.score}%</Badge>
                    <Badge>{item.risk}</Badge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase34ExecutionWorkspace;
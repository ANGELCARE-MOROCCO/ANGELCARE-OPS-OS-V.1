"use client";

import * as React from "react";
import { ambassadorPhase5Snapshot } from "./ambassador-automation-data";
import {
  getAmbassadorAutomationMetrics,
  sortRulesByPriority,
} from "./ambassador-automation-engine";

type BadgeProps = {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
};

function Badge({ children, tone = "neutral" }: BadgeProps) {
  const tones: Record<NonNullable<BadgeProps["tone"]>, string> = {
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Card({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-9500">{title}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-9500">{subtitle}</p>
    </div>
  );
}

export default function AmbassadorAutomationExecutionWorkspace() {
  const snapshot = ambassadorPhase5Snapshot;
  const metrics = getAmbassadorAutomationMetrics(snapshot);
  const rules = sortRulesByPriority(snapshot.rules);

  return (
    <section className="space-y-6 p-6">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-800 p-6 text-slate-950 shadow-sm">
        <div className="max-w-4xl">
          <Badge tone="info">Phase 5 · Automations Execution</Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Ambassador Automation & Execution Command Center
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            A stable TypeScript workspace for automation rules, workflow stages,
            notifications, escalations, and execution tasks inside the Ambassador unit.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Execution readiness" value={`${metrics.executionReadinessScore}%`} subtitle="Computed from rules, tasks, blocked stages, and escalations." />
        <Card title="Active automation rules" value={metrics.activeRules} subtitle={`${metrics.criticalRules} critical rule(s) configured.`} />
        <Card title="Open execution tasks" value={metrics.openTasks} subtitle={`${metrics.overdueRiskTasks} urgent or at-risk task(s).`} />
        <Card title="Queued notifications" value={metrics.queuedNotifications} subtitle="Ready for WhatsApp, email, SMS, or in-app channels." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-bold text-slate-950">Automation rules</h2>
            <p className="mt-1 text-sm text-slate-9500">
              Prioritized operational rules that convert ambassador events into manager actions.
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {rules.map((rule) => (
              <article key={rule.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">{rule.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-9500">{rule.description}</p>
                  </div>
                  <Badge
                    tone={
                      rule.priority === "critical"
                        ? "danger"
                        : rule.priority === "high"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {rule.priority}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                  <div>
                    <span className="font-semibold text-slate-900">Trigger:</span> {rule.trigger}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Action:</span> {rule.action}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Success:</span> {rule.successRate}%
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">Workflow stages</h2>
            <div className="mt-4 space-y-3">
              {snapshot.workflowStages.map((stage) => (
                <div key={stage.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{stage.label}</p>
                    <Badge tone={stage.status === "blocked" ? "danger" : stage.status === "running" ? "info" : "success"}>
                      {stage.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-9500">
                    Owner: {stage.owner} · SLA: {stage.slaHours}h
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">Escalations</h2>
            <div className="mt-4 space-y-3">
              {snapshot.escalations.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{item.ambassadorName}</p>
                    <Badge tone={item.severity === "critical" ? "danger" : "warning"}>{item.severity}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-9500">{item.reason}</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">{item.nextAction}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-950">Execution task queue</h2>
          <p className="mt-1 text-sm text-slate-9500">
            Stable queue model for automation-generated tasks, campaign work, compliance follow-ups, and payout actions.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-9500">
              <tr>
                <th className="px-5 py-3">Task</th>
                <th className="px-5 py-3">Assignee</th>
                <th className="px-5 py-3">Related</th>
                <th className="px-5 py-3">Due</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {snapshot.tasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-5 py-4 font-medium text-slate-950">{task.title}</td>
                  <td className="px-5 py-4 text-slate-600">{task.assignee}</td>
                  <td className="px-5 py-4 text-slate-600">{task.relatedAmbassador}</td>
                  <td className="px-5 py-4 text-slate-600">{task.dueDate}</td>
                  <td className="px-5 py-4"><Badge tone={task.priority === "critical" ? "danger" : task.priority === "high" ? "warning" : "neutral"}>{task.priority}</Badge></td>
                  <td className="px-5 py-4"><Badge tone={task.status === "done" ? "success" : task.status === "waiting" ? "warning" : "info"}>{task.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

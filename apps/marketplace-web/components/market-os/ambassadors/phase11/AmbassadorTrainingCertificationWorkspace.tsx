"use client";

import * as React from "react";
import { ambassadorTrainingSnapshot } from "./ambassador-training-data";
import {
  calculateProgressPercent,
  getAmbassadorTrainingMetrics,
  getAmbassadorsEligibleForUpgrade,
  getCriticalTrainerReviews,
  getLowSkillRisks,
} from "./ambassador-training-engine";

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const tones = {
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-9500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-9500">{helper}</p>
    </article>
  );
}

export default function AmbassadorTrainingCertificationWorkspace() {
  const snapshot = ambassadorTrainingSnapshot;
  const metrics = getAmbassadorTrainingMetrics(snapshot);
  const upgradeEligible = getAmbassadorsEligibleForUpgrade(snapshot.progress);
  const criticalReviews = getCriticalTrainerReviews(snapshot.trainerReviews);
  const lowSkillRisks = getLowSkillRisks(snapshot.skillScores);

  return (
    <section className="space-y-6 p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <Badge tone="info">Phase 11 · Training & Certification</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
          Ambassador Training, Certification & Capability Engine
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
          This workspace turns ambassador development into an operational system:
          learning paths, certification levels, skill scoring, trainer reviews,
          Academy sync foundations, and readiness controls before campaigns.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Training readiness" value={`${metrics.trainingReadinessScore}%`} helper="Computed from modules, scores, failures, reviews, and skill risks." />
        <MetricCard label="Active modules" value={metrics.activeModules} helper={`${metrics.requiredLearningPaths} required learning path(s).`} />
        <MetricCard label="Average score" value={`${metrics.averageTrainingScore}%`} helper="Average active ambassador training score." />
        <MetricCard label="Critical reviews" value={metrics.criticalReviews} helper="Trainer reviews requiring fast action." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-bold text-slate-950">Training progress</h2>
            <p className="mt-1 text-sm text-slate-9500">Monitor certification progress and campaign readiness.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {snapshot.progress.map((item) => {
              const progressPercent = calculateProgressPercent(item);
              return (
                <article key={item.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-950">{item.ambassadorName}</h3>
                      <p className="mt-1 text-sm text-slate-9500">
                        {item.city} · {item.currentLevel} → {item.targetLevel} · Trainer: {item.trainerOwner}
                      </p>
                    </div>
                    <Badge tone={item.status === "failed" ? "danger" : item.status === "completed" ? "success" : "info"}>
                      {item.status}
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-4">
                    <span><strong className="text-slate-900">Progress:</strong> {progressPercent}%</span>
                    <span><strong className="text-slate-900">Modules:</strong> {item.completedModules}/{item.totalModules}</span>
                    <span><strong className="text-slate-900">Score:</strong> {item.averageScore}%</span>
                    <span><strong className="text-slate-900">Last:</strong> {item.lastActivityAt.slice(0, 10)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-950">Upgrade eligible</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {upgradeEligible.map((item) => (
                <article key={item.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-slate-950">{item.ambassadorName}</h3>
                    <Badge tone="success">{item.targetLevel}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-9500">
                    Score {item.averageScore}% · Progress {calculateProgressPercent(item)}%
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-950">Critical trainer reviews</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {criticalReviews.map((review) => (
                <article key={review.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-slate-950">{review.ambassadorName}</h3>
                    <Badge tone="danger">{review.priority}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-9500">{review.notes}</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    Owner: {review.owner} · Due: {review.dueDate}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-950">Low skill risks</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {lowSkillRisks.map((skill) => (
                <article key={`${skill.ambassadorName}-${skill.skillArea}`} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-slate-950">{skill.ambassadorName}</h3>
                    <Badge tone="danger">{skill.score}%</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-9500">{skill.skillArea}: {skill.evidence}</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">{skill.recommendedImprovement}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-950">Learning paths</h2>
          <p className="mt-1 text-sm text-slate-9500">Certification structures that can later sync with AngelCare Academy.</p>
        </div>
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {snapshot.learningPaths.map((path) => (
            <article key={path.id} className="rounded-2xl border border-slate-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-950">{path.name}</h3>
                  <p className="mt-1 text-sm text-slate-9500">
                    Target: {path.targetLevel} · Owner: {path.owner}
                  </p>
                </div>
                <Badge tone={path.requiredForActivation ? "success" : "neutral"}>
                  {path.requiredForActivation ? "required" : "optional"}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {path.modules.length} modules · {path.estimatedHours}h estimated
              </p>
              <p className="mt-3 text-xs font-medium text-slate-9500">Modules: {path.modules.join(", ")}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-950">Training modules</h2>
        </div>
        <div className="grid gap-4 p-5 lg:grid-cols-3">
          {snapshot.modules.map((module) => (
            <article key={module.id} className="rounded-2xl border border-slate-100 p-5">
              <Badge tone={module.status === "active" ? "success" : "neutral"}>{module.status}</Badge>
              <h3 className="mt-4 font-bold text-slate-950">{module.title}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {module.category} · {module.durationMinutes} min · pass {module.passingScore}%
              </p>
              <p className="mt-2 text-sm text-slate-9500">Owner: {module.owner}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

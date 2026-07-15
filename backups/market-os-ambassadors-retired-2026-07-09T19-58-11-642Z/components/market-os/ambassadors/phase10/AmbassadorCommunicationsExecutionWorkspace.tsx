"use client";

import * as React from "react";
import { ambassadorCommunicationSnapshot } from "./ambassador-communications-data";
import {
  canContactAmbassador,
  getAmbassadorCommunicationMetrics,
  getBroadcastsNeedingAttention,
  renderTemplate,
} from "./ambassador-communications-engine";

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

export default function AmbassadorCommunicationsExecutionWorkspace() {
  const snapshot = ambassadorCommunicationSnapshot;
  const metrics = getAmbassadorCommunicationMetrics(snapshot);
  const attentionBroadcasts = getBroadcastsNeedingAttention(snapshot.broadcasts);
  const previewTemplate = snapshot.templates[0];

  return (
    <section className="space-y-6 p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <Badge tone="info">Phase 10 · Communications Execution</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
          Ambassador Communications & Notification Command Center
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
          This workspace prepares WhatsApp, email, SMS, in-app messages, broadcast templates,
          opt-in checks, delivery logs, and communication execution monitoring for the Ambassador unit.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Communication readiness" value={`${metrics.communicationReadinessScore}%`} helper="Computed from templates, broadcasts, delivery, reply rates, and opt-in risks." />
        <MetricCard label="Active templates" value={metrics.activeTemplates} helper="Reusable operational message templates." />
        <MetricCard label="Scheduled / queued" value={metrics.scheduledBroadcasts + metrics.queuedBroadcasts} helper="Broadcasts waiting for execution." />
        <MetricCard label="Opt-in risks" value={metrics.optInRiskCount} helper="Contacts requiring consent/channel review." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-bold text-slate-950">Broadcast execution queue</h2>
            <p className="mt-1 text-sm text-slate-9500">Operational campaigns, reminders, proof revisions, and announcements.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {snapshot.broadcasts.map((broadcast) => (
              <article key={broadcast.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">{broadcast.title}</h3>
                    <p className="mt-1 text-sm text-slate-9500">
                      {broadcast.channel} · {broadcast.audienceLabel} · Sender: {broadcast.sender}
                    </p>
                  </div>
                  <Badge tone={broadcast.status === "sent" ? "success" : broadcast.status === "queued" ? "warning" : "info"}>
                    {broadcast.status}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-4">
                  <span><strong className="text-slate-900">Recipients:</strong> {broadcast.expectedRecipients}</span>
                  <span><strong className="text-slate-900">Delivered:</strong> {broadcast.deliveredCount}</span>
                  <span><strong className="text-slate-900">Failed:</strong> {broadcast.failedCount}</span>
                  <span><strong className="text-slate-900">Reply:</strong> {broadcast.replyRate}%</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-950">Needs attention</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {attentionBroadcasts.map((broadcast) => (
                <article key={broadcast.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-slate-950">{broadcast.title}</h3>
                    <Badge tone={broadcast.failedCount > 0 ? "danger" : "warning"}>{broadcast.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-9500">
                    Failed: {broadcast.failedCount} · Scheduled: {broadcast.scheduledFor}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">Template preview</h2>
            <p className="mt-2 text-sm font-semibold text-slate-700">{previewTemplate.subject}</p>
            <p className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {renderTemplate(previewTemplate, {
                ambassador_name: "Meryem B.",
                deadline: "demain 18:00",
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-950">Message templates</h2>
          <p className="mt-1 text-sm text-slate-9500">Reusable messages for onboarding, missions, revisions, rewards, payouts, training, and compliance.</p>
        </div>
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {snapshot.templates.map((template) => (
            <article key={template.id} className="rounded-2xl border border-slate-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-950">{template.name}</h3>
                  <p className="mt-1 text-sm text-slate-9500">{template.channel} · {template.category} · Owner: {template.owner}</p>
                </div>
                <Badge tone={template.status === "active" ? "success" : "neutral"}>{template.status}</Badge>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">{template.subject}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{template.body}</p>
              <p className="mt-3 text-xs font-medium text-slate-9500">Variables: {template.variables.join(", ")}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-950">Contact consent & channel readiness</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-9500">
              <tr>
                <th className="px-5 py-3">Ambassador</th>
                <th className="px-5 py-3">City</th>
                <th className="px-5 py-3">Preferred</th>
                <th className="px-5 py-3">WhatsApp</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">SMS</th>
                <th className="px-5 py-3">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {snapshot.contactPreferences.map((contact) => (
                <tr key={contact.ambassadorId}>
                  <td className="px-5 py-4 font-medium text-slate-950">{contact.ambassadorName}</td>
                  <td className="px-5 py-4 text-slate-600">{contact.city}</td>
                  <td className="px-5 py-4 text-slate-600">{contact.preferredChannel}</td>
                  <td className="px-5 py-4"><Badge tone={canContactAmbassador(contact, "whatsapp") ? "success" : "danger"}>{contact.whatsappOptIn ? "opt-in" : "blocked"}</Badge></td>
                  <td className="px-5 py-4"><Badge tone={canContactAmbassador(contact, "email") ? "success" : "danger"}>{contact.emailOptIn ? "opt-in" : "blocked"}</Badge></td>
                  <td className="px-5 py-4"><Badge tone={canContactAmbassador(contact, "sms") ? "success" : "danger"}>{contact.smsOptIn ? "opt-in" : "blocked"}</Badge></td>
                  <td className="px-5 py-4"><Badge tone={contact.contactRisk === "high" ? "danger" : contact.contactRisk === "medium" ? "warning" : "success"}>{contact.contactRisk}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

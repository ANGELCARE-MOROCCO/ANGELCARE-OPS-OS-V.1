'use client';

import React from 'react';
import {
  phase8Assets,
  phase8BrandItems,
  phase8Deliverables,
  phase8Kpis,
  phase8ProductSheets,
  phase8ProductionQueue,
} from './phase8-workspace-data';
import { getPriorityLabel, getProgressLabel, getStatusLabel } from './phase8-ui-helpers';

function SectionHeader(props: { eyebrow: string; title: string; description: string }): React.ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{props.eyebrow}</p>
      <h2 className="text-xl font-bold text-slate-950">{props.title}</h2>
      <p className="max-w-3xl text-sm text-slate-600">{props.description}</p>
    </div>
  );
}

function StatusBadge(props: { label: string }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.label}
    </span>
  );
}

export function ContentCommandPhase8Workspace(): React.ReactElement {
  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          eyebrow="Market-OS / Content Command Center"
          title="Operational Content & Brand Workspace"
          description="Visible execution layer for production queues, content assets, campaign deliverables, product sheets, social planning, brand governance, approvals, AI actions, and automations."
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {phase8Kpis.map((kpi) => (
            <div key={kpi.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{kpi.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">{kpi.value}</p>
              <p className="mt-1 text-sm text-slate-600">{kpi.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Execution"
            title="Production Queue"
            description="Track current work, owners, priorities, blocked content, and review movement."
          />
          <div className="mt-5 space-y-3">
            {phase8ProductionQueue.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">Owner: {item.owner} · Due: {item.dueDate}</p>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge label={getStatusLabel(item.status)} />
                    <StatusBadge label={getPriorityLabel(item.priority)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Library"
            title="Content Assets"
            description="Preview the asset registry structure: format, campaign, status, and language."
          />
          <div className="mt-5 space-y-3">
            {phase8Assets.map((asset) => (
              <div key={asset.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{asset.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {asset.format.toUpperCase()} · {asset.campaign} · {asset.language.toUpperCase()}
                    </p>
                  </div>
                  <StatusBadge label={getStatusLabel(asset.status)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionHeader
          eyebrow="Campaigns"
          title="Campaign Deliverables Matrix"
          description="Campaign-linked execution rows with readiness indicators and operational status."
        />
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {phase8Deliverables.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-100 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{item.deliverable}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.campaign} · Owner: {item.owner}</p>
                </div>
                <StatusBadge label={getStatusLabel(item.status)} />
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{getProgressLabel(item.readiness)}</span>
                  <span>{item.readiness}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-white" style={{ width: `${item.readiness}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Sheets"
            title="Product & Service Sheets"
            description="Structured service content with SEO and completeness readiness."
          />
          <div className="mt-5 space-y-3">
            {phase8ProductSheets.map((sheet) => (
              <div key={sheet.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{sheet.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{sheet.category}</p>
                  </div>
                  <StatusBadge label={getStatusLabel(sheet.status)} />
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  SEO: {sheet.seoScore}% · Completeness: {sheet.completeness}%
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Governance"
            title="Brand Control"
            description="Approved and rejected brand assets for safer marketing execution."
          />
          <div className="mt-5 space-y-3">
            {phase8BrandItems.map((brand) => (
              <div key={brand.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{brand.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{brand.type.toUpperCase()} · {brand.notes}</p>
                  </div>
                  <StatusBadge label={brand.approved ? 'Approved' : 'Review'} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Calendar"
            title="Editorial Planning"
            description="Use this panel as the UI entry for weekly/monthly scheduling."
          />
          <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            Calendar activation layer ready for content slots, platform filters, owners, and campaign grouping.
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Approvals"
            title="Workflow Control"
            description="Use this panel for reviewers, revision requests, and approval timestamps."
          />
          <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            Approval activation layer ready for draft, review, revision, approved, scheduled, and published states.
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="AI + Automation"
            title="Execution Acceleration"
            description="Use this panel for AI rewrite, translation, SEO optimization, tagging, and alerts."
          />
          <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            AI and automation activation layer ready for future command buttons and rules.
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentCommandPhase8Workspace;
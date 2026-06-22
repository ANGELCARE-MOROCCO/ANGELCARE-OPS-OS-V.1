'use client';

import React from 'react';
import { deploymentSequence } from '../deployment/deployment-sequence';
import { productionQaChecklist } from '../testing/production-qa-checklist';
import { productionMonitoringPlan } from '../monitoring/production-monitoring-plan';
import { apiRouteImplementationGuide } from '../api-routes/api-route-implementation-guide';

function Badge(props: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export function ContentCommandUltimateProductionWorkspace(): React.ReactElement {
  return (
    <section className="w-full space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Content Command Center
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Ultimate Production Activation Pack
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Final implementation scaffolds for database, repositories, server actions, APIs,
          media, AI, publishing, realtime, monitoring, QA, and deployment sequencing.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Deployment Sequence</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {deploymentSequence.map((item) => <Badge key={item}>{item}</Badge>)}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">QA Checklist</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {productionQaChecklist.map((item) => <Badge key={item}>{item}</Badge>)}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">Monitoring Alerts</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {productionMonitoringPlan.alerts.map((item) => <Badge key={item}>{item}</Badge>)}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">API Route Guide</h3>
          <div className="mt-4 space-y-3">
            {apiRouteImplementationGuide.map((route) => (
              <article key={route.route} className="rounded-2xl border border-slate-100 p-4">
                <p className="text-sm font-bold text-slate-950">{route.route}</p>
                <p className="mt-2 text-sm text-slate-600">{route.notes}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContentCommandUltimateProductionWorkspace;
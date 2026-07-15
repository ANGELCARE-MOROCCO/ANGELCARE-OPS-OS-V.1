"use client";

import {
  executiveActionQueue,
  executiveInsights,
  regionalPerformance,
} from "./executive-intelligence-data";

function Badge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {children}
    </span>
  );
}

export default function AmbassadorExecutiveIntelligenceWorkspace() {
  return (
    <section className="space-y-6 p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <Badge>Phase 7 · Executive Intelligence</Badge>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
          Ambassador Executive Intelligence Command Center
        </h1>

        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
          Executive-grade operational intelligence for Ambassador OS:
          regional domination monitoring, campaign performance, churn risk,
          revenue visibility, and action orchestration.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-bold text-slate-950">
              Regional performance
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {regionalPerformance.map((region) => (
              <div key={region.city} className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-950">
                    {region.city}
                  </h3>

                  <Badge>{region.healthStatus}</Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div>Ambassadors: {region.ambassadors}</div>
                  <div>Campaigns: {region.activeCampaigns}</div>
                  <div>Leads: {region.generatedLeads}</div>
                  <div>Revenue: {region.revenueMad} MAD</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-bold text-slate-950">
              Executive insights
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {executiveInsights.map((insight) => (
              <div key={insight.id} className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-950">
                    {insight.title}
                  </h3>

                  <Badge>{insight.severity}</Badge>
                </div>

                <p className="mt-3 text-sm text-slate-600">
                  {insight.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-950">
            Executive action queue
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {executiveActionQueue.map((item) => (
            <div key={item.id} className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-950">
                  {item.title}
                </h3>

                <Badge>{item.priority}</Badge>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3 text-sm text-slate-600">
                <div>Owner: {item.owner}</div>
                <div>Due: {item.dueDate}</div>
                <div>Status: {item.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client"

import { Button, Icons, MetricCard, Panel, PanelHeader, RunAction } from "./SubmoduleKit"

export default function AnalyticsExecutionWorkspace({ run }: { run: RunAction }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="SLA Score" value="91%" icon={<Icons.BarChart3 className="h-4 w-4" />} />
          <MetricCard label="Avg Reply" value="38m" />
          <MetricCard label="Approvals" value="12" />
          <MetricCard label="Queue Health" value="Good" />
        </div>

        <Panel>
          <PanelHeader
            icon={<Icons.BarChart3 className="h-5 w-5" />}
            title="Email Intelligence Analytics"
            subtitle="Operational reporting controls for workload, SLA, approvals and provider health."
            action={<Button variant="primary" onClick={() => run("audit.open", { action: "analytics.export" })}>Export report</Button>}
          />
          <div className="grid gap-4 p-5 lg:grid-cols-3">
            {["SLA trend", "Team workload", "Approval cycle", "Provider reliability", "Inbox volume", "Escalation risk"].map((item) => (
              <button key={item} onClick={() => run("audit.open", { action: `analytics.open.${item}` })} className="rounded-2xl border border-slate-200 p-5 text-left hover:bg-slate-50">
                <div className="font-bold text-slate-950">{item}</div>
                <div className="mt-2 text-sm text-slate-500">Click to open live operational report.</div>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

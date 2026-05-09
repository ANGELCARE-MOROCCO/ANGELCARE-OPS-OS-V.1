"use client"

import { Button, Icons, MetricCard, Panel, PanelHeader, RunAction, StatusPill } from "./SubmoduleKit"

const events = [
  { id: "evt-1", action: "thread.assign", severity: "info", actor: "Operations" },
  { id: "evt-2", action: "compose.queued", severity: "warning", actor: "System" },
  { id: "evt-3", action: "approval.approve", severity: "critical", actor: "CEO" }
]

export default function AuditExecutionWorkspace({ run }: { run: RunAction }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Events" value={String(events.length)} icon={<Icons.CheckCircle2 className="h-4 w-4" />} />
          <MetricCard label="Critical" value="1" />
          <MetricCard label="Warnings" value="1" />
          <MetricCard label="Retention" value="Active" />
        </div>

        <Panel>
          <PanelHeader
            icon={<Icons.CheckCircle2 className="h-5 w-5" />}
            title="Enterprise Audit Timeline"
            subtitle="Review execution history and log manual audit checkpoints."
            action={<Button variant="primary" onClick={() => run("audit.open", { action: "manual.audit.checkpoint" })}>Create checkpoint</Button>}
          />

          <div className="divide-y divide-slate-100">
            {events.map((event) => (
              <div key={event.id} className="grid grid-cols-[minmax(0,1fr)_140px_160px_160px] items-center gap-4 p-5">
                <div>
                  <div className="font-bold text-slate-950">{event.action}</div>
                  <div className="text-sm text-slate-500">Audit ID: {event.id}</div>
                </div>
                <StatusPill label={event.severity} tone={event.severity === "critical" ? "red" : event.severity === "warning" ? "amber" : "blue"} />
                <div className="text-sm text-slate-600">{event.actor}</div>
                <div className="flex justify-end"><Button variant="secondary" onClick={() => run("audit.open", { data: event })}>Open</Button></div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

"use client"

import { Button, Icons, MetricCard, Panel, PanelHeader, RunAction, StatusPill } from "./SubmoduleKit"

const workers = [
  { id: "queue-worker", title: "Queue Worker", status: "Ready", action: "queue.retry" as const },
  { id: "sla-sweep", title: "SLA Sweep", status: "Ready", action: "automation.create" as const },
  { id: "mailbox-sync", title: "Mailbox Sync", status: "Ready", action: "sync.mailbox" as const }
]

export default function RuntimeExecutionWorkspace({ run }: { run: RunAction }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Workers" value="3" icon={<Icons.Activity className="h-4 w-4" />} />
          <MetricCard label="Queue" value="Ready" />
          <MetricCard label="Realtime" value="Partial" />
          <MetricCard label="Health" value="Good" />
        </div>

        <Panel>
          <PanelHeader
            icon={<Icons.Activity className="h-5 w-5" />}
            title="Runtime Operations"
            subtitle="Execute queue, SLA and mailbox runtime controls."
          />

          <div className="divide-y divide-slate-100">
            {workers.map((worker) => (
              <div key={worker.id} className="grid grid-cols-[minmax(0,1fr)_140px_220px] items-center gap-4 p-5">
                <div>
                  <div className="font-bold text-slate-950">{worker.title}</div>
                  <div className="text-sm text-slate-500">Runtime worker: {worker.id}</div>
                </div>
                <StatusPill label={worker.status} tone="green" />
                <div className="flex justify-end">
                  <Button variant="primary" onClick={() => run(worker.action, { mailboxId: worker.id, data: { workerId: worker.id } })}><Icons.Play className="h-4 w-4" /> Execute</Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

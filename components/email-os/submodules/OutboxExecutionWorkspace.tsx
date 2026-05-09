"use client"

import { Button, Icons, MetricCard, Panel, PanelHeader, RunAction, StatusPill } from "./SubmoduleKit"

const jobs = [
  { id: "job-1", title: "Training proposal", status: "Queued", to: "client@example.com" },
  { id: "job-2", title: "Invoice correction", status: "Failed", to: "finance@example.com" },
  { id: "job-3", title: "HR reminder", status: "Scheduled", to: "candidate@example.com" }
]

export default function OutboxExecutionWorkspace({ run }: { run: RunAction }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Queued" value="1" icon={<Icons.Send className="h-4 w-4" />} />
          <MetricCard label="Failed" value="1" />
          <MetricCard label="Scheduled" value="1" />
          <MetricCard label="Retries" value="0" />
        </div>

        <Panel>
          <PanelHeader
            icon={<Icons.Send className="h-5 w-5" />}
            title="Outbox & Delivery Control"
            subtitle="Retry failed sends, queue new delivery jobs and inspect delivery risk."
            action={<Button variant="primary" onClick={() => run("queue.retry", { data: { sweep: true } })}><Icons.RefreshCw className="h-4 w-4" /> Retry sweep</Button>}
          />

          <div className="divide-y divide-slate-100">
            {jobs.map((job) => (
              <div key={job.id} className="grid grid-cols-[minmax(0,1fr)_140px_260px] items-center gap-4 p-5">
                <div>
                  <div className="font-bold text-slate-950">{job.title}</div>
                  <div className="text-sm text-slate-500">{job.to}</div>
                </div>
                <StatusPill label={job.status} tone={job.status === "Failed" ? "red" : job.status === "Queued" ? "amber" : "blue"} />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => run("queue.retry", { data: { jobId: job.id } })}>Retry</Button>
                  <Button variant="secondary" onClick={() => run("compose.send", { to: job.to, subject: job.title, text: "Resent from outbox." })}>Send now</Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

"use client"

import { Button, Icons, MetricCard, Panel, PanelHeader, RunAction, StatusPill } from "./SubmoduleKit"

const settings = [
  { id: "smtp", title: "SMTP Provider", desc: "Outbound provider, sender identity and delivery credentials.", status: "Needs env" },
  { id: "imap", title: "IMAP Sync", desc: "Inbound mailbox polling and message normalization.", status: "Needs env" },
  { id: "approvals", title: "Approval Policies", desc: "External recipients, attachments and risk thresholds.", status: "Active" },
  { id: "sla", title: "SLA Rules", desc: "Response timers, escalation roles and breach routing.", status: "Active" },
  { id: "security", title: "Security Controls", desc: "RBAC, audit, encryption and cron secrets.", status: "Review" }
]

export default function ConfigurationExecutionWorkspace({ run }: { run: RunAction }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="SMTP" value="Check" icon={<Icons.Send className="h-4 w-4" />} />
          <MetricCard label="IMAP" value="Check" icon={<Icons.RefreshCw className="h-4 w-4" />} />
          <MetricCard label="RBAC" value="Active" icon={<Icons.ShieldCheck className="h-4 w-4" />} />
          <MetricCard label="Audit" value="Enabled" icon={<Icons.CheckCircle2 className="h-4 w-4" />} />
        </div>

        <Panel>
          <PanelHeader
            icon={<Icons.Settings className="h-5 w-5" />}
            title="Configuration Center"
            subtitle="Operational provider setup, approval policy, SLA and security execution."
            action={<Button variant="primary" onClick={() => run("audit.open", { action: "configuration.saveAll" })}><Icons.Save className="h-4 w-4" /> Save configuration</Button>}
          />

          <div className="grid gap-4 p-5 lg:grid-cols-2">
            {settings.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-bold text-slate-950">{item.title}</div>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{item.desc}</p>
                  </div>
                  <StatusPill label={item.status} tone={item.status === "Active" ? "green" : item.status === "Review" ? "amber" : "red"} />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => run("audit.open", { action: `${item.id}.test` })}>Test</Button>
                  <Button variant="secondary" onClick={() => run("audit.open", { action: `${item.id}.save` })}>Save</Button>
                  <Button variant="secondary" onClick={() => run("sync.mailbox", { mailboxId: item.id })}>Run check</Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

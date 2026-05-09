"use client"

import { useState } from "react"
import { Button, Icons, MetricCard, Panel, PanelHeader, RunAction, StatusPill } from "./SubmoduleKit"

const initialRules = [
  { id: "auto-vip", name: "VIP Escalation", trigger: "priority = critical", status: true },
  { id: "auto-attach", name: "Attachment Approval Gate", trigger: "has attachments", status: true },
  { id: "auto-finance", name: "Finance Auto Label", trigger: "mailbox = finance", status: false }
]

export default function AutomationExecutionWorkspace({ run }: { run: RunAction }) {
  const [rules, setRules] = useState(initialRules)

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Rules" value={String(rules.length)} icon={<Icons.Zap className="h-4 w-4" />} />
          <MetricCard label="Active" value={String(rules.filter((r) => r.status).length)} />
          <MetricCard label="Queued" value="0" />
          <MetricCard label="Risk" value="Low" />
        </div>

        <Panel>
          <PanelHeader
            icon={<Icons.Zap className="h-5 w-5" />}
            title="Automation Control"
            subtitle="Create, toggle and test routing, approval, SLA and labeling rules."
            action={<Button variant="primary" onClick={() => run("automation.create", { data: { name: "New automation rule" } })}><Icons.Plus className="h-4 w-4" /> New rule</Button>}
          />

          <div className="divide-y divide-slate-100">
            {rules.map((rule) => (
              <div key={rule.id} className="grid grid-cols-[minmax(0,1fr)_200px_260px] items-center gap-4 p-5">
                <div>
                  <div className="font-bold text-slate-950">{rule.name}</div>
                  <div className="text-sm text-slate-500">{rule.trigger}</div>
                </div>
                <StatusPill label={rule.status ? "Enabled" : "Disabled"} tone={rule.status ? "green" : "neutral"} />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => {
                    setRules(rules.map((item) => item.id === rule.id ? { ...item, status: !item.status } : item))
                    run("automation.toggle", { data: { id: rule.id, enabled: !rule.status } })
                  }}>{rule.status ? "Disable" : "Enable"}</Button>
                  <Button variant="secondary" onClick={() => run("automation.create", { data: { testRuleId: rule.id } })}><Icons.Play className="h-4 w-4" /> Test</Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

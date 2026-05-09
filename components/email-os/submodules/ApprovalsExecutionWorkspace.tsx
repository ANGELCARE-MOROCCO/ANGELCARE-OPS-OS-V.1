"use client"

import { useState } from "react"
import { Button, Icons, MetricCard, Panel, PanelHeader, RunAction, StatusPill } from "./SubmoduleKit"

const initialApprovals = [
  { id: "appr-1", title: "Legal contract response", targetId: "thr-legal", risk: "Critical" },
  { id: "appr-2", title: "Sensitive HR notice", targetId: "draft-hr", risk: "High" },
  { id: "appr-3", title: "Finance statement", targetId: "draft-fin", risk: "Medium" }
]

export default function ApprovalsExecutionWorkspace({ run }: { run: RunAction }) {
  const [items, setItems] = useState(initialApprovals)

  async function decide(id: string, decision: "approved" | "rejected") {
    const item = items.find((x) => x.id === id)
    if (!item) return
    setItems(items.filter((x) => x.id !== id))
    await run(decision === "approved" ? "approval.approve" : "approval.reject", {
      draftId: item.targetId,
      decision,
      reason: `Decision from approvals workspace: ${decision}`
    })
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Pending" value={String(items.length)} icon={<Icons.ShieldCheck className="h-4 w-4" />} />
          <MetricCard label="Critical" value={String(items.filter((i) => i.risk === "Critical").length)} />
          <MetricCard label="Avg cycle" value="18m" />
          <MetricCard label="Policy" value="Active" />
        </div>

        <Panel>
          <PanelHeader
            icon={<Icons.ShieldCheck className="h-5 w-5" />}
            title="Approval Queue"
            subtitle="Approve or reject sensitive outbound communication."
          />

          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_140px_260px] items-center gap-4 p-5">
                <div>
                  <div className="font-bold text-slate-950">{item.title}</div>
                  <div className="text-sm text-slate-500">Target: {item.targetId}</div>
                </div>
                <StatusPill label={item.risk} tone={item.risk === "Critical" ? "red" : item.risk === "High" ? "amber" : "blue"} />
                <div className="flex justify-end gap-2">
                  <Button variant="primary" onClick={() => decide(item.id, "approved")}>Approve</Button>
                  <Button variant="danger" onClick={() => decide(item.id, "rejected")}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

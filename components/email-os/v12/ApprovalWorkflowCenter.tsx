
export default function ApprovalWorkflowCenter() {
  const approvals = [{ title: "Legal outbound approval", owner: "Operations Director", priority: "Critical" }, { title: "HR disciplinary validation", owner: "HR Director", priority: "High" }]
  return (
    <div className="rounded-3xl border bg-white p-6">
      <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Approval Workflow Center</h2><p className="text-sm text-slate-500">Enterprise approval governance and escalation execution.</p></div><button className="rounded-xl border px-4 py-2 text-sm font-medium">Open Approval Matrix</button></div>
      <div className="mt-6 space-y-4">{approvals.map((item) => (<div key={item.title} className="rounded-2xl border p-4"><div className="flex items-center justify-between"><div><div className="font-semibold">{item.title}</div><div className="text-sm text-slate-500">Owner: {item.owner}</div></div><span className="rounded-full border px-3 py-1 text-xs font-semibold">{item.priority}</span></div></div>))}</div>
    </div>
  )
}

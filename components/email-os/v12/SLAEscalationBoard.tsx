
export default function SLAEscalationBoard() {
  const items = [
    { title: "VIP Customer Delay", risk: "HIGH", time: "42m overdue" },
    { title: "HR Approval Pending", risk: "MEDIUM", time: "18m overdue" },
    { title: "Legal Review", risk: "LOW", time: "5m overdue" },
  ]
  return (
    <div className="rounded-3xl border bg-white p-6">
      <h2 className="text-xl font-bold">SLA Escalation Board</h2>
      <p className="text-sm text-slate-500">Operational risk monitoring and escalation management.</p>
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item.title} className="rounded-2xl border p-4">
            <div className="flex items-center justify-between">
              <div><div className="font-semibold">{item.title}</div><div className="text-sm text-slate-500">{item.time}</div></div>
              <span className="rounded-full border px-3 py-1 text-xs font-medium">{item.risk}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


export default function ExecutiveCommandCenter() {
  const cards = [
    { label: "Critical Threads", value: "12" },
    { label: "Pending Approvals", value: "08" },
    { label: "Escalations", value: "03" },
    { label: "Delivery Risk", value: "Low" },
  ]

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Executive Email Command Center</h1>
          <p className="mt-1 text-sm text-slate-500">Enterprise-wide operational visibility and execution monitoring.</p>
        </div>
        <button className="rounded-xl border px-4 py-2 text-sm font-medium">Open Global Audit</button>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border p-5">
            <div className="text-sm text-slate-500">{card.label}</div>
            <div className="mt-3 text-3xl font-bold">{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

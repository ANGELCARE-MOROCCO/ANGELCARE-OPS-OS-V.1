"use client"

export default function ExecutiveAutomationPanel() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-black text-slate-950">
        Executive Automation Center
      </h1>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {[
          "Escalation Policies",
          "Executive Actions",
          "Auto Escalations",
          "SLA Intervention"
        ].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="text-sm font-black uppercase tracking-wide text-slate-500">
              {item}
            </div>

            <div className="mt-3 text-3xl font-black text-slate-950">
              Active
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

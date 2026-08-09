"use client"

import { ShieldCheck } from "lucide-react"

export default function SecurityStatusPanel() {
  const checks = [
    "Internal token protection",
    "Realtime event isolation",
    "Automation execution validation",
    "Provider secret separation",
    "Role-safe execution guards"
  ]

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
          <ShieldCheck className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-lg font-black text-slate-950">
            Security Control Layer
          </h2>

          <p className="text-sm text-slate-500">
            Enterprise runtime protection overview.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {checks.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  )
}

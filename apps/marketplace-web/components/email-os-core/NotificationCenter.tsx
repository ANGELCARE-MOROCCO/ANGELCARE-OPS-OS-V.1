"use client"

import { Bell } from "lucide-react"

export default function NotificationCenter() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-950">Notification Center</h2>
          <p className="text-sm text-slate-500">
            Queue alerts, escalations, SLA warnings, approvals.
          </p>
        </div>
      </div>
    </section>
  )
}

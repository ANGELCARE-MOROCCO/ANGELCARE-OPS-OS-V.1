"use client"

import { useEffect, useState, useCallback } from "react"
import { useEmailOSRealtime } from "@/hooks/useEmailOSRealtime"

export function RealtimeOutboxPanel() {
  const [emails, setEmails] = useState<any[]>([])

  const load = useCallback(async () => {
    const response = await fetch("/api/email-os/outbox")
    const result = await response.json()

    if (result.ok) {
      setEmails(result.data || [])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEmailOSRealtime({
    table: "email_os_core_outbox",
    onChange: load
  })

  return (
    <div className="space-y-3">
      {emails.map((row) => (
        <div
          key={row.id}
          className="rounded-2xl border border-slate-200 bg-white p-4"
        >
          <div className="font-bold">
            {row.subject}
          </div>

          <div className="mt-2 text-sm text-slate-500">
            {row.to_email}
          </div>

          <div className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
            {row.status}
          </div>
        </div>
      ))}
    </div>
  )
}

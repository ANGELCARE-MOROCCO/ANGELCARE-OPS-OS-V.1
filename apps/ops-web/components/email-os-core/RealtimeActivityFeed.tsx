"use client"

import { useEffect, useState, useCallback } from "react"
import { useEmailOSRealtime } from "@/hooks/useEmailOSRealtime"

export function RealtimeActivityFeed() {
  const [logs, setLogs] = useState<any[]>([])

  const load = useCallback(async () => {
    const response = await fetch("/api/email-os/provider-logs")
    const result = await response.json()

    if (result.ok) {
      setLogs(result.data || [])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEmailOSRealtime({
    table: "email_os_core_provider_logs",
    onChange: load
  })

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-lg font-black">
        Activité Temps Réel
      </div>

      <div className="mt-4 space-y-3">
        {logs.map((row) => (
          <div
            key={row.id}
            className="rounded-xl border border-slate-100 p-3"
          >
            <div className="font-semibold">
              {row.status}
            </div>

            <div className="mt-1 text-sm text-slate-500">
              {row.provider}
            </div>

            {row.message ? (
              <div className="mt-2 text-xs text-red-500">
                {row.message}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState, useCallback } from "react"
import { useEmailOSRealtime } from "@/hooks/useEmailOSRealtime"

export function RealtimeInboxPanel() {
  const [emails, setEmails] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const response = await fetch("/api/email-os/inbox")
    const result = await response.json()

    if (result.ok) {
      setEmails(result.data || [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEmailOSRealtime({
    table: "email_os_core_inbox",
    onChange: load
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xl font-black">
          Inbox Temps Réel
        </div>

        {loading ? (
          <div className="text-sm text-blue-500">
            Chargement...
          </div>
        ) : (
          <div className="text-sm text-emerald-500">
            Synchronisé
          </div>
        )}
      </div>

      {emails.map((row) => (
        <div
          key={row.id}
          className="rounded-2xl border border-slate-200 bg-white p-4"
        >
          <div className="font-bold">
            {row.subject}
          </div>

          <div className="mt-1 text-sm text-slate-500">
            {row.from_email}
          </div>

          <div className="mt-3 text-sm text-slate-700">
            {row.preview}
          </div>
        </div>
      ))}
    </div>
  )
}

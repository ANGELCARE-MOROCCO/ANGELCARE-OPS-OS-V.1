"use client"

import { useEffect } from "react"
import { emailOSRealtime } from "@/lib/email-os-core/realtime"

type Props = {
  table: string
  onChange: () => void
}

export function useEmailOSRealtime({
  table,
  onChange
}: Props) {
  useEffect(() => {
    if (!emailOSRealtime) return

    const channel = emailOSRealtime
      .channel(`email-os-${table}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table
        },
        () => {
          onChange()
        }
      )
      .subscribe()

    return () => {
  if (emailOSRealtime) {
    emailOSRealtime.removeChannel(channel)
  }
}
  }, [table, onChange])
}

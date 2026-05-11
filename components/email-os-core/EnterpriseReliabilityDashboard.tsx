"use client"

import { useEffect, useState } from "react"

export function EnterpriseReliabilityDashboard() {
  const [health, setHealth] = useState<any>(null)

  async function load() {
    const response = await fetch("/api/email-os/system/health")
    const result = await response.json()

    if (result.ok) {
      setHealth(result.data)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Object.entries(health?.checks || {}).map(([key, value]) => (
        <div
          key={key}
          className="rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div className="text-sm font-semibold uppercase text-slate-500">
            {key}
          </div>

          <div
            className={`mt-3 text-lg font-black ${
              value ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {value ? "Operational" : "Offline"}
          </div>
        </div>
      ))}
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"

type Objective = {
  id: string
  title: string
  priority?: string
  status: string
  deadline?: string
}

export default function ApprovalSlaEscalationEngine() {
  const [objectives, setObjectives] = useState<Objective[]>([])

  async function load() {
    const res = await fetch("/api/market-os/strategy-objectives")
    const json = await res.json()
    setObjectives(json.data || [])
  }

  useEffect(() => {
    load()
  }, [])

  const now = new Date()

  const atRisk = objectives.filter(o => {
    if (!o.deadline) return false
    return new Date(o.deadline) < now && o.status !== "completed"
  })

  return (
    <main className="p-6 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-black mb-6">
        Approval SLA Escalation Engine
      </h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Total Objectives</p>
          <p className="text-2xl font-bold">{objectives.length}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">At Risk / Overdue</p>
          <p className="text-2xl font-bold text-red-600">{atRisk.length}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl">
        <h2 className="font-bold mb-3">Overdue Objectives</h2>

        {atRisk.map(o => (
          <div key={o.id} className="border-b py-2 flex justify-between">
            <span>{o.title}</span>
            <span className="text-sm text-red-600">
              overdue
            </span>
          </div>
        ))}

        {!atRisk.length && (
          <p className="text-gray-400 text-sm">No SLA issues</p>
        )}
      </div>
    </main>
  )
}
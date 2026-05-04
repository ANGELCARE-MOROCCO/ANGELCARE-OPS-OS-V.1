"use client"

import { useEffect, useState } from "react"

type Objective = {
  id: string
  title: string
  status: string
  priority?: string
}

export default function KpiRoiImpactEngine() {
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    const res = await fetch("/api/market-os/strategy-objectives")
    const json = await res.json()
    setObjectives(json.data || [])
  }

  useEffect(() => {
    load()
  }, [])

  const completed = objectives.filter(o => o.status === "completed").length
  const total = objectives.length
  const completionRate = total ? Math.round((completed / total) * 100) : 0

  return (
    <main className="p-6 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-black mb-6">KPI ROI Impact Engine</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Total Objectives</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{completed}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-sm text-gray-500">Completion Rate</p>
          <p className="text-2xl font-bold text-blue-600">{completionRate}%</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl">
        <h2 className="font-bold mb-3">Objectives Breakdown</h2>

        {objectives.map(o => (
          <div key={o.id} className="border-b py-2 flex justify-between">
            <span>{o.title}</span>
            <span className="text-sm text-gray-500">{o.status}</span>
          </div>
        ))}

        {!objectives.length && (
          <p className="text-gray-400 text-sm">No data yet</p>
        )}
      </div>
    </main>
  )
}
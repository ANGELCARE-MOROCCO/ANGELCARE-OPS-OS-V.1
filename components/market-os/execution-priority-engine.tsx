"use client"

import { useEffect, useMemo, useState } from "react"

type Objective = {
  id: string
  title: string
  priority: string
  status: string
  deadline?: string | null
}

type Note = {
  objective_id: string
  severity: string
  status: string
}

function daysUntil(deadline?: string | null) {
  if (!deadline) return null
  const today = new Date()
  const target = new Date(deadline)
  return Math.ceil((target.getTime() - today.getTime()) / (1000*60*60*24))
}

function priorityWeight(p: string) {
  if (p === "P0") return 40
  if (p === "P1") return 25
  if (p === "P2") return 15
  return 5
}

function slaWeight(days: number | null) {
  if (days === null) return 5
  if (days < 0) return 40
  if (days <= 1) return 30
  if (days <= 3) return 20
  return 10
}

function blockerWeight(notes: Note[], id: string) {
  const relevant = notes.filter(n => n.objective_id === id && n.status === "open")
  if (relevant.some(n => n.severity === "critical")) return 40
  if (relevant.some(n => n.severity === "high")) return 25
  return relevant.length ? 10 : 0
}

export default function ExecutionPriorityEngine() {
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [notes, setNotes] = useState<Note[]>([])

  async function load() {
    const o = await fetch("/api/market-os/strategy-objectives")
    const n = await fetch("/api/market-os/execution-notes")

    const oj = await o.json()
    const nj = await n.json()

    setObjectives(oj.data || [])
    setNotes(nj.data || [])
  }

  useEffect(() => { load() }, [])

  const ranked = useMemo(() => {
    return objectives.map(o => {
      const days = daysUntil(o.deadline)
      const score =
        priorityWeight(o.priority) +
        slaWeight(days) +
        blockerWeight(notes, o.id)

      return { ...o, days, score }
    })
    .sort((a, b) => b.score - a.score)
  }, [objectives, notes])

  return (
    <main className="p-6 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-black mb-6">
        Execution Priority Engine
      </h1>

      {ranked.map(o => (
        <div key={o.id} className="bg-white p-4 rounded-xl mb-4">
          <div className="flex justify-between">
            <div>
              <h2 className="font-bold">{o.title}</h2>
              <p className="text-sm text-gray-500">
                Priority: {o.priority} · Status: {o.status}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs">Score</p>
              <p className="text-2xl font-black">{o.score}</p>
            </div>
          </div>

          <p className="mt-2 text-sm">
            Days remaining: {o.days ?? "—"}
          </p>
        </div>
      ))}
    </main>
  )
}

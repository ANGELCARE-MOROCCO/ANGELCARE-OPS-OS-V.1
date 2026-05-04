"use client"

import { useEffect, useMemo, useState } from "react"

type Objective = {
  id: string
  title: string
  status: string
  priority: string
  deadline?: string | null
  next_action?: string | null
}

type Owner = {
  id: string
  objective_id: string
  owner_name: string
  role: string
  authority: string
  responsibility: string | null
  status: string
}

function badgeClass(value: string) {
  if (value === "P0" || value === "blocked" || value === "accountable" || value === "approve") return "border-red-200 bg-red-50 text-red-700"
  if (value === "P1" || value === "active" || value === "manager" || value === "manage") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "completed" || value === "executor" || value === "execute") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

export default function MyOwnershipWorkQueue() {
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [owners, setOwners] = useState<Owner[]>([])
  const [selectedOwner, setSelectedOwner] = useState("all")
  const [query, setQuery] = useState("")
  const [error, setError] = useState("")

  async function loadAll() {
    setError("")
    const objectiveRes = await fetch("/api/market-os/strategy-objectives")
    const ownerRes = await fetch("/api/market-os/objective-owners")

    const objectiveJson = await objectiveRes.json()
    const ownerJson = await ownerRes.json()

    if (!objectiveRes.ok) setError(objectiveJson.error || "Failed to load objectives")
    if (!ownerRes.ok) setError(ownerJson.error || "Failed to load owners")

    setObjectives(objectiveJson.data || [])
    setOwners(ownerJson.data || [])
  }

  useEffect(() => {
    loadAll()
  }, [])

  const ownerNames = useMemo(() => {
    return Array.from(new Set(owners.map((o) => o.owner_name).filter(Boolean))).sort()
  }, [owners])

  const enriched = useMemo(() => {
    const q = query.toLowerCase().trim()

    return owners
      .filter((owner) => selectedOwner === "all" || owner.owner_name === selectedOwner)
      .map((owner) => {
        const objective = objectives.find((o) => o.id === owner.objective_id)
        return { owner, objective }
      })
      .filter(({ owner, objective }) => {
        if (!objective) return false
        return (
          !q ||
          owner.owner_name.toLowerCase().includes(q) ||
          owner.role.toLowerCase().includes(q) ||
          owner.authority.toLowerCase().includes(q) ||
          objective.title.toLowerCase().includes(q) ||
          owner.responsibility?.toLowerCase().includes(q)
        )
      })
  }, [owners, objectives, selectedOwner, query])

  const activeItems = enriched.filter(({ objective, owner }) => objective?.status === "active" && owner.status === "active").length
  const blockedItems = enriched.filter(({ objective }) => objective?.status === "blocked").length
  const approvalItems = enriched.filter(({ owner }) => owner.authority === "approve").length
  const executionItems = enriched.filter(({ owner }) => owner.authority === "execute").length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Hardening Pack 15
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Owner Dashboard & Personal Work Queue
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            View every objective assigned by owner, role, authority, responsibility, priority and execution status.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Active Work</p>
              <p className="mt-2 text-3xl font-black">{activeItems}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Blocked</p>
              <p className="mt-2 text-3xl font-black">{blockedItems}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Approval Authority</p>
              <p className="mt-2 text-3xl font-black">{approvalItems}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Execution Authority</p>
              <p className="mt-2 text-3xl font-black">{executionItems}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">
            {error}
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search owner, objective, role, authority..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            />

            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            >
              <option value="all">All owners</option>
              {ownerNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {enriched.map(({ owner, objective }) => (
            <article key={owner.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(objective?.priority || "")}`}>
                      {objective?.priority || "NO PRIORITY"}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(objective?.status || "")}`}>
                      {objective?.status || "NO STATUS"}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(owner.role)}`}>
                      {owner.role}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(owner.authority)}`}>
                      {owner.authority}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{objective?.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Owner: {owner.owner_name} · Deadline: {objective?.deadline || "Not set"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-right">
                  <p className="text-xs font-bold uppercase text-slate-500">Owner Status</p>
                  <p className="mt-1 font-black">{owner.status}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Responsibility</p>
                  <p className="mt-2 text-sm text-slate-700">{owner.responsibility || "No responsibility defined."}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Next Action</p>
                  <p className="mt-2 text-sm text-slate-700">{objective?.next_action || "No next action."}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Authority Meaning</p>
                  <p className="mt-2 text-sm text-slate-700">
                    {owner.authority === "approve" && "Can approve or reject execution."}
                    {owner.authority === "manage" && "Can coordinate execution and owners."}
                    {owner.authority === "execute" && "Can perform assigned work."}
                    {owner.authority === "review" && "Can review and validate quality."}
                    {owner.authority === "view" && "Can observe only."}
                  </p>
                </div>
              </div>
            </article>
          ))}

          {!enriched.length && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-bold text-slate-500">
              No ownership assignments found.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

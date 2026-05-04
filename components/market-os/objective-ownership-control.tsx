"use client"

import { useEffect, useMemo, useState } from "react"

type Objective = {
  id: string
  title: string
  owner_name: string | null
  status: string
  priority: string
}

type Owner = {
  id: string
  objective_id: string
  owner_name: string
  role: "accountable" | "manager" | "executor" | "reviewer" | "observer"
  authority: "approve" | "manage" | "execute" | "review" | "view"
  responsibility: string | null
  status: "active" | "paused" | "removed"
}

function badgeClass(value: string) {
  if (value === "accountable" || value === "approve") return "border-red-200 bg-red-50 text-red-700"
  if (value === "manager" || value === "manage") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "executor" || value === "execute" || value === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

export default function ObjectiveOwnershipControl() {
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [owners, setOwners] = useState<Owner[]>([])
  const [selectedObjectiveId, setSelectedObjectiveId] = useState("")
  const [form, setForm] = useState({
    owner_name: "",
    role: "executor",
    authority: "execute",
    responsibility: "",
  })
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

    if (!selectedObjectiveId && objectiveJson.data?.[0]?.id) {
      setSelectedObjectiveId(objectiveJson.data[0].id)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  async function addOwner() {
    if (!selectedObjectiveId) return setError("Select an objective first")
    if (!form.owner_name.trim()) return setError("Owner name is required")

    const res = await fetch("/api/market-os/objective-owners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        objective_id: selectedObjectiveId,
        ...form,
        status: "active",
      }),
    })

    const json = await res.json()
    if (!res.ok) setError(json.error || "Failed to add owner")
    else {
      setForm({
        owner_name: "",
        role: "executor",
        authority: "execute",
        responsibility: "",
      })
      await loadAll()
    }
  }

  async function updateOwner(owner: Owner, patch: Partial<Owner>) {
    const res = await fetch("/api/market-os/objective-owners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...owner, ...patch }),
    })

    const json = await res.json()
    if (!res.ok) setError(json.error || "Failed to update owner")
    else await loadAll()
  }

  async function deleteOwner(id: string) {
    const res = await fetch(`/api/market-os/objective-owners?id=${id}`, {
      method: "DELETE",
    })

    const json = await res.json()
    if (!res.ok) setError(json.error || "Failed to delete owner")
    else await loadAll()
  }

  const filteredObjectives = useMemo(() => {
    const q = query.toLowerCase().trim()
    return objectives.filter((o) => !q || o.title.toLowerCase().includes(q) || o.owner_name?.toLowerCase().includes(q))
  }, [objectives, query])

  const selectedObjective = objectives.find((o) => o.id === selectedObjectiveId)
  const selectedOwners = owners.filter((o) => o.objective_id === selectedObjectiveId)

  const accountable = owners.filter((o) => o.role === "accountable").length
  const managers = owners.filter((o) => o.role === "manager").length
  const executors = owners.filter((o) => o.role === "executor").length
  const reviewers = owners.filter((o) => o.role === "reviewer").length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Hardening Pack 14
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Objective Ownership Control
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            Assign multiple owners, roles, authorities and responsibilities to each strategic objective.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4"><p className="text-xs uppercase text-slate-300">Accountable</p><p className="mt-2 text-3xl font-black">{accountable}</p></div>
            <div className="rounded-3xl bg-white/10 p-4"><p className="text-xs uppercase text-slate-300">Managers</p><p className="mt-2 text-3xl font-black">{managers}</p></div>
            <div className="rounded-3xl bg-white/10 p-4"><p className="text-xs uppercase text-slate-300">Executors</p><p className="mt-2 text-3xl font-black">{executors}</p></div>
            <div className="rounded-3xl bg-white/10 p-4"><p className="text-xs uppercase text-slate-300">Reviewers</p><p className="mt-2 text-3xl font-black">{reviewers}</p></div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">
            {error}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">Objectives</h2>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search objectives..."
              className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            />

            <div className="mt-4 grid gap-2">
              {filteredObjectives.map((objective) => (
                <button
                  key={objective.id}
                  onClick={() => setSelectedObjectiveId(objective.id)}
                  className={`rounded-2xl border p-4 text-left ${
                    selectedObjectiveId === objective.id
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p className="font-black">{objective.title}</p>
                  <p className="mt-1 text-xs opacity-70">
                    {objective.priority} · {objective.status}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-black">
              {selectedObjective ? selectedObjective.title : "Select objective"}
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={form.owner_name}
                onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                placeholder="Owner name"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />

              <input
                value={form.responsibility}
                onChange={(e) => setForm({ ...form, responsibility: e.target.value })}
                placeholder="Responsibility"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />

              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
              >
                <option value="accountable">Accountable</option>
                <option value="manager">Manager</option>
                <option value="executor">Executor</option>
                <option value="reviewer">Reviewer</option>
                <option value="observer">Observer</option>
              </select>

              <select
                value={form.authority}
                onChange={(e) => setForm({ ...form, authority: e.target.value })}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
              >
                <option value="approve">Approve</option>
                <option value="manage">Manage</option>
                <option value="execute">Execute</option>
                <option value="review">Review</option>
                <option value="view">View</option>
              </select>
            </div>

            <button onClick={addOwner} className="mt-4 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">
              Add Owner
            </button>

            <div className="mt-6 grid gap-3">
              {selectedOwners.map((owner) => (
                <div key={owner.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(owner.role)}`}>{owner.role}</span>
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(owner.authority)}`}>{owner.authority}</span>
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(owner.status)}`}>{owner.status}</span>
                      </div>
                      <h3 className="mt-3 text-lg font-black">{owner.owner_name}</h3>
                      <p className="mt-1 text-sm text-slate-600">{owner.responsibility || "No responsibility defined."}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => updateOwner(owner, { status: "active" })} className="rounded-xl border px-3 py-1 text-xs font-bold">Active</button>
                      <button onClick={() => updateOwner(owner, { status: "paused" })} className="rounded-xl border px-3 py-1 text-xs font-bold">Pause</button>
                      <button onClick={() => deleteOwner(owner.id)} className="rounded-xl border border-red-200 px-3 py-1 text-xs font-bold text-red-700">Delete</button>
                    </div>
                  </div>
                </div>
              ))}

              {!selectedOwners.length && (
                <div className="rounded-3xl border border-dashed border-slate-300 p-6 text-center text-sm font-bold text-slate-500">
                  No owners assigned yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

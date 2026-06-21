"use client"

import { useEffect, useMemo, useState } from "react"

type MarketUser = {
  id: string
  name: string
  email: string | null
  role: "admin" | "manager" | "operator" | "viewer"
  is_active: boolean
}

type Objective = {
  id: string
  title: string
  owner_id: string | null
  owner_name: string | null
  priority: string
  status: string
}

const emptyUser = {
  name: "",
  email: "",
  role: "operator",
  is_active: true,
}

function badgeClass(value: string | boolean) {
  if (value === "admin" || value === "P0") return "border-red-200 bg-red-50 text-red-700"
  if (value === "manager" || value === "P1") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "operator" || value === true || value === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

export default function MarketOsUserManagement() {
  const [users, setUsers] = useState<MarketUser[]>([])
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [form, setForm] = useState<any>(emptyUser)
  const [query, setQuery] = useState("")
  const [selectedObjectiveId, setSelectedObjectiveId] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function loadAll() {
    setError("")

    const usersRes = await fetch("/api/market-os/users")
    const objectivesRes = await fetch("/api/market-os/strategy-objectives")

    const usersJson = await usersRes.json()
    const objectivesJson = await objectivesRes.json()

    if (!usersRes.ok) setError(usersJson.error || "Failed to load users")
    if (!objectivesRes.ok) setError(objectivesJson.error || "Failed to load objectives")

    setUsers(usersJson.data || [])
    setObjectives(objectivesJson.data || [])
  }

  useEffect(() => {
    loadAll()
  }, [])

  async function createUser() {
    if (!form.name.trim()) return setError("Name is required")

    setLoading(true)
    setError("")
    setMessage("")

    const res = await fetch("/api/market-os/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    const json = await res.json()

    if (!res.ok) setError(json.error || "Failed to create user")
    else {
      setForm(emptyUser)
      setMessage("User created successfully")
      await loadAll()
    }

    setLoading(false)
  }

  async function toggleUser(user: MarketUser) {
    setLoading(true)
    setError("")
    setMessage("")

    const res = await fetch("/api/market-os/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...user, is_active: !user.is_active }),
    })

    const json = await res.json()

    if (!res.ok) setError(json.error || "Failed to update user")
    else {
      setMessage("User updated successfully")
      await loadAll()
    }

    setLoading(false)
  }

  async function deleteUser(id: string) {
    setLoading(true)
    setError("")
    setMessage("")

    const res = await fetch(`/api/market-os/users?id=${id}`, {
      method: "DELETE",
    })

    const json = await res.json()

    if (!res.ok) setError(json.error || "Failed to delete user")
    else {
      setMessage("User deleted successfully")
      await loadAll()
    }

    setLoading(false)
  }

  async function bindObjectiveOwner() {
    if (!selectedObjectiveId) return setError("Select an objective")
    if (!selectedUserId) return setError("Select a user")

    setLoading(true)
    setError("")
    setMessage("")

    const res = await fetch("/api/market-os/objective-user-binding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        objective_id: selectedObjectiveId,
        owner_id: selectedUserId,
      }),
    })

    const json = await res.json()

    if (!res.ok) setError(json.error || "Failed to bind owner")
    else {
      setMessage("Objective owner bound successfully")
      await loadAll()
    }

    setLoading(false)
  }

  const filteredUsers = useMemo(() => {
    const q = query.toLowerCase().trim()
    return users.filter((u) => {
      return !q || u.name.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
    })
  }, [users, query])

  const activeUsers = users.filter((u) => u.is_active).length
  const admins = users.filter((u) => u.role === "admin").length
  const managers = users.filter((u) => u.role === "manager").length
  const operators = users.filter((u) => u.role === "operator").length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 31
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            User Management & Objective Owner Binding
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            Create real Market-OS users, manage roles, activate/deactivate users, and bind objectives to real user records while preserving owner_name compatibility.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Active Users</p>
              <p className="mt-2 text-3xl font-black">{activeUsers}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Admins</p>
              <p className="mt-2 text-3xl font-black">{admins}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Managers</p>
              <p className="mt-2 text-3xl font-black">{managers}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Operators</p>
              <p className="mt-2 text-3xl font-black">{operators}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            {message}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">Create Market-OS User</h2>

            <div className="mt-4 grid gap-3">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />

              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />

              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="operator">Operator</option>
                <option value="viewer">Viewer</option>
              </select>

              <button
                onClick={createUser}
                disabled={loading}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                Create User
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">Bind Objective To Real User</h2>

            <div className="mt-4 grid gap-3">
              <select
                value={selectedObjectiveId}
                onChange={(e) => setSelectedObjectiveId(e.target.value)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
              >
                <option value="">Select objective</option>
                {objectives.map((objective) => (
                  <option key={objective.id} value={objective.id}>
                    {objective.title} · current: {objective.owner_name || "Unassigned"}
                  </option>
                ))}
              </select>

              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
              >
                <option value="">Select active user</option>
                {users.filter((u) => u.is_active).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} · {user.role}
                  </option>
                ))}
              </select>

              <button
                onClick={bindObjectiveOwner}
                disabled={loading}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                Bind Owner
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />
        </div>

        <div className="grid gap-5">
          {filteredUsers.map((user) => (
            <article key={user.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(user.role)}`}>
                      {user.role}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(user.is_active)}`}>
                      {user.is_active ? "active" : "inactive"}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{user.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{user.email || "No email"}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleUser(user)}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold"
                  >
                    {user.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}

          {!filteredUsers.length && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-bold text-slate-500">
              No users found.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

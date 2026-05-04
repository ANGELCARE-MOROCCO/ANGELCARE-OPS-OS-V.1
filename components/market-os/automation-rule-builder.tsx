"use client"

import { useEffect, useState } from "react"

type Rule = {
  id: string
  rule_name: string | null
  condition_key: string | null
  condition_operator: string | null
  condition_value: string | null
  action_type: string | null
  action_value: string | null
  is_active: boolean
}

const emptyForm = {
  rule_name: "",
  condition_key: "next_action",
  condition_operator: "is_null",
  condition_value: "",
  action_type: "set_next_action",
  action_value: "Define execution step immediately",
  is_active: true,
}

function badgeClass(active: boolean) {
  return active
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-50 text-slate-600"
}

export default function AutomationRuleBuilder() {
  const [rules, setRules] = useState<Rule[]>([])
  const [form, setForm] = useState<any>(emptyForm)
  const [actions, setActions] = useState<string[]>([])
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function loadRules() {
    const res = await fetch("/api/market-os/automation-rules")
    const json = await res.json()

    if (!res.ok) setError(json.error || "Failed to load rules")
    else setRules(json.data || [])
  }

  useEffect(() => {
    loadRules()
  }, [])

  async function createRule() {
    if (!form.rule_name.trim()) return setError("Rule name is required")

    setLoading(true)
    setError("")
    setMessage("")

    const res = await fetch("/api/market-os/automation-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    const json = await res.json()

    if (!res.ok) setError(json.error || "Failed to create rule")
    else {
      setForm(emptyForm)
      setMessage("Rule created successfully")
      await loadRules()
    }

    setLoading(false)
  }

  async function toggleRule(rule: Rule) {
    setLoading(true)
    setError("")

    const res = await fetch("/api/market-os/automation-rules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...rule, is_active: !rule.is_active }),
    })

    const json = await res.json()

    if (!res.ok) setError(json.error || "Failed to update rule")
    else await loadRules()

    setLoading(false)
  }

  async function deleteRule(id: string) {
    setLoading(true)
    setError("")

    const res = await fetch(`/api/market-os/automation-rules?id=${id}`, {
      method: "DELETE",
    })

    const json = await res.json()

    if (!res.ok) setError(json.error || "Failed to delete rule")
    else await loadRules()

    setLoading(false)
  }

  async function runAutomation() {
    setLoading(true)
    setError("")
    setMessage("")
    setActions([])

    const res = await fetch("/api/market-os/automation-engine", {
      method: "POST",
    })

    const json = await res.json()

    if (!res.ok) setError(json.error || "Automation failed")
    else {
      setMessage(json.message || "Automation executed")
      setActions(json.actions || [])
    }

    setLoading(false)
  }

  const activeRules = rules.filter((r) => r.is_active).length
  const inactiveRules = rules.filter((r) => !r.is_active).length
  const nextActionRules = rules.filter((r) => r.action_type === "set_next_action").length
  const ownerRules = rules.filter((r) => r.action_type === "assign_owner").length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Final Pack 27
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Visual Automation Rule Builder
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            Create, activate, deactivate and run automation rules without terminal commands.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Active Rules</p>
              <p className="mt-2 text-3xl font-black">{activeRules}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Inactive Rules</p>
              <p className="mt-2 text-3xl font-black">{inactiveRules}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Next Action Rules</p>
              <p className="mt-2 text-3xl font-black">{nextActionRules}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Owner Rules</p>
              <p className="mt-2 text-3xl font-black">{ownerRules}</p>
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

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Create Automation Rule</h2>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              value={form.rule_name}
              onChange={(e) => setForm({ ...form, rule_name: e.target.value })}
              placeholder="Rule name"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            />

            <select
              value={form.condition_key}
              onChange={(e) => setForm({ ...form, condition_key: e.target.value })}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            >
              <option value="next_action">Condition: Next Action</option>
              <option value="owner_name">Condition: Owner</option>
              <option value="status">Condition: Status</option>
              <option value="priority">Condition: Priority</option>
            </select>

            <select
              value={form.condition_operator}
              onChange={(e) => setForm({ ...form, condition_operator: e.target.value })}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            >
              <option value="is_null">Is empty</option>
              <option value="equals">Equals</option>
              <option value="not_equals">Not equals</option>
            </select>

            <input
              value={form.condition_value}
              onChange={(e) => setForm({ ...form, condition_value: e.target.value })}
              placeholder="Condition value, optional for Is empty"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            />

            <select
              value={form.action_type}
              onChange={(e) => setForm({ ...form, action_type: e.target.value })}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold"
            >
              <option value="set_next_action">Action: Set next action</option>
              <option value="assign_owner">Action: Assign owner</option>
            </select>

            <input
              value={form.action_value}
              onChange={(e) => setForm({ ...form, action_value: e.target.value })}
              placeholder="Action value"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={createRule}
              disabled={loading}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              Create Rule
            </button>

            <button
              onClick={runAutomation}
              disabled={loading}
              className="rounded-2xl border border-blue-200 px-5 py-3 text-sm font-bold text-blue-700 disabled:opacity-50"
            >
              Run Automation Now
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Latest Automation Actions</h2>

          <div className="mt-4 grid gap-2">
            {actions.map((action, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold">
                {action}
              </div>
            ))}

            {!actions.length && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm font-bold text-slate-500">
                No latest actions yet.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-5">
          {rules.map((rule) => (
            <article key={rule.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(rule.is_active)}`}>
                      {rule.is_active ? "active" : "inactive"}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold">
                      {rule.action_type}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{rule.rule_name || "Untitled rule"}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    If {rule.condition_key} {rule.condition_operator} {rule.condition_value || "empty"} → {rule.action_type}: {rule.action_value}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleRule(rule)}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold"
                  >
                    {rule.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}

          {!rules.length && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-bold text-slate-500">
              No automation rules yet.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

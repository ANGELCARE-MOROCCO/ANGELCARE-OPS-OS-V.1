"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type Domain = "ambassador-program" | "partners-network"
type Mode = "list" | "new" | "detail" | "edit"

type Props = {
  domain: Domain
  resource: string
  mode?: Mode
  recordId?: string
  title?: string
  description?: string
}

type RecordData = Record<string, any>

const domainBase: Record<Domain, string> = {
  "ambassador-program": "/market-os/ambassador-program",
  "partners-network": "/market-os/partners-network",
}

const apiBase: Record<Domain, string> = {
  "ambassador-program": "/api/market-os/ambassador-program",
  "partners-network": "/api/market-os/partners-network",
}

const resourceLabels: Record<string, string> = {
  ambassadors: "Ambassadors",
  ambassador_programs: "Programs",
  ambassador_missions: "Missions",
  ambassador_leads: "Referral Leads",
  ambassador_payouts: "Payouts",
  ambassador_territories: "Territories",
  ambassador_documents: "Documents",
  ambassador_approvals: "Approvals",
  partners: "Partners",
  partner_programs: "Programs",
  partner_leads: "Partner Leads",
  partner_deals: "Deals / Cases",
  partner_payouts: "Payouts",
  partner_territories: "Territories",
  partner_documents: "Documents",
  partner_approvals: "Approvals",
}

const pathMap: Record<string, string> = {
  ambassadors: "ambassadors",
  ambassador_programs: "programs",
  ambassador_missions: "missions",
  ambassador_leads: "leads",
  ambassador_payouts: "payouts",
  ambassador_territories: "territories",
  ambassador_documents: "documents",
  ambassador_approvals: "approvals",
  partners: "partners",
  partner_programs: "programs",
  partner_leads: "leads",
  partner_deals: "deals",
  partner_payouts: "payouts",
  partner_territories: "territories",
  partner_documents: "documents",
  partner_approvals: "approvals",
}

const defaultFields: Record<string, string[]> = {
  ambassadors: ["name", "status", "type", "city", "area", "assigned_manager", "commission_model", "risk_score"],
  ambassador_programs: ["name", "status", "program_type", "target_audience", "commission_model", "kpi_target", "approval_workflow"],
  ambassador_missions: ["title", "status", "priority", "deadline", "expected_proof", "assigned_to", "validation_status"],
  ambassador_leads: ["name", "status", "phone", "city", "source_code", "owner_name", "conversion_value"],
  ambassador_payouts: ["name", "status", "amount", "currency", "period", "approval_status", "payment_reference"],
  ambassador_territories: ["name", "status", "city", "zone", "coverage_score", "saturation_score", "assigned_owner"],
  ambassador_documents: ["title", "status", "document_type", "owner_name", "approval_status", "expires_at"],
  ambassador_approvals: ["title", "status", "approval_type", "requested_by", "assigned_to", "risk_level"],
  partners: ["name", "status", "partner_type", "city", "assigned_manager", "contract_status", "risk_score"],
  partner_programs: ["name", "status", "program_type", "services_allowed", "commission_model", "workflow_definition"],
  partner_leads: ["name", "status", "phone", "city", "partner_code", "validation_status", "conversion_value"],
  partner_deals: ["title", "status", "deal_stage", "partner_name", "value", "sla_status", "assigned_owner"],
  partner_payouts: ["name", "status", "amount", "currency", "period", "approval_status", "payment_reference"],
  partner_territories: ["name", "status", "city", "zone", "coverage_score", "saturation_score", "assigned_owner"],
  partner_documents: ["title", "status", "document_type", "partner_name", "approval_status", "expires_at"],
  partner_approvals: ["title", "status", "approval_type", "requested_by", "assigned_to", "risk_level"],
}

function blank(resource: string): RecordData {
  const fields = defaultFields[resource] || ["name", "status", "description"]
  return Object.fromEntries(fields.map((field) => [field, field === "status" ? "draft" : ""]))
}

function resourcePath(domain: Domain, resource: string) {
  if (resource === "ambassadors" || resource === "partners") return domainBase[domain]
  return `${domainBase[domain]}/${pathMap[resource] || resource}`
}

export function DatabaseCrudPage({ domain, resource, mode = "list", recordId, title, description }: Props) {
  const [records, setRecords] = useState<RecordData[]>([])
  const [record, setRecord] = useState<RecordData>(() => blank(resource))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [notice, setNotice] = useState("")

  const label = title || resourceLabels[resource] || resource
  const base = resourcePath(domain, resource)
  const fields = defaultFields[resource] || ["name", "status", "description"]
  const endpoint = `${apiBase[domain]}?resource=${encodeURIComponent(resource)}`

  async function load() {
    setLoading(true)
    try {
      const url = mode === "detail" || mode === "edit"
        ? `${apiBase[domain]}/${recordId}?resource=${encodeURIComponent(resource)}`
        : `${endpoint}&search=${encodeURIComponent(search)}`
      const res = await fetch(url)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Load failed")
      if (mode === "detail" || mode === "edit") setRecord(json.data || blank(resource))
      else setRecords(json.data || [])
    } catch (error: any) {
      setNotice(error?.message || "Unable to load records")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [resource, mode, recordId])

  async function save() {
    setSaving(true)
    setNotice("")
    try {
      const res = await fetch(mode === "edit" ? `${apiBase[domain]}/${recordId}?resource=${resource}` : endpoint, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Save failed")
      setRecord(json.data || record)
      setNotice("Saved and synchronized with database.")
      if (mode === "new") window.location.href = `${base}/${json.data?.id || ""}`
    } catch (error: any) {
      setNotice(error?.message || "Unable to save")
    } finally {
      setSaving(false)
    }
  }

  async function runAction(action: string) {
    if (!selected.length) return setNotice("Select at least one record first.")
    setSaving(true)
    try {
      const res = await fetch(`${apiBase[domain]}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource, ids: selected, action }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Action failed")
      setNotice(`${action} applied to ${selected.length} record(s).`)
      setSelected([])
      await load()
    } catch (error: any) {
      setNotice(error?.message || "Unable to run action")
    } finally {
      setSaving(false)
    }
  }

  const stats = useMemo(() => {
    const active = records.filter((r) => ["active", "approved", "completed"].includes(String(r.status))).length
    const risk = records.filter((r) => ["flagged", "suspended", "rejected"].includes(String(r.status))).length
    return { total: records.length, active, risk, selected: selected.length }
  }, [records, selected])

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,.35),transparent_35%),linear-gradient(135deg,#020617,#0f172a)] px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-300">
            <Link href="/market-os" className="hover:text-white">Market-OS</Link><span>/</span>
            <Link href={domainBase[domain]} className="hover:text-white">{domain === "ambassador-program" ? "Ambassador Program" : "Partners Network"}</Link><span>/</span>
            <span>{label}</span>
          </div>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">Database Sync + CRUD</p>
              <h1 className="text-4xl font-black tracking-tight md:text-5xl">{label}</h1>
              <p className="mt-3 max-w-3xl text-base text-slate-300">{description || "Create, edit, approve, pause, archive, search and synchronize operational records directly with Supabase."}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={base} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-white hover:bg-white/10">List</Link>
              <Link href={`${base}/new`} className="rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950 hover:bg-cyan-100">+ New</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {notice && <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">{notice}</div>}

        {(mode === "new" || mode === "edit") ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl">
              <h2 className="mb-4 text-2xl font-black">{mode === "new" ? "Create record" : "Edit record"}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {fields.map((field) => (
                  <label key={field} className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{field.replaceAll("_", " ")}</span>
                    <input
                      value={record?.[field] ?? ""}
                      onChange={(e) => setRecord((prev) => ({ ...prev, [field]: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300"
                    />
                  </label>
                ))}
              </div>
              <label className="mt-4 block space-y-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">description / notes</span>
                <textarea
                  value={record?.description ?? record?.notes ?? ""}
                  onChange={(e) => setRecord((prev) => ({ ...prev, description: e.target.value, notes: e.target.value }))}
                  rows={6}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </label>
              <button onClick={save} disabled={saving} className="mt-5 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-60">{saving ? "Saving..." : "Save to database"}</button>
            </div>
            <ControlCard saving={saving} onAction={runAction} />
          </div>
        ) : mode === "detail" ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-black">{record?.name || record?.title || "Record detail"}</h2>
                <Link href={`${base}/${recordId}/edit`} className="rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950">Edit</Link>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(record || {}).map(([key, value]) => (
                  <div key={key} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{key.replaceAll("_", " ")}</p>
                    <p className="mt-1 break-words text-sm text-slate-100">{typeof value === "object" ? JSON.stringify(value) : String(value ?? "—")}</p>
                  </div>
                ))}
              </div>
            </div>
            <ControlCard saving={saving} onAction={(action) => { setSelected(recordId ? [recordId] : []); setTimeout(() => runAction(action), 0) }} />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Metric label="Total records" value={stats.total} />
              <Metric label="Active / approved" value={stats.active} />
              <Metric label="Risk / rejected" value={stats.risk} />
              <Metric label="Selected" value={stats.selected} />
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 gap-2">
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, city, status..." className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300" />
                  <button onClick={load} className="rounded-xl border border-white/15 px-4 py-2 font-bold hover:bg-white/10">Search</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["approve", "activate", "pause", "flag", "archive"].map((a) => <button key={a} onClick={() => runAction(a)} className="rounded-xl border border-white/15 px-3 py-2 text-sm font-bold capitalize hover:bg-white/10">{a}</button>)}
                </div>
              </div>
              {loading ? <p className="p-6 text-slate-300">Loading database records...</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-separate border-spacing-y-2 text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-3 py-2">Select</th>{fields.slice(0,7).map(f => <th key={f} className="px-3 py-2">{f.replaceAll("_", " ")}</th>)}<th className="px-3 py-2">Actions</th></tr></thead>
                    <tbody>
                      {records.map((item) => (
                        <tr key={item.id} className="rounded-2xl bg-slate-900/80">
                          <td className="rounded-l-2xl px-3 py-3"><input type="checkbox" checked={selected.includes(item.id)} onChange={(e) => setSelected(prev => e.target.checked ? [...prev, item.id] : prev.filter(id => id !== item.id))} /></td>
                          {fields.slice(0,7).map(f => <td key={f} className="px-3 py-3 text-slate-200">{String(item[f] ?? "—")}</td>)}
                          <td className="rounded-r-2xl px-3 py-3"><div className="flex gap-2"><Link className="text-cyan-200 hover:text-white" href={`${base}/${item.id}`}>Open</Link><Link className="text-cyan-200 hover:text-white" href={`${base}/${item.id}/edit`}>Edit</Link></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!records.length && <p className="p-6 text-slate-400">No records yet. Create the first one to start execution tracking.</p>}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>
}

function ControlCard({ saving, onAction }: { saving: boolean; onAction: (action: string) => void }) {
  return <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"><h3 className="text-xl font-black">Execution controls</h3><p className="mt-2 text-sm text-slate-400">Actions write status changes and audit events to Supabase.</p><div className="mt-5 grid gap-2">{["approve", "activate", "pause", "complete", "reject", "flag", "archive"].map((a) => <button disabled={saving} onClick={() => onAction(a)} key={a} className="rounded-xl border border-white/15 px-4 py-3 text-left text-sm font-bold capitalize hover:bg-white/10 disabled:opacity-60">{a}</button>)}</div></aside>
}

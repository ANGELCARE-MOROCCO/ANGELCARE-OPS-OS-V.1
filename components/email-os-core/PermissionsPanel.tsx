"use client"

import { useEffect, useState } from "react"
import { KeyRound, Plus, RefreshCw, ShieldCheck } from "lucide-react"

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } })
  return res.json()
}

export default function PermissionsPanel() {
  const [permissions, setPermissions] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [audit, setAudit] = useState<any[]>([])
  const [status, setStatus] = useState("Ready")

  async function load() {
    const [p, profilesRes, auditRes] = await Promise.all([
      api("/api/email-os/access/permissions"),
      api("/api/email-os/access/profiles"),
      api("/api/email-os/access/audit")
    ])

    setPermissions(p.data || [])
    setProfiles(profilesRes.data || [])
    setAudit(auditRes.data || [])
  }

  async function createProfile() {
    const result = await api("/api/email-os/access/profiles", {
      method: "POST",
      body: JSON.stringify({
        name: "Operations Profile",
        roleKey: "operations",
        description: "Default operational Email-OS access profile"
      })
    })

    setStatus(result.ok ? "Profile created" : result.error || "Failed")
    await load()
  }

  useEffect(() => { load() }, [])

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">Email-OS Permissions</h2>
              <p className="text-sm text-slate-500">{status}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={load} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>

            <button onClick={createProfile} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-bold text-white">
              <Plus className="h-4 w-4" /> New profile
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-2xl font-black">{permissions.length}</div>
            <div className="text-xs font-black uppercase text-slate-400">Mailbox rules</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-2xl font-black">{profiles.length}</div>
            <div className="text-xs font-black uppercase text-slate-400">Access profiles</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-2xl font-black">{audit.length}</div>
            <div className="text-xs font-black uppercase text-slate-400">Access audit events</div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-lg font-black text-slate-950">
            <ShieldCheck className="h-5 w-5" /> Profiles
          </h3>

          <div className="mt-4 space-y-3">
            {profiles.length === 0 ? <div className="text-sm font-bold text-slate-500">No profiles yet.</div> : null}

            {profiles.map((profile) => (
              <div key={profile.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-black text-slate-950">{profile.name}</div>
                <div className="text-sm text-slate-500">{profile.role_key}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Latest Access Audit</h3>

          <div className="mt-4 space-y-3">
            {audit.length === 0 ? <div className="text-sm font-bold text-slate-500">No audit events yet.</div> : null}

            {audit.slice(0, 10).map((event) => (
              <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-black text-slate-950">{event.action} • {event.decision}</div>
                <div className="text-sm text-slate-500">{event.principal_type}:{event.principal_id}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

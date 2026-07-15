"use client"

import { useEffect, useState } from "react"
import { Plus, RefreshCw, Server } from "lucide-react"

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } })
  return res.json()
}

export default function ProviderProfilesPanel() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [status, setStatus] = useState("Ready")

  async function load() {
    const result = await api("/api/email-os/provider-profiles")
    setProfiles(result.data || [])
  }

  async function createMenaraDefault() {
    const result = await api("/api/email-os/provider-profiles", {
      method: "POST",
      body: JSON.stringify({ useMenaraDefault: true })
    })
    setStatus(result.ok ? "Menara default profile created" : result.error || "Failed")
    await load()
  }

  useEffect(() => { load() }, [])

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700"><Server className="h-5 w-5" /></div>
          <div><h2 className="text-lg font-black text-slate-950">Provider Profiles</h2><p className="text-sm text-slate-500">{status}</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>
          <button onClick={createMenaraDefault} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Menara default</button>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {profiles.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm font-bold text-slate-500">No provider profiles yet.</div> : null}
        {profiles.map((profile) => (
          <div key={profile.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="font-black text-slate-950">{profile.name}</div>
            <div className="mt-1 text-sm text-slate-500">{profile.smtp_host}:{profile.smtp_port} • {profile.imap_host}:{profile.imap_port}</div>
            {profile.is_default ? <div className="mt-2 text-xs font-black uppercase text-emerald-700">Default</div> : null}
          </div>
        ))}
      </div>
    </section>
  )
}

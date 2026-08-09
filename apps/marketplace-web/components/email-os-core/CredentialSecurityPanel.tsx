"use client"

import { useEffect, useState } from "react"
import { KeyRound, RefreshCw, RotateCcw, ShieldCheck } from "lucide-react"

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } })
  return res.json()
}

export default function CredentialSecurityPanel() {
  const [credentials, setCredentials] = useState<any[]>([])
  const [vaultRefs, setVaultRefs] = useState<any[]>([])
  const [rotations, setRotations] = useState<any[]>([])
  const [status, setStatus] = useState("Ready")

  async function load() {
    const [c, v, r] = await Promise.all([
      api("/api/email-os/mailbox-credentials"),
      api("/api/email-os/security/vault-refs"),
      api("/api/email-os/security/credential-rotations")
    ])

    setCredentials(c.data || [])
    setVaultRefs(v.data || [])
    setRotations(r.data || [])
  }

  async function scheduleRotation(id: string) {
    const result = await api("/api/email-os/security/credential-rotations", {
      method: "POST",
      body: JSON.stringify({
        mailboxCredentialId: id,
        reason: "scheduled from security panel"
      })
    })

    setStatus(result.ok ? "Rotation scheduled" : result.error || "Failed")
    await load()
  }

  async function createVaultRef(id: string, email: string) {
    const result = await api("/api/email-os/security/vault-refs", {
      method: "POST",
      body: JSON.stringify({
        mailboxCredentialId: id,
        vaultProvider: "manual",
        vaultKey: `email-os/${email}`
      })
    })

    setStatus(result.ok ? "Vault ref created" : result.error || "Failed")
    await load()
  }

  useEffect(() => { load() }, [])

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">Credential Security</h2>
              <p className="text-sm text-slate-500">{status}</p>
            </div>
          </div>

          <button onClick={load} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-2xl font-black">{credentials.length}</div>
            <div className="text-xs font-black uppercase text-slate-400">Credentials</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-2xl font-black">{vaultRefs.length}</div>
            <div className="text-xs font-black uppercase text-slate-400">Vault refs</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-2xl font-black">{rotations.length}</div>
            <div className="text-xs font-black uppercase text-slate-400">Rotations</div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black text-slate-950">Mailbox Credentials</h3>

        <div className="mt-4 space-y-3">
          {credentials.length === 0 ? <div className="text-sm font-bold text-slate-500">No mailbox credentials yet.</div> : null}

          {credentials.map((credential) => (
            <div key={credential.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <div className="font-black text-slate-950">{credential.email_address}</div>
                <div className="text-sm text-slate-500">Test: {credential.last_test_status || "not tested"}</div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => createVaultRef(credential.id, credential.email_address)} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
                  <KeyRound className="h-4 w-4" /> Vault ref
                </button>
                <button onClick={() => scheduleRotation(credential.id)} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-bold text-white">
                  <RotateCcw className="h-4 w-4" /> Rotate
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, RefreshCw, ShieldAlert, TestTube2 } from "lucide-react"

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } })
  return res.json()
}

export default function MailboxTestingPanel() {
  const [credentials, setCredentials] = useState<any[]>([])
  const [tests, setTests] = useState<any[]>([])
  const [status, setStatus] = useState("Ready")
  const [passwords, setPasswords] = useState<Record<string, string>>({})

  async function load() {
    const [credRes, testRes] = await Promise.all([
      api("/api/email-os/mailbox-credentials"),
      api("/api/email-os/credential-tests")
    ])
    setCredentials(credRes.data || [])
    setTests(testRes.data || [])
  }

  async function testCredential(id: string) {
    const password = passwords[id]
    if (!password) {
      setStatus("Password required for test")
      return
    }
    const result = await api("/api/email-os/mailbox-credentials/test", {
      method: "POST",
      body: JSON.stringify({ credentialId: id, password })
    })
    setStatus(result.ok ? "Credential test completed" : result.error || "Test failed")
    await load()
  }

  useEffect(() => { load() }, [])

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-100 p-3 text-blue-700"><TestTube2 className="h-5 w-5" /></div>
            <div><h2 className="text-lg font-black text-slate-950">Mailbox Credential Testing</h2><p className="text-sm text-slate-500">{status}</p></div>
          </div>
          <button onClick={load} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>
        </div>

        <div className="mt-5 space-y-3">
          {credentials.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm font-bold text-slate-500">No credentials yet.</div> : null}
          {credentials.map((credential) => (
            <div key={credential.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-black text-slate-950">{credential.email_address}</div>
                  <div className="text-sm text-slate-500">Status: {credential.last_test_status || "not tested"}</div>
                </div>
                <div className="flex gap-2">
                  <input value={passwords[credential.id] || ""} onChange={(e) => setPasswords({ ...passwords, [credential.id]: e.target.value })} placeholder="password for test" type="password" className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none" />
                  <button onClick={() => testCredential(credential.id)} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-bold text-white">Test</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black text-slate-950">Latest Test Results</h3>
        <div className="mt-4 space-y-3">
          {tests.length === 0 ? <div className="text-sm font-bold text-slate-500">No test logs yet.</div> : null}
          {tests.slice(0, 10).map((test) => (
            <div key={test.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div><div className="font-black text-slate-950">{test.email_address || test.test_type}</div><div className="text-sm text-slate-500">{test.tested_at}</div></div>
              <div className={test.status === "passed" ? "text-emerald-700" : "text-rose-700"}>{test.status === "passed" ? <CheckCircle2 className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

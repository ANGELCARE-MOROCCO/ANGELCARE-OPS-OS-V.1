"use client"

import { useEffect, useState } from "react"
import { realEmailOSRequest } from "@/lib/email-os/real/client"
import { AlertTriangle, CheckCircle2, RefreshCw, Save, Settings } from "lucide-react"

function Button({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
      {children}
    </button>
  )
}

export default function ConfigurationLiveWorkspace() {
  const [health, setHealth] = useState<Record<string, boolean> | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const result = await realEmailOSRequest<any>("/api/email-os/real/provider-health")
    setHealth(result.data?.data || result.data || null)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const items = health ? Object.entries(health) : []

  return (
    <div className="min-h-full bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-950">Configuration Center</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Real environment/provider readiness. This page does not fake SMTP/IMAP readiness.
                </p>
              </div>
            </div>
            <Button onClick={load}><RefreshCw className="h-4 w-4" /> Refresh checks</Button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-black text-slate-950">Provider & Environment Checks</h2>
            <p className="mt-1 text-sm text-slate-500">If a value is missing, configure it in Vercel/local env.</p>
          </div>

          {loading ? (
            <div className="p-5 text-sm font-semibold text-slate-500">Checking provider readiness...</div>
          ) : (
            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map(([key, value]) => (
                <div key={key} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-slate-950">{key}</div>
                      <div className="mt-1 text-xs text-slate-500">Environment variable status</div>
                    </div>
                    {value ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">Operational configuration actions</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => setToast("Configuration is stored through environment variables and database policy tables.")}>
              <Save className="h-4 w-4" /> Save policy note
            </Button>
            <Button onClick={() => realEmailOSRequest("/api/email-os/real/audit", { method: "POST", body: JSON.stringify({ action: "configuration.checked", severity: "info" }) }).then(() => setToast("Audit checkpoint created"))}>
              Create audit checkpoint
            </Button>
          </div>
        </section>
      </div>

      {toast ? <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold shadow-2xl">{toast}</div> : null}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'

export default function RevenueRecoveryImportPage() {
  const [status, setStatus] = useState<any>(null)
  const [result, setResult] = useState<any>(null)
  const [busy, setBusy] = useState(false)

  async function loadStatus() {
    const res = await fetch('/api/revenue-command-center/recovery/status', { cache: 'no-store' })
    setStatus(await res.json())
  }

  async function importNow() {
    setBusy(true)
    try {
      const res = await fetch('/api/revenue-command-center/recovery/import', { method: 'POST' })
      const json = await res.json()
      setResult(json)
      await loadStatus()
    } finally {
      setBusy(false)
    }
  }

  async function restoreThisBrowser() {
    const res = await fetch('/api/revenue-command-center/recovery/raw', { cache: 'no-store' })
    const json = await res.json()
    if (!json?.ok) return setResult(json)
    let restored = 0
    for (const [key, value] of Object.entries(json.payload as Record<string, string>)) {
      localStorage.setItem(key, String(value))
      restored++
    }
    localStorage.setItem('angelcare_revenue_recovery_bridge_v1_applied', '1')
    setResult({ ok: true, browserRestored: restored, message: 'This browser now has the recovered legacy workspace stores.' })
  }

  useEffect(() => { loadStatus() }, [])

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#020617,#0f172a 45%,#111827)', color: '#f8fafc', padding: 32 }}>
      <section style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ border: '1px solid rgba(148,163,184,.25)', borderRadius: 28, padding: 28, background: 'rgba(15,23,42,.74)', boxShadow: '0 24px 100px rgba(0,0,0,.35)' }}>
          <p style={{ margin: 0, color: '#67e8f9', fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', fontSize: 12 }}>AngelCare Revenue Command Recovery</p>
          <h1 style={{ margin: '12px 0 8px', fontSize: 38, lineHeight: 1.05 }}>Permanent migration for recovered staff-browser revenue data</h1>
          <p style={{ color: '#cbd5e1', maxWidth: 840, fontSize: 16 }}>This imports the recovered prospects, appointments, SDR leads, B2C workflow, daily tasks, executive briefing, predictive signals, and HQ records into the central revenue database while restoring legacy workspace localStorage compatibility.</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22 }}>
            <button onClick={importNow} disabled={busy} style={{ border: 0, borderRadius: 16, padding: '13px 18px', background: 'linear-gradient(135deg,#22c55e,#06b6d4)', color: '#020617', fontWeight: 900, cursor: 'pointer' }}>{busy ? 'Importing…' : 'Import recovered data to database'}</button>
            <button onClick={restoreThisBrowser} style={{ border: '1px solid rgba(148,163,184,.35)', borderRadius: 16, padding: '13px 18px', background: 'rgba(15,23,42,.85)', color: '#f8fafc', fontWeight: 800, cursor: 'pointer' }}>Restore legacy workspaces in this browser</button>
            <a href="/revenue-command-center/prospects" style={{ border: '1px solid rgba(34,197,94,.35)', borderRadius: 16, padding: '13px 18px', background: 'rgba(34,197,94,.12)', color: '#bbf7d0', fontWeight: 800, textDecoration: 'none' }}>Open Prospects</a>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16, marginTop: 18 }}>
          {[
            ['Recovered prospects', '78'],
            ['Recovered appointments', '3'],
            ['Recovered SDR leads', '3'],
            ['Recovered B2C records', '3'],
            ['Recovered daily tasks', '3'],
            ['Executive/HQ/Predictive records', '10'],
          ].map(([label, value]) => (
            <div key={label} style={{ border: '1px solid rgba(148,163,184,.22)', borderRadius: 22, padding: 20, background: 'rgba(2,6,23,.55)' }}>
              <div style={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.12em' }}>{label}</div>
              <div style={{ color: '#f8fafc', fontSize: 34, fontWeight: 950, marginTop: 8 }}>{value}</div>
            </div>
          ))}
        </div>

        <pre style={{ whiteSpace: 'pre-wrap', overflow: 'auto', marginTop: 18, border: '1px solid rgba(148,163,184,.22)', borderRadius: 22, padding: 20, background: 'rgba(2,6,23,.8)', color: '#dbeafe', fontSize: 13 }}>{JSON.stringify({ status, result }, null, 2)}</pre>
      </section>
    </main>
  )
}

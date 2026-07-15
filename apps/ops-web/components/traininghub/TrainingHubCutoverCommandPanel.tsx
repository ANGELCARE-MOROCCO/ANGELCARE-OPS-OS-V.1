'use client'

import type { CSSProperties } from 'react'
import { useState } from 'react'

type CutoverStatus = {
  score: number
  data_pass: boolean
  env_pass: boolean
  smoke_count: number
  verdict: string
  env: Record<string, boolean>
  checkpoints: Array<{ table: string; label: string; count: number; minimum: number; pass: boolean; error: string | null }>
  smoke: Array<{ table: string; count: number; error: string | null }>
}

export default function TrainingHubCutoverCommandPanel() {
  const [status, setStatus] = useState<CutoverStatus | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function run(action: 'refresh' | 'cleanup_smoke_records' | 'lock_baseline') {
    setBusy(action)
    setMessage(null)
    try {
      const response = await fetch('/api/traininghub/commercial/cutover', {
        method: action === 'refresh' ? 'GET' : 'POST',
        headers: action === 'refresh' ? undefined : { 'Content-Type': 'application/json' },
        body: action === 'refresh' ? undefined : JSON.stringify({ action }),
        cache: 'no-store',
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setMessage(payload?.error?.message || payload?.message || 'Action cutover non finalisée.')
        return
      }
      setStatus(action === 'cleanup_smoke_records' ? payload.data.status : payload.data)
      setMessage(action === 'cleanup_smoke_records' ? 'Nettoyage smoke exécuté.' : action === 'lock_baseline' ? 'Baseline production verrouillée.' : 'Statut cutover actualisé.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <section style={panelStyle}>
      <div style={topStyle}>
        <div>
          <div style={eyebrowStyle}>PRODUCTION CUTOVER COMMAND</div>
          <h2 style={titleStyle}>Passage production sans régression</h2>
          <p style={textStyle}>
            Cockpit final: checkpoints, variables serveur, nettoyage smoke, verrouillage baseline et commandes de cutover.
          </p>
        </div>
        <div style={buttonRowStyle}>
          <button type="button" onClick={() => run('refresh')} disabled={Boolean(busy)} style={primaryButtonStyle}>{busy === 'refresh' ? 'Lecture…' : 'Lire état production'}</button>
          <button type="button" onClick={() => run('lock_baseline')} disabled={Boolean(busy) || !status?.data_pass} style={softButtonStyle}>Verrouiller baseline</button>
        </div>
      </div>

      <div style={heroGridStyle}>
        <div style={scoreStyle}>
          <span>Cutover score</span>
          <strong>{status?.score ?? '—'}/100</strong>
          <small>{status?.verdict || 'Lancez la lecture pour contrôler le passage production.'}</small>
        </div>
        <Metric label="Chaîne data" value={status?.data_pass ? 'OK' : 'À vérifier'} tone={status?.data_pass ? 'ok' : 'warn'} />
        <Metric label="Variables serveur" value={status?.env_pass ? 'OK' : 'À compléter'} tone={status?.env_pass ? 'ok' : 'warn'} />
        <Metric label="Smoke records" value={status?.smoke_count ?? '—'} tone={status?.smoke_count === 0 ? 'ok' : 'warn'} />
      </div>

      <div style={checkGridStyle}>
        {(status?.checkpoints || []).map((row) => (
          <article key={row.table} style={row.pass ? checkOkStyle : checkWarnStyle}>
            <strong>{row.label}</strong>
            <span>{row.count}/{row.minimum}</span>
            {row.error ? <small>{row.error}</small> : null}
          </article>
        ))}
      </div>

      <div style={cutoverGridStyle}>
        <div style={listPanelStyle}>
          <strong>Checklist Vercel obligatoire</strong>
          <span>NEXT_PUBLIC_SUPABASE_URL</span>
          <span>NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
          <span>SUPABASE_SERVICE_ROLE_KEY</span>
          <span>Build command validé</span>
          <span>Smoke records nettoyés avant production réelle</span>
        </div>

        <div style={listPanelStyle}>
          <strong>Données smoke détectées</strong>
          {(status?.smoke || []).length ? status?.smoke.map((row) => (
            <span key={row.table}>{row.table}: {row.count}{row.error ? ` • ${row.error}` : ''}</span>
          )) : <span>Lancez la lecture pour afficher les données test.</span>}
          <button type="button" onClick={() => run('cleanup_smoke_records')} disabled={Boolean(busy) || !status?.smoke_count} style={dangerButtonStyle}>
            {busy === 'cleanup_smoke_records' ? 'Nettoyage…' : 'Nettoyer smoke records'}
          </button>
        </div>

        <div style={listPanelStyle}>
          <strong>Commandes terminal</strong>
          <code>NODE_OPTIONS=&quot;--max-old-space-size=8192&quot; npx tsc --noEmit --pretty false</code>
          <code>node --env-file=.env.local scripts/verify-traininghub-final-production-gate.mjs</code>
          <code>node --env-file=.env.local scripts/traininghub-production-cutover-report.mjs</code>
        </div>
      </div>

      {message ? <div style={messageStyle}>{message}</div> : null}
    </section>
  )
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone: 'ok' | 'warn' }) {
  return (
    <div style={tone === 'ok' ? metricOkStyle : metricWarnStyle}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

const panelStyle: CSSProperties = { borderRadius: 34, padding: 22, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.06)' }
const topStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16 }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }
const titleStyle: CSSProperties = { margin: 0, fontSize: 26, lineHeight: 1.08, letterSpacing: '-.045em', fontWeight: 950 }
const textStyle: CSSProperties = { margin: '7px 0 0', color: '#64748b', lineHeight: 1.55, fontSize: 13, fontWeight: 700, maxWidth: 880 }
const buttonRowStyle: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }
const primaryButtonStyle: CSSProperties = { border: 0, borderRadius: 16, padding: '12px 14px', background: 'linear-gradient(135deg,#0f2a52,#2563eb)', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const softButtonStyle: CSSProperties = { border: '1px solid #bfdbfe', borderRadius: 16, padding: '12px 14px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 950, cursor: 'pointer' }
const dangerButtonStyle: CSSProperties = { border: 0, borderRadius: 16, padding: '12px 14px', background: 'linear-gradient(135deg,#7c2d12,#ea580c)', color: '#fff', fontWeight: 950, cursor: 'pointer', marginTop: 10 }
const heroGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '320px repeat(3,minmax(0,1fr))', gap: 10 }
const scoreStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 24, padding: 18, color: '#fff', background: 'linear-gradient(135deg,#0b2348,#2557d6)' }
const metricOkStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 18, padding: 14, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857' }
const metricWarnStyle: CSSProperties = { ...metricOkStyle, background: '#fff7ed', borderColor: '#fed7aa', color: '#c2410c' }
const checkGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10, marginTop: 14 }
const checkOkStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 16, padding: 12, background: '#f8fbff', border: '1px solid #dbeafe', color: '#0f172a' }
const checkWarnStyle: CSSProperties = { ...checkOkStyle, background: '#fff7ed', borderColor: '#fed7aa', color: '#c2410c' }
const cutoverGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, marginTop: 14 }
const listPanelStyle: CSSProperties = { display: 'grid', gap: 8, borderRadius: 20, padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', fontSize: 12, fontWeight: 800, overflow: 'auto' }
const messageStyle: CSSProperties = { marginTop: 14, borderRadius: 18, padding: 14, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857', fontWeight: 850 }

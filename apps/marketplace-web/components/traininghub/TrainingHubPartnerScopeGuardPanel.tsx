'use client'

import type { CSSProperties } from 'react'
import { useState } from 'react'

type ScopeHealth = {
  mode: string
  organization_id: string | null
  organization_name: string | null
  score: number
  leak_count: number
  error_count: number
  verdict: string
  checks: Array<{
    table: string
    label: string
    visible: number
    own: number
    leaked: boolean
    error: string | null
  }>
}

export default function TrainingHubPartnerScopeGuardPanel() {
  const [busy, setBusy] = useState(false)
  const [data, setData] = useState<ScopeHealth | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runCheck() {
    setBusy(true)
    setError(null)
    setData(null)

    try {
      const response = await fetch('/api/traininghub/partner/scope-health', { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setError(payload?.error?.message || payload?.message || 'Vérification périmètre non finalisée.')
        return
      }
      setData(payload.data)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section style={panelStyle}>
      <div style={topStyle}>
        <div>
          <div style={eyebrowStyle}>SÉCURITÉ DU PÉRIMÈTRE PARTENAIRE</div>
          <h2 style={titleStyle}>Contrôle d’isolation des données</h2>
          <p style={textStyle}>
            Vérifie que l’espace partenaire ne lit que son propre dossier, ses utilisateurs, ses formations, ses factures, ses crédits, ses sessions et ses certificats.
          </p>
        </div>
        <button type="button" onClick={runCheck} disabled={busy} style={buttonStyle}>
          {busy ? 'Vérification…' : 'Vérifier le périmètre'}
        </button>
      </div>

      {error ? <div style={errorStyle}>{error}</div> : null}

      {data ? (
        <>
          <div style={scoreGridStyle}>
            <div style={scoreCardStyle}>
              <span>Score isolation</span>
              <strong>{data.score}/100</strong>
              <small>{data.verdict}</small>
            </div>
            <Metric label="Fuites détectées" value={data.leak_count} />
            <Metric label="Alertes techniques" value={data.error_count} />
            <Metric label="Mode session" value={data.mode === 'internal_admin' ? 'Interne' : 'Partenaire'} />
          </div>

          <div style={checksGridStyle}>
            {data.checks.map((check) => (
              <article key={check.table} style={check.leaked ? checkLeakStyle : checkStyle}>
                <strong>{check.label}</strong>
                <span>Visible: {check.visible} • Périmètre: {check.own}</span>
                {check.error ? <small>{check.error}</small> : <small>{check.leaked ? 'À corriger' : 'OK'}</small>}
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={metricStyle}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

const panelStyle: CSSProperties = { borderRadius: 30, padding: 20, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 16px 44px rgba(15,23,42,.06)' }
const topStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }
const titleStyle: CSSProperties = { margin: 0, fontSize: 24, lineHeight: 1.08, letterSpacing: '-.04em', fontWeight: 950 }
const textStyle: CSSProperties = { margin: '7px 0 0', color: '#64748b', lineHeight: 1.55, fontSize: 13, fontWeight: 700, maxWidth: 780 }
const buttonStyle: CSSProperties = { border: 0, borderRadius: 16, padding: '12px 14px', background: 'linear-gradient(135deg,#0f2a52,#2563eb)', color: '#fff', fontWeight: 950, cursor: 'pointer', whiteSpace: 'nowrap' }
const scoreGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '280px repeat(3,minmax(0,1fr))', gap: 10, marginTop: 14 }
const scoreCardStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 22, padding: 18, color: '#fff', background: 'linear-gradient(135deg,#0b2348,#2557d6)' }
const metricStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 18, padding: 14, background: '#f8fbff', border: '1px solid #dbeafe' }
const checksGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10, marginTop: 14 }
const checkStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 16, padding: 12, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857' }
const checkLeakStyle: CSSProperties = { ...checkStyle, background: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }
const errorStyle: CSSProperties = { marginTop: 14, borderRadius: 16, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontWeight: 800 }

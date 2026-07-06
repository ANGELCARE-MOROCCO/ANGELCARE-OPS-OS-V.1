'use client'

import { useEffect, useState } from 'react'

type Props = {
  organizationId: string
  planName?: string
  amountMinor?: number
  credits?: number
  compact?: boolean
  onProvisioned?: () => void | Promise<void>
}

type ProvisioningState = {
  ok?: boolean
  readiness?: {
    account: boolean
    offer: boolean
    subscription: boolean
    credits: boolean
    session: boolean
    documents: boolean
    score: number
  }
  existing?: Record<string, number>
  created?: Array<{ table: string; ok: boolean; id?: string | null; error?: string | null }>
  errors?: string[]
  organizationName?: string
}

export default function TrainingHubPartnerProductionProvisioner({
  organizationId,
  planName = 'Activation annuelle TrainingHub',
  amountMinor = 720000,
  credits = 10,
  compact = false,
  onProvisioned,
}: Props) {
  const [state, setState] = useState<ProvisioningState | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function refresh() {
    if (!organizationId) return
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/traininghub/internal/partners/${organizationId}/production-provision`, {
        cache: 'no-store',
      })
      const payload = await response.json().catch(() => ({}))
      setState(payload?.data || null)
      if (!response.ok || payload?.ok === false) {
        setMessage(payload?.error || 'Contrôle production indisponible.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function provision() {
    if (!organizationId) return
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/traininghub/internal/partners/${organizationId}/production-provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          planName,
          amountMinor,
          credits,
          currency: 'MAD',
          createSession: true,
        }),
      })

      const payload = await response.json().catch(() => ({}))
      setState(payload?.data || null)

      if (!response.ok || payload?.ok === false) {
        setMessage(payload?.error || 'Provisioning incomplet. Vérifiez les migrations/tableaux.')
        return
      }

      setMessage('Compte partenaire provisionné : billing, offre, abonnement, crédits, session et preuves.')
      await onProvisioned?.()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [organizationId])

  const score = state?.readiness?.score || 0
  const ready = score >= 90

  if (compact) {
    return (
      <button type="button" onClick={provision} disabled={loading || !organizationId} style={{
        border: '1px solid #bbf7d0',
        background: ready ? '#dcfce7' : 'linear-gradient(135deg,#064e3b,#16a34a)',
        color: ready ? '#047857' : '#fff',
        borderRadius: 18,
        padding: '12px 16px',
        fontWeight: 950,
        boxShadow: ready ? 'none' : '0 16px 32px rgba(22,163,74,.22)',
        cursor: loading ? 'wait' : 'pointer',
      }}>
        {loading ? 'Synchronisation…' : ready ? `Production prête ${score}/100` : 'Activer production'}
      </button>
    )
  }

  return (
    <section style={{
      borderRadius: 28,
      border: '1px solid #bfdbfe',
      background: 'linear-gradient(135deg,#ffffff,#eff6ff)',
      padding: 20,
      display: 'grid',
      gap: 14,
      boxShadow: '0 18px 50px rgba(30,64,175,.10)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
        <div>
          <p style={{ margin: 0, color: '#2563eb', fontSize: 11, letterSpacing: '.14em', fontWeight: 950 }}>PRODUCTION READINESS</p>
          <h3 style={{ margin: '6px 0', fontSize: 24, letterSpacing: '-.04em' }}>Provisioning partenaire</h3>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 800 }}>
            Crée les couches minimales réelles : compte, offre, abonnement, crédits, session et preuves.
          </p>
        </div>
        <strong style={{ borderRadius: 18, padding: '12px 14px', color: ready ? '#047857' : '#1d4ed8', background: ready ? '#dcfce7' : '#dbeafe' }}>
          {score}/100
        </strong>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 8 }}>
        {[
          ['Compte', state?.readiness?.account],
          ['Offre', state?.readiness?.offer],
          ['Abonnement', state?.readiness?.subscription],
          ['Crédits', state?.readiness?.credits],
          ['Session', state?.readiness?.session],
          ['Preuves', state?.readiness?.documents],
        ].map(([label, ok]) => (
          <span key={String(label)} style={{
            borderRadius: 16,
            padding: '10px 8px',
            background: ok ? '#ecfdf5' : '#fff7ed',
            color: ok ? '#047857' : '#c2410c',
            border: `1px solid ${ok ? '#bbf7d0' : '#fed7aa'}`,
            fontWeight: 950,
            textAlign: 'center',
          }}>
            {ok ? '✓ ' : '• '}{label}
          </span>
        ))}
      </div>

      {message ? <div style={{ borderRadius: 18, padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', fontWeight: 850 }}>{message}</div> : null}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" onClick={provision} disabled={loading || !organizationId} style={{
          border: 0,
          background: 'linear-gradient(135deg,#0b2348,#2563eb)',
          color: '#fff',
          borderRadius: 18,
          padding: '12px 16px',
          fontWeight: 950,
          cursor: loading ? 'wait' : 'pointer',
          boxShadow: '0 18px 42px rgba(37,99,235,.24)',
        }}>
          {loading ? 'Provisioning…' : 'Activer / réparer production'}
        </button>
        <button type="button" onClick={refresh} disabled={loading || !organizationId} style={{
          border: '1px solid #bfdbfe',
          background: '#fff',
          color: '#1d4ed8',
          borderRadius: 18,
          padding: '12px 16px',
          fontWeight: 950,
          cursor: loading ? 'wait' : 'pointer',
        }}>
          Vérifier
        </button>
      </div>
    </section>
  )
}

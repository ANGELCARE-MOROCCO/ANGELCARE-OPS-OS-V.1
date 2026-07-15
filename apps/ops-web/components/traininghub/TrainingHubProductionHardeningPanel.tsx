'use client'

import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'

type Props = {
  organizations: any[]
  proposals: any[]
  orders: any[]
  invoices: any[]
  accounts: any[]
  subscriptions: any[]
  profiles?: any[]
  memberships?: any[]
  roleAssignments?: any[]
  sessions?: any[]
  participants?: any[]
  certificates?: any[]
}

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function isPartner(org: any) {
  const type = normalize(org.organization_type)
  return type.includes('partner') || type.includes('school') || type.includes('creche') || type.includes('crèche') || type !== 'angelcare_internal'
}

function money(amountMinor: number) {
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format((amountMinor || 0) / 100)} MAD`
}

function amount(row: any) {
  return Number(row.grand_total_minor || row.amount_due_minor || row.balance_due_minor || 0) || 0
}

export default function TrainingHubProductionHardeningPanel({
  organizations,
  proposals,
  orders,
  invoices,
  accounts,
  subscriptions,
  profiles = [],
  memberships = [],
  roleAssignments = [],
  sessions = [],
  participants = [],
  certificates = [],
}: Props) {
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  const partnerCount = organizations.filter(isPartner).length
  const openInvoiceAmount = invoices
    .filter((invoice) => !['paid', 'cancelled'].includes(normalize(invoice.status)))
    .reduce((total, invoice) => total + amount(invoice), 0)

  const readiness = useMemo(() => {
    return Math.min(
      100,
      Math.round(
        (partnerCount ? 12 : 0) +
          (accounts.length ? 12 : 0) +
          (subscriptions.length ? 10 : 0) +
          (profiles.length ? 10 : 0) +
          (memberships.length ? 10 : 0) +
          (roleAssignments.length ? 10 : 0) +
          (proposals.length ? 8 : 0) +
          (orders.length ? 8 : 0) +
          (invoices.length ? 8 : 0) +
          (sessions.length ? 6 : 0) +
          (participants.length ? 3 : 0) +
          (certificates.length ? 3 : 0),
      ),
    )
  }, [partnerCount, accounts.length, subscriptions.length, profiles.length, memberships.length, roleAssignments.length, proposals.length, orders.length, invoices.length, sessions.length, participants.length, certificates.length])

  async function runCheck() {
    setChecking(true)
    setError(null)
    setResult(null)
    try {
      const response = await fetch('/api/traininghub/commercial/partner-lifecycle?action=verify_access')
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setError(payload?.error?.message || payload?.message || 'Vérification non finalisée.')
        return
      }
      setResult(payload.data)
    } finally {
      setChecking(false)
    }
  }

  return (
    <section style={panelStyle}>
      <div style={topStyle}>
        <div>
          <div style={eyebrowStyle}>PRODUCTION SYNC & RELIABILITY</div>
          <h2 style={titleStyle}>Tableau de fiabilité du modèle partenaire</h2>
          <p style={textStyle}>
            Contrôle rapide de la synchronisation entre dossiers partenaires, comptes, accès utilisateurs, ventes, facturation et opérations formation.
          </p>
        </div>
        <button type="button" onClick={runCheck} disabled={checking} style={primaryButtonStyle}>
          {checking ? 'Vérification…' : 'Vérifier la synchronisation'}
        </button>
      </div>

      <div style={heroGridStyle}>
        <div style={scoreCardStyle}>
          <span>Indice production</span>
          <strong>{readiness}/100</strong>
          <div style={trackStyle}><div style={{ ...fillStyle, width: `${readiness}%` }} /></div>
          <small>{readiness >= 80 ? 'Base solide, vérifier les tests bout-en-bout.' : readiness >= 50 ? 'Base active, hardening à poursuivre.' : 'Fondation à compléter avant déploiement.'}</small>
        </div>

        <div style={miniGridStyle}>
          <Metric label="Partenaires" value={partnerCount} />
          <Metric label="Comptes" value={accounts.length} />
          <Metric label="Accès utilisateurs" value={memberships.length} />
          <Metric label="Rôles affectés" value={roleAssignments.length} />
          <Metric label="Pipeline" value={proposals.length} />
          <Metric label="Commandes" value={orders.length} />
          <Metric label="Factures" value={invoices.length} />
          <Metric label="À encaisser" value={money(openInvoiceAmount)} />
        </div>
      </div>

      <div style={checklistStyle}>
        <Check ok={Boolean(partnerCount)} label="Dossiers partenaires centralisés" />
        <Check ok={Boolean(accounts.length)} label="Comptes partenaires / billing" />
        <Check ok={Boolean(subscriptions.length)} label="Plans ou abonnements" />
        <Check ok={Boolean(memberships.length && roleAssignments.length)} label="Accès utilisateurs et rôles" />
        <Check ok={Boolean(proposals.length || orders.length || invoices.length)} label="Cycle commercial actif" />
        <Check ok={Boolean(sessions.length || participants.length || certificates.length)} label="Delivery formation relié" />
      </div>

      {error ? <div style={errorStyle}>{error}</div> : null}
      {result ? (
        <div style={resultStyle}>
          <strong>Résultat serveur: {result.score}/100</strong>
          <span>{result.missing?.length ? `À compléter: ${result.missing.join(', ')}` : 'Synchronisation portefeuille lisible.'}</span>
        </div>
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

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={ok ? checkOkStyle : checkWarnStyle}>
      <span>{ok ? '✓' : '!'}</span>
      <strong>{label}</strong>
    </div>
  )
}

const panelStyle: CSSProperties = { borderRadius: 32, padding: 22, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.06)' }
const topStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16 }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }
const titleStyle: CSSProperties = { margin: 0, fontSize: 25, lineHeight: 1.08, letterSpacing: '-.04em', fontWeight: 950 }
const textStyle: CSSProperties = { margin: '7px 0 0', color: '#64748b', lineHeight: 1.55, fontSize: 13, fontWeight: 700, maxWidth: 800 }
const primaryButtonStyle: CSSProperties = { border: 0, borderRadius: 17, padding: '13px 16px', background: 'linear-gradient(135deg,#0f2a52,#2563eb)', color: '#fff', fontWeight: 950, cursor: 'pointer', whiteSpace: 'nowrap' }
const heroGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '320px minmax(0,1fr)', gap: 14 }
const scoreCardStyle: CSSProperties = { display: 'grid', gap: 9, borderRadius: 24, padding: 20, color: '#fff', background: 'linear-gradient(135deg,#0b2348,#2557d6)' }
const trackStyle: CSSProperties = { height: 10, borderRadius: 999, overflow: 'hidden', background: 'rgba(255,255,255,.20)' }
const fillStyle: CSSProperties = { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#34d399,#60a5fa)' }
const miniGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 }
const metricStyle: CSSProperties = { display: 'grid', gap: 4, borderRadius: 18, padding: 14, background: '#f8fbff', border: '1px solid #dbeafe' }
const checklistStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, marginTop: 14 }
const checkOkStyle: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', borderRadius: 16, padding: 12, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857' }
const checkWarnStyle: CSSProperties = { ...checkOkStyle, background: '#fff7ed', borderColor: '#fed7aa', color: '#c2410c' }
const errorStyle: CSSProperties = { marginTop: 14, borderRadius: 16, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontWeight: 800 }
const resultStyle: CSSProperties = { marginTop: 14, display: 'grid', gap: 4, borderRadius: 16, padding: 12, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontWeight: 800 }

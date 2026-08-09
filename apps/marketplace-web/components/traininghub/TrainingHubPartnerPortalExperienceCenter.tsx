'use client'

import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'

type PartnerSummary = {
  organization: any
  organization_id: string
  stage: string
  next_action: string
  maturity: number
  open_invoice_minor: number
  memberships: any[]
  accounts: any[]
  subscriptions: any[]
  proposals: any[]
  orders: any[]
  invoices: any[]
  credits: any[]
  sessions: any[]
  participants: any[]
  certificates: any[]
  warnings?: string[]
}

type TabKey = 'overview' | 'formations' | 'refresh' | 'preuves' | 'equipe'

function clean(value: unknown, fallback = 'Non défini') {
  const text = String(value || '').trim()
  return text || fallback
}

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function money(value: number) {
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format((Number(value) || 0) / 100)} MAD`
}

function amount(row: any) {
  return Number(row.grand_total_minor || row.amount_due_minor || row.balance_due_minor || row.subtotal_minor || 0) || 0
}

function statusLabel(value: unknown) {
  const status = normalize(value)
  if (status === 'active') return 'actif'
  if (status === 'draft') return 'brouillon'
  if (status === 'sent') return 'envoyée'
  if (status === 'accepted') return 'acceptée'
  if (status === 'converted_to_order') return 'convertie'
  if (status === 'confirmed') return 'confirmée'
  if (status === 'issued') return 'émise'
  if (status === 'paid') return 'payée'
  if (status === 'available') return 'disponible'
  if (status === 'planned') return 'planifiée'
  if (status === 'closed') return 'clôturée'
  if (status === 'present') return 'présent'
  if (status === 'eligible') return 'éligible'
  return clean(value, 'à suivre').replace(/_/g, ' ')
}

function dateLabel(value: unknown) {
  if (!value) return 'Date à confirmer'
  try {
    return new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(String(value)))
  } catch {
    return clean(value)
  }
}

function orgName(org: any) {
  return clean(org?.name || org?.legal_name || org?.display_name, 'Établissement partenaire')
}

export default function TrainingHubPartnerPortalExperienceCenter() {
  const [data, setData] = useState<PartnerSummary | null>(null)
  const [tab, setTab] = useState<TabKey>('overview')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setMessage(null)
      try {
        const response = await fetch('/api/traininghub/partner/business-summary', { cache: 'no-store' })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok || payload?.ok === false) {
          setMessage(payload?.error?.message || payload?.message || 'Lecture du portail indisponible.')
          return
        }
        if (!cancelled) setData(payload.data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  const upcomingSessions = useMemo(() => {
    return [...(data?.sessions || [])].sort((a, b) =>
      String(a.scheduled_start_at || a.created_at || '').localeCompare(String(b.scheduled_start_at || b.created_at || '')),
    )
  }, [data?.sessions])

  const invoicesOpen = useMemo(() => {
    return (data?.invoices || []).filter((invoice) => !['paid', 'settled', 'closed', 'cancelled'].includes(normalize(invoice.status)))
  }, [data?.invoices])

  const certificatesIssued = useMemo(() => {
    return (data?.certificates || []).filter((certificate) => ['issued', 'active', 'valid'].includes(normalize(certificate.status)))
  }, [data?.certificates])

  if (loading) {
    return (
      <section style={panelStyle}>
        <div style={eyebrowStyle}>ESPACE PARTENAIRE</div>
        <h2 style={titleStyle}>Préparation de votre espace formation…</h2>
        <div style={loadingStyle}>Chargement sécurisé du dossier partenaire.</div>
      </section>
    )
  }

  if (message) {
    return (
      <section style={panelStyle}>
        <div style={eyebrowStyle}>ESPACE PARTENAIRE</div>
        <h2 style={titleStyle}>Votre espace formation est en préparation</h2>
        <div style={alertStyle}>
          Votre dossier partenaire n’est pas encore entièrement rattaché. Votre référent AngelCare peut activer l’accès, rattacher l’établissement ou préparer la première offre.
        </div>
      </section>
    )
  }

  return (
    <section style={panelStyle}>
      <div style={topStyle}>
        <div>
          <div style={eyebrowStyle}>PORTAIL PARTENAIRE • EXPÉRIENCE FORMATION</div>
          <h2 style={titleStyle}>Pilotez ce qui est activé, livré et certifié.</h2>
          <p style={leadStyle}>
            Une lecture simple pour la direction: offres, commandes, factures, crédits, sessions, équipe formée, refresh e-learning et preuves remises.
          </p>
        </div>

        <div style={nextCardStyle}>
          <span>Prochaine action</span>
          <strong>{clean(data?.next_action, 'Préparer la première action')}</strong>
          <small>{orgName(data?.organization)}</small>
        </div>
      </div>

      <div style={tabsStyle}>
        <Tab active={tab === 'overview'} onClick={() => setTab('overview')} label="Vue direction" />
        <Tab active={tab === 'formations'} onClick={() => setTab('formations')} label="Formations" />
        <Tab active={tab === 'refresh'} onClick={() => setTab('refresh')} label="Refresh" />
        <Tab active={tab === 'preuves'} onClick={() => setTab('preuves')} label="Preuves & certificats" />
        <Tab active={tab === 'equipe'} onClick={() => setTab('equipe')} label="Équipe" />
      </div>

      {tab === 'overview' ? (
        <>
          <div style={kpiGridStyle}>
            <Kpi label="Progression" value={`${data?.maturity || 0}/100`} />
            <Kpi label="Offres" value={data?.proposals.length || 0} />
            <Kpi label="Commandes" value={data?.orders.length || 0} />
            <Kpi label="À suivre" value={money(data?.open_invoice_minor || 0)} />
            <Kpi label="Sessions" value={data?.sessions.length || 0} />
            <Kpi label="Certificats" value={certificatesIssued.length} />
          </div>

          <div style={timelineStyle}>
            <Step label="Offre" active={Boolean(data?.proposals.length)} />
            <Step label="Commande" active={Boolean(data?.orders.length)} />
            <Step label="Facture" active={Boolean(data?.invoices.length)} />
            <Step label="Crédits" active={Boolean(data?.credits.length)} />
            <Step label="Session" active={Boolean(data?.sessions.length)} />
            <Step label="Certification" active={Boolean(certificatesIssued.length)} />
          </div>

          <div style={overviewGridStyle}>
            <Feature
              title="Situation commerciale"
              subtitle={invoicesOpen.length ? `${invoicesOpen.length} facture(s) à suivre` : 'Aucune alerte ouverte'}
              text={invoicesOpen[0] ? `${clean(invoicesOpen[0].invoice_number || invoicesOpen[0].title, 'Facture')} • ${money(amount(invoicesOpen[0]))}` : 'Votre situation commerciale est lisible depuis ce portail.'}
            />
            <Feature
              title="Formation à venir"
              subtitle={upcomingSessions[0] ? statusLabel(upcomingSessions[0].status) : 'À planifier'}
              text={upcomingSessions[0] ? `${clean(upcomingSessions[0].session_code || upcomingSessions[0].title, 'Session')} • ${dateLabel(upcomingSessions[0].scheduled_start_at)}` : 'La session apparaîtra ici dès validation avec AngelCare.'}
            />
            <Feature
              title="Preuves de progression"
              subtitle={`${certificatesIssued.length} certificat(s)`}
              text={certificatesIssued.length ? 'Les certificats et preuves remises sont visibles dans votre espace.' : 'Les certificats apparaîtront après validation des présences.'}
            />
          </div>
        </>
      ) : null}

      {tab === 'formations' ? (
        <div style={listGridStyle}>
          {upcomingSessions.length ? upcomingSessions.map((session) => (
            <Record key={session.id} title={clean(session.session_code || session.title, 'Session formation')} meta={`${statusLabel(session.status)} • ${dateLabel(session.scheduled_start_at)}`} detail={`${data?.participants.length || 0} participant(s) rattaché(s)`} />
          )) : <Empty text="Aucune session n’est encore planifiée. Votre référent AngelCare peut activer une date dès validation." />}
        </div>
      ) : null}

      {tab === 'refresh' ? (
        <div style={overviewGridStyle}>
          <Feature title="Refresh e-learning" subtitle={`${data?.credits.length || 0} crédit(s) disponible(s)`} text="Les refresh servent à maintenir les standards dans le temps et à préparer les recyclages périodiques." />
          <Feature title="Continuité pédagogique" subtitle="Suivi annuel" text="Les équipes peuvent être réactivées sur des modules courts, clairs et orientés qualité." />
          <Feature title="Montée en gamme" subtitle={data?.maturity ? `${data.maturity}/100` : 'À activer'} text="Chaque activation renforce la lecture qualité de l’établissement." />
        </div>
      ) : null}

      {tab === 'preuves' ? (
        <div style={listGridStyle}>
          {certificatesIssued.length ? certificatesIssued.map((certificate) => (
            <Record key={certificate.id} title={clean(certificate.certificate_number || certificate.title, 'Certificat')} meta={`${statusLabel(certificate.status)} • ${dateLabel(certificate.issued_at)}`} detail="Preuve disponible pour le dossier établissement." />
          )) : <Empty text="Aucun certificat émis pour le moment. Les preuves apparaîtront après validation des présences." />}
        </div>
      ) : null}

      {tab === 'equipe' ? (
        <div style={listGridStyle}>
          {(data?.participants || []).length ? data?.participants.map((participant) => (
            <Record key={participant.id} title={clean(participant.full_name || participant.participant_name, 'Participant')} meta={`${statusLabel(participant.attendance_status)} • ${statusLabel(participant.certificate_status)}`} detail={clean(participant.job_title || participant.email, 'Équipe partenaire')} />
          )) : <Empty text="Aucun participant rattaché pour le moment. Les collaborateurs apparaîtront ici dès planification." />}
        </div>
      ) : null}

      <div style={supportStyle}>
        <strong>Besoin d’une action ?</strong>
        <span>Contactez votre référent AngelCare pour valider une offre, planifier une session, ajouter des participants ou préparer un renouvellement.</span>
      </div>
    </section>
  )
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} style={active ? tabActiveStyle : tabStyle}>{label}</button>
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={kpiStyle}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function Step({ label, active }: { label: string; active: boolean }) {
  return (
    <div style={active ? stepActiveStyle : stepStyle}>
      <b>{active ? '✓' : '•'}</b>
      <span>{label}</span>
    </div>
  )
}

function Feature({ title, subtitle, text }: { title: string; subtitle: string; text: string }) {
  return (
    <article style={featureStyle}>
      <div>
        <strong>{title}</strong>
        <em>{subtitle}</em>
      </div>
      <p>{text}</p>
    </article>
  )
}

function Record({ title, meta, detail }: { title: string; meta: string; detail: string }) {
  return (
    <article style={recordStyle}>
      <strong>{title}</strong>
      <span>{meta}</span>
      <p>{detail}</p>
    </article>
  )
}

function Empty({ text }: { text: string }) {
  return <div style={emptyStyle}>{text}</div>
}

const panelStyle: CSSProperties = { borderRadius: 34, padding: 24, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.06)', marginBottom: 22 }
const topStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 330px', gap: 18, alignItems: 'start', marginBottom: 18 }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.13em', textTransform: 'uppercase', marginBottom: 7 }
const titleStyle: CSSProperties = { margin: 0, fontSize: 30, lineHeight: 1.05, letterSpacing: '-.05em', fontWeight: 950, color: '#0f172a' }
const leadStyle: CSSProperties = { margin: '8px 0 0', color: '#64748b', lineHeight: 1.6, fontSize: 14, fontWeight: 750, maxWidth: 900 }
const nextCardStyle: CSSProperties = { display: 'grid', gap: 6, borderRadius: 24, padding: 18, color: '#fff', background: 'linear-gradient(135deg,#0b2348,#2557d6)' }
const tabsStyle: CSSProperties = { display: 'flex', gap: 9, flexWrap: 'wrap', marginBottom: 16 }
const tabStyle: CSSProperties = { border: '1px solid #e2e8f0', background: '#fff', color: '#475569', borderRadius: 999, padding: '10px 14px', fontWeight: 950, cursor: 'pointer' }
const tabActiveStyle: CSSProperties = { ...tabStyle, borderColor: '#bfdbfe', background: '#eff6ff', color: '#1d4ed8' }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 9, marginBottom: 14 }
const kpiStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 17, padding: 13, background: '#f8fbff', border: '1px solid #dbeafe', color: '#0f172a' }
const timelineStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 8, marginBottom: 14 }
const stepStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, borderRadius: 16, padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 900 }
const stepActiveStyle: CSSProperties = { ...stepStyle, background: '#ecfdf5', borderColor: '#bbf7d0', color: '#047857' }
const overviewGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, marginBottom: 14 }
const featureStyle: CSSProperties = { display: 'grid', gap: 10, borderRadius: 22, padding: 16, background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 12px 32px rgba(15,23,42,.04)' }
const listGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, marginBottom: 14 }
const recordStyle: CSSProperties = { display: 'grid', gap: 6, borderRadius: 20, padding: 15, background: '#f8fbff', border: '1px solid #dbeafe', color: '#0f172a' }
const emptyStyle: CSSProperties = { gridColumn: '1/-1', borderRadius: 18, padding: 16, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 850 }
const supportStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 18, padding: 14, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontWeight: 850 }
const loadingStyle: CSSProperties = { marginTop: 14, borderRadius: 18, padding: 14, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontWeight: 850 }
const alertStyle: CSSProperties = { marginTop: 14, borderRadius: 18, padding: 14, background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c', fontWeight: 850 }

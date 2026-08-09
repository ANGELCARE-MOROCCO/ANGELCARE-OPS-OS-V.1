'use client'

import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'

type Props = {
  organizations: any[]
  courses: any[]
  sessions: any[]
  participants?: any[]
  certificates?: any[]
}

function clean(value: unknown, fallback = 'Non défini') {
  const text = String(value || '').trim()
  return text || fallback
}

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function orgName(org?: any) {
  return clean(org?.name || org?.legal_name || org?.display_name, 'Partenaire non renseigné')
}

function dateLabel(value?: string | null) {
  if (!value) return 'Non défini'
  try {
    return new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return value
  }
}

function statusLabel(value?: string | null) {
  const status = normalize(value)
  if (status === 'planned') return 'Planifiée'
  if (status === 'delivered') return 'Livrée'
  if (status === 'closed') return 'Clôturée'
  if (status === 'present') return 'Présent'
  if (status === 'issued') return 'Émis'
  return clean(value, 'À configurer')
}

export default function TrainingHubDeliveryCertificationPanel({ organizations, courses, sessions, participants = [], certificates = [] }: Props) {
  const [sessionId, setSessionId] = useState(sessions[0]?.id || '')
  const [count, setCount] = useState(3)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [result, setResult] = useState<any | null>(null)

  const orgById = useMemo(() => new Map(organizations.map((org) => [org.id, org])), [organizations])
  const courseById = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses])
  const selected = sessions.find((session) => session.id === sessionId)
  const sessionParticipants = participants.filter((participant) => participant.session_id === sessionId)
  const sessionCertificates = certificates.filter((certificate) => certificate.session_id === sessionId)
  const deliveryScore = Math.min(
    100,
    Math.round(25 + (sessionParticipants.length ? 25 : 0) + (sessionParticipants.some((p) => normalize(p.attendance_status) === 'present') ? 20 : 0) + (sessionCertificates.length ? 25 : 0) + (['closed', 'delivered'].includes(normalize(selected?.status)) ? 5 : 0)),
  )

  async function run(action: string, extra: Record<string, any> = {}) {
    setBusy(action)
    setMessage(null)
    setResult(null)
    try {
      const response = await fetch('/api/traininghub/commercial/delivery-lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, session_id: sessionId, count, ...extra }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) {
        setMessage(payload?.error?.message || payload?.message || 'Action formation non finalisée.')
        return
      }
      setResult(payload.data)
      setMessage('Action formation exécutée avec succès.')
      window.setTimeout(() => window.location.reload(), 900)
    } finally {
      setBusy(null)
    }
  }

  return (
    <section style={panelStyle}>
      <div style={topStyle}>
        <div>
          <div style={eyebrowStyle}>SUIVI FORMATION & CERTIFICATION</div>
          <h2 style={titleStyle}>Formation → participants → présence → certificats</h2>
          <p style={textStyle}>
            Suivez l’exécution formation avec des participants rattachés, une présence validée et des certificats visibles dans le dossier partenaire.
          </p>
        </div>
        <div style={scoreCardStyle}>
          <span>Preuve formation</span>
          <strong>{deliveryScore}/100</strong>
          <small>{selected?.session_code || 'Aucune session'}</small>
        </div>
      </div>

      <div style={controlGridStyle}>
        <label style={fieldStyle}>
          <span>Session formation</span>
          <select value={sessionId} onChange={(event) => setSessionId(event.target.value)} style={inputStyle}>
            {sessions.map((session) => {
              const org = orgById.get(session.organization_id)
              const course = courseById.get(session.course_id)
              return (
                <option key={session.id} value={session.id}>
                  {session.session_code || session.id} • {orgName(org)} • {course?.title || 'Formation'}
                </option>
              )
            })}
          </select>
        </label>
        <label style={fieldStyle}>
          <span>Participants à générer</span>
          <input type="number" value={count} onChange={(event) => setCount(Number(event.target.value || 0))} style={inputStyle} />
        </label>
      </div>

      <div style={chainStyle}>
        <Step title="Session" value={selected ? 1 : 0} active={Boolean(selected)} />
        <Step title="Participants" value={sessionParticipants.length} active={Boolean(sessionParticipants.length)} />
        <Step title="Présence" value={sessionParticipants.filter((p) => normalize(p.attendance_status) === 'present').length} active={sessionParticipants.some((p) => normalize(p.attendance_status) === 'present')} />
        <Step title="Certificats" value={sessionCertificates.length} active={Boolean(sessionCertificates.length)} />
      </div>

      <div style={actionsStyle}>
        <button disabled={!sessionId || Boolean(busy)} type="button" onClick={() => run('create_participants')} style={softButtonStyle}>Ajouter participants</button>
        <button disabled={!sessionId || Boolean(busy)} type="button" onClick={() => run('mark_attendance')} style={softButtonStyle}>Valider présences</button>
        <button disabled={!sessionId || Boolean(busy)} type="button" onClick={() => run('issue_certificates')} style={primaryButtonStyle}>Émettre certificats</button>
        <button disabled={!sessionId || Boolean(busy)} type="button" onClick={() => run('run_full_delivery')} style={dangerButtonStyle}>Finaliser session</button>
      </div>

      {selected ? (
        <div style={detailsGridStyle}>
          <Detail label="Partenaire" value={orgName(orgById.get(selected.organization_id))} />
          <Detail label="Statut session" value={statusLabel(selected.status)} />
          <Detail label="Date prévue" value={dateLabel(selected.scheduled_start_at)} />
          <Detail label="Certificats" value={String(sessionCertificates.length)} />
        </div>
      ) : <div style={emptyStyle}>Aucune session disponible. Lancez d’abord le cycle revenue → delivery pour créer une session.</div>}

      {message ? <div style={messageStyle}>{message}</div> : null}
      {result?.verification ? (
        <div style={resultStyle}>
          <strong>Lecture formation: {result.verification.score}/100</strong>
          <span>{result.verification.next_best_actions?.length ? result.verification.next_best_actions.join(' • ') : 'Formation complète et prouvable.'}</span>
        </div>
      ) : null}
    </section>
  )
}

function Step({ title, value, active }: { title: string; value: number; active: boolean }) {
  return (
    <div style={active ? stepActiveStyle : stepStyle}>
      <strong>{value}</strong>
      <span>{title}</span>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={detailStyle}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

const panelStyle: CSSProperties = { borderRadius: 32, padding: 22, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.06)' }
const topStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 220px', gap: 16, alignItems: 'start', marginBottom: 16 }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }
const titleStyle: CSSProperties = { margin: 0, fontSize: 25, lineHeight: 1.08, letterSpacing: '-.04em', fontWeight: 950 }
const textStyle: CSSProperties = { margin: '7px 0 0', color: '#64748b', lineHeight: 1.55, fontSize: 13, fontWeight: 700, maxWidth: 850 }
const scoreCardStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 22, padding: 18, color: '#fff', background: 'linear-gradient(135deg,#0b2348,#2557d6)' }
const controlGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 220px', gap: 12, marginBottom: 14 }
const fieldStyle: CSSProperties = { display: 'grid', gap: 6, color: '#334155', fontSize: 12, fontWeight: 950 }
const inputStyle: CSSProperties = { border: '1px solid #e2e8f0', background: '#fff', borderRadius: 16, padding: '12px 13px', color: '#0f172a', fontWeight: 850, outline: 'none' }
const chainStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 }
const stepStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 18, padding: 14, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }
const stepActiveStyle: CSSProperties = { ...stepStyle, background: '#ecfdf5', borderColor: '#bbf7d0', color: '#047857' }
const actionsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10, marginTop: 14 }
const primaryButtonStyle: CSSProperties = { border: 0, borderRadius: 16, padding: '12px 14px', background: 'linear-gradient(135deg,#0f2a52,#2563eb)', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const softButtonStyle: CSSProperties = { border: '1px solid #bfdbfe', borderRadius: 16, padding: '12px 14px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 950, cursor: 'pointer' }
const dangerButtonStyle: CSSProperties = { ...primaryButtonStyle, background: 'linear-gradient(135deg,#7c2d12,#ea580c)' }
const detailsGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10, marginTop: 14 }
const detailStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 18, padding: 14, background: '#f8fbff', border: '1px solid #dbeafe' }
const emptyStyle: CSSProperties = { marginTop: 14, padding: 14, borderRadius: 16, background: '#f8fafc', color: '#64748b', fontWeight: 800, border: '1px dashed #cbd5e1' }
const messageStyle: CSSProperties = { marginTop: 14, borderRadius: 18, padding: 14, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857', fontWeight: 850 }
const resultStyle: CSSProperties = { marginTop: 14, display: 'grid', gap: 4, borderRadius: 18, padding: 14, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontWeight: 850 }

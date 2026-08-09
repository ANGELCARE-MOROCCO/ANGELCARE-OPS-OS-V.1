'use client'

import { useMemo, useState, type CSSProperties } from 'react'

type Row = Record<string, any>

type Props = {
  organizations: Row[]
  courses: Row[]
  sessions: Row[]
  participants: Row[]
  attendance: Row[]
  checklists: Row[]
  certificates: Row[]
  aftersalesReports: Row[]
  trainers: Row[]
  sessionTrainers: Row[]
  allocatedResources: Row[]
}

const statusFlow = [
  'requested',
  'qualified',
  'confirmed',
  'scheduled',
  'kit_preparation',
  'ready_to_deliver',
  'in_delivery',
  'delivered',
  'attendance_validated',
  'certificates_issued',
  'refresh_unlocked',
  'aftersales_completed',
  'closed',
]

const boardColumns = [
  { key: 'preparation', title: 'Préparation', statuses: ['requested', 'qualified', 'confirmed', 'scheduled', 'kit_preparation', 'ready_to_deliver'] },
  { key: 'delivery', title: 'Delivery terrain', statuses: ['in_delivery', 'delivered'] },
  { key: 'validation', title: 'Validation & preuves', statuses: ['attendance_validated', 'certificates_issued', 'refresh_unlocked'] },
  { key: 'aftersales', title: 'Aftersales & clôture', statuses: ['aftersales_completed', 'closed', 'cancelled'] },
]

const statusLabels: Record<string, string> = {
  requested: 'Requested',
  qualified: 'Qualified',
  quoted: 'Quoted',
  confirmed: 'Confirmed',
  scheduled: 'Scheduled',
  kit_preparation: 'Kit preparation',
  ready_to_deliver: 'Ready',
  in_delivery: 'In delivery',
  delivered: 'Delivered',
  attendance_validated: 'Attendance validated',
  certificates_issued: 'Certificates issued',
  refresh_unlocked: 'Refresh unlocked',
  aftersales_completed: 'Aftersales completed',
  closed: 'Closed',
  cancelled: 'Cancelled',
}

function text(value: unknown, fallback = '—') {
  const result = String(value || '').trim()
  return result || fallback
}

function normalize(value: unknown) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function formatDate(value?: string | null) {
  if (!value) return 'Date à planifier'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date à planifier'
  return new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function formatShortDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-MA', { day: '2-digit', month: 'short' }).format(date)
}

function money(amountMinor?: number | null, currency = 'MAD') {
  const value = Number(amountMinor || 0) / 100
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(value)} ${currency}`
}

function toIsoLocalInput(offsetDays = 7) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  date.setHours(9, 0, 0, 0)
  const tzOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
}

function statusIndex(status?: string | null) {
  const index = statusFlow.indexOf(String(status || 'requested'))
  return index < 0 ? 0 : index
}

function statusTone(status?: string | null): CSSProperties {
  const s = String(status || '')
  if (['closed', 'aftersales_completed', 'refresh_unlocked', 'certificates_issued'].includes(s)) return { background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }
  if (['delivered', 'attendance_validated'].includes(s)) return { background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }
  if (['in_delivery', 'ready_to_deliver'].includes(s)) return { background: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa' }
  if (s === 'cancelled') return { background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca' }
  return { background: '#f8fafc', color: '#475569', borderColor: '#e2e8f0' }
}

function uniqueStatuses(sessions: Row[]) {
  const values = new Set<string>()
  sessions.forEach((session) => values.add(String(session.status || 'requested')))
  return ['ALL', ...Array.from(values).sort()]
}

export default function TrainingHubDeliveryWorkspaceClient({
  organizations,
  courses,
  sessions,
  participants,
  attendance,
  checklists,
  certificates,
  aftersalesReports,
  trainers,
  sessionTrainers,
  allocatedResources,
}: Props) {
  const [selectedId, setSelectedId] = useState<string>(String(sessions[0]?.id || ''))
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newParticipantName, setNewParticipantName] = useState('')
  const [newParticipantEmail, setNewParticipantEmail] = useState('')

  const partnerOrganizations = useMemo(
    () => organizations.filter((organization) => ['partner_school', 'angelcare_internal'].includes(String(organization.organization_type || ''))),
    [organizations],
  )
  const coursesById = useMemo(() => new Map(courses.map((course) => [String(course.id), course])), [courses])
  const organizationsById = useMemo(() => new Map(organizations.map((organization) => [String(organization.id), organization])), [organizations])
  const participantsBySession = useMemo(() => groupBy(participants, 'session_id'), [participants])
  const attendanceBySession = useMemo(() => groupBy(attendance, 'session_id'), [attendance])
  const checklistsBySession = useMemo(() => groupBy(checklists, 'session_id'), [checklists])
  const certificatesBySession = useMemo(() => groupBy(certificates, 'session_id'), [certificates])
  const aftersalesBySession = useMemo(() => groupBy(aftersalesReports, 'session_id'), [aftersalesReports])
  const resourcesBySession = useMemo(() => groupBy(allocatedResources, 'session_id'), [allocatedResources])

  const filteredSessions = useMemo(() => {
    const q = normalize(query)
    return sessions.filter((session) => {
      const course = coursesById.get(String(session.course_id))
      const org = organizationsById.get(String(session.organization_id))
      const haystack = normalize([
        session.session_code,
        session.status,
        session.city,
        session.location_address,
        course?.ref,
        course?.title,
        org?.name,
      ].join(' '))
      const matchesQuery = !q || haystack.includes(q)
      const matchesStatus = statusFilter === 'ALL' || String(session.status || 'requested') === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [coursesById, organizationsById, query, sessions, statusFilter])

  const selected = filteredSessions.find((session) => String(session.id) === selectedId) || sessions.find((session) => String(session.id) === selectedId) || filteredSessions[0] || sessions[0]
  const selectedCourse = selected ? coursesById.get(String(selected.course_id)) : null
  const selectedOrg = selected ? organizationsById.get(String(selected.organization_id)) : null
  const selectedParticipants = selected ? participantsBySession.get(String(selected.id)) || [] : []
  const selectedAttendance = selected ? attendanceBySession.get(String(selected.id)) || [] : []
  const selectedChecklist = selected ? checklistsBySession.get(String(selected.id)) || [] : []
  const selectedCertificates = selected ? certificatesBySession.get(String(selected.id)) || [] : []
  const selectedAftersales = selected ? aftersalesBySession.get(String(selected.id)) || [] : []
  const selectedResources = selected ? resourcesBySession.get(String(selected.id)) || [] : []

  const metrics = useMemo(() => {
    const active = sessions.filter((session) => !['closed', 'cancelled'].includes(String(session.status || ''))).length
    const inDelivery = sessions.filter((session) => ['ready_to_deliver', 'in_delivery', 'delivered'].includes(String(session.status || ''))).length
    const evidence = attendance.length + certificates.length + aftersalesReports.length
    const pendingKit = sessions.filter((session) => ['scheduled', 'kit_preparation'].includes(String(session.status || ''))).length
    const participantCount = participants.length
    const issuedCertificates = certificates.filter((certificate) => String(certificate.status || 'issued') === 'issued').length
    return { active, inDelivery, evidence, pendingKit, participantCount, issuedCertificates }
  }, [aftersalesReports.length, attendance.length, certificates, participants.length, sessions])

  async function apiPost(path: string, payload: Row) {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await response.json().catch(() => null)
      if (!response.ok) throw new Error(json?.error || json?.message || `Request failed: ${response.status}`)
      setMessage('Action exécutée avec succès. Rechargement des données...')
      window.setTimeout(() => window.location.reload(), 650)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.')
    } finally {
      setBusy(false)
    }
  }

  async function createSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await apiPost('/api/traininghub/sessions', {
      organization_id: String(form.get('organization_id') || ''),
      course_ref: String(form.get('course_ref') || ''),
      city: String(form.get('city') || ''),
      location_address: String(form.get('location_address') || ''),
      planned_participant_count: Number(form.get('planned_participant_count') || 8),
      planned_hours: Number(form.get('planned_hours') || 6),
      delivery_mode: String(form.get('delivery_mode') || 'onsite'),
      scheduled_start_at: String(form.get('scheduled_start_at') || ''),
      scheduled_end_at: String(form.get('scheduled_end_at') || ''),
      hours_distribution_notes: String(form.get('hours_distribution_notes') || ''),
      status: 'scheduled',
    })
  }

  function updateStatus(nextStatus: string) {
    if (!selected) return
    apiPost(`/api/traininghub/sessions/${selected.id}/status`, { status: nextStatus, note: `Updated from premium delivery board to ${nextStatus}` })
  }

  function addParticipant() {
    if (!selected) return
    apiPost(`/api/traininghub/sessions/${selected.id}/participants`, {
      participants: [{ full_name: newParticipantName, email: newParticipantEmail, participant_type: 'staff_participant' }],
    })
  }

  function validateAttendance() {
    if (!selected) return
    const records = selectedParticipants.map((participant) => ({ participant_id: participant.id, attendance_status: 'present', check_in_at: new Date().toISOString() }))
    apiPost(`/api/traininghub/sessions/${selected.id}/attendance`, { records })
  }

  function completeSession() {
    if (!selected) return
    apiPost(`/api/traininghub/sessions/${selected.id}/complete`, {
      issue_certificates: true,
      unlock_refresh: true,
      final_status: 'refresh_unlocked',
      trainer_notes: 'Session clôturée depuis le Delivery Command Center.',
      action_plan_7_days: 'Valider les actions terrain, confirmer les certificats et planifier le refresh e-learning.',
    })
  }

  return (
    <div style={workspaceStyle}>
      <section style={heroStyle}>
        <div style={heroGlowStyle} />
        <div style={heroContentStyle}>
          <div style={heroBadgeStyle}>FULFILLMENT ENGINE • REAL DELIVERY CONTROL</div>
          <h2 style={heroTitleStyle}>Training Delivery Command Board</h2>
          <p style={heroTextStyle}>
            Pilote les sessions terrain, les participants, les preuves, les kits, les certificats et le refresh e-learning avec une logique corporate orientée exécution.
          </p>
        </div>
        <div style={heroActionsStyle}>
          <button type="button" style={primaryButtonStyle} onClick={() => setCreateOpen((value) => !value)}>{createOpen ? 'Fermer création' : 'Créer session'}</button>
          <a href="/api/traininghub/sessions" style={secondaryLinkStyle}>API Sessions</a>
        </div>
      </section>

      <section style={metricGridStyle}>
        <Metric label="Sessions actives" value={metrics.active} detail="Non clôturées" tone="blue" />
        <Metric label="Terrain live" value={metrics.inDelivery} detail="Ready / delivery / delivered" tone="orange" />
        <Metric label="Participants" value={metrics.participantCount} detail="Staff inscrits" tone="violet" />
        <Metric label="Kits à surveiller" value={metrics.pendingKit} detail="Scheduled / kit preparation" tone="pink" />
        <Metric label="Certificats" value={metrics.issuedCertificates} detail="Émis / traçables" tone="green" />
        <Metric label="Preuves" value={metrics.evidence} detail="Attendance + certifs + aftersales" tone="slate" />
      </section>

      {createOpen ? (
        <form style={createPanelStyle} onSubmit={createSession}>
          <div>
            <div style={sectionEyebrowStyle}>Créer une session terrain</div>
            <h3 style={sectionTitleStyle}>Planification initiale</h3>
            <p style={sectionTextStyle}>La session respecte le modèle TrainingHub: 3–8 participants starter, 6–15h, kit inclus et refresh débloqué après completion.</p>
          </div>
          <div style={formGridStyle}>
            <label style={fieldStyle}>Organisation
              <select name="organization_id" style={inputStyle} required defaultValue={String(partnerOrganizations[0]?.id || '')}>
                {partnerOrganizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name} • {organization.organization_type}</option>)}
              </select>
            </label>
            <label style={fieldStyle}>Formation
              <select name="course_ref" style={inputStyle} required defaultValue={String(courses[0]?.ref || 'TR-01-01')}>
                {courses.map((course) => <option key={course.id} value={course.ref}>{course.ref} — {course.title}</option>)}
              </select>
            </label>
            <label style={fieldStyle}>Ville
              <input name="city" style={inputStyle} defaultValue="Rabat" />
            </label>
            <label style={fieldStyle}>Adresse / site
              <input name="location_address" style={inputStyle} placeholder="Adresse école / salle" />
            </label>
            <label style={fieldStyle}>Participants prévus
              <input name="planned_participant_count" type="number" min={1} max={80} style={inputStyle} defaultValue={8} />
            </label>
            <label style={fieldStyle}>Heures prévues
              <input name="planned_hours" type="number" min={1} max={40} style={inputStyle} defaultValue={6} />
            </label>
            <label style={fieldStyle}>Début
              <input name="scheduled_start_at" type="datetime-local" style={inputStyle} defaultValue={toIsoLocalInput(7)} />
            </label>
            <label style={fieldStyle}>Fin
              <input name="scheduled_end_at" type="datetime-local" style={inputStyle} defaultValue={toIsoLocalInput(7).replace('09:00', '15:00')} />
            </label>
            <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>Notes distribution
              <input name="hours_distribution_notes" style={inputStyle} defaultValue="Distribution 6 à 15 heures à valider avec la direction." />
            </label>
            <input name="delivery_mode" type="hidden" value="onsite" />
          </div>
          <div style={createActionsStyle}>
            <button type="submit" style={primaryButtonStyle} disabled={busy}>{busy ? 'Création...' : 'Créer session fulfillment'}</button>
          </div>
        </form>
      ) : null}

      {message ? <div style={successStyle}>{message}</div> : null}
      {error ? <div style={errorStyle}>{error}</div> : null}

      <section style={toolbarStyle}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} style={searchStyle} placeholder="Search session, school, course, city..." />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={selectStyle}>
          {uniqueStatuses(sessions).map((status) => <option key={status} value={status}>{status === 'ALL' ? 'Tous statuts' : statusLabels[status] || status}</option>)}
        </select>
        <div style={rulePillStyle}>3–8 participants starter</div>
        <div style={rulePillStyle}>6–15h distribution</div>
        <div style={rulePillStyle}>Refresh après completion</div>
      </section>

      <section style={mainGridStyle}>
        <div style={boardStyle}>
          {boardColumns.map((column) => {
            const columnSessions = filteredSessions.filter((session) => column.statuses.includes(String(session.status || 'requested')))
            return (
              <div key={column.key} style={columnStyle}>
                <div style={columnHeaderStyle}>
                  <span>{column.title}</span>
                  <strong>{columnSessions.length}</strong>
                </div>
                <div style={columnCardsStyle}>
                  {columnSessions.length ? columnSessions.map((session) => {
                    const course = coursesById.get(String(session.course_id))
                    const org = organizationsById.get(String(session.organization_id))
                    const sessionParticipants = participantsBySession.get(String(session.id)) || []
                    const sessionCertificates = certificatesBySession.get(String(session.id)) || []
                    const selectedCard = selected && String(selected.id) === String(session.id)
                    return (
                      <button key={session.id} type="button" style={selectedCard ? selectedSessionCardStyle : sessionCardStyle} onClick={() => setSelectedId(String(session.id))}>
                        <div style={cardTopStyle}>
                          <span style={sessionCodeStyle}>{session.session_code}</span>
                          <span style={{ ...statusPillStyle, ...statusTone(session.status) }}>{statusLabels[String(session.status || 'requested')] || session.status}</span>
                        </div>
                        <div style={cardTitleStyle}>{course?.ref || 'TR'} • {course?.title || 'Formation'}</div>
                        <div style={cardMetaStyle}>{org?.name || 'Organisation'} • {session.city || 'Ville à préciser'}</div>
                        <div style={miniStatsStyle}>
                          <MiniStat label="Staff" value={sessionParticipants.length || Number(session.planned_participant_count || 0)} />
                          <MiniStat label="Heures" value={Number(session.planned_hours || 0)} />
                          <MiniStat label="Certifs" value={sessionCertificates.length} />
                        </div>
                        <div style={dateLineStyle}>{formatDate(session.scheduled_start_at)}</div>
                      </button>
                    )
                  }) : <div style={emptyColumnStyle}>Aucune session dans cette colonne.</div>}
                </div>
              </div>
            )
          })}
        </div>

        <aside style={detailPanelStyle}>
          {selected ? (
            <>
              <div style={detailHeaderStyle}>
                <div>
                  <div style={sectionEyebrowStyle}>Session sélectionnée</div>
                  <h3 style={detailTitleStyle}>{selected.session_code}</h3>
                  <p style={sectionTextStyle}>{selectedCourse?.ref} • {selectedCourse?.title}</p>
                </div>
                <span style={{ ...statusPillStyle, ...statusTone(selected.status) }}>{statusLabels[String(selected.status || 'requested')] || selected.status}</span>
              </div>

              <div style={progressShellStyle}>
                <div style={progressBarStyle}>
                  <div style={{ ...progressFillStyle, width: `${Math.min(100, Math.round(((statusIndex(selected.status) + 1) / statusFlow.length) * 100))}%` }} />
                </div>
                <div style={progressTextStyle}>Progression fulfillment • {statusIndex(selected.status) + 1}/{statusFlow.length}</div>
              </div>

              <div style={detailInfoGridStyle}>
                <Info label="Organisation" value={selectedOrg?.name || '—'} />
                <Info label="Ville" value={selected.city || '—'} />
                <Info label="Début" value={formatShortDate(selected.scheduled_start_at)} />
                <Info label="Heures" value={`${selected.planned_hours || 0}h`} />
              </div>

              <div style={actionPanelStyle}>
                <div style={sectionEyebrowStyle}>Actions lifecycle</div>
                <div style={actionGridStyle}>
                  <button style={smallActionStyle} disabled={busy} onClick={() => updateStatus('kit_preparation')}>Kit prep</button>
                  <button style={smallActionStyle} disabled={busy} onClick={() => updateStatus('ready_to_deliver')}>Ready</button>
                  <button style={smallActionStyle} disabled={busy} onClick={() => updateStatus('in_delivery')}>Start</button>
                  <button style={smallActionStyle} disabled={busy} onClick={() => updateStatus('delivered')}>Delivered</button>
                  <button style={smallActionStyle} disabled={busy || !selectedParticipants.length} onClick={validateAttendance}>Validate attendance</button>
                  <button style={completeActionStyle} disabled={busy || !selectedParticipants.length} onClick={completeSession}>Certifs + refresh</button>
                </div>
              </div>

              <div style={tabsGridStyle}>
                <DetailList title="Participants" rows={selectedParticipants} empty="Aucun participant." render={(row) => `${row.full_name || row.email || row.id} • ${row.attendance_status || 'pending'} • ${row.certificate_status || 'not issued'}`} />
                <DetailList title="Attendance" rows={selectedAttendance} empty="Aucune attendance." render={(row) => `${row.attendance_status || 'pending'} • ${formatShortDate(row.check_in_at)}`} />
                <DetailList title="Checklist" rows={selectedChecklist} empty="Aucune checklist." render={(row) => `${row.completed ? '✓' : '○'} ${row.item_label || row.checklist_type}`} />
                <DetailList title="Certificates" rows={selectedCertificates} empty="Aucun certificat." render={(row) => `${row.certificate_number || row.id} • ${row.status || 'issued'}`} />
                <DetailList title="Resources" rows={selectedResources} empty="Aucune ressource allouée." render={(row) => `${row.allocated_quantity || 1} item • ${row.delivery_status || 'pending'}`} />
                <DetailList title="Aftersales" rows={selectedAftersales} empty="Aucun rapport aftersales." render={(row) => `${row.report_number || row.status || 'draft'} • satisfaction ${row.satisfaction_score || '—'}`} />
              </div>

              <div style={participantBoxStyle}>
                <div style={sectionEyebrowStyle}>Ajouter participant</div>
                <input value={newParticipantName} onChange={(event) => setNewParticipantName(event.target.value)} style={inputStyle} placeholder="Nom participant" />
                <input value={newParticipantEmail} onChange={(event) => setNewParticipantEmail(event.target.value)} style={inputStyle} placeholder="Email participant" />
                <button type="button" style={primaryButtonStyle} disabled={busy || (!newParticipantName && !newParticipantEmail)} onClick={addParticipant}>Ajouter au roster</button>
              </div>

              <a href={`/api/traininghub/sessions/${selected.id}`} style={apiDetailLinkStyle}>Ouvrir fiche API complète</a>
            </>
          ) : (
            <div style={emptyStateStyle}>Aucune session TrainingHub disponible. Crée une première session terrain depuis le panneau de planification.</div>
          )}
        </aside>
      </section>
    </div>
  )
}

function groupBy(rows: Row[], key: string) {
  const map = new Map<string, Row[]>()
  for (const row of rows) {
    const id = String(row[key] || '')
    if (!id) continue
    const list = map.get(id) || []
    list.push(row)
    map.set(id, list)
  }
  return map
}

function Metric({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: 'blue' | 'orange' | 'violet' | 'pink' | 'green' | 'slate' }) {
  const tones: Record<string, CSSProperties> = {
    blue: { background: '#eff6ff', color: '#1d4ed8' },
    orange: { background: '#fff7ed', color: '#c2410c' },
    violet: { background: '#f5f3ff', color: '#6d28d9' },
    pink: { background: '#fdf2f8', color: '#be185d' },
    green: { background: '#ecfdf5', color: '#047857' },
    slate: { background: '#f8fafc', color: '#334155' },
  }
  return <div style={metricCardStyle}><div style={{ ...metricIconStyle, ...tones[tone] }}>{value}</div><div style={metricLabelStyle}>{label}</div><div style={metricDetailStyle}>{detail}</div></div>
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return <div style={miniStatStyle}><strong>{value}</strong><span>{label}</span></div>
}

function Info({ label, value }: { label: string; value: string }) {
  return <div style={infoStyle}><span>{label}</span><strong>{value}</strong></div>
}

function DetailList({ title, rows, empty, render }: { title: string; rows: Row[]; empty: string; render: (row: Row) => string }) {
  return <div style={detailListStyle}><strong style={detailListTitleStyle}>{title}</strong>{rows.length ? rows.slice(0, 6).map((row) => <span key={row.id || render(row)} style={detailListRowStyle}>{render(row)}</span>) : <span style={detailListEmptyStyle}>{empty}</span>}</div>
}

const workspaceStyle: CSSProperties = { display: 'grid', gap: 18 }
const heroStyle: CSSProperties = { position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', borderRadius: 34, padding: 24, background: 'linear-gradient(135deg, #0f2a52 0%, #1d4ed8 58%, #0ea5e9 100%)', color: '#fff', boxShadow: '0 28px 70px rgba(15,42,82,.25)' }
const heroGlowStyle: CSSProperties = { position: 'absolute', right: -80, top: -120, width: 300, height: 300, borderRadius: 999, background: 'rgba(255,255,255,.18)', filter: 'blur(4px)' }
const heroContentStyle: CSSProperties = { position: 'relative', maxWidth: 790 }
const heroBadgeStyle: CSSProperties = { display: 'inline-flex', padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.25)', fontSize: 11, fontWeight: 950, letterSpacing: '.08em' }
const heroTitleStyle: CSSProperties = { margin: '14px 0 8px', fontSize: 34, lineHeight: 1, fontWeight: 950, letterSpacing: '-.04em' }
const heroTextStyle: CSSProperties = { margin: 0, color: 'rgba(255,255,255,.82)', fontWeight: 750, lineHeight: 1.6 }
const heroActionsStyle: CSSProperties = { position: 'relative', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }
const primaryButtonStyle: CSSProperties = { border: 0, borderRadius: 16, padding: '12px 15px', background: '#0f2a52', color: '#fff', fontWeight: 950, cursor: 'pointer', boxShadow: '0 14px 30px rgba(15,42,82,.18)' }
const secondaryLinkStyle: CSSProperties = { borderRadius: 16, padding: '12px 15px', background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.28)', fontWeight: 950, textDecoration: 'none' }
const metricGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 12 }
const metricCardStyle: CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 16, boxShadow: '0 16px 40px rgba(15,23,42,.06)' }
const metricIconStyle: CSSProperties = { width: 50, height: 42, borderRadius: 16, display: 'grid', placeItems: 'center', fontWeight: 950, marginBottom: 10 }
const metricLabelStyle: CSSProperties = { fontSize: 13, fontWeight: 950, color: '#0f172a' }
const metricDetailStyle: CSSProperties = { fontSize: 11, fontWeight: 800, color: '#64748b', marginTop: 4 }
const createPanelStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '300px minmax(0,1fr)', gap: 20, alignItems: 'start', background: '#fff', border: '1px solid #bfdbfe', borderRadius: 30, padding: 20, boxShadow: '0 22px 55px rgba(29,78,216,.12)' }
const sectionEyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.08em', textTransform: 'uppercase' }
const sectionTitleStyle: CSSProperties = { margin: '6px 0 8px', fontSize: 22, fontWeight: 950, color: '#0f172a', letterSpacing: '-.035em' }
const sectionTextStyle: CSSProperties = { margin: 0, color: '#64748b', fontSize: 13, fontWeight: 750, lineHeight: 1.55 }
const formGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }
const fieldStyle: CSSProperties = { display: 'grid', gap: 7, color: '#334155', fontSize: 11, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.04em' }
const inputStyle: CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1px solid #dbe3ef', borderRadius: 15, padding: '12px 12px', background: '#fff', color: '#0f172a', fontWeight: 800, outline: 'none' }
const createActionsStyle: CSSProperties = { gridColumn: '2 / -1', display: 'flex', justifyContent: 'flex-end' }
const successStyle: CSSProperties = { borderRadius: 18, padding: 14, border: '1px solid #a7f3d0', background: '#ecfdf5', color: '#047857', fontWeight: 900 }
const errorStyle: CSSProperties = { borderRadius: 18, padding: 14, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', fontWeight: 900 }
const toolbarStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 12, boxShadow: '0 12px 30px rgba(15,23,42,.05)' }
const searchStyle: CSSProperties = { flex: '1 1 320px', border: '1px solid #dbe3ef', borderRadius: 16, padding: '12px 13px', fontWeight: 850, outline: 'none' }
const selectStyle: CSSProperties = { border: '1px solid #dbe3ef', borderRadius: 16, padding: '12px 13px', fontWeight: 850, outline: 'none', background: '#fff' }
const rulePillStyle: CSSProperties = { border: '1px solid #dbeafe', background: '#eff6ff', color: '#1d4ed8', borderRadius: 999, padding: '9px 11px', fontWeight: 950, fontSize: 11 }
const mainGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 430px', gap: 18, alignItems: 'start' }
const boardStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(260px,1fr))', gap: 13, overflowX: 'auto', paddingBottom: 8 }
const columnStyle: CSSProperties = { minHeight: 540, borderRadius: 28, border: '1px solid #e2e8f0', background: 'linear-gradient(180deg,#ffffff,#f8fafc)', padding: 12 }
const columnHeaderStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 6px 13px', fontWeight: 950, color: '#0f172a' }
const columnCardsStyle: CSSProperties = { display: 'grid', gap: 10 }
const sessionCardStyle: CSSProperties = { display: 'grid', gap: 9, textAlign: 'left', border: '1px solid #e2e8f0', borderRadius: 22, background: '#fff', padding: 13, color: '#0f172a', cursor: 'pointer', boxShadow: '0 10px 25px rgba(15,23,42,.05)' }
const selectedSessionCardStyle: CSSProperties = { ...sessionCardStyle, borderColor: '#2563eb', boxShadow: '0 20px 45px rgba(37,99,235,.15)' }
const cardTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }
const sessionCodeStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.06em' }
const statusPillStyle: CSSProperties = { border: '1px solid', borderRadius: 999, padding: '6px 8px', fontSize: 10, fontWeight: 950, whiteSpace: 'nowrap' }
const cardTitleStyle: CSSProperties = { fontSize: 13, fontWeight: 950, lineHeight: 1.35 }
const cardMetaStyle: CSSProperties = { fontSize: 11, color: '#64748b', fontWeight: 800, lineHeight: 1.4 }
const miniStatsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }
const miniStatStyle: CSSProperties = { display: 'grid', gap: 2, borderRadius: 14, background: '#f8fafc', padding: 8, border: '1px solid #e2e8f0' }
const dateLineStyle: CSSProperties = { fontSize: 11, color: '#475569', fontWeight: 850 }
const emptyColumnStyle: CSSProperties = { border: '1px dashed #cbd5e1', borderRadius: 18, padding: 14, color: '#94a3b8', fontWeight: 800, fontSize: 12 }
const detailPanelStyle: CSSProperties = { position: 'sticky', top: 20, display: 'grid', gap: 14, borderRadius: 30, border: '1px solid #e2e8f0', background: '#fff', padding: 18, boxShadow: '0 22px 60px rgba(15,23,42,.1)' }
const detailHeaderStyle: CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }
const detailTitleStyle: CSSProperties = { margin: '6px 0 4px', color: '#0f172a', fontWeight: 950, letterSpacing: '-.035em', fontSize: 24 }
const progressShellStyle: CSSProperties = { display: 'grid', gap: 7 }
const progressBarStyle: CSSProperties = { height: 10, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }
const progressFillStyle: CSSProperties = { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#2563eb,#0ea5e9,#10b981)' }
const progressTextStyle: CSSProperties = { fontSize: 11, fontWeight: 900, color: '#64748b' }
const detailInfoGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }
const infoStyle: CSSProperties = { display: 'grid', gap: 4, border: '1px solid #e2e8f0', borderRadius: 16, padding: 10, background: '#f8fafc', fontSize: 11, color: '#64748b', fontWeight: 800 }
const actionPanelStyle: CSSProperties = { border: '1px solid #dbeafe', borderRadius: 22, padding: 12, background: '#eff6ff' }
const actionGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }
const smallActionStyle: CSSProperties = { border: '1px solid #bfdbfe', borderRadius: 13, padding: '10px 8px', background: '#fff', color: '#1d4ed8', fontWeight: 950, cursor: 'pointer' }
const completeActionStyle: CSSProperties = { ...smallActionStyle, background: '#0f2a52', color: '#fff', borderColor: '#0f2a52' }
const tabsGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }
const detailListStyle: CSSProperties = { display: 'grid', gap: 6, border: '1px solid #e2e8f0', borderRadius: 16, padding: 10, background: '#fff' }
const detailListTitleStyle: CSSProperties = { fontSize: 12, color: '#0f172a' }
const detailListRowStyle: CSSProperties = { fontSize: 11, color: '#475569', fontWeight: 800, lineHeight: 1.35, padding: '6px 0', borderTop: '1px solid #f1f5f9' }
const detailListEmptyStyle: CSSProperties = { fontSize: 11, color: '#94a3b8', fontWeight: 800 }
const participantBoxStyle: CSSProperties = { display: 'grid', gap: 9, borderRadius: 20, padding: 12, border: '1px solid #fbcfe8', background: '#fdf2f8' }
const apiDetailLinkStyle: CSSProperties = { display: 'grid', placeItems: 'center', textDecoration: 'none', borderRadius: 16, padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f2a52', fontWeight: 950 }
const emptyStateStyle: CSSProperties = { border: '1px dashed #cbd5e1', borderRadius: 22, padding: 18, color: '#64748b', fontWeight: 850, lineHeight: 1.5 }

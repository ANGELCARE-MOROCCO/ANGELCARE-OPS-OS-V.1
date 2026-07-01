'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useMemo, useState } from 'react'
import AngelCareLogo from '@/components/brand/AngelCareLogo'
import type { TrainingHubContext } from '@/lib/traininghub/types'

type Props = {
  context: TrainingHubContext
  sessions: any[]
  participants: any[]
  attendance: any[]
  resources: any[]
  dates: any[]
  checklists: any[]
  certificates: any[]
  queryWarnings: string[]
  adminPreview?: boolean
}

const statusTone: Record<string, { bg: string; fg: string; border: string }> = {
  scheduled: { bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' },
  kit_preparation: { bg: '#fefce8', fg: '#a16207', border: '#fde68a' },
  ready_to_deliver: { bg: '#ecfeff', fg: '#0e7490', border: '#a5f3fc' },
  in_delivery: { bg: '#eef2ff', fg: '#4338ca', border: '#c7d2fe' },
  delivered: { bg: '#ecfdf5', fg: '#047857', border: '#bbf7d0' },
  attendance_validated: { bg: '#ecfdf5', fg: '#047857', border: '#bbf7d0' },
  certificates_issued: { bg: '#f5f3ff', fg: '#6d28d9', border: '#ddd6fe' },
  refresh_unlocked: { bg: '#fdf2f8', fg: '#be185d', border: '#fbcfe8' },
  closed: { bg: '#f8fafc', fg: '#475569', border: '#e2e8f0' },
  cancelled: { bg: '#fef2f2', fg: '#b91c1c', border: '#fecaca' },
  present: { bg: '#ecfdf5', fg: '#047857', border: '#bbf7d0' },
  absent: { bg: '#fef2f2', fg: '#b91c1c', border: '#fecaca' },
  partial: { bg: '#fff7ed', fg: '#c2410c', border: '#fed7aa' },
  pending: { bg: '#f8fafc', fg: '#475569', border: '#e2e8f0' },
  completed: { bg: '#ecfdf5', fg: '#047857', border: '#bbf7d0' },
}

const lifecycle = [
  { key: 'scheduled', label: 'Planifiées', icon: '01' },
  { key: 'kit_preparation', label: 'Kit & préparation', icon: '02' },
  { key: 'ready_to_deliver', label: 'Prêtes', icon: '03' },
  { key: 'in_delivery', label: 'En delivery', icon: '04' },
  { key: 'delivered', label: 'Livrées', icon: '05' },
  { key: 'closed', label: 'Clôturées', icon: '06' },
]

function label(value?: string | null) {
  return String(value || 'pending').replace(/_/g, ' ')
}

function dateLabel(value?: string | null) {
  if (!value) return 'À planifier'
  try {
    return new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  } catch {
    return value
  }
}

function shortDate(value?: string | null) {
  if (!value) return 'Non défini'
  try {
    return new Intl.DateTimeFormat('fr-MA', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date(value))
  } catch {
    return value
  }
}

function courseRef(session: any) {
  return session?.trn_courses?.ref || session?.course?.ref || 'TRN'
}

function courseTitle(session: any) {
  return session?.trn_courses?.title || session?.course?.title || 'Formation AngelCare'
}

function courseCategory(session: any) {
  return session?.trn_courses?.trn_categories?.name || 'TrainingHub'
}

function orgName(session: any) {
  return session?.core_organizations?.name || session?.core_organizations?.legal_name || 'Partenaire'
}

function organizationCity(session: any) {
  return session?.city || session?.core_organizations?.city || 'Maroc'
}

function statusBadge(status?: string | null) {
  const palette = statusTone[String(status || '').toLowerCase()] || statusTone.pending
  return { ...badgeStyle, background: palette.bg, color: palette.fg, borderColor: palette.border }
}

function Badge({ children, status }: { children: ReactNode; status?: string | null }) {
  return <span style={statusBadge(status)}>{children}</span>
}

function SectionHeader({ eyebrow, title, text, action }: { eyebrow: string; title: string; text: string; action?: ReactNode }) {
  return (
    <div style={sectionHeaderStyle}>
      <div>
        <div style={sectionEyebrowStyle}>{eyebrow}</div>
        <h2 style={sectionTitleStyle}>{title}</h2>
        <p style={sectionTextStyle}>{text}</p>
      </div>
      {action}
    </div>
  )
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div style={emptyStyle}>
      <div style={emptyIconStyle}>◇</div>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  )
}

function Kpi({ icon, label, value, text, accent }: { icon: string; label: string; value: ReactNode; text: string; accent: string }) {
  return (
    <article style={kpiCardStyle}>
      <div style={{ ...kpiAccentStyle, background: accent }} />
      <div style={kpiIconStyle}>{icon}</div>
      <div style={kpiLabelStyle}>{label}</div>
      <div style={kpiValueStyle}>{value}</div>
      <div style={kpiTextStyle}>{text}</div>
    </article>
  )
}

export default function TrainingHubTrainerCockpitWorkspace({
  context,
  sessions,
  participants,
  attendance,
  resources,
  dates,
  checklists,
  certificates,
  queryWarnings,
  adminPreview,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(sessions[0]?.id || null)
  const [expanded, setExpanded] = useState(true)
  const selected = sessions.find((session) => session.id === selectedId) || sessions[0] || null

  const sessionParticipants = useMemo(() => {
    if (!selected?.id) return []
    return participants.filter((participant) => participant.session_id === selected.id)
  }, [participants, selected?.id])

  const sessionAttendance = useMemo(() => {
    if (!selected?.id) return []
    return attendance.filter((record) => record.session_id === selected.id)
  }, [attendance, selected?.id])

  const sessionResources = useMemo(() => {
    if (!selected?.id) return []
    return resources.filter((resource) => resource.session_id === selected.id)
  }, [resources, selected?.id])

  const sessionDates = useMemo(() => {
    if (!selected?.id) return []
    return dates.filter((date) => date.session_id === selected.id)
  }, [dates, selected?.id])

  const sessionChecklists = useMemo(() => {
    if (!selected?.id) return []
    return checklists.filter((item) => item.session_id === selected.id)
  }, [checklists, selected?.id])

  const sessionCertificates = useMemo(() => {
    if (!selected?.id) return []
    return certificates.filter((certificate) => certificate.session_id === selected.id)
  }, [certificates, selected?.id])

  const upcoming = sessions.filter((session) => ['scheduled', 'kit_preparation', 'ready_to_deliver'].includes(String(session.status)))
  const inDelivery = sessions.filter((session) => ['in_delivery'].includes(String(session.status)))
  const delivered = sessions.filter((session) => ['delivered', 'attendance_validated', 'certificates_issued', 'refresh_unlocked', 'closed'].includes(String(session.status)))
  const presentCount = attendance.filter((record) => String(record.attendance_status || '').toLowerCase() === 'present').length
  const checklistDone = checklists.filter((item) => ['done', 'completed', 'validated'].includes(String(item.status || '').toLowerCase())).length
  const readinessScore = Math.min(100, Math.round((sessionResources.length ? 20 : 0) + (sessionDates.length ? 20 : 0) + (sessionChecklists.length ? 25 : 0) + (sessionParticipants.length ? 20 : 0) + (selected ? 15 : 0)))

  return (
    <main style={pageStyle}>
      <header style={heroStyle}>
        <div style={heroTopStyle}>
          <div style={brandRowStyle}>
            <AngelCareLogo size="md" showText />
            <span style={portalPillStyle}>Trainer Cockpit</span>
            {adminPreview ? <span style={previewPillStyle}>Admin preview</span> : null}
          </div>
          <a href="/traininghub/logout" style={logoutStyle}>Déconnexion</a>
        </div>

        <div style={heroGridStyle}>
          <section>
            <div style={eyebrowStyle}>ANGELCARE TRAININGHUB • DELIVERY FIELD CONTROL</div>
            <h1 style={titleStyle}>Cockpit trainer pour exécuter les formations sans perte de contrôle.</h1>
            <p style={subtitleStyle}>
              Sessions assignées, participants, présence, checklist, ressources, preuves et clôture — tout ce dont un trainer a besoin avant, pendant et après la formation.
            </p>
            <div style={heroActionsStyle}>
              <a href="#missions" style={primaryActionStyle}>Voir mes sessions</a>
              <a href="#execution" style={secondaryActionStyle}>Préparer le delivery</a>
              <a href="#participants" style={ghostActionStyle}>Présence & participants</a>
            </div>
          </section>

          <aside style={missionFocusStyle}>
            <div style={focusLabelStyle}>Session focus</div>
            <h2 style={focusTitleStyle}>{selected ? courseTitle(selected) : 'Aucune session assignée'}</h2>
            <p style={focusTextStyle}>
              {selected ? `${courseRef(selected)} • ${orgName(selected)} • ${organizationCity(selected)}` : 'Les sessions assignées au trainer apparaîtront ici.'}
            </p>
            <div style={focusProgressTrackStyle}>
              <div style={{ ...focusProgressFillStyle, width: `${readinessScore}%` }} />
            </div>
            <div style={focusMetaGridStyle}>
              <div><span>Readiness</span><strong>{readinessScore}%</strong></div>
              <div><span>Participants</span><strong>{sessionParticipants.length}</strong></div>
              <div><span>Présence</span><strong>{sessionAttendance.length}</strong></div>
              <div><span>Checklists</span><strong>{sessionChecklists.length}</strong></div>
            </div>
          </aside>
        </div>
      </header>

      {queryWarnings.length ? (
        <section style={warningStyle}>
          <strong>Note système.</strong> Certaines données trainer ne sont pas encore disponibles ou la table liée n’est pas encore alimentée. Le cockpit reste utilisable avec les données présentes.
        </section>
      ) : null}

      <section style={kpiGridStyle}>
        <Kpi icon="▣" label="Sessions assignées" value={sessions.length} text="Sessions accessibles dans ce cockpit" accent="#2563eb" />
        <Kpi icon="◈" label="À préparer" value={upcoming.length} text="Planning, kit, participants" accent="#f59e0b" />
        <Kpi icon="◆" label="En delivery" value={inDelivery.length} text="Actions terrain en cours" accent="#7c3aed" />
        <Kpi icon="✓" label="Présences validées" value={presentCount} text="Présences enregistrées" accent="#059669" />
        <Kpi icon="◇" label="Checklists terminées" value={checklistDone} text="Étapes delivery clôturées" accent="#0f766e" />
        <Kpi icon="★" label="Certificats" value={certificates.length} text="Certificats liés aux sessions" accent="#db2777" />
      </section>

      <section style={lifecycleStyle}>
        {lifecycle.map((lane) => {
          const laneSessions = sessions.filter((session) => String(session.status || '') === lane.key || (lane.key === 'closed' && ['closed', 'refresh_unlocked', 'certificates_issued', 'attendance_validated'].includes(String(session.status || ''))))
          return (
            <article key={lane.key} style={laneStyle}>
              <div style={laneTopStyle}>
                <span style={laneIndexStyle}>{lane.icon}</span>
                <div>
                  <strong>{lane.label}</strong>
                  <span>{laneSessions.length} session(s)</span>
                </div>
              </div>
            </article>
          )
        })}
      </section>

      <section style={mainGridStyle}>
        <section id="missions" style={panelStyle}>
          <SectionHeader
            eyebrow="ASSIGNED SESSIONS"
            title="Mes sessions à exécuter"
            text="Liste trainer avec statut, partenaire, ville, date, durée et participants prévus."
            action={<button type="button" style={smallButtonStyle} onClick={() => setExpanded((open) => !open)}>{expanded ? 'Réduire' : 'Voir tout'}</button>}
          />

          <div style={sessionListStyle}>
            {(expanded ? sessions : sessions.slice(0, 4)).length ? (expanded ? sessions : sessions.slice(0, 4)).map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => setSelectedId(session.id)}
                style={selected?.id === session.id ? selectedSessionButtonStyle : sessionButtonStyle}
              >
                <div>
                  <div style={refStyle}>{courseRef(session)} • {session.session_code || 'Session'}</div>
                  <strong>{courseTitle(session)}</strong>
                  <span>{orgName(session)} • {organizationCity(session)} • {dateLabel(session.scheduled_start_at)}</span>
                </div>
                <Badge status={session.status}>{label(session.status)}</Badge>
              </button>
            )) : <EmptyState title="Aucune session assignée" text="Les sessions trainer apparaîtront dès leur planification ou affectation." />}
          </div>
        </section>

        <aside id="execution" style={panelStyle}>
          <SectionHeader
            eyebrow="DELIVERY BRIEF"
            title="Brief d’exécution"
            text="Vue compacte de la session sélectionnée."
          />

          {selected ? (
            <div style={briefStackStyle}>
              <div style={briefHeroStyle}>
                <div style={refStyle}>{courseRef(selected)} • {selected.session_code || 'Session'}</div>
                <h3>{courseTitle(selected)}</h3>
                <p>{selected?.trn_courses?.short_description || courseCategory(selected)}</p>
              </div>
              <div style={briefGridStyle}>
                <div><span>Partenaire</span><strong>{orgName(selected)}</strong></div>
                <div><span>Ville</span><strong>{organizationCity(selected)}</strong></div>
                <div><span>Date</span><strong>{dateLabel(selected.scheduled_start_at)}</strong></div>
                <div><span>Durée</span><strong>{selected.planned_hours || '6–15'} h</strong></div>
              </div>
              <div style={briefAddressStyle}>
                <span>Adresse / lieu</span>
                <strong>{selected.location_address || 'À confirmer avec AngelCare Ops'}</strong>
              </div>
            </div>
          ) : <EmptyState title="Aucune session sélectionnée" text="Sélectionnez une session pour voir le brief." />}
        </aside>
      </section>

      <section style={mainGridStyle}>
        <section id="participants" style={panelStyle}>
          <SectionHeader
            eyebrow="PARTICIPANTS & ATTENDANCE"
            title="Présence, équipe et validation"
            text="Le trainer voit les participants liés à la session sélectionnée et les statuts de présence."
          />
          <div style={participantGridStyle}>
            {sessionParticipants.length ? sessionParticipants.slice(0, 12).map((participant) => (
              <article key={participant.id} style={participantCardStyle}>
                <div style={participantAvatarStyle}>{initials(participant.full_name || participant.email)}</div>
                <div>
                  <strong>{participant.full_name || participant.email || 'Participant'}</strong>
                  <span>{participant.job_title || 'Staff'} • {participant.email || 'email non renseigné'}</span>
                </div>
                <Badge status={participant.attendance_status}>{label(participant.attendance_status)}</Badge>
              </article>
            )) : <EmptyState title="Aucun participant visible" text="Les participants seront visibles après ajout au dossier session." />}
          </div>
        </section>

        <aside style={panelStyle}>
          <SectionHeader
            eyebrow="KIT & PROOF"
            title="Ressources, checklist et preuves"
            text="Ce bloc prépare la logique de delivery terrain."
          />
          <div style={compactStackStyle}>
            <MiniList title="Dates session" rows={sessionDates.map((item) => ({ title: item.date_label || shortDate(item.start_at), text: `${dateLabel(item.start_at)} → ${dateLabel(item.end_at)}`, status: item.status }))} />
            <MiniList title="Checklists" rows={sessionChecklists.map((item) => ({ title: item.checklist_title || item.checklist_type || 'Checklist', text: item.checklist_type || 'Delivery control', status: item.status }))} />
            <MiniList title="Ressources" rows={sessionResources.map((item) => ({ title: item.trn_course_resources?.resource_title || 'Ressource', text: `${item.allocated_quantity || 1} unité(s) • ${item.notes || 'Kit session'}`, status: item.status }))} />
            <MiniList title="Certificats" rows={sessionCertificates.map((item) => ({ title: item.certificate_number || 'Certificat', text: dateLabel(item.issued_at), status: item.status }))} />
          </div>
        </aside>
      </section>
    </main>
  )
}

function MiniList({ title, rows }: { title: string; rows: Array<{ title: string; text: string; status?: string | null }> }) {
  return (
    <div style={miniListStyle}>
      <div style={miniListTitleStyle}>{title}</div>
      {rows.length ? rows.slice(0, 4).map((row, index) => (
        <div key={`${row.title}-${index}`} style={miniRowStyle}>
          <div>
            <strong>{row.title}</strong>
            <span>{row.text}</span>
          </div>
          <Badge status={row.status}>{label(row.status)}</Badge>
        </div>
      )) : <div style={miniEmptyStyle}>Aucune donnée encore disponible.</div>}
    </div>
  )
}

function initials(name?: string | null) {
  const clean = String(name || '').trim()
  if (!clean) return 'AC'
  return clean.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'AC'
}

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at 12% 0%, rgba(37,99,235,.12), transparent 30%), linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%)',
  color: '#0f172a',
  padding: 24,
  fontFamily: 'Inter, Arial, sans-serif',
}

const heroStyle: CSSProperties = {
  borderRadius: 36,
  padding: 28,
  background: 'linear-gradient(135deg, rgba(255,255,255,.96), rgba(239,246,255,.92))',
  border: '1px solid #dbeafe',
  boxShadow: '0 30px 90px rgba(15,23,42,.10)',
  marginBottom: 18,
}
const heroTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 26 }
const brandRowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }
const portalPillStyle: CSSProperties = { borderRadius: 999, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '8px 11px', fontSize: 12, fontWeight: 950 }
const previewPillStyle: CSSProperties = { ...portalPillStyle, background: '#fff7ed', borderColor: '#fed7aa', color: '#c2410c' }
const logoutStyle: CSSProperties = { textDecoration: 'none', color: '#475569', border: '1px solid #e2e8f0', background: '#fff', borderRadius: 16, padding: '11px 14px', fontWeight: 900 }
const heroGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 1.28fr) minmax(390px, .72fr)', gap: 22, alignItems: 'stretch' }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 12, fontWeight: 950, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 12 }
const titleStyle: CSSProperties = { margin: 0, maxWidth: 860, fontSize: 54, lineHeight: 1, letterSpacing: '-.06em', fontWeight: 980 }
const subtitleStyle: CSSProperties = { margin: '16px 0 0', color: '#475569', maxWidth: 760, fontSize: 16, lineHeight: 1.7, fontWeight: 700 }
const heroActionsStyle: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }
const primaryActionStyle: CSSProperties = { textDecoration: 'none', borderRadius: 18, padding: '14px 18px', color: '#fff', background: 'linear-gradient(135deg,#0f2a52,#2563eb)', fontWeight: 950 }
const secondaryActionStyle: CSSProperties = { textDecoration: 'none', borderRadius: 18, padding: '14px 18px', color: '#0f766e', background: '#ecfeff', border: '1px solid #99f6e4', fontWeight: 950 }
const ghostActionStyle: CSSProperties = { textDecoration: 'none', borderRadius: 18, padding: '14px 18px', color: '#475569', background: '#fff', border: '1px solid #e2e8f0', fontWeight: 950 }
const missionFocusStyle: CSSProperties = { borderRadius: 30, padding: 22, color: '#fff', background: 'radial-gradient(circle at top right, rgba(96,165,250,.30), transparent 36%), linear-gradient(160deg,#0b2348,#123c72 52%,#2557d6)', boxShadow: '0 26px 70px rgba(15,42,82,.24)' }
const focusLabelStyle: CSSProperties = { fontSize: 11, textTransform: 'uppercase', letterSpacing: '.13em', fontWeight: 950, opacity: .72 }
const focusTitleStyle: CSSProperties = { margin: '10px 0 0', fontSize: 27, lineHeight: 1.05, letterSpacing: '-.04em', fontWeight: 950 }
const focusTextStyle: CSSProperties = { margin: '8px 0 16px', color: 'rgba(255,255,255,.78)', lineHeight: 1.55, fontWeight: 700 }
const focusProgressTrackStyle: CSSProperties = { height: 12, borderRadius: 999, background: 'rgba(255,255,255,.18)', overflow: 'hidden', marginBottom: 16 }
const focusProgressFillStyle: CSSProperties = { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#34d399,#60a5fa)' }
const focusMetaGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }
const warningStyle: CSSProperties = { border: '1px solid #fed7aa', background: '#fff7ed', color: '#9a3412', borderRadius: 20, padding: 14, marginBottom: 18, fontSize: 13, fontWeight: 750 }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14, marginBottom: 18 }
const kpiCardStyle: CSSProperties = { position: 'relative', overflow: 'hidden', borderRadius: 24, padding: 18, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 16px 44px rgba(15,23,42,.07)' }
const kpiAccentStyle: CSSProperties = { position: 'absolute', top: 0, left: 0, right: 0, height: 4 }
const kpiIconStyle: CSSProperties = { width: 36, height: 36, borderRadius: 13, display: 'grid', placeItems: 'center', background: '#f8fafc', fontWeight: 950, marginBottom: 10 }
const kpiLabelStyle: CSSProperties = { fontSize: 12, color: '#334155', fontWeight: 900 }
const kpiValueStyle: CSSProperties = { fontSize: 30, fontWeight: 950, letterSpacing: '-.04em', marginTop: 4 }
const kpiTextStyle: CSSProperties = { fontSize: 11, color: '#64748b', lineHeight: 1.45, fontWeight: 700, marginTop: 4 }
const lifecycleStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 12, marginBottom: 18 }
const laneStyle: CSSProperties = { borderRadius: 22, padding: 14, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 12px 30px rgba(15,23,42,.05)' }
const laneTopStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '38px minmax(0,1fr)', gap: 10, alignItems: 'center' }
const laneIndexStyle: CSSProperties = { width: 38, height: 38, borderRadius: 14, display: 'grid', placeItems: 'center', background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 950 }
const mainGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) minmax(360px,.85fr)', gap: 18, marginBottom: 18 }
const panelStyle: CSSProperties = { borderRadius: 30, padding: 22, background: 'rgba(255,255,255,.94)', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.07)' }
const sectionHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap' }
const sectionEyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.11em', textTransform: 'uppercase', marginBottom: 6 }
const sectionTitleStyle: CSSProperties = { margin: 0, fontSize: 24, fontWeight: 950, letterSpacing: '-.035em' }
const sectionTextStyle: CSSProperties = { margin: '7px 0 0', color: '#64748b', lineHeight: 1.58, fontSize: 13, fontWeight: 650, maxWidth: 720 }
const smallButtonStyle: CSSProperties = { border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', borderRadius: 14, padding: '10px 12px', fontWeight: 950, cursor: 'pointer' }
const sessionListStyle: CSSProperties = { display: 'grid', gap: 10 }
const sessionButtonStyle: CSSProperties = { textAlign: 'left', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', border: '1px solid #e2e8f0', background: '#fff', borderRadius: 22, padding: 16, cursor: 'pointer', color: '#0f172a' }
const selectedSessionButtonStyle: CSSProperties = { ...sessionButtonStyle, borderColor: '#93c5fd', boxShadow: '0 0 0 4px rgba(59,130,246,.10)' }
const refStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }
const briefStackStyle: CSSProperties = { display: 'grid', gap: 12 }
const briefHeroStyle: CSSProperties = { borderRadius: 24, padding: 18, background: 'linear-gradient(180deg,#0f2a52,#1d4ed8)', color: '#fff' }
const briefGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }
const briefAddressStyle: CSSProperties = { display: 'grid', gap: 4, borderRadius: 18, padding: 14, background: '#f8fafc', border: '1px solid #e2e8f0' }
const participantGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }
const participantCardStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '42px minmax(0,1fr) auto', gap: 10, alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 20, padding: 12, background: '#fff' }
const participantAvatarStyle: CSSProperties = { width: 42, height: 42, borderRadius: 14, display: 'grid', placeItems: 'center', background: '#eff6ff', color: '#1d4ed8', fontWeight: 950 }
const compactStackStyle: CSSProperties = { display: 'grid', gap: 12 }
const miniListStyle: CSSProperties = { display: 'grid', gap: 8 }
const miniListTitleStyle: CSSProperties = { fontSize: 12, fontWeight: 950, color: '#2563eb', letterSpacing: '.08em', textTransform: 'uppercase' }
const miniRowStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 16, padding: 11, background: '#fff' }
const miniEmptyStyle: CSSProperties = { border: '1px dashed #cbd5e1', borderRadius: 16, padding: 12, color: '#64748b', fontSize: 12, fontWeight: 700, background: '#f8fafc' }
const badgeStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', border: '1px solid', borderRadius: 999, padding: '7px 10px', fontSize: 11, fontWeight: 950, textTransform: 'capitalize', whiteSpace: 'nowrap' }
const emptyStyle: CSSProperties = { display: 'grid', gap: 6, justifyItems: 'center', border: '1px dashed #cbd5e1', borderRadius: 20, padding: 20, background: '#f8fafc', color: '#64748b', textAlign: 'center' }
const emptyIconStyle: CSSProperties = { fontSize: 26, color: '#94a3b8' }

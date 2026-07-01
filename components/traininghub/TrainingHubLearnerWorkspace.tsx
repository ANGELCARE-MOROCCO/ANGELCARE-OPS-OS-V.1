'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useMemo, useState } from 'react'
import AngelCareLogo from '@/components/brand/AngelCareLogo'
import type { TrainingHubContext } from '@/lib/traininghub/types'

type Props = {
  context: TrainingHubContext
  assignments: any[]
  progress: any[]
  certificates: any[]
  reminders: any[]
  entitlements: any[]
  participantRecords: any[]
  resources: any[]
  queryWarnings: string[]
  adminPreview?: boolean
}

const statusTone: Record<string, { bg: string; fg: string; border: string }> = {
  assigned: { bg: '#eff6ff', fg: '#1d4ed8', border: '#bfdbfe' },
  active: { bg: '#ecfdf5', fg: '#047857', border: '#bbf7d0' },
  unlocked: { bg: '#ecfdf5', fg: '#047857', border: '#bbf7d0' },
  in_progress: { bg: '#eef2ff', fg: '#4338ca', border: '#c7d2fe' },
  completed: { bg: '#ecfdf5', fg: '#047857', border: '#bbf7d0' },
  issued: { bg: '#f5f3ff', fg: '#6d28d9', border: '#ddd6fe' },
  due: { bg: '#fff7ed', fg: '#c2410c', border: '#fed7aa' },
  overdue: { bg: '#fef2f2', fg: '#b91c1c', border: '#fecaca' },
  pending: { bg: '#f8fafc', fg: '#475569', border: '#e2e8f0' },
  present: { bg: '#ecfdf5', fg: '#047857', border: '#bbf7d0' },
  absent: { bg: '#fef2f2', fg: '#b91c1c', border: '#fecaca' },
}

const navItems = [
  { href: '#path', label: 'Parcours', icon: '01' },
  { href: '#modules', label: 'Modules', icon: '02' },
  { href: '#resources', label: 'Ressources', icon: '03' },
  { href: '#certificates', label: 'Certificats', icon: '04' },
]

function label(value?: string | null) {
  return String(value || 'pending').replace(/_/g, ' ')
}

function dateLabel(value?: string | null) {
  if (!value) return 'Non défini'
  try {
    return new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return value
  }
}

function initials(name?: string | null) {
  const clean = String(name || '').trim()
  if (!clean) return 'AC'
  return clean.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'AC'
}

function moduleTitle(row: any) {
  return row?.learn_modules?.title || row?.title || 'Module AngelCare'
}

function moduleCode(row: any) {
  return row?.learn_modules?.module_code || row?.module_code || 'LEARN'
}

function courseTitle(row: any) {
  return row?.learn_modules?.trn_courses?.title || row?.trn_courses?.title || row?.trn_sessions?.trn_courses?.title || 'Formation AngelCare'
}

function courseRef(row: any) {
  return row?.learn_modules?.trn_courses?.ref || row?.trn_courses?.ref || row?.trn_sessions?.trn_courses?.ref || 'TRN'
}

function progressForModule(progress: any[], moduleId?: string | null) {
  const rows = progress.filter((row) => row.module_id === moduleId)
  if (!rows.length) return null
  const best = rows.reduce((max, row) => Math.max(max, Number(row.progress_percent || 0)), 0)
  const completed = rows.some((row) => ['completed', 'passed'].includes(String(row.progress_status || '').toLowerCase()) || row.completed_at)
  return {
    percent: completed ? Math.max(best, 100) : best,
    status: completed ? 'completed' : rows[0]?.progress_status || 'in_progress',
    lastAccessed: rows[0]?.last_accessed_at || null,
  }
}

function badgeStyleFor(status?: string | null) {
  const palette = statusTone[String(status || '').toLowerCase()] || statusTone.pending
  return { ...badgeStyle, background: palette.bg, color: palette.fg, borderColor: palette.border }
}

function Badge({ children, status }: { children: ReactNode; status?: string | null }) {
  return <span style={badgeStyleFor(status)}>{children}</span>
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div style={emptyStateStyle}>
      <div style={emptyIconStyle}>◇</div>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  )
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

export default function TrainingHubLearnerWorkspace({
  context,
  assignments,
  progress,
  certificates,
  reminders,
  entitlements,
  participantRecords,
  resources,
  queryWarnings,
  adminPreview,
}: Props) {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(assignments[0]?.module_id || entitlements[0]?.module_id || null)
  const [showAllModules, setShowAllModules] = useState(false)

  const assignedModuleIds = new Set(assignments.map((assignment) => assignment.module_id).filter(Boolean))
  const entitlementOnly = entitlements.filter((entitlement) => entitlement.module_id && !assignedModuleIds.has(entitlement.module_id))
  const learningItems = [...assignments, ...entitlementOnly]

  const selectedItem = learningItems.find((item) => item.module_id === selectedModuleId) || learningItems[0] || null
  const selectedProgress = selectedItem ? progressForModule(progress, selectedItem.module_id) : null

  const completedModules = learningItems.filter((item) => {
    const p = progressForModule(progress, item.module_id)
    return p?.percent === 100 || ['completed', 'passed'].includes(String(item.status || item.completion_status || '').toLowerCase())
  }).length

  const activeModules = learningItems.filter((item) => ['assigned', 'active', 'unlocked', 'in_progress'].includes(String(item.status || '').toLowerCase())).length
  const issuedCertificates = certificates.filter((certificate) => ['issued', 'active'].includes(String(certificate.status || '').toLowerCase()))
  const dueReminders = reminders.filter((reminder) => !['completed', 'cancelled'].includes(String(reminder.reminder_status || '').toLowerCase()))
  const presentSessions = participantRecords.filter((row) => ['present', 'validated', 'completed'].includes(String(row.attendance_status || '').toLowerCase()))
  const overallProgress = learningItems.length ? Math.round((completedModules / learningItems.length) * 100) : 0

  const selectedResources = useMemo(() => {
    if (!selectedItem?.learn_modules?.course_id && !selectedItem?.course_id) return resources.slice(0, 8)
    const courseId = selectedItem?.learn_modules?.course_id || selectedItem?.course_id
    const filtered = resources.filter((resource) => resource.course_id === courseId)
    return filtered.length ? filtered : resources.slice(0, 8)
  }, [resources, selectedItem])

  return (
    <main style={pageStyle}>
      <header style={heroStyle}>
        <div style={topStyle}>
          <div style={brandRowStyle}>
            <AngelCareLogo size="md" showText />
            <span style={portalPillStyle}>Learning Space</span>
            {adminPreview ? <span style={previewPillStyle}>Admin preview</span> : null}
          </div>
          <a href="/traininghub/logout" style={logoutStyle}>Déconnexion</a>
        </div>

        <div style={heroGridStyle}>
          <section>
            <div style={eyebrowStyle}>ANGELCARE TRAININGHUB • STAFF LEARNING SPACE</div>
            <h1 style={titleStyle}>Un espace simple pour apprendre, refaire, prouver et progresser.</h1>
            <p style={subtitleStyle}>
              Le participant retrouve ses modules refresh, ses supports, son avancement, ses rappels et ses certificats dans un espace personnel séparé du backoffice AngelCare.
            </p>

            <div style={actionRowStyle}>
              <a href="#modules" style={primaryActionStyle}>Continuer mon parcours</a>
              <a href="#resources" style={secondaryActionStyle}>Voir mes supports</a>
              <a href="#certificates" style={ghostActionStyle}>Mes certificats</a>
            </div>
          </section>

          <aside style={profilePanelStyle}>
            <div style={profileHeaderStyle}>
              <div style={avatarStyle}>{initials(context.profile.full_name || context.profile.email)}</div>
              <div>
                <div style={profileLabelStyle}>Participant TrainingHub</div>
                <h2 style={profileNameStyle}>{context.profile.full_name || context.profile.email}</h2>
                <p style={profileMetaStyle}>{context.organizations[0]?.name || 'Établissement partenaire'} • {context.roles.map((role) => role.code).join(' / ') || 'learner'}</p>
              </div>
            </div>

            <div style={scoreCardStyle}>
              <div style={scoreTopStyle}>
                <span>Progression globale</span>
                <strong>{overallProgress}%</strong>
              </div>
              <div style={progressTrackStyle}>
                <div style={{ ...progressFillStyle, width: `${overallProgress}%` }} />
              </div>
              <p>{learningItems.length ? `${completedModules} module(s) complété(s) sur ${learningItems.length}.` : 'Les modules apparaîtront après activation par votre établissement ou AngelCare.'}</p>
            </div>

            <div style={profileStatsStyle}>
              <div><strong>{learningItems.length}</strong><span>modules</span></div>
              <div><strong>{issuedCertificates.length}</strong><span>certificats</span></div>
              <div><strong>{dueReminders.length}</strong><span>rappels</span></div>
            </div>
          </aside>
        </div>
      </header>

      <nav style={stickyNavStyle}>
        {navItems.map((item) => (
          <a key={item.href} href={item.href} style={navLinkStyle}><span>{item.icon}</span>{item.label}</a>
        ))}
      </nav>

      {queryWarnings.length ? (
        <section style={warningStyle}>
          <strong>Note système.</strong> Certaines données learner ne sont pas encore alimentées ou visibles pour ce profil. L’espace reste utilisable avec les données disponibles.
        </section>
      ) : null}

      <section id="path" style={kpiGridStyle}>
        <Kpi icon="▶" label="Modules ouverts" value={learningItems.length} text="Assignations + refresh débloqués" accent="#2563eb" />
        <Kpi icon="✓" label="Modules complétés" value={completedModules} text="Progression terminée" accent="#059669" />
        <Kpi icon="◈" label="Sessions suivies" value={participantRecords.length} text="Présence liée aux formations" accent="#7c3aed" />
        <Kpi icon="◆" label="Présences validées" value={presentSessions.length} text="Présence ou validation" accent="#0f766e" />
        <Kpi icon="★" label="Certificats" value={issuedCertificates.length} text="Preuves disponibles" accent="#db2777" />
        <Kpi icon="!" label="Rappels actifs" value={dueReminders.length} text="Refresh ou échéances" accent="#f59e0b" />
      </section>

      <section style={mainGridStyle}>
        <section id="modules" style={panelStyle}>
          <SectionHeader
            eyebrow="MY LEARNING PATH"
            title="Mes modules & refresh"
            text="Liste des modules assignés ou débloqués après une formation terrain."
            action={<button type="button" onClick={() => setShowAllModules((open) => !open)} style={smallButtonStyle}>{showAllModules ? 'Réduire' : 'Voir tout'}</button>}
          />

          <div style={moduleListStyle}>
            {(showAllModules ? learningItems : learningItems.slice(0, 6)).length ? (showAllModules ? learningItems : learningItems.slice(0, 6)).map((item) => {
              const p = progressForModule(progress, item.module_id)
              const percent = p?.percent || 0
              return (
                <button
                  key={`${item.id}-${item.module_id}`}
                  type="button"
                  style={selectedItem?.module_id === item.module_id ? selectedModuleButtonStyle : moduleButtonStyle}
                  onClick={() => setSelectedModuleId(item.module_id)}
                >
                  <div style={moduleIconStyle}>{percent === 100 ? '✓' : '▶'}</div>
                  <div>
                    <div style={refStyle}>{moduleCode(item)} • {courseRef(item)}</div>
                    <strong>{moduleTitle(item)}</strong>
                    <span>{courseTitle(item)} • {item.learn_modules?.estimated_minutes || 20} min</span>
                    <div style={inlineProgressStyle}><div style={{ ...inlineProgressFillStyle, width: `${percent}%` }} /></div>
                  </div>
                  <Badge status={p?.status || item.status}>{label(p?.status || item.status)}</Badge>
                </button>
              )
            }) : <EmptyState title="Aucun module disponible" text="Les modules seront visibles dès qu’ils seront assignés ou débloqués par AngelCare." />}
          </div>
        </section>

        <aside style={panelStyle}>
          <SectionHeader
            eyebrow="CURRENT MODULE"
            title="Module sélectionné"
            text="Résumé, progression et prochaines actions."
          />

          {selectedItem ? (
            <div style={currentModuleStyle}>
              <div style={currentHeroStyle}>
                <div style={refStyle}>{moduleCode(selectedItem)} • {courseRef(selectedItem)}</div>
                <h3>{moduleTitle(selectedItem)}</h3>
                <p>{selectedItem.learn_modules?.summary || courseTitle(selectedItem)}</p>
              </div>
              <div style={currentGridStyle}>
                <div><span>Progression</span><strong>{selectedProgress?.percent || 0}%</strong></div>
                <div><span>Statut</span><strong>{label(selectedProgress?.status || selectedItem.status)}</strong></div>
                <div><span>Assigné</span><strong>{dateLabel(selectedItem.assigned_at || selectedItem.unlocked_at)}</strong></div>
                <div><span>Échéance</span><strong>{dateLabel(selectedItem.due_at || selectedItem.valid_until)}</strong></div>
              </div>
              <div style={currentNoticeStyle}>
                L’action de lecture vidéo / quiz sera branchée après la finalisation UI et les contrôles pré-déploiement.
              </div>
            </div>
          ) : <EmptyState title="Aucun module sélectionné" text="Sélectionnez un module pour voir le détail." />}
        </aside>
      </section>

      <section style={mainGridStyle}>
        <section id="resources" style={panelStyle}>
          <SectionHeader
            eyebrow="RESOURCES & SUPPORTS"
            title="Supports, workbooks & fiches process"
            text="Ressources visibles pour le participant selon le module ou la formation liée."
          />

          <div style={resourceGridStyle}>
            {selectedResources.length ? selectedResources.slice(0, 12).map((resource) => (
              <article key={resource.id} style={resourceCardStyle}>
                <div style={resourceTypeStyle}>{resource.resource_type || 'resource'}</div>
                <h3>{resource.resource_title || 'Ressource pédagogique'}</h3>
                <p>{resource.trn_courses?.ref || 'TRN'} • {resource.trn_courses?.title || 'Formation AngelCare'}</p>
                <Badge status={resource.status}>{label(resource.status)}</Badge>
              </article>
            )) : <EmptyState title="Aucune ressource visible" text="Les supports apparaîtront avec les modules et formations débloqués." />}
          </div>
        </section>

        <aside id="certificates" style={panelStyle}>
          <SectionHeader
            eyebrow="CERTIFICATES & REMINDERS"
            title="Certificats et rappels"
            text="Preuves de complétion et refresh à venir."
          />

          <div style={sideStackStyle}>
            <MiniList title="Certificats" rows={certificates.map((item) => ({ title: item.certificate_number || 'Certificat', text: `${moduleTitle(item)} • ${dateLabel(item.issued_at)}`, status: item.status }))} />
            <MiniList title="Rappels refresh" rows={reminders.map((item) => ({ title: item.learn_modules?.title || item.reminder_type || 'Rappel', text: `Échéance ${dateLabel(item.due_at)}`, status: item.reminder_status }))} />
            <MiniList title="Sessions suivies" rows={participantRecords.map((item) => ({ title: item.trn_sessions?.session_code || courseRef(item), text: `${courseTitle(item)} • ${dateLabel(item.trn_sessions?.scheduled_start_at)}`, status: item.attendance_status }))} />
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
      {rows.length ? rows.slice(0, 5).map((row, index) => (
        <div key={`${row.title}-${index}`} style={miniRowStyle}>
          <div>
            <strong>{row.title}</strong>
            <span>{row.text}</span>
          </div>
          <Badge status={row.status}>{label(row.status)}</Badge>
        </div>
      )) : <div style={miniEmptyStyle}>Aucune donnée disponible.</div>}
    </div>
  )
}

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  padding: 24,
  color: '#0f172a',
  background: 'radial-gradient(circle at 12% 0%, rgba(37,99,235,.12), transparent 30%), linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%)',
  fontFamily: 'Inter, Arial, sans-serif',
}
const heroStyle: CSSProperties = {
  borderRadius: 36,
  padding: 28,
  background: 'linear-gradient(135deg, rgba(255,255,255,.96), rgba(240,253,250,.90))',
  border: '1px solid #ccfbf1',
  boxShadow: '0 30px 90px rgba(15,23,42,.10)',
  marginBottom: 18,
}
const topStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 26 }
const brandRowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }
const portalPillStyle: CSSProperties = { borderRadius: 999, background: '#ecfeff', border: '1px solid #99f6e4', color: '#0f766e', padding: '8px 11px', fontSize: 12, fontWeight: 950 }
const previewPillStyle: CSSProperties = { ...portalPillStyle, background: '#fff7ed', borderColor: '#fed7aa', color: '#c2410c' }
const logoutStyle: CSSProperties = { textDecoration: 'none', color: '#475569', border: '1px solid #e2e8f0', background: '#fff', borderRadius: 16, padding: '11px 14px', fontWeight: 900 }
const heroGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1.25fr) minmax(390px,.75fr)', gap: 22, alignItems: 'stretch' }
const eyebrowStyle: CSSProperties = { color: '#0f766e', fontSize: 12, fontWeight: 950, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 12 }
const titleStyle: CSSProperties = { margin: 0, maxWidth: 880, fontSize: 54, lineHeight: 1, letterSpacing: '-.06em', fontWeight: 980 }
const subtitleStyle: CSSProperties = { margin: '16px 0 0', maxWidth: 760, color: '#475569', fontSize: 16, lineHeight: 1.7, fontWeight: 700 }
const actionRowStyle: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }
const primaryActionStyle: CSSProperties = { textDecoration: 'none', borderRadius: 18, padding: '14px 18px', color: '#fff', background: 'linear-gradient(135deg,#0f766e,#2563eb)', fontWeight: 950 }
const secondaryActionStyle: CSSProperties = { textDecoration: 'none', borderRadius: 18, padding: '14px 18px', color: '#0f766e', background: '#ecfeff', border: '1px solid #99f6e4', fontWeight: 950 }
const ghostActionStyle: CSSProperties = { textDecoration: 'none', borderRadius: 18, padding: '14px 18px', color: '#475569', background: '#fff', border: '1px solid #e2e8f0', fontWeight: 950 }
const profilePanelStyle: CSSProperties = { borderRadius: 30, padding: 22, color: '#fff', background: 'radial-gradient(circle at top right, rgba(45,212,191,.28), transparent 34%), linear-gradient(160deg,#0b2348,#0f766e 56%,#2563eb)', boxShadow: '0 26px 70px rgba(15,42,82,.24)' }
const profileHeaderStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '60px minmax(0,1fr)', gap: 14, alignItems: 'center', marginBottom: 16 }
const avatarStyle: CSSProperties = { width: 60, height: 60, borderRadius: 20, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.18)', fontSize: 20, fontWeight: 950 }
const profileLabelStyle: CSSProperties = { fontSize: 11, textTransform: 'uppercase', letterSpacing: '.12em', color: 'rgba(255,255,255,.72)', fontWeight: 950 }
const profileNameStyle: CSSProperties = { margin: '5px 0 0', fontSize: 24, lineHeight: 1, letterSpacing: '-.04em', fontWeight: 950 }
const profileMetaStyle: CSSProperties = { margin: '7px 0 0', color: 'rgba(255,255,255,.78)', fontSize: 12, lineHeight: 1.5, fontWeight: 700 }
const scoreCardStyle: CSSProperties = { borderRadius: 22, padding: 16, background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.14)', marginBottom: 14 }
const scoreTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10, fontWeight: 950 }
const progressTrackStyle: CSSProperties = { height: 10, borderRadius: 999, background: 'rgba(255,255,255,.18)', overflow: 'hidden' }
const progressFillStyle: CSSProperties = { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#34d399,#60a5fa)' }
const profileStatsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }
const stickyNavStyle: CSSProperties = { position: 'sticky', top: 10, zIndex: 10, display: 'flex', gap: 10, flexWrap: 'wrap', padding: 12, marginBottom: 18, borderRadius: 22, border: '1px solid rgba(226,232,240,.85)', background: 'rgba(255,255,255,.86)', backdropFilter: 'blur(14px)', boxShadow: '0 14px 30px rgba(15,23,42,.06)' }
const navLinkStyle: CSSProperties = { textDecoration: 'none', color: '#334155', borderRadius: 999, padding: '10px 14px', border: '1px solid #e2e8f0', background: '#fff', display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 850, fontSize: 13 }
const warningStyle: CSSProperties = { border: '1px solid #fed7aa', background: '#fff7ed', color: '#9a3412', borderRadius: 20, padding: 14, marginBottom: 18, fontSize: 13, fontWeight: 750 }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14, marginBottom: 18 }
const kpiCardStyle: CSSProperties = { position: 'relative', overflow: 'hidden', borderRadius: 24, padding: 18, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 16px 44px rgba(15,23,42,.07)' }
const kpiAccentStyle: CSSProperties = { position: 'absolute', top: 0, left: 0, right: 0, height: 4 }
const kpiIconStyle: CSSProperties = { width: 36, height: 36, borderRadius: 13, display: 'grid', placeItems: 'center', background: '#f8fafc', fontWeight: 950, marginBottom: 10 }
const kpiLabelStyle: CSSProperties = { fontSize: 12, color: '#334155', fontWeight: 900 }
const kpiValueStyle: CSSProperties = { fontSize: 30, fontWeight: 950, letterSpacing: '-.04em', marginTop: 4 }
const kpiTextStyle: CSSProperties = { fontSize: 11, color: '#64748b', lineHeight: 1.45, fontWeight: 700, marginTop: 4 }
const mainGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) minmax(360px,.85fr)', gap: 18, marginBottom: 18 }
const panelStyle: CSSProperties = { borderRadius: 30, padding: 22, background: 'rgba(255,255,255,.94)', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.07)' }
const sectionHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap' }
const sectionEyebrowStyle: CSSProperties = { color: '#0f766e', fontSize: 11, fontWeight: 950, letterSpacing: '.11em', textTransform: 'uppercase', marginBottom: 6 }
const sectionTitleStyle: CSSProperties = { margin: 0, fontSize: 24, fontWeight: 950, letterSpacing: '-.035em' }
const sectionTextStyle: CSSProperties = { margin: '7px 0 0', color: '#64748b', lineHeight: 1.58, fontSize: 13, fontWeight: 650, maxWidth: 720 }
const smallButtonStyle: CSSProperties = { border: '1px solid #99f6e4', background: '#ecfeff', color: '#0f766e', borderRadius: 14, padding: '10px 12px', fontWeight: 950, cursor: 'pointer' }
const moduleListStyle: CSSProperties = { display: 'grid', gap: 10 }
const moduleButtonStyle: CSSProperties = { textAlign: 'left', display: 'grid', gridTemplateColumns: '46px minmax(0,1fr) auto', gap: 12, alignItems: 'center', border: '1px solid #e2e8f0', background: '#fff', borderRadius: 22, padding: 14, cursor: 'pointer', color: '#0f172a' }
const selectedModuleButtonStyle: CSSProperties = { ...moduleButtonStyle, borderColor: '#99f6e4', boxShadow: '0 0 0 4px rgba(20,184,166,.12)' }
const moduleIconStyle: CSSProperties = { width: 46, height: 46, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#ecfeff', color: '#0f766e', fontWeight: 950 }
const refStyle: CSSProperties = { color: '#0f766e', fontSize: 11, fontWeight: 950, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }
const inlineProgressStyle: CSSProperties = { height: 8, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden', marginTop: 10 }
const inlineProgressFillStyle: CSSProperties = { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#34d399,#60a5fa)' }
const currentModuleStyle: CSSProperties = { display: 'grid', gap: 12 }
const currentHeroStyle: CSSProperties = { borderRadius: 24, padding: 18, color: '#fff', background: 'linear-gradient(160deg,#0b2348,#0f766e)' }
const currentGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }
const currentNoticeStyle: CSSProperties = { borderRadius: 18, padding: 13, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontSize: 12, lineHeight: 1.5, fontWeight: 700 }
const resourceGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const resourceCardStyle: CSSProperties = { borderRadius: 22, padding: 16, background: '#fff', border: '1px solid #e2e8f0', display: 'grid', gap: 8 }
const resourceTypeStyle: CSSProperties = { color: '#0f766e', fontSize: 11, fontWeight: 950, letterSpacing: '.08em', textTransform: 'uppercase' }
const sideStackStyle: CSSProperties = { display: 'grid', gap: 12 }
const miniListStyle: CSSProperties = { display: 'grid', gap: 8 }
const miniListTitleStyle: CSSProperties = { fontSize: 12, fontWeight: 950, color: '#0f766e', letterSpacing: '.08em', textTransform: 'uppercase' }
const miniRowStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 16, padding: 11, background: '#fff' }
const miniEmptyStyle: CSSProperties = { border: '1px dashed #cbd5e1', borderRadius: 16, padding: 12, color: '#64748b', fontSize: 12, fontWeight: 700, background: '#f8fafc' }
const badgeStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', border: '1px solid', borderRadius: 999, padding: '7px 10px', fontSize: 11, fontWeight: 950, textTransform: 'capitalize', whiteSpace: 'nowrap' }
const emptyStateStyle: CSSProperties = { display: 'grid', gap: 6, justifyItems: 'center', border: '1px dashed #cbd5e1', borderRadius: 20, padding: 20, background: '#f8fafc', color: '#64748b', textAlign: 'center' }
const emptyIconStyle: CSSProperties = { fontSize: 26, color: '#94a3b8' }

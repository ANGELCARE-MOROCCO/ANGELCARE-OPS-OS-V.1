"use client"

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import type { Angelcare360AdmissionsOverviewRecord } from '@/types/angelcare360/admissions'

type Angelcare360AdmissionsHubProps = {
  overview: Angelcare360AdmissionsOverviewRecord
}

type Tone = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'slate'
type AlertTone = 'danger' | 'warning' | 'info' | 'success'

type Kpi = {
  label: string
  value: string
  note: string
  tone: Tone
  href: string
  progress?: number | null
  state?: 'ready' | 'watch' | 'empty'
}

function percent(value: number | null) {
  if (value === null || Number.isNaN(value)) return 'À consolider'
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`
}

function safePercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return null
  return Math.max(0, Math.min(100, value))
}

function statusLabel(value: string) {
  const normalized = value.toLowerCase()
  if (['new', 'nouveau', 'nouvelle_demande'].includes(normalized)) return 'Nouveau'
  if (['qualified', 'qualifie', 'qualifié', 'contacted', 'contacte', 'contacté'].includes(normalized)) return 'Qualifié'
  if (normalized.includes('review') || normalized.includes('etude') || normalized.includes('étude')) return 'En étude'
  if (normalized.includes('approved') || normalized.includes('accepte') || normalized.includes('accepté')) return 'Accepté'
  if (normalized.includes('converted') || normalized.includes('converti')) return 'Inscrit'
  if (normalized.includes('waiting') || normalized.includes('attente')) return 'En attente'
  if (normalized.includes('reject') || normalized.includes('refus')) return 'Refusé'
  if (normalized.includes('archive')) return 'Archivé'
  return value || 'À suivre'
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'AC'
  return `${parts[0]?.[0] || 'A'}${parts[1]?.[0] || parts[0]?.[1] || 'C'}`.toUpperCase()
}

export default function Angelcare360AdmissionsHub({ overview }: Angelcare360AdmissionsHubProps) {
  const completedApplications = Math.max(0, overview.openApplicationCount - overview.missingDocumentApplicationCount)
  const receivedToApplicationRate = overview.leadCount > 0 ? Math.round((overview.openApplicationCount / overview.leadCount) * 100) : null
  const totalVisibleFlow = overview.leadCount + overview.openApplicationCount + overview.convertedCount
  const readinessItems = [
    { label: 'Année scolaire', ready: overview.setupReadiness.academicYearReady },
    { label: 'Classes', ready: overview.setupReadiness.classReady },
    { label: 'Pièces requises', ready: overview.setupReadiness.documentReady },
    { label: 'Scan doublons', ready: overview.setupReadiness.duplicateScanReady },
  ]
  const readinessScore = Math.round((readinessItems.filter((item) => item.ready).length / readinessItems.length) * 100)

  const kpis: Kpi[] = [
    {
      label: 'Demandes reçues',
      value: String(overview.leadCount),
      note: overview.leadCount > 0 ? `${overview.newLeadCount} nouvelle(s) demande(s) à qualifier` : 'Aucune demande reçue',
      tone: overview.leadCount > 0 ? 'blue' : 'slate',
      href: '/angelcare-360-command-center/admissions/demandes',
      state: overview.leadCount > 0 ? 'ready' : 'empty',
    },
    {
      label: 'À qualifier',
      value: String(overview.newLeadCount),
      note: overview.leadCount > 0 ? `${Math.round((overview.newLeadCount / Math.max(overview.leadCount, 1)) * 100)} % du flux entrant` : 'Aucune qualification en attente',
      tone: overview.newLeadCount > 0 ? 'orange' : 'slate',
      href: '/angelcare-360-command-center/admissions/demandes',
      state: overview.newLeadCount > 0 ? 'watch' : 'empty',
    },
    {
      label: 'Dossiers complets',
      value: String(completedApplications),
      note: overview.openApplicationCount > 0 ? `${overview.missingDocumentApplicationCount} dossier(s) incomplet(s)` : 'Aucun dossier ouvert',
      tone: completedApplications > 0 ? 'green' : overview.missingDocumentApplicationCount > 0 ? 'orange' : 'slate',
      href: '/angelcare-360-command-center/admissions/dossiers',
      progress: overview.openApplicationCount > 0 ? Math.round((completedApplications / overview.openApplicationCount) * 100) : null,
      state: completedApplications > 0 ? 'ready' : overview.missingDocumentApplicationCount > 0 ? 'watch' : 'empty',
    },
    {
      label: 'Visites planifiées',
      value: String(overview.interviewReadyCount),
      note: overview.interviewReadyCount > 0 ? 'Rendez-vous à honorer' : 'Aucune visite planifiée',
      tone: overview.interviewReadyCount > 0 ? 'purple' : 'slate',
      href: '/angelcare-360-command-center/admissions/entretiens',
      state: overview.interviewReadyCount > 0 ? 'watch' : 'empty',
    },
    {
      label: 'Inscriptions confirmées',
      value: String(overview.convertedCount),
      note: overview.conversionRate === null ? 'Conversion non mesurable' : `${percent(overview.conversionRate)} de conversion globale`,
      tone: overview.convertedCount > 0 ? 'green' : 'slate',
      href: '/angelcare-360-command-center/admissions/conversions',
      progress: overview.conversionRate,
      state: overview.convertedCount > 0 ? 'ready' : 'empty',
    },
  ]

  return (
    <section style={pageStyle}>
      <section style={heroStyle}>
        <div style={heroMainStyle}>
          <div style={eyebrowStyle}>Admissions</div>
          <h1 style={titleStyle}>Admissions</h1>
          <p style={subtitleStyle}>Pilotez les demandes familles, la complétude des dossiers, les visites et la conversion en inscriptions.</p>
          <nav aria-label="Sections admissions" style={tabsStyle}>
            {[
              ['Vue d’ensemble', '/angelcare-360-command-center/admissions'],
              ['Demandes', '/angelcare-360-command-center/admissions/demandes'],
              ['Dossiers', '/angelcare-360-command-center/admissions/dossiers'],
              ['Suivi', '/angelcare-360-command-center/admissions/entretiens'],
              ['Visites', '/angelcare-360-command-center/admissions/entretiens'],
              ['Conversion', '/angelcare-360-command-center/admissions/conversions'],
              ['Documents', '/angelcare-360-command-center/admissions/documents'],
            ].map(([label, href], index) => (
              <Link key={label} href={href} style={{ ...tabStyle, ...(index === 0 ? activeTabStyle : null) }}>{label}</Link>
            ))}
          </nav>
        </div>
        <aside style={heroAsideStyle} aria-label="Préparation admissions">
          <div style={heroBadgeRowStyle}>
            <Badge tone={overview.setupReadiness.academicYearReady ? 'green' : 'orange'}>{overview.activeAcademicYearLabel || 'Année à configurer'}</Badge>
            <Badge tone="blue">{overview.activeSchoolName || 'Établissement'}</Badge>
          </div>
          <div style={readinessCardStyle}>
            <span style={readinessLabelStyle}>Readiness admissions</span>
            <strong style={readinessValueStyle}>{readinessScore}%</strong>
            <Progress value={readinessScore} tone={readinessScore >= 75 ? 'green' : readinessScore >= 50 ? 'orange' : 'red'} />
          </div>
        </aside>
      </section>

      <section style={kpiGridStyle}>
        {kpis.map((item) => <KpiCard key={item.label} item={item} />)}
      </section>

      <section style={commandBarStyle} aria-label="Actions admissions">
        <ActionLink href="/angelcare-360-command-center/admissions/demandes" primary>Nouvelle demande</ActionLink>
        <ActionLink href="/angelcare-360-command-center/admissions/dossiers">Créer un dossier</ActionLink>
        <ActionLink href="/angelcare-360-command-center/admissions/entretiens">Planifier une visite</ActionLink>
        <ActionLink href="/angelcare-360-command-center/admissions/conversions">Convertir en inscription</ActionLink>
        <ActionLink href="/angelcare-360-command-center/admissions/documents">Contrôler les pièces</ActionLink>
        <ActionLink href="/angelcare-360-command-center/exports">Exporter</ActionLink>
      </section>

      <section style={pipelineStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={eyebrowStyle}>Pipeline des admissions</div>
            <h2 style={panelTitleStyle}>De la demande à l’inscription</h2>
          </div>
          <Link href="/angelcare-360-command-center/admissions/pipeline" style={panelActionStyle}>Ouvrir Pipeline →</Link>
        </div>
        {totalVisibleFlow > 0 ? (
          <div style={pipelineColumnsStyle}>
            {overview.pipelinePreview.map((column) => (
              <article key={column.key} style={pipelineColumnStyle}>
                <div style={pipelineColumnHeadStyle}>
                  <span style={{ ...stageDotStyle, background: toneColor(column.tone) }} />
                  <strong>{column.label}</strong>
                  <span style={countPillStyle}>{column.count}</span>
                </div>
                <div style={pipelineItemsStyle}>
                  {column.items.length ? column.items.map((item) => (
                    <Link key={item.id} href={item.detailHref} style={pipelineItemStyle}>
                      <strong>{item.title}</strong>
                      <span>{item.subtitle}</span>
                      <em>{item.dateLabel}</em>
                    </Link>
                  )) : <div style={emptyPipelineStyle}>Aucun dossier dans cette étape.</div>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Aucun flux admission actif" description="Les demandes, dossiers et visites apparaîtront ici dès que l’équipe commencera le suivi des familles." href="/angelcare-360-command-center/admissions/demandes" action="Créer une demande" />
        )}
      </section>

      <section style={lowerGridStyle}>
        <Panel eyebrow="Demandes récentes" title="Familles à suivre" actionHref="/angelcare-360-command-center/admissions/demandes" actionLabel="Ouvrir Demandes" wide>
          {overview.recentLeads.length ? (
            <div style={tableStyle}>
              <div style={tableHeadStyle}>
                <span>Enfant</span><span>Parent / Tuteur</span><span>Niveau</span><span>Source</span><span>Date</span><span>Statut</span>
              </div>
              {overview.recentLeads.map((lead) => (
                <Link key={lead.id} href={lead.detailHref} style={tableRowStyle}>
                  <span style={studentCellStyle}><Avatar value={lead.childName} tone="blue" /><strong>{lead.childName}</strong></span>
                  <span>{lead.parentName}</span>
                  <span>{lead.desiredLevel}</span>
                  <span>{lead.sourceChannel}</span>
                  <span>{lead.dateLabel}</span>
                  <StatusPill status={lead.status} />
                </Link>
              ))}
            </div>
          ) : <EmptyState title="Aucune demande récente" description="Les nouvelles familles apparaîtront ici dès leur création, import ou formulaire public." href="/angelcare-360-command-center/admissions/demandes" action="Ouvrir Demandes" />}
        </Panel>

        <Panel eyebrow="Entonnoir de conversion" title="Conversion admissions" actionHref="/angelcare-360-command-center/admissions/conversions" actionLabel="Voir Conversion">
          <div style={funnelStyle}>
            {overview.conversionSteps.map((step, index) => (
              <div key={step.key} style={{ ...funnelStepStyle, width: `${Math.max(54, 100 - index * 9)}%`, background: toneGradient(step.tone) }}>
                <span>{step.label}</span>
                <strong>{step.value}</strong>
                <em>{step.percent === null ? '—' : `${step.percent}%`}</em>
              </div>
            ))}
          </div>
          <div style={conversionRateStyle}><span>Taux global</span><strong>{percent(overview.conversionRate)}</strong></div>
          <div style={secondaryRateStyle}><span>Passage demande → dossier</span><strong>{receivedToApplicationRate === null ? 'À consolider' : `${receivedToApplicationRate}%`}</strong></div>
        </Panel>

        <Panel eyebrow="Visites & suivis" title="Actions à venir" actionHref="/angelcare-360-command-center/admissions/entretiens" actionLabel="Voir Suivis">
          {overview.upcomingActions.length ? (
            <div style={actionListStyle}>
              {overview.upcomingActions.map((action) => (
                <Link key={action.id} href={action.detailHref} style={upcomingActionStyle}>
                  <span style={calendarBadgeStyle}>{action.dateLabel}</span>
                  <span style={rowMainStyle}><strong>{action.title}</strong><small>{action.subtitle}</small></span>
                  <StatusPill status={action.status} />
                </Link>
              ))}
            </div>
          ) : <EmptyState title="Aucun suivi planifié" description="Les relances, visites et rendez-vous apparaîtront ici après planification." href="/angelcare-360-command-center/admissions/entretiens" action="Planifier une visite" />}
        </Panel>

        <Panel eyebrow="Alertes & actions" title="Risques admission" actionHref="/angelcare-360-command-center/admissions/audit" actionLabel="Voir Audit">
          {overview.alerts.length ? (
            <div style={alertListStyle}>
              {overview.alerts.map((alert) => (
                <Link key={alert.id} href={alert.href} style={alertRowStyle(alert.tone)}>
                  <span style={{ ...alertIconStyle, ...alertToneStyle(alert.tone) }}>{alert.count}</span>
                  <span style={rowMainStyle}><strong>{alert.title}</strong><small>{alert.detail}</small></span>
                </Link>
              ))}
            </div>
          ) : <EmptyState title="Aucune alerte bloquante" description="Le flux admissions ne présente pas de risque prioritaire selon les données disponibles." href="/angelcare-360-command-center/admissions/audit" action="Voir Audit" />}
        </Panel>

        <Panel eyebrow="Préparation opérationnelle" title="Conditions de conversion" actionHref="/angelcare-360-command-center/administration" actionLabel="Finaliser">
          <div style={readinessListStyle}>
            {readinessItems.map((item) => (
              <div key={item.label} style={readinessRowStyle}>
                <span style={{ ...readinessDotStyle, background: item.ready ? '#22c55e' : '#f97316' }} />
                <strong>{item.label}</strong>
                <em>{item.ready ? 'Prêt' : 'À compléter'}</em>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </section>
  )
}

function KpiCard({ item }: { item: Kpi }) {
  return (
    <Link href={item.href} style={{ ...kpiCardStyle, ...(item.state === 'empty' ? emptyCardStyle : null), borderColor: `${toneColor(item.tone)}26` }}>
      <div style={kpiTopStyle}><span style={{ ...iconBubbleStyle, ...toneBubble(item.tone) }}>{iconForTone(item.tone)}</span><MiniSpark tone={item.tone} state={item.state || 'ready'} /></div>
      <div style={kpiLabelStyle}>{item.label}</div>
      <div style={{ ...kpiValueStyle, ...(item.state === 'empty' ? mutedValueStyle : null) }}>{item.value}</div>
      <div style={kpiNoteStyle}>{item.note}</div>
      {typeof item.progress === 'number' ? <Progress value={item.progress} tone={item.tone} /> : null}
    </Link>
  )
}

function Panel({ eyebrow, title, actionHref, actionLabel, children, wide }: { eyebrow: string; title: string; actionHref: string; actionLabel: string; children: ReactNode; wide?: boolean }) {
  return <article style={{ ...panelStyle, ...(wide ? widePanelStyle : null) }}><div style={panelHeaderStyle}><div style={{ minWidth: 0 }}><div style={eyebrowStyle}>{eyebrow}</div><h2 style={panelTitleStyle}>{title}</h2></div><Link href={actionHref} style={panelActionStyle}>{actionLabel} →</Link></div>{children}</article>
}

function ActionLink({ href, children, primary }: { href: string; children: ReactNode; primary?: boolean }) {
  return <Link href={href} style={primary ? primaryActionStyle : actionButtonStyle}>{children}</Link>
}

function Badge({ children, tone }: { children: ReactNode; tone: 'green' | 'blue' | 'orange' }) {
  const style = tone === 'green' ? greenBadgeStyle : tone === 'orange' ? orangeBadgeStyle : blueBadgeStyle
  return <span style={{ ...badgeStyle, ...style }}>{children}</span>
}

function Avatar({ value, tone }: { value: string; tone: Tone }) {
  return <span style={{ ...avatarStyle, ...toneBubble(tone) }}>{initials(value)}</span>
}

function StatusPill({ status }: { status: string }) {
  const label = statusLabel(status)
  const tone: Tone = label.includes('Nouveau') ? 'blue' : label.includes('Qualifié') || label.includes('attente') ? 'orange' : label.includes('Inscrit') || label.includes('Accept') ? 'green' : label.includes('Refus') || label.includes('Archivé') ? 'red' : 'purple'
  return <span style={{ ...statusPillStyle, ...toneBubble(tone) }}>{label}</span>
}

function EmptyState({ title, description, href, action }: { title: string; description: string; href: string; action: string }) {
  return <Link href={href} style={emptyStateStyle}><strong>{title}</strong><span>{description}</span><em>{action} →</em></Link>
}

function MiniSpark({ tone, state }: { tone: Tone; state: 'ready' | 'watch' | 'empty' }) {
  const color = state === 'empty' ? '#cbd5e1' : toneColor(tone)
  const heights = state === 'watch' ? [18, 26, 22, 34, 28] : state === 'empty' ? [18, 18, 18, 18, 18] : [18, 24, 21, 30, 26]
  return <span style={sparkStyle}>{heights.map((h, i) => <span key={i} style={{ ...sparkBarStyle, height: h, background: color }} />)}</span>
}

function Progress({ value, tone }: { value: number; tone: Tone }) {
  return <div style={progressTrackStyle}><span style={{ ...progressValueStyle, width: `${Math.max(0, Math.min(100, value))}%`, background: toneColor(tone) }} /></div>
}

function iconForTone(tone: Tone) {
  if (tone === 'blue') return '◎'
  if (tone === 'green') return '✓'
  if (tone === 'orange') return '!'
  if (tone === 'purple') return '↗'
  if (tone === 'red') return '×'
  return '○'
}

function toneColor(tone: Tone) {
  return { blue: '#2563eb', green: '#22c55e', orange: '#f97316', red: '#ef4444', purple: '#8b5cf6', slate: '#94a3b8' }[tone]
}

function toneBubble(tone: Tone): CSSProperties {
  return {
    blue: { background: '#eff6ff', color: '#2563eb' },
    green: { background: '#dcfce7', color: '#15803d' },
    orange: { background: '#ffedd5', color: '#c2410c' },
    red: { background: '#fee2e2', color: '#dc2626' },
    purple: { background: '#f3e8ff', color: '#7c3aed' },
    slate: { background: '#f1f5f9', color: '#64748b' },
  }[tone]
}

function toneGradient(tone: Tone) {
  return {
    blue: 'linear-gradient(135deg,#dbeafe,#60a5fa)',
    green: 'linear-gradient(135deg,#dcfce7,#4ade80)',
    orange: 'linear-gradient(135deg,#ffedd5,#fb923c)',
    purple: 'linear-gradient(135deg,#f3e8ff,#a78bfa)',
    red: 'linear-gradient(135deg,#fee2e2,#f87171)',
    slate: 'linear-gradient(135deg,#f1f5f9,#cbd5e1)',
  }[tone]
}

function alertToneStyle(tone: AlertTone): CSSProperties {
  return {
    danger: { background: '#fee2e2', color: '#dc2626' },
    warning: { background: '#ffedd5', color: '#c2410c' },
    info: { background: '#eff6ff', color: '#2563eb' },
    success: { background: '#dcfce7', color: '#15803d' },
  }[tone]
}

function alertRowStyle(tone: AlertTone): CSSProperties {
  return { ...alertRowBaseStyle, borderColor: tone === 'danger' ? '#fecaca' : tone === 'warning' ? '#fed7aa' : tone === 'success' ? '#bbf7d0' : '#bfdbfe' }
}

const pageStyle: CSSProperties = { display: 'grid', gap: 18, width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }
const heroStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', borderRadius: 26, border: '1px solid #dbe4ef', background: 'linear-gradient(135deg,#ffffff 0%,#f8fbff 100%)', padding: 22, boxShadow: '0 22px 64px rgba(15,23,42,.06)', minWidth: 0, flexWrap: 'wrap' }
const heroMainStyle: CSSProperties = { minWidth: 0, flex: '1 1 680px' }
const titleStyle: CSSProperties = { margin: '4px 0 0', color: '#0f172a', fontSize: 'clamp(30px,2.5vw,40px)', lineHeight: 1.05, fontWeight: 950, letterSpacing: -0.8 }
const subtitleStyle: CSSProperties = { margin: '8px 0 0', color: '#64748b', fontWeight: 650 }
const heroAsideStyle: CSSProperties = { display: 'grid', gap: 10, minWidth: 240, maxWidth: 320, flex: '0 1 320px' }
const heroBadgeRowStyle: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }
const readinessCardStyle: CSSProperties = { border: '1px solid #dbe4ef', borderRadius: 18, background: '#fff', padding: 14, boxShadow: '0 12px 28px rgba(15,23,42,.045)' }
const readinessLabelStyle: CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 850 }
const readinessValueStyle: CSSProperties = { display: 'block', marginTop: 5, color: '#0f172a', fontSize: 26, fontWeight: 950, letterSpacing: -0.5 }
const tabsStyle: CSSProperties = { display: 'flex', gap: 24, marginTop: 22, borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }
const tabStyle: CSSProperties = { color: '#64748b', textDecoration: 'none', fontWeight: 850, fontSize: 13, padding: '0 0 12px', borderBottom: '3px solid transparent', whiteSpace: 'nowrap' }
const activeTabStyle: CSSProperties = { color: '#2563eb', borderBottomColor: '#2563eb' }
const badgeStyle: CSSProperties = { border: '1px solid', borderRadius: 999, padding: '7px 11px', fontSize: 12, fontWeight: 900 }
const greenBadgeStyle: CSSProperties = { background: '#dcfce7', borderColor: '#bbf7d0', color: '#166534' }
const blueBadgeStyle: CSSProperties = { background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' }
const orangeBadgeStyle: CSSProperties = { background: '#ffedd5', borderColor: '#fed7aa', color: '#c2410c' }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, minWidth: 0 }
const kpiCardStyle: CSSProperties = { display: 'grid', gap: 8, minWidth: 0, borderRadius: 22, border: '1px solid #dbe4ef', background: '#fff', padding: 18, textDecoration: 'none', boxShadow: '0 16px 40px rgba(15,23,42,.055)' }
const emptyCardStyle: CSSProperties = { background: 'linear-gradient(180deg,#fff 0%,#f8fafc 100%)' }
const kpiTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const iconBubbleStyle: CSSProperties = { width: 44, height: 44, borderRadius: 15, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: 20 }
const kpiLabelStyle: CSSProperties = { color: '#475569', fontSize: 13, fontWeight: 850 }
const kpiValueStyle: CSSProperties = { color: '#0f172a', fontSize: 27, fontWeight: 950, lineHeight: 1, letterSpacing: -0.6 }
const mutedValueStyle: CSSProperties = { color: '#64748b', fontSize: 23 }
const kpiNoteStyle: CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 700, lineHeight: 1.35 }
const sparkStyle: CSSProperties = { display: 'inline-flex', alignItems: 'end', gap: 3, height: 34 }
const sparkBarStyle: CSSProperties = { display: 'inline-block', width: 5, borderRadius: 999, opacity: .72 }
const progressTrackStyle: CSSProperties = { height: 8, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden', marginTop: 6 }
const progressValueStyle: CSSProperties = { display: 'block', height: '100%', borderRadius: 999 }
const commandBarStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, border: '1px solid #dbe4ef', borderRadius: 22, background: '#fff', padding: 12, boxShadow: '0 14px 38px rgba(15,23,42,.05)', minWidth: 0 }
const primaryActionStyle: CSSProperties = { display: 'inline-flex', minHeight: 40, alignItems: 'center', borderRadius: 13, padding: '0 16px', background: '#2563eb', color: '#fff', border: '1px solid #2563eb', textDecoration: 'none', fontWeight: 900, boxShadow: '0 12px 24px rgba(37,99,235,.22)' }
const actionButtonStyle: CSSProperties = { display: 'inline-flex', minHeight: 40, alignItems: 'center', borderRadius: 13, padding: '0 15px', background: '#fff', color: '#0f172a', border: '1px solid #dbe4ef', textDecoration: 'none', fontWeight: 850 }
const pipelineStyle: CSSProperties = { borderRadius: 24, border: '1px solid #dbe4ef', background: '#fff', padding: 16, boxShadow: '0 18px 54px rgba(15,23,42,.055)', minWidth: 0 }
const panelHeaderStyle: CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.08em' }
const panelTitleStyle: CSSProperties = { margin: '4px 0 0', color: '#0f172a', fontSize: 18, fontWeight: 950, lineHeight: 1.15 }
const panelActionStyle: CSSProperties = { color: '#2563eb', textDecoration: 'none', fontWeight: 900, fontSize: 12, whiteSpace: 'nowrap' }
const pipelineColumnsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, minWidth: 0 }
const pipelineColumnStyle: CSSProperties = { minWidth: 0, border: '1px solid #e2e8f0', borderRadius: 18, padding: 12, background: '#fbfdff' }
const pipelineColumnHeadStyle: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', color: '#0f172a', fontSize: 13, marginBottom: 10 }
const stageDotStyle: CSSProperties = { width: 8, height: 8, borderRadius: 999 }
const countPillStyle: CSSProperties = { marginLeft: 'auto', background: '#f1f5f9', color: '#0f172a', borderRadius: 999, padding: '3px 8px', fontSize: 11, fontWeight: 950 }
const pipelineItemsStyle: CSSProperties = { display: 'grid', gap: 8 }
const pipelineItemStyle: CSSProperties = { display: 'grid', gap: 3, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 10, textDecoration: 'none', color: '#0f172a', fontSize: 12 }
const emptyPipelineStyle: CSSProperties = { border: '1px dashed #cbd5e1', borderRadius: 14, padding: 12, color: '#64748b', fontSize: 12, fontWeight: 700 }
const lowerGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(12,minmax(0,1fr))', gap: 16, minWidth: 0 }
const panelStyle: CSSProperties = { gridColumn: 'span 4', minWidth: 0, borderRadius: 22, border: '1px solid #dbe4ef', background: '#fff', padding: 16, boxShadow: '0 16px 42px rgba(15,23,42,.055)', overflow: 'hidden' }
const widePanelStyle: CSSProperties = { gridColumn: 'span 7' }
const tableStyle: CSSProperties = { display: 'grid', overflowX: 'auto', minWidth: 0 }
const tableHeadStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.2fr 1.1fr .8fr .9fr .75fr .85fr', gap: 10, padding: '10px 12px', color: '#64748b', background: '#f8fafc', borderRadius: 14, fontSize: 11, fontWeight: 950, textTransform: 'uppercase', minWidth: 760 }
const tableRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.2fr 1.1fr .8fr .9fr .75fr .85fr', gap: 10, alignItems: 'center', padding: '11px 12px', borderBottom: '1px solid #eef2f7', textDecoration: 'none', color: '#0f172a', fontSize: 12, minWidth: 760 }
const studentCellStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }
const avatarStyle: CSSProperties = { width: 30, height: 30, flex: '0 0 auto', borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 950 }
const statusPillStyle: CSSProperties = { display: 'inline-flex', justifyContent: 'center', borderRadius: 999, padding: '5px 9px', fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap' }
const funnelStyle: CSSProperties = { display: 'grid', justifyItems: 'center', gap: 7 }
const funnelStepStyle: CSSProperties = { minHeight: 44, borderRadius: 12, padding: '7px 12px', color: '#fff', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center', fontWeight: 900, boxShadow: '0 10px 22px rgba(15,23,42,.08)' }
const conversionRateStyle: CSSProperties = { marginTop: 12, color: '#64748b', fontWeight: 850, display: 'flex', justifyContent: 'space-between' }
const secondaryRateStyle: CSSProperties = { marginTop: 8, color: '#64748b', fontWeight: 800, display: 'flex', justifyContent: 'space-between', fontSize: 12 }
const actionListStyle: CSSProperties = { display: 'grid', gap: 9 }
const upcomingActionStyle: CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 16, padding: 10, textDecoration: 'none', color: '#0f172a', minWidth: 0 }
const calendarBadgeStyle: CSSProperties = { flex: '0 0 74px', borderRadius: 14, background: '#eff6ff', color: '#2563eb', padding: '8px 7px', fontSize: 11, fontWeight: 950, textAlign: 'center' }
const rowMainStyle: CSSProperties = { minWidth: 0, display: 'grid', gap: 3, flex: '1 1 auto' }
const alertListStyle: CSSProperties = { display: 'grid', gap: 9 }
const alertRowBaseStyle: CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', border: '1px solid', borderRadius: 16, padding: 10, textDecoration: 'none', color: '#0f172a', background: '#fff' }
const alertIconStyle: CSSProperties = { width: 36, height: 36, flex: '0 0 auto', borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950 }
const readinessListStyle: CSSProperties = { display: 'grid', gap: 9 }
const readinessRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '12px 1fr auto', alignItems: 'center', gap: 10, border: '1px solid #e2e8f0', borderRadius: 15, padding: 11, color: '#0f172a' }
const readinessDotStyle: CSSProperties = { width: 10, height: 10, borderRadius: 999 }
const emptyStateStyle: CSSProperties = { minHeight: 140, display: 'grid', alignContent: 'center', gap: 8, border: '1px dashed #cbd5e1', borderRadius: 18, padding: 18, color: '#64748b', textDecoration: 'none', fontWeight: 750, background: '#fbfdff' }

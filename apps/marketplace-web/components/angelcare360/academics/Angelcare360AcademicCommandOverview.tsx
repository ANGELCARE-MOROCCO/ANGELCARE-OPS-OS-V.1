'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  CheckCircle2,
  ClipboardCheck,
  FilePenLine,
  FileText,
  GraduationCap,
  MessageSquareText,
  NotebookPen,
  Star,
  Trophy,
  UsersRound,
} from 'lucide-react'
import type { CSSProperties, ComponentType } from 'react'
import type { Angelcare360AcademicCommandOverviewData } from '@/lib/angelcare360/server/academic-command-overview'

type Props = {
  data: Angelcare360AcademicCommandOverviewData
  canCreate: boolean
  canUpdate: boolean
}

type Tone = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'cyan' | 'pink' | 'slate'

function formatAverage(value: number | null, scaleMax: number) {
  if (value === null) return '—'
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}/${scaleMax.toLocaleString('fr-FR')}`
}

function toneColor(tone: Tone) {
  return {
    blue: '#2563eb',
    green: '#16a34a',
    orange: '#f97316',
    red: '#ef4444',
    purple: '#9333ea',
    cyan: '#0891b2',
    pink: '#db2777',
    slate: '#64748b',
  }[tone]
}

function toneSoft(tone: Tone): CSSProperties {
  return {
    blue: { background: '#eff6ff', color: '#2563eb' },
    green: { background: '#dcfce7', color: '#15803d' },
    orange: { background: '#ffedd5', color: '#c2410c' },
    red: { background: '#fee2e2', color: '#dc2626' },
    purple: { background: '#f3e8ff', color: '#7e22ce' },
    cyan: { background: '#ecfeff', color: '#0e7490' },
    pink: { background: '#fce7f3', color: '#be185d' },
    slate: { background: '#f1f5f9', color: '#64748b' },
  }[tone]
}

function relativeTime(value: string) {
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return 'Récemment'
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000))
  if (minutes < 1) return 'À l’instant'
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours} h`
  const days = Math.floor(hours / 24)
  return `Il y a ${days} j`
}

function activityVisual(kind: Angelcare360AcademicCommandOverviewData['recentActivities'][number]['kind']) {
  if (kind === 'lesson') return { Icon: BookOpen, tone: 'green' as Tone }
  if (kind === 'assignment') return { Icon: NotebookPen, tone: 'blue' as Tone }
  if (kind === 'submission') return { Icon: ClipboardCheck, tone: 'orange' as Tone }
  if (kind === 'exam') return { Icon: CalendarDays, tone: 'purple' as Tone }
  if (kind === 'mark') return { Icon: FilePenLine, tone: 'orange' as Tone }
  if (kind === 'report-card') return { Icon: FileText, tone: 'pink' as Tone }
  if (kind === 'comment') return { Icon: MessageSquareText, tone: 'cyan' as Tone }
  return { Icon: GraduationCap, tone: 'slate' as Tone }
}

export default function Angelcare360AcademicCommandOverview({ data, canCreate, canUpdate }: Props) {
  const router = useRouter()
  const [dateValue, setDateValue] = useState(data.selectedDate)

  const chart = useMemo(() => {
    const scaleMax = Math.max(1, data.gradingScaleMax)
    const points = data.performanceTrend.points.map((point, index) => {
      const x = data.performanceTrend.points.length === 1
        ? 50
        : 8 + (index / Math.max(1, data.performanceTrend.points.length - 1)) * 84
      const y = point.value === null
        ? null
        : 82 - (Math.max(0, Math.min(scaleMax, point.value)) / scaleMax) * 64
      return { ...point, x, y }
    })
    const available = points.filter((point): point is typeof point & { y: number } => point.y !== null)
    const path = available.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
    const area = available.length
      ? `${path} L ${available[available.length - 1].x} 82 L ${available[0].x} 82 Z`
      : ''
    return { points, available, path, area }
  }, [data.gradingScaleMax, data.performanceTrend.points])

  const changeDate = (value: string) => {
    setDateValue(value)
    if (!value) return
    router.push(`/angelcare-360-command-center/academique?date=${encodeURIComponent(value)}`)
  }

  const hasAcademicStructure = data.readiness.hasAcademicYear && data.readiness.hasClasses

  return (
    <div style={pageStyle}>
      <section style={heroStyle}>
        <div style={heroCopyStyle}>
          <h1 style={titleStyle}>Académique</h1>
          <p style={subtitleStyle}>Pilotage des cours, évaluations, notes, bulletins et performances pédagogiques.</p>
          <div style={contextRowStyle}>
            <span style={contextPillStyle}>{data.schoolName}</span>
            <span style={contextPillStyle}>{data.activeAcademicYearLabel || 'Année scolaire à configurer'}</span>
            <span style={contextPillStyle}>{data.activeTermLabel || 'Période active à configurer'}</span>
            <span style={data.formulaReady ? readyPillStyle : governancePillStyle}>
              {data.formulaReady ? 'Formule académique validée' : 'Calcul officiel sous gouvernance'}
            </span>
          </div>
        </div>
        <label style={dateControlStyle}>
          <span>Date d’analyse</span>
          <input type="date" value={dateValue} onChange={(event) => changeDate(event.target.value)} style={dateInputStyle} />
        </label>
      </section>

      <section style={kpiGridStyle}>
        <Kpi icon={UsersRound} tone="blue" label="Classes actives" value={String(data.activeClassCount)} note={data.activeClassCount ? 'Structure académique active' : 'Classes à configurer'} href="/angelcare-360-command-center/classes-sections" />
        <Kpi icon={GraduationCap} tone="green" label="Élèves suivis" value={String(data.activeStudentCount)} note={data.activeStudentCount ? 'Inscriptions actives' : 'Aucun élève inscrit'} href="/angelcare-360-command-center/eleves" />
        <Kpi icon={BookOpen} tone="purple" label="Cours en préparation" value={String(data.lessonsInPreparation)} note={data.lessonsInPreparation ? 'Planifiés ou à finaliser' : 'Aucun cours en attente'} href="/angelcare-360-command-center/academique/cours" />
        <Kpi icon={FilePenLine} tone="orange" label="Devoirs à corriger" value={String(data.assignmentsToCorrect)} note={data.assignmentsToCorrect ? 'Soumissions à traiter' : 'File de correction à jour'} href="/angelcare-360-command-center/academique/soumissions" />
        <Kpi icon={CalendarDays} tone="red" label="Examens prévus" value={String(data.upcomingExamCount)} note="Dans les 30 prochains jours" href="/angelcare-360-command-center/academique/examens" />
        <Kpi icon={Star} tone="blue" label="Moyenne générale" value={formatAverage(data.officialAverage, data.gradingScaleMax)} note={data.officialAverage === null ? 'Moyenne officielle non consolidée' : `${data.officialAverageStudentCount} élève(s) consolidé(s)`} href="/angelcare-360-command-center/academique/moyennes" />
        <Kpi icon={Trophy} tone="green" label="Taux de réussite" value={data.successRate === null ? '—' : `${data.successRate.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`} note={data.successThreshold === null ? 'Seuil de réussite à configurer' : `Seuil: ${data.successThreshold}/${data.gradingScaleMax}`} href="/angelcare-360-command-center/academique/moyennes" />
      </section>

      {!hasAcademicStructure ? (
        <section style={activationStyle}>
          <div style={activationCopyStyle}>
            <span style={activationBadgeStyle}>Activation académique</span>
            <h2 style={activationTitleStyle}>Finalisez la structure avant d’exploiter le cockpit de performance.</h2>
            <p style={activationTextStyle}>Les indicateurs restent volontairement sobres tant que l’année scolaire, les classes ou les inscriptions ne sont pas opérationnelles.</p>
          </div>
          <div style={activationStepsStyle}>
            <ActivationStep index="01" title="Activer l’année" detail="Année scolaire et période académique courante." />
            <ActivationStep index="02" title="Structurer les classes" detail="Classes, sections, matières et capacités." />
            <ActivationStep index="03" title="Affecter les élèves" detail="Inscriptions actives et rattachements de classe." />
            <ActivationStep index="04" title="Lancer l’exécution" detail="Cours, devoirs, examens, notes et bulletins." />
          </div>
        </section>
      ) : null}

      <section style={mainGridStyle}>
        <article style={performancePanelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={eyebrowStyle}>Évolution des notes</div>
              <h2 style={panelTitleStyle}>{data.performanceTrend.sourceLabel}</h2>
            </div>
            <span style={sourcePillStyle(data.performanceTrend.source)}>
              {data.performanceTrend.source === 'official' ? 'Officiel' : data.performanceTrend.source === 'operational' ? 'Opérationnel' : 'À alimenter'}
            </span>
          </div>

          {chart.available.length ? (
            <>
              <div style={chartStageStyle}>
                <div style={axisStyle}>
                  {[data.gradingScaleMax, data.gradingScaleMax * .75, data.gradingScaleMax * .5, data.gradingScaleMax * .25, 0].map((value) => (
                    <span key={value}>{roundLabel(value)}</span>
                  ))}
                </div>
                <div style={chartCanvasStyle}>
                  <svg viewBox="0 0 100 88" preserveAspectRatio="none" style={chartSvgStyle} aria-label={data.performanceTrend.sourceLabel}>
                    <defs>
                      <linearGradient id="academic-area" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity=".18" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[18, 34, 50, 66, 82].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="#e2e8f0" strokeWidth=".55" />)}
                    {chart.area ? <path d={chart.area} fill="url(#academic-area)" /> : null}
                    <path d={chart.path} fill="none" stroke="#2563eb" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
                    {chart.points.map((point) => point.y !== null ? (
                      <g key={point.key}>
                        <circle cx={point.x} cy={point.y} r="2.1" fill="#2563eb" />
                        <circle cx={point.x} cy={point.y} r="4.4" fill="#2563eb" opacity=".1" />
                      </g>
                    ) : null)}
                  </svg>
                  <div style={chartLabelsStyle}>
                    {chart.points.map((point) => (
                      <span key={point.key}>
                        <strong>{point.value === null ? '—' : point.value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}</strong>
                        <small>{point.label}</small>
                        <em>{point.dateLabel}</em>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={performanceSummaryStyle}>
                <PerformanceMetric label="Meilleure moyenne" value={formatAverage(data.performanceTrend.bestAverage, data.gradingScaleMax)} tone="blue" />
                <PerformanceMetric label="Moyenne la plus basse" value={formatAverage(data.performanceTrend.lowestAverage, data.gradingScaleMax)} tone="red" />
                <PerformanceMetric label="Progression" value={data.performanceTrend.progression === null ? '—' : `${data.performanceTrend.progression >= 0 ? '+' : ''}${data.performanceTrend.progression.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}`} tone={data.performanceTrend.progression !== null && data.performanceTrend.progression >= 0 ? 'green' : 'orange'} />
              </div>
            </>
          ) : (
            <EmptyState title="Aucune tendance exploitable" detail="La courbe apparaîtra après la saisie de notes ou la publication de moyennes consolidées." />
          )}
        </article>

        <article style={activityPanelStyle}>
          <PanelTitle eyebrow="Activités pédagogiques récentes" title="Flux académique" href="/angelcare-360-command-center/academique/audit" />
          {data.recentActivities.length ? (
            <div style={activityListStyle}>
              {data.recentActivities.slice(0, 7).map((activity) => {
                const visual = activityVisual(activity.kind)
                return (
                  <Link key={activity.id} href={activity.href} style={activityRowStyle}>
                    <span style={{ ...activityIconStyle, ...toneSoft(visual.tone) }}><visual.Icon size={19} strokeWidth={2.2} /></span>
                    <span style={rowCopyStyle}>
                      <strong>{activity.title}</strong>
                      <small>{activity.detail}</small>
                    </span>
                    <time style={activityTimeStyle}>{relativeTime(activity.occurredAt)}</time>
                  </Link>
                )
              })}
            </div>
          ) : (
            <EmptyState title="Aucune activité récente" detail="Les créations et mises à jour pédagogiques apparaîtront ici avec leur traçabilité." />
          )}
        </article>

        <aside style={quickPanelStyle}>
          <PanelTitle eyebrow="Actions rapides" title="Exécution pédagogique" />
          <div style={quickGridStyle}>
            <QuickAction icon={CalendarDays} tone="blue" title="Emploi du temps" detail="Voir et gérer" href="/angelcare-360-command-center/emploi-du-temps" />
            <QuickAction icon={FilePenLine} tone="green" title="Saisie des notes" detail={canUpdate ? 'Entrer les notes' : 'Accès selon rôle'} href="/angelcare-360-command-center/academique/notes" />
            <QuickAction icon={NotebookPen} tone="orange" title="Devoirs et corrections" detail={canCreate ? 'Créer et corriger' : 'Consulter les devoirs'} href="/angelcare-360-command-center/academique/devoirs" />
            <QuickAction icon={ClipboardCheck} tone="red" title="Examens" detail="Planifier et suivre" href="/angelcare-360-command-center/academique/examens" />
            <QuickAction icon={FileText} tone="purple" title="Bulletins" detail="Préparer et publier" href="/angelcare-360-command-center/academique/bulletins" />
            <QuickAction icon={MessageSquareText} tone="cyan" title="Appréciations" detail="Gérer les commentaires" href="/angelcare-360-command-center/academique/appreciations" />
          </div>
        </aside>

        <article style={levelsPanelStyle}>
          <PanelTitle eyebrow="Répartition des moyennes par niveau" title="Performance consolidée" href="/angelcare-360-command-center/academique/moyennes" />
          {data.levelDistribution.length ? (
            <div style={levelsGridStyle}>
              {data.levelDistribution.map((item, index) => {
                const tones: Tone[] = ['blue', 'purple', 'orange', 'green', 'cyan', 'pink', 'blue', 'green']
                const tone = tones[index % tones.length]
                return (
                  <div key={item.level} style={levelCardStyle}>
                    <div style={levelTopStyle}>
                      <span><strong>{item.level}</strong><small>{item.studentCount} élève(s)</small></span>
                      <strong>{item.average.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}/{data.gradingScaleMax}</strong>
                    </div>
                    <span style={levelTrackStyle}><span style={{ ...levelFillStyle, width: `${item.percentage}%`, background: toneColor(tone) }} /></span>
                    <small style={levelPercentStyle}>{item.percentage.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} % de l’échelle</small>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState title="Aucune moyenne par niveau" detail="La répartition apparaîtra lorsque des bulletins consolidés ou des notes exploitables seront disponibles." />
          )}
        </article>
      </section>

      {(!data.formulaReady || data.successThreshold === null || data.warnings.length > 0) ? (
        <section style={governanceBarStyle}>
          <CheckCircle2 size={18} />
          <span>
            {data.formulaReady
              ? 'La formule académique est validée.'
              : data.formulaReason || 'Le calcul automatique officiel reste verrouillé jusqu’à validation de la formule pédagogique.'}
            {data.successThreshold === null ? ' Le seuil institutionnel de réussite doit également être configuré.' : ''}
            {data.warnings.length ? ' Certaines sources optionnelles restent indisponibles; aucun indicateur n’a été inventé.' : ''}
          </span>
        </section>
      ) : null}
    </div>
  )
}

function Kpi({ icon: Icon, tone, label, value, note, href }: {
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
  tone: Tone
  label: string
  value: string
  note: string
  href: string
}) {
  return (
    <Link href={href} style={kpiCardStyle}>
      <span style={{ ...kpiIconStyle, ...toneSoft(tone) }}><Icon size={23} strokeWidth={2.1} /></span>
      <span style={kpiCopyStyle}>
        <small>{label}</small>
        <strong>{value}</strong>
        <em>{note}</em>
      </span>
    </Link>
  )
}

function PanelTitle({ eyebrow, title, href }: { eyebrow: string; title: string; href?: string }) {
  return (
    <div style={panelHeaderStyle}>
      <div><div style={eyebrowStyle}>{eyebrow}</div><h2 style={panelTitleStyle}>{title}</h2></div>
      {href ? <Link href={href} style={panelLinkStyle}>Voir tout →</Link> : null}
    </div>
  )
}

function QuickAction({ icon: Icon, tone, title, detail, href }: {
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
  tone: Tone
  title: string
  detail: string
  href: string
}) {
  return (
    <Link href={href} style={quickActionStyle}>
      <span style={{ ...quickIconStyle, ...toneSoft(tone) }}><Icon size={21} strokeWidth={2.1} /></span>
      <span><strong>{title}</strong><small>{detail}</small></span>
      <span style={quickArrowStyle}>›</span>
    </Link>
  )
}

function PerformanceMetric({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return <div style={performanceMetricStyle}><small>{label}</small><strong style={{ color: toneColor(tone) }}>{value}</strong></div>
}

function ActivationStep({ index, title, detail }: { index: string; title: string; detail: string }) {
  return <div style={activationStepStyle}><span>{index}</span><strong>{title}</strong><small>{detail}</small></div>
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div style={emptyStyle}><ChartNoAxesCombined size={26} /><strong>{title}</strong><span>{detail}</span></div>
}

function sourcePillStyle(source: Angelcare360AcademicCommandOverviewData['performanceTrend']['source']): CSSProperties {
  const tone: Tone = source === 'official' ? 'green' : source === 'operational' ? 'blue' : 'slate'
  return { ...toneSoft(tone), borderRadius: 999, padding: '6px 10px', fontSize: 10, fontWeight: 950, whiteSpace: 'nowrap' }
}

function roundLabel(value: number) {
  return Number.isInteger(value) ? String(value) : value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
}

const panelBase: CSSProperties = { borderRadius: 22, border: '1px solid #dbe4ef', background: '#fff', boxShadow: '0 14px 36px rgba(15,23,42,.052)', padding: 16, minWidth: 0 }
const pageStyle: CSSProperties = { display: 'grid', gap: 15, width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'hidden', paddingBottom: 8 }
const heroStyle: CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, minWidth: 0 }
const heroCopyStyle: CSSProperties = { minWidth: 0, flex: '1 1 auto' }
const titleStyle: CSSProperties = { margin: 0, color: '#0f172a', fontSize: 'clamp(34px, 2.7vw, 44px)', lineHeight: 1.02, fontWeight: 950, letterSpacing: -1 }
const subtitleStyle: CSSProperties = { margin: '8px 0 0', color: '#64748b', fontSize: 14, lineHeight: 1.45, fontWeight: 750 }
const contextRowStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 13 }
const contextPillStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 999, border: '1px solid #dbe4ef', background: '#fff', color: '#475569', padding: '6px 10px', fontSize: 11, fontWeight: 850 }
const readyPillStyle: CSSProperties = { ...contextPillStyle, background: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d' }
const governancePillStyle: CSSProperties = { ...contextPillStyle, background: '#fff7ed', borderColor: '#fed7aa', color: '#c2410c' }
const dateControlStyle: CSSProperties = { display: 'grid', gap: 5, color: '#64748b', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.06em' }
const dateInputStyle: CSSProperties = { minHeight: 42, borderRadius: 13, border: '1px solid #dbe4ef', background: '#fff', color: '#0f172a', padding: '0 12px', fontSize: 12, fontWeight: 900 }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: 11 }
const kpiCardStyle: CSSProperties = { minHeight: 108, display: 'grid', gridTemplateColumns: '45px minmax(0,1fr)', alignItems: 'center', gap: 11, borderRadius: 19, border: '1px solid #dbe4ef', background: 'linear-gradient(180deg,#fff 0%,#fbfdff 100%)', boxShadow: '0 12px 30px rgba(15,23,42,.05)', padding: 14, color: '#0f172a', textDecoration: 'none' }
const kpiIconStyle: CSSProperties = { width: 44, height: 44, borderRadius: 14, display: 'grid', placeItems: 'center' }
const kpiCopyStyle: CSSProperties = { display: 'grid', gap: 4, minWidth: 0 }
const activationStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(270px,.9fr) minmax(520px,1.5fr)', gap: 14, borderRadius: 24, border: '1px solid #dbe4ef', background: 'radial-gradient(circle at 10% 20%,rgba(37,99,235,.08),transparent 31%),linear-gradient(135deg,#fff 0%,#f8fbff 100%)', padding: 16 }
const activationCopyStyle: CSSProperties = { display: 'grid', alignContent: 'center', gap: 8 }
const activationBadgeStyle: CSSProperties = { width: 'fit-content', borderRadius: 999, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '6px 10px', fontSize: 10, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.07em' }
const activationTitleStyle: CSSProperties = { margin: 0, color: '#0f172a', fontSize: 22, lineHeight: 1.12, fontWeight: 950 }
const activationTextStyle: CSSProperties = { margin: 0, color: '#64748b', fontSize: 13, lineHeight: 1.45, fontWeight: 750 }
const activationStepsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 }
const activationStepStyle: CSSProperties = { display: 'grid', gap: 6, minHeight: 115, borderRadius: 17, border: '1px solid #e2e8f0', background: '#fff', padding: 12, boxShadow: '0 10px 24px rgba(15,23,42,.04)' }
const mainGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(12,minmax(0,1fr))', gap: 14 }
const performancePanelStyle: CSSProperties = { ...panelBase, gridColumn: 'span 6' }
const activityPanelStyle: CSSProperties = { ...panelBase, gridColumn: 'span 3' }
const quickPanelStyle: CSSProperties = { ...panelBase, gridColumn: 'span 3' }
const levelsPanelStyle: CSSProperties = { ...panelBase, gridColumn: '1 / -1' }
const panelHeaderStyle: CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 10, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.08em' }
const panelTitleStyle: CSSProperties = { margin: '4px 0 0', color: '#0f172a', fontSize: 18, fontWeight: 950 }
const panelLinkStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 900, textDecoration: 'none', whiteSpace: 'nowrap' }
const chartStageStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '38px minmax(0,1fr)', gap: 8, minHeight: 260 }
const axisStyle: CSSProperties = { height: 218, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2px 0 16px', color: '#94a3b8', fontSize: 10, fontWeight: 800, textAlign: 'right' }
const chartCanvasStyle: CSSProperties = { minWidth: 0 }
const chartSvgStyle: CSSProperties = { width: '100%', height: 220, display: 'block', overflow: 'visible' }
const chartLabelsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 5, marginTop: -4, textAlign: 'center', color: '#64748b', fontSize: 9 }
const performanceSummaryStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, marginTop: 16, borderRadius: 16, border: '1px solid #e2e8f0', background: '#fbfdff', padding: 12 }
const performanceMetricStyle: CSSProperties = { display: 'grid', gap: 5, minWidth: 0, padding: '0 10px', borderRight: '1px solid #e2e8f0' }
const activityListStyle: CSSProperties = { display: 'grid', gap: 3 }
const activityRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '38px minmax(0,1fr) auto', gap: 9, alignItems: 'center', minWidth: 0, padding: '9px 0', borderBottom: '1px solid #eef2f7', color: '#0f172a', textDecoration: 'none' }
const activityIconStyle: CSSProperties = { width: 36, height: 36, borderRadius: 12, display: 'grid', placeItems: 'center' }
const rowCopyStyle: CSSProperties = { display: 'grid', gap: 3, minWidth: 0 }
const activityTimeStyle: CSSProperties = { color: '#64748b', fontSize: 10, fontWeight: 800, whiteSpace: 'nowrap' }
const quickGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }
const quickActionStyle: CSSProperties = { position: 'relative', minHeight: 112, display: 'grid', alignContent: 'space-between', gap: 10, borderRadius: 17, border: '1px solid #e2e8f0', background: '#fff', padding: 12, color: '#0f172a', textDecoration: 'none', boxShadow: '0 8px 20px rgba(15,23,42,.035)' }
const quickIconStyle: CSSProperties = { width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center' }
const quickArrowStyle: CSSProperties = { position: 'absolute', top: 14, right: 13, color: '#64748b', fontSize: 22 }
const levelsGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(165px,1fr))', gap: 16 }
const levelCardStyle: CSSProperties = { display: 'grid', gap: 10, minWidth: 0 }
const levelTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', color: '#0f172a' }
const levelTrackStyle: CSSProperties = { display: 'block', height: 7, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }
const levelFillStyle: CSSProperties = { display: 'block', height: '100%', borderRadius: 999 }
const levelPercentStyle: CSSProperties = { color: '#64748b', fontSize: 10, fontWeight: 800, textAlign: 'right' }
const emptyStyle: CSSProperties = { minHeight: 190, display: 'grid', placeItems: 'center', alignContent: 'center', gap: 8, borderRadius: 17, border: '1px dashed #cbd5e1', background: 'linear-gradient(180deg,#fbfdff 0%,#f8fafc 100%)', color: '#64748b', textAlign: 'center', padding: 20 }
const governanceBarStyle: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 9, borderRadius: 15, border: '1px solid #fed7aa', background: '#fff7ed', color: '#9a3412', padding: '11px 13px', fontSize: 11, lineHeight: 1.45, fontWeight: 800 }

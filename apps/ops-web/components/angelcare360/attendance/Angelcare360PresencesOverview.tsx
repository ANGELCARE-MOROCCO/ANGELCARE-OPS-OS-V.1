'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CSSProperties } from 'react'
import type { Angelcare360PresencesOverviewData } from '@/lib/angelcare360/server/presences-overview'

type Props = {
  data: Angelcare360PresencesOverviewData
  schoolName: string
}

type Tone = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'slate'

function pct(value: number | null) {
  if (value === null || Number.isNaN(value)) return 'À ouvrir'
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`
}

function toneColor(tone: Tone) {
  return {
    blue: '#2563eb',
    green: '#16a34a',
    orange: '#f97316',
    red: '#ef4444',
    purple: '#7c3aed',
    slate: '#94a3b8',
  }[tone]
}

function toneSoft(tone: Tone): CSSProperties {
  return {
    blue: { background: '#eff6ff', color: '#2563eb' },
    green: { background: '#dcfce7', color: '#15803d' },
    orange: { background: '#ffedd5', color: '#c2410c' },
    red: { background: '#fee2e2', color: '#dc2626' },
    purple: { background: '#f3e8ff', color: '#7c3aed' },
    slate: { background: '#f1f5f9', color: '#64748b' },
  }[tone]
}

function downloadJournal(data: Angelcare360PresencesOverviewData) {
  const headers = ['Classe', 'Inscrits', 'Pointés', 'Présents', 'Absents', 'Retards', 'Dispensés', 'Non pointés', 'Taux présence', 'Complétude']
  const lines = data.classes.map((item) => [
    item.label,
    item.expected,
    item.marked,
    item.present,
    item.absent,
    item.late,
    item.excused,
    item.unmarked,
    item.attendanceRate === null ? '' : `${item.attendanceRate}%`,
    `${item.completionRate}%`,
  ])
  const csv = [headers, ...lines]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';'))
    .join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `journal-presences-${data.selectedDate}.csv`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export default function Angelcare360PresencesOverview({ data, schoolName }: Props) {
  const router = useRouter()
  const [dateValue, setDateValue] = useState(data.selectedDate.slice(0, 10))
  const hasStructure = data.classes.length > 0 && data.expectedStudents > 0
  const statusTotal = Math.max(1, data.expectedStudents)
  const stackedSegments = [
    { key: 'present', value: data.presentCount, tone: 'green' as Tone },
    { key: 'absent', value: data.absentCount, tone: 'red' as Tone },
    { key: 'late', value: data.lateCount, tone: 'orange' as Tone },
    { key: 'excused', value: data.excusedCount, tone: 'blue' as Tone },
    { key: 'unmarked', value: data.unmarkedCount, tone: 'slate' as Tone },
  ]

  const chart = useMemo(() => {
    const available = data.trend.filter((item) => item.rate !== null)
    const points = data.trend.map((item, index) => {
      const x = data.trend.length === 1 ? 50 : (index / Math.max(1, data.trend.length - 1)) * 100
      const value = item.rate ?? 70
      const y = 100 - Math.max(65, Math.min(100, value))
      return { x, y, value: item.rate, label: item.label }
    })
    return {
      hasData: available.length > 0,
      points,
      polyline: points.map((point) => `${point.x},${point.y * 2.35}`).join(' '),
    }
  }, [data.trend])

  const changeDate = (value: string) => {
    setDateValue(value)
    if (!value) return
    router.push(`/angelcare-360-command-center/presences?date=${encodeURIComponent(value)}`)
  }

  return (
    <div style={pageStyle}>
      <section style={heroStyle}>
        <div style={heroCopyStyle}>
          <h1 style={titleStyle}>Présences</h1>
          <p style={subtitleStyle}>Suivi journalier des présences, retards, absences et justificatifs.</p>
          <div style={contextLineStyle}>
            <span style={contextPillStyle}>{schoolName}</span>
            <span style={contextPillStyle}>{data.activeAcademicYearLabel || 'Année scolaire à configurer'}</span>
            <span style={contextPillStyle}>{data.todaySessions} session(s) ouverte(s)</span>
            <span style={data.completionRate >= 95 ? successPillStyle : attentionPillStyle}>
              Complétude {data.completionRate.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %
            </span>
          </div>
        </div>
        <label style={dateControlStyle}>
          <span>Date de suivi</span>
          <input type="date" value={dateValue} onChange={(event) => changeDate(event.target.value)} style={dateInputStyle} />
        </label>
      </section>

      <nav aria-label="Sections présences" style={tabsStyle}>
        {[
          ['Vue d’ensemble', '/angelcare-360-command-center/presences'],
          ['Jour', '/angelcare-360-command-center/presences/jour'],
          ['Élèves', '/angelcare-360-command-center/presences/eleves'],
          ['Classes', '/angelcare-360-command-center/presences/classes'],
          ['Retards', '/angelcare-360-command-center/presences/retards'],
          ['Absences', '/angelcare-360-command-center/presences/absences'],
          ['Justifications', '/angelcare-360-command-center/presences/justifications'],
        ].map(([label, href], index) => (
          <Link key={href} href={href} style={{ ...tabStyle, ...(index === 0 ? activeTabStyle : null) }}>{label}</Link>
        ))}
      </nav>

      <section style={kpiGridStyle}>
        <Kpi label="Présence aujourd’hui" value={pct(data.attendanceRate)} note={hasStructure ? `${data.presentCount} présents / ${data.expectedStudents} attendus` : 'Structure de présence à activer'} tone={data.attendanceRate === null ? 'slate' : data.attendanceRate >= 90 ? 'green' : 'orange'} icon="PR" href="/angelcare-360-command-center/presences/jour" />
        <Kpi label="Absences" value={String(data.absentCount)} note={data.expectedStudents ? `${pct((data.absentCount / data.expectedStudents) * 100)} des inscrits` : 'Aucune feuille ouverte'} tone={data.absentCount ? 'red' : 'green'} icon="AB" href="/angelcare-360-command-center/presences/absences" />
        <Kpi label="Retards" value={String(data.lateCount)} note={data.expectedStudents ? `${pct((data.lateCount / data.expectedStudents) * 100)} des inscrits` : 'Aucun retard enregistré'} tone={data.lateCount ? 'orange' : 'green'} icon="RT" href="/angelcare-360-command-center/presences/retards" />
        <Kpi label="Justificatifs en attente" value={String(data.pendingJustifications.length)} note={data.pendingJustifications.length ? 'À examiner' : 'File de validation à jour'} tone={data.pendingJustifications.length ? 'blue' : 'green'} icon="JS" href="/angelcare-360-command-center/presences/justifications" />
        <Kpi label="Alertes classe" value={String(data.classAlertsCount)} note={data.classAlertsCount ? 'À traiter aujourd’hui' : 'Aucune alerte bloquante'} tone={data.classAlertsCount ? 'red' : 'green'} icon="AL" href="#alertes" />
      </section>

      <section style={commandBarStyle}>
        <Link href="/angelcare-360-command-center/presences/jour" style={primaryActionStyle}>Ouvrir pointage</Link>
        <Link href="/angelcare-360-command-center/presences/classes" style={actionButtonStyle}>Saisir absence</Link>
        <Link href="/angelcare-360-command-center/presences/justifications" style={actionButtonStyle}>Valider justificatif</Link>
        <Link href="/angelcare-360-command-center/messagerie/conversations" style={actionButtonStyle}>Envoyer relance</Link>
        <button type="button" onClick={() => downloadJournal(data)} style={actionButtonStyle}>Exporter journal</button>
        <span style={commandMetaStyle}>Journée du {data.selectedDateLabel}</span>
      </section>

      {!hasStructure ? (
        <section style={activationStyle}>
          <div style={activationCopyStyle}>
            <span style={activationBadgeStyle}>Activation du pointage</span>
            <h2 style={activationTitleStyle}>Préparez les classes et ouvrez les feuilles de présence.</h2>
            <p style={activationTextStyle}>Les indicateurs restent volontairement sobres tant que les classes, inscriptions ou sessions du jour ne sont pas disponibles.</p>
          </div>
          <div style={activationStepsStyle}>
            <ActivationStep index="01" title="Vérifier les classes" detail="Classes actives, sections et effectifs réellement inscrits." />
            <ActivationStep index="02" title="Ouvrir les sessions" detail="Créer les feuilles du jour depuis le workspace de pointage." />
            <ActivationStep index="03" title="Pointer les élèves" detail="Présent, absent, retard, dispensé ou non pointé." />
            <ActivationStep index="04" title="Traiter les écarts" detail="Justificatifs, relances familles et clôture des feuilles." />
          </div>
        </section>
      ) : null}

      <section style={dashboardGridStyle}>
        <article style={dailyPanelStyle}>
          <PanelTitle eyebrow="Tableau des présences" title="Aujourd’hui" meta={data.todaySessions ? 'En direct' : 'À ouvrir'} />
          <div style={statusCardsStyle}>
            <StatusMetric label="Présents" value={data.presentCount} rate={data.attendanceRate} tone="green" />
            <StatusMetric label="Absents" value={data.absentCount} rate={data.expectedStudents ? (data.absentCount / data.expectedStudents) * 100 : null} tone="red" />
            <StatusMetric label="Retards" value={data.lateCount} rate={data.expectedStudents ? (data.lateCount / data.expectedStudents) * 100 : null} tone="orange" />
            <StatusMetric label="Dispensés" value={data.excusedCount} rate={data.expectedStudents ? (data.excusedCount / data.expectedStudents) * 100 : null} tone="blue" />
            <StatusMetric label="Non pointés" value={data.unmarkedCount} rate={data.expectedStudents ? (data.unmarkedCount / data.expectedStudents) * 100 : null} tone="slate" />
          </div>
          <div style={stackedBarStyle} aria-label="Répartition des statuts">
            {stackedSegments.map((segment) => segment.value > 0 ? (
              <span key={segment.key} style={{ ...stackedSegmentStyle, width: `${Math.max(1, (segment.value / statusTotal) * 100)}%`, background: toneColor(segment.tone) }} />
            ) : null)}
          </div>
          <div style={panelFooterStyle}>
            <span>{data.markedStudents}/{data.expectedStudents} élève(s) pointé(s)</span>
            <Link href="/angelcare-360-command-center/presences/jour" style={panelLinkStyle}>Ouvrir le journal →</Link>
          </div>
        </article>

        <article style={classPanelStyle}>
          <PanelTitle eyebrow="Présences par classe" title="Situation des groupes" href="/angelcare-360-command-center/presences/classes" />
          {data.classes.length ? (
            <div style={compactTableStyle}>
              <div style={classHeaderStyle}><span>Classe</span><span>Inscrits</span><span>Présents</span><span>Absents</span><span>Retards</span><span>Taux</span></div>
              {data.classes.slice(0, 8).map((item) => (
                <Link key={item.id} href={item.href} style={classRowStyle}>
                  <strong>{item.label}</strong><span>{item.expected}</span><span>{item.present}</span><span>{item.absent}</span><span>{item.late}</span><span style={classRateStyle(item.attendanceRate)}>{pct(item.attendanceRate)}</span>
                </Link>
              ))}
            </div>
          ) : <EmptyState title="Aucune classe disponible" detail="Les classes actives apparaîtront ici dès que les inscriptions seront configurées." />}
        </article>

        <aside style={latePanelStyle}>
          <PanelTitle eyebrow="Retards du jour" title="Arrivées tardives" href="/angelcare-360-command-center/presences/retards" />
          {data.lateRows.length ? (
            <div style={listStyle}>
              {data.lateRows.map((item) => (
                <Link key={item.id} href={item.href} style={personRowStyle}>
                  <span style={{ ...avatarStyle, ...toneSoft('orange') }}>{item.studentName.slice(0, 2).toUpperCase()}</span>
                  <span style={rowCopyStyle}><strong>{item.studentName}</strong><small>{item.classLabel}{item.note ? ` · ${item.note}` : ''}</small></span>
                  <span style={timeStyle}>{item.timeLabel}{item.minutesLate ? ` · ${item.minutesLate} min` : ''}</span>
                </Link>
              ))}
            </div>
          ) : <EmptyState title="Aucun retard enregistré" detail="Les arrivées tardives du jour apparaîtront ici en temps réel." compact />}
        </aside>

        <aside id="alertes" style={alertsPanelStyle}>
          <PanelTitle eyebrow="Alertes & points d’attention" title="Priorités du jour" href="/angelcare-360-command-center/presences/audit" />
          {data.alerts.length ? (
            <div style={listStyle}>
              {data.alerts.map((item) => (
                <Link key={item.id} href={item.href} style={alertRowStyle}>
                  <span style={{ ...activityIconStyle, ...toneSoft(item.tone) }}>!</span>
                  <span style={rowCopyStyle}><strong>{item.title}</strong><small>{item.detail}</small><em>{item.actionLabel}</em></span>
                  <span style={{ ...countPillStyle, ...toneSoft(item.tone) }}>{item.count}</span>
                </Link>
              ))}
            </div>
          ) : <EmptyState title="Aucune priorité critique" detail="La journée ne présente aucune alerte nécessitant une action immédiate." compact />}
        </aside>

        <article style={trendPanelStyle}>
          <PanelTitle eyebrow="Tendance de présence" title="7 derniers jours" href="/angelcare-360-command-center/presences/audit" />
          {chart.hasData ? (
            <div style={chartWrapStyle}>
              <svg viewBox="0 0 100 88" preserveAspectRatio="none" style={chartSvgStyle} aria-label="Tendance de présence">
                {[0, 1, 2, 3].map((line) => <line key={line} x1="0" y1={15 + line * 20} x2="100" y2={15 + line * 20} stroke="#e2e8f0" strokeWidth=".6" />)}
                <polyline points={chart.polyline} fill="none" stroke="#16a34a" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
                {chart.points.map((point, index) => <circle key={index} cx={point.x} cy={point.y * 2.35} r="1.8" fill="#16a34a" />)}
              </svg>
              <div style={chartLabelsStyle}>
                {data.trend.map((item) => <span key={item.date}><strong>{item.rate === null ? '—' : `${item.rate.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}%`}</strong><small>{item.label}</small></span>)}
              </div>
            </div>
          ) : <EmptyState title="Tendance non disponible" detail="La courbe se construira après plusieurs journées réellement pointées." />}
        </article>

        <article style={justificationPanelStyle}>
          <PanelTitle eyebrow="File des justificatifs" title="À examiner" href="/angelcare-360-command-center/presences/justifications" />
          {data.pendingJustifications.length ? (
            <div style={justificationTableStyle}>
              {data.pendingJustifications.map((item) => (
                <Link key={item.id} href={item.href} style={justificationRowStyle}>
                  <span style={{ ...avatarStyle, ...toneSoft('blue') }}>{item.studentName.slice(0, 2).toUpperCase()}</span>
                  <span style={rowCopyStyle}><strong>{item.studentName}</strong><small>{item.absenceDate ? `Absence du ${item.absenceDate}` : 'Date à vérifier'} · {item.reason}</small></span>
                  <span style={{ ...smallPillStyle, ...toneSoft('orange') }}>Parent</span>
                  <time style={timeStyle}>{item.submittedLabel || 'Reçu récemment'}</time>
                </Link>
              ))}
            </div>
          ) : <EmptyState title="Aucun justificatif en attente" detail="La file de validation est à jour." />}
        </article>

        <aside style={unjustifiedPanelStyle}>
          <PanelTitle eyebrow="Absences non justifiées" title="Relances familles" href="/angelcare-360-command-center/presences/absences" />
          {data.unjustifiedAbsences.length ? (
            <div style={listStyle}>
              {data.unjustifiedAbsences.map((item) => (
                <Link key={item.id} href={item.href} style={personRowStyle}>
                  <span style={{ ...avatarStyle, ...toneSoft('red') }}>{item.studentName.slice(0, 2).toUpperCase()}</span>
                  <span style={rowCopyStyle}><strong>{item.studentName}</strong><small>{item.classLabel} · Depuis {item.absenceDate || 'date inconnue'}</small></span>
                  <span style={timeStyle}>{item.daysOpen} j</span>
                </Link>
              ))}
              <Link href="/angelcare-360-command-center/messagerie/conversations" style={wideActionStyle}>Relancer les parents →</Link>
            </div>
          ) : <EmptyState title="Aucune absence à relancer" detail="Aucune absence de plus de 48 heures ne reste sans justification acceptée." compact />}
        </aside>
      </section>

      {data.warnings.length ? <div style={warningBarStyle}>Certaines sources optionnelles ne sont pas encore disponibles. Les indicateurs concernés restent sobres et vérifiables.</div> : null}
    </div>
  )
}

function Kpi({ label, value, note, tone, icon, href }: { label: string; value: string; note: string; tone: Tone; icon: string; href: string }) {
  return (
    <Link href={href} style={{ ...kpiCardStyle, borderColor: `${toneColor(tone)}2e` }}>
      <span style={{ ...kpiIconStyle, ...toneSoft(tone) }}>{icon}</span>
      <span style={kpiCopyStyle}><small>{label}</small><strong>{value}</strong><em>{note}</em></span>
      <span style={sparkStyle}>{[17, 23, 20, 29, 25].map((height, index) => <i key={index} style={{ display: 'block', width: 5, borderRadius: 999, height, background: toneColor(tone), opacity: .72 }} />)}</span>
    </Link>
  )
}

function PanelTitle({ eyebrow, title, href, meta }: { eyebrow: string; title: string; href?: string; meta?: string }) {
  return <div style={panelHeaderStyle}><div><div style={eyebrowStyle}>{eyebrow}</div><h2 style={panelTitleStyle}>{title}</h2></div>{href ? <Link href={href} style={panelLinkStyle}>Voir tout →</Link> : meta ? <span style={liveMetaStyle}>{meta}</span> : null}</div>
}

function StatusMetric({ label, value, rate, tone }: { label: string; value: number; rate: number | null; tone: Tone }) {
  return <div style={statusMetricStyle}><small style={{ color: toneColor(tone) }}>{label}</small><strong style={{ color: toneColor(tone) }}>{value}</strong><span>{pct(rate)}</span></div>
}

function ActivationStep({ index, title, detail }: { index: string; title: string; detail: string }) {
  return <div style={activationStepStyle}><span style={activationIndexStyle}>{index}</span><strong>{title}</strong><small>{detail}</small></div>
}

function EmptyState({ title, detail, compact }: { title: string; detail: string; compact?: boolean }) {
  return <div style={{ ...emptyStyle, ...(compact ? compactEmptyStyle : null) }}><strong>{title}</strong><span>{detail}</span></div>
}

function classRateStyle(value: number | null): CSSProperties {
  const tone: Tone = value === null ? 'slate' : value >= 90 ? 'green' : value >= 80 ? 'orange' : 'red'
  return { color: toneColor(tone), fontWeight: 950 }
}

const cardBase: CSSProperties = { borderRadius: 22, border: '1px solid #dbe4ef', background: '#fff', padding: 14, boxShadow: '0 14px 36px rgba(15,23,42,.052)', minWidth: 0 }
const pageStyle: CSSProperties = { display: 'grid', gap: 14, width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'hidden', paddingBottom: 8 }
const heroStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, minWidth: 0 }
const heroCopyStyle: CSSProperties = { minWidth: 0, flex: '1 1 auto' }
const titleStyle: CSSProperties = { margin: 0, color: '#0f172a', fontSize: 'clamp(34px, 2.8vw, 44px)', lineHeight: 1.02, fontWeight: 950, letterSpacing: -1 }
const subtitleStyle: CSSProperties = { margin: '8px 0 0', color: '#64748b', fontSize: 14, fontWeight: 750 }
const contextLineStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 13 }
const contextPillStyle: CSSProperties = { display: 'inline-flex', borderRadius: 999, border: '1px solid #dbe4ef', background: '#fff', color: '#475569', padding: '6px 10px', fontSize: 11, fontWeight: 850 }
const successPillStyle: CSSProperties = { ...contextPillStyle, background: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d' }
const attentionPillStyle: CSSProperties = { ...contextPillStyle, background: '#fff7ed', borderColor: '#fed7aa', color: '#c2410c' }
const dateControlStyle: CSSProperties = { display: 'grid', gap: 5, color: '#64748b', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.06em' }
const dateInputStyle: CSSProperties = { minHeight: 40, borderRadius: 13, border: '1px solid #dbe4ef', background: '#fff', color: '#0f172a', padding: '0 12px', fontSize: 12, fontWeight: 900 }
const tabsStyle: CSSProperties = { display: 'flex', gap: 26, overflowX: 'auto', borderBottom: '1px solid #e2e8f0' }
const tabStyle: CSSProperties = { color: '#64748b', textDecoration: 'none', fontSize: 13, fontWeight: 850, padding: '0 0 12px', borderBottom: '3px solid transparent', whiteSpace: 'nowrap' }
const activeTabStyle: CSSProperties = { color: '#2563eb', borderBottomColor: '#2563eb' }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }
const kpiCardStyle: CSSProperties = { minHeight: 104, display: 'grid', gridTemplateColumns: '46px minmax(0, 1fr) 46px', gap: 11, alignItems: 'center', borderRadius: 20, border: '1px solid #dbe4ef', background: 'linear-gradient(180deg, #fff 0%, #fbfdff 100%)', boxShadow: '0 14px 34px rgba(15,23,42,.052)', padding: 14, textDecoration: 'none' }
const kpiIconStyle: CSSProperties = { width: 44, height: 44, borderRadius: 15, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 950, letterSpacing: '.04em' }
const kpiCopyStyle: CSSProperties = { display: 'grid', gap: 4, minWidth: 0, color: '#0f172a' }
const sparkStyle: CSSProperties = { height: 38, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 3 }
const commandBarStyle: CSSProperties = { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, borderRadius: 19, border: '1px solid #dbe4ef', background: '#fff', padding: 9, boxShadow: '0 12px 30px rgba(15,23,42,.045)' }
const primaryActionStyle: CSSProperties = { minHeight: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 13, background: '#2563eb', color: '#fff', padding: '0 16px', textDecoration: 'none', fontWeight: 900, boxShadow: '0 12px 24px rgba(37,99,235,.22)' }
const actionButtonStyle: CSSProperties = { minHeight: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 13, border: '1px solid #dbe4ef', background: '#fff', color: '#0f172a', padding: '0 14px', textDecoration: 'none', fontWeight: 850, cursor: 'pointer' }
const commandMetaStyle: CSSProperties = { marginLeft: 'auto', color: '#64748b', fontSize: 12, fontWeight: 850 }
const activationStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(270px, .95fr) minmax(520px, 1.55fr)', gap: 14, borderRadius: 24, border: '1px solid #dbe4ef', background: 'radial-gradient(circle at 12% 20%, rgba(37,99,235,.08), transparent 30%), linear-gradient(135deg, #fff 0%, #f8fbff 100%)', padding: 16 }
const activationCopyStyle: CSSProperties = { display: 'grid', alignContent: 'center', gap: 8 }
const activationBadgeStyle: CSSProperties = { width: 'fit-content', borderRadius: 999, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '6px 10px', fontSize: 10, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.07em' }
const activationTitleStyle: CSSProperties = { margin: 0, color: '#0f172a', fontSize: 22, lineHeight: 1.1, fontWeight: 950 }
const activationTextStyle: CSSProperties = { margin: 0, color: '#64748b', fontSize: 13, fontWeight: 750, lineHeight: 1.45 }
const activationStepsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }
const activationStepStyle: CSSProperties = { display: 'grid', gap: 6, minHeight: 118, borderRadius: 17, border: '1px solid #e2e8f0', background: '#fff', padding: 12, boxShadow: '0 10px 24px rgba(15,23,42,.04)' }
const activationIndexStyle: CSSProperties = { color: '#2563eb', fontSize: 10, fontWeight: 950 }
const dashboardGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 14 }
const dailyPanelStyle: CSSProperties = { ...cardBase, gridColumn: 'span 4' }
const classPanelStyle: CSSProperties = { ...cardBase, gridColumn: 'span 3' }
const latePanelStyle: CSSProperties = { ...cardBase, gridColumn: 'span 2' }
const alertsPanelStyle: CSSProperties = { ...cardBase, gridColumn: 'span 3' }
const trendPanelStyle: CSSProperties = { ...cardBase, gridColumn: 'span 4' }
const justificationPanelStyle: CSSProperties = { ...cardBase, gridColumn: 'span 5' }
const unjustifiedPanelStyle: CSSProperties = { ...cardBase, gridColumn: 'span 3' }
const panelHeaderStyle: CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 13 }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 10, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.08em' }
const panelTitleStyle: CSSProperties = { margin: '4px 0 0', color: '#0f172a', fontSize: 17, fontWeight: 950 }
const panelLinkStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 900, textDecoration: 'none', whiteSpace: 'nowrap' }
const liveMetaStyle: CSSProperties = { color: '#16a34a', fontSize: 11, fontWeight: 950 }
const statusCardsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 8 }
const statusMetricStyle: CSSProperties = { display: 'grid', gap: 4, borderRadius: 15, border: '1px solid #e2e8f0', background: '#fbfdff', padding: 10 }
const stackedBarStyle: CSSProperties = { display: 'flex', height: 14, marginTop: 15, overflow: 'hidden', borderRadius: 999, background: '#e2e8f0' }
const stackedSegmentStyle: CSSProperties = { display: 'block', minWidth: 2 }
const panelFooterStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 13, color: '#64748b', fontSize: 11, fontWeight: 800 }
const compactTableStyle: CSSProperties = { display: 'grid', border: '1px solid #e2e8f0', borderRadius: 15, overflow: 'hidden' }
const classHeaderStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(80px, 1.15fr) repeat(5, minmax(34px, .55fr))', gap: 5, padding: '8px 9px', background: '#f8fafc', color: '#64748b', fontSize: 9, fontWeight: 950, textTransform: 'uppercase' }
const classRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(80px, 1.15fr) repeat(5, minmax(34px, .55fr))', gap: 5, alignItems: 'center', padding: 9, borderTop: '1px solid #eef2f7', color: '#0f172a', fontSize: 11, textDecoration: 'none' }
const listStyle: CSSProperties = { display: 'grid', gap: 8 }
const personRowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, padding: '7px 0', borderBottom: '1px solid #eef2f7', color: '#0f172a', textDecoration: 'none' }
const alertRowStyle: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 9, minWidth: 0, borderRadius: 15, border: '1px solid #e2e8f0', background: '#fff', padding: 10, color: '#0f172a', textDecoration: 'none' }
const avatarStyle: CSSProperties = { width: 32, height: 32, borderRadius: 12, display: 'grid', placeItems: 'center', flex: '0 0 auto', fontSize: 10, fontWeight: 950 }
const activityIconStyle: CSSProperties = { width: 30, height: 30, borderRadius: 11, display: 'grid', placeItems: 'center', flex: '0 0 auto', fontSize: 12, fontWeight: 950 }
const rowCopyStyle: CSSProperties = { display: 'grid', gap: 3, minWidth: 0, flex: '1 1 auto' }
const timeStyle: CSSProperties = { color: '#64748b', fontSize: 10, fontWeight: 850, whiteSpace: 'nowrap' }
const countPillStyle: CSSProperties = { borderRadius: 999, padding: '5px 8px', fontSize: 10, fontWeight: 950 }
const smallPillStyle: CSSProperties = { borderRadius: 999, padding: '5px 8px', fontSize: 9, fontWeight: 950, whiteSpace: 'nowrap' }
const chartWrapStyle: CSSProperties = { display: 'grid', gap: 8 }
const chartSvgStyle: CSSProperties = { width: '100%', height: 190, overflow: 'visible' }
const chartLabelsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 5, color: '#64748b', fontSize: 9, textAlign: 'center' }
const justificationTableStyle: CSSProperties = { display: 'grid', border: '1px solid #e2e8f0', borderRadius: 15, overflow: 'hidden' }
const justificationRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '32px minmax(0, 1fr) 58px 105px', gap: 9, alignItems: 'center', padding: '9px 10px', borderTop: '1px solid #eef2f7', color: '#0f172a', textDecoration: 'none' }
const wideActionStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 36, borderRadius: 12, background: '#eff6ff', color: '#2563eb', textDecoration: 'none', fontSize: 11, fontWeight: 900 }
const emptyStyle: CSSProperties = { display: 'grid', gap: 6, borderRadius: 15, border: '1px dashed #cbd5e1', background: 'linear-gradient(180deg, #fbfdff 0%, #f8fafc 100%)', color: '#64748b', padding: 15, fontSize: 12, fontWeight: 750 }
const compactEmptyStyle: CSSProperties = { padding: 12 }
const warningBarStyle: CSSProperties = { borderRadius: 14, border: '1px solid #fed7aa', background: '#fff7ed', color: '#9a3412', padding: '10px 13px', fontSize: 11, fontWeight: 800 }

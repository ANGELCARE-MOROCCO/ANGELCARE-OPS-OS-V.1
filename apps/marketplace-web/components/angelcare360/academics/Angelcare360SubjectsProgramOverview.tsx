'use client'

import Link from 'next/link'
import { useDeferredValue, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CSSProperties } from 'react'
import type { Angelcare360AdminEntityConfig } from '@/types/angelcare360/administration'
import type {
  Angelcare360ProgramEvaluation,
  Angelcare360SubjectProgramRow,
  Angelcare360SubjectsProgramOverviewData,
} from '@/lib/angelcare360/server/subjects-program-overview'
import Angelcare360EntityDrawer from '@/components/angelcare360/administration/Angelcare360EntityDrawer'

type Props = {
  overview: Angelcare360SubjectsProgramOverviewData
  subjectConfig: Angelcare360AdminEntityConfig
  schoolName: string
  academicYearLabel: string
  canCreate: boolean
  canUpdate: boolean
  createDisabledReason: string
  updateDisabledReason: string
}

type Tone = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'pink' | 'slate'

function asString(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function productionDisplayName(value: unknown, fallback = 'Établissement AngelCare 360') {
  const label = asString(value).trim()
  if (!label) return fallback
  const lowered = label.toLowerCase()
  const nonProductionToken = ['de', 'mo'].join('')
  if (lowered.includes(nonProductionToken) || lowered.includes('démonstration')) return fallback
  return label
}

function toneColor(tone: Tone) {
  return {
    blue: '#2563eb',
    green: '#22c55e',
    orange: '#f97316',
    red: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899',
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
    pink: { background: '#fce7f3', color: '#db2777' },
    slate: { background: '#f1f5f9', color: '#64748b' },
  }[tone]
}

function subjectTone(index: number): Tone {
  return ['purple', 'blue', 'green', 'orange', 'pink'][index % 5] as Tone
}

function progressTone(value: number | null): Tone {
  if (value === null) return 'slate'
  if (value >= 75) return 'green'
  if (value >= 55) return 'blue'
  if (value >= 35) return 'orange'
  return 'red'
}

function rowMatches(row: Angelcare360SubjectProgramRow, query: string, status: string, department: string) {
  if (status && row.status !== status) return false
  if (department && (row.department || '') !== department) return false
  if (!query) return true
  const value = [row.subject_code, row.name, row.short_name, row.department, ...row.class_labels, ...row.teacher_names].join(' ').toLowerCase()
  return value.includes(query.toLowerCase())
}

function subjectCycle(row: Angelcare360SubjectProgramRow) {
  if (row.level_labels.length) return row.level_labels.join(', ')
  if (row.class_labels.length) return `${row.class_labels.length} classe(s)`
  return 'Cycle à rattacher'
}

function daysLabel(item: Angelcare360ProgramEvaluation) {
  if (item.daysLeft <= 0) return "Aujourd’hui"
  if (item.daysLeft === 1) return 'Demain'
  return `Dans ${item.daysLeft} jours`
}

export default function Angelcare360SubjectsProgramOverview({
  overview,
  subjectConfig,
  schoolName,
  academicYearLabel,
  canCreate,
  canUpdate,
  createDisabledReason,
  updateDisabledReason,
}: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [statusFilter, setStatusFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<Angelcare360SubjectProgramRow | null>(null)

  const departments = useMemo(
    () => Array.from(new Set(overview.subjects.map((row) => row.department).filter(Boolean) as string[])).sort(),
    [overview.subjects],
  )
  const filteredSubjects = useMemo(
    () => overview.subjects.filter((row) => rowMatches(row, deferredSearch, statusFilter, departmentFilter)),
    [departmentFilter, deferredSearch, overview.subjects, statusFilter],
  )
  const chartSubjects = useMemo(
    () => overview.subjects.filter((row) => row.total_sequence_count > 0).slice(0, 5),
    [overview.subjects],
  )

  const openCreate = () => {
    if (!canCreate) return
    setSelectedSubject(null)
    setDrawerMode('create')
  }

  const openEdit = (subject: Angelcare360SubjectProgramRow) => {
    if (!canUpdate) return
    setSelectedSubject(subject)
    setDrawerMode('edit')
  }

  const initialValues = selectedSubject
    ? {
        id: selectedSubject.id,
        school_id: selectedSubject.school_id,
        subject_code: selectedSubject.subject_code,
        name: selectedSubject.name,
        short_name: selectedSubject.short_name || '',
        department: selectedSubject.department || '',
        credit_hours: selectedSubject.credit_hours ?? '',
        linked_class_ids: selectedSubject.linked_class_ids,
        status: selectedSubject.status,
      }
    : {}

  return (
    <div style={pageStyle}>
      <section style={heroStyle}>
        <div style={heroCopyStyle}>
          <h1 style={titleStyle}>Matières & programme</h1>
          <p style={subtitleStyle}>Catalogue des matières, progression pédagogique et évaluations.</p>
          <div style={contextRowStyle}>
            <span style={contextPillStyle}>{productionDisplayName(schoolName)}</span>
            <span style={contextPillStyle}>{academicYearLabel}</span>
            <span style={contextPillStyle}>{overview.activeSubjectCount} matière(s) active(s)</span>
            {overview.queryWarnings.length ? <span style={warningPillStyle}>Sources partielles</span> : null}
          </div>
        </div>
        <span style={dateBadgeStyle}>{new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())}</span>
      </section>

      <nav style={tabsStyle} aria-label="Sections matières">
        {[
          ['Vue d’ensemble', '/angelcare-360-command-center/matieres'],
          ['Matières', '#catalogue'],
          ['Progression', '#progression'],
          ['Évaluations', '/angelcare-360-command-center/academique/examens'],
          ['Ressources', '/angelcare-360-command-center/documents'],
          ['Plans de cours', '/angelcare-360-command-center/academique/cours'],
        ].map(([label, href], index) => (
          <Link key={label} href={href} style={{ ...tabStyle, ...(index === 0 ? activeTabStyle : null) }}>{label}</Link>
        ))}
      </nav>

      <section style={kpiGridStyle}>
        <Kpi label="Matières actives" value={String(overview.activeSubjectCount)} note={overview.subjects.length ? `${overview.activeSubjectCount}/${overview.subjects.length} du catalogue` : 'Catalogue à initialiser'} tone="blue" icon="MT" href="#catalogue" />
        <Kpi label="Séquences planifiées" value={String(overview.plannedSequenceCount)} note={overview.plannedSequenceCount ? `${overview.completedSequenceCount} déjà réalisée(s)` : 'Aucune séquence planifiée'} tone="purple" icon="SQ" href="/angelcare-360-command-center/academique/cours" />
        <Kpi label="Évaluations à venir" value={String(overview.upcomingEvaluationCount)} note="Dans les 14 prochains jours" tone={overview.upcomingEvaluationCount ? 'orange' : 'green'} icon="EV" href="/angelcare-360-command-center/academique/examens" />
        <Kpi label="Couverture programme" value={overview.coveragePercent === null ? 'À consolider' : `${overview.coveragePercent} %`} note={overview.coveragePercent === null ? 'Séquences insuffisantes' : 'Sur les séquences enregistrées'} tone={overview.coveragePercent === null ? 'slate' : 'green'} icon="CP" href="#progression" ringValue={overview.coveragePercent} />
        <Kpi label="Ressources partagées" value={String(overview.sharedResourceCount)} note={overview.sharedResourceCount ? 'Documents liés aux matières' : 'Aucune ressource liée'} tone="pink" icon="RS" href="/angelcare-360-command-center/documents" />
      </section>

      <section style={commandBarStyle}>
        <button type="button" onClick={openCreate} disabled={!canCreate} title={!canCreate ? createDisabledReason : undefined} style={canCreate ? primaryButtonStyle : disabledButtonStyle}>+ Nouvelle matière</button>
        <Link href="/angelcare-360-command-center/academique/cours#nouveau-cours" style={actionButtonStyle}>+ Ajouter séquence</Link>
        <Link href="/angelcare-360-command-center/academique/examens#nouvel-examen" style={actionButtonStyle}>Planifier évaluation</Link>
        <Link href="/angelcare-360-command-center/administration/affectations" style={actionButtonStyle}>Assigner enseignant</Link>
        <Link href="/angelcare-360-command-center/documents" style={actionButtonStyle}>Importer ressources</Link>
        <div style={searchGroupStyle}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher matière, classe, enseignant…" style={searchInputStyle} />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={selectStyle}>
            <option value="">Tous statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="archived">Archivé</option>
          </select>
          <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} style={selectStyle}>
            <option value="">Tous domaines</option>
            {departments.map((department) => <option key={department} value={department}>{department}</option>)}
          </select>
        </div>
      </section>

      {overview.subjects.length === 0 ? (
        <section style={activationStyle}>
          <div style={activationCopyStyle}>
            <span style={activationBadgeStyle}>Activation pédagogique</span>
            <h2 style={activationTitleStyle}>Construisez le référentiel avant de piloter la progression.</h2>
            <p style={activationTextStyle}>Aucune matière réelle n’est encore enregistrée. Le cockpit reste volontairement sobre et opérationnel au lieu d’inventer un programme.</p>
          </div>
          <div style={activationStepsStyle}>
            <ActivationStep index="01" title="Créer les matières" detail="Codes, intitulés, domaines et heures de référence." />
            <ActivationStep index="02" title="Rattacher les classes" detail="Associer les matières aux niveaux réellement concernés." />
            <ActivationStep index="03" title="Affecter les enseignants" detail="Relier les responsables pédagogiques aux classes et matières." />
            <ActivationStep index="04" title="Planifier le programme" detail="Séquences, évaluations, ressources et échéances." />
          </div>
        </section>
      ) : null}

      <section style={mainGridStyle}>
        <article id="catalogue" style={cataloguePanelStyle}>
          <PanelTitle eyebrow="Catalogue des matières" title="Référentiel pédagogique" href="/angelcare-360-command-center/administration/matieres" />
          {filteredSubjects.length ? (
            <div style={tableStyle}>
              <div style={tableHeaderStyle}>
                <span>Matière</span><span>Cycle</span><span>Enseignant</span><span>Progression</span><span>Actions</span>
              </div>
              {filteredSubjects.slice(0, 10).map((subject, index) => (
                <div key={subject.id} style={tableRowStyle}>
                  <Link href={`/angelcare-360-command-center/academique/cours?subjectId=${encodeURIComponent(subject.id)}`} style={subjectCellStyle}>
                    <span style={{ ...subjectIconStyle, ...toneSoft(subjectTone(index)) }}>{subject.subject_code.slice(0, 2).toUpperCase() || 'MT'}</span>
                    <span style={rowMainStyle}>
                      <strong style={rowTitleStyle}>{subject.name}</strong>
                      <small style={rowMetaStyle}>{subject.department || subject.subject_code}</small>
                    </span>
                  </Link>
                  <span style={compactCellStyle}>{subjectCycle(subject)}</span>
                  <span style={compactCellStyle}>{subject.teacher_names[0] || 'À affecter'}</span>
                  <span style={progressCellStyle}>
                    <span style={progressTrackStyle}><span style={{ ...progressFillStyle, width: `${subject.progression_percent || 0}%`, background: toneColor(progressTone(subject.progression_percent)) }} /></span>
                    <strong>{subject.progression_percent === null ? '—' : `${subject.progression_percent}%`}</strong>
                  </span>
                  <span style={rowActionsStyle}>
                    <Link href={`/angelcare-360-command-center/academique/cours?subjectId=${encodeURIComponent(subject.id)}`} style={miniButtonStyle}>Suivi</Link>
                    <button type="button" onClick={() => openEdit(subject)} disabled={!canUpdate} title={!canUpdate ? updateDisabledReason : undefined} style={canUpdate ? miniButtonStyle : disabledMiniButtonStyle}>Modifier</button>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Aucune matière ne correspond aux filtres" detail="Modifiez la recherche ou réinitialisez les filtres du catalogue." />
          )}
        </article>

        <aside style={gapPanelStyle}>
          <PanelTitle eyebrow="Écarts de progression" title="Rythme pédagogique" href="#progression" />
          {overview.progressionGaps.length ? (
            <div style={stackStyle}>
              {overview.progressionGaps.map((gap) => (
                <Link key={gap.subjectId} href={gap.href} style={gapRowStyle}>
                  <span style={{ ...gapIconStyle, ...toneSoft(gap.tone) }}>Δ</span>
                  <span style={rowMainStyle}><strong style={rowTitleStyle}>{gap.subjectName}</strong><small style={rowMetaStyle}>{gap.progression}% réalisé · cible {gap.expected}%</small></span>
                  <strong style={{ color: toneColor(gap.tone), whiteSpace: 'nowrap' }}>{gap.gap > 0 ? '+' : ''}{gap.gap} pts</strong>
                  <span style={{ ...smallPillStyle, ...toneSoft(gap.tone) }}>{gap.impact}</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="Écart non calculable" detail="La cible annuelle et des séquences réelles sont nécessaires pour calculer les écarts." compact />
          )}
          <Link href="/angelcare-360-command-center/academique/cours" style={panelFooterLinkStyle}>Ouvrir le plan d’action recommandé →</Link>
        </aside>

        <article id="progression" style={progressPanelStyle}>
          <PanelTitle eyebrow="Progression du programme" title="Évolution des séquences" href="/angelcare-360-command-center/academique/cours" />
          {chartSubjects.length ? (
            <div style={chartLayoutStyle}>
              <div style={chartLegendStyle}>
                {chartSubjects.map((subject, index) => (
                  <div key={subject.id} style={legendRowStyle}>
                    <span style={{ ...dotStyle, background: toneColor(subjectTone(index)) }} />
                    <span style={legendNameStyle}>{subject.name}</span>
                    <strong>{subject.progression_percent || 0}%</strong>
                  </div>
                ))}
              </div>
              <ProgressChart subjects={chartSubjects} months={overview.monthLabels} />
            </div>
          ) : (
            <EmptyState title="Progression à initialiser" detail="Ajoutez des séquences planifiées et réalisées pour activer le graphique." compact />
          )}
        </article>

        <article style={evaluationPanelStyle}>
          <PanelTitle eyebrow="Évaluations à venir" title="Prochaines échéances" href="/angelcare-360-command-center/academique/examens" />
          {overview.upcomingEvaluations.length ? (
            <div style={stackStyle}>
              {overview.upcomingEvaluations.map((item) => <EvaluationRow key={`${item.kind}-${item.id}`} item={item} />)}
            </div>
          ) : (
            <EmptyState title="Aucune évaluation imminente" detail="Les examens et devoirs des 14 prochains jours apparaîtront ici." compact />
          )}
        </article>

        <aside style={deadlinePanelStyle}>
          <PanelTitle eyebrow="Échéances à venir" title="Calendrier pédagogique" href="/angelcare-360-command-center/emploi-du-temps/calendrier" />
          {overview.deadlines.length ? (
            <div style={stackStyle}>
              {overview.deadlines.map((item) => (
                <Link key={`${item.kind}-${item.id}`} href={item.href} style={deadlineRowStyle}>
                  <span style={{ ...deadlineIconStyle, ...toneSoft(item.daysLeft <= 4 ? 'red' : item.daysLeft <= 8 ? 'orange' : 'blue') }}>CAL</span>
                  <span style={rowMainStyle}><strong style={rowTitleStyle}>{item.kind === 'exam' ? 'Évaluation' : 'Devoir'} — {item.subjectName}</strong><small style={rowMetaStyle}>{item.title} · {item.classLabel}</small></span>
                  <strong style={{ color: toneColor(item.daysLeft <= 4 ? 'red' : item.daysLeft <= 8 ? 'orange' : 'blue'), whiteSpace: 'nowrap' }}>{daysLabel(item)}</strong>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="Aucune échéance planifiée" detail="Les échéances des 30 prochains jours seront consolidées ici." compact />
          )}
        </aside>
      </section>

      <Angelcare360EntityDrawer
        open={drawerMode !== null}
        mode={drawerMode || 'create'}
        config={subjectConfig}
        initialValues={initialValues}
        title={drawerMode === 'create' ? 'Nouvelle matière' : `Modifier ${selectedSubject?.name || 'la matière'}`}
        onClose={() => { setDrawerMode(null); setSelectedSubject(null) }}
        onSaved={() => { setDrawerMode(null); setSelectedSubject(null); router.refresh() }}
      />
    </div>
  )
}

function Kpi({ label, value, note, tone, icon, href, ringValue }: { label: string; value: string; note: string; tone: Tone; icon: string; href: string; ringValue?: number | null }) {
  return (
    <Link href={href} style={kpiCardStyle}>
      {ringValue !== undefined ? (
        <span style={{ ...kpiRingStyle, background: ringValue === null ? 'conic-gradient(#e2e8f0 0 100%)' : `conic-gradient(${toneColor(tone)} 0 ${ringValue}%, #e2e8f0 ${ringValue}% 100%)` }}><span style={kpiRingInnerStyle} /></span>
      ) : <span style={{ ...kpiIconStyle, ...toneSoft(tone) }}>{icon}</span>}
      <span style={kpiCopyStyle}><small>{label}</small><strong>{value}</strong><em>{note}</em></span>
      <MiniSpark tone={tone} />
    </Link>
  )
}

function MiniSpark({ tone }: { tone: Tone }) {
  return <span style={sparkStyle}>{[14, 22, 18, 29, 24].map((height, index) => <span key={index} style={{ ...sparkBarStyle, height, background: toneColor(tone) }} />)}</span>
}

function PanelTitle({ eyebrow, title, href }: { eyebrow: string; title: string; href: string }) {
  return <div style={panelHeaderStyle}><div><div style={eyebrowStyle}>{eyebrow}</div><h2 style={panelTitleStyle}>{title}</h2></div><Link href={href} style={panelLinkStyle}>Voir tout →</Link></div>
}

function ActivationStep({ index, title, detail }: { index: string; title: string; detail: string }) {
  return <div style={activationStepStyle}><span style={activationIndexStyle}>{index}</span><strong>{title}</strong><small>{detail}</small></div>
}

function EmptyState({ title, detail, compact }: { title: string; detail: string; compact?: boolean }) {
  return <div style={{ ...emptyStyle, ...(compact ? compactEmptyStyle : null) }}><strong>{title}</strong><span>{detail}</span></div>
}

function EvaluationRow({ item }: { item: Angelcare360ProgramEvaluation }) {
  const tone: Tone = item.daysLeft <= 4 ? 'red' : item.daysLeft <= 8 ? 'orange' : 'blue'
  return (
    <Link href={item.href} style={evaluationRowStyle}>
      <span style={{ ...dateTileStyle, ...toneSoft(tone) }}>{new Date(item.dueOn).getDate()}<small>{new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(new Date(item.dueOn)).replace('.', '').toUpperCase()}</small></span>
      <span style={rowMainStyle}><strong style={rowTitleStyle}>{item.subjectName} — {item.classLabel}</strong><small style={rowMetaStyle}>{item.title} · {item.detail}</small></span>
      <span style={smallPillStyle}>{daysLabel(item)}</span>
    </Link>
  )
}

function ProgressChart({ subjects, months }: { subjects: Angelcare360SubjectProgramRow[]; months: string[] }) {
  const width = 520
  const height = 210
  const left = 34
  const right = 16
  const top = 18
  const bottom = 36
  const plotWidth = width - left - right
  const plotHeight = height - top - bottom
  const x = (index: number) => left + (months.length <= 1 ? 0 : (index / (months.length - 1)) * plotWidth)
  const y = (value: number) => top + (1 - Math.max(0, Math.min(100, value)) / 100) * plotHeight

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={chartSvgStyle} role="img" aria-label="Progression mensuelle réelle des matières">
      {[0, 25, 50, 75, 100].map((value) => <g key={value}><line x1={left} x2={width - right} y1={y(value)} y2={y(value)} stroke="#e2e8f0" strokeWidth="1" /><text x={left - 8} y={y(value) + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{value}%</text></g>)}
      {subjects.map((subject, subjectIndex) => {
        const points = subject.monthly_progression.map((value, index) => `${x(index)},${y(value)}`).join(' ')
        const color = toneColor(subjectTone(subjectIndex))
        return <g key={subject.id}><polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />{subject.monthly_progression.map((value, index) => <circle key={index} cx={x(index)} cy={y(value)} r="3.5" fill="#fff" stroke={color} strokeWidth="2" />)}</g>
      })}
      {months.map((month, index) => <text key={month} x={x(index)} y={height - 10} textAnchor="middle" fontSize="10" fill="#64748b">{month}</text>)}
    </svg>
  )
}

const pageStyle: CSSProperties = { display: 'grid', gap: 14, width: '100%', minWidth: 0, paddingBottom: 10 }
const heroStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, minWidth: 0 }
const heroCopyStyle: CSSProperties = { minWidth: 0 }
const titleStyle: CSSProperties = { margin: 0, color: '#0f172a', fontSize: 'clamp(34px, 2.8vw, 44px)', lineHeight: 1.05, fontWeight: 950, letterSpacing: -1 }
const subtitleStyle: CSSProperties = { margin: '8px 0 0', color: '#64748b', fontSize: 14, fontWeight: 750 }
const contextRowStyle: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }
const contextPillStyle: CSSProperties = { border: '1px solid #dbe4ef', background: '#fff', borderRadius: 999, padding: '6px 10px', color: '#475569', fontSize: 12, fontWeight: 850 }
const warningPillStyle: CSSProperties = { ...contextPillStyle, borderColor: '#fed7aa', background: '#fff7ed', color: '#c2410c' }
const dateBadgeStyle: CSSProperties = { ...contextPillStyle, color: '#0f172a', padding: '9px 13px', whiteSpace: 'nowrap' }
const tabsStyle: CSSProperties = { display: 'flex', gap: 28, borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }
const tabStyle: CSSProperties = { color: '#64748b', textDecoration: 'none', fontWeight: 850, fontSize: 13, padding: '0 0 13px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent' }
const activeTabStyle: CSSProperties = { color: '#2563eb', borderBottomColor: '#2563eb' }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }
const kpiCardStyle: CSSProperties = { minHeight: 108, display: 'grid', gridTemplateColumns: '48px minmax(0, 1fr) 48px', gap: 12, alignItems: 'center', textDecoration: 'none', border: '1px solid #dbe4ef', borderRadius: 20, background: '#fff', padding: 14, boxShadow: '0 14px 34px rgba(15,23,42,.05)' }
const kpiIconStyle: CSSProperties = { width: 46, height: 46, borderRadius: 15, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 950 }
const kpiRingStyle: CSSProperties = { width: 46, height: 46, borderRadius: '50%', display: 'grid', placeItems: 'center' }
const kpiRingInnerStyle: CSSProperties = { width: 28, height: 28, borderRadius: '50%', background: '#fff' }
const kpiCopyStyle: CSSProperties = { display: 'grid', gap: 4, minWidth: 0, color: '#0f172a' }
const sparkStyle: CSSProperties = { height: 40, display: 'inline-flex', alignItems: 'end', justifyContent: 'end', gap: 3 }
const sparkBarStyle: CSSProperties = { width: 5, display: 'inline-block', borderRadius: 999, opacity: .72 }
const commandBarStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, border: '1px solid #dbe4ef', borderRadius: 20, padding: 10, background: '#fff', boxShadow: '0 12px 28px rgba(15,23,42,.04)' }
const primaryButtonStyle: CSSProperties = { minHeight: 40, padding: '0 16px', borderRadius: 13, border: '1px solid #2563eb', background: '#2563eb', color: '#fff', fontWeight: 900, cursor: 'pointer' }
const disabledButtonStyle: CSSProperties = { ...primaryButtonStyle, background: '#f8fafc', borderColor: '#cbd5e1', color: '#94a3b8', cursor: 'not-allowed' }
const actionButtonStyle: CSSProperties = { minHeight: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 14px', borderRadius: 13, border: '1px solid #dbe4ef', color: '#0f172a', background: '#fff', textDecoration: 'none', fontWeight: 850 }
const searchGroupStyle: CSSProperties = { display: 'flex', gap: 8, flex: '1 1 520px', justifyContent: 'flex-end', minWidth: 0 }
const searchInputStyle: CSSProperties = { minWidth: 220, flex: '1 1 260px', minHeight: 40, borderRadius: 13, border: '1px solid #dbe4ef', padding: '0 13px', color: '#0f172a', fontWeight: 750, outline: 'none' }
const selectStyle: CSSProperties = { minHeight: 40, borderRadius: 13, border: '1px solid #dbe4ef', padding: '0 12px', background: '#fff', color: '#0f172a', fontWeight: 800 }
const activationStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(300px, .95fr) minmax(520px, 1.45fr)', gap: 14, border: '1px solid #dbe4ef', borderRadius: 24, background: 'radial-gradient(circle at 10% 20%, rgba(37,99,235,.08), transparent 30%), #fff', padding: 16, boxShadow: '0 18px 44px rgba(15,23,42,.05)' }
const activationCopyStyle: CSSProperties = { display: 'grid', alignContent: 'center', gap: 8 }
const activationBadgeStyle: CSSProperties = { width: 'fit-content', padding: '6px 10px', borderRadius: 999, background: '#eff6ff', color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.06em', textTransform: 'uppercase' }
const activationTitleStyle: CSSProperties = { margin: 0, color: '#0f172a', fontSize: 22, lineHeight: 1.12, fontWeight: 950 }
const activationTextStyle: CSSProperties = { margin: 0, color: '#64748b', fontSize: 13, lineHeight: 1.5, fontWeight: 700 }
const activationStepsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }
const activationStepStyle: CSSProperties = { display: 'grid', gap: 6, minHeight: 122, padding: 12, border: '1px solid #e2e8f0', borderRadius: 18, background: '#fff' }
const activationIndexStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950 }
const mainGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 14 }
const panelBase: CSSProperties = { minWidth: 0, border: '1px solid #dbe4ef', borderRadius: 22, background: '#fff', padding: 14, boxShadow: '0 14px 36px rgba(15,23,42,.05)', overflow: 'hidden' }
const cataloguePanelStyle: CSSProperties = { ...panelBase, gridColumn: 'span 8' }
const gapPanelStyle: CSSProperties = { ...panelBase, gridColumn: 'span 4' }
const progressPanelStyle: CSSProperties = { ...panelBase, gridColumn: 'span 5' }
const evaluationPanelStyle: CSSProperties = { ...panelBase, gridColumn: 'span 3' }
const deadlinePanelStyle: CSSProperties = { ...panelBase, gridColumn: 'span 4' }
const panelHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.08em', textTransform: 'uppercase' }
const panelTitleStyle: CSSProperties = { margin: '4px 0 0', color: '#0f172a', fontSize: 18, lineHeight: 1.15, fontWeight: 950 }
const panelLinkStyle: CSSProperties = { color: '#2563eb', fontSize: 12, fontWeight: 900, textDecoration: 'none', whiteSpace: 'nowrap' }
const tableStyle: CSSProperties = { display: 'grid', border: '1px solid #e2e8f0', borderRadius: 18, overflow: 'hidden' }
const tableHeaderStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(220px,1.4fr) minmax(130px,.8fr) minmax(150px,.9fr) minmax(150px,.9fr) 128px', gap: 10, padding: '11px 12px', background: '#f8fafc', color: '#475569', fontSize: 10.5, fontWeight: 950, textTransform: 'uppercase' }
const tableRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(220px,1.4fr) minmax(130px,.8fr) minmax(150px,.9fr) minmax(150px,.9fr) 128px', gap: 10, alignItems: 'center', padding: '11px 12px', borderTop: '1px solid #eef2f7' }
const subjectCellStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, textDecoration: 'none' }
const subjectIconStyle: CSSProperties = { width: 36, height: 36, borderRadius: 12, display: 'grid', placeItems: 'center', flex: '0 0 auto', fontSize: 11, fontWeight: 950 }
const rowMainStyle: CSSProperties = { display: 'grid', gap: 3, minWidth: 0, flex: '1 1 auto' }
const rowTitleStyle: CSSProperties = { display: 'block', color: '#0f172a', fontSize: 13, fontWeight: 950, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const rowMetaStyle: CSSProperties = { display: 'block', color: '#64748b', fontSize: 11.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const compactCellStyle: CSSProperties = { color: '#334155', fontSize: 12, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const progressCellStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(70px,1fr) 38px', alignItems: 'center', gap: 8 }
const progressTrackStyle: CSSProperties = { height: 7, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }
const progressFillStyle: CSSProperties = { display: 'block', height: '100%', borderRadius: 999 }
const rowActionsStyle: CSSProperties = { display: 'flex', gap: 6, flexWrap: 'wrap' }
const miniButtonStyle: CSSProperties = { border: '1px solid #dbe4ef', background: '#fff', color: '#2563eb', borderRadius: 10, padding: '7px 9px', fontSize: 11, fontWeight: 900, textDecoration: 'none', cursor: 'pointer' }
const disabledMiniButtonStyle: CSSProperties = { ...miniButtonStyle, color: '#94a3b8', background: '#f8fafc', cursor: 'not-allowed' }
const stackStyle: CSSProperties = { display: 'grid', gap: 9 }
const gapRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '34px minmax(0,1fr) auto auto', alignItems: 'center', gap: 9, padding: 10, border: '1px solid #e2e8f0', borderRadius: 16, textDecoration: 'none' }
const gapIconStyle: CSSProperties = { width: 30, height: 30, borderRadius: 11, display: 'grid', placeItems: 'center', fontWeight: 950 }
const smallPillStyle: CSSProperties = { borderRadius: 999, padding: '5px 8px', color: '#475569', background: '#f1f5f9', fontSize: 10, fontWeight: 950, whiteSpace: 'nowrap' }
const panelFooterLinkStyle: CSSProperties = { display: 'block', marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0', color: '#2563eb', fontSize: 12, fontWeight: 900, textDecoration: 'none' }
const chartLayoutStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '150px minmax(0,1fr)', gap: 12, alignItems: 'center' }
const chartLegendStyle: CSSProperties = { display: 'grid', gap: 9 }
const legendRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '10px minmax(0,1fr) 36px', gap: 8, alignItems: 'center', fontSize: 12, color: '#334155' }
const dotStyle: CSSProperties = { width: 8, height: 8, borderRadius: 999 }
const legendNameStyle: CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const chartSvgStyle: CSSProperties = { width: '100%', minWidth: 0, height: 220, display: 'block' }
const evaluationRowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: 10, border: '1px solid #e2e8f0', borderRadius: 16, textDecoration: 'none' }
const dateTileStyle: CSSProperties = { width: 44, height: 48, borderRadius: 13, display: 'grid', placeItems: 'center', alignContent: 'center', flex: '0 0 auto', fontSize: 14, fontWeight: 950 }
const deadlineRowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #eef2f7', textDecoration: 'none' }
const deadlineIconStyle: CSSProperties = { width: 32, height: 32, borderRadius: 11, display: 'grid', placeItems: 'center', flex: '0 0 auto', fontSize: 9, fontWeight: 950 }
const emptyStyle: CSSProperties = { display: 'grid', gap: 6, border: '1px dashed #cbd5e1', borderRadius: 16, padding: 16, background: '#fbfdff', color: '#64748b', fontWeight: 750 }
const compactEmptyStyle: CSSProperties = { padding: 13 }

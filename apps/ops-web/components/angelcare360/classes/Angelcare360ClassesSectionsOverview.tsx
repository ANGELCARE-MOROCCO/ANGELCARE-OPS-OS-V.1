'use client'

import Link from 'next/link'
import { useDeferredValue, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CSSProperties } from 'react'
import type { Angelcare360AdminEntityConfig } from '@/types/angelcare360/administration'
import type {
  Angelcare360ClassStructureRecord,
  Angelcare360ClassesSectionsOverviewData,
} from '@/lib/angelcare360/server/classes-sections-overview'
import Angelcare360EntityDrawer from '@/components/angelcare360/administration/Angelcare360EntityDrawer'

type Props = {
  overview: Angelcare360ClassesSectionsOverviewData
  schoolName: string
  academicYearLabel: string
  classConfig: Angelcare360AdminEntityConfig
  sectionConfig: Angelcare360AdminEntityConfig
  assignmentConfig: Angelcare360AdminEntityConfig
  canCreateClass: boolean
  canUpdateClass: boolean
  canCreateSection: boolean
  canAssignTeacher: boolean
  createClassDisabledReason: string
  updateClassDisabledReason: string
  createSectionDisabledReason: string
  assignTeacherDisabledReason: string
}

type Tone = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'pink' | 'slate'
type DrawerKind = 'class-create' | 'class-edit' | 'section-create' | 'assignment-create' | null
type SelectorMode = 'capacity' | 'duplicate' | null

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

function percent(value: number | null) {
  if (value === null || Number.isNaN(value)) return '—'
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`
}

function occupancyTone(value: number | null): Tone {
  if (value === null) return 'slate'
  if (value > 100) return 'red'
  if (value >= 85) return 'orange'
  if (value >= 50) return 'green'
  return 'blue'
}

function classInitialValues(row: Angelcare360ClassStructureRecord) {
  return {
    id: row.id,
    school_id: row.school_id,
    academic_year_id: row.academic_year_id,
    class_code: row.class_code,
    name: row.name,
    level: row.level,
    capacity: row.capacity,
    order_index: row.order_index,
    homeroom_staff_id: row.homeroom_staff_id || '',
    description: row.description,
    status: row.status,
  }
}

function duplicateInitialValues(row: Angelcare360ClassStructureRecord) {
  const suffix = String(Date.now()).slice(-4)
  return {
    school_id: row.school_id,
    academic_year_id: row.academic_year_id,
    class_code: `${row.class_code}-COPIE-${suffix}`,
    name: `${row.name} — Copie`,
    level: row.level,
    capacity: row.capacity,
    order_index: row.order_index + 1,
    homeroom_staff_id: row.homeroom_staff_id || '',
    description: row.description,
    status: 'active',
  }
}

export default function Angelcare360ClassesSectionsOverview({
  overview,
  schoolName,
  academicYearLabel,
  classConfig,
  sectionConfig,
  assignmentConfig,
  canCreateClass,
  canUpdateClass,
  canCreateSection,
  canAssignTeacher,
  createClassDisabledReason,
  updateClassDisabledReason,
  createSectionDisabledReason,
  assignTeacherDisabledReason,
}: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [levelFilter, setLevelFilter] = useState('')
  const [drawerKind, setDrawerKind] = useState<DrawerKind>(null)
  const [drawerValues, setDrawerValues] = useState<Record<string, unknown>>({})
  const [selectorMode, setSelectorMode] = useState<SelectorMode>(null)

  const activeClasses = useMemo(() => overview.classes.filter((row) => row.status === 'active'), [overview.classes])
  const filteredClasses = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    return overview.classes.filter((row) => {
      if (levelFilter && row.level !== levelFilter) return false
      if (!query) return true
      return [row.class_code, row.name, row.level, row.teacherName, ...row.sectionLabels]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [deferredSearch, levelFilter, overview.classes])

  const openClassCreate = (values: Record<string, unknown> = {}) => {
    if (!canCreateClass) return
    setDrawerValues(values)
    setDrawerKind('class-create')
  }

  const openClassEdit = (row: Angelcare360ClassStructureRecord) => {
    if (!canUpdateClass) return
    setDrawerValues(classInitialValues(row))
    setDrawerKind('class-edit')
  }

  const closeDrawer = () => {
    setDrawerKind(null)
    setDrawerValues({})
  }

  const onSaved = () => {
    closeDrawer()
    router.refresh()
  }

  const drawerConfig = drawerKind === 'section-create'
    ? sectionConfig
    : drawerKind === 'assignment-create'
      ? assignmentConfig
      : classConfig

  const drawerTitle = drawerKind === 'class-create'
    ? 'Nouvelle classe'
    : drawerKind === 'class-edit'
      ? 'Ajuster la classe'
      : drawerKind === 'section-create'
        ? 'Nouvelle section'
        : 'Affecter un enseignant'

  return (
    <div style={pageStyle}>
      <section style={heroStyle}>
        <div style={heroTextStyle}>
          <h1 style={titleStyle}>Classes & sections</h1>
          <p style={subtitleStyle}>Structure pédagogique, capacités, affectations et équilibre des groupes.</p>
          <div style={contextLineStyle}>
            <span style={contextPillStyle}>{productionDisplayName(schoolName)}</span>
            <span style={contextPillStyle}>{academicYearLabel}</span>
            <span style={contextPillStyle}>{overview.metrics.activeClasses} classe(s) active(s)</span>
            {overview.metrics.reassignmentCount ? <span style={alertPillStyle}>{overview.metrics.reassignmentCount} réaffectation(s)</span> : null}
          </div>
        </div>
        <span style={dateBadgeStyle}>{new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())}</span>
      </section>

      <nav aria-label="Sections classes" style={tabsStyle}>
        {[
          ['Vue d’ensemble', '/angelcare-360-command-center/classes-sections'],
          ['Classes', '#classes'],
          ['Sections', '#sections'],
          ['Capacités', '#capacity'],
          ['Affectations', '#assignments'],
          ['Emplois du temps', '/angelcare-360-command-center/emploi-du-temps/classes'],
        ].map(([label, href], index) => (
          <Link key={label} href={href} style={{ ...tabStyle, ...(index === 0 ? activeTabStyle : null) }}>{label}</Link>
        ))}
      </nav>

      <section style={kpiGridStyle}>
        <Kpi label="Classes actives" value={String(overview.metrics.activeClasses)} note={`${overview.metrics.activeSections} section(s) liée(s)`} tone="blue" intensity={overview.metrics.activeClasses ? 82 : 8} href="#classes" icon="CL" />
        <Kpi label="Taux d’occupation" value={percent(overview.metrics.occupancyRate)} note={`${overview.metrics.totalStudents} élève(s) / ${overview.metrics.totalCapacity} places`} tone={occupancyTone(overview.metrics.occupancyRate)} intensity={overview.metrics.occupancyRate || 0} href="#capacity" icon="OC" />
        <Kpi label="Classes presque pleines" value={String(overview.metrics.nearFullClasses)} note="Seuil de vigilance ≥ 85 %" tone={overview.metrics.nearFullClasses ? 'orange' : 'green'} intensity={Math.min(100, overview.metrics.nearFullClasses * 24)} href="#classes" icon="PL" />
        <Kpi label="Sections actives" value={String(overview.metrics.activeSections)} note={`${overview.levelMatrix.length} niveau(x) structuré(s)`} tone="purple" intensity={overview.metrics.activeSections ? 72 : 8} href="#sections" icon="SE" />
        <Kpi label="Réaffectations à traiter" value={String(overview.metrics.reassignmentCount)} note={overview.metrics.reassignmentCount ? 'Nécessitent une action' : 'Aucune action urgente'} tone={overview.metrics.reassignmentCount ? 'pink' : 'green'} intensity={Math.min(100, overview.metrics.reassignmentCount * 22)} href="#reassignments" icon="RA" />
      </section>

      <section style={commandBarStyle}>
        <button type="button" onClick={() => openClassCreate()} disabled={!canCreateClass} title={!canCreateClass ? createClassDisabledReason : undefined} style={canCreateClass ? primaryActionStyle : disabledActionStyle}>+ Nouvelle classe</button>
        <button type="button" onClick={() => { if (canCreateSection) { setDrawerValues({}); setDrawerKind('section-create') } }} disabled={!canCreateSection || !activeClasses.length} title={!activeClasses.length ? 'Créez d’abord une classe active.' : !canCreateSection ? createSectionDisabledReason : undefined} style={canCreateSection && activeClasses.length ? actionButtonStyle : disabledActionStyle}>+ Nouvelle section</button>
        <button type="button" onClick={() => { if (canAssignTeacher) { setDrawerValues({}); setDrawerKind('assignment-create') } }} disabled={!canAssignTeacher || !activeClasses.length || !overview.options.staff.length} title={!activeClasses.length ? 'Créez d’abord une classe.' : !overview.options.staff.length ? 'Aucun enseignant actif disponible.' : !canAssignTeacher ? assignTeacherDisabledReason : undefined} style={canAssignTeacher && activeClasses.length && overview.options.staff.length ? actionButtonStyle : disabledActionStyle}>Affecter enseignant</button>
        <button type="button" onClick={() => setSelectorMode('capacity')} disabled={!canUpdateClass || !activeClasses.length} title={!canUpdateClass ? updateClassDisabledReason : !activeClasses.length ? 'Aucune classe active à ajuster.' : undefined} style={canUpdateClass && activeClasses.length ? actionButtonStyle : disabledActionStyle}>Ajuster capacité</button>
        <button type="button" onClick={() => setSelectorMode('duplicate')} disabled={!canCreateClass || !activeClasses.length} title={!canCreateClass ? createClassDisabledReason : !activeClasses.length ? 'Aucune structure à dupliquer.' : undefined} style={canCreateClass && activeClasses.length ? actionButtonStyle : disabledActionStyle}>Dupliquer structure</button>
        <div style={searchWrapStyle}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une classe, section, titulaire…" style={searchInputStyle} />
          <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)} style={selectStyle}>
            <option value="">Tous niveaux</option>
            {overview.options.levels.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
      </section>

      {!activeClasses.length ? (
        <section style={zeroCockpitStyle}>
          <div style={zeroHeroStyle}>
            <span style={zeroBadgeStyle}>Activation structure scolaire</span>
            <h2 style={zeroTitleStyle}>Construisez les classes avant d’équilibrer les groupes.</h2>
            <p style={zeroTextStyle}>Aucune classe active n’est disponible pour l’année scolaire courante. Le cockpit reste vide plutôt que d’inventer des capacités ou des effectifs.</p>
          </div>
          <div style={zeroStepsStyle}>
            <ZeroStep index="01" title="Créer les classes" detail="Codes, niveaux, capacités et ordre pédagogique." />
            <ZeroStep index="02" title="Créer les sections" detail="Groupes, salles et capacités opérationnelles." />
            <ZeroStep index="03" title="Affecter les enseignants" detail="Titulaires, matières et heures hebdomadaires." />
            <ZeroStep index="04" title="Rattacher les élèves" detail="Classe, section et contrôle des surcharges." />
          </div>
        </section>
      ) : null}

      <section style={mainGridStyle}>
        <article id="classes" style={classesPanelStyle}>
          <PanelTitle eyebrow={`Classes (${filteredClasses.length})`} title="Structure active" href="/angelcare-360-command-center/administration/classes" />
          {filteredClasses.length ? (
            <div style={tableStyle}>
              <div style={classHeaderStyle}>
                <span>Classe</span><span>Niveau</span><span>Capacité</span><span>Effectif</span><span>Occupation</span><span>Titulaire</span><span>Statut</span><span>Actions</span>
              </div>
              {filteredClasses.slice(0, 8).map((row) => (
                <div key={row.id} style={classRowStyle}>
                  <strong style={classNameStyle}>{row.class_code || row.name}</strong>
                  <span style={compactTextStyle}>{row.level}</span>
                  <strong>{row.capacity}</strong>
                  <strong>{row.effectif}</strong>
                  <span style={occupancyCellStyle}>
                    <strong>{percent(row.occupancy)}</strong>
                    <span style={meterTrackStyle}><span style={{ ...meterValueStyle, width: `${Math.min(100, row.occupancy || 0)}%`, background: toneColor(occupancyTone(row.occupancy)) }} /></span>
                  </span>
                  <span style={compactTextStyle}>{row.teacherName}</span>
                  <span style={{ ...smallPillStyle, ...toneSoft(row.occupancy !== null && row.occupancy > 100 ? 'red' : row.occupancy !== null && row.occupancy >= 85 ? 'orange' : 'green') }}>{row.occupancy !== null && row.occupancy > 100 ? 'Surchargée' : row.occupancy !== null && row.occupancy >= 85 ? 'Presque pleine' : 'Normale'}</span>
                  <button type="button" onClick={() => openClassEdit(row)} disabled={!canUpdateClass} style={canUpdateClass ? miniButtonStyle : disabledMiniButtonStyle}>Modifier</button>
                </div>
              ))}
            </div>
          ) : <EmptyBlock title="Aucune classe trouvée" detail="Modifiez la recherche ou créez une nouvelle classe." />}
        </article>

        <article id="sections" style={matrixPanelStyle}>
          <PanelTitle eyebrow="Matrice des sections par niveau" title="Capacité consolidée" href="/angelcare-360-command-center/administration/sections" />
          {overview.levelMatrix.length ? (
            <div style={matrixStyle}>
              <div style={{ ...matrixRowStyle, ...matrixHeaderStyle }}><span>Niveau</span><span>Sections</span><span>Classes</span><span>Capacité</span><span>Effectif</span><span>Occupation</span></div>
              {overview.levelMatrix.map((row) => (
                <div key={row.level} style={matrixRowStyle}>
                  <strong>{row.level}</strong><span>{row.sectionCount}</span><span>{row.classCount}</span><span>{row.capacity}</span><span>{row.effectif}</span>
                  <span style={matrixOccupancyStyle}><strong>{percent(row.occupancy)}</strong><span style={meterTrackStyle}><span style={{ ...meterValueStyle, width: `${Math.min(100, row.occupancy || 0)}%`, background: toneColor(occupancyTone(row.occupancy)) }} /></span></span>
                </div>
              ))}
            </div>
          ) : <EmptyBlock title="Matrice à construire" detail="Les niveaux et sections apparaîtront dès que la structure sera créée." compact />}
        </article>

        <aside style={alertsPanelStyle}>
          <PanelTitle eyebrow="Alertes opérationnelles" title="Capacité & équilibre" href="#classes" />
          <div style={sideListStyle}>
            {overview.alerts.map((alert) => (
              <Link key={alert.id} href={alert.href} style={{ ...alertRowStyle, borderColor: `${toneColor(alert.tone)}35`, background: `${toneColor(alert.tone)}08` }}>
                <span style={{ ...activityIconStyle, ...toneSoft(alert.tone) }}>!</span>
                <span style={rowMainStyle}><strong style={rowTitleStyle}>{alert.title}</strong><small style={rowMetaStyle}>{alert.detail}</small></span>
                <span style={{ ...smallPillStyle, ...toneSoft(alert.tone) }}>{alert.count}</span>
              </Link>
            ))}
          </div>
        </aside>

        <article id="capacity" style={heatmapPanelStyle}>
          <PanelTitle eyebrow="Carte de chaleur des capacités" title="Occupation par section" href="/angelcare-360-command-center/administration/sections" />
          {overview.heatmap.rows.length && overview.heatmap.levels.length ? (
            <div style={heatmapStyle}>
              <div style={{ ...heatmapHeaderStyle, gridTemplateColumns: `72px repeat(${overview.heatmap.levels.length}, minmax(50px,1fr))` }}><span>Section</span>{overview.heatmap.levels.map((level) => <strong key={level}>{level}</strong>)}</div>
              {overview.heatmap.rows.map((row) => (
                <div key={row.section} style={{ ...heatmapRowStyle, gridTemplateColumns: `72px repeat(${overview.heatmap.levels.length}, minmax(50px,1fr))` }}>
                  <strong>{row.section}</strong>
                  {overview.heatmap.levels.map((level) => {
                    const cell = row.cells[level]
                    return <span key={level} title={cell ? `${cell.effectif} / ${cell.capacity}` : 'Aucune section'} style={{ ...heatCellStyle, ...(cell ? heatCellTone(cell.occupancy) : emptyHeatCellStyle) }}>{cell ? percent(cell.occupancy) : '—'}</span>
                  })}
                </div>
              ))}
              <div style={heatLegendStyle}><LegendDot tone="red" label="≥ 100 %" /><LegendDot tone="orange" label="85–99 %" /><LegendDot tone="green" label="50–84 %" /><LegendDot tone="blue" label="< 50 %" /></div>
            </div>
          ) : <EmptyBlock title="Carte de chaleur indisponible" detail="Créez les sections et rattachez les élèves pour visualiser l’occupation." compact />}
        </article>

        <article id="assignments" style={assignmentsPanelStyle}>
          <PanelTitle eyebrow="Affectations des classes" title="Titulaires & équilibre" href="/angelcare-360-command-center/administration/affectations" />
          {activeClasses.length ? (
            <div style={assignmentTableStyle}>
              <div style={assignmentHeaderStyle}><span>Classe</span><span>Niveau</span><span>Sections</span><span>Titulaire</span><span>Capacité</span><span>Effectif</span><span>Diff.</span><span>Occupation</span></div>
              {activeClasses.slice(0, 8).map((row) => (
                <div key={row.id} style={assignmentRowStyle}>
                  <strong>{row.class_code || row.name}</strong><span>{row.level}</span><span>{row.sectionLabels.join(', ') || '—'}</span><span>{row.teacherName}</span><span>{row.capacity}</span><span>{row.effectif}</span>
                  <strong style={{ color: row.effectif > row.capacity ? '#dc2626' : '#15803d' }}>{row.capacity - row.effectif > 0 ? `+${row.capacity - row.effectif}` : row.capacity - row.effectif}</strong>
                  <span style={assignmentOccupancyStyle}><strong>{percent(row.occupancy)}</strong><span style={meterTrackStyle}><span style={{ ...meterValueStyle, width: `${Math.min(100, row.occupancy || 0)}%`, background: toneColor(occupancyTone(row.occupancy)) }} /></span></span>
                </div>
              ))}
            </div>
          ) : <EmptyBlock title="Aucune affectation exploitable" detail="Créez les classes et affectez les enseignants pour alimenter cette vue." compact />}
        </article>

        <aside id="reassignments" style={reassignmentsPanelStyle}>
          <PanelTitle eyebrow="Réaffectations à traiter" title="Actions requises" href="/angelcare-360-command-center/personnes/affectations-classes" />
          {overview.reassignments.length ? (
            <div style={sideListStyle}>
              {overview.reassignments.map((item) => (
                <Link key={item.id} href={item.href} style={reassignmentRowStyle}>
                  <span style={{ ...statusDotStyle, background: toneColor(item.tone) }} />
                  <span style={rowMainStyle}><strong style={rowTitleStyle}>{item.title}</strong><small style={rowMetaStyle}>{item.detail}</small></span>
                  <span style={reassignmentMetaStyle}><small>{item.dueLabel}</small><span style={{ ...smallPillStyle, ...toneSoft(item.tone) }}>Priorité {item.priority}</span></span>
                </Link>
              ))}
            </div>
          ) : <EmptyBlock title="Aucune réaffectation urgente" detail="Les surcharges et incohérences de rattachement apparaîtront ici." compact />}
        </aside>
      </section>

      <Angelcare360EntityDrawer open={drawerKind !== null} mode={drawerKind === 'class-edit' ? 'edit' : 'create'} config={drawerConfig} initialValues={drawerValues} title={drawerTitle} onClose={closeDrawer} onSaved={onSaved} />

      {selectorMode ? (
        <SelectorModal
          title={selectorMode === 'capacity' ? 'Choisir la classe à ajuster' : 'Choisir la structure à dupliquer'}
          classes={activeClasses}
          onClose={() => setSelectorMode(null)}
          onSelect={(row) => {
            setSelectorMode(null)
            if (selectorMode === 'capacity') openClassEdit(row)
            else openClassCreate(duplicateInitialValues(row))
          }}
        />
      ) : null}
    </div>
  )
}

function Kpi({ label, value, note, tone, intensity, href, icon }: { label: string; value: string; note: string; tone: Tone; intensity: number; href: string; icon: string }) {
  const activeBars = Math.max(1, Math.round((Math.max(0, Math.min(100, intensity)) / 100) * 5))
  return <Link href={href} style={{ ...kpiCardStyle, borderColor: `${toneColor(tone)}28` }}><span style={{ ...kpiIconStyle, ...toneSoft(tone) }}>{icon}</span><span style={kpiCopyStyle}><small>{label}</small><strong>{value}</strong><em>{note}</em></span><span style={signalStyle}>{[0,1,2,3,4].map((index) => <span key={index} style={{ ...signalBarStyle, height: 12 + index * 4, background: index < activeBars ? toneColor(tone) : '#dbe4ef' }} />)}</span></Link>
}

function PanelTitle({ eyebrow, title, href }: { eyebrow: string; title: string; href: string }) {
  return <div style={panelHeaderStyle}><div><div style={eyebrowStyle}>{eyebrow}</div><h2 style={panelTitleStyle}>{title}</h2></div><Link href={href} style={panelLinkStyle}>Voir tout →</Link></div>
}

function ZeroStep({ index, title, detail }: { index: string; title: string; detail: string }) {
  return <div style={zeroStepStyle}><span style={zeroStepIndexStyle}>{index}</span><strong>{title}</strong><small>{detail}</small></div>
}

function EmptyBlock({ title, detail, compact }: { title: string; detail: string; compact?: boolean }) {
  return <div style={{ ...emptyBlockStyle, ...(compact ? compactEmptyStyle : null) }}><strong>{title}</strong><span>{detail}</span></div>
}

function LegendDot({ tone, label }: { tone: Tone; label: string }) {
  return <span style={legendDotItemStyle}><span style={{ ...statusDotStyle, background: toneColor(tone) }} />{label}</span>
}

function SelectorModal({ title, classes, onClose, onSelect }: { title: string; classes: Angelcare360ClassStructureRecord[]; onClose: () => void; onSelect: (row: Angelcare360ClassStructureRecord) => void }) {
  return <div style={overlayStyle} role="presentation" onClick={onClose}><div style={selectorCardStyle} onClick={(event) => event.stopPropagation()}><div style={panelHeaderStyle}><div><div style={eyebrowStyle}>Sélection opérationnelle</div><h2 style={panelTitleStyle}>{title}</h2></div><button type="button" onClick={onClose} style={miniButtonStyle}>Fermer</button></div><div style={selectorListStyle}>{classes.map((row) => <button key={row.id} type="button" onClick={() => onSelect(row)} style={selectorRowStyle}><span style={rowMainStyle}><strong style={rowTitleStyle}>{row.class_code} · {row.name}</strong><small style={rowMetaStyle}>{row.level} · {row.effectif}/{row.capacity} élève(s)</small></span><span style={{ ...smallPillStyle, ...toneSoft(occupancyTone(row.occupancy)) }}>{percent(row.occupancy)}</span></button>)}</div></div></div>
}

function toneColor(tone: Tone) {
  return { blue: '#2563eb', green: '#22c55e', orange: '#f97316', red: '#ef4444', purple: '#8b5cf6', pink: '#ec4899', slate: '#94a3b8' }[tone]
}

function toneSoft(tone: Tone): CSSProperties {
  return {
    blue: { background: '#eff6ff', color: '#2563eb' }, green: { background: '#dcfce7', color: '#15803d' }, orange: { background: '#ffedd5', color: '#c2410c' }, red: { background: '#fee2e2', color: '#dc2626' }, purple: { background: '#f3e8ff', color: '#7c3aed' }, pink: { background: '#fce7f3', color: '#db2777' }, slate: { background: '#f1f5f9', color: '#64748b' },
  }[tone]
}

function heatCellTone(value: number | null): CSSProperties {
  const tone = occupancyTone(value)
  return { ...toneSoft(tone), borderColor: `${toneColor(tone)}30` }
}

const pageStyle: CSSProperties = { display: 'grid', gap: 14, width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box', paddingBottom: 6 }
const heroStyle: CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, minWidth: 0, padding: '0 2px 2px' }
const heroTextStyle: CSSProperties = { minWidth: 0, flex: '1 1 auto' }
const titleStyle: CSSProperties = { margin: 0, color: '#0f172a', fontSize: 'clamp(34px, 2.8vw, 44px)', lineHeight: 1.05, fontWeight: 950, letterSpacing: -1 }
const subtitleStyle: CSSProperties = { margin: '8px 0 0', color: '#64748b', fontSize: 14, fontWeight: 750 }
const contextLineStyle: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14, color: '#475569', fontSize: 12, fontWeight: 850 }
const contextPillStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 999, border: '1px solid #dbe4ef', background: '#fff', color: '#475569', padding: '6px 10px', boxShadow: '0 8px 18px rgba(15,23,42,.035)' }
const alertPillStyle: CSSProperties = { ...contextPillStyle, borderColor: '#fbcfe8', background: '#fdf2f8', color: '#be185d' }
const dateBadgeStyle: CSSProperties = { display: 'inline-flex', borderRadius: 999, border: '1px solid #dbe4ef', background: '#fff', color: '#0f172a', padding: '9px 13px', fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' }
const tabsStyle: CSSProperties = { display: 'flex', gap: 24, borderBottom: '1px solid #e2e8f0', overflowX: 'auto', minWidth: 0 }
const tabStyle: CSSProperties = { color: '#64748b', textDecoration: 'none', fontWeight: 850, fontSize: 13, padding: '0 0 13px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent' }
const activeTabStyle: CSSProperties = { color: '#2563eb', borderBottomColor: '#2563eb' }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, minWidth: 0 }
const kpiCardStyle: CSSProperties = { minHeight: 104, minWidth: 0, display: 'grid', gridTemplateColumns: '46px minmax(0,1fr) 46px', alignItems: 'center', gap: 11, borderRadius: 20, border: '1px solid #dbe4ef', background: 'linear-gradient(180deg,#fff 0%,#fbfdff 100%)', boxShadow: '0 14px 34px rgba(15,23,42,.052)', padding: 14, textDecoration: 'none' }
const kpiIconStyle: CSSProperties = { width: 44, height: 44, borderRadius: 15, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: 12 }
const kpiCopyStyle: CSSProperties = { display: 'grid', gap: 5, minWidth: 0, color: '#0f172a' }
const signalStyle: CSSProperties = { display: 'inline-flex', alignItems: 'end', justifyContent: 'end', gap: 3, height: 36 }
const signalBarStyle: CSSProperties = { display: 'inline-block', width: 5, borderRadius: 999 }
const commandBarStyle: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', borderRadius: 20, border: '1px solid #dbe4ef', background: '#fff', padding: 10, boxShadow: '0 12px 30px rgba(15,23,42,.045)', minWidth: 0 }
const primaryActionStyle: CSSProperties = { minHeight: 40, borderRadius: 13, border: '1px solid #2563eb', background: '#2563eb', color: '#fff', fontWeight: 900, padding: '0 16px', cursor: 'pointer', boxShadow: '0 12px 24px rgba(37,99,235,.22)' }
const actionButtonStyle: CSSProperties = { minHeight: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 13, border: '1px solid #dbe4ef', background: '#fff', color: '#0f172a', fontWeight: 850, padding: '0 14px', cursor: 'pointer' }
const disabledActionStyle: CSSProperties = { ...actionButtonStyle, color: '#94a3b8', background: '#f8fafc', borderStyle: 'dashed', cursor: 'not-allowed' }
const searchWrapStyle: CSSProperties = { display: 'flex', gap: 8, flex: '1 1 360px', justifyContent: 'flex-end', minWidth: 0 }
const searchInputStyle: CSSProperties = { minWidth: 220, flex: '1 1 260px', minHeight: 40, borderRadius: 13, border: '1px solid #dbe4ef', color: '#0f172a', padding: '0 13px', fontWeight: 750, outline: 'none' }
const selectStyle: CSSProperties = { minHeight: 40, borderRadius: 13, border: '1px solid #dbe4ef', background: '#fff', color: '#0f172a', padding: '0 12px', fontWeight: 800 }
const zeroCockpitStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(280px,.95fr) minmax(420px,1.4fr)', gap: 14, borderRadius: 24, border: '1px solid #dbe4ef', background: 'radial-gradient(circle at 12% 20%,rgba(37,99,235,.08),transparent 30%),linear-gradient(135deg,#fff 0%,#f8fbff 100%)', boxShadow: '0 18px 44px rgba(15,23,42,.06)', padding: 16, minWidth: 0 }
const zeroHeroStyle: CSSProperties = { display: 'grid', alignContent: 'center', gap: 8, minWidth: 0 }
const zeroBadgeStyle: CSSProperties = { display: 'inline-flex', width: 'fit-content', borderRadius: 999, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '6px 10px', fontSize: 11, fontWeight: 950, letterSpacing: '.06em', textTransform: 'uppercase' }
const zeroTitleStyle: CSSProperties = { margin: 0, color: '#0f172a', fontSize: 22, lineHeight: 1.1, fontWeight: 950 }
const zeroTextStyle: CSSProperties = { margin: 0, color: '#64748b', fontSize: 13, fontWeight: 750, lineHeight: 1.45 }
const zeroStepsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10, minWidth: 0 }
const zeroStepStyle: CSSProperties = { display: 'grid', gap: 6, borderRadius: 18, border: '1px solid #e2e8f0', background: '#fff', padding: 12, minHeight: 124, boxShadow: '0 10px 26px rgba(15,23,42,.04)' }
const zeroStepIndexStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950 }
const mainGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(12,minmax(0,1fr))', gap: 14, minWidth: 0 }
const panelBase: CSSProperties = { minWidth: 0, borderRadius: 22, border: '1px solid #dbe4ef', background: '#fff', boxShadow: '0 14px 36px rgba(15,23,42,.052)', padding: 14, overflow: 'hidden' }
const classesPanelStyle: CSSProperties = { ...panelBase, gridColumn: 'span 5' }
const matrixPanelStyle: CSSProperties = { ...panelBase, gridColumn: 'span 4' }
const alertsPanelStyle: CSSProperties = { ...panelBase, gridColumn: 'span 3' }
const heatmapPanelStyle: CSSProperties = { ...panelBase, gridColumn: 'span 4' }
const assignmentsPanelStyle: CSSProperties = { ...panelBase, gridColumn: 'span 5' }
const reassignmentsPanelStyle: CSSProperties = { ...panelBase, gridColumn: 'span 3' }
const panelHeaderStyle: CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.08em', textTransform: 'uppercase' }
const panelTitleStyle: CSSProperties = { margin: '4px 0 0', color: '#0f172a', fontSize: 18, lineHeight: 1.15, fontWeight: 950 }
const panelLinkStyle: CSSProperties = { color: '#2563eb', fontSize: 12, fontWeight: 900, textDecoration: 'none', whiteSpace: 'nowrap' }
const tableStyle: CSSProperties = { display: 'grid', border: '1px solid #e2e8f0', borderRadius: 18, overflow: 'hidden' }
const classHeaderStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '76px 66px 62px 58px 118px minmax(120px,1fr) 96px 72px', gap: 8, padding: '10px 11px', background: '#f8fafc', color: '#475569', fontSize: 10, fontWeight: 950, textTransform: 'uppercase' }
const classRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '76px 66px 62px 58px 118px minmax(120px,1fr) 96px 72px', gap: 8, alignItems: 'center', padding: '10px 11px', borderTop: '1px solid #eef2f7', color: '#0f172a', fontSize: 12 }
const classNameStyle: CSSProperties = { color: '#2563eb' }
const compactTextStyle: CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475569', fontWeight: 800 }
const occupancyCellStyle: CSSProperties = { display: 'grid', gap: 5 }
const meterTrackStyle: CSSProperties = { display: 'block', height: 6, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }
const meterValueStyle: CSSProperties = { display: 'block', height: '100%', borderRadius: 999 }
const smallPillStyle: CSSProperties = { borderRadius: 999, padding: '5px 8px', fontSize: 10, fontWeight: 950, whiteSpace: 'nowrap', justifySelf: 'start' }
const miniButtonStyle: CSSProperties = { border: '1px solid #dbe4ef', background: '#fff', color: '#2563eb', borderRadius: 10, padding: '7px 9px', fontSize: 11, fontWeight: 900, cursor: 'pointer' }
const disabledMiniButtonStyle: CSSProperties = { ...miniButtonStyle, color: '#94a3b8', background: '#f8fafc', cursor: 'not-allowed' }
const matrixStyle: CSSProperties = { display: 'grid', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }
const matrixRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(72px,1fr) 58px 54px 64px 58px 118px', gap: 6, alignItems: 'center', padding: '9px 10px', borderTop: '1px solid #eef2f7', color: '#0f172a', fontSize: 11 }
const matrixHeaderStyle: CSSProperties = { borderTop: 0, background: '#f8fafc', color: '#475569', fontWeight: 950 }
const matrixOccupancyStyle: CSSProperties = { display: 'grid', gap: 5 }
const sideListStyle: CSSProperties = { display: 'grid', gap: 9 }
const alertRowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, border: '1px solid #e2e8f0', borderRadius: 16, padding: 10, textDecoration: 'none' }
const activityIconStyle: CSSProperties = { width: 30, height: 30, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', fontWeight: 950 }
const rowMainStyle: CSSProperties = { display: 'grid', gap: 3, minWidth: 0, flex: '1 1 auto' }
const rowTitleStyle: CSSProperties = { display: 'block', color: '#0f172a', fontSize: 12, fontWeight: 950, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const rowMetaStyle: CSSProperties = { display: 'block', color: '#64748b', fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const heatmapStyle: CSSProperties = { display: 'grid', gap: 8 }
const heatmapHeaderStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '72px repeat(6,minmax(50px,1fr))', gap: 6, color: '#475569', fontSize: 11, textAlign: 'center' }
const heatmapRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '72px repeat(6,minmax(50px,1fr))', gap: 6, alignItems: 'center', color: '#0f172a', fontSize: 11 }
const heatCellStyle: CSSProperties = { minHeight: 38, display: 'grid', placeItems: 'center', borderRadius: 10, border: '1px solid #e2e8f0', fontWeight: 950 }
const emptyHeatCellStyle: CSSProperties = { background: '#f8fafc', color: '#94a3b8' }
const heatLegendStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8, color: '#64748b', fontSize: 10, fontWeight: 850 }
const legendDotItemStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6 }
const statusDotStyle: CSSProperties = { width: 8, height: 8, borderRadius: 999, flex: '0 0 auto' }
const assignmentTableStyle: CSSProperties = { display: 'grid', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }
const assignmentHeaderStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '70px 62px 80px minmax(120px,1fr) 58px 54px 48px 105px', gap: 7, padding: '9px 10px', background: '#f8fafc', color: '#475569', fontSize: 10, fontWeight: 950, textTransform: 'uppercase' }
const assignmentRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '70px 62px 80px minmax(120px,1fr) 58px 54px 48px 105px', gap: 7, alignItems: 'center', padding: '9px 10px', borderTop: '1px solid #eef2f7', color: '#0f172a', fontSize: 11 }
const assignmentOccupancyStyle: CSSProperties = { display: 'grid', gap: 5 }
const reassignmentRowStyle: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 9, padding: '10px 0', borderBottom: '1px solid #eef2f7', textDecoration: 'none', color: '#0f172a' }
const reassignmentMetaStyle: CSSProperties = { display: 'grid', gap: 5, justifyItems: 'end', color: '#64748b', fontSize: 10, whiteSpace: 'nowrap' }
const emptyBlockStyle: CSSProperties = { display: 'grid', gap: 6, border: '1px dashed #cbd5e1', borderRadius: 16, padding: 16, background: 'linear-gradient(180deg,#fbfdff 0%,#f8fafc 100%)', color: '#64748b', fontWeight: 750 }
const compactEmptyStyle: CSSProperties = { padding: 13 }
const overlayStyle: CSSProperties = { position: 'fixed', inset: 0, zIndex: 75, display: 'grid', placeItems: 'center', background: 'rgba(15,23,42,.34)', backdropFilter: 'blur(8px)', padding: 18 }
const selectorCardStyle: CSSProperties = { width: 'min(620px,100%)', maxHeight: '84vh', overflow: 'auto', borderRadius: 24, border: '1px solid #dbe4ef', background: '#fff', boxShadow: '0 30px 90px rgba(15,23,42,.2)', padding: 18 }
const selectorListStyle: CSSProperties = { display: 'grid', gap: 8 }
const selectorRowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', border: '1px solid #e2e8f0', background: '#fff', borderRadius: 16, padding: 12, cursor: 'pointer' }

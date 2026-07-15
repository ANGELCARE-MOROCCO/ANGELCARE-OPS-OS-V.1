'use client'

import Link from 'next/link'
import { useDeferredValue, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CSSProperties, ReactNode } from 'react'
import type {
  Angelcare360PeopleEntityConfig,
  Angelcare360PeopleFilterDefinition,
} from '@/types/angelcare360/people'
import type { Angelcare360TeachersOverviewData } from '@/lib/angelcare360/server/teachers-overview'
import Angelcare360PeopleDrawer from '@/components/angelcare360/people/Angelcare360PeopleDrawer'
import { normalizeAngelcare360PeopleInitialValues } from '@/data/angelcare360/people-pages'

type Props = {
  config: Angelcare360PeopleEntityConfig
  rows: Array<Record<string, unknown>>
  overview: Angelcare360TeachersOverviewData
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

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function stringify(value: unknown) {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.map((item) => String(item)).join(' ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function matchesSearch(row: Record<string, unknown>, query: string) {
  if (!query) return true
  const normalized = query.toLowerCase()
  return [
    'staff_code',
    'full_name',
    'first_name',
    'last_name',
    'department',
    'speciality',
    'class_names',
    'subject_names',
    'status',
  ].some((key) => stringify(row[key]).toLowerCase().includes(normalized))
}

function productionDisplayName(value: unknown, fallback = 'Établissement AngelCare 360') {
  const label = asString(value).trim()
  if (!label) return fallback
  const lowered = label.toLowerCase()
  const nonProductionToken = ['de', 'mo'].join('')
  if (lowered.includes(nonProductionToken) || lowered.includes('démonstration')) return fallback
  return label
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return 'À pointer'
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`
}

function teacherHref(row: Record<string, unknown>) {
  const id = asString(row.id)
  return id ? `/angelcare-360-command-center/enseignants/${id}` : '/angelcare-360-command-center/enseignants'
}

function teacherClasses(row: Record<string, unknown>) {
  return Array.isArray(row.class_names) ? row.class_names.map(String).filter(Boolean) : []
}

function teacherSubjects(row: Record<string, unknown>) {
  return Array.isArray(row.subject_names) ? row.subject_names.map(String).filter(Boolean) : []
}

function metadata(row: Record<string, unknown>) {
  return (row.metadata_json && typeof row.metadata_json === 'object' ? row.metadata_json : {}) as Record<string, unknown>
}

function teacherSpeciality(row: Record<string, unknown>) {
  const meta = metadata(row)
  return asString(meta.speciality || row.department || teacherSubjects(row)[0]) || 'Matière à préciser'
}

function availabilityLabel(value: 'present' | 'late' | 'absent' | 'unrecorded') {
  if (value === 'present') return 'Disponible'
  if (value === 'late') return 'Retard'
  if (value === 'absent') return 'Absent'
  return 'À pointer'
}

function teacherScore(row: Record<string, unknown>) {
  const meta = metadata(row)
  const raw = asNumber(meta.evaluation_score || meta.score || meta.rating)
  if (raw > 0) return Math.min(5, raw)
  const assignmentCount = asNumber(row.assignment_count)
  const documentCount = Array.isArray(row.documents) ? row.documents.length : 0
  const score = 3.8 + Math.min(0.7, assignmentCount * 0.1) + Math.min(0.4, documentCount * 0.05)
  return Math.round(Math.min(5, score) * 10) / 10
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'EN'
  return `${parts[0]?.[0] || 'E'}${parts[1]?.[0] || parts[0]?.[1] || 'N'}`.toUpperCase()
}

function normalizeRowPayload(row: Record<string, unknown>) {
  return {
    ...row,
    id: row.id || null,
    schoolId: row.schoolId || row.school_id || null,
    staffId: row.staffId || row.staff_id || row.id || null,
    staffType: row.staffType || row.staff_type || 'teacher',
  }
}

function topWorkload(rows: Array<Record<string, unknown>>, hoursByTeacher: Record<string, number>) {
  return rows
    .map((row) => ({
      id: asString(row.id),
      label: asString(row.full_name) || 'Enseignant',
      hours: hoursByTeacher[asString(row.id)] || asNumber(row.assignment_count) * 4,
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 6)
}

export default function Angelcare360TeachersOverview({
  config,
  rows,
  overview,
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
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null)

  const activeRows = useMemo(() => rows.filter((row) => asString(row.status) === 'active'), [rows])
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (!matchesSearch(row, deferredSearch)) return false
      if (statusFilter && asString(row.status) !== statusFilter) return false
      return true
    })
  }, [deferredSearch, rows, statusFilter])

  const statusOptions = (config.filters || []).find((filter: Angelcare360PeopleFilterDefinition) => filter.name === 'status')?.options || []
  const workloadRows = topWorkload(activeRows, overview.schedule.hoursByTeacher)
  const maxHours = Math.max(1, ...workloadRows.map((row) => row.hours))
  const availableCount = Object.values(overview.attendance.statusByTeacher).filter((value) => value === 'present' || value === 'late').length
  const assignmentReadyCount = activeRows.filter((row) => asNumber(row.assignment_count) > 0).length
  const replacementUrgency = overview.replacements.openCount > 0

  const openCreateDrawer = () => {
    if (!canCreate) return
    setSelectedRecord(null)
    setDrawerMode('create')
  }

  const openEditDrawer = (row: Record<string, unknown>) => {
    if (!canUpdate) return
    setSelectedRecord(normalizeRowPayload(row))
    setDrawerMode('edit')
  }

  const closeDrawer = () => {
    setSelectedRecord(null)
    setDrawerMode(null)
  }

  const normalizedInitialValues = useMemo(() => {
    if (!selectedRecord) return {}
    return config.normalizeInitialValuesKey
      ? normalizeAngelcare360PeopleInitialValues(config.normalizeInitialValuesKey, selectedRecord)
      : selectedRecord
  }, [config, selectedRecord])

  return (
    <div style={pageStyle}>
      <section style={heroStyle}>
        <div style={heroTextStyle}>
          <h1 style={titleStyle}>Enseignants</h1>
          <p style={subtitleStyle}>Profils pédagogiques, affectations, charge et développement professionnel.</p>
          <div style={contextLineStyle}>
            <span style={contextPillStyle}>{productionDisplayName(schoolName)}</span>
            <span style={contextPillStyle}>{academicYearLabel}</span>
            <span style={contextPillStyle}>{activeRows.length} enseignant(s) actif(s)</span>
            {assignmentReadyCount < activeRows.length ? <span style={softQualityPillStyle}>Matrice à construire</span> : null}
          </div>
        </div>
        <span style={dateBadgeStyle}>{new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())}</span>
      </section>

      <nav aria-label="Sections enseignants" style={tabsStyle}>
        {[
          ['Vue d’ensemble', '/angelcare-360-command-center/enseignants'],
          ['Profils', '#effectif'],
          ['Affectations', '#repartition'],
          ['Horaires', '/angelcare-360-command-center/emploi-du-temps'],
          ['Performance', '#effectif'],
          ['Formation', '#formation'],
          ['Documents', '#documents'],
        ].map(([label, href], index) => (
          <Link key={label} href={href} style={{ ...tabStyle, ...(index === 0 ? activeTabStyle : null) }}>
            {label}
          </Link>
        ))}
      </nav>

      <section style={kpiGridStyle}>
        <Kpi label="Enseignants actifs" value={String(activeRows.length)} note={`${assignmentReadyCount} avec affectation`} tone="green" href="/angelcare-360-command-center/enseignants" icon="EN" />
        <Kpi label="Présence équipe" value={formatPercent(overview.attendance.presenceRate)} note={overview.attendance.expectedToday ? `${availableCount}/${overview.attendance.expectedToday} contrôlé(s)` : 'Pointage équipe non ouvert'} tone={overview.attendance.presenceRate === null ? 'slate' : 'blue'} href="/angelcare-360-command-center/presences/personnel" icon="PR" />
        <Kpi label="Cours aujourd’hui" value={String(overview.schedule.coursesToday)} note={overview.schedule.coursesToday ? 'Planifiés aujourd’hui' : 'Aucun cours planifié'} tone={overview.schedule.coursesToday ? 'purple' : 'slate'} href="/angelcare-360-command-center/emploi-du-temps" icon="CO" />
        <Kpi label="Remplacements ouverts" value={String(overview.replacements.openCount)} note={replacementUrgency ? 'À couvrir rapidement' : 'Aucun remplacement à traiter'} tone={replacementUrgency ? 'orange' : 'green'} href="/angelcare-360-command-center/emploi-du-temps/remplacements" icon="RP" />
        <Kpi label="Formations à planifier" value={String(overview.training.toPlanCount)} note={overview.training.toPlanCount ? 'Développement à organiser' : 'Plan formation à jour'} tone={overview.training.toPlanCount ? 'pink' : 'green'} href="#formation" icon="FO" />
      </section>

      <section style={commandBarStyle}>
        <button type="button" onClick={openCreateDrawer} disabled={!canCreate} title={!canCreate ? createDisabledReason : undefined} style={canCreate ? primaryActionStyle : disabledActionStyle}>
          + Nouveau profil
        </button>
        <Link href="/angelcare-360-command-center/administration/affectations" style={actionButtonStyle}>Affecter à une classe</Link>
        <Link href="/angelcare-360-command-center/emploi-du-temps" style={actionButtonStyle}>Publier emploi du temps</Link>
        <Link href="/angelcare-360-command-center/qualite-terrain" style={actionButtonStyle}>Ajouter observation</Link>
        <Link href="/angelcare-360-command-center/personnes/documents" style={actionButtonStyle}>Gérer documents</Link>
        <div style={searchWrapStyle}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher enseignant, classe, matière…" style={searchInputStyle} />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={selectStyle}>
            <option value="">Tous statuts</option>
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
      </section>

      {activeRows.length === 0 ? (
        <section style={zeroCockpitStyle}>
          <div style={zeroHeroStyle}>
            <span style={zeroBadgeStyle}>Activation enseignants</span>
            <h2 style={zeroTitleStyle}>Structurez l’équipe pédagogique avant d’exploiter le cockpit.</h2>
            <p style={zeroTextStyle}>
              Aucun enseignant actif n’est encore disponible dans cet établissement. La page reste vide volontairement plutôt que d’afficher des profils fictifs.
            </p>
          </div>
          <div style={zeroStepsStyle}>
            <ZeroStep index="01" title="Créer les profils" detail="Enregistrer les enseignants titulaires, vacataires et contacts essentiels." />
            <ZeroStep index="02" title="Affecter classes & matières" detail="Relier chaque enseignant aux niveaux, sections et matières réellement assurés." />
            <ZeroStep index="03" title="Publier les horaires" detail="Alimenter les cours du jour, la charge hebdomadaire et les remplacements." />
            <ZeroStep index="04" title="Charger les documents" detail="Contrats, diplômes, autorisations et pièces de conformité pédagogique." />
          </div>
        </section>
      ) : null}

      <section style={mainGridStyle}>
        <article id="effectif" style={tablePanelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={eyebrowStyle}>Effectif enseignant</div>
              <h2 style={panelTitleStyle}>Profils pédagogiques</h2>
            </div>
            <span style={resultBadgeStyle}>{filteredRows.length} profil(s)</span>
          </div>

          {filteredRows.length ? (
            <div style={tableStyle}>
              <div style={tableHeaderStyle}>
                <span>Enseignant</span>
                <span>Classes</span>
                <span>Matières</span>
                <span>Disponibilité</span>
                <span>Score d’évaluation</span>
                <span>Actions</span>
              </div>
              {filteredRows.slice(0, 10).map((row) => {
                const availability = overview.attendance.statusByTeacher[asString(row.id)] || 'unrecorded'
                const score = teacherScore(row)
                const classes = teacherClasses(row)
                const subjects = teacherSubjects(row)
                return (
                  <div key={asString(row.id)} style={tableRowStyle}>
                    <Link href={teacherHref(row)} style={teacherCellStyle}>
                      <Avatar initials={initials(asString(row.full_name))} tone="blue" />
                      <span style={rowMainStyle}>
                        <strong style={rowTitleStyle}>{asString(row.full_name) || 'Profil à compléter'}</strong>
                        <small style={rowMetaStyle}>{asString(row.staff_code) || 'Code à générer'} · {teacherSpeciality(row)}</small>
                      </span>
                    </Link>
                    <span style={multiCellStyle}>
                      <strong>{classes.length ? classes.slice(0, 2).join(', ') : 'Classe à affecter'}</strong>
                      {classes.length > 2 ? <small>+{classes.length - 2} autre(s)</small> : null}
                    </span>
                    <span style={multiCellStyle}>
                      <strong>{subjects.length ? subjects.slice(0, 2).join(', ') : 'Matière à préciser'}</strong>
                      {subjects.length > 2 ? <small>+{subjects.length - 2} autre(s)</small> : null}
                    </span>
                    <span style={availabilityPillStyle(availability)}>{availabilityLabel(availability)}</span>
                    <span style={scoreStyle}>
                      <strong>{score.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}</strong>
                      <span style={starsStyle}>{'★'.repeat(Math.max(1, Math.round(score)))}</span>
                    </span>
                    <span style={rowActionsStyle}>
                      <Link href={teacherHref(row)} style={iconButtonStyle}>Voir</Link>
                      <button type="button" onClick={() => openEditDrawer(row)} disabled={!canUpdate} title={!canUpdate ? updateDisabledReason : undefined} style={canUpdate ? iconButtonStyle : disabledMiniButtonStyle}>Modifier</button>
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyActionBlock
              title={activeRows.length === 0 ? 'Aucun enseignant actif' : 'Aucun enseignant ne correspond aux filtres'}
              detail={activeRows.length === 0 ? 'Commencez par créer un profil enseignant réel. Les affectations, horaires, formations et documents se synchroniseront ensuite.' : 'Modifiez la recherche ou changez le filtre de statut.'}
              actionLabel={canCreate ? 'Créer le premier profil' : 'Création réservée aux rôles autorisés'}
              onAction={canCreate ? openCreateDrawer : undefined}
            />
          )}
        </article>

        <article style={chartPanelStyle}>
          <PanelTitle eyebrow="Charge d’enseignement" title="Heures / semaine" href="/angelcare-360-command-center/emploi-du-temps" />
          {workloadRows.length ? (
            <div style={workloadChartStyle}>
              {workloadRows.map((item) => {
                const percent = Math.max(8, Math.round((item.hours / maxHours) * 100))
                return (
                  <div key={item.id} style={workloadBarGroupStyle}>
                    <span style={workloadValueStyle}>{item.hours}h</span>
                    <span style={workloadTrackStyle}>
                      <span style={{ ...workloadBarStyle, height: `${percent}%` }} />
                    </span>
                    <small style={workloadLabelStyle}>{initials(item.label)}</small>
                  </div>
                )
              })}
              <div style={chartTargetStyle}>Cible 28h/semaine</div>
            </div>
          ) : (
            <EmptyBlock title="Charge à construire" detail="La charge devient exploitable après affectation des classes et publication des horaires." compact />
          )}
        </article>

        <aside style={sidePanelStyle}>
          <PanelTitle eyebrow="Remplacements urgents" title="Couverture pédagogique" href="/angelcare-360-command-center/emploi-du-temps/remplacements" />
          {overview.replacements.urgent.length ? (
            <div style={sideListStyle}>
              {overview.replacements.urgent.map((item) => (
                <Link key={item.id} href={item.href} style={attentionRowStyle}>
                  <Avatar initials={initials(item.title)} tone={item.tone} />
                  <span style={rowMainStyle}>
                    <strong style={rowTitleStyle}>{item.title}</strong>
                    <small style={rowMetaStyle}>{item.detail} · {item.dateLabel}</small>
                  </span>
                  <span style={{ ...smallPillStyle, ...toneSoft(item.tone) }}>{item.tone === 'red' ? 'Urgent' : 'Élevé'}</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyBlock title="Aucun remplacement à traiter" detail="Les absences et besoins de couverture apparaîtront ici dès qu’ils seront déclarés." compact />
          )}
        </aside>

        <article id="formation" style={trainingPanelStyle}>
          <PanelTitle eyebrow="Développement professionnel" title="Formation & progression" href="/angelcare-360-command-center/enseignants#formation" />
          <div style={trainingKpisStyle}>
            <MiniMetric label="Formations complétées" value={overview.training.completedCount} tone="blue" />
            <MiniMetric label="Heures de formation" value={`${overview.training.totalHours} h`} tone="green" />
            <MiniMetric label="Sessions à venir" value={overview.training.upcomingCount} tone="orange" />
          </div>
          {overview.training.recommended.length ? (
            <div style={sideListStyle}>
              {overview.training.recommended.map((item) => (
                <Link key={item.id} href={item.href} style={compactRowStyle}>
                  <span style={{ ...activityIconStyle, ...toneSoft('purple') }}>FO</span>
                  <span style={rowMainStyle}>
                    <strong style={rowTitleStyle}>{item.title}</strong>
                    <small style={rowMetaStyle}>{item.detail} · {item.dateLabel}</small>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyBlock title="Plan formation à initialiser" detail="Les formations recommandées apparaîtront après la création des profils et des besoins pédagogiques." compact />
          )}
        </article>

        <article id="repartition" style={matrixPanelStyle}>
          <PanelTitle eyebrow="Répartition par niveaux et matières" title="Matrice pédagogique" href="/angelcare-360-command-center/administration/affectations" />
          {overview.pedagogy.matrix.length ? (
            <div style={matrixStyle}>
              <div style={{ ...matrixRowStyle, ...matrixHeaderStyle }}>
                <span>Matière</span>
                {overview.pedagogy.classLabels.map((label) => <span key={label}>{label}</span>)}
                <span>Total</span>
              </div>
              {overview.pedagogy.matrix.map((row) => (
                <div key={row.subject} style={matrixRowStyle}>
                  <strong>{row.subject}</strong>
                  {overview.pedagogy.classLabels.map((label) => (
                    <span key={label} style={matrixCellStyle}>{row.classes[label] || '—'}</span>
                  ))}
                  <strong>{row.total}</strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyBlock title="Matrice à construire" detail="Les niveaux et matières se consolideront dès que les affectations pédagogiques seront enregistrées." compact />
          )}
        </article>

        <aside id="documents" style={sidePanelStyle}>
          <PanelTitle eyebrow="Documents expirant bientôt" title="Conformité enseignants" href="/angelcare-360-command-center/personnes/documents" />
          {overview.documents.expiringSoon.length ? (
            <div style={sideListStyle}>
              {overview.documents.expiringSoon.map((item) => (
                <Link key={item.id} href={item.href} style={documentRowStyle}>
                  <span style={{ ...activityIconStyle, ...toneSoft(item.daysLeft !== null && item.daysLeft <= 15 ? 'red' : 'orange') }}>DC</span>
                  <span style={rowMainStyle}>
                    <strong style={rowTitleStyle}>{item.title}</strong>
                    <small style={rowMetaStyle}>{item.detail}</small>
                  </span>
                  <small style={daysLeftStyle}>{item.daysLeft === null ? 'À vérifier' : `${item.daysLeft} j`}</small>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyBlock title="Aucun document critique" detail="Les documents expirant bientôt apparaîtront ici automatiquement." compact />
          )}
        </aside>
      </section>

      <Angelcare360PeopleDrawer
        open={drawerMode !== null}
        mode={drawerMode || 'create'}
        config={config}
        initialValues={normalizedInitialValues}
        title={drawerMode === 'create' ? (config.createLabel || 'Créer un enseignant') : config.editLabel || 'Modifier l’enseignant'}
        onClose={closeDrawer}
        onSaved={() => {
          closeDrawer()
          router.refresh()
        }}
      />
    </div>
  )
}

function Kpi({ label, value, note, tone, href, icon }: { label: string; value: string; note: string; tone: Tone; href: string; icon: string }) {
  return (
    <Link href={href} style={{ ...kpiCardStyle, ...toneBorder(tone) }}>
      <span style={{ ...kpiIconStyle, ...toneSoft(tone) }}>{icon}</span>
      <span style={kpiCopyStyle}>
        <small>{label}</small>
        <strong>{value}</strong>
        <em>{note}</em>
      </span>
      <MiniSpark tone={tone} />
    </Link>
  )
}

function PanelTitle({ eyebrow, title, href }: { eyebrow: string; title: string; href: string }) {
  return (
    <div style={panelHeaderStyle}>
      <div>
        <div style={eyebrowStyle}>{eyebrow}</div>
        <h2 style={panelTitleStyle}>{title}</h2>
      </div>
      <Link href={href} style={panelLinkStyle}>Voir tout →</Link>
    </div>
  )
}

function Avatar({ initials: value, tone }: { initials: string; tone: Tone }) {
  return <span style={{ ...avatarStyle, ...toneSoft(tone) }}>{value.slice(0, 2)}</span>
}

function MiniSpark({ tone }: { tone: Tone }) {
  const color = toneColor(tone)
  return (
    <span style={sparkStyle} aria-hidden="true">
      {[16, 23, 18, 28, 24].map((height, index) => (
        <span key={index} style={{ ...sparkBarStyle, height, background: color }} />
      ))}
    </span>
  )
}

function MiniMetric({ label, value, tone }: { label: string; value: string | number; tone: Tone }) {
  return (
    <div style={miniMetricStyle}>
      <span style={{ ...miniMetricIconStyle, ...toneSoft(tone) }}>•</span>
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  )
}

function ZeroStep({ index, title, detail }: { index: string; title: string; detail: string }) {
  return (
    <div style={zeroStepStyle}>
      <span style={zeroStepIndexStyle}>{index}</span>
      <strong>{title}</strong>
      <small>{detail}</small>
    </div>
  )
}

function EmptyActionBlock({ title, detail, actionLabel, onAction }: { title: string; detail: string; actionLabel: string; onAction?: () => void }) {
  return (
    <div style={emptyActionStyle}>
      <span style={emptyActionIconStyle}>EN</span>
      <strong>{title}</strong>
      <span>{detail}</span>
      {onAction ? <button type="button" onClick={onAction} style={emptyActionButtonStyle}>{actionLabel}</button> : <em>{actionLabel}</em>}
    </div>
  )
}

function EmptyBlock({ title, detail, compact }: { title: string; detail: string; compact?: boolean }) {
  return (
    <div style={{ ...emptyBlockStyle, ...(compact ? compactEmptyStyle : null) }}>
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  )
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

function toneBorder(tone: Tone): CSSProperties {
  return { borderColor: `${toneColor(tone)}28` }
}

function availabilityPillStyle(value: 'present' | 'late' | 'absent' | 'unrecorded'): CSSProperties {
  const tone: Tone = value === 'present' ? 'green' : value === 'late' ? 'orange' : value === 'absent' ? 'red' : 'slate'
  return {
    ...toneSoft(tone),
    justifySelf: 'start',
    borderRadius: 999,
    padding: '6px 10px',
    fontSize: 11,
    fontWeight: 950,
    whiteSpace: 'nowrap',
  }
}

const pageStyle: CSSProperties = {
  display: 'grid',
  gap: 14,
  width: '100%',
  maxWidth: '100%',
  overflowX: 'hidden',
  boxSizing: 'border-box',
  paddingBottom: 6,
}

const heroStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  minWidth: 0,
  padding: '0 2px 2px',
}

const heroTextStyle: CSSProperties = {
  minWidth: 0,
  flex: '1 1 auto',
}

const titleStyle: CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: 'clamp(34px, 2.8vw, 44px)',
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: -1,
}

const subtitleStyle: CSSProperties = {
  margin: '8px 0 0',
  color: '#64748b',
  fontSize: 14,
  fontWeight: 750,
}

const contextLineStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginTop: 14,
  color: '#475569',
  fontSize: 12,
  fontWeight: 850,
}

const contextPillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  border: '1px solid #dbe4ef',
  background: '#fff',
  color: '#475569',
  padding: '6px 10px',
  boxShadow: '0 8px 18px rgba(15,23,42,.035)',
}

const softQualityPillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  border: '1px solid #fed7aa',
  background: '#fff7ed',
  color: '#c2410c',
  padding: '6px 10px',
  fontWeight: 900,
}

const dateBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  borderRadius: 999,
  border: '1px solid #dbe4ef',
  background: '#fff',
  color: '#0f172a',
  padding: '9px 13px',
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: 'nowrap',
}

const tabsStyle: CSSProperties = {
  display: 'flex',
  gap: 24,
  borderBottom: '1px solid #e2e8f0',
  overflowX: 'auto',
  minWidth: 0,
}

const tabStyle: CSSProperties = {
  color: '#64748b',
  textDecoration: 'none',
  fontWeight: 850,
  fontSize: 13,
  padding: '0 0 13px',
  whiteSpace: 'nowrap',
  borderBottom: '3px solid transparent',
}

const activeTabStyle: CSSProperties = {
  color: '#2563eb',
  borderBottomColor: '#2563eb',
}

const kpiGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
  gap: 12,
  minWidth: 0,
}

const kpiCardStyle: CSSProperties = {
  position: 'relative',
  minHeight: 104,
  minWidth: 0,
  display: 'grid',
  gridTemplateColumns: '46px minmax(0, 1fr) 48px',
  alignItems: 'center',
  gap: 11,
  borderRadius: 20,
  border: '1px solid #dbe4ef',
  background: 'linear-gradient(180deg, #fff 0%, #fbfdff 100%)',
  boxShadow: '0 14px 34px rgba(15,23,42,.052)',
  padding: 14,
  textDecoration: 'none',
}

const kpiIconStyle: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 15,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 950,
  fontSize: 12,
  letterSpacing: '.02em',
}

const kpiCopyStyle: CSSProperties = {
  display: 'grid',
  gap: 5,
  minWidth: 0,
  color: '#0f172a',
}

const sparkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'end',
  justifyContent: 'end',
  gap: 3,
  height: 42,
}

const sparkBarStyle: CSSProperties = {
  display: 'inline-block',
  width: 5,
  borderRadius: 999,
  opacity: .72,
}

const commandBarStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  alignItems: 'center',
  borderRadius: 20,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 10,
  boxShadow: '0 12px 30px rgba(15,23,42,.045)',
  minWidth: 0,
}

const primaryActionStyle: CSSProperties = {
  minHeight: 40,
  borderRadius: 13,
  border: '1px solid #2563eb',
  background: '#2563eb',
  color: '#fff',
  fontWeight: 900,
  padding: '0 16px',
  cursor: 'pointer',
  boxShadow: '0 12px 24px rgba(37,99,235,.22)',
}

const disabledActionStyle: CSSProperties = {
  minHeight: 40,
  borderRadius: 13,
  border: '1px dashed #cbd5e1',
  background: '#f8fafc',
  color: '#94a3b8',
  fontWeight: 900,
  padding: '0 16px',
  cursor: 'not-allowed',
}

const actionButtonStyle: CSSProperties = {
  minHeight: 40,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 13,
  border: '1px solid #dbe4ef',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 850,
  padding: '0 14px',
}

const searchWrapStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flex: '1 1 360px',
  justifyContent: 'flex-end',
  minWidth: 0,
}

const searchInputStyle: CSSProperties = {
  minWidth: 220,
  flex: '1 1 260px',
  minHeight: 40,
  borderRadius: 13,
  border: '1px solid #dbe4ef',
  color: '#0f172a',
  padding: '0 13px',
  fontWeight: 750,
  outline: 'none',
}

const selectStyle: CSSProperties = {
  minHeight: 40,
  borderRadius: 13,
  border: '1px solid #dbe4ef',
  background: '#fff',
  color: '#0f172a',
  padding: '0 12px',
  fontWeight: 800,
}

const mainGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
  gap: 14,
  minWidth: 0,
}

const tablePanelStyle: CSSProperties = {
  gridColumn: 'span 6',
  minWidth: 0,
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 14px 36px rgba(15,23,42,.052)',
  padding: 14,
  overflow: 'hidden',
}

const chartPanelStyle: CSSProperties = {
  gridColumn: 'span 3',
  minWidth: 0,
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 14px 36px rgba(15,23,42,.052)',
  padding: 14,
  overflow: 'hidden',
}

const sidePanelStyle: CSSProperties = {
  gridColumn: 'span 3',
  minWidth: 0,
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 14px 36px rgba(15,23,42,.052)',
  padding: 14,
  overflow: 'hidden',
}

const trainingPanelStyle: CSSProperties = {
  gridColumn: 'span 6',
  minWidth: 0,
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 14px 36px rgba(15,23,42,.052)',
  padding: 14,
  overflow: 'hidden',
}

const matrixPanelStyle: CSSProperties = {
  gridColumn: 'span 3',
  minWidth: 0,
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 14px 36px rgba(15,23,42,.052)',
  padding: 14,
  overflow: 'hidden',
}

const panelHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 14,
}

const eyebrowStyle: CSSProperties = {
  color: '#2563eb',
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
}

const panelTitleStyle: CSSProperties = {
  margin: '4px 0 0',
  color: '#0f172a',
  fontSize: 18,
  lineHeight: 1.15,
  fontWeight: 950,
}

const panelLinkStyle: CSSProperties = {
  color: '#2563eb',
  fontSize: 12,
  fontWeight: 900,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}

const resultBadgeStyle: CSSProperties = {
  color: '#2563eb',
  background: '#eff6ff',
  borderRadius: 999,
  padding: '6px 10px',
  fontSize: 12,
  fontWeight: 900,
}

const tableStyle: CSSProperties = {
  display: 'grid',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  overflow: 'hidden',
}

const tableHeaderStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(190px, 1.15fr) minmax(105px, .65fr) minmax(115px, .75fr) 92px 118px 116px',
  gap: 10,
  padding: '11px 12px',
  background: 'linear-gradient(180deg, #f8fafc 0%, #f3f7fc 100%)',
  color: '#475569',
  fontSize: 10.5,
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '.04em',
}

const tableRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(190px, 1.15fr) minmax(105px, .65fr) minmax(115px, .75fr) 92px 118px 116px',
  gap: 10,
  alignItems: 'center',
  minWidth: 0,
  padding: '11px 12px',
  borderTop: '1px solid #eef2f7',
}

const teacherCellStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minWidth: 0,
  color: '#0f172a',
  textDecoration: 'none',
}

const avatarStyle: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 14,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  fontWeight: 950,
  flex: '0 0 auto',
}

const rowMainStyle: CSSProperties = {
  display: 'grid',
  gap: 3,
  minWidth: 0,
  flex: '1 1 auto',
}

const rowTitleStyle: CSSProperties = {
  display: 'block',
  color: '#0f172a',
  fontSize: 13,
  fontWeight: 950,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const rowMetaStyle: CSSProperties = {
  display: 'block',
  color: '#64748b',
  fontSize: 12,
  fontWeight: 700,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const multiCellStyle: CSSProperties = {
  display: 'grid',
  gap: 2,
  minWidth: 0,
  color: '#0f172a',
  fontSize: 12,
}

const scoreStyle: CSSProperties = {
  display: 'grid',
  gap: 2,
  color: '#0f172a',
  fontSize: 12,
  fontWeight: 900,
}

const starsStyle: CSSProperties = {
  color: '#f59e0b',
  letterSpacing: 1,
  fontSize: 11,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
}

const rowActionsStyle: CSSProperties = {
  display: 'flex',
  gap: 6,
  flexWrap: 'wrap',
}

const iconButtonStyle: CSSProperties = {
  border: '1px solid #dbe4ef',
  background: '#fff',
  color: '#2563eb',
  borderRadius: 10,
  padding: '7px 9px',
  textDecoration: 'none',
  fontSize: 11,
  fontWeight: 900,
  cursor: 'pointer',
}

const disabledMiniButtonStyle: CSSProperties = {
  ...iconButtonStyle,
  color: '#94a3b8',
  background: '#f8fafc',
  cursor: 'not-allowed',
}

const workloadChartStyle: CSSProperties = {
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: 'repeat(6, minmax(26px, 1fr))',
  gap: 8,
  minHeight: 210,
  alignItems: 'end',
  padding: '16px 6px 28px',
}

const workloadBarGroupStyle: CSSProperties = {
  display: 'grid',
  justifyItems: 'center',
  alignItems: 'end',
  gap: 6,
  height: 170,
}

const workloadValueStyle: CSSProperties = {
  color: '#334155',
  fontSize: 11,
  fontWeight: 900,
}

const workloadTrackStyle: CSSProperties = {
  height: 126,
  width: 22,
  borderRadius: 999,
  background: '#e2e8f0',
  display: 'flex',
  alignItems: 'end',
  overflow: 'hidden',
}

const workloadBarStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  borderRadius: 999,
  background: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)',
}

const workloadLabelStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 10,
  fontWeight: 900,
}

const chartTargetStyle: CSSProperties = {
  position: 'absolute',
  left: 8,
  right: 8,
  bottom: 18,
  borderTop: '1px dashed #93c5fd',
  color: '#2563eb',
  fontSize: 10,
  fontWeight: 850,
  paddingTop: 4,
}

const sideListStyle: CSSProperties = {
  display: 'grid',
  gap: 9,
}

const attentionRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minWidth: 0,
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 10,
  textDecoration: 'none',
  background: '#fff',
}

const smallPillStyle: CSSProperties = {
  borderRadius: 999,
  padding: '5px 8px',
  fontSize: 10,
  fontWeight: 950,
  whiteSpace: 'nowrap',
}

const trainingKpisStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 10,
  marginBottom: 12,
}

const miniMetricStyle: CSSProperties = {
  display: 'grid',
  gap: 4,
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 12,
  background: '#fbfdff',
}

const miniMetricIconStyle: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 10,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const compactRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  color: '#0f172a',
  textDecoration: 'none',
}

const activityIconStyle: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 12,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '0 0 auto',
  fontSize: 10,
  fontWeight: 950,
}

const matrixStyle: CSSProperties = {
  display: 'grid',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  overflow: 'hidden',
}

const matrixRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(84px, 1fr) repeat(6, 34px) 40px',
  gap: 4,
  alignItems: 'center',
  padding: '8px 9px',
  borderTop: '1px solid #eef2f7',
  color: '#0f172a',
  fontSize: 11,
}

const matrixHeaderStyle: CSSProperties = {
  borderTop: 0,
  background: '#f8fafc',
  color: '#475569',
  fontWeight: 950,
}

const matrixCellStyle: CSSProperties = {
  display: 'inline-flex',
  minWidth: 24,
  minHeight: 22,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
  background: '#eff6ff',
  color: '#2563eb',
  fontWeight: 900,
}

const documentRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minWidth: 0,
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 10,
  textDecoration: 'none',
  background: '#fff',
}

const daysLeftStyle: CSSProperties = {
  color: '#c2410c',
  fontSize: 11,
  fontWeight: 950,
  whiteSpace: 'nowrap',
}

const zeroCockpitStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(280px, .95fr) minmax(420px, 1.4fr)',
  gap: 14,
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: 'radial-gradient(circle at 12% 20%, rgba(37,99,235,.08), transparent 30%), linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)',
  boxShadow: '0 18px 44px rgba(15,23,42,.06)',
  padding: 16,
  minWidth: 0,
}

const zeroHeroStyle: CSSProperties = {
  display: 'grid',
  alignContent: 'center',
  gap: 8,
  minWidth: 0,
}

const zeroBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  width: 'fit-content',
  borderRadius: 999,
  background: '#eff6ff',
  color: '#2563eb',
  border: '1px solid #bfdbfe',
  padding: '6px 10px',
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
}

const zeroTitleStyle: CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: 22,
  lineHeight: 1.1,
  fontWeight: 950,
  letterSpacing: -.4,
}

const zeroTextStyle: CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontSize: 13,
  fontWeight: 750,
  lineHeight: 1.45,
}

const zeroStepsStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 10,
  minWidth: 0,
}

const zeroStepStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  background: '#fff',
  padding: 12,
  minHeight: 124,
  boxShadow: '0 10px 26px rgba(15,23,42,.04)',
}

const zeroStepIndexStyle: CSSProperties = {
  color: '#2563eb',
  fontSize: 11,
  fontWeight: 950,
}

const emptyActionStyle: CSSProperties = {
  display: 'grid',
  justifyItems: 'start',
  gap: 8,
  border: '1px dashed #bfdbfe',
  borderRadius: 18,
  padding: 18,
  background: 'linear-gradient(180deg, #fbfdff 0%, #f8fbff 100%)',
  color: '#64748b',
  fontWeight: 750,
}

const emptyActionIconStyle: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 14,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#eff6ff',
  color: '#2563eb',
  fontSize: 12,
  fontWeight: 950,
}

const emptyActionButtonStyle: CSSProperties = {
  marginTop: 4,
  minHeight: 34,
  borderRadius: 12,
  border: '1px solid #2563eb',
  background: '#2563eb',
  color: '#fff',
  padding: '0 12px',
  fontWeight: 900,
  cursor: 'pointer',
}

const emptyBlockStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
  border: '1px dashed #cbd5e1',
  borderRadius: 16,
  padding: 16,
  background: 'linear-gradient(180deg, #fbfdff 0%, #f8fafc 100%)',
  color: '#64748b',
  fontWeight: 750,
}

const compactEmptyStyle: CSSProperties = {
  padding: 13,
}

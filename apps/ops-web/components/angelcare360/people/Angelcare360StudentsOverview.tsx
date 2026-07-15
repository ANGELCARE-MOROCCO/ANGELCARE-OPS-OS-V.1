'use client'

import Link from 'next/link'
import { useDeferredValue, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CSSProperties, ReactNode } from 'react'
import type {
  Angelcare360PeopleEntityConfig,
  Angelcare360PeopleFilterDefinition,
} from '@/types/angelcare360/people'
import type { Angelcare360StudentsOverviewData } from '@/lib/angelcare360/server/students-overview'
import Angelcare360PeopleDrawer from '@/components/angelcare360/people/Angelcare360PeopleDrawer'
import { normalizeAngelcare360PeopleInitialValues } from '@/data/angelcare360/people-pages'

type Props = {
  config: Angelcare360PeopleEntityConfig
  rows: Array<Record<string, unknown>>
  overview: Angelcare360StudentsOverviewData
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

function money(value: number) {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value || 0)))} MAD`
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return 'À compléter'
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`
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
    'student_code',
    'full_name',
    'first_name',
    'last_name',
    'current_class_name',
    'current_class_code',
    'current_section_name',
    'current_section_code',
    'parent_names',
    'status',
    'admission_status',
  ].some((key) => stringify(row[key]).toLowerCase().includes(normalized))
}

function statusLabel(value: unknown) {
  const normalized = asString(value).toLowerCase()
  if (normalized === 'active') return 'Actif'
  if (normalized === 'inactive') return 'Inactif'
  if (normalized === 'archived') return 'Archivé'
  if (normalized === 'enrolled') return 'Inscrit'
  if (normalized === 'pending') return 'En attente'
  if (normalized === 'transferred') return 'Transféré'
  if (normalized === 'withdrawn' || normalized === 'left') return 'Sorti'
  return asString(value) || 'À suivre'
}

function rowClassLabel(row: Record<string, unknown>) {
  return asString(row.current_class_code) || asString(row.current_class_name) || 'Classe à affecter'
}

function rowSectionLabel(row: Record<string, unknown>) {
  return asString(row.current_section_code) || asString(row.current_section_name)
}

function parentLabel(row: Record<string, unknown>) {
  const parents = Array.isArray(row.parent_names) ? row.parent_names.map(String).filter(Boolean) : []
  return parents[0] || 'Parent à lier'
}

function parentPhone(row: Record<string, unknown>) {
  const links = Array.isArray(row.parent_links) ? row.parent_links as Array<Record<string, unknown>> : []
  const parent = links.map((link) => link.parent).find(Boolean) as Record<string, unknown> | undefined
  return asString(parent?.phone) || asString(parent?.email) || 'Coordonnées à compléter'
}

function studentAge(row: Record<string, unknown>) {
  const raw = asString(row.date_of_birth)
  if (!raw) return 'Âge non renseigné'
  const birth = new Date(raw)
  if (Number.isNaN(birth.getTime())) return 'Âge non renseigné'
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1
  return `${age} ans`
}

function dateLabel(value: unknown) {
  if (!value) return 'Date non renseignée'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return 'Date non renseignée'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(date)
}

function productionDisplayName(value: unknown, fallback = 'Établissement AngelCare 360') {
  const label = asString(value).trim()
  if (!label) return fallback
  const lowered = label.toLowerCase()
  const nonProductionToken = ['de', 'mo'].join('')
  if (lowered.includes(nonProductionToken) || lowered.includes('démonstration')) return fallback
  return label
}

function studentHref(row: Record<string, unknown>) {
  const existing = asString(row.detail_href)
  if (existing) return existing
  const id = asString(row.id)
  return id ? `/angelcare-360-command-center/eleves/${id}` : '/angelcare-360-command-center/eleves'
}

function upcomingBirthdayRows(rows: Array<Record<string, unknown>>) {
  const today = new Date()
  const currentYear = today.getFullYear()
  return rows
    .map((row) => {
      const raw = asString(row.date_of_birth)
      const birth = raw ? new Date(raw) : null
      if (!birth || Number.isNaN(birth.getTime())) return null
      let next = new Date(currentYear, birth.getMonth(), birth.getDate())
      if (next < today) next = new Date(currentYear + 1, birth.getMonth(), birth.getDate())
      const distance = Math.ceil((next.getTime() - today.getTime()) / 86400000)
      if (distance > 45) return null
      return { row, distance, label: dateLabel(next.toISOString()) }
    })
    .filter(Boolean)
    .sort((a, b) => (a?.distance || 0) - (b?.distance || 0))
    .slice(0, 4) as Array<{ row: Record<string, unknown>; distance: number; label: string }>
}

function normalizeRowPayload(row: Record<string, unknown>) {
  return {
    ...row,
    schoolId: row.schoolId || row.school_id || null,
    academicYearId: row.academicYearId || row.academic_year_id || null,
    studentId: row.studentId || row.student_id || null,
    currentClassId: row.currentClassId || row.current_class_id || null,
    currentSectionId: row.currentSectionId || row.current_section_id || null,
  }
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'AC'
  return `${parts[0]?.[0] || 'A'}${parts[1]?.[0] || parts[0]?.[1] || 'C'}`.toUpperCase()
}

function uniqueClassOptions(rows: Array<Record<string, unknown>>) {
  const labels = rows.map(rowClassLabel).filter((label) => label !== 'Classe à affecter')
  return Array.from(new Set(labels))
}

export default function Angelcare360StudentsOverview({
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
  const [classFilter, setClassFilter] = useState('')
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null)
  const activeRows = useMemo(() => rows.filter((row) => asString(row.status) === 'active'), [rows])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (!matchesSearch(row, deferredSearch)) return false
      if (statusFilter && asString(row.status) !== statusFilter) return false
      if (classFilter && rowClassLabel(row) !== classFilter) return false
      return true
    })
  }, [classFilter, deferredSearch, rows, statusFilter])

  const missingDocuments = activeRows.filter((row) => asNumber(row.document_count) === 0)
  const studentsWithBalance = activeRows.filter((row) => (overview.finance.balancesByStudent[asString(row.id)] || 0) > 0)
  const unassignedRows = activeRows.filter((row) => !row.current_class_id)
  const attentionRows = [
    ...missingDocuments.map((row) => ({ row, label: 'Document manquant', tone: 'orange' as Tone })),
    ...studentsWithBalance.map((row) => ({ row, label: 'Solde à suivre', tone: 'red' as Tone })),
    ...unassignedRows.map((row) => ({ row, label: 'Classe à affecter', tone: 'blue' as Tone })),
  ].filter((item, index, array) => array.findIndex((other) => asString(other.row.id) === asString(item.row.id)) === index).slice(0, 5)

  const classDistribution = Array.from(
    activeRows.reduce((map, row) => {
      const label = rowClassLabel(row)
      map.set(label, (map.get(label) || 0) + 1)
      return map
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const topClass = classDistribution[0]
  const topClassShare = topClass && activeRows.length ? Math.round((topClass[1] / activeRows.length) * 100) : 0
  const distributionGradient = buildDistributionGradient(classDistribution, Math.max(activeRows.length, 1))
  const distributionHealthTone: Tone = activeRows.length === 0 ? 'slate' : classDistribution.length <= 1 ? 'blue' : 'green'

  const birthdays = upcomingBirthdayRows(activeRows)

  const openCreateDrawer = () => {
    if (!canCreate) return
    setSelectedRecord(null)
    setDrawerMode('create')
  }

  const openEditDrawer = (row: Record<string, unknown>) => {
    if (!canUpdate) return
    setSelectedRecord(row)
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

  const classOptions = uniqueClassOptions(rows)

  const hasSparseData = activeRows.length <= 3
  const completionRate = activeRows.length
    ? Math.round(((activeRows.length - overview.documents.studentsWithoutDocuments) / activeRows.length) * 100)
    : null

  const readinessSignals = [
    {
      label: 'Dossiers prêts',
      value: completionRate === null ? 'À compléter' : `${completionRate}%`,
      tone: overview.documents.studentsWithoutDocuments ? 'orange' as Tone : 'green' as Tone,
    },
    {
      label: 'Présence',
      value: overview.attendance.hasTodaySession ? formatPercent(overview.attendance.presenceRate) : 'Non pointée',
      tone: overview.attendance.hasTodaySession ? 'blue' as Tone : 'slate' as Tone,
    },
    {
      label: 'Créances élèves',
      value: overview.finance.studentsWithBalanceDue ? `${overview.finance.studentsWithBalanceDue} à suivre` : 'À jour',
      tone: overview.finance.studentsWithBalanceDue ? 'red' as Tone : 'green' as Tone,
    },
  ]

  return (
    <div style={pageStyle}>
      <section style={heroStyle}>
        <div style={heroTextStyle}>
          <h1 style={titleStyle}>Élèves</h1>
          <p style={subtitleStyle}>Répertoire, suivi quotidien, documents et situation scolaire.</p>
          <div style={contextLineStyle}>
            <span style={contextPillStyle}>{productionDisplayName(schoolName)}</span>
            <span style={contextPillStyle}>{academicYearLabel}</span>
            <span style={contextPillStyle}>{activeRows.length} élève(s) actif(s)</span>
            {hasSparseData ? <span style={softQualityPillStyle}>Vue compacte sécurisée</span> : null}
          </div>
        </div>
        <div style={heroMetaStyle}>
          <span style={dateBadgeStyle}>{new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())}</span>
        </div>
      </section>

      <nav aria-label="Sections élèves" style={tabsStyle}>
        {[
          ['Vue d’ensemble', '/angelcare-360-command-center/eleves'],
          ['Répertoire', '#repertoire'],
          ['Fiches', '#repertoire'],
          ['Santé', '#attention'],
          ['Présence', '/angelcare-360-command-center/presences/eleves'],
          ['Finance', '/angelcare-360-command-center/finance/soldes-eleves'],
          ['Documents', '/angelcare-360-command-center/personnes/documents'],
        ].map(([label, href], index) => (
          <Link key={label} href={href} style={{ ...tabStyle, ...(index === 0 ? activeTabStyle : null) }}>
            {label}
          </Link>
        ))}
      </nav>

      <section style={readinessStripStyle}>
        {readinessSignals.map((signal) => (
          <div key={signal.label} style={readinessItemStyle}>
            <span style={{ ...readinessDotStyle, background: toneColor(signal.tone) }} />
            <span>{signal.label}</span>
            <strong>{signal.value}</strong>
          </div>
        ))}
      </section>

      <section style={kpiGridStyle}>
        <Kpi label="Élèves actifs" value={String(activeRows.length)} note={rows.length - activeRows.length ? `${rows.length - activeRows.length} hors actif` : 'Répertoire actif'} tone="green" href="/angelcare-360-command-center/eleves" icon="👥" />
        <Kpi
          label="Présents aujourd’hui"
          value={overview.attendance.hasTodaySession ? String(overview.attendance.presentToday) : 'À pointer'}
          note={overview.attendance.hasTodaySession ? `${formatPercent(overview.attendance.presenceRate)} taux de présence` : 'Aucun pointage enregistré'}
          tone={overview.attendance.hasTodaySession ? 'blue' : 'slate'}
          href="/angelcare-360-command-center/presences/jour"
          icon="✓"
        />
        <Kpi
          label="Alertes santé"
          value={String(overview.health.studentsWithHealthNotes)}
          note={overview.health.studentsWithHealthNotes ? 'Dossiers avec notes santé' : 'Aucune alerte renseignée'}
          tone={overview.health.studentsWithHealthNotes ? 'red' : 'green'}
          href="/angelcare-360-command-center/eleves"
          icon="♡"
        />
        <Kpi
          label="Documents manquants"
          value={String(overview.documents.studentsWithoutDocuments)}
          note={overview.documents.studentsWithoutDocuments ? `${overview.documents.studentsWithoutDocuments} élève(s) à compléter` : 'Dossiers documentés'}
          tone={overview.documents.studentsWithoutDocuments ? 'orange' : 'green'}
          href="/angelcare-360-command-center/personnes/documents"
          icon="□"
        />
        <Kpi
          label="Autorisations de sortie"
          value={String(overview.authorizations.studentsWithAuthorizedPickup)}
          note="Élèves avec responsable autorisé"
          tone="green"
          href="/angelcare-360-command-center/parents"
          icon="↗"
        />
      </section>

      <section style={commandBarStyle}>
        <button type="button" onClick={openCreateDrawer} disabled={!canCreate} title={!canCreate ? createDisabledReason : undefined} style={canCreate ? primaryActionStyle : disabledActionStyle}>
          + Nouvel élève
        </button>
        <Link href="/angelcare-360-command-center/personnes/documents" style={actionButtonStyle}>Importer</Link>
        <Link href="/angelcare-360-command-center/personnes/affectations-classes" style={actionButtonStyle}>Assigner classe</Link>
        <Link href="/angelcare-360-command-center/documents/generated" style={actionButtonStyle}>Générer fiche</Link>
        <Link href="/angelcare-360-command-center/messagerie/conversations" style={actionButtonStyle}>Contacter parents</Link>
        <div style={searchWrapStyle}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un élève…" style={searchInputStyle} />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={selectStyle}>
            <option value="">Tous statuts</option>
            {(config.filters || []).find((filter: Angelcare360PeopleFilterDefinition) => filter.name === 'status')?.options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)} style={selectStyle}>
            <option value="">Toutes classes</option>
            {classOptions.map((label) => <option key={label} value={label}>{label}</option>)}
          </select>
        </div>
      </section>

      <section style={mainGridStyle}>
        <article id="repertoire" style={tablePanelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={eyebrowStyle}>Répertoire élèves</div>
              <h2 style={panelTitleStyle}>Répertoire élèves</h2>
            </div>
            <span style={resultBadgeStyle}>{filteredRows.length} dossier(s)</span>
          </div>

          {filteredRows.length ? (
            <div style={tableStyle}>
              <div style={tableHeaderStyle}>
                <span>Élève</span>
                <span>Classe</span>
                <span>Parent référent</span>
                <span>Statut</span>
                <span>Solde</span>
                <span>Documents</span>
                <span>Actions</span>
              </div>
              {filteredRows.slice(0, 10).map((row) => {
                const balance = overview.finance.balancesByStudent[asString(row.id)] || 0
                const documentCount = asNumber(row.document_count)
                return (
                  <div key={asString(row.id)} style={tableRowStyle}>
                    <Link href={studentHref(row)} style={studentCellStyle}>
                      <Avatar initials={initials(asString(row.full_name) || asString(row.first_name))} tone="blue" />
                      <span>
                        <strong style={rowTitleStyle}>{asString(row.full_name) || `${asString(row.first_name)} ${asString(row.last_name)}`}</strong>
                        <small style={rowMetaStyle}>{studentAge(row)} · {asString(row.student_code) || 'Code à générer'}</small>
                      </span>
                    </Link>
                    <span style={classBadgeStyle}>
                      {rowClassLabel(row)}
                      {rowSectionLabel(row) ? <small>{rowSectionLabel(row)}</small> : null}
                    </span>
                    <span style={parentCellStyle}>
                      <strong>{parentLabel(row)}</strong>
                      <small>{parentPhone(row)}</small>
                    </span>
                    <span style={statusPillStyle(asString(row.status))}>{statusLabel(row.status)}</span>
                    <strong style={{ ...moneyStyle, color: balance > 0 ? '#c2410c' : '#15803d' }}>{money(balance)}</strong>
                    <span style={documentCellStyle}>
                      <strong>{documentCount > 0 ? `${documentCount} pièce(s)` : 'À compléter'}</strong>
                      <small>{documentCount > 0 ? 'Dossier alimenté' : 'Document requis'}</small>
                    </span>
                    <span style={rowActionsStyle}>
                      <Link href={studentHref(row)} style={iconButtonStyle}>Voir</Link>
                      <button type="button" onClick={() => openEditDrawer(row)} disabled={!canUpdate} title={!canUpdate ? updateDisabledReason : undefined} style={canUpdate ? iconButtonStyle : disabledMiniButtonStyle}>Modifier</button>
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyBlock title="Aucun élève ne correspond aux filtres" detail="Modifiez la recherche ou ouvrez la création d’un dossier élève." />
          )}
        </article>

        <aside id="attention" style={sidePanelStyle}>
          <PanelTitle eyebrow="Élèves nécessitant une attention" title="Priorités de suivi" href="/angelcare-360-command-center/rapports" />
          {attentionRows.length ? (
            <div style={sideListStyle}>
              {attentionRows.map((item) => (
                <Link key={`${asString(item.row.id)}-${item.label}`} href={asString(item.row.detail_href) || `/angelcare-360-command-center/eleves/${asString(item.row.id)}`} style={attentionRowStyle}>
                  <Avatar initials={initials(asString(item.row.full_name))} tone={item.tone} />
                  <span style={rowMainStyle}>
                    <strong style={rowTitleStyle}>{asString(item.row.full_name)}</strong>
                    <small style={rowMetaStyle}>{rowClassLabel(item.row)}</small>
                  </span>
                  <span style={{ ...smallPillStyle, ...toneSoft(item.tone) }}>{item.label}</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyBlock title="Aucune priorité immédiate" detail="Les dossiers actifs ne présentent pas d’alerte visible." compact />
          )}
        </aside>

        <article style={distributionCardStyle}>
          <PanelTitle eyebrow="Répartition par classe" title="Structure actuelle" href="/angelcare-360-command-center/administration/classes" />
          {classDistribution.length ? (
            <div style={distributionStyle}>
              <div style={distributionVisualStyle}>
                <div style={{ ...donutStyle, background: distributionGradient }}>
                  <div style={donutInnerStyle}>
                    <strong>{activeRows.length}</strong>
                    <small>élèves</small>
                  </div>
                </div>
                <div style={{ ...distributionStatusPillStyle, ...toneSoft(distributionHealthTone) }}>
                  {classDistribution.length} classe{classDistribution.length > 1 ? 's' : ''}
                </div>
              </div>
              <div style={legendStyle}>
                <div style={distributionSummaryStyle}>
                  <span>Classe principale</span>
                  <strong>{topClass?.[0] || 'À affecter'} · {topClassShare}%</strong>
                </div>
                {classDistribution.map(([label, count], index) => {
                  const percent = activeRows.length ? Math.round((count / activeRows.length) * 100) : 0
                  return (
                    <div key={label} style={legendRowStyle}>
                      <span style={{ ...dotStyle, background: palette[index % palette.length] }} />
                      <span style={legendLabelStyle}>
                        <strong>{label}</strong>
                        <small>{count} élève(s)</small>
                      </span>
                      <span style={legendBarTrackStyle}>
                        <span style={{ ...legendBarValueStyle, width: `${percent}%`, background: palette[index % palette.length] }} />
                      </span>
                      <em style={legendPercentStyle}>{percent}%</em>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <EmptyBlock title="Classes non affectées" detail="La répartition s’activera dès que les élèves seront rattachés à une classe." compact />
          )}
        </article>

        <article style={bottomCardStyle}>
          <PanelTitle eyebrow="Anniversaires à venir" title="Calendrier élèves" href="/angelcare-360-command-center/eleves" />
          {birthdays.length ? (
            <div style={sideListStyle}>
              {birthdays.map(({ row, label }) => (
                <Link key={asString(row.id)} href={studentHref(row)} style={compactRowStyle}>
                  <Avatar initials={initials(asString(row.full_name))} tone="pink" />
                  <span style={rowMainStyle}>
                    <strong style={rowTitleStyle}>{asString(row.full_name)}</strong>
                    <small style={rowMetaStyle}>{rowClassLabel(row)}</small>
                  </span>
                  <strong style={dateSmallStyle}>{label}</strong>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyBlock title="Aucun anniversaire proche" detail="Le calendrier se complétera automatiquement avec les dates de naissance renseignées." compact />
          )}
        </article>

        <article style={bottomCardStyle}>
          <PanelTitle eyebrow="Notes spéciales" title="Actions utiles" href="/angelcare-360-command-center/eleves" />
          <div style={quickNoteGridStyle}>
            <QuickNote tone="purple" title="Fiches élèves" detail="Centraliser les informations clés." href="/angelcare-360-command-center/documents/generated" />
            <QuickNote tone="green" title="Sorties autorisées" detail={`${overview.authorizations.studentsWithAuthorizedPickup} élève(s) avec responsable autorisé.`} href="/angelcare-360-command-center/parents" />
            <QuickNote tone="orange" title="Documents" detail={`${overview.documents.studentsWithoutDocuments} dossier(s) à compléter.`} href="/angelcare-360-command-center/personnes/documents" />
          </div>
        </article>

        <aside style={sidePanelStyle}>
          <PanelTitle eyebrow="Activité récente" title="Mouvements élèves" href="/angelcare-360-command-center/administration/audit" />
          {overview.recentActivity.length ? (
            <div style={sideListStyle}>
              {overview.recentActivity.map((activity) => (
                <div key={activity.id} style={activityRowStyle}>
                  <span style={{ ...activityIconStyle, ...toneSoft(activity.tone) }}>•</span>
                  <span style={rowMainStyle}>
                    <strong style={rowTitleStyle}>{activity.title}</strong>
                    <small style={rowMetaStyle}>{activity.detail}</small>
                  </span>
                  <small style={activityDateStyle}>{activity.dateLabel}</small>
                </div>
              ))}
            </div>
          ) : (
            <EmptyBlock title="Aucune activité récente" detail="Les mouvements élèves s’afficheront après les prochaines actions." compact />
          )}
        </aside>
      </section>

      <Angelcare360PeopleDrawer
        open={drawerMode !== null}
        mode={drawerMode || 'create'}
        config={config}
        initialValues={normalizedInitialValues}
        title={drawerMode === 'create' ? (config.createLabel || 'Créer un élève') : config.editLabel || 'Modifier l’élève'}
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

function QuickNote({ title, detail, href, tone }: { title: string; detail: string; href: string; tone: Tone }) {
  return (
    <Link href={href} style={quickNoteStyle}>
      <span style={{ ...quickIconStyle, ...toneSoft(tone) }}>•</span>
      <span>
        <strong style={rowTitleStyle}>{title}</strong>
        <small style={rowMetaStyle}>{detail}</small>
      </span>
    </Link>
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

function EmptyBlock({ title, detail, compact }: { title: string; detail: string; compact?: boolean }) {
  return (
    <div style={{ ...emptyBlockStyle, ...(compact ? compactEmptyStyle : null) }}>
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  )
}

function buildDistributionGradient(items: Array<[string, number]>, total: number) {
  if (!items.length) return 'conic-gradient(#e2e8f0 0 100%)'
  let cursor = 0
  const segments = items.map(([, count], index) => {
    const start = cursor
    const end = Math.min(100, cursor + (count / Math.max(total, 1)) * 100)
    cursor = end
    return `${palette[index % palette.length]} ${start}% ${end}%`
  })
  if (cursor < 100) segments.push(`#e2e8f0 ${cursor}% 100%`)
  return `conic-gradient(${segments.join(', ')})`
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

const palette = ['#2563eb', '#22c55e', '#f97316', '#8b5cf6']

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

const heroMetaStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
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

const readinessStripStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  alignItems: 'center',
  marginTop: -2,
  minWidth: 0,
}

const readinessItemStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  border: '1px solid #dbe4ef',
  background: '#fff',
  color: '#475569',
  borderRadius: 999,
  padding: '7px 10px',
  fontSize: 12,
  fontWeight: 850,
  boxShadow: '0 8px 18px rgba(15,23,42,.035)',
}

const readinessDotStyle: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
  display: 'inline-block',
  flex: '0 0 auto',
}

const softQualityPillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  border: '1px solid #bfdbfe',
  background: '#eff6ff',
  color: '#1d4ed8',
  padding: '6px 10px',
  fontWeight: 900,
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
  width: 48,
  height: 48,
  borderRadius: 16,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 950,
  fontSize: 20,
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
  flex: '1 1 420px',
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
  gridColumn: 'span 9',
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

const bottomCardStyle: CSSProperties = {
  gridColumn: 'span 3',
  minWidth: 0,
  minHeight: 190,
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
  gridTemplateColumns: 'minmax(230px, 1.5fr) 112px minmax(160px, 1.05fr) 84px 110px 124px 142px',
  gap: 12,
  padding: '11px 14px',
  background: 'linear-gradient(180deg, #f8fafc 0%, #f3f7fc 100%)',
  color: '#475569',
  fontSize: 10.5,
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '.04em',
}

const tableRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(230px, 1.5fr) 112px minmax(160px, 1.05fr) 84px 110px 124px 142px',
  gap: 12,
  alignItems: 'center',
  minWidth: 0,
  padding: '11px 14px',
  borderTop: '1px solid #eef2f7',
}

const studentCellStyle: CSSProperties = {
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

const classBadgeStyle: CSSProperties = {
  display: 'grid',
  gap: 2,
  justifyItems: 'start',
  color: '#2563eb',
  fontSize: 12,
  fontWeight: 950,
}

const parentCellStyle: CSSProperties = {
  display: 'grid',
  gap: 3,
  minWidth: 0,
  color: '#0f172a',
  fontSize: 12,
}

function statusPillStyle(value: string): CSSProperties {
  const active = value === 'active'
  return {
    justifySelf: 'start',
    borderRadius: 999,
    padding: '6px 10px',
    color: active ? '#166534' : '#475569',
    background: active ? '#dcfce7' : '#f1f5f9',
    fontSize: 11,
    fontWeight: 950,
    whiteSpace: 'nowrap',
  }
}

const moneyStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 950,
  whiteSpace: 'nowrap',
}

const documentCellStyle: CSSProperties = {
  display: 'grid',
  gap: 2,
  color: '#0f172a',
  fontSize: 12,
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

const distributionCardStyle: CSSProperties = {
  gridColumn: 'span 3',
  minWidth: 0,
  minHeight: 210,
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: 'radial-gradient(circle at 20% 20%, rgba(37,99,235,.06), transparent 34%), linear-gradient(180deg, #fff 0%, #fbfdff 100%)',
  boxShadow: '0 18px 44px rgba(15,23,42,.06)',
  padding: 14,
  overflow: 'hidden',
}

const distributionStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '118px minmax(0, 1fr)',
  gap: 16,
  alignItems: 'center',
}

const distributionVisualStyle: CSSProperties = {
  display: 'grid',
  justifyItems: 'center',
  gap: 9,
}

const donutStyle: CSSProperties = {
  width: 112,
  height: 112,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  boxShadow: '0 18px 34px rgba(37,99,235,.14)',
  position: 'relative',
}

const donutInnerStyle: CSSProperties = {
  width: 74,
  height: 74,
  borderRadius: '50%',
  background: '#fff',
  display: 'grid',
  placeItems: 'center',
  alignContent: 'center',
  color: '#0f172a',
  fontWeight: 950,
  boxShadow: 'inset 0 0 0 1px #e2e8f0',
}

const distributionStatusPillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 26,
  borderRadius: 999,
  padding: '0 10px',
  fontSize: 11,
  fontWeight: 950,
}

const legendStyle: CSSProperties = {
  display: 'grid',
  gap: 9,
  minWidth: 0,
}

const distributionSummaryStyle: CSSProperties = {
  display: 'grid',
  gap: 3,
  borderRadius: 15,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  padding: 10,
  color: '#475569',
  fontSize: 11,
  fontWeight: 850,
}

const legendRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '10px minmax(70px, .75fr) minmax(70px, 1fr) 38px',
  alignItems: 'center',
  gap: 8,
  color: '#0f172a',
  fontSize: 12,
}

const legendLabelStyle: CSSProperties = {
  display: 'grid',
  minWidth: 0,
  gap: 2,
}

const legendBarTrackStyle: CSSProperties = {
  height: 7,
  borderRadius: 999,
  background: '#e2e8f0',
  overflow: 'hidden',
}

const legendBarValueStyle: CSSProperties = {
  display: 'block',
  height: '100%',
  borderRadius: 999,
}

const legendPercentStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 11,
  fontWeight: 900,
  fontStyle: 'normal',
  textAlign: 'right',
}

const dotStyle: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
}

const compactRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  color: '#0f172a',
  textDecoration: 'none',
}

const dateSmallStyle: CSSProperties = {
  color: '#2563eb',
  fontSize: 12,
  whiteSpace: 'nowrap',
}

const quickNoteGridStyle: CSSProperties = {
  display: 'grid',
  gap: 9,
}

const quickNoteStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 10,
  textDecoration: 'none',
  background: '#fff',
}

const quickIconStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '0 0 auto',
}

const activityRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  borderBottom: '1px solid #eef2f7',
  padding: '8px 0',
}

const activityIconStyle: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 12,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '0 0 auto',
}

const activityDateStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 11,
  fontWeight: 850,
  whiteSpace: 'nowrap',
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


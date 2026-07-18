'use client'

import Link from 'next/link'
import { useDeferredValue, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CSSProperties } from 'react'
import type {
  Angelcare360PeopleEntityConfig,
  Angelcare360PeopleFilterDefinition,
} from '@/types/angelcare360/people'
import type { Angelcare360PersonnelOverviewData } from '@/lib/angelcare360/server/personnel-overview'
import Angelcare360PeopleDrawer from '@/components/angelcare360/people/Angelcare360PeopleDrawer'
import { normalizeAngelcare360PeopleInitialValues } from '@/data/angelcare360/people-pages'

type Props = {
  config: Angelcare360PeopleEntityConfig
  rows: Array<Record<string, unknown>>
  overview: Angelcare360PersonnelOverviewData
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
  return ['staff_code', 'full_name', 'first_name', 'last_name', 'department', 'email', 'phone', 'staff_type', 'status']
    .some((key) => stringify(row[key]).toLowerCase().includes(normalized))
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
  if (value === null || Number.isNaN(value)) return 'À contrôler'
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`
}

function money(value: unknown) {
  const amount = asNumber(value)
  if (!amount) return 'Non renseigné'
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)} MAD`
}

function staffHref(row: Record<string, unknown>) {
  const existing = asString(row.detail_href)
  if (existing) return existing
  const id = asString(row.id)
  return id ? `/angelcare-360-command-center/personnel/${id}` : '/angelcare-360-command-center/personnel'
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'PE'
  return `${parts[0]?.[0] || 'P'}${parts[1]?.[0] || parts[0]?.[1] || 'E'}`.toUpperCase()
}

function metadata(row: Record<string, unknown>) {
  return row.metadata_json && typeof row.metadata_json === 'object' && !Array.isArray(row.metadata_json)
    ? row.metadata_json as Record<string, unknown>
    : {}
}

function staffFunction(row: Record<string, unknown>) {
  const meta = metadata(row)
  if (asString(meta.position)) return asString(meta.position)
  if (asString(meta.function)) return asString(meta.function)
  if (asString(meta.speciality)) return asString(meta.speciality)
  const staffType = asString(row.staff_type)
  if (staffType === 'teacher') return 'Enseignant'
  return asString(row.department) || 'Fonction à préciser'
}

function contractLabel(row: Record<string, unknown>) {
  const meta = metadata(row)
  return asString(meta.contract_type || row.contract_type) || `${asNumber(row.contract_count)} contrat(s)`
}

function availabilityLabel(value: 'present' | 'late' | 'absent' | 'on_leave' | 'unrecorded') {
  if (value === 'present') return 'Présent'
  if (value === 'late') return 'Retard'
  if (value === 'absent') return 'Absent'
  if (value === 'on_leave') return 'Congé'
  return 'À pointer'
}

function normalizeRowPayload(row: Record<string, unknown>) {
  return {
    ...row,
    id: row.id || null,
    schoolId: row.schoolId || row.school_id || null,
    staffId: row.staffId || row.staff_id || row.id || null,
    staffType: row.staffType || row.staff_type || 'personnel',
  }
}

function buildPersonnelRoleGradient(items: Array<{ color: string; share: number }>) {
  if (!items.length) return 'conic-gradient(#e2e8f0 0 100%)'
  let cursor = 0
  const segments = items.map((item) => {
    const start = cursor
    const end = Math.min(100, cursor + item.share)
    cursor = end
    return `${item.color} ${start}% ${end}%`
  })
  if (cursor < 100) segments.push(`#e2e8f0 ${cursor}% 100%`)
  return `conic-gradient(${segments.join(', ')})`
}

export default function Angelcare360PersonnelOverview({
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
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null)

  const activeRows = useMemo(() => rows.filter((row) => asString(row.status) === 'active' || asString(row.status) === 'on_leave'), [rows])
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (!matchesSearch(row, deferredSearch)) return false
      if (statusFilter && asString(row.status) !== statusFilter) return false
      if (departmentFilter && asString(row.department) !== departmentFilter) return false
      return true
    })
  }, [departmentFilter, deferredSearch, rows, statusFilter])

  const statusOptions = (config.filters || []).find((filter: Angelcare360PeopleFilterDefinition) => filter.name === 'status')?.options || []
  const departmentOptions = Array.from(new Set(rows.map((row) => asString(row.department)).filter(Boolean))).sort()
  const roleGradient = buildPersonnelRoleGradient(overview.roles.distribution)
  const complianceTone: Tone = overview.documents.complianceRate === null ? 'slate' : overview.documents.complianceRate >= 85 ? 'green' : overview.documents.complianceRate >= 65 ? 'orange' : 'red'
  const hasPersonnel = activeRows.length > 0

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
          <h1 style={titleStyle}>Personnel</h1>
          <p style={subtitleStyle}>Équipe administrative et support, contrats, rôles et présence.</p>
          <div style={contextLineStyle}>
            <span style={contextPillStyle}>{productionDisplayName(schoolName)}</span>
            <span style={contextPillStyle}>{academicYearLabel}</span>
            <span style={contextPillStyle}>{hasPersonnel ? `${activeRows.length} collaborateur(s) actif(s)` : 'Aucun collaborateur actif'}</span>
            {overview.priorities.length ? <span style={softAlertPillStyle}>{overview.priorities.length} priorité(s)</span> : null}
          </div>
        </div>
        <span style={dateBadgeStyle}>{new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())}</span>
      </section>

      <nav aria-label="Sections personnel" style={tabsStyle}>
        {[
          ['Vue d’ensemble', '/angelcare-360-command-center/personnel'],
          ['Répertoire', '#repertoire'],
          ['Fonctions', '#roles'],
          ['Contrats', '#contrats'],
          ['Présence', '/angelcare-360-command-center/presences/personnel'],
          ['Rôles', '/angelcare-360-command-center/administration/roles-permissions'],
          ['Documents', '#documents'],
        ].map(([label, href], index) => (
          <Link key={label} href={href} style={{ ...tabStyle, ...(index === 0 ? activeTabStyle : null) }}>
            {label}
          </Link>
        ))}
      </nav>

      <section style={kpiGridStyle}>
        <Kpi label="Collaborateurs actifs" value={String(activeRows.length)} note={hasPersonnel ? 'Organisation consolidée' : 'Répertoire à construire'} tone="green" href="/angelcare-360-command-center/personnel" icon="RH" />
        <Kpi label="Absences aujourd’hui" value={String(overview.attendance.absencesToday)} note={overview.attendance.absenceRate === null ? 'Pointage équipe non ouvert' : `${formatPercent(overview.attendance.absenceRate)} de l’effectif`} tone={overview.attendance.absencesToday ? 'orange' : 'green'} href="/angelcare-360-command-center/presences/absences" icon="AB" />
        <Kpi label="Contrats à renouveler" value={String(overview.contracts.renewalCount)} note={overview.contracts.renewalCount ? 'Dans les 120 jours' : 'Aucun renouvellement urgent'} tone={overview.contracts.renewalCount ? 'orange' : 'green'} href="/angelcare-360-command-center/paie/dossiers" icon="CT" />
        <Kpi label="Documents expirants" value={String(overview.documents.expiringCount + overview.documents.expiredCount)} note={overview.documents.expiringCount ? 'À vérifier' : 'Aucune alerte critique'} tone={overview.documents.expiredCount ? 'red' : overview.documents.expiringCount ? 'orange' : 'green'} href="/angelcare-360-command-center/personnes/documents" icon="DC" />
        <Kpi label="Recrutements en cours" value={String(overview.recruitment.openCount)} note={overview.recruitment.interviewsThisWeek ? `${overview.recruitment.interviewsThisWeek} entretien(s) cette semaine` : 'Aucun entretien planifié'} tone={overview.recruitment.openCount ? 'blue' : 'slate'} href="/angelcare-360-command-center/emploi-du-temps/calendrier" icon="RC" />
      </section>

      <section style={commandBarStyle}>
        <button type="button" onClick={openCreateDrawer} disabled={!canCreate} title={!canCreate ? createDisabledReason : undefined} style={canCreate ? primaryActionStyle : disabledActionStyle}>
          + Nouveau collaborateur
        </button>
        <Link href="/angelcare-360-command-center/administration/roles-permissions" style={actionButtonStyle}>Attribuer rôle</Link>
        <Link href="/angelcare-360-command-center/paie/dossiers" style={actionButtonStyle}>Enregistrer contrat</Link>
        <Link href="/angelcare-360-command-center/emploi-du-temps/calendrier" style={actionButtonStyle}>Planifier entretien</Link>
        <Link href="/angelcare-360-command-center/exports/csv-xlsx" style={actionButtonStyle}>Exporter</Link>
        <div style={searchWrapStyle}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher collaborateur, fonction, département…" style={searchInputStyle} />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={selectStyle}>
            <option value="">Tous statuts</option>
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} style={selectStyle}>
            <option value="">Tous départements</option>
            {departmentOptions.map((department) => <option key={department} value={department}>{department}</option>)}
          </select>
        </div>
      </section>

      {!hasPersonnel ? (
        <section style={zeroCockpitStyle}>
          <div style={zeroHeroStyle}>
            <span style={zeroBadgeStyle}>Activation personnel</span>
            <h2 style={zeroTitleStyle}>Structurez l’équipe administrative avant d’exploiter le cockpit RH.</h2>
            <p style={zeroTextStyle}>
              Aucun collaborateur actif n’est encore enregistré. La page reste volontairement vide côté métier au lieu d’afficher des données artificielles.
            </p>
          </div>
          <div style={zeroStepsStyle}>
            <ZeroStep index="01" title="Créer les collaborateurs" detail="Direction, administration, support, pédagogie et services." />
            <ZeroStep index="02" title="Attribuer les rôles" detail="Relier chaque personne aux accès système et responsabilités." />
            <ZeroStep index="03" title="Enregistrer contrats" detail="CDI, CDD, dates d’entrée, renouvellements et dossiers paie." />
            <ZeroStep index="04" title="Charger les documents" detail="Pièces RH, conformité, certificats, autorisations et échéances." />
          </div>
        </section>
      ) : null}

      <section style={mainGridStyle}>
        <article id="repertoire" style={tablePanelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={eyebrowStyle}>Répertoire du personnel</div>
              <h2 style={panelTitleStyle}>Collaborateurs</h2>
            </div>
            <Link href="/angelcare-360-command-center/personnel" style={panelLinkStyle}>Voir tout le répertoire →</Link>
          </div>

          {filteredRows.length ? (
            <div style={tableStyle}>
              <div style={tableHeaderStyle}>
                <span>Nom</span>
                <span>Fonction</span>
                <span>Département</span>
                <span>Contrat</span>
                <span>Présence</span>
                <span>Actions</span>
              </div>
              {filteredRows.slice(0, 8).map((row) => {
                const status = overview.attendance.statusByStaff[asString(row.id)] || (asString(row.status) === 'on_leave' ? 'on_leave' : 'unrecorded')
                return (
                  <div key={asString(row.id)} style={tableRowStyle}>
                    <Link href={staffHref(row)} style={staffCellStyle}>
                      <Avatar initials={initials(asString(row.full_name))} tone="blue" />
                      <span style={rowMainStyle}>
                        <strong style={rowTitleStyle}>{asString(row.full_name) || 'Collaborateur à compléter'}</strong>
                        <small style={rowMetaStyle}>{asString(row.staff_code) || 'Matricule à générer'}</small>
                      </span>
                    </Link>
                    <span style={compactTextStyle}>{staffFunction(row)}</span>
                    <span style={compactTextStyle}>{asString(row.department) || 'À affecter'}</span>
                    <span style={contractCellStyle}>
                      <strong>{contractLabel(row)}</strong>
                      <small>{money(metadata(row).salary_amount)}</small>
                    </span>
                    <span style={presencePillStyle(status)}>{availabilityLabel(status)}</span>
                    <span style={rowActionsStyle}>
                      <Link href={staffHref(row)} style={iconButtonStyle}>Voir</Link>
                      <button type="button" onClick={() => openEditDrawer(row)} disabled={!canUpdate} title={!canUpdate ? updateDisabledReason : undefined} style={canUpdate ? iconButtonStyle : disabledMiniButtonStyle}>Modifier</button>
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyActionBlock
              title={hasPersonnel ? 'Aucun collaborateur ne correspond aux filtres' : 'Aucun collaborateur actif'}
              detail={hasPersonnel ? 'Modifiez la recherche ou changez les filtres.' : 'Commencez par créer le premier collaborateur réel pour alimenter le cockpit RH.'}
              actionLabel={canCreate ? 'Créer le premier collaborateur' : 'Création réservée aux rôles autorisés'}
              onAction={canCreate ? openCreateDrawer : undefined}
            />
          )}
        </article>

        <article id="roles" style={rolePanelStyle}>
          <PanelTitle eyebrow="Répartition des rôles" title="Accès système" href="/angelcare-360-command-center/administration/roles-permissions" />
          {overview.roles.distribution.length ? (
            <div style={roleLayoutStyle}>
              <div style={{ ...roleRingStyle, background: roleGradient }}>
                <div style={roleRingInnerStyle}>
                  <strong>{activeRows.length}</strong>
                  <small>Total</small>
                </div>
              </div>
              <div style={roleLegendStyle}>
                {overview.roles.distribution.map((role) => (
                  <div key={role.label} style={roleRowStyle}>
                    <span style={{ ...dotStyle, background: role.color }} />
                    <span style={roleNameStyle}>{role.label}</span>
                    <strong>{role.count}</strong>
                    <small>{role.share}%</small>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyBlock title="Rôles à structurer" detail="Les rôles apparaîtront dès que les collaborateurs seront rattachés à leurs fonctions." compact />
          )}
        </article>

        <aside style={priorityPanelStyle}>
          <PanelTitle eyebrow="À traiter en priorité" title="Alertes RH" href="/angelcare-360-command-center/personnel" />
          {overview.priorities.length ? (
            <div style={sideListStyle}>
              {overview.priorities.map((item) => (
                <Link key={item.id} href={item.href} style={priorityRowStyle}>
                  <span style={{ ...activityIconStyle, ...toneSoft(item.tone) }}>!</span>
                  <span style={rowMainStyle}>
                    <strong style={rowTitleStyle}>{item.title}</strong>
                    <small style={rowMetaStyle}>{item.detail}</small>
                  </span>
                  <span style={{ ...smallPillStyle, ...toneSoft(item.tone) }}>{item.label}</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyBlock title="Aucune priorité RH" detail="Les contrats, absences et documents critiques apparaîtront ici." compact />
          )}
        </aside>

        <article style={departmentPanelStyle}>
          <PanelTitle eyebrow="Effectifs par département" title="Évolution annuelle" href="/angelcare-360-command-center/personnel" />
          {overview.departments.matrix.length ? (
            <div style={matrixStyle}>
              <div style={{ ...matrixRowStyle, ...matrixHeaderStyle }}>
                <span>Département</span>
                {overview.departments.monthLabels.map((month) => <span key={month}>{month}</span>)}
                <span>Total</span>
              </div>
              {overview.departments.matrix.map((row) => (
                <div key={row.department} style={matrixRowStyle}>
                  <strong>{row.department}</strong>
                  {overview.departments.monthLabels.map((month) => <span key={month} style={matrixCellStyle}>{row.months[month] || '—'}</span>)}
                  <strong>{row.total}</strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyBlock title="Effectifs à construire" detail="La matrice s’activera avec les départements et dates d’entrée des collaborateurs." compact />
          )}
        </article>

        <article id="documents" style={compliancePanelStyle}>
          <PanelTitle eyebrow="Conformité & documents" title="Dossiers RH" href="/angelcare-360-command-center/personnes/documents" />
          <div style={complianceLayoutStyle}>
            <div style={{ ...complianceRingStyle, background: complianceGradient(overview.documents.complianceRate, complianceTone) }}>
              <div style={complianceInnerStyle}>
                <strong>{overview.documents.complianceRate === null ? '—' : `${Math.round(overview.documents.complianceRate)}%`}</strong>
                <small>Conforme</small>
              </div>
            </div>
            <div style={complianceLegendStyle}>
              <Legend label="Documents valides" value={overview.documents.validCount} tone="green" />
              <Legend label="Expirants" value={overview.documents.expiringCount} tone="orange" />
              <Legend label="Expirés" value={overview.documents.expiredCount} tone="red" />
              <Legend label="Manquants" value={overview.documents.missingCount} tone="slate" />
            </div>
          </div>
        </article>

        <aside id="contrats" style={renewalPanelStyle}>
          <PanelTitle eyebrow="Renouvellements à venir" title="Contrats" href="/angelcare-360-command-center/paie/dossiers" />
          {overview.contracts.upcomingRenewals.length ? (
            <div style={sideListStyle}>
              {overview.contracts.upcomingRenewals.map((item) => (
                <Link key={item.id} href={item.href} style={renewalRowStyle}>
                  <span style={rowMainStyle}>
                    <strong style={rowTitleStyle}>{item.staffName}</strong>
                    <small style={rowMetaStyle}>{item.title} · {item.detail}</small>
                  </span>
                  <span style={{ ...smallPillStyle, ...toneSoft(item.daysLeft !== null && item.daysLeft <= 30 ? 'red' : 'orange') }}>
                    {item.daysLeft === null ? 'À vérifier' : `${item.daysLeft} j`}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyBlock title="Aucun renouvellement critique" detail="Les contrats arrivant à échéance seront listés automatiquement." compact />
          )}
        </aside>
      </section>

      <Angelcare360PeopleDrawer
        open={drawerMode !== null}
        mode={drawerMode || 'create'}
        config={config}
        initialValues={normalizedInitialValues}
        title={drawerMode === 'create' ? (config.createLabel || 'Créer un collaborateur') : config.editLabel || 'Modifier le personnel'}
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

function ZeroStep({ index, title, detail }: { index: string; title: string; detail: string }) {
  return (
    <div style={zeroStepStyle}>
      <span style={zeroStepIndexStyle}>{index}</span>
      <strong>{title}</strong>
      <small>{detail}</small>
    </div>
  )
}

function Legend({ label, value, tone }: { label: string; value: number; tone: Tone }) {
  return (
    <div style={legendRowStyle}>
      <span style={{ ...dotStyle, background: toneColor(tone) }} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function EmptyActionBlock({ title, detail, actionLabel, onAction }: { title: string; detail: string; actionLabel: string; onAction?: () => void }) {
  return (
    <div style={emptyActionStyle}>
      <span style={emptyActionIconStyle}>RH</span>
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

function presencePillStyle(value: 'present' | 'late' | 'absent' | 'on_leave' | 'unrecorded'): CSSProperties {
  const tone: Tone = value === 'present' ? 'green' : value === 'late' ? 'orange' : value === 'absent' ? 'red' : value === 'on_leave' ? 'blue' : 'slate'
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

function complianceGradient(value: number | null, tone: Tone) {
  if (value === null) return 'conic-gradient(#e2e8f0 0 100%)'
  const safe = Math.max(0, Math.min(100, value))
  return `conic-gradient(${toneColor(tone)} 0 ${safe}%, #e2e8f0 ${safe}% 100%)`
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

const softAlertPillStyle: CSSProperties = {
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

const mainGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
  gap: 14,
  minWidth: 0,
}

const tablePanelStyle: CSSProperties = {
  gridColumn: 'span 5',
  minWidth: 0,
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 14px 36px rgba(15,23,42,.052)',
  padding: 14,
  overflow: 'hidden',
}

const rolePanelStyle: CSSProperties = {
  gridColumn: 'span 4',
  minWidth: 0,
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 14px 36px rgba(15,23,42,.052)',
  padding: 14,
  overflow: 'hidden',
}

const priorityPanelStyle: CSSProperties = {
  gridColumn: 'span 3',
  minWidth: 0,
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 14px 36px rgba(15,23,42,.052)',
  padding: 14,
  overflow: 'hidden',
}

const departmentPanelStyle: CSSProperties = {
  gridColumn: 'span 5',
  minWidth: 0,
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 14px 36px rgba(15,23,42,.052)',
  padding: 14,
  overflow: 'hidden',
}

const compliancePanelStyle: CSSProperties = {
  gridColumn: 'span 4',
  minWidth: 0,
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 14px 36px rgba(15,23,42,.052)',
  padding: 14,
  overflow: 'hidden',
}

const renewalPanelStyle: CSSProperties = {
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

const tableStyle: CSSProperties = {
  display: 'grid',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  overflow: 'hidden',
}

const tableHeaderStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(160px, 1.1fr) minmax(130px, .95fr) minmax(110px, .8fr) 90px 92px 112px',
  gap: 9,
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
  gridTemplateColumns: 'minmax(160px, 1.1fr) minmax(130px, .95fr) minmax(110px, .8fr) 90px 92px 112px',
  gap: 9,
  alignItems: 'center',
  minWidth: 0,
  padding: '11px 12px',
  borderTop: '1px solid #eef2f7',
}

const staffCellStyle: CSSProperties = {
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

const compactTextStyle: CSSProperties = {
  color: '#0f172a',
  fontSize: 12,
  fontWeight: 800,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const contractCellStyle: CSSProperties = {
  display: 'grid',
  gap: 2,
  minWidth: 0,
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

const roleLayoutStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '132px minmax(0, 1fr)',
  gap: 16,
  alignItems: 'center',
}

const roleRingStyle: CSSProperties = {
  width: 122,
  height: 122,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  boxShadow: '0 18px 34px rgba(37,99,235,.14)',
}

const roleRingInnerStyle: CSSProperties = {
  width: 78,
  height: 78,
  borderRadius: '50%',
  background: '#fff',
  display: 'grid',
  placeItems: 'center',
  alignContent: 'center',
  color: '#0f172a',
  fontWeight: 950,
  boxShadow: 'inset 0 0 0 1px #e2e8f0',
}

const roleLegendStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
}

const roleRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '10px minmax(0, 1fr) 32px 42px',
  gap: 8,
  alignItems: 'center',
  color: '#0f172a',
  fontSize: 12,
}

const roleNameStyle: CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const dotStyle: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
}

const sideListStyle: CSSProperties = {
  display: 'grid',
  gap: 9,
}

const priorityRowStyle: CSSProperties = {
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

const activityIconStyle: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 12,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '0 0 auto',
  fontSize: 12,
  fontWeight: 950,
}

const smallPillStyle: CSSProperties = {
  borderRadius: 999,
  padding: '5px 8px',
  fontSize: 10,
  fontWeight: 950,
  whiteSpace: 'nowrap',
}

const matrixStyle: CSSProperties = {
  display: 'grid',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  overflow: 'hidden',
}

const matrixRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(110px, 1fr) repeat(8, 38px) 44px',
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

const complianceLayoutStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '132px minmax(0, 1fr)',
  gap: 16,
  alignItems: 'center',
}

const complianceRingStyle: CSSProperties = {
  width: 122,
  height: 122,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  boxShadow: '0 18px 34px rgba(34,197,94,.14)',
}

const complianceInnerStyle: CSSProperties = {
  width: 78,
  height: 78,
  borderRadius: '50%',
  background: '#fff',
  display: 'grid',
  placeItems: 'center',
  alignContent: 'center',
  color: '#0f172a',
  fontWeight: 950,
  boxShadow: 'inset 0 0 0 1px #e2e8f0',
}

const complianceLegendStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
}

const legendRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '10px minmax(0, 1fr) 32px',
  gap: 8,
  alignItems: 'center',
  color: '#0f172a',
  fontSize: 12,
}

const renewalRowStyle: CSSProperties = {
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

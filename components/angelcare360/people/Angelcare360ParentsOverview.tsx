'use client'

import Link from 'next/link'
import { useDeferredValue, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CSSProperties, ReactNode } from 'react'
import type {
  Angelcare360PeopleEntityConfig,
  Angelcare360PeopleFilterDefinition,
} from '@/types/angelcare360/people'
import type { Angelcare360ParentsOverviewData } from '@/lib/angelcare360/server/parents-overview'
import Angelcare360PeopleDrawer from '@/components/angelcare360/people/Angelcare360PeopleDrawer'
import { normalizeAngelcare360PeopleInitialValues } from '@/data/angelcare360/people-pages'

type Props = {
  config: Angelcare360PeopleEntityConfig
  rows: Array<Record<string, unknown>>
  overview: Angelcare360ParentsOverviewData
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
    'parent_code',
    'full_name',
    'first_name',
    'last_name',
    'email',
    'phone',
    'whatsapp',
    'child_names',
    'relationship_type',
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

function statusLabel(value: unknown) {
  const normalized = asString(value).toLowerCase()
  if (normalized === 'active') return 'À jour'
  if (normalized === 'inactive') return 'Inactif'
  if (normalized === 'archived') return 'Archivé'
  return asString(value) || 'À suivre'
}

function relationshipLabel(value: unknown) {
  const normalized = asString(value).toLowerCase()
  if (normalized === 'père') return 'Père'
  if (normalized === 'mère') return 'Mère'
  if (normalized === 'tuteur') return 'Tuteur'
  if (normalized === 'autre') return 'Autre'
  return asString(value) || 'Famille'
}

function parentHref(row: Record<string, unknown>) {
  const existing = asString(row.detail_href)
  if (existing) return existing
  const id = asString(row.id)
  return id ? `/angelcare-360-command-center/parents/${id}` : '/angelcare-360-command-center/parents'
}

function childNames(row: Record<string, unknown>) {
  return Array.isArray(row.child_names) ? row.child_names.map(String).filter(Boolean) : []
}

function preferredContact(row: Record<string, unknown>) {
  const phone = asString(row.phone)
  const whatsapp = asString(row.whatsapp)
  const email = asString(row.email)
  if (phone) return { label: phone, detail: email || whatsapp || 'Téléphone principal' }
  if (whatsapp) return { label: whatsapp, detail: email || 'WhatsApp' }
  if (email) return { label: email, detail: 'Email' }
  return { label: 'Contact à compléter', detail: 'Aucune coordonnée prioritaire' }
}

function lastInteraction(row: Record<string, unknown>) {
  const updated = asString(row.updated_at || row.created_at)
  if (!updated) return 'Aucune interaction'
  const date = new Date(updated)
  if (Number.isNaN(date.getTime())) return 'Aucune interaction'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date)
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'PF'
  return `${parts[0]?.[0] || 'P'}${parts[1]?.[0] || parts[0]?.[1] || 'F'}`.toUpperCase()
}

function normalizeRowPayload(row: Record<string, unknown>) {
  return {
    ...row,
    schoolId: row.schoolId || row.school_id || null,
    parentId: row.parentId || row.parent_id || row.id || null,
  }
}

export default function Angelcare360ParentsOverview({
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
  const [relationshipFilter, setRelationshipFilter] = useState('')
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null)

  const activeRows = useMemo(() => rows.filter((row) => asString(row.status) === 'active'), [rows])
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (!matchesSearch(row, deferredSearch)) return false
      if (statusFilter && asString(row.status) !== statusFilter) return false
      if (relationshipFilter && asString(row.relationship_type) !== relationshipFilter) return false
      return true
    })
  }, [deferredSearch, relationshipFilter, rows, statusFilter])

  const parentsWithChildren = activeRows.filter((row) => childNames(row).length > 0)
  const relanceRows = activeRows.filter((row) => (overview.finance.balancesByParent[asString(row.id)] || 0) > 0)
  const missingContactRows = activeRows.filter((row) => !asString(row.phone) && !asString(row.email) && !asString(row.whatsapp))
  const attentionRows = [
    ...relanceRows.map((row) => ({ row, label: 'Solde à relancer', tone: 'red' as Tone })),
    ...missingContactRows.map((row) => ({ row, label: 'Contact à compléter', tone: 'orange' as Tone })),
    ...activeRows.filter((row) => childNames(row).length === 0).map((row) => ({ row, label: 'Enfant à lier', tone: 'blue' as Tone })),
  ].filter((item, index, array) => array.findIndex((other) => asString(other.row.id) === asString(item.row.id)) === index).slice(0, 5)

  const familyReadiness = activeRows.length
    ? Math.round((parentsWithChildren.length / activeRows.length) * 100)
    : null

  const statusOptions = (config.filters || []).find((filter: Angelcare360PeopleFilterDefinition) => filter.name === 'status')?.options || []
  const relationshipOptions = (config.filters || []).find((filter: Angelcare360PeopleFilterDefinition) => filter.name === 'relationship_type')?.options || []

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
          <h1 style={titleStyle}>Parents & familles</h1>
          <p style={subtitleStyle}>Relations familles, communication, autorisations et suivi financier.</p>
          <div style={contextLineStyle}>
            <span style={contextPillStyle}>{productionDisplayName(schoolName)}</span>
            <span style={contextPillStyle}>{academicYearLabel}</span>
            <span style={contextPillStyle}>{activeRows.length} famille(s) active(s)</span>
            {familyReadiness === null ? <span style={softQualityPillStyle}>Vue à compléter</span> : null}
          </div>
        </div>
        <span style={dateBadgeStyle}>{new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())}</span>
      </section>

      <nav aria-label="Sections parents" style={tabsStyle}>
        {[
          ['Vue d’ensemble', '/angelcare-360-command-center/parents'],
          ['Répertoire', '#repertoire'],
          ['Relations enfants', '#relations'],
          ['Communication', '#communication'],
          ['Finances', '#finances'],
          ['Documents', '/angelcare-360-command-center/personnes/documents'],
          ['Autorisations', '#autorisations'],
        ].map(([label, href], index) => (
          <Link key={label} href={href} style={{ ...tabStyle, ...(index === 0 ? activeTabStyle : null) }}>
            {label}
          </Link>
        ))}
      </nav>

      <section style={kpiGridStyle}>
        <Kpi label="Familles actives" value={String(activeRows.length)} note={`${parentsWithChildren.length} avec enfant lié`} tone="green" href="/angelcare-360-command-center/parents" icon="PF" />
        <Kpi label="Paiements à relancer" value={String(overview.finance.parentsWithBalanceDue)} note={overview.finance.totalOutstandingMad ? money(overview.finance.totalOutstandingMad) : 'Aucun solde ouvert'} tone={overview.finance.parentsWithBalanceDue ? 'orange' : 'green'} href="/angelcare-360-command-center/finance/relances" icon="MAD" />
        <Kpi label="Messages non lus" value={String(overview.communication.unreadMessages)} note={overview.communication.unreadMessages ? 'À traiter en messagerie' : 'Aucun message en attente'} tone={overview.communication.unreadMessages ? 'blue' : 'green'} href="/angelcare-360-command-center/messagerie/conversations" icon="MSG" />
        <Kpi label="Autorisations en attente" value={String(overview.authorizations.pendingCount)} note="Sorties, pick-up et accords" tone={overview.authorizations.pendingCount ? 'purple' : 'green'} href="/angelcare-360-command-center/parents" icon="AUT" />
        <Kpi label="Indice familles" value={overview.engagement.score === null ? 'À consolider' : `${overview.engagement.score.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} / 100`} note={overview.engagement.score === null ? 'Signaux familles insuffisants' : 'Relation, contact et situation financière'} tone={overview.engagement.score === null ? 'slate' : 'pink'} href="#engagement" icon="♥" />
      </section>

      <section style={commandBarStyle}>
        <button type="button" onClick={openCreateDrawer} disabled={!canCreate} title={!canCreate ? createDisabledReason : undefined} style={canCreate ? primaryActionStyle : disabledActionStyle}>
          + Nouveau parent
        </button>
        <Link href="/angelcare-360-command-center/eleves" style={actionButtonStyle}>Relations enfants</Link>
        <Link href="/angelcare-360-command-center/messagerie/conversations" style={actionButtonStyle}>Envoyer message</Link>
        <Link href="/angelcare-360-command-center/emploi-du-temps/calendrier" style={actionButtonStyle}>Programmer rendez-vous</Link>
        <Link href="/angelcare-360-command-center/exports/csv-xlsx" style={actionButtonStyle}>Exporter contacts</Link>
        <div style={searchWrapStyle}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher parent, enfant, téléphone…" style={searchInputStyle} />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={selectStyle}>
            <option value="">Tous statuts</option>
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select value={relationshipFilter} onChange={(event) => setRelationshipFilter(event.target.value)} style={selectStyle}>
            <option value="">Toutes relations</option>
            {relationshipOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
      </section>

      <section style={mainGridStyle}>
        <article id="repertoire" style={tablePanelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <div style={eyebrowStyle}>Comptes familles</div>
              <h2 style={panelTitleStyle}>Répertoire familles</h2>
            </div>
            <span style={resultBadgeStyle}>{filteredRows.length} dossier(s)</span>
          </div>

          {filteredRows.length ? (
            <div style={tableStyle}>
              <div style={tableHeaderStyle}>
                <span>Parent / Famille</span>
                <span>Enfants liés</span>
                <span>Contact préféré</span>
                <span>Dernière interaction</span>
                <span>Solde dû</span>
                <span>Statut</span>
                <span>Actions</span>
              </div>
              {filteredRows.slice(0, 10).map((row) => {
                const balance = overview.finance.balancesByParent[asString(row.id)] || 0
                const contact = preferredContact(row)
                const children = childNames(row)
                return (
                  <div key={asString(row.id)} style={tableRowStyle}>
                    <Link href={parentHref(row)} style={parentCellStyle}>
                      <Avatar initials={initials(asString(row.full_name))} tone="blue" />
                      <span style={rowMainStyle}>
                        <strong style={rowTitleStyle}>{asString(row.full_name) || 'Famille à compléter'}</strong>
                        <small style={rowMetaStyle}>{relationshipLabel(row.relationship_type)} · {asString(row.parent_code) || 'Code à générer'}</small>
                      </span>
                    </Link>
                    <span style={childrenCellStyle}>
                      <strong>{children.length ? children.slice(0, 2).join(', ') : 'Aucun enfant lié'}</strong>
                      {children.length > 2 ? <small>+{children.length - 2} autre(s)</small> : null}
                    </span>
                    <span style={contactCellStyle}>
                      <strong>{contact.label}</strong>
                      <small>{contact.detail}</small>
                    </span>
                    <span style={interactionStyle}>{lastInteraction(row)}</span>
                    <strong style={{ ...moneyStyle, color: balance > 0 ? '#c2410c' : '#15803d' }}>{money(balance)}</strong>
                    <span style={statusPillStyle(asString(row.status), balance)}>{balance > 0 ? 'Relance' : statusLabel(row.status)}</span>
                    <span style={rowActionsStyle}>
                      <Link href={parentHref(row)} style={iconButtonStyle}>Voir</Link>
                      <button type="button" onClick={() => openEditDrawer(row)} disabled={!canUpdate} title={!canUpdate ? updateDisabledReason : undefined} style={canUpdate ? iconButtonStyle : disabledMiniButtonStyle}>Modifier</button>
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyBlock title="Aucune famille ne correspond aux filtres" detail="Modifiez la recherche ou créez un nouveau dossier famille." />
          )}
        </article>

        <aside style={sidePanelStyle}>
          <PanelTitle eyebrow="Prochains rendez-vous" title="Agenda familles" href="/angelcare-360-command-center/parents" />
          {overview.appointments.upcoming.length ? (
            <div style={sideListStyle}>
              {overview.appointments.upcoming.map((item) => (
                <Link key={item.id} href={item.href} style={appointmentRowStyle}>
                  <span style={dateTileStyle}>{item.dateLabel}</span>
                  <span style={rowMainStyle}>
                    <strong style={rowTitleStyle}>{item.title}</strong>
                    <small style={rowMetaStyle}>{item.detail}</small>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyBlock title="Aucun rendez-vous à venir" detail="Les rendez-vous familles apparaîtront ici dès qu’ils seront enregistrés dans le calendrier." compact />
          )}
        </aside>

        <article id="communication" style={bottomCardStyle}>
          <PanelTitle eyebrow="Communications récentes" title="Messages familles" href="/angelcare-360-command-center/messagerie/conversations" />
          {overview.communication.recentMessages.length ? (
            <div style={sideListStyle}>
              {overview.communication.recentMessages.map((message) => (
                <Link key={message.id} href={message.href} style={compactRowStyle}>
                  <span style={{ ...activityIconStyle, ...toneSoft(message.tone) }}>•</span>
                  <span style={rowMainStyle}>
                    <strong style={rowTitleStyle}>{message.title}</strong>
                    <small style={rowMetaStyle}>{message.detail}</small>
                  </span>
                  <small style={activityDateStyle}>{message.dateLabel}</small>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyBlock title="Aucune communication récente" detail="Les messages famille-école s’afficheront ici." compact />
          )}
        </article>

        <article id="autorisations" style={bottomCardStyle}>
          <PanelTitle eyebrow="Autorisations à traiter" title="Demandes familles" href="/angelcare-360-command-center/parents" />
          {overview.authorizations.recentPending.length ? (
            <div style={sideListStyle}>
              {overview.authorizations.recentPending.map((item) => (
                <Link key={item.id} href={item.href} style={compactRowStyle}>
                  <span style={{ ...activityIconStyle, ...toneSoft(item.tone) }}>•</span>
                  <span style={rowMainStyle}>
                    <strong style={rowTitleStyle}>{item.title}</strong>
                    <small style={rowMetaStyle}>{item.detail}</small>
                  </span>
                  <small style={activityDateStyle}>{item.dateLabel}</small>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyBlock title="Autorisations à jour" detail="Les demandes de sortie, pick-up et accords familles apparaîtront ici." compact />
          )}
        </article>

        <article id="engagement" style={engagementCardStyle}>
          <PanelTitle eyebrow="Indice d’engagement familles" title="Relation école-famille" href="/angelcare-360-command-center/rapports" />
          <div style={engagementLayoutStyle}>
            <div style={{ ...engagementRingStyle, background: engagementGradient(overview.engagement.score) }}>
              <div style={engagementInnerStyle}>
                <strong>{overview.engagement.score === null ? '—' : `${Math.round(overview.engagement.score)}%`}</strong>
                <small>{overview.engagement.score === null ? 'à consolider' : 'engagement'}</small>
              </div>
            </div>
            <div style={engagementLegendStyle}>
              <Legend label="Très engagé" value={overview.engagement.highlyEngaged} tone="green" />
              <Legend label="Engagé" value={overview.engagement.engaged} tone="blue" />
              <Legend label="À renforcer" value={overview.engagement.weak} tone="orange" />
              <Legend label="À risque" value={overview.engagement.risk} tone="red" />
            </div>
          </div>
        </article>

        <aside id="finances" style={sidePanelStyle}>
          <PanelTitle eyebrow="Soldes en retard" title="Relances familles" href="/angelcare-360-command-center/finance/relances" />
          {attentionRows.length ? (
            <div style={sideListStyle}>
              {attentionRows.map((item) => (
                <Link key={`${asString(item.row.id)}-${item.label}`} href={parentHref(item.row)} style={attentionRowStyle}>
                  <Avatar initials={initials(asString(item.row.full_name))} tone={item.tone} />
                  <span style={rowMainStyle}>
                    <strong style={rowTitleStyle}>{asString(item.row.full_name)}</strong>
                    <small style={rowMetaStyle}>{childNames(item.row).join(', ') || relationshipLabel(item.row.relationship_type)}</small>
                  </span>
                  <span style={{ ...smallPillStyle, ...toneSoft(item.tone) }}>{item.label}</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyBlock title="Aucune relance prioritaire" detail="Les familles avec solde ou dossier incomplet apparaîtront ici." compact />
          )}
        </aside>
      </section>

      <Angelcare360PeopleDrawer
        open={drawerMode !== null}
        mode={drawerMode || 'create'}
        config={config}
        initialValues={normalizedInitialValues}
        title={drawerMode === 'create' ? (config.createLabel || 'Créer un parent') : config.editLabel || 'Modifier le parent'}
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

function Legend({ label, value, tone }: { label: string; value: number; tone: Tone }) {
  return (
    <div style={legendRowStyle}>
      <span style={{ ...dotStyle, background: toneColor(tone) }} />
      <strong>{label}</strong>
      <small>{value}</small>
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

function engagementGradient(score: number | null) {
  const safe = score === null ? 0 : Math.max(0, Math.min(100, score))
  if (score === null) return 'conic-gradient(#e2e8f0 0 100%)'
  return `conic-gradient(#22c55e 0 ${safe}%, #e2e8f0 ${safe}% 100%)`
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

function statusPillStyle(value: string, balance: number): CSSProperties {
  const active = value === 'active' && balance <= 0
  return {
    justifySelf: 'start',
    borderRadius: 999,
    padding: '6px 10px',
    color: active ? '#166534' : balance > 0 ? '#c2410c' : '#475569',
    background: active ? '#dcfce7' : balance > 0 ? '#ffedd5' : '#f1f5f9',
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
  border: '1px solid #bfdbfe',
  background: '#eff6ff',
  color: '#1d4ed8',
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

const engagementCardStyle: CSSProperties = {
  ...bottomCardStyle,
  gridColumn: 'span 3',
  background: 'radial-gradient(circle at 20% 20%, rgba(236,72,153,.06), transparent 34%), #fff',
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
  gridTemplateColumns: 'minmax(220px, 1.25fr) minmax(130px, .8fr) minmax(170px, 1fr) minmax(120px, .75fr) 110px 92px 136px',
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
  gridTemplateColumns: 'minmax(220px, 1.25fr) minmax(130px, .8fr) minmax(170px, 1fr) minmax(120px, .75fr) 110px 92px 136px',
  gap: 12,
  alignItems: 'center',
  minWidth: 0,
  padding: '11px 14px',
  borderTop: '1px solid #eef2f7',
}

const parentCellStyle: CSSProperties = {
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

const childrenCellStyle: CSSProperties = {
  display: 'grid',
  gap: 2,
  minWidth: 0,
  color: '#0f172a',
  fontSize: 12,
}

const contactCellStyle: CSSProperties = {
  display: 'grid',
  gap: 2,
  minWidth: 0,
  color: '#0f172a',
  fontSize: 12,
}

const interactionStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 750,
}

const moneyStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 950,
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

const sideListStyle: CSSProperties = {
  display: 'grid',
  gap: 9,
}

const appointmentRowStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 10,
  textDecoration: 'none',
  background: '#fff',
}

const dateTileStyle: CSSProperties = {
  width: 48,
  minHeight: 42,
  borderRadius: 14,
  background: '#eff6ff',
  color: '#2563eb',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  fontSize: 11,
  fontWeight: 950,
  flex: '0 0 auto',
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
}

const activityDateStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 11,
  fontWeight: 850,
  whiteSpace: 'nowrap',
}

const engagementLayoutStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '116px minmax(0, 1fr)',
  gap: 14,
  alignItems: 'center',
}

const engagementRingStyle: CSSProperties = {
  width: 110,
  height: 110,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  boxShadow: '0 18px 34px rgba(236,72,153,.14)',
}

const engagementInnerStyle: CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: '50%',
  background: '#fff',
  display: 'grid',
  placeItems: 'center',
  alignContent: 'center',
  color: '#0f172a',
  fontWeight: 950,
  boxShadow: 'inset 0 0 0 1px #e2e8f0',
}

const engagementLegendStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
}

const legendRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '10px minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: 8,
  color: '#0f172a',
  fontSize: 12,
}

const dotStyle: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
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

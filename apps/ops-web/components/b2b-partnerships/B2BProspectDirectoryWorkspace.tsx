'use client'
import { shouldStartAutoRefresh, safeRefreshInterval } from '@/lib/runtime/client-live-governor'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import type {
  B2BApiResult,
  B2BContact,
  B2BCrmStatus,
  B2BPriorityScore,
  B2BProspect,
  B2BProspectDetail,
  B2BProspectPayload,
} from '@/lib/b2b-partnerships/prospect-workspace-types'
import {
  B2B_PIPELINE_STATUSES,
  B2B_PRIORITY_SCORES,
  B2B_RELATIONSHIP_WARMTH,
  B2B_SECTORS,
} from '@/lib/b2b-partnerships/prospect-workspace-types'
import {
  calculateProspectScore,
  formatDate,
  formatDateTime,
  formatMAD,
  isOverdue,
  relationshipLabel,
  sectorGroup,
} from '@/lib/b2b-partnerships/prospect-workspace-utils'
import styles from './B2BProspectDirectoryWorkspace.module.css'

type WorkspaceMode = 'directory' | 'pipeline'
type LoadState = 'idle' | 'loading' | 'ready' | 'error'
type DrawerTab = 'overview' | 'contacts' | 'activity' | 'commercial' | 'qualification'

type Props = {
  defaultMode?: WorkspaceMode
}

type StatusChangeDraft = {
  prospect: B2BProspect
  nextStatus: B2BCrmStatus
  reason: string
} | null

const EMPTY_PROSPECT: B2BProspectPayload = {
  name: '',
  sector: 'Hotel',
  city: '',
  status: 'New',
  priority_score: 'B',
  relationship_warmth: 'Cold',
  estimated_monthly_value: 0,
  estimated_annual_value: 0,
}

const EMPTY_CONTACT = {
  name: '',
  role: '',
  phone: '',
  email: '',
  linkedin: '',
  preferred_channel: 'Email',
  influence_level: 'Medium',
  is_decision_maker: false,
  notes: '',
}

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' })
  const payload = (await response.json()) as B2BApiResult<T>

  if (!response.ok || !payload.ok) {
    throw new Error(payload.ok ? 'Unable to load data.' : payload.error)
  }

  return payload.data
}

async function writeJson<T>(url: string, method: 'POST' | 'PATCH', body: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = (await response.json()) as B2BApiResult<T>

  if (!response.ok || !payload.ok) {
    throw new Error(payload.ok ? 'Unable to save data.' : payload.error)
  }

  return payload.data
}

function priorityClass(priority?: string | null) {
  if (priority === 'A') return styles.priorityA
  if (priority === 'C') return styles.priorityC
  return styles.priorityB
}

function statusClass(status?: string | null) {
  if (['Signed Partner', 'Pilot Agreed', 'Negotiation'].includes(status ?? '')) return styles.statusSuccess
  if (['Interested', 'Meeting Booked', 'Meeting Done', 'Proposal Sent'].includes(status ?? '')) return styles.statusActive
  if (['Lost', 'Not Fit', 'No Response'].includes(status ?? '')) return styles.statusRisk
  return styles.statusNeutral
}

function sectorIcon(sector?: string | null) {
  if (['Hotel', 'Resort', 'Family hotel', 'Boutique hotel', 'Event venue'].includes(sector ?? '')) return '🏨'
  if (
    [
      'Pediatric clinic',
      'Pediatrician',
      'Child development center',
      'Orthophonist',
      'Psychomotor specialist',
      'Family wellness center',
    ].includes(sector ?? '')
  ) {
    return '🩺'
  }
  if (['School', 'Nursery'].includes(sector ?? '')) return '🎒'
  return '🏢'
}

function nextActionLabel(prospect: B2BProspect) {
  if (isOverdue(prospect.next_follow_up_at)) return 'Relance en retard'
  if (prospect.next_action) return prospect.next_action
  if (!prospect.last_contact_at) return 'Premier contact à lancer'
  return 'Action suivante à définir'
}

export default function B2BProspectDirectoryWorkspace({ defaultMode = 'directory' }: Props) {
  const [mode, setMode] = useState<WorkspaceMode>(defaultMode)
  const [state, setState] = useState<LoadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [prospects, setProspects] = useState<B2BProspect[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<B2BProspectDetail | null>(null)
  const [detailState, setDetailState] = useState<LoadState>('idle')
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('overview')
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)

  const [query, setQuery] = useState('')
  const [sectorFilter, setSectorFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [warmthFilter, setWarmthFilter] = useState('All')
  const [onlyOverdue, setOnlyOverdue] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [createDraft, setCreateDraft] = useState<B2BProspectPayload>(EMPTY_PROSPECT)
  const [editDraft, setEditDraft] = useState<Partial<B2BProspect> | null>(null)
  const [contactDraft, setContactDraft] = useState(EMPTY_CONTACT)
  const [statusDraft, setStatusDraft] = useState<StatusChangeDraft>(null)
  const [saving, setSaving] = useState(false)

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(null), 3200)
  }

  async function refreshProspects() {
    setState((current) => (current === 'ready' ? 'ready' : 'loading'))
    setError(null)

    try {
      const data = await readJson<B2BProspect[]>('/api/b2b-partnerships/prospects')
      setProspects(data)
      setLastSyncedAt(new Date())
      setState('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to synchronize prospect directory.')
      setState('error')
    }
  }

  async function openDetail(id: string, tab: DrawerTab = 'overview') {
    setSelectedId(id)
    setDrawerTab(tab)
    setDetailState('loading')
    setDetail(null)
    setEditDraft(null)

    try {
      const data = await readJson<B2BProspectDetail>(`/api/b2b-partnerships/prospects/${id}`)
      setDetail(data)
      setEditDraft(data.prospect)
      setDetailState('ready')
    } catch (err) {
      setDetailState('error')
      setError(err instanceof Error ? err.message : 'Unable to load prospect detail.')
    }
  }

  useEffect(() => {
    void refreshProspects()
    if (!shouldStartAutoRefresh()) return
    const sync = window.setInterval(() => {
      void refreshProspects()
      if (selectedId) void openDetail(selectedId, drawerTab)
    }, safeRefreshInterval(30000))

    return () => window.clearInterval(sync)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, drawerTab])

  const filteredProspects = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return prospects.filter((prospect) => {
      const searchable = [
        prospect.name,
        prospect.sector,
        prospect.sub_sector,
        prospect.city,
        prospect.email,
        prospect.phone,
        prospect.decision_maker_name,
        prospect.decision_maker_role,
        prospect.potential_service_fit,
        prospect.next_action,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesQuery = needle ? searchable.includes(needle) : true
      const matchesSector = sectorFilter === 'All' || prospect.sector === sectorFilter
      const matchesStatus = statusFilter === 'All' || prospect.status === statusFilter
      const matchesPriority = priorityFilter === 'All' || prospect.priority_score === priorityFilter
      const matchesWarmth = warmthFilter === 'All' || prospect.relationship_warmth === warmthFilter
      const matchesOverdue = onlyOverdue ? isOverdue(prospect.next_follow_up_at) : true

      return matchesQuery && matchesSector && matchesStatus && matchesPriority && matchesWarmth && matchesOverdue
    })
  }, [onlyOverdue, priorityFilter, prospects, query, sectorFilter, statusFilter, warmthFilter])

  const commandStats = useMemo(() => {
    const totalAnnual = filteredProspects.reduce((sum, prospect) => sum + Number(prospect.estimated_annual_value ?? 0), 0)
    const topA = filteredProspects.filter((prospect) => prospect.priority_score === 'A').length
    const overdue = filteredProspects.filter((prospect) => isOverdue(prospect.next_follow_up_at)).length
    const decisionMakers = filteredProspects.filter((prospect) => Boolean(prospect.decision_maker_name)).length
    return { totalAnnual, topA, overdue, decisionMakers }
  }, [filteredProspects])

  const pipelineColumns = useMemo(() => {
    return B2B_PIPELINE_STATUSES.map((status) => ({
      status,
      prospects: filteredProspects.filter((prospect) => prospect.status === status),
    }))
  }, [filteredProspects])

  const selectedProspect = detail?.prospect ?? prospects.find((prospect) => prospect.id === selectedId) ?? null

  async function createProspect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const created = await writeJson<B2BProspect>('/api/b2b-partnerships/prospects', 'POST', createDraft)
      setCreateOpen(false)
      setCreateDraft(EMPTY_PROSPECT)
      showToast('Prospect B2B créé avec succès.')
      await refreshProspects()
      await openDetail(created.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create prospect.')
    } finally {
      setSaving(false)
    }
  }

  async function updateProspect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedId || !editDraft?.name || !editDraft?.sector) return
    setSaving(true)
    setError(null)

    try {
      await writeJson<B2BProspect>(`/api/b2b-partnerships/prospects/${selectedId}`, 'PATCH', editDraft)
      showToast('Prospect mis à jour.')
      await refreshProspects()
      await openDetail(selectedId, drawerTab)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update prospect.')
    } finally {
      setSaving(false)
    }
  }

  async function addContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedId) return
    setSaving(true)
    setError(null)

    try {
      await writeJson<B2BContact>('/api/b2b-partnerships/contacts', 'POST', {
        ...contactDraft,
        prospect_id: selectedId,
      })
      setContactDraft(EMPTY_CONTACT)
      showToast('Contact ajouté au dossier prospect.')
      await refreshProspects()
      await openDetail(selectedId, 'contacts')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add contact.')
    } finally {
      setSaving(false)
    }
  }

  async function commitStatusChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!statusDraft) return
    setSaving(true)
    setError(null)

    try {
      await writeJson<B2BProspect>(`/api/b2b-partnerships/prospects/${statusDraft.prospect.id}/status`, 'PATCH', {
        status: statusDraft.nextStatus,
        reason: statusDraft.reason,
      })
      showToast(`Statut mis à jour : ${statusDraft.nextStatus}`)
      setStatusDraft(null)
      await refreshProspects()
      if (selectedId === statusDraft.prospect.id) await openDetail(statusDraft.prospect.id, drawerTab)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to change prospect status.')
    } finally {
      setSaving(false)
    }
  }

  async function archiveProspect(prospect: B2BProspect) {
    const confirmed = window.confirm(`Archiver le prospect ${prospect.name} ? Cette action le retire du pipeline actif.`)
    if (!confirmed) return
    setSaving(true)
    setError(null)

    try {
      await writeJson<B2BProspect>(`/api/b2b-partnerships/prospects/${prospect.id}/archive`, 'POST', {})
      showToast('Prospect archivé.')
      if (selectedId === prospect.id) {
        setSelectedId(null)
        setDetail(null)
      }
      await refreshProspects()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to archive prospect.')
    } finally {
      setSaving(false)
    }
  }

  const lastSync = lastSyncedAt
    ? new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(lastSyncedAt)
    : 'En attente'

  return (
    <main className={styles.shell}>
      <section className={styles.commandHero}>
        <div>
          <div className={styles.eyebrow}>
            <span className={styles.liveDot} /> ZIP 3 · Live CRM Core · White Enterprise Workspace
          </div>
          <h1>Prospect Directory & Pipeline Board</h1>
          <p>
            Gestion premium et synchronisée des prospects ANGELCARE B2B : hôtels, resorts, cliniques pédiatriques,
            décideurs, scoring, pipeline, relances, contacts et dossiers commerciaux complets.
          </p>
        </div>

        <div className={styles.heroPanel}>
          <span>Synchronisation production</span>
          <strong>{state === 'loading' ? 'Mise à jour…' : 'Live Ready'}</strong>
          <small>Dernier sync : {lastSync}</small>
          <button className={styles.secondaryButton} onClick={() => void refreshProspects()} type="button">
            Synchroniser
          </button>
        </div>
      </section>

      {error ? <div className={styles.errorBanner}>{error}</div> : null}
      {toast ? <div className={styles.toast}>{toast}</div> : null}

      <section className={styles.modeBar}>
        <button className={mode === 'directory' ? styles.modeActive : ''} onClick={() => setMode('directory')} type="button">
          🏢 Prospect Directory
        </button>
        <button className={mode === 'pipeline' ? styles.modeActive : ''} onClick={() => setMode('pipeline')} type="button">
          🧭 Pipeline Board
        </button>
        <button className={styles.primaryButton} onClick={() => setCreateOpen(true)} type="button">
          + Créer un prospect
        </button>
      </section>

      <section className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span>Prospects affichés</span>
          <strong>{filteredProspects.length}</strong>
          <small>{prospects.length} prospects actifs synchronisés</small>
        </div>
        <div className={styles.kpiCard}>
          <span>Priorité A</span>
          <strong>{commandStats.topA}</strong>
          <small>Opportunités stratégiques à pousser</small>
        </div>
        <div className={styles.kpiCard}>
          <span>Décideurs identifiés</span>
          <strong>{commandStats.decisionMakers}</strong>
          <small>Contacts clés prêts pour conversion</small>
        </div>
        <div className={styles.kpiCard}>
          <span>Relances en retard</span>
          <strong>{commandStats.overdue}</strong>
          <small>Actions commerciales urgentes</small>
        </div>
        <div className={styles.kpiCardWide}>
          <span>Valeur annuelle filtrée</span>
          <strong>{formatMAD(commandStats.totalAnnual)}</strong>
          <small>Pipeline financier estimé sur la vue active</small>
        </div>
      </section>

      <section className={styles.filterPanel}>
        <div className={styles.searchBox}>
          <span>⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher par nom, ville, décideur, service fit, téléphone…"
          />
        </div>
        <select value={sectorFilter} onChange={(event) => setSectorFilter(event.target.value)}>
          <option value="All">Tous les secteurs</option>
          {B2B_SECTORS.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="All">Tous les statuts</option>
          {B2B_PIPELINE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
          <option value="All">Toutes priorités</option>
          {B2B_PRIORITY_SCORES.map((priority) => (
            <option key={priority} value={priority}>
              Priorité {priority}
            </option>
          ))}
        </select>
        <select value={warmthFilter} onChange={(event) => setWarmthFilter(event.target.value)}>
          <option value="All">Toutes relations</option>
          {B2B_RELATIONSHIP_WARMTH.map((warmth) => (
            <option key={warmth} value={warmth}>
              {relationshipLabel(warmth)}
            </option>
          ))}
        </select>
        <label className={styles.checkToggle}>
          <input checked={onlyOverdue} onChange={(event) => setOnlyOverdue(event.target.checked)} type="checkbox" />
          Relances en retard
        </label>
      </section>

      {mode === 'directory' ? (
        <section className={styles.directoryCard}>
          <div className={styles.sectionHeader}>
            <div>
              <span>Base CRM production</span>
              <h2>Prospect Directory</h2>
            </div>
            <small>Chaque ligne ouvre un dossier prospect complet avec contacts, scoring et timeline.</small>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.prospectTable}>
              <thead>
                <tr>
                  <th>Prospect</th>
                  <th>Secteur</th>
                  <th>Ville</th>
                  <th>Statut</th>
                  <th>Priorité</th>
                  <th>Score</th>
                  <th>Décideur</th>
                  <th>Prochaine action</th>
                  <th>Valeur annuelle</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredProspects.map((prospect) => (
                  <tr key={prospect.id} onClick={() => void openDetail(prospect.id)}>
                    <td>
                      <div className={styles.companyCell}>
                        <span>{sectorIcon(prospect.sector)}</span>
                        <div>
                          <strong>{prospect.name}</strong>
                          <small>{prospect.email || prospect.phone || 'Contact principal à compléter'}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.sectorPill}>{sectorGroup(prospect.sector)}</span>
                      <small className={styles.tableSub}>{prospect.sector}</small>
                    </td>
                    <td>{prospect.city || '—'}</td>
                    <td>
                      <span className={`${styles.statusPill} ${statusClass(prospect.status)}`}>{prospect.status}</span>
                    </td>
                    <td>
                      <span className={`${styles.priorityPill} ${priorityClass(prospect.priority_score)}`}>{prospect.priority_score}</span>
                    </td>
                    <td>
                      <div className={styles.scoreMeter}>
                        <span style={{ width: `${calculateProspectScore(prospect) * 10}%` }} />
                      </div>
                      <small className={styles.tableSub}>{calculateProspectScore(prospect)}/10</small>
                    </td>
                    <td>
                      <strong className={styles.lightStrong}>{prospect.decision_maker_name || 'Non identifié'}</strong>
                      <small className={styles.tableSub}>{prospect.decision_maker_role || 'Décideur à trouver'}</small>
                    </td>
                    <td>
                      <span className={isOverdue(prospect.next_follow_up_at) ? styles.overdueText : ''}>
                        {nextActionLabel(prospect)}
                      </span>
                      <small className={styles.tableSub}>{formatDate(prospect.next_follow_up_at)}</small>
                    </td>
                    <td>{formatMAD(prospect.estimated_annual_value)}</td>
                    <td>
                      <button
                        className={styles.tableAction}
                        onClick={(event) => {
                          event.stopPropagation()
                          void openDetail(prospect.id)
                        }}
                        type="button"
                      >
                        Ouvrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredProspects.length ? (
              <div className={styles.emptyState}>Aucun prospect ne correspond à cette vue.</div>
            ) : null}
          </div>
        </section>
      ) : (
        <section className={styles.pipelineBoard}>
          <div className={styles.sectionHeader}>
            <div>
              <span>Vue pipeline commerciale</span>
              <h2>Pipeline Board</h2>
            </div>
            <small>Changement de statut sécurisé via serveur, avec audit et raisons obligatoires pour Lost / Not Fit.</small>
          </div>

          <div className={styles.kanbanScroll}>
            {pipelineColumns.map((column) => (
              <div className={styles.kanbanColumn} key={column.status}>
                <div className={styles.kanbanHeader}>
                  <strong>{column.status}</strong>
                  <span>{column.prospects.length}</span>
                </div>
                <div className={styles.kanbanCards}>
                  {column.prospects.map((prospect) => (
                    <article className={styles.pipelineCard} key={prospect.id} onClick={() => void openDetail(prospect.id)}>
                      <div className={styles.pipelineTop}>
                        <span>{sectorIcon(prospect.sector)}</span>
                        <div>
                          <strong>{prospect.name}</strong>
                          <small>{prospect.city || 'Ville à compléter'} · {prospect.sector}</small>
                        </div>
                      </div>
                      <div className={styles.pipelineMeta}>
                        <span className={`${styles.priorityPill} ${priorityClass(prospect.priority_score)}`}>P{prospect.priority_score}</span>
                        <span>{formatMAD(prospect.estimated_annual_value)}</span>
                      </div>
                      <p className={isOverdue(prospect.next_follow_up_at) ? styles.overdueText : ''}>{nextActionLabel(prospect)}</p>
                      <select
                        value={prospect.status}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) =>
                          setStatusDraft({
                            prospect,
                            nextStatus: event.target.value as B2BCrmStatus,
                            reason: '',
                          })
                        }
                      >
                        {B2B_PIPELINE_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {selectedId ? (
        <aside className={styles.drawer}>
          <div className={styles.drawerBackdrop} onClick={() => setSelectedId(null)} />
          <div className={styles.drawerPanel}>
            <header className={styles.drawerHeader}>
              <div>
                <span>Dossier prospect</span>
                <h2>{selectedProspect?.name || 'Chargement…'}</h2>
                <p>{selectedProspect?.sector || '—'} · {selectedProspect?.city || 'Ville non renseignée'}</p>
              </div>
              <button onClick={() => setSelectedId(null)} type="button">×</button>
            </header>

            {detailState === 'loading' ? <div className={styles.drawerLoading}>Chargement du dossier prospect…</div> : null}
            {detailState === 'error' ? <div className={styles.drawerLoading}>Impossible de charger le dossier.</div> : null}

            {detail ? (
              <>
                <div className={styles.drawerTabs}>
                  {[
                    ['overview', 'Overview'],
                    ['contacts', 'Contacts'],
                    ['activity', 'Timeline'],
                    ['commercial', 'Commercial'],
                    ['qualification', 'Scoring'],
                  ].map(([key, label]) => (
                    <button
                      className={drawerTab === key ? styles.drawerTabActive : ''}
                      key={key}
                      onClick={() => setDrawerTab(key as DrawerTab)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {drawerTab === 'overview' ? (
                  <div className={styles.drawerContent}>
                    <div className={styles.profileGrid}>
                      <div className={styles.profileCard}>
                        <span>Statut</span>
                        <strong className={`${styles.statusPill} ${statusClass(detail.prospect.status)}`}>{detail.prospect.status}</strong>
                      </div>
                      <div className={styles.profileCard}>
                        <span>Priorité</span>
                        <strong className={`${styles.priorityPill} ${priorityClass(detail.prospect.priority_score)}`}>{detail.prospect.priority_score}</strong>
                      </div>
                      <div className={styles.profileCard}>
                        <span>Relation</span>
                        <strong>{relationshipLabel(detail.prospect.relationship_warmth)}</strong>
                      </div>
                      <div className={styles.profileCard}>
                        <span>Valeur annuelle</span>
                        <strong>{formatMAD(detail.prospect.estimated_annual_value)}</strong>
                      </div>
                    </div>

                    <form className={styles.editForm} onSubmit={updateProspect}>
                      <h3>Modifier le dossier</h3>
                      <label>
                        Nom prospect
                        <input value={editDraft?.name ?? ''} onChange={(event) => setEditDraft({ ...(editDraft ?? {}), name: event.target.value })} required />
                      </label>
                      <div className={styles.formGridTwo}>
                        <label>
                          Secteur
                          <select value={editDraft?.sector ?? 'Other'} onChange={(event) => setEditDraft({ ...(editDraft ?? {}), sector: event.target.value })}>
                            {B2B_SECTORS.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
                          </select>
                        </label>
                        <label>
                          Ville
                          <input value={editDraft?.city ?? ''} onChange={(event) => setEditDraft({ ...(editDraft ?? {}), city: event.target.value })} />
                        </label>
                      </div>
                      <label>
                        Opportunité / fit ANGELCARE
                        <textarea value={editDraft?.potential_service_fit ?? ''} onChange={(event) => setEditDraft({ ...(editDraft ?? {}), potential_service_fit: event.target.value })} />
                      </label>
                      <label>
                        Prochaine action
                        <input value={editDraft?.next_action ?? ''} onChange={(event) => setEditDraft({ ...(editDraft ?? {}), next_action: event.target.value })} />
                      </label>
                      <div className={styles.formGridTwo}>
                        <label>
                          Relance prévue
                          <input type="datetime-local" value={(editDraft?.next_follow_up_at ?? '').slice(0, 16)} onChange={(event) => setEditDraft({ ...(editDraft ?? {}), next_follow_up_at: event.target.value ? new Date(event.target.value).toISOString() : null })} />
                        </label>
                        <label>
                          Valeur annuelle MAD
                          <input type="number" value={Number(editDraft?.estimated_annual_value ?? 0)} onChange={(event) => setEditDraft({ ...(editDraft ?? {}), estimated_annual_value: Number(event.target.value) })} />
                        </label>
                      </div>
                      <div className={styles.drawerActions}>
                        <button className={styles.primaryButton} disabled={saving} type="submit">Enregistrer</button>
                        <button className={styles.dangerButton} disabled={saving} onClick={() => void archiveProspect(detail.prospect)} type="button">Archiver</button>
                      </div>
                    </form>
                  </div>
                ) : null}

                {drawerTab === 'contacts' ? (
                  <div className={styles.drawerContent}>
                    <div className={styles.contactGrid}>
                      {detail.contacts.map((contact) => (
                        <article className={styles.contactCard} key={contact.id}>
                          <div>
                            <strong>{contact.name}</strong>
                            <span>{contact.role || 'Rôle à compléter'}</span>
                          </div>
                          {contact.is_decision_maker ? <em>Décideur</em> : null}
                          <p>{contact.email || 'Email non renseigné'}<br />{contact.phone || 'Téléphone non renseigné'}</p>
                        </article>
                      ))}
                    </div>

                    <form className={styles.editForm} onSubmit={addContact}>
                      <h3>Ajouter un contact décisionnaire</h3>
                      <div className={styles.formGridTwo}>
                        <label>Nom<input required value={contactDraft.name} onChange={(event) => setContactDraft({ ...contactDraft, name: event.target.value })} /></label>
                        <label>Rôle<input value={contactDraft.role} onChange={(event) => setContactDraft({ ...contactDraft, role: event.target.value })} /></label>
                        <label>Téléphone<input value={contactDraft.phone} onChange={(event) => setContactDraft({ ...contactDraft, phone: event.target.value })} /></label>
                        <label>Email<input type="email" value={contactDraft.email} onChange={(event) => setContactDraft({ ...contactDraft, email: event.target.value })} /></label>
                      </div>
                      <label className={styles.checkLine}>
                        <input checked={contactDraft.is_decision_maker} onChange={(event) => setContactDraft({ ...contactDraft, is_decision_maker: event.target.checked })} type="checkbox" />
                        Marquer comme décideur principal
                      </label>
                      <label>Notes<textarea value={contactDraft.notes} onChange={(event) => setContactDraft({ ...contactDraft, notes: event.target.value })} /></label>
                      <button className={styles.primaryButton} disabled={saving} type="submit">Ajouter contact</button>
                    </form>
                  </div>
                ) : null}

                {drawerTab === 'activity' ? (
                  <div className={styles.drawerContent}>
                    <div className={styles.timeline}>
                      {detail.activities.map((activity) => (
                        <article key={activity.id}>
                          <span />
                          <div>
                            <strong>{activity.title}</strong>
                            <p>{activity.description || activity.activity_type}</p>
                            <small>{formatDateTime(activity.created_at)}</small>
                          </div>
                        </article>
                      ))}
                      {!detail.activities.length ? <div className={styles.emptyState}>Aucune activité enregistrée.</div> : null}
                    </div>
                  </div>
                ) : null}

                {drawerTab === 'commercial' ? (
                  <div className={styles.drawerContent}>
                    <div className={styles.infoGrid}>
                      <Info label="Email" value={detail.prospect.email} />
                      <Info label="Téléphone" value={detail.prospect.phone} />
                      <Info label="Site web" value={detail.prospect.website} />
                      <Info label="LinkedIn" value={detail.prospect.linkedin} />
                      <Info label="Contact principal" value={detail.prospect.main_contact_name} />
                      <Info label="Rôle contact" value={detail.prospect.main_contact_role} />
                      <Info label="Décideur" value={detail.prospect.decision_maker_name} />
                      <Info label="Rôle décideur" value={detail.prospect.decision_maker_role} />
                    </div>
                    <div className={styles.noteBlock}>
                      <h3>Douleurs / opportunité</h3>
                      <p>{detail.prospect.pain_points || 'Pain points à qualifier.'}</p>
                      <p>{detail.prospect.opportunity_description || 'Description opportunité à compléter.'}</p>
                    </div>
                  </div>
                ) : null}

                {drawerTab === 'qualification' ? (
                  <div className={styles.drawerContent}>
                    <div className={styles.scoreGrid}>
                      <Score label="Fit" value={detail.prospect.fit_score} />
                      <Score label="Urgence" value={detail.prospect.urgency_score} />
                      <Score label="Pouvoir décision" value={detail.prospect.decision_power_score} />
                      <Score label="Potentiel revenu" value={detail.prospect.revenue_potential_score} />
                    </div>
                    <div className={styles.noteBlock}>
                      <h3>Lecture management</h3>
                      <p>
                        Score moyen : <strong>{calculateProspectScore(detail.prospect)}/10</strong>. Priorité commerciale :{' '}
                        <strong>{detail.prospect.priority_score}</strong>. Relation :{' '}
                        <strong>{relationshipLabel(detail.prospect.relationship_warmth)}</strong>.
                      </p>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </aside>
      ) : null}

      {createOpen ? (
        <div className={styles.modalLayer}>
          <div className={styles.modalCard}>
            <header>
              <div>
                <span>Nouveau prospect B2B</span>
                <h2>Créer un dossier prospect</h2>
              </div>
              <button onClick={() => setCreateOpen(false)} type="button">×</button>
            </header>
            <form onSubmit={createProspect}>
              <label>Nom de l’établissement<input required value={createDraft.name} onChange={(event) => setCreateDraft({ ...createDraft, name: event.target.value })} /></label>
              <div className={styles.formGridTwo}>
                <label>Secteur<select value={createDraft.sector} onChange={(event) => setCreateDraft({ ...createDraft, sector: event.target.value })}>{B2B_SECTORS.map((sector) => <option key={sector} value={sector}>{sector}</option>)}</select></label>
                <label>Ville<input value={createDraft.city ?? ''} onChange={(event) => setCreateDraft({ ...createDraft, city: event.target.value })} /></label>
                <label>Priorité<select value={createDraft.priority_score} onChange={(event) => setCreateDraft({ ...createDraft, priority_score: event.target.value })}>{B2B_PRIORITY_SCORES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select></label>
                <label>Relation<select value={createDraft.relationship_warmth} onChange={(event) => setCreateDraft({ ...createDraft, relationship_warmth: event.target.value })}>{B2B_RELATIONSHIP_WARMTH.map((warmth) => <option key={warmth} value={warmth}>{relationshipLabel(warmth)}</option>)}</select></label>
                <label>Email<input type="email" value={createDraft.email ?? ''} onChange={(event) => setCreateDraft({ ...createDraft, email: event.target.value })} /></label>
                <label>Téléphone<input value={createDraft.phone ?? ''} onChange={(event) => setCreateDraft({ ...createDraft, phone: event.target.value })} /></label>
              </div>
              <label>Fit ANGELCARE<textarea value={createDraft.potential_service_fit ?? ''} onChange={(event) => setCreateDraft({ ...createDraft, potential_service_fit: event.target.value })} placeholder="Ex: Kids club, garde encadrée, partenariat clinique, ateliers parents…" /></label>
              <label>Prochaine action<input value={createDraft.next_action ?? ''} onChange={(event) => setCreateDraft({ ...createDraft, next_action: event.target.value })} /></label>
              <div className={styles.modalActions}>
                <button className={styles.secondaryButton} onClick={() => setCreateOpen(false)} type="button">Annuler</button>
                <button className={styles.primaryButton} disabled={saving} type="submit">Créer prospect</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {statusDraft ? (
        <div className={styles.modalLayer}>
          <div className={styles.modalCardSmall}>
            <header>
              <div>
                <span>Changement de statut</span>
                <h2>{statusDraft.prospect.name}</h2>
              </div>
              <button onClick={() => setStatusDraft(null)} type="button">×</button>
            </header>
            <form onSubmit={commitStatusChange}>
              <p>
                Passer de <strong>{statusDraft.prospect.status}</strong> vers <strong>{statusDraft.nextStatus}</strong>.
              </p>
              {['Lost', 'Not Fit'].includes(statusDraft.nextStatus) ? (
                <label>
                  Raison obligatoire
                  <textarea required value={statusDraft.reason} onChange={(event) => setStatusDraft({ ...statusDraft, reason: event.target.value })} />
                </label>
              ) : (
                <label>
                  Note interne optionnelle
                  <textarea value={statusDraft.reason} onChange={(event) => setStatusDraft({ ...statusDraft, reason: event.target.value })} />
                </label>
              )}
              <div className={styles.modalActions}>
                <button className={styles.secondaryButton} onClick={() => setStatusDraft(null)} type="button">Annuler</button>
                <button className={styles.primaryButton} disabled={saving} type="submit">Confirmer</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  )
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className={styles.infoCard}>
      <span>{label}</span>
      <strong>{value || '—'}</strong>
    </div>
  )
}

function Score({ label, value }: { label: string; value?: number | null }) {
  const score = Number(value ?? 0)
  return (
    <div className={styles.scoreCard}>
      <span>{label}</span>
      <strong>{score || '—'}</strong>
      <div><span style={{ width: `${Math.max(0, Math.min(10, score)) * 10}%` }} /></div>
    </div>
  )
}

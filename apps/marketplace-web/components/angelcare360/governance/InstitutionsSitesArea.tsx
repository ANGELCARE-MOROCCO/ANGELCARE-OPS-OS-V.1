'use client'

import {
  AlertTriangle,
  Archive,
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileCheck2,
  FilePlus2,
  FileText,
  History,
  LoaderCircle,
  MapPin,
  Network,
  NotebookPen,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  UserRoundCheck,
  UsersRound,
  X,
} from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import CustomerOverlayPortal from '@/components/angelcare360/customer-experience/CustomerOverlayPortal'
import CustomerOverlaySurface from '@/components/angelcare360/customer-experience/CustomerOverlaySurface'
import {
  SchoolAdminActionDock,
  SchoolAdminAssignmentPanel,
  SchoolAdminAttentionBlock,
  SchoolAdminBreadcrumb,
  SchoolAdminDossierHeader,
  SchoolAdminEmptyState,
  SchoolAdminErrorState,
  SchoolAdminHumanStatus,
  SchoolAdminImpactPreview,
  SchoolAdminNextAction,
  SchoolAdminPermissionRequest,
  SchoolAdminSituationSummary,
} from '@/components/angelcare360/customer-experience/SchoolAdminWorkbench'
import type {
  InstitutionAreaActionKey,
  InstitutionAreaActionRequest,
  InstitutionAreaActionResult,
  InstitutionAreaSnapshot,
  InstitutionAreaView,
  InstitutionAttentionItem,
  InstitutionDossierTab,
  InstitutionHumanStatus,
  InstitutionKind,
  InstitutionRecord,
  InstitutionRequirement,
  InstitutionTone,
} from '@/types/angelcare360/institutions-sites'
import styles from './InstitutionsSitesArea.module.css'

type Props = {
  initialSnapshot: InstitutionAreaSnapshot
  initialView: InstitutionAreaView
  initialEntityId: string | null
  initialEntityKind: InstitutionKind | null
  initialTab: InstitutionDossierTab | null
}

type Toast = { kind: 'success' | 'warning' | 'error'; title: string; detail: string } | null

type ActionState = {
  key: InstitutionAreaActionKey
  record: InstitutionRecord | null
  taskId: string | null
  documentId: string | null
  title: string
  description: string
  reason: string
  effectiveAt: string
  values: Record<string, string | boolean>
  blockers: string[]
  initialSignature: string
}

const VIEWS: Array<{ key: InstitutionAreaView; label: string; icon: typeof Building2 }> = [
  { key: 'today', label: "Aujourd’hui", icon: Sparkles },
  { key: 'schools', label: 'Établissements', icon: Building2 },
  { key: 'sites', label: 'Sites', icon: MapPin },
  { key: 'preparation', label: 'Préparation', icon: CheckCircle2 },
  { key: 'openings', label: 'Ouvertures', icon: Store },
  { key: 'attention', label: 'À régler', icon: CircleAlert },
  { key: 'history', label: 'Historique', icon: History },
]

const TABS: Array<{ key: InstitutionDossierTab; label: string }> = [
  { key: 'todo', label: 'À faire' },
  { key: 'information', label: 'Informations' },
  { key: 'organisation', label: 'Organisation' },
  { key: 'team-access', label: 'Équipe et accès' },
  { key: 'documents', label: 'Documents' },
  { key: 'history', label: 'Historique' },
]

const STATUS_LABELS: Record<InstitutionHumanStatus, string> = {
  to_complete: 'À compléter',
  preparing: 'En préparation',
  ready_to_open: 'Prêt à ouvrir',
  open: 'Ouvert',
  suspended: 'Temporairement suspendu',
  closing: 'Fermeture en préparation',
  closed: 'Fermé',
  archived: 'Archivé',
}

function adminTone(tone: InstitutionTone): 'neutral' | 'info' | 'success' | 'warning' | 'critical' | 'approval' {
  if (tone === 'verified') return 'success'
  if (tone === 'critical') return 'critical'
  if (tone === 'warning') return 'warning'
  if (tone === 'decision') return 'approval'
  if (tone === 'active') return 'info'
  return 'neutral'
}

function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return 'Non renseignée'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', withTime ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function actionCopy(key: InstitutionAreaActionKey, record: InstitutionRecord | null): Pick<ActionState, 'title' | 'description'> {
  const school = record?.kind === 'site' ? 'site' : 'établissement'
  const copy: Record<InstitutionAreaActionKey, { title: string; description: string }> = {
    'institution.update_information': { title: 'Mettre à jour les informations', description: 'Corrigez les coordonnées et les informations visibles dans le dossier.' },
    'institution.assign_responsible': { title: 'Attribuer un responsable administratif', description: 'Choisissez la personne qui suivra la préparation et les tâches administratives.' },
    'institution.request_document': { title: 'Demander un document', description: 'Ajoutez une demande claire, un responsable et une échéance.' },
    'institution.verify_document': { title: 'Vérifier le document', description: 'Confirmez que le document est lisible, actuel et adapté au dossier.' },
    'institution.prepare_opening': { title: 'Vérifier la préparation', description: 'Le système contrôle chaque élément nécessaire avant l’ouverture.' },
    'institution.request_opening_approval': { title: 'Demander la validation de la direction', description: 'Transmettez le dossier complet pour la décision finale.' },
    'institution.open': { title: 'Ouvrir l’établissement', description: 'Rendez l’établissement opérationnel dans le système.' },
    'institution.suspend': { title: 'Suspendre temporairement', description: 'Suspendez l’activité sans supprimer les dossiers et l’historique.' },
    'institution.reopen': { title: 'Rouvrir l’établissement', description: 'Vérifiez les conditions puis remettez l’établissement en activité.' },
    'institution.begin_closure': { title: 'Commencer la fermeture', description: 'Vérifiez les enfants, classes, accès et tâches avant la fermeture.' },
    'institution.close': { title: 'Fermer l’établissement', description: 'Clôturez le dossier sans effacer son historique.' },
    'institution.archive': { title: 'Archiver l’établissement', description: 'Retirez-le des espaces actifs tout en conservant les informations.' },
    'site.create': { title: 'Ajouter un site', description: 'Créez un nouveau lieu rattaché à votre établissement principal.' },
    'site.open': { title: 'Ouvrir le site', description: 'Rendez ce site opérationnel sans modifier l’établissement principal.' },
    'site.update_information': { title: 'Mettre à jour le site', description: 'Corrigez les coordonnées, horaires et informations locales.' },
    'site.assign_coordinator': { title: 'Attribuer un coordinateur', description: 'Choisissez la personne responsable du suivi local.' },
    'site.suspend': { title: 'Suspendre temporairement le site', description: 'Suspendez ce site uniquement, sans fermer l’établissement principal.' },
    'site.reopen': { title: 'Rouvrir le site', description: 'Remettez ce site en activité après vérification.' },
    'site.begin_closure': { title: 'Commencer la fermeture du site', description: 'Préparez la fermeture de ce lieu uniquement.' },
    'site.close': { title: 'Fermer le site', description: 'Fermez ce lieu sans fermer l’établissement principal.' },
    'institution.task.assign': { title: 'Attribuer une tâche', description: `Ajoutez une tâche claire au dossier de ce ${school}.` },
    'institution.task.start': { title: 'Commencer la tâche', description: 'Indiquez que le travail est maintenant en cours.' },
    'institution.task.complete': { title: 'Marquer la tâche comme terminée', description: 'Confirmez que le résultat attendu est bien obtenu.' },
    'institution.task.reopen': { title: 'Réouvrir la tâche', description: 'Remettez la tâche dans la liste à traiter avec une explication.' },
    'institution.note.add': { title: 'Ajouter une note interne', description: 'Conservez une information utile pour l’équipe administrative.' },
  }
  return copy[key]
}

function newAction(key: InstitutionAreaActionKey, record: InstitutionRecord | null, options?: { taskId?: string | null; documentId?: string | null }): ActionState {
  const copy = actionCopy(key, record)
  return {
    key,
    record,
    taskId: options?.taskId || null,
    documentId: options?.documentId || null,
    title: copy.title,
    description: copy.description,
    reason: '',
    effectiveAt: new Date().toISOString().slice(0, 10),
    values: record ? {
      name: record.name,
      legalName: record.legalName || '',
      schoolType: record.schoolType,
      city: record.city || '',
      address: record.address || '',
      phone: record.phone || '',
      email: record.email || '',
      website: record.website || '',
      timezone: record.timezone,
      operatingHours: record.operatingHours || '',
      publicDescription: record.publicDescription || '',
    } : { schoolType: 'site', timezone: 'Africa/Casablanca', country: 'Maroc' },
    blockers: [],
    initialSignature: JSON.stringify(record ? {
      name: record.name, legalName: record.legalName || '', schoolType: record.schoolType, city: record.city || '', address: record.address || '', phone: record.phone || '', email: record.email || '', website: record.website || '', timezone: record.timezone, operatingHours: record.operatingHours || '', publicDescription: record.publicDescription || '',
    } : { schoolType: 'site', timezone: 'Africa/Casablanca', country: 'Maroc' }),
  }
}

export default function InstitutionsSitesArea({ initialSnapshot, initialView, initialEntityId, initialEntityKind, initialTab }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [view, setView] = useState<InstitutionAreaView>(VIEWS.some((item) => item.key === initialView) ? initialView : 'today')
  const [selectedId, setSelectedId] = useState<string | null>(initialEntityId)
  const [selectedKind, setSelectedKind] = useState<InstitutionKind | null>(initialEntityKind)
  const [tab, setTab] = useState<InstitutionDossierTab>(initialTab || 'todo')
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast>(null)
  const [action, setAction] = useState<ActionState | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const root = snapshot.institutions.find((item) => item.kind === 'school') || snapshot.institutions[0]
  const sites = snapshot.institutions.filter((item) => item.kind === 'site')
  const selected = selectedId ? snapshot.institutions.find((item) => item.id === selectedId && (!selectedKind || item.kind === selectedKind)) || null : null

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    if (VIEWS.some((item) => item.key === initialView)) setView(initialView)
  }, [initialView])

  useEffect(() => {
    setSelectedId(initialEntityId)
    setSelectedKind(initialEntityKind)
  }, [initialEntityId, initialEntityKind])

  useEffect(() => {
    if (initialTab) setTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    if (!initialEntityId || selected) return
    setSelectedId(null)
    setSelectedKind(null)
  }, [initialEntityId, selected])

  const updateUrl = (changes: Record<string, string | null>, replace = true) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('plane', 'institutions')
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    const url = `${pathname}?${params.toString()}`
    if (replace) router.replace(url, { scroll: false })
    else router.push(url, { scroll: false })
  }

  const chooseView = (next: InstitutionAreaView) => {
    setView(next)
    setSelectedId(null)
    setSelectedKind(null)
    updateUrl({ view: next, entity: null, type: null, drawer: null, tab: null })
  }

  const openRecord = (record: InstitutionRecord, nextTab: InstitutionDossierTab = record.attention.length ? 'todo' : 'information') => {
    setSelectedId(record.id)
    setSelectedKind(record.kind)
    setTab(nextTab)
    updateUrl({ view, entity: record.id, type: record.kind === 'school' ? 'institution' : 'site', drawer: 'dossier', tab: nextTab })
  }

  const closeRecord = () => {
    setSelectedId(null)
    setSelectedKind(null)
    setAction(null)
    updateUrl({ entity: null, type: null, drawer: null, tab: null })
  }

  const chooseTab = (next: InstitutionDossierTab) => {
    setTab(next)
    updateUrl({ tab: next })
  }

  const refresh = async (successMessage?: string) => {
    setBusy('refresh')
    setLoadError(null)
    try {
      const response = await fetch('/api/angelcare360/institutions', { credentials: 'same-origin', cache: 'no-store' })
      const body = await response.json().catch(() => null)
      if (!response.ok || !body?.snapshot) throw new Error(body?.message || 'Les informations ne peuvent pas être actualisées.')
      setSnapshot(body.snapshot as InstitutionAreaSnapshot)
      if (successMessage) setToast({ kind: 'success', title: successMessage, detail: 'Le dossier et les indicateurs ont été actualisés.' })
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Les informations ne peuvent pas être actualisées.')
    } finally {
      setBusy(null)
    }
  }

  const runAction = async () => {
    if (!action) return
    const record = action.record || root
    if (!record && action.key !== 'site.create') return
    setBusy(`action:${action.key}`)
    try {
      const payload: InstitutionAreaActionRequest = {
        actionKey: action.key,
        institutionId: record?.id || root?.id || '',
        institutionKind: record?.kind || 'school',
        taskId: action.taskId,
        documentId: action.documentId,
        reason: action.reason || null,
        effectiveAt: action.effectiveAt ? new Date(`${action.effectiveAt}T12:00:00`).toISOString() : null,
        payload: action.values,
        idempotencyKey: `${action.key}:${record?.id || 'new'}:${action.taskId || ''}:${action.documentId || ''}:${action.effectiveAt}:${action.reason}:${JSON.stringify(action.values)}`,
      }
      const response = await fetch('/api/angelcare360/institutions', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) })
      const result = await response.json().catch(() => null) as InstitutionAreaActionResult | null
      if (!response.ok || !result?.ok) throw new Error(result?.message || 'Cette action n’a pas pu être terminée.')
      if (result.state === 'blocked') {
        setAction({ ...action, blockers: result.blockers || [] })
        setToast({ kind: 'warning', title: 'Le dossier doit encore être complété', detail: result.message })
        return
      }
      const message = result.message
      setAction(null)
      await refresh()
      setToast({ kind: 'success', title: message, detail: successDetail(action.key, record) })
    } catch (error) {
      setToast({ kind: 'error', title: 'Cette action n’a pas pu être terminée', detail: error instanceof Error ? error.message : 'Réessayez dans quelques instants.' })
    } finally {
      setBusy(null)
    }
  }

  const filteredInstitutions = useMemo(() => snapshot.institutions.filter((item) => !search || `${item.name} ${item.code} ${item.city || ''} ${STATUS_LABELS[item.status]}`.toLowerCase().includes(search.toLowerCase())), [search, snapshot.institutions])

  return <section className={styles.area} data-mode={snapshot.mode}>
    <header className={styles.contextCrown}>
      <div className={styles.crownIdentity}>
        <span className={styles.crownIcon}>{snapshot.mode === 'single' ? <Building2 size={25} /> : <Network size={25} />}</span>
        <div><span className={styles.eyebrow}>Administration de l’école</span><h2>{snapshot.title}</h2><p>{snapshot.subtitle}</p></div>
      </div>
      <div className={styles.crownActions}>
        <button type="button" className={styles.secondaryButton} onClick={() => refresh('Informations actualisées')} disabled={busy === 'refresh'}>{busy === 'refresh' ? <LoaderCircle className={styles.spin} size={17} /> : <RefreshCw size={17} />}Actualiser</button>
        {snapshot.viewer.canEdit && root ? <button type="button" className={styles.primaryButton} onClick={() => setAction(newAction(snapshot.mode === 'single' ? 'institution.update_information' : 'site.create', snapshot.mode === 'single' ? root : null))}>{snapshot.mode === 'single' ? <FileText size={17} /> : <Plus size={17} />}{snapshot.mode === 'single' ? 'Mettre à jour' : 'Ajouter un site'}</button> : null}
      </div>
    </header>

    <div className={styles.metrics}>
      {snapshot.metrics.map((metric) => <button type="button" key={metric.key} data-tone={metric.tone} onClick={() => chooseView(metric.view)}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small><ChevronRight size={16} /></button>)}
    </div>

    <nav className={styles.localNav} aria-label="Administration des établissements">
      {VIEWS.filter((item) => snapshot.mode === 'multi' || item.key !== 'sites').map((item) => { const Icon = item.icon; return <button type="button" key={item.key} data-active={view === item.key} onClick={() => chooseView(item.key)}><Icon size={16} /><span>{item.label}</span>{item.key === 'attention' && snapshot.attention.length ? <strong>{snapshot.attention.length}</strong> : null}</button> })}
    </nav>

    {loadError ? <SchoolAdminErrorState detail={loadError} onRetry={() => refresh()} /> : null}

    <div className={styles.workbench}>
      {view === 'today' ? <TodayView snapshot={snapshot} root={root} onOpen={openRecord} onAction={(key, record) => setAction(newAction(key, record))} onView={chooseView} /> : null}
      {view === 'schools' ? <InstitutionsView records={filteredInstitutions.filter((item) => item.kind === 'school')} mode={snapshot.mode} search={search} onSearch={setSearch} onOpen={openRecord} onAction={(key, record) => setAction(newAction(key, record))} /> : null}
      {view === 'sites' ? <SitesView records={filteredInstitutions.filter((item) => item.kind === 'site')} search={search} onSearch={setSearch} onOpen={openRecord} onCreate={() => setAction(newAction('site.create', null))} /> : null}
      {view === 'preparation' ? <PreparationView records={filteredInstitutions} onOpen={openRecord} onAction={(key, record) => setAction(newAction(key, record))} /> : null}
      {view === 'openings' ? <OpeningsView records={filteredInstitutions} canApprove={snapshot.viewer.canApproveOpening} onOpen={openRecord} onAction={(key, record) => setAction(newAction(key, record))} /> : null}
      {view === 'attention' ? <AttentionView items={snapshot.attention} records={snapshot.institutions} onOpen={openRecord} onAction={(key, record) => setAction(newAction(key, record))} /> : null}
      {view === 'history' ? <HistoryView records={filteredInstitutions} onOpen={openRecord} /> : null}
    </div>

    {selected ? <InstitutionDossier record={selected} tab={tab} viewer={snapshot.viewer} directory={snapshot.directory} busy={busy} onTab={chooseTab} onClose={closeRecord} onAction={(key, options) => setAction(newAction(key, selected, options))} onOpenExact={(href) => router.push(href)} /> : null}
    {action ? <ActionChamber state={action} snapshot={snapshot} busy={busy === `action:${action.key}`} onChange={setAction} onSubmit={runAction} onClose={() => setAction(null)} /> : null}

    {toast ? <CustomerOverlayPortal><div className={styles.toast} data-kind={toast.kind}><span>{toast.kind === 'success' ? <BadgeCheck size={20} /> : <AlertTriangle size={20} />}</span><div><strong>{toast.title}</strong><p>{toast.detail}</p></div></div></CustomerOverlayPortal> : null}
  </section>
}

function successDetail(key: InstitutionAreaActionKey, record: InstitutionRecord | null) {
  if (key === 'institution.assign_responsible' || key === 'site.assign_coordinator') return 'La responsabilité et la prochaine étape sont maintenant visibles dans le dossier.'
  if (key === 'institution.update_information' || key === 'site.update_information') return 'Les informations essentielles et la préparation ont été recalculées.'
  if (key === 'institution.open') return 'Les éléments bloquants ont été retirés et le statut est maintenant Ouvert.'
  if (key.includes('suspend')) return `Le ${record?.kind === 'site' ? 'site' : 'dossier'} conserve ses informations et son historique.`
  if (key.includes('close')) return 'Le dossier est fermé sans suppression de son historique.'
  if (key.includes('task')) return 'La liste des tâches et la prochaine action ont été actualisées.'
  return 'Le dossier, les indicateurs et l’historique ont été actualisés.'
}

function TodayView({ snapshot, root, onOpen, onAction, onView }: { snapshot: InstitutionAreaSnapshot; root: InstitutionRecord | undefined; onOpen: (record: InstitutionRecord, tab?: InstitutionDossierTab) => void; onAction: (key: InstitutionAreaActionKey, record: InstitutionRecord) => void; onView: (view: InstitutionAreaView) => void }) {
  if (!root) return <SchoolAdminEmptyState title="Votre établissement n’est pas encore disponible" detail="Vérifiez la configuration du tenant avant de continuer." />
  const topAttention = snapshot.attention.slice(0, 5)
  return <div className={styles.todayGrid}>
    <section className={styles.heroPanel} data-tone={root.tone}>
      <div className={styles.heroTop}><span className={styles.eyebrow}>{root.kind === 'school' ? 'Établissement principal' : 'Site'}</span><SchoolAdminHumanStatus tone={adminTone(root.tone)} label={STATUS_LABELS[root.status]} /></div>
      <h3>{root.name}</h3><p>{root.statusExplanation}</p>
      <div className={styles.heroFacts}><span><CalendarDays size={16} />{root.currentAcademicYearLabel || 'Année scolaire à configurer'}</span><span><UsersRound size={16} />{root.activeChildren} enfant(s)</span><span><Building2 size={16} />{root.classesCount} classe(s)</span></div>
      <SchoolAdminNextAction config={{ title: root.nextActionLabel, detail: root.blockersCount ? `${root.blockersCount} élément(s) empêchent encore une validation complète.` : 'Le dossier est à jour selon les informations disponibles.', label: root.nextActionKey ? root.nextActionLabel : 'Ouvrir le dossier', tone: root.blockersCount ? 'warning' : 'approval', onAction: () => root.nextActionKey ? onAction(root.nextActionKey, root) : onOpen(root) }} />
    </section>
    <section className={styles.attentionPanel}>
      <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Aujourd’hui</span><h3>Ce qui demande votre attention</h3><p>Chaque élément peut être traité ou attribué sans chercher ailleurs.</p></div><button type="button" onClick={() => onView('attention')}>Tout voir<ArrowRight size={16} /></button></div>
      {topAttention.length ? <div className={styles.attentionCards}>{topAttention.map((item) => <AttentionCard key={item.id} item={item} record={snapshot.institutions.find((record) => record.id === item.institutionId)} onOpen={onOpen} onAction={onAction} />)}</div> : <SchoolAdminEmptyState compact title="Tout est en ordre" detail="Aucune action administrative n’est nécessaire pour le moment." />}
    </section>
    <PreparationCard record={root} onOpen={onOpen} onAction={onAction} />
    <section className={styles.summaryPanel}><span className={styles.eyebrow}>Responsabilité</span><h3>Qui s’occupe du dossier ?</h3><SchoolAdminAssignmentPanel owner={root.responsibleLabel || root.coordinatorLabel} dueAt={topAttention[0]?.dueAt ? formatDate(topAttention[0].dueAt) : null} updatedAt={formatDate(root.updatedAt, true)} nextStep={root.nextActionLabel} /><button type="button" className={styles.inlineAction} onClick={() => onAction(root.kind === 'school' ? 'institution.assign_responsible' : 'site.assign_coordinator', root)}>{root.kind === 'school' ? 'Attribuer un responsable' : 'Attribuer un coordinateur'}<ChevronRight size={16} /></button></section>
  </div>
}

function PreparationCard({ record, onOpen, onAction }: { record: InstitutionRecord; onOpen: (record: InstitutionRecord, tab?: InstitutionDossierTab) => void; onAction: (key: InstitutionAreaActionKey, record: InstitutionRecord) => void }) {
  const percent = record.requirementsRequired ? Math.round(record.requirementsComplete / record.requirementsRequired * 100) : 0
  return <section className={styles.preparationCard}><div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Préparation</span><h3>{record.requirementsComplete} étapes sur {record.requirementsRequired} terminées</h3><p>{record.blockersCount ? `${record.blockersCount} élément(s) empêchent encore l’ouverture.` : 'Les éléments essentiels sont prêts.'}</p></div><strong>{percent}%</strong></div><div className={styles.progressTrack}><span style={{ width: `${percent}%` }} /></div><div className={styles.requirementMini}>{record.requirements.slice(0, 5).map((item) => <div key={item.key} data-complete={item.passed || undefined}><span>{item.passed ? <Check size={14} /> : <Clock3 size={14} />}</span><strong>{item.label}</strong><small>{item.passed ? 'Complet' : item.status === 'blocked' ? 'À compléter' : 'À vérifier'}</small></div>)}</div><div className={styles.panelActions}><button type="button" onClick={() => onOpen(record, 'todo')}>Voir la préparation</button><button type="button" className={styles.primaryInline} onClick={() => onAction('institution.prepare_opening', record)}>Vérifier maintenant</button></div></section>
}

function AttentionCard({ item, record, onOpen, onAction }: { item: InstitutionAttentionItem; record?: InstitutionRecord; onOpen: (record: InstitutionRecord, tab?: InstitutionDossierTab) => void; onAction: (key: InstitutionAreaActionKey, record: InstitutionRecord) => void }) {
  if (!record) return null
  return <article className={styles.attentionCard} data-tone={item.tone}><span className={styles.attentionSignal}>{item.severity === 'blocking' ? <CircleAlert size={17} /> : <Clock3 size={17} />}</span><div><strong>{item.title}</strong><p>{item.explanation}</p><small>{record.name}{item.ownerLabel ? ` · ${item.ownerLabel}` : ' · Responsable à attribuer'}</small></div><button type="button" onClick={() => item.actionKey ? onAction(item.actionKey, record) : item.exactHref ? window.location.assign(item.exactHref) : onOpen(record, 'todo')}>{item.recommendedActionLabel}<ChevronRight size={15} /></button></article>
}

function InstitutionsView({ records, mode, search, onSearch, onOpen, onAction }: { records: InstitutionRecord[]; mode: InstitutionAreaSnapshot['mode']; search: string; onSearch: (value: string) => void; onOpen: (record: InstitutionRecord) => void; onAction: (key: InstitutionAreaActionKey, record: InstitutionRecord) => void }) {
  return <section className={styles.listSurface}><ListToolbar title={mode === 'single' ? 'Mon établissement' : 'Établissements'} detail={mode === 'single' ? 'Votre dossier administratif principal.' : 'Vue comparative de vos établissements.'} search={search} onSearch={onSearch} count={records.length} />{records.length ? <div className={styles.institutionList}>{records.map((record) => <InstitutionRow key={record.id} record={record} onOpen={onOpen} onAction={onAction} />)}</div> : <SchoolAdminEmptyState title="Aucun établissement disponible" detail="L’établissement principal doit être créé depuis le tenant AngelCare 360." />}</section>
}

function SitesView({ records, search, onSearch, onOpen, onCreate }: { records: InstitutionRecord[]; search: string; onSearch: (value: string) => void; onOpen: (record: InstitutionRecord) => void; onCreate: () => void }) {
  return <section className={styles.listSurface}><ListToolbar title="Sites" detail="Lieux rattachés à votre établissement principal." search={search} onSearch={onSearch} count={records.length} actionLabel="Ajouter un site" onAction={onCreate} />{records.length ? <div className={styles.siteGrid}>{records.map((record) => <button type="button" key={record.id} className={styles.siteCard} onClick={() => onOpen(record)}><div><span className={styles.siteIcon}><MapPin size={19} /></span><SchoolAdminHumanStatus tone={adminTone(record.tone)} label={STATUS_LABELS[record.status]} /></div><h3>{record.name}</h3><p>{record.city || 'Ville à renseigner'} · {record.coordinatorLabel || 'Coordinateur à attribuer'}</p><div><span>{record.activeChildren} enfant(s)</span><span>{record.classesCount} classe(s)</span><span>{record.blockersCount} à compléter</span></div><strong>Ouvrir le dossier<ChevronRight size={15} /></strong></button>)}</div> : <SchoolAdminEmptyState title="Aucun site supplémentaire" detail="Votre établissement fonctionne actuellement en mode site unique." actionLabel="Ajouter un site" onAction={onCreate} />}</section>
}

function ListToolbar({ title, detail, search, onSearch, count, actionLabel, onAction }: { title: string; detail: string; search: string; onSearch: (value: string) => void; count: number; actionLabel?: string; onAction?: () => void }) {
  return <div className={styles.listToolbar}><div><h3>{title}</h3><p>{detail}</p></div><label><Search size={16} /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Rechercher par nom, code ou ville…" /></label><span>{count} dossier(s)</span>{actionLabel && onAction ? <button type="button" onClick={onAction}><Plus size={16} />{actionLabel}</button> : null}</div>
}

function InstitutionRow({ record, onOpen, onAction }: { record: InstitutionRecord; onOpen: (record: InstitutionRecord) => void; onAction: (key: InstitutionAreaActionKey, record: InstitutionRecord) => void }) {
  return <article className={styles.institutionRow}><button type="button" className={styles.rowIdentity} onClick={() => onOpen(record)}><span><Building2 size={20} /></span><div><strong>{record.name}</strong><small>{record.code} · {record.city || 'Ville à compléter'}</small></div></button><SchoolAdminHumanStatus tone={adminTone(record.tone)} label={STATUS_LABELS[record.status]} /><div className={styles.rowCell}><span>Responsable</span><strong>{record.responsibleLabel || 'À attribuer'}</strong></div><div className={styles.rowCell}><span>Année scolaire</span><strong>{record.currentAcademicYearLabel || 'À configurer'}</strong></div><div className={styles.rowCell}><span>Enfants / classes</span><strong>{record.activeChildren} / {record.classesCount}</strong></div><div className={styles.rowCell}><span>À compléter</span><strong data-alert={record.blockersCount > 0 || undefined}>{record.blockersCount + record.warningsCount}</strong></div><button type="button" className={styles.rowAction} onClick={() => record.nextActionKey ? onAction(record.nextActionKey, record) : onOpen(record)}>{record.nextActionLabel}<ChevronRight size={15} /></button></article>
}

function PreparationView({ records, onOpen, onAction }: { records: InstitutionRecord[]; onOpen: (record: InstitutionRecord, tab?: InstitutionDossierTab) => void; onAction: (key: InstitutionAreaActionKey, record: InstitutionRecord) => void }) {
  return <section className={styles.preparationWorkspace}><div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Préparation</span><h3>Ce qui doit être prêt</h3><p>Les étapes sont vérifiables et liées aux dossiers réels.</p></div></div>{records.map((record) => <article key={record.id} className={styles.preparationRecord}><header><div><span>{record.kind === 'site' ? <MapPin size={18} /> : <Building2 size={18} />}</span><div><strong>{record.name}</strong><small>{record.requirementsComplete} sur {record.requirementsRequired} terminées</small></div></div><button type="button" onClick={() => onOpen(record, 'todo')}>Ouvrir le dossier<ChevronRight size={15} /></button></header><div className={styles.requirementGrid}>{record.requirements.map((item) => <RequirementItem key={item.key} item={item} record={record} onAction={onAction} />)}</div></article>)}</section>
}

function RequirementItem({ item, record, onAction }: { item: InstitutionRequirement; record: InstitutionRecord; onAction: (key: InstitutionAreaActionKey, record: InstitutionRecord) => void }) {
  return <div className={styles.requirementItem} data-status={item.status}><span>{item.passed ? <Check size={15} /> : item.blocking ? <CircleAlert size={15} /> : <Clock3 size={15} />}</span><div><strong>{item.label}</strong><p>{item.explanation}</p></div><small>{!item.applicable ? 'Non applicable' : item.passed ? 'Complet' : item.blocking ? 'À compléter' : 'À vérifier'}</small>{!item.passed && item.actionLabel ? <button type="button" onClick={() => item.actionKey ? onAction(item.actionKey, record) : item.exactHref ? window.location.assign(item.exactHref) : undefined}>{item.actionLabel}<ChevronRight size={14} /></button> : null}</div>
}

function OpeningsView({ records, canApprove, onOpen, onAction }: { records: InstitutionRecord[]; canApprove: boolean; onOpen: (record: InstitutionRecord) => void; onAction: (key: InstitutionAreaActionKey, record: InstitutionRecord) => void }) {
  const candidates = records.filter((record) => ['to_complete', 'preparing', 'ready_to_open', 'suspended', 'closing'].includes(record.status))
  return <section className={styles.openingWorkspace}><div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Ouverture et continuité</span><h3>Préparer, ouvrir ou rouvrir en toute sécurité</h3><p>Chaque décision affiche ses conséquences avant confirmation.</p></div></div>{candidates.length ? <div className={styles.openingGrid}>{candidates.map((record) => <article key={record.id} data-status={record.status}><div className={styles.openingCardTop}><span>{record.kind === 'site' ? <MapPin size={20} /> : <Building2 size={20} />}</span><SchoolAdminHumanStatus tone={adminTone(record.tone)} label={STATUS_LABELS[record.status]} /></div><h3>{record.name}</h3><p>{record.statusExplanation}</p><div className={styles.openingFacts}><span><CheckCircle2 size={15} />{record.requirementsComplete}/{record.requirementsRequired} étapes</span><span><CircleAlert size={15} />{record.blockersCount} bloquant(s)</span></div><div className={styles.panelActions}><button type="button" onClick={() => onOpen(record)}>Voir le dossier</button>{record.status === 'ready_to_open' ? canApprove ? <button type="button" className={styles.primaryInline} onClick={() => onAction(record.kind === 'site' ? 'site.open' : 'institution.open', record)}>{record.kind === 'site' ? 'Ouvrir le site' : 'Ouvrir l’établissement'}</button> : <button type="button" className={styles.primaryInline} onClick={() => onAction('institution.request_opening_approval', record)}>Demander la validation</button> : record.status === 'suspended' ? <button type="button" className={styles.primaryInline} onClick={() => onAction(record.kind === 'site' ? 'site.reopen' : 'institution.reopen', record)}>Préparer la réouverture</button> : <button type="button" className={styles.primaryInline} onClick={() => onAction('institution.prepare_opening', record)}>Vérifier la préparation</button>}</div></article>)}</div> : <SchoolAdminEmptyState title="Aucune ouverture ou réouverture en attente" detail="Tous les établissements sont dans un état stable." />}</section>
}

function AttentionView({ items, records, onOpen, onAction }: { items: InstitutionAttentionItem[]; records: InstitutionRecord[]; onOpen: (record: InstitutionRecord, tab?: InstitutionDossierTab) => void; onAction: (key: InstitutionAreaActionKey, record: InstitutionRecord) => void }) {
  return <section className={styles.attentionWorkspace}><div className={styles.sectionHeading}><div><span className={styles.eyebrow}>À régler</span><h3>Actions administratives en attente</h3><p>Les éléments les plus importants apparaissent en premier.</p></div></div>{items.length ? <div className={styles.attentionFullList}>{items.map((item) => <AttentionCard key={item.id} item={item} record={records.find((record) => record.id === item.institutionId)} onOpen={onOpen} onAction={onAction} />)}</div> : <SchoolAdminEmptyState title="Tout est en ordre" detail="Aucune action administrative n’est nécessaire pour le moment." />}</section>
}

function HistoryView({ records, onOpen }: { records: InstitutionRecord[]; onOpen: (record: InstitutionRecord, tab?: InstitutionDossierTab) => void }) {
  const events = records.flatMap((record) => record.history.map((event) => ({ ...event, record }))).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  return <section className={styles.historyWorkspace}><div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Historique</span><h3>Mémoire administrative</h3><p>Retrouvez qui a changé quoi, quand et pourquoi.</p></div></div>{events.length ? <div className={styles.historyList}>{events.map((event) => <button type="button" key={`${event.record.id}:${event.id}`} onClick={() => onOpen(event.record, 'history')}><span data-tone={event.tone} /><div><strong>{event.label}</strong><p>{event.detail || event.record.name}</p><small>{event.actorLabel || 'Système'} · {formatDate(event.createdAt, true)}</small></div><ChevronRight size={15} /></button>)}</div> : <SchoolAdminEmptyState title="Aucun changement enregistré" detail="Les modifications importantes apparaîtront ici." />}</section>
}

function InstitutionDossier({ record, tab, viewer, directory, busy, onTab, onClose, onAction, onOpenExact }: { record: InstitutionRecord; tab: InstitutionDossierTab; viewer: InstitutionAreaSnapshot['viewer']; directory: InstitutionAreaSnapshot['directory']; busy: string | null; onTab: (tab: InstitutionDossierTab) => void; onClose: () => void; onAction: (key: InstitutionAreaActionKey, options?: { taskId?: string | null; documentId?: string | null }) => void; onOpenExact: (href: string) => void }) {
  const nextRequirement = record.requirements.find((item) => item.applicable && !item.passed)
  const primaryKey = record.nextActionKey
  return <CustomerOverlaySurface kind="dossier" onClose={onClose} className={styles.dossierOverlay} ariaLabel={`Dossier ${record.name}`}>
    <section className={styles.dossier} role="dialog" aria-modal="true" aria-label={`Dossier ${record.name}`} onMouseDown={(event) => event.stopPropagation()}>
      <header className={styles.dossierTop}><SchoolAdminBreadcrumb items={[{ key: 'administration', label: 'Administration' }, { key: 'institutions', label: record.kind === 'school' ? 'Établissements' : 'Sites', onSelect: onClose }, { key: record.id, label: record.name }]} /><button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fermer le dossier"><X size={20} /></button></header>
      <SchoolAdminDossierHeader eyebrow={record.kind === 'school' ? 'Dossier de l’établissement' : 'Dossier du site'} title={record.name} description={record.statusExplanation} status={STATUS_LABELS[record.status]} tone={adminTone(record.tone)} context={<><span>{record.code}</span><span>{record.city || 'Ville à compléter'}</span><span>{record.currentAcademicYearLabel || 'Année scolaire à configurer'}</span></>}>
        {viewer.canEdit ? <button type="button" className={styles.headerEdit} onClick={() => onAction(record.kind === 'school' ? 'institution.update_information' : 'site.update_information')}><FileText size={16} />Mettre à jour</button> : null}
      </SchoolAdminDossierHeader>
      <SchoolAdminAssignmentPanel owner={record.kind === 'school' ? record.responsibleLabel : record.coordinatorLabel} updatedAt={formatDate(record.updatedAt, true)} nextStep={record.nextActionLabel} />
      <nav className={styles.dossierTabs} aria-label="Sections du dossier">{TABS.map((item) => <button type="button" key={item.key} data-active={tab === item.key} onClick={() => onTab(item.key)}>{item.label}{item.key === 'todo' && record.attention.length ? <strong>{record.attention.length}</strong> : null}</button>)}</nav>
      <div className={styles.dossierCanvas}>
        {tab === 'todo' ? <TodoTab record={record} nextRequirement={nextRequirement} viewer={viewer} onAction={onAction} onOpenExact={onOpenExact} /> : null}
        {tab === 'information' ? <InformationTab record={record} onAction={onAction} /> : null}
        {tab === 'organisation' ? <OrganisationTab record={record} onOpenExact={onOpenExact} /> : null}
        {tab === 'team-access' ? <TeamTab record={record} viewer={viewer} onAction={onAction} onOpenExact={onOpenExact} /> : null}
        {tab === 'documents' ? <DocumentsTab record={record} onAction={onAction} onOpenExact={onOpenExact} /> : null}
        {tab === 'history' ? <DossierHistoryTab record={record} /> : null}
      </div>
      <SchoolAdminActionDock note={busy ? 'Enregistrement en cours…' : record.blockersCount ? `${record.blockersCount} élément(s) empêchent encore une validation complète.` : 'Les changements sont conservés dans l’historique.'} secondary={[{ key: 'note', label: 'Ajouter une note', onClick: () => onAction('institution.note.add') }, { key: 'task', label: 'Attribuer une tâche', onClick: () => onAction('institution.task.assign') }]} primary={primaryKey ? { label: record.nextActionLabel, onClick: () => onAction(primaryKey), busy: Boolean(busy) } : undefined} />
    </section>
  </CustomerOverlaySurface>
}

function TodoTab({ record, nextRequirement, viewer, onAction, onOpenExact }: { record: InstitutionRecord; nextRequirement?: InstitutionRequirement; viewer: InstitutionAreaSnapshot['viewer']; onAction: (key: InstitutionAreaActionKey, options?: { taskId?: string | null; documentId?: string | null }) => void; onOpenExact: (href: string) => void }) {
  const attentionItems = record.attention.map((item) => ({ key: item.id, label: item.title, detail: `${item.explanation} ${item.consequence}`, tone: item.severity === 'blocking' ? 'critical' as const : 'warning' as const, actionLabel: item.recommendedActionLabel, onAction: () => item.actionKey ? onAction(item.actionKey) : item.exactHref ? onOpenExact(item.exactHref) : undefined }))
  return <div className={styles.tabStack}>
    <SchoolAdminSituationSummary summary={record.attention.length ? `${record.attention.length} élément(s) demandent votre attention.` : 'Le dossier est complet pour le moment.'} reason={record.attention.length ? 'Le système vérifie automatiquement les informations essentielles, les responsabilités, les classes, les accès et les documents.' : null} consequence={record.blockersCount ? `${record.blockersCount} élément(s) empêchent encore l’ouverture ou une validation complète.` : 'Aucune action bloquante n’est détectée.'} tone={record.blockersCount ? 'critical' : record.attention.length ? 'warning' : 'success'} />
    {nextRequirement ? <SchoolAdminNextAction config={{ title: nextRequirement.actionLabel || record.nextActionLabel, detail: nextRequirement.explanation, label: nextRequirement.actionLabel || 'Traiter maintenant', tone: nextRequirement.blocking ? 'warning' : 'approval', onAction: () => nextRequirement.actionKey ? onAction(nextRequirement.actionKey) : nextRequirement.exactHref ? onOpenExact(nextRequirement.exactHref) : undefined }} /> : null}
    <SchoolAdminAttentionBlock items={attentionItems} emptyTitle="Tout est en ordre" emptyDetail="Aucune action administrative n’est nécessaire pour le moment." />
    <section className={styles.taskSection}><div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Travail de l’équipe</span><h3>Tâches administratives</h3><p>Les responsabilités, échéances et résultats restent attachés au dossier.</p></div><button type="button" onClick={() => onAction('institution.task.assign')}><Plus size={16} />Attribuer une tâche</button></div>{record.tasks.length ? <div className={styles.taskList}>{record.tasks.map((task) => <article key={task.id} data-state={task.state}><span>{task.state === 'completed' ? <CheckCircle2 size={17} /> : <Clock3 size={17} />}</span><div><strong>{task.title}</strong><p>{task.description || 'Aucune précision supplémentaire.'}</p><small>{task.ownerLabel || 'Responsable à attribuer'} · {task.dueAt ? `avant le ${formatDate(task.dueAt)}` : 'sans échéance'}</small></div><div>{task.state === 'completed' ? <button type="button" onClick={() => onAction('institution.task.reopen', { taskId: task.id })}>Réouvrir</button> : <><button type="button" onClick={() => onAction('institution.task.start', { taskId: task.id })}>Commencer</button><button type="button" className={styles.taskComplete} onClick={() => onAction('institution.task.complete', { taskId: task.id })}>Terminer</button></>}</div></article>)}</div> : <SchoolAdminEmptyState compact title="Aucune tâche attribuée" detail="Ajoutez une tâche lorsque plusieurs personnes doivent participer au dossier." />}</section>
    {!viewer.canApproveOpening && record.status === 'ready_to_open' ? <SchoolAdminPermissionRequest message="Le dossier est prêt, mais l’ouverture finale doit être validée par la direction." onRequest={() => onAction('institution.request_opening_approval')} /> : null}
  </div>
}

function InformationTab({ record, onAction }: { record: InstitutionRecord; onAction: (key: InstitutionAreaActionKey) => void }) {
  const fields = [{ label: 'Nom officiel', value: record.name }, { label: 'Nom légal', value: record.legalName || 'Non renseigné' }, { label: 'Type', value: record.schoolType }, { label: 'Adresse', value: record.address || 'À compléter' }, { label: 'Ville', value: record.city || 'À compléter' }, { label: 'Téléphone', value: record.phone || 'À compléter' }, { label: 'E-mail', value: record.email || 'À compléter' }, { label: 'Site web', value: record.website || 'Non renseigné' }, { label: 'Horaires', value: record.operatingHours || 'À compléter' }, { label: 'Fuseau horaire', value: record.timezone }]
  return <div className={styles.tabStack}><section className={styles.informationCard}><div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Informations essentielles</span><h3>Identité et coordonnées</h3><p>Ces informations sont utilisées dans les dossiers et les communications de l’école.</p></div><button type="button" onClick={() => onAction(record.kind === 'school' ? 'institution.update_information' : 'site.update_information')}>Mettre à jour<FileText size={16} /></button></div><div className={styles.fieldGrid}>{fields.map((field) => <div key={field.label}><span>{field.label}</span><strong>{field.value}</strong></div>)}</div></section>{record.publicDescription ? <section className={styles.descriptionCard}><span className={styles.eyebrow}>Présentation</span><p>{record.publicDescription}</p></section> : null}</div>
}

function OrganisationTab({ record, onOpenExact }: { record: InstitutionRecord; onOpenExact: (href: string) => void }) {
  return <div className={styles.tabStack}><section className={styles.organisationGrid}><button type="button" onClick={() => onOpenExact('/angelcare-360-command-center/administration?plane=academic-structure&view=academic-years&source=institutions')}><CalendarDays size={21} /><span>Année scolaire</span><strong>{record.currentAcademicYearLabel || 'À configurer'}</strong><small>Configurer l’année exacte</small><ChevronRight size={16} /></button><button type="button" onClick={() => onOpenExact('/angelcare-360-command-center/administration?plane=classes-capacity&view=classes&source=institutions')}><Building2 size={21} /><span>Classes</span><strong>{record.classesCount}</strong><small>{record.capacity} places prévues</small><ChevronRight size={16} /></button><button type="button" onClick={() => onOpenExact('/angelcare-360-command-center/personnes?plane=students&source=institutions')}><UsersRound size={21} /><span>Enfants actifs</span><strong>{record.activeChildren}</strong><small>Ouvrir les dossiers exacts</small><ChevronRight size={16} /></button><button type="button" onClick={() => onOpenExact('/angelcare-360-command-center/administration?plane=roles-permissions&view=users&source=institutions')}><ShieldCheck size={21} /><span>Utilisateurs autorisés</span><strong>{record.activeUsers}</strong><small>Vérifier les accès</small><ChevronRight size={16} /></button></section><SchoolAdminImpactPreview title="Situation actuelle" items={[{ key: 'year', label: record.currentAcademicYearLabel ? 'Année scolaire active' : 'Année scolaire à configurer', value: record.currentAcademicYearLabel }, { key: 'classes', label: `${record.classesCount} classe(s)`, value: `${record.capacity} places` }, { key: 'children', label: `${record.activeChildren} enfant(s) actif(s)` }, { key: 'sites', label: record.kind === 'school' ? `${record.sitesCount} site(s) rattaché(s)` : 'Site rattaché à l’établissement principal' }]} tone={record.blockersCount ? 'warning' : 'success'} /></div>
}

function TeamTab({ record, viewer, onAction, onOpenExact }: { record: InstitutionRecord; viewer: InstitutionAreaSnapshot['viewer']; onAction: (key: InstitutionAreaActionKey) => void; onOpenExact: (href: string) => void }) {
  const owner = record.kind === 'school' ? record.responsibleLabel : record.coordinatorLabel
  return <div className={styles.tabStack}><SchoolAdminSituationSummary summary={owner ? `${owner} est responsable de ce dossier.` : 'Aucun responsable n’a encore été attribué.'} reason="La responsabilité permet de savoir qui doit terminer les informations, documents et vérifications." consequence={owner ? 'Les prochaines actions peuvent être suivies et attribuées clairement.' : 'Les tâches risquent de rester sans suivi.'} tone={owner ? 'success' : 'warning'} /><section className={styles.responsibilityCard}><div><UserRoundCheck size={24} /><span>{record.kind === 'school' ? 'Responsable administratif' : 'Coordinateur du site'}</span><strong>{owner || 'À attribuer'}</strong><small>{record.activeUsers} utilisateur(s) autorisé(s)</small></div>{viewer.canAssign ? <button type="button" onClick={() => onAction(record.kind === 'school' ? 'institution.assign_responsible' : 'site.assign_coordinator')}>{owner ? 'Modifier la responsabilité' : 'Attribuer maintenant'}<ChevronRight size={16} /></button> : <SchoolAdminPermissionRequest message="Une personne autorisée doit attribuer la responsabilité." />}</section><button type="button" className={styles.exactLink} onClick={() => onOpenExact('/angelcare-360-command-center/administration?plane=roles-permissions&view=users&source=institutions')}>Voir les utilisateurs et leurs accès<ChevronRight size={16} /></button></div>
}

function DocumentsTab({ record, onAction, onOpenExact }: { record: InstitutionRecord; onAction: (key: InstitutionAreaActionKey, options?: { documentId?: string | null }) => void; onOpenExact: (href: string) => void }) {
  return <div className={styles.tabStack}><div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Documents</span><h3>Documents et vérifications</h3><p>Les documents restent privés et rattachés au dossier exact.</p></div><button type="button" onClick={() => onAction('institution.request_document')}><FilePlus2 size={16} />Demander un document</button></div>{record.documents.length ? <div className={styles.documentList}>{record.documents.map((document) => <article key={document.id} data-status={document.status}><span><FileText size={20} /></span><div><strong>{document.title}</strong><p>{document.category} · {document.fileName || 'Fichier privé'}</p><small>Ajouté le {formatDate(document.createdAt)}{document.expiresAt ? ` · expire le ${formatDate(document.expiresAt)}` : ''}</small></div><SchoolAdminHumanStatus tone={document.status === 'verified' ? 'success' : document.status === 'expired' ? 'critical' : 'warning'} label={document.status === 'verified' ? 'Vérifié' : document.status === 'expired' ? 'Expiré' : document.status === 'replaced' ? 'Remplacé' : 'À vérifier'} /><div>{document.filePath ? <button type="button" onClick={() => onOpenExact(`/angelcare-360-command-center/documents?entity=${document.id}&drawer=document&source=institutions`)}>Voir</button> : null}{document.status === 'to_verify' ? <button type="button" className={styles.documentVerify} onClick={() => onAction('institution.verify_document', { documentId: document.id })}>Vérifier</button> : null}</div></article>)}</div> : <SchoolAdminEmptyState title="Aucun document ajouté" detail="Ajoutez ou demandez les documents nécessaires à la préparation administrative." actionLabel="Demander un document" onAction={() => onAction('institution.request_document')} />}</div>
}

function DossierHistoryTab({ record }: { record: InstitutionRecord }) {
  return <div className={styles.tabStack}>{record.history.length ? <div className={styles.dossierTimeline}>{record.history.map((event) => <article key={event.id}><span data-tone={event.tone} /><div><strong>{event.label}</strong><p>{event.detail || 'Modification enregistrée dans le dossier.'}</p><small>{event.actorLabel || 'Système'} · {formatDate(event.createdAt, true)}</small></div></article>)}</div> : <SchoolAdminEmptyState title="Aucun changement enregistré" detail="Les modifications, validations et décisions apparaîtront ici." />}{record.notes.length ? <section className={styles.notesSection}><div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Notes de l’équipe</span><h3>Contexte administratif</h3></div></div>{record.notes.map((note) => <article key={note.id} data-important={note.important || undefined}><NotebookPen size={17} /><div><p>{note.body}</p><small>{note.authorLabel} · {formatDate(note.createdAt, true)}</small></div></article>)}</section> : null}</div>
}

function ActionChamber({ state, snapshot, busy, onChange, onSubmit, onClose }: { state: ActionState; snapshot: InstitutionAreaSnapshot; busy: boolean; onChange: (state: ActionState) => void; onSubmit: () => void; onClose: () => void }) {
  const record = state.record
  const needsReason = ['institution.suspend', 'site.suspend', 'institution.begin_closure', 'site.begin_closure', 'institution.close', 'site.close', 'institution.task.complete', 'institution.task.reopen', 'institution.verify_document'].includes(state.key)
  const isDanger = ['institution.suspend', 'site.suspend', 'institution.close', 'site.close', 'institution.archive'].includes(state.key)
  const dirty = Boolean(state.reason || JSON.stringify(state.values) !== state.initialSignature)
  return <CustomerOverlaySurface kind="nested-command" onClose={onClose} dirty={dirty} className={styles.actionOverlay} ariaLabel={state.title}>
    <section className={styles.actionChamber} role="dialog" aria-modal="true" aria-label={state.title} onMouseDown={(event) => event.stopPropagation()}>
      <header><div><span className={styles.eyebrow}>Action sur le dossier</span><h2>{state.title}</h2><p>{state.description}</p></div><button type="button" onClick={onClose} aria-label="Fermer"><X size={20} /></button></header>
      <div className={styles.actionBody}>
        {record ? <SchoolAdminAssignmentPanel owner={record.kind === 'school' ? record.responsibleLabel : record.coordinatorLabel} updatedAt={formatDate(record.updatedAt, true)} nextStep={record.nextActionLabel} /> : null}
        <ActionFields state={state} snapshot={snapshot} onChange={onChange} />
        {needsReason ? <label className={styles.fullField}><span>Pourquoi cette action est-elle nécessaire ?</span><textarea value={state.reason} onChange={(event) => onChange({ ...state, reason: event.target.value })} placeholder="Expliquez simplement la raison…" /></label> : null}
        {['institution.open', 'institution.suspend', 'institution.reopen', 'institution.begin_closure', 'institution.close', 'site.suspend', 'site.reopen', 'site.begin_closure', 'site.close'].includes(state.key) ? <label><span>Date effective</span><input type="date" value={state.effectiveAt} onChange={(event) => onChange({ ...state, effectiveAt: event.target.value })} /></label> : null}
        <Consequence state={state} />
        {state.blockers.length ? <SchoolAdminErrorState title="Cette action ne peut pas encore être terminée" detail="Complétez les éléments ci-dessous puis relancez la vérification." reference="AREA1-BLOCKED" /> : null}
        {state.blockers.length ? <div className={styles.blockerList}>{state.blockers.map((item) => <div key={item}><CircleAlert size={16} /><span>{item}</span></div>)}</div> : null}
      </div>
      <SchoolAdminActionDock note="Le résultat sera ajouté à l’historique du dossier." secondary={[{ key: 'cancel', label: 'Annuler', onClick: onClose }]} primary={{ label: primaryActionLabel(state.key), onClick: onSubmit, busy, danger: isDanger }} />
    </section>
  </CustomerOverlaySurface>
}

function ActionFields({ state, snapshot, onChange }: { state: ActionState; snapshot: InstitutionAreaSnapshot; onChange: (state: ActionState) => void }) {
  const setValue = (key: string, value: string | boolean) => onChange({ ...state, values: { ...state.values, [key]: value } })
  if (state.key === 'institution.update_information' || state.key === 'site.update_information' || state.key === 'site.create') return <div className={styles.formGrid}><label><span>Nom</span><input data-overlay-autofocus value={String(state.values.name || '')} onChange={(event) => setValue('name', event.target.value)} /></label>{state.key === 'site.create' ? <label><span>Code du site</span><input value={String(state.values.code || '')} onChange={(event) => setValue('code', event.target.value)} placeholder="SITE-RABAT-02" /></label> : null}<label><span>Type</span><select value={String(state.values.schoolType || 'site')} onChange={(event) => setValue('schoolType', event.target.value)}><option value="creche">Crèche</option><option value="maternelle">Maternelle</option><option value="ecole">École</option><option value="site">Site</option></select></label><label><span>Ville</span><input value={String(state.values.city || '')} onChange={(event) => setValue('city', event.target.value)} /></label><label className={styles.fullField}><span>Adresse</span><input value={String(state.values.address || '')} onChange={(event) => setValue('address', event.target.value)} /></label><label><span>Téléphone</span><input value={String(state.values.phone || '')} onChange={(event) => setValue('phone', event.target.value)} /></label><label><span>E-mail</span><input type="email" value={String(state.values.email || '')} onChange={(event) => setValue('email', event.target.value)} /></label><label><span>Site web</span><input value={String(state.values.website || '')} onChange={(event) => setValue('website', event.target.value)} /></label><label><span>Horaires</span><input value={String(state.values.operatingHours || '')} onChange={(event) => setValue('operatingHours', event.target.value)} placeholder="Lun–Ven · 08:00–18:00" /></label><label className={styles.fullField}><span>Présentation</span><textarea value={String(state.values.publicDescription || '')} onChange={(event) => setValue('publicDescription', event.target.value)} /></label></div>
  if (state.key === 'institution.assign_responsible' || state.key === 'site.assign_coordinator') return <div className={styles.formGrid}><label className={styles.fullField}><span>{state.key === 'institution.assign_responsible' ? 'Responsable administratif' : 'Coordinateur du site'}</span><select data-overlay-autofocus value={String(state.values.personUserId || '')} onChange={(event) => { const person = snapshot.directory.users.find((item) => item.id === event.target.value); onChange({ ...state, values: { ...state.values, personUserId: event.target.value, personLabel: person?.label || '' } }) }}><option value="">Sélectionner une personne</option>{snapshot.directory.users.map((item) => <option key={item.id} value={item.id}>{item.secondary ? `${item.label} · ${item.secondary}` : item.label}</option>)}</select><small>Seuls les comptes autorisés de votre établissement sont proposés.</small></label></div>
  if (state.key === 'institution.task.assign') return <div className={styles.formGrid}><label className={styles.fullField}><span>Tâche à effectuer</span><input data-overlay-autofocus value={String(state.values.title || '')} onChange={(event) => setValue('title', event.target.value)} placeholder="Ex. Vérifier les horaires d’ouverture" /></label><label className={styles.fullField}><span>Instructions</span><textarea value={String(state.values.description || '')} onChange={(event) => setValue('description', event.target.value)} /></label><label><span>Attribuer à</span><select value={String(state.values.ownerUserId || '')} onChange={(event) => { const person = snapshot.directory.users.find((item) => item.id === event.target.value); onChange({ ...state, values: { ...state.values, ownerUserId: event.target.value, ownerLabel: person?.label || '' } }) }}><option value="">À attribuer plus tard</option>{snapshot.directory.users.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label><span>À terminer avant</span><input type="date" value={String(state.values.dueAt || '')} onChange={(event) => setValue('dueAt', event.target.value)} /></label><label><span>Priorité</span><select value={String(state.values.priority || 'normal')} onChange={(event) => setValue('priority', event.target.value)}><option value="normal">Normale</option><option value="high">Importante</option><option value="urgent">Urgente</option><option value="low">Faible</option></select></label></div>
  if (state.key === 'institution.note.add') return <div className={styles.formGrid}><label className={styles.fullField}><span>Note interne</span><textarea data-overlay-autofocus value={String(state.values.body || '')} onChange={(event) => setValue('body', event.target.value)} placeholder="Information utile pour l’équipe administrative…" /></label><label className={styles.checkField}><input type="checkbox" checked={Boolean(state.values.important)} onChange={(event) => setValue('important', event.target.checked)} /><span>Marquer cette note comme importante</span></label></div>
  if (state.key === 'institution.request_document') return <div className={styles.formGrid}><label className={styles.fullField}><span>Document demandé</span><input data-overlay-autofocus value={String(state.values.title || '')} onChange={(event) => setValue('title', event.target.value)} placeholder="Ex. Autorisation administrative" /></label><label className={styles.fullField}><span>Précisions</span><textarea value={String(state.values.description || '')} onChange={(event) => setValue('description', event.target.value)} /></label><label><span>Responsable</span><select value={String(state.values.ownerUserId || '')} onChange={(event) => { const person = snapshot.directory.users.find((item) => item.id === event.target.value); onChange({ ...state, values: { ...state.values, ownerUserId: event.target.value, ownerLabel: person?.label || '' } }) }}><option value="">À attribuer plus tard</option>{snapshot.directory.users.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label><span>Échéance</span><input type="date" value={String(state.values.dueAt || '')} onChange={(event) => setValue('dueAt', event.target.value)} /></label></div>
  return null
}

function Consequence({ state }: { state: ActionState }) {
  const items: Array<{ key: string; label: string; value?: string }> = []
  if (state.key === 'institution.open' || state.key === 'site.open') items.push({ key: 'status', label: 'Le statut deviendra Ouvert' }, { key: 'access', label: 'Les fonctions autorisées deviendront utilisables' }, { key: 'history', label: 'La décision sera conservée dans l’historique' })
  else if (state.key.includes('suspend')) items.push({ key: 'admissions', label: 'Les nouvelles opérations pourront être limitées' }, { key: 'history', label: 'Les dossiers existants ne seront pas supprimés' }, { key: 'review', label: 'Une réouverture pourra être préparée plus tard' })
  else if (state.key.includes('close')) items.push({ key: 'records', label: 'L’historique restera consultable' }, { key: 'active', label: 'Les dossiers actifs doivent être terminés avant la fermeture' })
  else if (state.key.includes('assign')) items.push({ key: 'owner', label: 'La responsabilité apparaîtra dans le dossier' }, { key: 'tasks', label: 'Les prochaines actions seront clairement attribuées' })
  else if (state.key.includes('update_information')) items.push({ key: 'details', label: 'Les informations visibles seront mises à jour' }, { key: 'preparation', label: 'La préparation sera recalculée automatiquement' })
  else if (state.key === 'institution.prepare_opening') items.push({ key: 'check', label: 'Chaque étape de préparation sera vérifiée' }, { key: 'blockers', label: 'Les éléments manquants seront affichés clairement' }, { key: 'data', label: 'Aucune donnée ne sera modifiée pendant la vérification' })
  else items.push({ key: 'history', label: 'Le résultat sera conservé dans l’historique' }, { key: 'refresh', label: 'Le dossier et la page seront actualisés immédiatement' })
  return <SchoolAdminImpactPreview items={items} tone={state.key.includes('close') || state.key.includes('suspend') ? 'warning' : 'info'} />
}

function primaryActionLabel(key: InstitutionAreaActionKey) {
  const labels: Partial<Record<InstitutionAreaActionKey, string>> = {
    'institution.update_information': 'Enregistrer les informations',
    'site.update_information': 'Enregistrer le site',
    'site.create': 'Créer le site',
    'site.open': 'Ouvrir le site',
    'institution.assign_responsible': 'Attribuer le responsable',
    'site.assign_coordinator': 'Attribuer le coordinateur',
    'institution.request_document': 'Ajouter la demande',
    'institution.verify_document': 'Marquer le document comme vérifié',
    'institution.prepare_opening': 'Vérifier la préparation',
    'institution.request_opening_approval': 'Demander la validation',
    'institution.open': 'Ouvrir l’établissement',
    'institution.suspend': 'Suspendre l’établissement',
    'site.suspend': 'Suspendre le site',
    'institution.reopen': 'Rouvrir l’établissement',
    'site.reopen': 'Rouvrir le site',
    'institution.begin_closure': 'Commencer la fermeture',
    'site.begin_closure': 'Commencer la fermeture du site',
    'institution.close': 'Fermer l’établissement',
    'site.close': 'Fermer le site',
    'institution.archive': 'Archiver l’établissement',
    'institution.task.assign': 'Attribuer la tâche',
    'institution.task.start': 'Commencer la tâche',
    'institution.task.complete': 'Marquer comme terminée',
    'institution.task.reopen': 'Réouvrir la tâche',
    'institution.note.add': 'Ajouter la note',
  }
  return labels[key] || 'Enregistrer'
}

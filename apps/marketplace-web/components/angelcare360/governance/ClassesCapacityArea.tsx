'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeftRight,
  BadgeCheck,
  BookOpenCheck,
  Boxes,
  CalendarClock,
  Check,
  ChevronRight,
  CircleGauge,
  Clock3,
  FileClock,
  Filter,
  GraduationCap,
  History,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  MoveRight,
  PanelRightOpen,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Split,
  TableProperties,
  TicketCheck,
  UserCheck,
  Users,
  UsersRound,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
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
  SchoolAdminImpactPreview,
  SchoolAdminNextAction,
  SchoolAdminSituationSummary,
} from '@/components/angelcare360/customer-experience/SchoolAdminWorkbench'
import type {
  CapacityActionKey,
  CapacityActionRequest,
  CapacityActionResult,
  CapacityAttentionItem,
  CapacityClassRecord,
  CapacityDossierKind,
  CapacityDossierTab,
  CapacityMovementRun,
  CapacityReservation,
  CapacitySectionRecord,
  CapacityTone,
  ClassesCapacitySnapshot,
  ClassesCapacityView,
} from '@/types/angelcare360/classes-capacity-area'
import styles from './ClassesCapacityArea.module.css'

type Props = {
  initialSnapshot: ClassesCapacitySnapshot
  initialView: ClassesCapacityView
  initialEntityId: string | null
  initialEntityKind: CapacityDossierKind | null
  initialTab: CapacityDossierTab | null
}

type Toast = { kind: 'success' | 'warning' | 'error'; message: string } | null

type SelectedDossier = {
  kind: CapacityDossierKind
  id: string
  tab: CapacityDossierTab
  mode: 'peek' | 'dossier' | 'focus'
}

type ActionChamber = {
  actionKey: CapacityActionKey
  classId: string | null
  sectionId: string | null
  reservationId: string | null
  movementRunId: string | null
  movementItemId: string | null
  issueId: string | null
  studentIds: string[]
  values: Record<string, string>
  dirty: boolean
}

const VIEWS: Array<{ key: ClassesCapacityView; label: string; icon: LucideIcon }> = [
  { key: 'today', label: 'Aujourd’hui', icon: CircleGauge },
  { key: 'classes', label: 'Classes', icon: Boxes },
  { key: 'sections', label: 'Sections', icon: Layers3 },
  { key: 'places', label: 'Places disponibles', icon: TicketCheck },
  { key: 'waiting', label: 'Demandes en attente', icon: Clock3 },
  { key: 'movements', label: 'Mouvements d’enfants', icon: ArrowLeftRight },
  { key: 'attention', label: 'À régler', icon: AlertTriangle },
  { key: 'projections', label: 'Prévisions', icon: CalendarClock },
  { key: 'history', label: 'Historique', icon: History },
]

const TABS: Array<{ key: CapacityDossierTab; label: string }> = [
  { key: 'todo', label: 'À faire' },
  { key: 'children', label: 'Enfants' },
  { key: 'places', label: 'Places' },
  { key: 'organisation', label: 'Organisation' },
  { key: 'waiting', label: 'Demandes en attente' },
  { key: 'movements', label: 'Mouvements' },
  { key: 'history', label: 'Historique' },
]

const ACTION_COPY: Record<CapacityActionKey, { title: string; description: string; submit: string; tone?: 'danger' }> = {
  'class.create': { title: 'Créer une classe', description: 'Préparez le niveau, le nombre de places et l’organisation initiale.', submit: 'Créer la classe' },
  'class.update': { title: 'Mettre à jour la classe', description: 'Modifiez uniquement les informations nécessaires sans perdre l’historique.', submit: 'Enregistrer les modifications' },
  'class.open': { title: 'Ouvrir la classe', description: 'Autorisez les affectations lorsque les informations essentielles sont prêtes.', submit: 'Ouvrir la classe' },
  'class.freeze_placements': { title: 'Suspendre les nouvelles affectations', description: 'Les enfants déjà inscrits restent dans la classe. Les nouvelles affectations seront bloquées.', submit: 'Suspendre les affectations', tone: 'danger' },
  'class.unfreeze_placements': { title: 'Autoriser de nouveau les affectations', description: 'La classe pourra recevoir de nouvelles affectations selon ses places réelles.', submit: 'Autoriser les affectations' },
  'class.begin_closure': { title: 'Préparer la fermeture', description: 'Vérifiez les enfants, réservations et demandes avant la fermeture.', submit: 'Commencer la fermeture' },
  'class.close': { title: 'Fermer la classe', description: 'La classe sera fermée sans supprimer son historique.', submit: 'Fermer la classe', tone: 'danger' },
  'class.archive': { title: 'Archiver la classe', description: 'Retirez cette classe des listes actives tout en conservant son historique.', submit: 'Archiver la classe', tone: 'danger' },
  'section.create': { title: 'Créer une section', description: 'Ajoutez une subdivision pour mieux répartir les enfants du même niveau.', submit: 'Créer cette section' },
  'section.update': { title: 'Mettre à jour la section', description: 'Modifiez le nom, la salle ou l’organisation locale.', submit: 'Enregistrer la section' },
  'section.assign_responsible': { title: 'Attribuer une responsable', description: 'Choisissez la personne qui suivra cette section.', submit: 'Attribuer la responsable' },
  'section.freeze_placements': { title: 'Suspendre les affectations de la section', description: 'Aucune nouvelle affectation ne sera confirmée dans cette section.', submit: 'Suspendre les affectations', tone: 'danger' },
  'section.unfreeze_placements': { title: 'Réouvrir les affectations de la section', description: 'La section pourra recevoir de nouvelles affectations.', submit: 'Autoriser les affectations' },
  'section.begin_closure': { title: 'Préparer la fermeture de la section', description: 'Vérifiez la répartition des enfants avant la fermeture.', submit: 'Commencer la fermeture' },
  'section.close': { title: 'Fermer la section', description: 'La section sera fermée sans supprimer les mouvements antérieurs.', submit: 'Fermer la section', tone: 'danger' },
  'capacity.preview_change': { title: 'Simuler un nouveau nombre de places', description: 'Comparez la situation actuelle et la situation proposée sans modifier les données.', submit: 'Afficher la simulation' },
  'capacity.request_change': { title: 'Préparer une modification de capacité', description: 'Indiquez le nombre souhaité, la date et le motif.', submit: 'Préparer la modification' },
  'capacity.approve_change': { title: 'Valider la nouvelle capacité', description: 'Vérifiez l’impact avant de donner l’accord de la direction.', submit: 'Valider la capacité' },
  'capacity.apply_change': { title: 'Appliquer la nouvelle capacité', description: 'Le nouveau nombre de places deviendra la référence opérationnelle.', submit: 'Appliquer la nouvelle capacité' },
  'capacity.request_exception': { title: 'Demander une autorisation temporaire', description: 'Cette autorisation expirera automatiquement à la date indiquée.', submit: 'Demander l’autorisation' },
  'capacity.approve_exception': { title: 'Valider l’autorisation temporaire', description: 'Vérifiez la durée, le motif et les enfants concernés.', submit: 'Valider temporairement' },
  'capacity.expire_exception': { title: 'Terminer l’autorisation temporaire', description: 'La capacité normale redeviendra immédiatement la référence.', submit: 'Terminer l’autorisation', tone: 'danger' },
  'capacity.request_topup': { title: 'Demander des places supplémentaires', description: 'La demande sera liée à votre formule et au compteur contractuel réel.', submit: 'Envoyer la demande' },
  'seat.reserve': { title: 'Réserver une place', description: 'Bloquez temporairement une place jusqu’à la date indiquée.', submit: 'Réserver la place' },
  'seat.confirm': { title: 'Confirmer l’utilisation de la place', description: 'La réservation sera marquée comme utilisée.', submit: 'Confirmer la place' },
  'seat.extend': { title: 'Prolonger la réservation', description: 'Une justification et une nouvelle date sont nécessaires.', submit: 'Prolonger la réservation' },
  'seat.release': { title: 'Libérer la place', description: 'La place redeviendra disponible immédiatement.', submit: 'Libérer la place' },
  'seat.cancel': { title: 'Annuler la réservation', description: 'La réservation sera annulée et conservée dans l’historique.', submit: 'Annuler la réservation', tone: 'danger' },
  'placement.preview': { title: 'Vérifier la place disponible', description: 'SANILA contrôle la capacité réelle et la limite de votre formule.', submit: 'Vérifier la place' },
  'placement.assign': { title: 'Attribuer la place', description: 'Confirmez la classe, la section et la date d’entrée de l’enfant.', submit: 'Attribuer cette place' },
  'placement.cancel': { title: 'Terminer l’affectation', description: 'L’ancienne affectation restera visible dans l’historique.', submit: 'Terminer l’affectation', tone: 'danger' },
  'population_move.preview': { title: 'Prévisualiser le déplacement', description: 'Comparez les effectifs avant et après sans modifier les dossiers.', submit: 'Afficher la nouvelle répartition' },
  'population_move.execute': { title: 'Déplacer vers une autre classe', description: 'Chaque enfant recevra un résultat individuel et traçable.', submit: 'Confirmer le déplacement' },
  'population_move.retry_item': { title: 'Réessayer ce déplacement', description: 'Seul le dossier corrigé sera retraité.', submit: 'Réessayer cet enfant' },
  'population_move.cancel': { title: 'Annuler le mouvement', description: 'Le mouvement sera annulé avant sa finalisation.', submit: 'Annuler le mouvement', tone: 'danger' },
  'class_split.preview': { title: 'Préparer une nouvelle section', description: 'Comparez une proposition de répartition avant de créer la nouvelle organisation.', submit: 'Prévisualiser la répartition' },
  'class_split.execute': { title: 'Créer la section et répartir les enfants', description: 'Les résultats seront enregistrés enfant par enfant.', submit: 'Créer et répartir' },
  'section_merge.preview': { title: 'Préparer la réunion des sections', description: 'Vérifiez l’effectif, la capacité et les responsables concernés.', submit: 'Prévisualiser la réunion' },
  'section_merge.execute': { title: 'Réunir les sections', description: 'Les anciennes sections resteront historiquement reconstructibles.', submit: 'Réunir les sections' },
  'capacity_issue.assign': { title: 'Attribuer ce point', description: 'Choisissez une personne, une échéance et une instruction claire.', submit: 'Attribuer' },
  'capacity_issue.resolve': { title: 'Marquer comme réglé', description: 'SANILA vérifiera que les conditions réelles sont satisfaites.', submit: 'Marquer comme réglé' },
  'capacity_issue.reopen': { title: 'Réouvrir ce point', description: 'Le point reviendra dans la liste des actions à traiter.', submit: 'Réouvrir' },
  'capacity_note.add': { title: 'Ajouter une note interne', description: 'Conservez le contexte utile pour l’équipe administrative.', submit: 'Ajouter la note' },
  'capacity_evidence.request': { title: 'Demander un justificatif', description: 'Créez une demande claire, attribuée et datée.', submit: 'Demander le justificatif' },
}

const VIEW_DESCRIPTIONS: Record<ClassesCapacityView, string> = {
  today: 'Les classes, places et décisions qui nécessitent votre attention aujourd’hui.',
  classes: 'Toutes les classes de l’année active, leurs effectifs et leurs prochaines actions.',
  sections: 'Les sections, leurs responsables, leurs places et leur organisation locale.',
  places: 'Les places prévues, utilisées, réservées et disponibles, sans mélanger la limite de votre formule.',
  waiting: 'Les admissions acceptées ou en attente qui doivent recevoir une place.',
  movements: 'Les changements de classe, répartitions, échecs et réparations enfant par enfant.',
  attention: 'Les situations qui empêchent une affectation sûre ou nécessitent une décision.',
  projections: 'L’effectif futur expliqué à partir des réservations, admissions et passages approuvés.',
  history: 'Les changements de capacité, affectations, réservations et mouvements conservés dans le temps.',
}

function toneToWorkbench(tone: CapacityTone): 'neutral' | 'info' | 'success' | 'warning' | 'critical' | 'approval' {
  if (tone === 'verified') return 'success'
  if (tone === 'critical') return 'critical'
  if (tone === 'warning') return 'warning'
  if (tone === 'decision') return 'approval'
  if (tone === 'active') return 'info'
  return 'neutral'
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Non renseignée'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date)
}

function actionDefaults(actionKey: CapacityActionKey, context?: { classId?: string | null; sectionId?: string | null; reservationId?: string | null; movementRunId?: string | null; movementItemId?: string | null; issueId?: string | null; studentIds?: string[]; issueTitle?: string; issueExplanation?: string; issueConsequence?: string | null; issueSeverity?: string; recommendedActionKey?: string | null; recommendedActionLabel?: string | null }): ActionChamber {
  return {
    actionKey,
    classId: context?.classId || null,
    sectionId: context?.sectionId || null,
    reservationId: context?.reservationId || null,
    movementRunId: context?.movementRunId || null,
    movementItemId: context?.movementItemId || null,
    issueId: context?.issueId || null,
    studentIds: context?.studentIds || [],
    values: {
      academicYearId: '', classCode: '', name: '', level: '', capacity: '', newCapacity: '', temporaryCapacity: '', quantity: '', reason: '', effectiveAt: new Date().toISOString().slice(0, 10), expiresAt: '', reviewAt: '', targetClassId: '', targetSectionId: '', sourceClassId: context?.classId || '', sourceSectionId: context?.sectionId || '', sectionCode: '', room: '', responsibleStaffId: '', responsibleLabel: '', ownerUserId: '', ownerLabel: '', dueAt: '', body: '', title: '', description: '', studentId: context?.studentIds?.[0] || '', admissionApplicationId: '', enrolledOn: new Date().toISOString().slice(0, 10), enrollmentId: '', changeId: '', exceptionId: '', newSectionCode: '', newSectionName: '', newSectionCapacity: '', issueTitle: context?.issueTitle || '', issueExplanation: context?.issueExplanation || '', issueConsequence: context?.issueConsequence || '', issueSeverity: context?.issueSeverity || '', recommendedActionKey: context?.recommendedActionKey || '', recommendedActionLabel: context?.recommendedActionLabel || '',
    },
    dirty: false,
  }
}

export default function ClassesCapacityArea({ initialSnapshot, initialView, initialEntityId, initialEntityKind, initialTab }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [view, setView] = useState<ClassesCapacityView>(VIEWS.some((item) => item.key === initialView) ? initialView : 'today')
  const [dossier, setDossier] = useState<SelectedDossier | null>(initialEntityId && initialEntityKind ? { kind: initialEntityKind, id: initialEntityId, tab: initialTab || 'todo', mode: 'dossier' } : null)
  const [action, setAction] = useState<ActionChamber | null>(null)
  const [search, setSearch] = useState('')
  const [tone, setTone] = useState<'all' | CapacityTone>('all')
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [simulation, setSimulation] = useState<Record<string, unknown> | null>(null)

  const updateUrl = useCallback((updates: Record<string, string | null>, mode: 'push' | 'replace' = 'push') => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('plane', 'classes-capacity')
    Object.entries(updates).forEach(([key, value]) => value ? params.set(key, value) : params.delete(key))
    const href = `${pathname}?${params.toString()}`
    if (mode === 'replace') router.replace(href, { scroll: false })
    else router.push(href, { scroll: false })
  }, [pathname, router, searchParams])

  const chooseView = (next: ClassesCapacityView) => {
    setView(next)
    setDossier(null)
    updateUrl({ view: next, entity: null, type: null, drawer: null, tab: null, focus: null })
  }

  const openDossier = (kind: CapacityDossierKind, id: string, tab: CapacityDossierTab = 'todo', mode: SelectedDossier['mode'] = 'dossier') => {
    setDossier({ kind, id, tab, mode })
    updateUrl({ view, entity: id, type: kind, drawer: mode, tab })
  }

  const closeDossier = () => {
    setDossier(null)
    setSelectedStudentIds([])
    updateUrl({ entity: null, type: null, drawer: null, tab: null, focus: null })
  }

  const changeTab = (tab: CapacityDossierTab) => {
    if (!dossier) return
    setDossier({ ...dossier, tab })
    updateUrl({ tab }, 'replace')
  }

  const refresh = useCallback(async () => {
    setBusy('refresh')
    setError(null)
    try {
      const response = await fetch('/api/angelcare360/classes-capacity', { cache: 'no-store' })
      const data = await response.json() as { ok: boolean; snapshot?: ClassesCapacitySnapshot; message?: string }
      if (!response.ok || !data.ok || !data.snapshot) throw new Error(data.message || 'Les classes et places ne peuvent pas être actualisées.')
      setSnapshot(data.snapshot)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Les classes et places ne peuvent pas être actualisées.')
    } finally { setBusy(null) }
  }, [])

  const showToast = (next: Toast) => {
    setToast(next)
    if (next) window.setTimeout(() => setToast((current) => current === next ? null : current), 3000)
  }

  const execute = async (chamber: ActionChamber) => {
    setBusy(chamber.actionKey)
    setError(null)
    try {
      const request: CapacityActionRequest = {
        actionKey: chamber.actionKey,
        classId: chamber.classId,
        sectionId: chamber.sectionId,
        reservationId: chamber.reservationId,
        movementRunId: chamber.movementRunId,
        movementItemId: chamber.movementItemId,
        issueId: chamber.issueId,
        studentIds: chamber.studentIds,
        reason: chamber.values.reason || null,
        effectiveAt: chamber.values.effectiveAt || null,
        payload: { ...chamber.values, studentIds: chamber.studentIds, title: chamber.values.issueTitle || chamber.values.title, explanation: chamber.values.issueExplanation, consequence: chamber.values.issueConsequence, severity: chamber.values.issueSeverity, recommendedActionKey: chamber.values.recommendedActionKey, recommendedActionLabel: chamber.values.recommendedActionLabel },
        idempotencyKey: `${chamber.actionKey}:${chamber.classId || chamber.sectionId || chamber.reservationId || chamber.movementRunId || 'new'}:${JSON.stringify(chamber.values)}:${chamber.studentIds.join(',')}`,
      }
      const endpoint = chamber.classId || chamber.sectionId || chamber.movementRunId || chamber.reservationId || chamber.issueId
        ? `/api/angelcare360/classes-capacity/${chamber.classId || chamber.sectionId || chamber.movementRunId || chamber.reservationId || chamber.issueId}?kind=${chamber.classId ? 'class' : chamber.sectionId ? 'section' : chamber.movementRunId ? 'movement' : chamber.reservationId ? 'reservation' : 'issue'}`
        : '/api/angelcare360/classes-capacity'
      const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request) })
      const data = await response.json() as CapacityActionResult & { message?: string }
      if (!response.ok || !data.ok) throw new Error(data.message || 'Cette action n’a pas pu être terminée.')
      if (data.state === 'preview') {
        setSimulation(data.result || {})
        showToast({ kind: 'success', message: data.message })
      } else {
        if (data.snapshot) setSnapshot(data.snapshot)
        else await refresh()
        setAction(null)
        setSimulation(null)
        setSelectedStudentIds([])
        showToast({ kind: data.state === 'partially_failed' ? 'warning' : 'success', message: data.message })
        if (data.classId && chamber.actionKey === 'class.create') openDossier('class', data.classId, 'todo')
        if (data.sectionId && chamber.actionKey === 'section.create') openDossier('section', data.sectionId, 'todo')
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Cette action n’a pas pu être terminée.'
      setError(message)
      showToast({ kind: 'error', message })
    } finally { setBusy(null) }
  }

  const selectedRecord = useMemo(() => {
    if (!dossier) return null
    if (dossier.kind === 'class') return snapshot.classes.find((item) => item.id === dossier.id) || null
    if (dossier.kind === 'section') return snapshot.sections.find((item) => item.id === dossier.id) || null
    if (dossier.kind === 'movement') return snapshot.movements.find((item) => item.id === dossier.id) || null
    if (dossier.kind === 'reservation') return snapshot.reservations.find((item) => item.id === dossier.id) || null
    return snapshot.attention.find((item) => item.id === dossier.id) || null
  }, [dossier, snapshot])

  const filteredClasses = useMemo(() => snapshot.classes.filter((item) => {
    const matchesSearch = !search || `${item.name} ${item.code} ${item.level} ${item.siteLabel || ''}`.toLowerCase().includes(search.toLowerCase())
    const matchesTone = tone === 'all' || item.tone === tone
    return matchesSearch && matchesTone
  }), [search, snapshot.classes, tone])

  const filteredSections = useMemo(() => snapshot.sections.filter((item) => {
    const parent = snapshot.classes.find((candidate) => candidate.id === item.classId)
    return !search || `${item.name} ${item.code} ${parent?.name || ''}`.toLowerCase().includes(search.toLowerCase())
  }), [search, snapshot.classes, snapshot.sections])

  const openAction = (actionKey: CapacityActionKey, context?: Parameters<typeof actionDefaults>[1]) => {
    setSimulation(null)
    setAction(actionDefaults(actionKey, context))
  }

  const selectedClass = dossier?.kind === 'class' ? selectedRecord as CapacityClassRecord | null : null
  const selectedSection = dossier?.kind === 'section' ? selectedRecord as CapacitySectionRecord | null : null

  return <section className={styles.area} data-mode={snapshot.mode}>
    <header className={styles.commandCrown}>
      <div className={styles.crownIdentity}>
        <span className={styles.crownIcon}><UsersRound size={24}/></span>
        <div>
          <span className={styles.eyebrow}>Classes & places</span>
          <h1>{snapshot.title}</h1>
          <p>{snapshot.subtitle}</p>
          <div className={styles.contextLine}><strong>{snapshot.school.name}</strong><span>{snapshot.academicYear?.label || 'Aucune année scolaire active'}</span><span>{snapshot.viewer.roleLabel}</span></div>
        </div>
      </div>
      <div className={styles.crownActions}>
        <button type="button" className={styles.secondaryButton} onClick={refresh} disabled={busy === 'refresh'}>{busy === 'refresh' ? <LoaderCircle className={styles.spin} size={17}/> : <RefreshCw size={17}/>} Actualiser</button>
        <button type="button" className={styles.secondaryButton} onClick={() => openAction('section.create', { classId: snapshot.classes[0]?.id || null })}><Layers3 size={17}/> Ajouter une section</button>
        <button type="button" className={styles.primaryButton} onClick={() => openAction('class.create')}><Plus size={17}/> Créer une classe</button>
      </div>
    </header>

    <section className={styles.metrics}>
      {snapshot.metrics.map((metric) => <button key={metric.key} type="button" className={styles.metric} data-tone={metric.tone} onClick={() => chooseView(metric.view)}>
        <span className={styles.metricSignal}/><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small><ChevronRight size={17}/>
      </button>)}
    </section>

    <nav className={styles.localNavigation} aria-label="Espaces Classes et places">
      {VIEWS.map(({ key, label, icon: Icon }) => <button key={key} type="button" data-active={view === key} onClick={() => chooseView(key)}><Icon size={16}/><span>{label}</span></button>)}
    </nav>

    <section className={styles.viewHeading}>
      <div><span className={styles.eyebrow}>Espace de travail</span><h2>{VIEWS.find((item) => item.key === view)?.label}</h2><p>{VIEW_DESCRIPTIONS[view]}</p></div>
      <div className={styles.toolbar}>
        <label><Search size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Trouver une classe, une section ou un enfant…"/></label>
        <select value={tone} onChange={(event) => setTone(event.target.value as typeof tone)} aria-label="Filtrer par état"><option value="all">Tous les états</option><option value="verified">En ordre</option><option value="warning">À vérifier</option><option value="critical">Bloqué</option><option value="decision">Décision</option></select>
        <button type="button" className={styles.iconButton} title="Afficher les éléments à régler" onClick={() => chooseView('attention')}><Filter size={17}/></button>
      </div>
    </section>

    {error ? <SchoolAdminErrorState detail={error} onRetry={refresh}/> : null}

    {view === 'today' ? <TodayView snapshot={snapshot} onView={chooseView} onClass={(id) => openDossier('class', id)} onSection={(id) => openDossier('section', id)} onIssue={(id) => openDossier('issue', id)} onAction={openAction}/> : null}
    {view === 'classes' ? <ClassesView records={filteredClasses} onOpen={(id) => openDossier('class', id)} onCreate={() => openAction('class.create')} onAction={openAction}/> : null}
    {view === 'sections' ? <SectionsView records={filteredSections} classes={snapshot.classes} onOpen={(id) => openDossier('section', id)} onCreate={() => openAction('section.create', { classId: snapshot.classes[0]?.id || null })}/> : null}
    {view === 'places' ? <PlacesView snapshot={snapshot} onClass={(id) => openDossier('class', id, 'places')} onTopup={() => openAction('capacity.request_topup', { classId: snapshot.classes[0]?.id || null })}/> : null}
    {view === 'waiting' ? <WaitingView snapshot={snapshot} onClass={(id) => openDossier('class', id, 'waiting')} onPlace={(classId, studentId, applicationId) => { const next = actionDefaults('placement.assign', { classId, studentIds: studentId ? [studentId] : [] }); next.values.studentId = studentId || ''; next.values.admissionApplicationId = applicationId; setAction(next) }}/>: null}
    {view === 'movements' ? <MovementsView records={snapshot.movements} onOpen={(id) => openDossier('movement', id)} onCreate={() => openAction('population_move.preview', { classId: snapshot.classes[0]?.id || null })}/> : null}
    {view === 'attention' ? <AttentionView records={snapshot.attention} onOpen={(item) => item.sourceType === 'class' ? openDossier('class', item.sourceId) : item.sourceType === 'section' ? openDossier('section', item.sourceId) : openDossier('issue', item.id)} onAction={(item) => item.recommendedActionKey && openAction(item.recommendedActionKey, { classId: item.sourceType === 'class' ? item.sourceId : null, sectionId: item.sourceType === 'section' ? item.sourceId : null, issueId: item.id, issueTitle: item.title, issueExplanation: item.explanation, issueConsequence: item.consequence, issueSeverity: item.severity, recommendedActionKey: item.recommendedActionKey, recommendedActionLabel: item.recommendedActionLabel })}/> : null}
    {view === 'projections' ? <ProjectionsView snapshot={snapshot} onOpen={(id) => openDossier('class', id, 'places')} onArea2={(id) => router.push(`/angelcare-360-command-center/administration?plane=academic-structure&view=next-year&class=${id}&source=classes-capacity`)}/> : null}
    {view === 'history' ? <HistoryView snapshot={snapshot}/> : null}

    {dossier && selectedRecord ? <CustomerOverlaySurface kind={dossier.mode === 'focus' ? 'focus-command' : 'dossier'} onClose={closeDossier} ariaLabel="Dossier Classes et places">
      <div className={styles.dossier} data-kind={dossier.kind}>
        <DossierHeader dossier={dossier} record={selectedRecord} snapshot={snapshot} onClose={closeDossier} onFocus={() => setDossier({ ...dossier, mode: dossier.mode === 'focus' ? 'dossier' : 'focus' })}/>
        {dossier.kind === 'class' || dossier.kind === 'section' ? <nav className={styles.dossierTabs} aria-label="Sections du dossier">{TABS.map((tab) => <button key={tab.key} type="button" data-active={dossier.tab === tab.key} onClick={() => changeTab(tab.key)}>{tab.label}</button>)}</nav> : null}
        <div className={styles.dossierBody}>
          {dossier.kind === 'class' && selectedClass ? <ClassDossier record={selectedClass} tab={dossier.tab} snapshot={snapshot} selectedStudentIds={selectedStudentIds} setSelectedStudentIds={setSelectedStudentIds} onAction={openAction} onOpenSection={(id) => openDossier('section', id)} onOpenMovement={(id) => openDossier('movement', id)} onOpenReservation={(id) => openDossier('reservation', id)} onLink={(href) => router.push(href)}/> : null}
          {dossier.kind === 'section' && selectedSection ? <SectionDossier record={selectedSection} tab={dossier.tab} snapshot={snapshot} selectedStudentIds={selectedStudentIds} setSelectedStudentIds={setSelectedStudentIds} onAction={openAction} onLink={(href) => router.push(href)}/> : null}
          {dossier.kind === 'movement' ? <MovementDossier record={selectedRecord as CapacityMovementRun} onAction={openAction}/> : null}
          {dossier.kind === 'reservation' ? <ReservationDossier record={selectedRecord as CapacityReservation} onAction={openAction} onLink={(href) => router.push(href)}/> : null}
          {dossier.kind === 'issue' ? <IssueDossier record={selectedRecord as CapacityAttentionItem} onAction={openAction}/> : null}
        </div>
      </div>
    </CustomerOverlaySurface> : null}

    {action ? <CustomerOverlaySurface kind="nested-command" onClose={() => { setAction(null); setSimulation(null) }} dirty={action.dirty} ariaLabel={ACTION_COPY[action.actionKey].title}>
      <ActionStudio chamber={action} setChamber={setAction} snapshot={snapshot} simulation={simulation} busy={busy === action.actionKey} error={error} onSubmit={() => execute(action)} onClose={() => { setAction(null); setSimulation(null) }}/>
    </CustomerOverlaySurface> : null}

    {toast ? <CustomerOverlayPortal><div className={styles.toast} data-kind={toast.kind} role="status">{toast.kind === 'success' ? <BadgeCheck size={18}/> : <AlertTriangle size={18}/>}<span>{toast.message}</span><button type="button" onClick={() => setToast(null)} aria-label="Fermer"><X size={15}/></button></div></CustomerOverlayPortal> : null}
  </section>
}

function TodayView({ snapshot, onView, onClass, onSection, onIssue, onAction }: { snapshot: ClassesCapacitySnapshot; onView: (view: ClassesCapacityView) => void; onClass: (id: string) => void; onSection: (id: string) => void; onIssue: (id: string) => void; onAction: (key: CapacityActionKey, context?: Parameters<typeof actionDefaults>[1]) => void }) {
  const priority = snapshot.attention.filter((item) => !item.resolved).slice(0, 6)
  const next = priority[0]
  return <div className={styles.todayGrid}>
    <section className={styles.heroPanel}>
      <div className={styles.heroVisual}><UsersRound size={31}/><div><span>Répartition actuelle</span><strong>{snapshot.classes.reduce((sum, item) => sum + item.activeChildren, 0)}</strong><small>enfants dans {snapshot.classes.length} classe(s)</small></div></div>
      <div className={styles.heroStats}><button type="button" onClick={() => onView('places')}><strong>{snapshot.classes.reduce((sum, item) => sum + item.availablePlaces, 0)}</strong><span>places disponibles</span></button><button type="button" onClick={() => onView('waiting')}><strong>{snapshot.waiting.length}</strong><span>demandes à placer</span></button><button type="button" onClick={() => onView('attention')}><strong>{snapshot.attention.filter((item) => item.severity === 'blocking').length}</strong><span>blocages réels</span></button></div>
      {next && next.recommendedActionKey ? <SchoolAdminNextAction config={{ title: next.title, detail: next.explanation, label: next.recommendedActionLabel || 'Examiner maintenant', tone: toneToWorkbench(next.tone), onAction: () => onAction(next.recommendedActionKey!, { classId: next.sourceType === 'class' ? next.sourceId : null, sectionId: next.sourceType === 'section' ? next.sourceId : null, issueId: next.id }) }}/> : <SchoolAdminNextAction config={{ title: snapshot.waiting.length ? 'Répartir les demandes en attente' : 'Vérifier les prévisions', detail: snapshot.waiting.length ? `${snapshot.waiting.length} dossier(s) attendent une place ou une décision.` : 'Aucun blocage urgent. Vérifiez les effectifs prévus pour anticiper.', label: snapshot.waiting.length ? 'Voir les demandes' : 'Voir les prévisions', tone: 'info', onAction: () => onView(snapshot.waiting.length ? 'waiting' : 'projections') }}/>}
    </section>
    <section className={styles.attentionPanel}><div className={styles.sectionTitle}><AlertTriangle size={19}/><div><strong>Ce qui demande votre attention</strong><span>Les situations les plus importantes aujourd’hui.</span></div><button type="button" onClick={() => onView('attention')}>Tout voir<ChevronRight size={15}/></button></div>{priority.length ? <div className={styles.attentionCards}>{priority.map((item) => <button key={item.id} type="button" data-tone={item.tone} onClick={() => item.sourceType === 'class' ? onClass(item.sourceId) : item.sourceType === 'section' ? onSection(item.sourceId) : onIssue(item.id)}><span className={styles.attentionSignal}/><div><strong>{item.title}</strong><p>{item.explanation}</p><small>{item.recommendedActionLabel || 'Ouvrir le dossier'}</small></div><ChevronRight size={16}/></button>)}</div> : <SchoolAdminEmptyState title="Tout est en ordre" detail="Aucun problème de place ou de répartition ne nécessite une action immédiate."/>}</section>
    <section className={styles.classPulse}><div className={styles.sectionTitle}><TableProperties size={19}/><div><strong>État des classes</strong><span>Effectif, places et pression de placement.</span></div><button type="button" onClick={() => onView('classes')}>Toutes les classes<ChevronRight size={15}/></button></div><div className={styles.classPulseGrid}>{snapshot.classes.slice(0, 8).map((item) => <button key={item.id} type="button" onClick={() => onClass(item.id)} data-tone={item.tone}><div><strong>{item.name}</strong><span>{item.level}{item.siteLabel ? ` · ${item.siteLabel}` : ''}</span></div><div className={styles.capacityBar}><span style={{ width: `${Math.min(100, item.occupancyPercent)}%` }}/><i style={{ left: `${Math.min(100, item.projectedPercent)}%` }}/></div><footer><span>{item.activeChildren}/{item.plannedPlaces} enfants</span><strong>{item.availablePlaces} place(s)</strong></footer></button>)}</div></section>
    <EntitlementCard snapshot={snapshot} onTopup={() => onAction('capacity.request_topup', { classId: snapshot.classes[0]?.id || null })}/>
  </div>
}

function ClassesView({ records, onOpen, onCreate, onAction }: { records: CapacityClassRecord[]; onOpen: (id: string) => void; onCreate: () => void; onAction: (key: CapacityActionKey, context?: Parameters<typeof actionDefaults>[1]) => void }) {
  if (!records.length) return <SchoolAdminEmptyState title="Aucune classe n’a encore été créée" detail="Créez les classes qui accueilleront les enfants pendant l’année scolaire active." actionLabel="Créer la première classe" onAction={onCreate}/>
  return <section className={styles.matrixPanel}><div className={styles.matrixHeader}><span>Classe</span><span>Places prévues</span><span>Enfants</span><span>Réservées</span><span>Disponibles</span><span>Effectif prévu</span><span>État</span><span>Prochaine action</span></div>{records.map((item) => <div className={styles.matrixRow} key={item.id} data-tone={item.tone}><button type="button" className={styles.entityCell} onClick={() => onOpen(item.id)}><span className={styles.entityIcon}><GraduationCap size={18}/></span><div><strong>{item.name}</strong><small>{item.level}{item.siteLabel ? ` · ${item.siteLabel}` : ''}</small></div></button><button type="button" onClick={() => onOpen(item.id)}>{item.plannedPlaces}</button><button type="button" onClick={() => onOpen(item.id)}>{item.activeChildren}</button><button type="button" onClick={() => onOpen(item.id)}>{item.reservedPlaces}</button><button type="button" onClick={() => onOpen(item.id)}><strong>{item.availablePlaces}</strong></button><button type="button" onClick={() => onOpen(item.id)}>{item.projectedChildren}</button><button type="button" onClick={() => onOpen(item.id)}><span className={styles.statusBadge} data-tone={item.tone}>{item.statusLabel}</span></button><button type="button" className={styles.nextCell} onClick={() => item.nextActionKey ? onAction(item.nextActionKey, { classId: item.id }) : onOpen(item.id)}>{item.nextActionLabel}<ChevronRight size={15}/></button></div>)}</section>
}

function SectionsView({ records, classes, onOpen, onCreate }: { records: CapacitySectionRecord[]; classes: CapacityClassRecord[]; onOpen: (id: string) => void; onCreate: () => void }) {
  if (!records.length) return <SchoolAdminEmptyState title="Aucune section n’a encore été créée" detail="Vous pouvez continuer avec des classes simples ou créer des sections pour mieux répartir les enfants." actionLabel="Créer une section" onAction={onCreate}/>
  return <section className={styles.sectionBoard}>{records.map((item) => { const parent = classes.find((candidate) => candidate.id === item.classId); return <button type="button" key={item.id} onClick={() => onOpen(item.id)} data-tone={item.tone}><header><span className={styles.sectionIcon}><Layers3 size={18}/></span><div><strong>{item.name}</strong><small>{parent?.name || 'Classe'}{item.room ? ` · ${item.room}` : ''}</small></div><span className={styles.statusBadge} data-tone={item.tone}>{item.statusLabel}</span></header><div className={styles.capacityDial}><span style={{ '--fill': `${Math.min(100, percentValue(item.activeChildren, item.plannedPlaces))}%` } as CSSProperties}><strong>{item.activeChildren}</strong><small>sur {item.plannedPlaces}</small></span></div><footer><span>{item.availablePlaces} place(s)</span><span>{item.responsibleLabel || 'Responsable à définir'}</span><ChevronRight size={16}/></footer></button>})}</section>
}

function percentValue(value: number, capacity: number) { return capacity > 0 ? Math.round(value / capacity * 100) : value ? 100 : 0 }

function PlacesView({ snapshot, onClass, onTopup }: { snapshot: ClassesCapacitySnapshot; onClass: (id: string) => void; onTopup: () => void }) {
  return <div className={styles.placesLayout}><EntitlementCard snapshot={snapshot} onTopup={onTopup}/><section className={styles.truthPanel}><div className={styles.sectionTitle}><ShieldCheck size={19}/><div><strong>Cinq vérités distinctes</strong><span>SANILA ne mélange jamais votre formule, la capacité de l’école et les places des classes.</span></div></div><div className={styles.truthGrid}><div><span>Places de la formule</span><strong>{snapshot.entitlement.allowed ?? 'Non configuré'}</strong><small>Limite contractuelle globale</small></div><div><span>Capacité de l’établissement</span><strong>{snapshot.school.operatingCapacity ?? 'À configurer'}</strong><small>Cadre opérationnel de l’école</small></div><div><span>Enfants actifs</span><strong>{snapshot.entitlement.current}</strong><small>Utilisation de la formule</small></div><div><span>Places prévues en classes</span><strong>{snapshot.classes.reduce((sum, item) => sum + item.plannedPlaces, 0)}</strong><small>Organisation opérationnelle</small></div><div><span>Places réservées</span><strong>{snapshot.reservations.filter((item) => item.countsAgainstCapacity).length}</strong><small>Bloquées temporairement</small></div><div><span>Effectif prévu</span><strong>{snapshot.projections.reduce((sum, item) => sum + item.projected, 0)}</strong><small>Décisions déjà engagées</small></div></div></section><section className={styles.availabilityRail}><div className={styles.sectionTitle}><TicketCheck size={19}/><div><strong>Places par classe</strong><span>La couleur complète le libellé, elle ne remplace jamais le sens.</span></div></div>{snapshot.classes.map((item) => <button type="button" key={item.id} onClick={() => onClass(item.id)}><div><strong>{item.name}</strong><span>{item.level}</span></div><div className={styles.capacityEquation}><span>{item.plannedPlaces} prévues</span><i>−</i><span>{item.activeChildren} inscrits</span><i>−</i><span>{item.reservedPlaces} réservées</span><b>=</b><strong>{item.availablePlaces} disponibles</strong></div><span className={styles.statusBadge} data-tone={item.tone}>{item.statusLabel}</span><ChevronRight size={16}/></button>)}</section></div>
}

function EntitlementCard({ snapshot, onTopup }: { snapshot: ClassesCapacitySnapshot; onTopup: () => void }) {
  const item = snapshot.entitlement
  return <section className={styles.entitlementCard} data-state={item.state}><div className={styles.entitlementIcon}><ShieldCheck size={23}/></div><div><span>Places incluses dans votre formule</span><h3>{item.allowed === null ? 'Limite non configurée' : `${item.current} utilisées sur ${item.allowed}`}</h3><p>{item.remaining === null ? 'SANILA affiche la capacité opérationnelle sans inventer de limite contractuelle.' : `${item.remaining} place(s) contractuelle(s) restent disponibles.`}</p><small>{item.packageVersionName || 'Formule en cours'}{item.meterKey ? ` · ${item.meterKey}` : ''}</small></div>{item.state === 'reached' || item.state === 'warning' ? <button type="button" onClick={onTopup} disabled={!snapshot.viewer.canRequestTopup}>{snapshot.viewer.canRequestTopup ? 'Demander des places supplémentaires' : 'Validation de la direction nécessaire'}<ChevronRight size={15}/></button> : <span className={styles.entitlementOk}><BadgeCheck size={17}/> Limite disponible</span>}</section>
}

function WaitingView({ snapshot, onClass, onPlace }: { snapshot: ClassesCapacitySnapshot; onClass: (id: string) => void; onPlace: (classId: string, studentId: string | null, applicationId: string) => void }) {
  if (!snapshot.waiting.length) return <SchoolAdminEmptyState title="Aucune demande n’attend une place" detail="Toutes les demandes actuellement acceptées ont une affectation ou une réservation."/>
  return <section className={styles.waitingBoard}>{snapshot.waiting.map((item) => { const requested = item.requestedClassId ? snapshot.classes.find((record) => record.id === item.requestedClassId) : null; const alternatives = snapshot.classes.filter((record) => record.availablePlaces > 0 && (!item.compatibleClassIds.length || item.compatibleClassIds.includes(record.id))); return <article key={item.id}><header><div><strong>{item.childLabel}</strong><span>{item.applicationCode} · {item.stateLabel}</span></div><Link href={item.exactHref}>Ouvrir l’admission<ChevronRight size={14}/></Link></header><div className={styles.waitingContext}><div><span>Classe demandée</span>{requested ? <button type="button" onClick={() => onClass(requested.id)}>{requested.name}</button> : <strong>À choisir</strong>}</div><div><span>Date</span><strong>{formatDate(item.applicationDate)}</strong></div><div><span>Point à vérifier</span><strong>{item.missingRequirement || 'Aucun blocage administratif signalé'}</strong></div></div><footer>{requested && requested.availablePlaces > 0 ? <button type="button" className={styles.primaryInline} onClick={() => onPlace(requested.id, item.studentId, item.id)}>Attribuer cette place</button> : alternatives.slice(0, 3).map((record) => <button type="button" key={record.id} onClick={() => onPlace(record.id, item.studentId, item.id)}>{record.name} · {record.availablePlaces} place(s)</button>)}{!requested && !alternatives.length ? <span>Aucune classe compatible ne dispose d’une place.</span> : null}</footer></article>})}</section>
}

function MovementsView({ records, onOpen, onCreate }: { records: CapacityMovementRun[]; onOpen: (id: string) => void; onCreate: () => void }) {
  if (!records.length) return <SchoolAdminEmptyState title="Aucun mouvement n’a encore été enregistré" detail="Les changements de classe et répartitions apparaîtront ici avec un résultat pour chaque enfant." actionLabel="Préparer un déplacement" onAction={onCreate}/>
  return <section className={styles.movementBoard}>{records.map((item) => <button type="button" key={item.id} onClick={() => onOpen(item.id)} data-state={item.state}><span className={styles.movementIcon}><MoveRight size={20}/></span><div><strong>{item.sourceClassLabel || 'Affectations actuelles'} <MoveRight size={14}/> {item.targetClassLabel || 'Classe cible'}</strong><span>{item.runCode} · {formatDate(item.effectiveAt)}</span><p>{item.reason || 'Réorganisation des affectations'}</p></div><div className={styles.movementResults}><strong>{item.completedItems}/{item.totalItems}</strong><span>réussis</span>{item.failedItems ? <b>{item.failedItems} à corriger</b> : <small>Aucun échec</small>}</div><span className={styles.statusBadge} data-tone={item.failedItems ? 'critical' : item.state === 'completed' ? 'verified' : 'decision'}>{item.stateLabel}</span><ChevronRight size={16}/></button>)}</section>
}

function AttentionView({ records, onOpen, onAction }: { records: CapacityAttentionItem[]; onOpen: (item: CapacityAttentionItem) => void; onAction: (item: CapacityAttentionItem) => void }) {
  if (!records.length) return <SchoolAdminEmptyState title="Tout est en ordre" detail="Aucun problème de place, de réservation ou de mouvement ne nécessite une action."/>
  return <section className={styles.issueLanes}>{(['blocking', 'warning', 'information'] as const).map((severity) => { const items = records.filter((item) => item.severity === severity); return <div key={severity} data-severity={severity}><header><span>{severity === 'blocking' ? 'Bloque une affectation' : severity === 'warning' ? 'À vérifier rapidement' : 'À surveiller'}</span><strong>{items.length}</strong></header>{items.length ? items.map((item) => <article key={item.id}><button type="button" className={styles.issueOpen} onClick={() => onOpen(item)}><strong>{item.title}</strong><p>{item.explanation}</p>{item.consequence ? <small>{item.consequence}</small> : null}</button>{item.recommendedActionKey ? <button type="button" className={styles.issueAction} onClick={() => onAction(item)}>{item.recommendedActionLabel || 'Traiter maintenant'}<ChevronRight size={14}/></button> : null}</article>) : <SchoolAdminEmptyState title="Aucun élément" detail="Rien dans cette catégorie." compact/>}</div>})}</section>
}

function ProjectionsView({ snapshot, onOpen, onArea2 }: { snapshot: ClassesCapacitySnapshot; onOpen: (id: string) => void; onArea2: (id: string) => void }) {
  return <section className={styles.projectionBoard}>{snapshot.projections.map((item) => { const cls = snapshot.classes.find((record) => record.id === item.classId); if (!cls) return null; return <article key={item.classId} data-conflict={item.projected > item.plannedPlaces || undefined}><header><button type="button" onClick={() => onOpen(item.classId)}><strong>{cls.name}</strong><span>{cls.level}</span></button><div><strong>{item.projected}</strong><span>effectif prévu / {item.plannedPlaces} places</span></div></header><div className={styles.projectionEquation}>{item.sources.map((source) => <button type="button" key={source.key} onClick={() => source.sourceHref ? window.location.assign(source.sourceHref) : onOpen(item.classId)}><span>{source.label}</span><strong>{source.value > 0 && source.key !== 'current' ? '+' : ''}{source.value}</strong><small>{source.committed ? 'Confirmé' : 'Proposition'}</small></button>)}</div><footer>{item.difference < 0 ? <><span className={styles.conflictText}>Dépassement prévu de {Math.abs(item.difference)} enfant(s)</span><button type="button" onClick={() => onArea2(item.classId)}>Voir les passages concernés</button></> : <><span className={styles.healthyText}>{item.difference} place(s) resteront disponibles</span><button type="button" onClick={() => onOpen(item.classId)}>Ouvrir la classe</button></>}</footer></article>})}</section>
}

function HistoryView({ snapshot }: { snapshot: ClassesCapacitySnapshot }) {
  if (!snapshot.history.length) return <SchoolAdminEmptyState title="Aucun historique n’est encore disponible" detail="Les changements de capacité, affectations et mouvements apparaîtront ici."/>
  return <section className={styles.historyTimeline}>{snapshot.history.map((item) => <article key={item.id} data-tone={item.tone}><span className={styles.historyDot}/><div><strong>{item.label}</strong>{item.detail ? <p>{item.detail}</p> : null}<small>{item.actorLabel || 'Système'} · {formatDate(item.createdAt)}</small></div></article>)}</section>
}

function DossierHeader({ dossier, record, snapshot, onClose, onFocus }: { dossier: SelectedDossier; record: CapacityClassRecord | CapacitySectionRecord | CapacityMovementRun | CapacityReservation | CapacityAttentionItem; snapshot: ClassesCapacitySnapshot; onClose: () => void; onFocus: () => void }) {
  const isClass = dossier.kind === 'class'
  const isSection = dossier.kind === 'section'
  const structuredRecord = isClass ? record as CapacityClassRecord : isSection ? record as CapacitySectionRecord : null
  const title = structuredRecord ? structuredRecord.name : dossier.kind === 'movement' ? (record as CapacityMovementRun).runCode : dossier.kind === 'reservation' ? (record as CapacityReservation).childLabel : (record as CapacityAttentionItem).title
  const status = structuredRecord ? structuredRecord.statusLabel : dossier.kind === 'movement' ? (record as CapacityMovementRun).stateLabel : dossier.kind === 'reservation' ? (record as CapacityReservation).stateLabel : (record as CapacityAttentionItem).severity === 'blocking' ? 'Bloque une affectation' : 'À vérifier'
  const tone = structuredRecord ? toneToWorkbench(structuredRecord.tone) : dossier.kind === 'movement' ? ((record as CapacityMovementRun).failedItems ? 'critical' : 'info') : dossier.kind === 'reservation' ? 'info' : toneToWorkbench((record as CapacityAttentionItem).tone)
  const description = isClass ? `${(record as CapacityClassRecord).level} · ${(record as CapacityClassRecord).activeChildren} enfant(s) · ${(record as CapacityClassRecord).availablePlaces} place(s) disponible(s)` : isSection ? `${(record as CapacitySectionRecord).activeChildren} enfant(s) sur ${(record as CapacitySectionRecord).plannedPlaces} places` : dossier.kind === 'movement' ? 'Résultats enfant par enfant et réparations éventuelles.' : dossier.kind === 'reservation' ? 'Place temporairement bloquée pour ce dossier.' : (record as CapacityAttentionItem).explanation
  return <div className={styles.dossierCrown}><SchoolAdminBreadcrumb items={[{ key: 'area', label: 'Classes & places', onSelect: onClose }, { key: dossier.kind, label: dossier.kind === 'class' ? 'Classes' : dossier.kind === 'section' ? 'Sections' : dossier.kind === 'movement' ? 'Mouvements' : dossier.kind === 'reservation' ? 'Réservations' : 'À régler' }, { key: 'record', label: title }]}/><SchoolAdminDossierHeader eyebrow={snapshot.academicYear?.label || 'Année scolaire'} title={title} description={description} status={status} tone={tone} context={isClass ? <span>{(record as CapacityClassRecord).siteLabel || snapshot.school.name}</span> : isSection ? <span>{snapshot.classes.find((item) => item.id === (record as CapacitySectionRecord).classId)?.name}</span> : null}><button type="button" className={styles.headerIconButton} title="Changer la profondeur" onClick={onFocus}><PanelRightOpen size={18}/></button><button type="button" className={styles.headerIconButton} title="Fermer" onClick={onClose}><X size={19}/></button></SchoolAdminDossierHeader></div>
}

function ClassDossier({ record, tab, snapshot, selectedStudentIds, setSelectedStudentIds, onAction, onOpenSection, onOpenMovement, onOpenReservation, onLink }: { record: CapacityClassRecord; tab: CapacityDossierTab; snapshot: ClassesCapacitySnapshot; selectedStudentIds: string[]; setSelectedStudentIds: (ids: string[]) => void; onAction: (key: CapacityActionKey, context?: Parameters<typeof actionDefaults>[1]) => void; onOpenSection: (id: string) => void; onOpenMovement: (id: string) => void; onOpenReservation: (id: string) => void; onLink: (href: string) => void }) {
  if (tab === 'todo') return <div className={styles.tabStack}><SchoolAdminSituationSummary summary={record.attention[0]?.title || 'La classe fonctionne normalement.'} reason={record.attention[0]?.explanation || `Cette classe accueille ${record.activeChildren} enfant(s) sur ${record.plannedPlaces} places prévues.`} consequence={record.attention[0]?.consequence || `${record.availablePlaces} place(s) restent disponibles.`} tone={toneToWorkbench(record.tone)}/><SchoolAdminAssignmentPanel owner={record.homeroomLabel} updatedAt={formatDate(record.updatedAt)} nextStep={record.nextActionLabel}/><SchoolAdminAttentionBlock items={record.attention.map((item) => ({ key: item.id, label: item.title, detail: item.explanation, tone: toneToWorkbench(item.tone), actionLabel: item.recommendedActionLabel || undefined, onAction: item.recommendedActionKey ? () => onAction(item.recommendedActionKey!, { classId: record.id, issueId: item.id }) : undefined }))} emptyTitle="Tout est en ordre" emptyDetail="Cette classe ne nécessite aucune action administrative."/>{record.nextActionKey ? <SchoolAdminNextAction config={{ title: record.nextActionLabel, detail: record.attention[0]?.explanation || 'Ouvrez la prochaine action utile pour cette classe.', label: record.nextActionLabel, tone: toneToWorkbench(record.tone), onAction: () => onAction(record.nextActionKey!, { classId: record.id }) }}/> : null}<SchoolAdminActionDock primary={{ label: 'Modifier le nombre de places', onClick: () => onAction('capacity.preview_change', { classId: record.id }) }} secondary={[{ key: 'note', label: 'Ajouter une note', onClick: () => onAction('capacity_note.add', { classId: record.id }) }, { key: 'freeze', label: record.placementsFrozen ? 'Autoriser les affectations' : 'Suspendre les affectations', onClick: () => onAction(record.placementsFrozen ? 'class.unfreeze_placements' : 'class.freeze_placements', { classId: record.id }) }]}/></div>
  if (tab === 'children') return <ChildrenTab record={record} selected={selectedStudentIds} setSelected={setSelectedStudentIds} onAction={onAction} onLink={onLink}/>
  if (tab === 'places') return <PlacesTab record={record} snapshot={snapshot} onAction={onAction} onReservation={onOpenReservation}/>
  if (tab === 'organisation') return <div className={styles.tabStack}><section className={styles.detailGrid}><div><span>Année scolaire</span><strong>{record.academicYearLabel}</strong></div><div><span>Niveau</span><strong>{record.level}</strong></div><div><span>Site</span><strong>{record.siteLabel || snapshot.school.name}</strong></div><div><span>Éducatrice principale</span><strong>{record.homeroomLabel || 'À définir'}</strong></div><div><span>Sections</span><strong>{record.sections.length}</strong></div><div><span>État</span><strong>{record.statusLabel}</strong></div></section><section className={styles.relatedCards}>{record.sections.length ? record.sections.map((section) => <button type="button" key={section.id} onClick={() => onOpenSection(section.id)}><Layers3 size={18}/><div><strong>{section.name}</strong><span>{section.activeChildren}/{section.plannedPlaces} enfants · {section.responsibleLabel || 'Responsable à définir'}</span></div><ChevronRight size={16}/></button>) : <SchoolAdminEmptyState title="Aucune section" detail="La classe fonctionne actuellement sans subdivision." actionLabel="Créer une section" onAction={() => onAction('section.create', { classId: record.id })}/>}</section><SchoolAdminActionDock primary={{ label: 'Mettre à jour la classe', onClick: () => onAction('class.update', { classId: record.id }) }} secondary={[{ key: 'assignment', label: 'Ouvrir l’affectation de l’éducatrice', onClick: () => onLink(`/angelcare-360-command-center/administration?plane=assignments&view=classes&class=${record.id}&drawer=dossier&source=classes-capacity`) }, { key: 'subjects', label: 'Voir les matières', onClick: () => onLink(`/angelcare-360-command-center/administration?plane=subjects&view=classes&class=${record.id}&source=classes-capacity`) }]}/></div>
  if (tab === 'waiting') return <WaitingTab record={record} onAction={onAction} onLink={onLink}/>
  if (tab === 'movements') return <div className={styles.tabStack}><section className={styles.relatedCards}>{snapshot.movements.filter((item) => item.sourceClassId === record.id || item.targetClassId === record.id).map((item) => <button type="button" key={item.id} onClick={() => onOpenMovement(item.id)}><MoveRight size={18}/><div><strong>{item.sourceClassLabel || 'Source'} → {item.targetClassLabel || 'Cible'}</strong><span>{item.stateLabel} · {item.completedItems}/{item.totalItems} réussi(s)</span></div><ChevronRight size={16}/></button>)}</section><SchoolAdminActionDock primary={{ label: 'Déplacer des enfants', onClick: () => onAction('population_move.preview', { classId: record.id, studentIds: selectedStudentIds }) }} secondary={[{ key: 'split', label: 'Créer une nouvelle section', onClick: () => onAction('class_split.preview', { classId: record.id, studentIds: selectedStudentIds }) }]}/></div>
  return <HistoryTab events={record.history}/>
}

function ChildrenTab({ record, selected, setSelected, onAction, onLink }: { record: CapacityClassRecord | CapacitySectionRecord; selected: string[]; setSelected: (ids: string[]) => void; onAction: (key: CapacityActionKey, context?: Parameters<typeof actionDefaults>[1]) => void; onLink: (href: string) => void }) {
  const toggle = (id: string) => setSelected(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id])
  if (!record.children.length) return <SchoolAdminEmptyState title="Aucun enfant n’est encore affecté" detail="Les enfants apparaîtront ici après leur admission et l’attribution d’une place."/>
  return <div className={styles.tabStack}><div className={styles.selectionBar}><span>{selected.length} enfant(s) sélectionné(s)</span><button type="button" onClick={() => setSelected(record.children.map((item) => item.id))}>Tout sélectionner</button><button type="button" onClick={() => setSelected([])}>Effacer</button></div><section className={styles.childrenList}>{record.children.map((child) => <article key={child.id} data-selected={selected.includes(child.id)}><button type="button" className={styles.checkboxButton} onClick={() => toggle(child.id)} aria-label={`Sélectionner ${child.fullName}`}><span>{selected.includes(child.id) ? <Check size={14}/> : null}</span></button><button type="button" className={styles.childIdentity} onClick={() => onLink(child.exactHref)}><strong>{child.fullName}</strong><span>{child.studentCode} · {child.sectionLabel || child.classLabel}</span></button><div><span>Depuis</span><strong>{formatDate(child.enrolledOn)}</strong></div><div><span>Année suivante</span><strong>{child.nextYearTargetLabel || 'À décider'}</strong></div><button type="button" className={styles.rowAction} onClick={() => onAction('population_move.preview', { classId: record.id, sectionId: 'classId' in record ? null : record.id, studentIds: [child.id] })}>Déplacer<MoveRight size={14}/></button></article>)}</section><SchoolAdminActionDock primary={{ label: selected.length ? `Déplacer ${selected.length} enfant(s)` : 'Sélectionnez des enfants', onClick: () => onAction('population_move.preview', { classId: 'classId' in record ? record.classId : record.id, sectionId: 'classId' in record ? record.id : null, studentIds: selected }), disabled: !selected.length }} secondary={[{ key: 'note', label: 'Ajouter une note', onClick: () => onAction('capacity_note.add', { classId: 'classId' in record ? record.classId : record.id, sectionId: 'classId' in record ? record.id : null }) }]}/></div>
}

function PlacesTab({ record, snapshot, onAction, onReservation }: { record: CapacityClassRecord; snapshot: ClassesCapacitySnapshot; onAction: (key: CapacityActionKey, context?: Parameters<typeof actionDefaults>[1]) => void; onReservation: (id: string) => void }) {
  return <div className={styles.tabStack}><section className={styles.capacitySummary}><div><span>Places prévues</span><strong>{record.plannedPlaces}</strong></div><div><span>Enfants inscrits</span><strong>{record.activeChildren}</strong></div><div><span>Places réservées</span><strong>{record.reservedPlaces}</strong></div><div data-tone={record.availablePlaces ? 'verified' : 'warning'}><span>Places disponibles</span><strong>{record.availablePlaces}</strong></div><div><span>Effectif prévu</span><strong>{record.projectedChildren}</strong></div><div data-tone={snapshot.entitlement.state === 'reached' ? 'critical' : 'neutral'}><span>Places de la formule</span><strong>{snapshot.entitlement.remaining ?? 'Non configuré'}</strong></div></section><SchoolAdminImpactPreview title="Calcul actuel" items={[{ key: 'planned', label: `${record.plannedPlaces} places prévues` }, { key: 'children', label: `− ${record.activeChildren} enfants inscrits` }, { key: 'reserved', label: `− ${record.reservedPlaces} places réservées` }, { key: 'result', label: `= ${record.availablePlaces} places disponibles` }, { key: 'projected', label: `Effectif prévu après décisions`, value: String(record.projectedChildren) }]}/><section className={styles.relatedCards}>{record.reservations.map((reservation) => <button type="button" key={reservation.id} onClick={() => onReservation(reservation.id)}><TicketCheck size={18}/><div><strong>{reservation.childLabel}</strong><span>{reservation.stateLabel} · expire le {formatDate(reservation.expiresOn)}</span></div><ChevronRight size={16}/></button>)}</section><SchoolAdminActionDock primary={{ label: 'Modifier le nombre de places', onClick: () => onAction('capacity.preview_change', { classId: record.id }) }} secondary={[{ key: 'reservation', label: 'Réserver une place', onClick: () => onAction('seat.reserve', { classId: record.id }) }, { key: 'exception', label: 'Demander une autorisation temporaire', onClick: () => onAction('capacity.request_exception', { classId: record.id }) }, { key: 'topup', label: 'Demander des places supplémentaires', onClick: () => onAction('capacity.request_topup', { classId: record.id }) }]}/></div>
}

function WaitingTab({ record, onAction, onLink }: { record: CapacityClassRecord; onAction: (key: CapacityActionKey, context?: Parameters<typeof actionDefaults>[1]) => void; onLink: (href: string) => void }) {
  if (!record.waiting.length) return <SchoolAdminEmptyState title="Aucune demande n’attend cette classe" detail="Toutes les demandes compatibles ont déjà une place ou une réservation."/>
  return <section className={styles.dossierWaiting}>{record.waiting.map((item) => <article key={item.id}><button type="button" onClick={() => onLink(item.exactHref)}><strong>{item.childLabel}</strong><span>{item.stateLabel} · {item.applicationCode}</span></button><div><strong>{record.availablePlaces > 0 ? `${record.availablePlaces} place(s) disponible(s)` : 'Classe complète'}</strong><button type="button" onClick={() => { const chamber = actionDefaults('placement.assign', { classId: record.id, studentIds: item.studentId ? [item.studentId] : [] }); chamber.values.studentId = item.studentId || ''; chamber.values.admissionApplicationId = item.id; onAction(chamber.actionKey, { classId: chamber.classId, studentIds: chamber.studentIds }) }} disabled={!item.studentId || record.availablePlaces <= 0}>Attribuer cette place</button></div></article>)}</section>
}

function SectionDossier({ record, tab, snapshot, selectedStudentIds, setSelectedStudentIds, onAction, onLink }: { record: CapacitySectionRecord; tab: CapacityDossierTab; snapshot: ClassesCapacitySnapshot; selectedStudentIds: string[]; setSelectedStudentIds: (ids: string[]) => void; onAction: (key: CapacityActionKey, context?: Parameters<typeof actionDefaults>[1]) => void; onLink: (href: string) => void }) {
  const parent = snapshot.classes.find((item) => item.id === record.classId)
  if (tab === 'todo') return <div className={styles.tabStack}><SchoolAdminSituationSummary summary={record.attention[0]?.title || 'La section fonctionne normalement.'} reason={record.attention[0]?.explanation || `${record.activeChildren} enfant(s) sont répartis dans cette section.`} consequence={record.attention[0]?.consequence || `${record.availablePlaces} place(s) restent disponibles.`} tone={toneToWorkbench(record.tone)}/><SchoolAdminAssignmentPanel owner={record.responsibleLabel} updatedAt={formatDate(record.updatedAt)} nextStep={record.nextActionLabel}/><SchoolAdminAttentionBlock items={record.attention.map((item) => ({ key: item.id, label: item.title, detail: item.explanation, tone: toneToWorkbench(item.tone), actionLabel: item.recommendedActionLabel || undefined, onAction: item.recommendedActionKey ? () => onAction(item.recommendedActionKey!, { classId: record.classId, sectionId: record.id, issueId: item.id }) : undefined }))}/><SchoolAdminActionDock primary={{ label: 'Modifier la section', onClick: () => onAction('section.update', { classId: record.classId, sectionId: record.id }) }} secondary={[{ key: 'responsible', label: 'Attribuer une responsable', onClick: () => onAction('section.assign_responsible', { classId: record.classId, sectionId: record.id }) }, { key: 'freeze', label: record.placementsFrozen ? 'Autoriser les affectations' : 'Suspendre les affectations', onClick: () => onAction(record.placementsFrozen ? 'section.unfreeze_placements' : 'section.freeze_placements', { classId: record.classId, sectionId: record.id }) }]}/></div>
  if (tab === 'children') return <ChildrenTab record={record} selected={selectedStudentIds} setSelected={setSelectedStudentIds} onAction={onAction} onLink={onLink}/>
  if (tab === 'places') return <div className={styles.tabStack}><section className={styles.capacitySummary}><div><span>Places prévues</span><strong>{record.plannedPlaces}</strong></div><div><span>Enfants</span><strong>{record.activeChildren}</strong></div><div><span>Réservées</span><strong>{record.reservedPlaces}</strong></div><div><span>Disponibles</span><strong>{record.availablePlaces}</strong></div></section><SchoolAdminActionDock primary={{ label: 'Modifier le nombre de places', onClick: () => onAction('capacity.preview_change', { classId: record.classId, sectionId: record.id }) }} secondary={[{ key: 'reserve', label: 'Réserver une place', onClick: () => onAction('seat.reserve', { classId: record.classId, sectionId: record.id }) }]}/></div>
  if (tab === 'organisation') return <div className={styles.tabStack}><section className={styles.detailGrid}><div><span>Classe principale</span><strong>{parent?.name || 'Classe'}</strong></div><div><span>Salle</span><strong>{record.room || 'Non renseignée'}</strong></div><div><span>Responsable</span><strong>{record.responsibleLabel || 'À définir'}</strong></div><div><span>État</span><strong>{record.statusLabel}</strong></div></section><SchoolAdminActionDock primary={{ label: 'Mettre à jour la section', onClick: () => onAction('section.update', { classId: record.classId, sectionId: record.id }) }} secondary={[{ key: 'assignment', label: 'Ouvrir les affectations', onClick: () => onLink(`/angelcare-360-command-center/administration?plane=assignments&view=classes&class=${record.classId}&section=${record.id}&source=classes-capacity`) }]}/></div>
  if (tab === 'waiting') return <SchoolAdminEmptyState title="Les demandes sont gérées au niveau de la classe" detail="Ouvrez la classe principale pour attribuer ou réserver les places." actionLabel="Ouvrir la classe" onAction={() => onLink(`/angelcare-360-command-center/administration?plane=classes-capacity&view=classes&type=class&entity=${record.classId}&drawer=dossier&tab=waiting`)}/>
  if (tab === 'movements') return <div className={styles.tabStack}><SchoolAdminActionDock primary={{ label: 'Déplacer des enfants', onClick: () => onAction('population_move.preview', { classId: record.classId, sectionId: record.id, studentIds: selectedStudentIds }) }} secondary={[{ key: 'merge', label: 'Réunir avec une autre section', onClick: () => onAction('section_merge.preview', { classId: record.classId, sectionId: record.id, studentIds: record.children.map((item) => item.id) }) }]}/></div>
  return <HistoryTab events={record.history}/>
}

function MovementDossier({ record, onAction }: { record: CapacityMovementRun; onAction: (key: CapacityActionKey, context?: Parameters<typeof actionDefaults>[1]) => void }) {
  return <div className={styles.tabStack}><SchoolAdminSituationSummary summary={record.failedItems ? `${record.failedItems} déplacement(s) doivent être corrigés.` : 'Le mouvement est terminé sans erreur.'} reason={`${record.completedItems} enfant(s) ont été traités sur ${record.totalItems}.`} consequence={record.failedItems ? 'Les autres résultats restent valides. Seuls les dossiers en échec doivent être réparés.' : 'Les anciennes affectations restent visibles dans l’historique.'} tone={record.failedItems ? 'warning' : 'success'}/><section className={styles.movementItems}>{record.items.map((item) => <article key={item.id} data-state={item.state}><div><strong>{item.childLabel}</strong><span>{item.sourceClassLabel || 'Classe source'} → {item.targetClassLabel}</span></div><span className={styles.statusBadge} data-tone={item.state === 'failed' ? 'critical' : item.state === 'completed' || item.state === 'repaired' ? 'verified' : 'decision'}>{item.stateLabel}</span>{item.failureReason ? <p>{item.failureReason}</p> : null}{item.state === 'failed' ? <button type="button" onClick={() => onAction('population_move.retry_item', { movementRunId: record.id, movementItemId: item.id, classId: item.targetClassId, studentIds: [item.studentId] })}>Réessayer cet enfant</button> : null}</article>)}</section>{!record.completedItems && record.state !== 'cancelled' ? <SchoolAdminActionDock primary={{ label: 'Exécuter le mouvement', onClick: () => onAction('population_move.execute', { movementRunId: record.id, classId: record.targetClassId, studentIds: record.items.map((item) => item.studentId) }) }} secondary={[{ key: 'cancel', label: 'Annuler le mouvement', onClick: () => onAction('population_move.cancel', { movementRunId: record.id, classId: record.targetClassId }) }]}/> : null}</div>
}

function ReservationDossier({ record, onAction, onLink }: { record: CapacityReservation; onAction: (key: CapacityActionKey, context?: Parameters<typeof actionDefaults>[1]) => void; onLink: (href: string) => void }) {
  return <div className={styles.tabStack}><SchoolAdminSituationSummary summary={`Place ${record.stateLabel.toLowerCase()} pour ${record.childLabel}.`} reason={record.reason || 'La réservation bloque temporairement une place pour ce dossier.'} consequence={record.countsAgainstCapacity ? `La place reste indisponible jusqu’au ${formatDate(record.expiresOn)}.` : 'Cette réservation ne réduit plus le nombre de places disponibles.'} tone={record.state === 'expired' || record.state === 'cancelled' ? 'warning' : 'info'}/><SchoolAdminAssignmentPanel owner={record.responsibleLabel} dueAt={formatDate(record.expiresOn)} nextStep={record.state === 'reserved' ? 'Confirmer ou libérer la place' : 'Consulter le dossier'}/>{record.exactHref ? <button type="button" className={styles.contextLink} onClick={() => onLink(record.exactHref!)}>Ouvrir le dossier concerné<ChevronRight size={15}/></button> : null}<SchoolAdminActionDock primary={record.state === 'reserved' || record.state === 'to_confirm' || record.state === 'expiring' ? { label: 'Confirmer l’utilisation', onClick: () => onAction('seat.confirm', { reservationId: record.id, classId: record.classId, sectionId: record.sectionId }) } : undefined} secondary={[{ key: 'extend', label: 'Prolonger', onClick: () => onAction('seat.extend', { reservationId: record.id, classId: record.classId, sectionId: record.sectionId }), disabled: !record.countsAgainstCapacity }, { key: 'release', label: 'Libérer la place', onClick: () => onAction('seat.release', { reservationId: record.id, classId: record.classId, sectionId: record.sectionId }), disabled: !record.countsAgainstCapacity }]}/></div>
}

function IssueDossier({ record, onAction }: { record: CapacityAttentionItem; onAction: (key: CapacityActionKey, context?: Parameters<typeof actionDefaults>[1]) => void }) {
  return <div className={styles.tabStack}><SchoolAdminSituationSummary summary={record.title} reason={record.explanation} consequence={record.consequence} tone={toneToWorkbench(record.tone)}/><SchoolAdminAssignmentPanel owner={record.ownerLabel} dueAt={formatDate(record.dueAt)} nextStep={record.recommendedActionLabel}/>{record.recommendedActionKey ? <SchoolAdminNextAction config={{ title: record.recommendedActionLabel || 'Traiter maintenant', detail: record.explanation, label: record.recommendedActionLabel || 'Traiter maintenant', tone: toneToWorkbench(record.tone), onAction: () => onAction(record.recommendedActionKey!, { classId: record.sourceType === 'class' ? record.sourceId : null, sectionId: record.sourceType === 'section' ? record.sourceId : null, issueId: record.id, issueTitle: record.title, issueExplanation: record.explanation, issueConsequence: record.consequence, issueSeverity: record.severity, recommendedActionKey: record.recommendedActionKey, recommendedActionLabel: record.recommendedActionLabel }) }}/> : null}<SchoolAdminActionDock primary={{ label: 'Marquer comme réglé', onClick: () => onAction('capacity_issue.resolve', { issueId: record.id, classId: record.sourceType === 'class' ? record.sourceId : null, sectionId: record.sourceType === 'section' ? record.sourceId : null }) }} secondary={[{ key: 'assign', label: 'Attribuer', onClick: () => onAction('capacity_issue.assign', { issueId: record.id, classId: record.sourceType === 'class' ? record.sourceId : null, sectionId: record.sourceType === 'section' ? record.sourceId : null }) }, { key: 'note', label: 'Ajouter une note', onClick: () => onAction('capacity_note.add', { issueId: record.id }) }]}/></div>
}

function HistoryTab({ events }: { events: CapacityClassRecord['history'] }) {
  if (!events.length) return <SchoolAdminEmptyState title="Aucun historique disponible" detail="Les changements apportés à ce dossier apparaîtront ici."/>
  return <section className={styles.historyTimeline}>{events.map((item) => <article key={item.id} data-tone={item.tone}><span className={styles.historyDot}/><div><strong>{item.label}</strong>{item.detail ? <p>{item.detail}</p> : null}<small>{item.actorLabel || 'Système'} · {formatDate(item.createdAt)}</small></div></article>)}</section>
}

function ActionStudio({ chamber, setChamber, snapshot, simulation, busy, error, onSubmit, onClose }: { chamber: ActionChamber; setChamber: (value: ActionChamber | null) => void; snapshot: ClassesCapacitySnapshot; simulation: Record<string, unknown> | null; busy: boolean; error: string | null; onSubmit: () => void; onClose: () => void }) {
  const copy = ACTION_COPY[chamber.actionKey]
  const setValue = (key: string, value: string) => setChamber({ ...chamber, values: { ...chamber.values, [key]: value }, dirty: true })
  const targetClass = snapshot.classes.find((item) => item.id === chamber.classId)
  const targetSection = snapshot.sections.find((item) => item.id === chamber.sectionId)
  const needsClassForm = chamber.actionKey === 'class.create' || chamber.actionKey === 'class.update'
  const needsSectionForm = chamber.actionKey === 'section.create' || chamber.actionKey === 'section.update'
  const needsCapacity = chamber.actionKey.startsWith('capacity.') && !['capacity.request_topup', 'capacity.approve_exception', 'capacity.expire_exception'].includes(chamber.actionKey)
  const needsMove = chamber.actionKey.startsWith('population_move.') || chamber.actionKey.startsWith('class_split.') || chamber.actionKey.startsWith('section_merge.')
  const needsReservation = chamber.actionKey.startsWith('seat.')
  const needsPlacement = chamber.actionKey.startsWith('placement.')
  const needsAssignment = chamber.actionKey === 'capacity_issue.assign' || chamber.actionKey === 'section.assign_responsible'
  const needsNote = chamber.actionKey === 'capacity_note.add'
  const needsEvidence = chamber.actionKey === 'capacity_evidence.request'
  return <div className={styles.actionStudio}>
    <header><div><span className={styles.eyebrow}>Action guidée</span><h2>{copy.title}</h2><p>{copy.description}</p></div><button type="button" onClick={onClose} aria-label="Fermer"><X size={20}/></button></header>
    <SchoolAdminBreadcrumb items={[{ key: 'area', label: 'Classes & places', onSelect: onClose }, { key: 'context', label: targetSection?.name || targetClass?.name || 'Nouvelle organisation' }, { key: 'action', label: copy.title }]}/>
    <div className={styles.actionBody}>
      <section className={styles.actionContext}><div><span>Contexte</span><strong>{targetSection?.name || targetClass?.name || snapshot.school.name}</strong></div><div><span>Année scolaire</span><strong>{snapshot.academicYear?.label || 'À sélectionner'}</strong></div><div><span>Utilisateur</span><strong>{snapshot.viewer.displayName}</strong></div></section>
      {error ? <SchoolAdminErrorState detail={error}/> : null}
      {needsClassForm ? <div className={styles.formGrid}><Field label="Année scolaire"><select value={chamber.values.academicYearId || snapshot.academicYear?.id || ''} onChange={(event) => setValue('academicYearId', event.target.value)}><option value={snapshot.academicYear?.id || ''}>{snapshot.academicYear?.label || 'Année active'}</option></select></Field><Field label="Code de la classe"><input value={chamber.values.classCode} onChange={(event) => setValue('classCode', event.target.value)} placeholder={targetClass?.code || 'MS-A'}/></Field><Field label="Nom de la classe"><input value={chamber.values.name} onChange={(event) => setValue('name', event.target.value)} placeholder={targetClass?.name || 'Moyenne Section A'}/></Field><Field label="Niveau"><input value={chamber.values.level} onChange={(event) => setValue('level', event.target.value)} placeholder={targetClass?.level || 'Moyenne Section'}/></Field><Field label="Nombre de places"><input type="number" min="0" value={chamber.values.capacity} onChange={(event) => setValue('capacity', event.target.value)} placeholder={String(targetClass?.plannedPlaces || 20)}/></Field><Field label="Éducatrice principale"><select value={chamber.values.responsibleStaffId} onChange={(event) => { const option = snapshot.directory.staff.find((item) => item.id === event.target.value); setChamber({ ...chamber, values: { ...chamber.values, responsibleStaffId: event.target.value, responsibleLabel: option?.label || '' }, dirty: true }) }}><option value="">À définir plus tard</option>{snapshot.directory.staff.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field></div> : null}
      {needsSectionForm ? <div className={styles.formGrid}><Field label="Classe principale"><select value={chamber.classId || ''} onChange={(event) => setChamber({ ...chamber, classId: event.target.value, dirty: true })}><option value="">Choisir une classe</option>{snapshot.classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Code de la section"><input value={chamber.values.sectionCode} onChange={(event) => setValue('sectionCode', event.target.value)} placeholder={targetSection?.code || 'A'}/></Field><Field label="Nom de la section"><input value={chamber.values.name} onChange={(event) => setValue('name', event.target.value)} placeholder={targetSection?.name || 'Section A'}/></Field><Field label="Nombre de places"><input type="number" min="0" value={chamber.values.capacity} onChange={(event) => setValue('capacity', event.target.value)} placeholder={String(targetSection?.plannedPlaces || 12)}/></Field><Field label="Salle"><input value={chamber.values.room} onChange={(event) => setValue('room', event.target.value)} placeholder={targetSection?.room || 'Salle 3'}/></Field><Field label="Responsable"><select value={chamber.values.responsibleStaffId} onChange={(event) => { const option = snapshot.directory.staff.find((item) => item.id === event.target.value); setChamber({ ...chamber, values: { ...chamber.values, responsibleStaffId: event.target.value, responsibleLabel: option?.label || '' }, dirty: true }) }}><option value="">À définir</option>{snapshot.directory.staff.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field></div> : null}
      {needsCapacity ? <div className={styles.formGrid}><Field label="Capacité actuelle"><input value={String(targetSection?.plannedPlaces ?? targetClass?.plannedPlaces ?? 0)} readOnly/></Field><Field label={chamber.actionKey === 'capacity.request_exception' ? 'Capacité temporaire demandée' : 'Nouveau nombre de places'}><input type="number" min="0" value={chamber.actionKey === 'capacity.request_exception' ? chamber.values.temporaryCapacity : chamber.values.newCapacity} onChange={(event) => setValue(chamber.actionKey === 'capacity.request_exception' ? 'temporaryCapacity' : 'newCapacity', event.target.value)}/></Field>{chamber.actionKey === 'capacity.request_exception' ? <Field label="Date d’expiration"><input type="date" value={chamber.values.expiresAt} onChange={(event) => setValue('expiresAt', event.target.value)}/></Field> : null}<Field label="Date d’application"><input type="date" value={chamber.values.effectiveAt} onChange={(event) => setValue('effectiveAt', event.target.value)}/></Field><Field label="Motif"><textarea value={chamber.values.reason} onChange={(event) => setValue('reason', event.target.value)} placeholder="Expliquez la modification et le besoin de l’école."/></Field></div> : null}
      {chamber.actionKey === 'capacity.request_topup' ? <div className={styles.formGrid}><Field label="Places supplémentaires"><input type="number" min="1" value={chamber.values.quantity} onChange={(event) => setValue('quantity', event.target.value)} placeholder="20"/></Field><Field label="Motif"><textarea value={chamber.values.reason} onChange={(event) => setValue('reason', event.target.value)} placeholder="Expliquez le besoin et les classes concernées."/></Field><section className={styles.contractTruth}><ShieldCheck size={20}/><div><strong>Votre formule reste la source de vérité</strong><p>Cette demande ne modifie pas directement la capacité contractuelle. Les nouvelles places deviennent disponibles après activation confirmée par Product Reality.</p><small>{snapshot.entitlement.packageVersionName || 'Formule en cours'} · {snapshot.entitlement.meterKey || 'Compteur enfants à confirmer'}</small></div></section></div> : null}
      {needsMove ? <div className={styles.formGrid}><Field label="Classe source"><select value={chamber.values.sourceClassId || chamber.classId || ''} onChange={(event) => setValue('sourceClassId', event.target.value)}><option value="">Choisir</option>{snapshot.classes.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.activeChildren} enfants</option>)}</select></Field><Field label="Classe cible"><select value={chamber.values.targetClassId} onChange={(event) => setValue('targetClassId', event.target.value)}><option value="">Choisir</option>{snapshot.classes.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.availablePlaces} place(s)</option>)}</select></Field>{chamber.actionKey.startsWith('section_merge.') ? <Field label="Section source"><select value={chamber.values.sourceSectionId || chamber.sectionId || ''} onChange={(event) => setValue('sourceSectionId', event.target.value)}><option value="">Choisir</option>{snapshot.sections.filter((item) => !chamber.values.sourceClassId || item.classId === chamber.values.sourceClassId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field> : null}<Field label="Section cible"><select value={chamber.values.targetSectionId} onChange={(event) => setValue('targetSectionId', event.target.value)}><option value="">{chamber.actionKey.startsWith('class_split.') ? 'Créer une nouvelle section' : 'Aucune section'}</option>{snapshot.sections.filter((item) => !chamber.values.targetClassId || item.classId === chamber.values.targetClassId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>{chamber.actionKey.startsWith('class_split.') && !chamber.values.targetSectionId ? <><Field label="Code de la nouvelle section"><input value={chamber.values.newSectionCode} onChange={(event) => setValue('newSectionCode', event.target.value)} placeholder="B"/></Field><Field label="Nom de la nouvelle section"><input value={chamber.values.newSectionName} onChange={(event) => setValue('newSectionName', event.target.value)} placeholder="Section B"/></Field><Field label="Places de la nouvelle section"><input type="number" min="0" value={chamber.values.newSectionCapacity} onChange={(event) => setValue('newSectionCapacity', event.target.value)} placeholder="12"/></Field></> : null}<Field label="Date d’effet"><input type="date" value={chamber.values.effectiveAt} onChange={(event) => setValue('effectiveAt', event.target.value)}/></Field><Field label="Motif"><textarea value={chamber.values.reason} onChange={(event) => setValue('reason', event.target.value)} placeholder="Expliquez la répartition ou le déplacement."/></Field><section className={styles.selectedPeople}><strong>{chamber.studentIds.length} enfant(s) sélectionné(s)</strong><div>{chamber.studentIds.map((id) => <span key={id}>{snapshot.directory.students.find((item) => item.id === id)?.label || id.slice(0, 8)}</span>)}</div></section></div> : null}
      {needsReservation ? <div className={styles.formGrid}><Field label="Enfant"><select value={chamber.values.studentId} onChange={(event) => setValue('studentId', event.target.value)}><option value="">Choisir un enfant</option>{snapshot.directory.students.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field><Field label="Date d’expiration"><input type="date" value={chamber.values.expiresAt} onChange={(event) => setValue('expiresAt', event.target.value)}/></Field><Field label="Motif"><textarea value={chamber.values.reason} onChange={(event) => setValue('reason', event.target.value)} placeholder="Pourquoi cette place doit-elle être réservée ?"/></Field></div> : null}
      {needsPlacement ? <div className={styles.formGrid}><Field label="Enfant"><select value={chamber.values.studentId || chamber.studentIds[0] || ''} onChange={(event) => { setValue('studentId', event.target.value); setChamber({ ...chamber, studentIds: event.target.value ? [event.target.value] : [], values: { ...chamber.values, studentId: event.target.value }, dirty: true }) }}><option value="">Choisir un enfant</option>{snapshot.directory.students.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field><Field label="Classe"><select value={chamber.classId || ''} onChange={(event) => setChamber({ ...chamber, classId: event.target.value, dirty: true })}><option value="">Choisir une classe</option>{snapshot.classes.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.availablePlaces} place(s)</option>)}</select></Field><Field label="Section"><select value={chamber.sectionId || ''} onChange={(event) => setChamber({ ...chamber, sectionId: event.target.value || null, dirty: true })}><option value="">Aucune section</option>{snapshot.sections.filter((item) => !chamber.classId || item.classId === chamber.classId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Date d’entrée"><input type="date" value={chamber.values.enrolledOn} onChange={(event) => setValue('enrolledOn', event.target.value)}/></Field><Field label="Motif ou note"><textarea value={chamber.values.reason} onChange={(event) => setValue('reason', event.target.value)}/></Field></div> : null}
      {needsAssignment ? <div className={styles.formGrid}><Field label="Personne responsable"><select value={chamber.values.ownerUserId || chamber.values.responsibleStaffId} onChange={(event) => { const option = snapshot.directory.staff.find((item) => item.id === event.target.value); setChamber({ ...chamber, values: { ...chamber.values, ownerUserId: event.target.value, ownerLabel: option?.label || '', responsibleStaffId: event.target.value, responsibleLabel: option?.label || '' }, dirty: true }) }}><option value="">Choisir une personne</option>{snapshot.directory.staff.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field><Field label="Échéance"><input type="date" value={chamber.values.dueAt} onChange={(event) => setValue('dueAt', event.target.value)}/></Field><Field label="Instructions"><textarea value={chamber.values.reason} onChange={(event) => setValue('reason', event.target.value)} placeholder="Précisez ce qui doit être fait."/></Field></div> : null}
      {needsNote ? <Field label="Note interne"><textarea value={chamber.values.body} onChange={(event) => setValue('body', event.target.value)} placeholder="Ajoutez le contexte utile à l’équipe."/></Field> : null}
      {needsEvidence ? <div className={styles.formGrid}><Field label="Document ou justificatif"><input value={chamber.values.title} onChange={(event) => setValue('title', event.target.value)} placeholder="Justificatif de capacité ou validation"/></Field><Field label="Description"><textarea value={chamber.values.description} onChange={(event) => setValue('description', event.target.value)}/></Field><Field label="Responsable"><select value={chamber.values.ownerUserId} onChange={(event) => { const option = snapshot.directory.staff.find((item) => item.id === event.target.value); setChamber({ ...chamber, values: { ...chamber.values, ownerUserId: event.target.value, ownerLabel: option?.label || '' }, dirty: true }) }}><option value="">À attribuer</option>{snapshot.directory.staff.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field></div> : null}
      {!needsClassForm && !needsSectionForm && !needsCapacity && !needsMove && !needsReservation && !needsPlacement && !needsAssignment && !needsNote && !needsEvidence && chamber.actionKey !== 'capacity.request_topup' ? <Field label="Motif"><textarea value={chamber.values.reason} onChange={(event) => setValue('reason', event.target.value)} placeholder="Expliquez cette décision."/></Field> : null}
      {simulation ? <SchoolAdminImpactPreview title="Ce qui va changer" items={Object.entries(simulation).filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value)).slice(0, 12).map(([key, value]) => ({ key, label: key.replaceAll(/([A-Z])/g, ' $1').replaceAll('_', ' '), value: String(value) }))} tone="info"/> : null}
    </div>
    <SchoolAdminActionDock primary={{ label: simulation && chamber.actionKey.endsWith('.preview') ? chamber.actionKey === 'capacity.preview_change' ? 'Préparer cette modification' : chamber.actionKey === 'population_move.preview' ? 'Confirmer ce déplacement' : chamber.actionKey === 'class_split.preview' ? 'Créer et répartir' : 'Appliquer cette organisation' : copy.submit, onClick: simulation && chamber.actionKey === 'capacity.preview_change' ? () => setChamber({ ...chamber, actionKey: 'capacity.request_change', dirty: true }) : simulation && chamber.actionKey === 'population_move.preview' ? () => setChamber({ ...chamber, actionKey: 'population_move.execute', dirty: true }) : simulation && chamber.actionKey === 'class_split.preview' ? () => setChamber({ ...chamber, actionKey: 'class_split.execute', dirty: true }) : simulation && chamber.actionKey === 'section_merge.preview' ? () => setChamber({ ...chamber, actionKey: 'section_merge.execute', dirty: true }) : onSubmit, busy, danger: copy.tone === 'danger' }} secondary={[{ key: 'cancel', label: 'Annuler', onClick: onClose }]}/>
  </div>
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className={styles.field}><span>{label}</span>{children}</label> }

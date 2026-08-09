'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  Archive,
  BadgeCheck,
  BookMarked,
  BookOpenCheck,
  Boxes,
  CalendarRange,
  Check,
  ChevronRight,
  CircleGauge,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileSearch,
  Filter,
  GraduationCap,
  History,
  Languages,
  Layers3,
  LibraryBig,
  LoaderCircle,
  Network,
  PanelRightOpen,
  Plus,
  RefreshCw,
  Replace,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import CustomerOverlayPortal from '@/components/angelcare360/customer-experience/CustomerOverlayPortal'
import CustomerOverlaySurface from '@/components/angelcare360/customer-experience/CustomerOverlaySurface'
import {
  SchoolAdminActionDock as BaseSchoolAdminActionDock,
  SchoolAdminAssignmentPanel as BaseSchoolAdminAssignmentPanel,
  SchoolAdminAttentionBlock,
  SchoolAdminBreadcrumb as BaseSchoolAdminBreadcrumb,
  SchoolAdminDossierHeader as BaseSchoolAdminDossierHeader,
  SchoolAdminEmptyState,
  SchoolAdminErrorState,
  SchoolAdminImpactPreview as BaseSchoolAdminImpactPreview,
  SchoolAdminNextAction as BaseSchoolAdminNextAction,
  SchoolAdminSituationSummary as BaseSchoolAdminSituationSummary,
} from '@/components/angelcare360/customer-experience/SchoolAdminWorkbench'
import type {
  CurriculumActionKey,
  CurriculumActionRequest,
  CurriculumActionResult,
  CurriculumAttentionItem,
  CurriculumBinding,
  CurriculumDossierKind,
  CurriculumDossierTab,
  CurriculumFrameworkRecord,
  CurriculumResourceRecord,
  CurriculumSnapshot,
  CurriculumSubjectRecord,
  CurriculumTone,
  CurriculumView,
  EvaluationPolicyRecord,
} from '@/types/angelcare360/curriculum-area'
import styles from './CurriculumArea.module.css'

type Props = {
  initialSnapshot: CurriculumSnapshot
  initialView: CurriculumView
  initialEntityId: string | null
  initialEntityKind: CurriculumDossierKind | null
  initialTab: CurriculumDossierTab | null
}

type Toast = { kind: 'success' | 'warning' | 'error'; message: string } | null


type WorkbenchTone = 'neutral' | 'info' | 'success' | 'warning' | 'critical' | 'approval'

function workbenchTone(tone?: CurriculumTone | 'critical' | 'warning' | 'verified' | 'decision' | 'neutral'): WorkbenchTone {
  if (tone === 'critical') return 'critical'
  if (tone === 'warning') return 'warning'
  if (tone === 'verified') return 'success'
  if (tone === 'decision') return 'approval'
  if (tone === 'active') return 'info'
  return 'neutral'
}

function SchoolAdminSituationSummary({ title, detail, consequence, tone }: { title: string; detail: string; consequence?: string | null; tone?: CurriculumTone }) {
  return <BaseSchoolAdminSituationSummary summary={title} reason={detail} consequence={consequence} tone={workbenchTone(tone)}/>
}

function SchoolAdminNextAction({ title, detail, onAction }: { title: string; detail: string; onAction?: (() => void) }) {
  const available = Boolean(onAction)
  return <BaseSchoolAdminNextAction config={{ title, detail, label: available ? title : 'Aucune action nécessaire', tone: available ? 'approval' : 'info', onAction: onAction || (() => undefined), disabled: !available, disabledReason: available ? undefined : 'Le dossier ne nécessite aucune action immédiate.' }}/>
}

function SchoolAdminImpactPreview({ title, items, tone = 'active' }: { title?: string; items: Array<string | { key: string; label: string; value?: string | null }>; tone?: CurriculumTone }) {
  return <BaseSchoolAdminImpactPreview title={title} tone={workbenchTone(tone)} items={items.map((item, index) => typeof item === 'string' ? { key: `impact-${index}`, label: item } : item)}/>
}

function SchoolAdminAssignmentPanel({ ownerLabel, dueAt, onAssign }: { ownerLabel?: string | null; dueAt?: string | null; onAssign?: (() => void) }) {
  return <div className={styles.assignmentWrapper}><BaseSchoolAdminAssignmentPanel owner={ownerLabel} dueAt={dueAt ? formatDate(dueAt) : null} nextStep={onAssign ? 'Attribuer ou modifier le responsable' : null}/>{onAssign ? <button type="button" className={styles.inlinePrimary} onClick={onAssign}>Attribuer un responsable</button> : null}</div>
}

function SchoolAdminBreadcrumb({ items }: { items: Array<{ key?: string; label: string; href?: string; onClick?: () => void }> }) {
  return <BaseSchoolAdminBreadcrumb items={items.map((item, index) => ({ key: item.key || `crumb-${index}`, label: item.label, onSelect: item.onClick || (item.href ? () => window.location.assign(item.href!) : undefined) }))}/>
}

function SchoolAdminDossierHeader({ eyebrow, title, statusLabel, statusTone, summary, onClose, onExpand }: { eyebrow: string; title: string; statusLabel?: string | null; statusTone?: CurriculumTone; summary: string; onClose: () => void; onExpand: () => void }) {
  return <BaseSchoolAdminDossierHeader eyebrow={eyebrow} title={title} description={summary} status={statusLabel} tone={workbenchTone(statusTone)}><button type="button" className={styles.headerIconButton} title="Changer la profondeur" onClick={onExpand}><PanelRightOpen size={18}/></button><button type="button" className={styles.headerIconButton} title="Fermer" onClick={onClose}><X size={19}/></button></BaseSchoolAdminDossierHeader>
}

function SchoolAdminActionDock({ primaryAction, secondaryActions = [] }: { primaryAction?: { label: string; onClick: () => void; disabled?: boolean; busy?: boolean; danger?: boolean }; secondaryActions?: Array<{ key?: string; label: string; onClick: () => void; disabled?: boolean }> }) {
  return <BaseSchoolAdminActionDock primary={primaryAction} secondary={secondaryActions.map((item, index) => ({ ...item, key: item.key || `secondary-${index}` }))}/>
}

type SelectedDossier = {
  kind: CurriculumDossierKind
  id: string
  tab: CurriculumDossierTab
  mode: 'peek' | 'dossier' | 'focus'
}

type ActionChamber = {
  actionKey: CurriculumActionKey
  subjectId: string | null
  curriculumId: string | null
  evaluationPolicyId: string | null
  resourceId: string | null
  variationId: string | null
  issueId: string | null
  objectiveId: string | null
  bindingId: string | null
  values: Record<string, string>
  dirty: boolean
}

const VIEWS: Array<{ key: CurriculumView; label: string; icon: LucideIcon }> = [
  { key: 'today', label: 'Aujourd’hui', icon: CircleGauge },
  { key: 'catalogue', label: 'Matières & domaines', icon: BookOpenCheck },
  { key: 'programmes', label: 'Programmes', icon: LibraryBig },
  { key: 'levels-classes', label: 'Niveaux & classes', icon: GraduationCap },
  { key: 'coverage', label: 'Couverture pédagogique', icon: Network },
  { key: 'evaluation', label: 'Évaluations', icon: ClipboardCheck },
  { key: 'resources', label: 'Ressources', icon: BookMarked },
  { key: 'attention', label: 'À régler', icon: AlertTriangle },
  { key: 'history', label: 'Historique', icon: History },
]

const TABS: Array<{ key: CurriculumDossierTab; label: string }> = [
  { key: 'todo', label: 'À faire' },
  { key: 'information', label: 'Informations' },
  { key: 'levels-classes', label: 'Niveaux & classes' },
  { key: 'objectives', label: 'Objectifs d’apprentissage' },
  { key: 'evaluation', label: 'Évaluations' },
  { key: 'resources', label: 'Ressources' },
  { key: 'versions', label: 'Versions' },
  { key: 'history', label: 'Historique' },
]

const ACTION_COPY: Record<CurriculumActionKey, { title: string; description: string; submit: string; tone?: 'danger' }> = {
  'subject.create': { title: 'Créer une matière ou un domaine', description: 'Définissez son identité, les niveaux concernés et les attentes pédagogiques.', submit: 'Créer cette matière' },
  'subject.update': { title: 'Mettre à jour la matière', description: 'Modifiez les informations sans réécrire les versions historiques.', submit: 'Enregistrer les modifications' },
  'subject.prepare': { title: 'Préparer la matière', description: 'Passez la matière en vérification avant son utilisation.', submit: 'Préparer la vérification' },
  'subject.request_approval': { title: 'Demander la validation', description: 'Transmettez la matière à la direction pédagogique.', submit: 'Demander la validation' },
  'subject.activate': { title: 'Rendre la matière active', description: 'La matière deviendra disponible pour les programmes autorisés.', submit: 'Rendre la matière active' },
  'subject.prepare_version': { title: 'Préparer une nouvelle version', description: 'Créez une nouvelle définition sans modifier la version actuellement utilisée.', submit: 'Préparer la nouvelle version' },
  'subject.publish_version': { title: 'Rendre cette version active', description: 'La nouvelle version remplacera la précédente à la date choisie.', submit: 'Rendre la version active' },
  'subject.replace': { title: 'Remplacer cette matière', description: 'Programmez un remplacement en conservant toutes les utilisations historiques.', submit: 'Programmer le remplacement' },
  'subject.retire': { title: 'Retirer du programme', description: 'La matière restera visible dans les années et classes historiques.', submit: 'Retirer du programme', tone: 'danger' },
  'subject.archive': { title: 'Archiver la matière', description: 'Retirez-la des listes actives sans supprimer son historique.', submit: 'Archiver la matière', tone: 'danger' },
  'curriculum.create': { title: 'Créer un programme pédagogique', description: 'Préparez les niveaux, matières, objectifs et méthodes d’évaluation.', submit: 'Créer le programme' },
  'curriculum.update': { title: 'Mettre à jour le programme', description: 'Modifiez le brouillon ou préparez une évolution contrôlée.', submit: 'Enregistrer le programme' },
  'curriculum.copy_from_previous_year': { title: 'Préparer le programme de la nouvelle année', description: 'Réutilisez seulement les éléments encore valides et marquez le reste à vérifier.', submit: 'Préparer le nouveau programme' },
  'curriculum.add_subject': { title: 'Ajouter une matière au programme', description: 'Choisissez la matière, les classes et son caractère obligatoire ou optionnel.', submit: 'Ajouter au programme' },
  'curriculum.remove_future_subject': { title: 'Retirer d’un futur programme', description: 'Le rattachement historique actuel restera intact.', submit: 'Retirer du futur programme', tone: 'danger' },
  'curriculum.bind_level': { title: 'Ajouter à un niveau', description: 'Appliquez cette matière aux niveaux sélectionnés.', submit: 'Ajouter au niveau' },
  'curriculum.bind_class': { title: 'Ajouter à une classe', description: 'Liez la matière à une ou plusieurs classes précises.', submit: 'Ajouter aux classes' },
  'curriculum.unbind_future_class': { title: 'Retirer d’une classe future', description: 'La matière restera visible dans les périodes déjà utilisées.', submit: 'Retirer de la classe', tone: 'danger' },
  'curriculum.preview': { title: 'Simuler cette organisation pédagogique', description: 'Visualisez les classes, versions, évaluations et ressources affectées sans modifier les données.', submit: 'Afficher la simulation' },
  'curriculum.request_approval': { title: 'Demander la validation du programme', description: 'Soumettez la structure complète à la direction pédagogique.', submit: 'Demander la validation' },
  'curriculum.activate': { title: 'Rendre ce programme actif', description: 'Les matières, objectifs et méthodes validés deviendront la référence.', submit: 'Rendre ce programme actif' },
  'curriculum.prepare_replacement': { title: 'Préparer un programme de remplacement', description: 'Construisez la prochaine version sans interrompre le programme actuel.', submit: 'Préparer le remplacement' },
  'curriculum.replace': { title: 'Remplacer le programme', description: 'Le nouveau programme deviendra la référence à la date choisie.', submit: 'Remplacer le programme' },
  'curriculum.retire': { title: 'Retirer le programme', description: 'Le programme ne sera plus proposé aux nouvelles classes.', submit: 'Retirer le programme', tone: 'danger' },
  'curriculum.archive': { title: 'Archiver le programme', description: 'Conservez sa reconstruction historique tout en le retirant des vues actives.', submit: 'Archiver le programme', tone: 'danger' },
  'learning_objective.create': { title: 'Ajouter un objectif d’apprentissage', description: 'Décrivez ce que les enfants doivent apprendre et le résultat observable.', submit: 'Ajouter l’objectif' },
  'learning_objective.update': { title: 'Mettre à jour l’objectif', description: 'Précisez le niveau, la période et le résultat attendu.', submit: 'Enregistrer l’objectif' },
  'learning_objective.reorder': { title: 'Réorganiser les objectifs', description: 'Ajustez l’ordre pédagogique prévu.', submit: 'Enregistrer l’ordre' },
  'learning_objective.retire': { title: 'Retirer l’objectif', description: 'Il restera visible dans les anciennes versions du programme.', submit: 'Retirer l’objectif', tone: 'danger' },
  'evaluation_policy.create': { title: 'Définir une méthode d’évaluation', description: 'Choisissez comment les enseignants enregistrent et communiquent les progrès.', submit: 'Créer la méthode' },
  'evaluation_policy.update': { title: 'Mettre à jour la méthode d’évaluation', description: 'Modifiez une version encore en préparation.', submit: 'Enregistrer la méthode' },
  'evaluation_policy.request_approval': { title: 'Demander la validation de l’évaluation', description: 'Soumettez la méthode à la direction pédagogique.', submit: 'Demander la validation' },
  'evaluation_policy.activate': { title: 'Rendre la méthode active', description: 'La méthode deviendra la règle de référence pour les classes concernées.', submit: 'Rendre la méthode active' },
  'evaluation_policy.replace': { title: 'Remplacer la méthode d’évaluation', description: 'Préservez les anciennes évaluations et activez la nouvelle méthode à la bonne date.', submit: 'Remplacer la méthode' },
  'evaluation_policy.retire': { title: 'Retirer la méthode d’évaluation', description: 'La méthode restera disponible dans les dossiers historiques.', submit: 'Retirer la méthode', tone: 'danger' },
  'curriculum_resource.link': { title: 'Associer une ressource', description: 'Ajoutez un guide, document, matériel ou modèle au programme.', submit: 'Associer la ressource' },
  'curriculum_resource.unlink_future': { title: 'Retirer la ressource des futurs programmes', description: 'Les anciens programmes conserveront leur référence.', submit: 'Retirer la ressource', tone: 'danger' },
  'curriculum_resource.replace': { title: 'Remplacer la ressource', description: 'Associez une ressource valide sans perdre l’ancienne référence.', submit: 'Remplacer la ressource' },
  'curriculum_resource.request_access': { title: 'Demander l’activation', description: 'La demande sera liée à la formule et au catalogue produit officiels.', submit: 'Envoyer la demande' },
  'curriculum_variation.create': { title: 'Créer une variation locale', description: 'Décrivez précisément la différence pour un site ou établissement.', submit: 'Créer la variation' },
  'curriculum_variation.request_approval': { title: 'Demander la validation de la variation', description: 'Soumettez les différences locales à l’autorité pédagogique.', submit: 'Demander la validation' },
  'curriculum_variation.approve': { title: 'Approuver la variation locale', description: 'La variation deviendra applicable au site concerné.', submit: 'Approuver la variation' },
  'curriculum_variation.reject': { title: 'Refuser la variation locale', description: 'Le motif restera visible et le programme commun restera applicable.', submit: 'Refuser la variation', tone: 'danger' },
  'curriculum_variation.retire': { title: 'Retirer la variation locale', description: 'Le site reviendra au programme commun à la date choisie.', submit: 'Retirer la variation', tone: 'danger' },
  'curriculum_issue.assign': { title: 'Attribuer ce point', description: 'Choisissez la personne responsable et une échéance claire.', submit: 'Attribuer le point' },
  'curriculum_issue.resolve': { title: 'Marquer comme réglé', description: 'Le serveur vérifiera que la cause réelle a été corrigée.', submit: 'Marquer comme réglé' },
  'curriculum_issue.reopen': { title: 'Réouvrir ce point', description: 'Le point reviendra dans la liste à traiter.', submit: 'Réouvrir le point' },
  'curriculum_task.assign': { title: 'Créer ou attribuer une tâche', description: 'Ajoutez une responsabilité pédagogique claire.', submit: 'Attribuer la tâche' },
  'curriculum_task.complete': { title: 'Terminer la tâche', description: 'Indiquez le résultat obtenu avant de la clôturer.', submit: 'Terminer la tâche' },
  'curriculum_task.reopen': { title: 'Réouvrir la tâche', description: 'La tâche redevient active sans perdre son historique.', submit: 'Réouvrir la tâche' },
  'curriculum_note.add': { title: 'Ajouter une note interne', description: 'Conservez une information utile dans le dossier pédagogique.', submit: 'Ajouter la note' },
  'curriculum_evidence.request': { title: 'Demander un justificatif', description: 'Précisez le document ou l’élément attendu et son échéance.', submit: 'Demander le justificatif' },
}

function actionDefaults(actionKey: CurriculumActionKey, context?: Partial<ActionChamber>): ActionChamber {
  return {
    actionKey,
    subjectId: context?.subjectId || null,
    curriculumId: context?.curriculumId || null,
    evaluationPolicyId: context?.evaluationPolicyId || null,
    resourceId: context?.resourceId || null,
    variationId: context?.variationId || null,
    issueId: context?.issueId || null,
    objectiveId: context?.objectiveId || null,
    bindingId: context?.bindingId || null,
    values: {
      code: '', name: '', shortName: '', description: '', pedagogicalType: 'learning_domain', languages: 'Français', applicableLevels: '', requiredByDefault: 'true', department: 'Pédagogie', expectedWeeklyHours: '', academicYearId: '', institutionId: '', siteId: '', templateCode: '', targetAcademicYearId: '', subjectId: context?.subjectId || '', curriculumId: context?.curriculumId || '', subjectVersionId: '', classIds: '', levelLabels: '', required: 'true', evaluationPolicyId: '', versionId: '', versionLabel: '', effectiveAt: new Date().toISOString().slice(0, 10), effectiveFrom: new Date().toISOString().slice(0, 10), effectiveTo: '', changeReason: '', replacesVersionId: '', title: '', observableResult: '', competencyCode: '', expectedPeriodId: '', sequenceOrder: '1', method: 'continuous_observation', scaleCode: '', requiredPeriodIds: '', evidenceRequired: 'false', reportCardMapping: '', documentId: '', category: '', language: '', licenceCode: '', entitlementCode: '', itemCode: '', exactCatalogueHref: '', changes: '', reason: '', ownerUserId: '', ownerLabel: '', dueAt: '', priority: 'normal', body: '', important: 'false', sourceType: 'subject', sourceId: context?.subjectId || context?.curriculumId || '', explanation: '', consequence: '', severity: 'warning', recommendedActionKey: '', recommendedActionLabel: '', taskId: '', bindingId: context?.bindingId || '', objectiveId: context?.objectiveId || '', replacementResourceId: '', resourceIds: '',
      ...(context?.values || {}),
    },
    dirty: false,
  }
}

export default function CurriculumArea({ initialSnapshot, initialView, initialEntityId, initialEntityKind, initialTab }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [view, setView] = useState<CurriculumView>(VIEWS.some((item) => item.key === initialView) ? initialView : 'today')
  const [dossier, setDossier] = useState<SelectedDossier | null>(initialEntityId && initialEntityKind ? { kind: initialEntityKind, id: initialEntityId, tab: initialTab || 'todo', mode: 'dossier' } : null)
  const [action, setAction] = useState<ActionChamber | null>(null)
  const [search, setSearch] = useState('')
  const [tone, setTone] = useState<'all' | CurriculumTone>('all')
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast>(null)
  const [error, setError] = useState<string | null>(null)
  const [simulation, setSimulation] = useState<Record<string, unknown> | null>(null)

  const updateUrl = useCallback((updates: Record<string, string | null>, mode: 'push' | 'replace' = 'push') => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('plane', 'subjects')
    Object.entries(updates).forEach(([key, value]) => value ? params.set(key, value) : params.delete(key))
    const href = `${pathname}?${params.toString()}`
    if (mode === 'replace') router.replace(href, { scroll: false })
    else router.push(href, { scroll: false })
  }, [pathname, router, searchParams])

  const chooseView = (next: CurriculumView) => {
    setView(next)
    setDossier(null)
    updateUrl({ view: next, entity: null, type: null, drawer: null, tab: null, focus: null })
  }

  const openDossier = (kind: CurriculumDossierKind, id: string, tab: CurriculumDossierTab = 'todo', mode: SelectedDossier['mode'] = 'dossier') => {
    setDossier({ kind, id, tab, mode })
    updateUrl({ view, entity: id, type: kind, drawer: mode, tab })
  }

  const closeDossier = () => {
    setDossier(null)
    updateUrl({ entity: null, type: null, drawer: null, tab: null, focus: null })
  }

  const changeTab = (tab: CurriculumDossierTab) => {
    if (!dossier) return
    setDossier({ ...dossier, tab })
    updateUrl({ tab }, 'replace')
  }

  const showToast = (next: Toast) => {
    setToast(next)
    if (next) window.setTimeout(() => setToast((current) => current === next ? null : current), 3000)
  }

  const refresh = useCallback(async () => {
    setBusy('refresh')
    setError(null)
    try {
      const response = await fetch('/api/angelcare360/curriculum', { cache: 'no-store' })
      const data = await response.json() as { ok: boolean; snapshot?: CurriculumSnapshot; message?: string }
      if (!response.ok || !data.ok || !data.snapshot) throw new Error(data.message || 'Le programme pédagogique ne peut pas être actualisé.')
      setSnapshot(data.snapshot)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Le programme pédagogique ne peut pas être actualisé.')
    } finally { setBusy(null) }
  }, [])

  const execute = async (chamber: ActionChamber) => {
    setBusy(chamber.actionKey)
    setError(null)
    try {
      const request: CurriculumActionRequest = {
        actionKey: chamber.actionKey,
        subjectId: chamber.subjectId,
        curriculumId: chamber.curriculumId,
        evaluationPolicyId: chamber.evaluationPolicyId,
        resourceId: chamber.resourceId,
        variationId: chamber.variationId,
        issueId: chamber.issueId,
        objectiveId: chamber.objectiveId,
        bindingId: chamber.bindingId,
        reason: chamber.values.reason || null,
        effectiveAt: chamber.values.effectiveAt || null,
        payload: normalizeValues(chamber.values),
        idempotencyKey: `${chamber.actionKey}:${chamber.subjectId || chamber.curriculumId || chamber.evaluationPolicyId || chamber.resourceId || chamber.issueId || 'new'}:${JSON.stringify(chamber.values)}`,
      }
      const id = chamber.subjectId || chamber.curriculumId || chamber.evaluationPolicyId || chamber.resourceId || chamber.issueId
      const kind = chamber.subjectId ? 'subject' : chamber.curriculumId ? 'curriculum' : chamber.evaluationPolicyId ? 'evaluation_policy' : chamber.resourceId ? 'resource' : chamber.issueId ? 'issue' : null
      const endpoint = id && kind ? `/api/angelcare360/curriculum/${id}?kind=${kind}` : '/api/angelcare360/curriculum'
      const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request) })
      const data = await response.json() as CurriculumActionResult & { message?: string }
      if (!response.ok || !data.ok) throw new Error(data.message || 'Cette action pédagogique n’a pas pu être terminée.')
      if (data.state === 'preview') {
        setSimulation(data.result || {})
        showToast({ kind: 'success', message: data.message })
      } else {
        if (data.snapshot) setSnapshot(data.snapshot)
        else await refresh()
        setAction(null)
        setSimulation(null)
        showToast({ kind: data.state === 'partially_failed' ? 'warning' : 'success', message: data.message })
        if (data.subjectId && chamber.actionKey === 'subject.create') openDossier('subject', data.subjectId, 'todo')
        if (data.curriculumId && chamber.actionKey === 'curriculum.create') openDossier('curriculum', data.curriculumId, 'todo')
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Cette action pédagogique n’a pas pu être terminée.'
      setError(message)
      showToast({ kind: 'error', message })
    } finally { setBusy(null) }
  }

  const selectedRecord = useMemo(() => {
    if (!dossier) return null
    if (dossier.kind === 'subject') return snapshot.subjects.find((item) => item.id === dossier.id) || null
    if (dossier.kind === 'curriculum') return snapshot.curricula.find((item) => item.id === dossier.id) || null
    if (dossier.kind === 'evaluation_policy') return snapshot.evaluationPolicies.find((item) => item.id === dossier.id) || null
    if (dossier.kind === 'resource') return snapshot.resources.find((item) => item.id === dossier.id) || null
    return snapshot.attention.find((item) => item.id === dossier.id) || null
  }, [dossier, snapshot])

  const filteredSubjects = useMemo(() => snapshot.subjects.filter((item) => {
    const matchesSearch = !search || `${item.name} ${item.code} ${item.department || ''} ${item.applicableLevels.join(' ')}`.toLowerCase().includes(search.toLowerCase())
    return matchesSearch && (tone === 'all' || item.tone === tone)
  }), [search, snapshot.subjects, tone])

  const filteredProgrammes = useMemo(() => snapshot.curricula.filter((item) => !search || `${item.name} ${item.code} ${item.applicableLevels.join(' ')}`.toLowerCase().includes(search.toLowerCase())), [search, snapshot.curricula])
  const openAction = (actionKey: CurriculumActionKey, context?: Partial<ActionChamber>) => { setSimulation(null); setAction(actionDefaults(actionKey, context)) }

  return <section className={styles.area} data-mode={snapshot.mode}>
    <header className={styles.commandCrown}>
      <div className={styles.crownIdentity}>
        <span className={styles.crownIcon}><BookOpenCheck size={24}/></span>
        <div>
          <span className={styles.eyebrow}>Matières & programme pédagogique</span>
          <h1>{snapshot.title}</h1>
          <p>{snapshot.subtitle}</p>
        </div>
      </div>
      <div className={styles.crownActions}>
        <button type="button" className={styles.secondaryButton} onClick={refresh} disabled={busy === 'refresh'}>{busy === 'refresh' ? <LoaderCircle className={styles.spin} size={17}/> : <RefreshCw size={17}/>} Actualiser</button>
        <button type="button" className={styles.secondaryButton} onClick={() => openAction('subject.create')}><Plus size={17}/> Créer une matière</button>
        <button type="button" className={styles.primaryButton} onClick={() => openAction('curriculum.create')}><Sparkles size={17}/> Créer un programme</button>
      </div>
    </header>

    <section className={styles.metricsGrid}>
      {snapshot.metrics.map((metric) => <button key={metric.key} type="button" className={styles.metricCard} data-tone={metric.tone} onClick={() => chooseView(metric.view)}><span className={styles.metricSignal}/><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small><ChevronRight size={17}/></button>)}
    </section>

    <nav className={styles.localNavigation} aria-label="Navigation du programme pédagogique">
      {VIEWS.map(({ key, label, icon: Icon }) => <button key={key} type="button" data-active={view === key} onClick={() => chooseView(key)}><Icon size={16}/><span>{label}</span></button>)}
    </nav>

    <section className={styles.toolbar}>
      <label className={styles.searchBox}><Search size={17}/><input value={search} onChange={(event: { target: { value: string } }) => setSearch(event.target.value)} placeholder="Rechercher une matière, un niveau, une classe ou un programme…"/></label>
      <label className={styles.filterBox}><Filter size={16}/><select value={tone} onChange={(event: { target: { value: string } }) => setTone(event.target.value as 'all' | CurriculumTone)}><option value="all">Tous les états</option><option value="verified">Complet</option><option value="warning">À compléter</option><option value="critical">Bloqué</option><option value="decision">Validation nécessaire</option></select></label>
      <div className={styles.toolbarActions}>
        <button type="button" onClick={() => openAction('curriculum.preview', { curriculumId: snapshot.curricula[0]?.id || null })}><FileSearch size={16}/> Simuler un changement</button>
        <button type="button" onClick={() => openAction('curriculum_resource.link')}><BookMarked size={16}/> Ajouter une ressource</button>
      </div>
    </section>

    {error ? <SchoolAdminErrorState title="Le programme pédagogique nécessite votre attention" detail={error} onRetry={refresh}/> : null}

    <main className={styles.canvas}>
      {view === 'today' ? <TodayView snapshot={snapshot} openDossier={openDossier} openAction={openAction}/> : null}
      {view === 'catalogue' ? <CatalogueView subjects={filteredSubjects} openDossier={openDossier} openAction={openAction}/> : null}
      {view === 'programmes' ? <ProgrammesView programmes={filteredProgrammes} snapshot={snapshot} openDossier={openDossier} openAction={openAction}/> : null}
      {view === 'levels-classes' ? <LevelsClassesView snapshot={snapshot} openDossier={openDossier} openAction={openAction}/> : null}
      {view === 'coverage' ? <CoverageView snapshot={snapshot} openDossier={openDossier} openAction={openAction}/> : null}
      {view === 'evaluation' ? <EvaluationView snapshot={snapshot} openDossier={openDossier} openAction={openAction}/> : null}
      {view === 'resources' ? <ResourcesView snapshot={snapshot} openDossier={openDossier} openAction={openAction}/> : null}
      {view === 'attention' ? <AttentionView snapshot={snapshot} openDossier={openDossier} openAction={openAction}/> : null}
      {view === 'history' ? <HistoryView snapshot={snapshot} openDossier={openDossier}/> : null}
    </main>

    {dossier && selectedRecord ? <DossierOverlay dossier={dossier} record={selectedRecord} snapshot={snapshot} onClose={closeDossier} onTab={changeTab} onMode={(mode) => setDossier({ ...dossier, mode })} openDossier={openDossier} openAction={openAction}/> : null}
    {action ? <ActionOverlay chamber={action} snapshot={snapshot} busy={busy === action.actionKey} simulation={simulation} onChange={(key, value) => setAction({ ...action, values: { ...action.values, [key]: value }, dirty: true })} onClose={() => { setAction(null); setSimulation(null) }} onExecute={() => execute(action)}/> : null}
    {toast ? <CustomerOverlayPortal><div className={styles.toast} data-kind={toast.kind}><span>{toast.kind === 'success' ? <Check size={17}/> : <AlertTriangle size={17}/>}</span>{toast.message}</div></CustomerOverlayPortal> : null}
  </section>
}

function TodayView({ snapshot, openDossier, openAction }: ViewProps) {
  const firstAction = snapshot.attention.find((item) => !item.resolved)
  return <div className={styles.todayGrid}>
    <section className={styles.heroPanel}>
      <div className={styles.panelHeading}><div><span className={styles.eyebrow}>Situation pédagogique</span><h2>Le programme de l’école en un regard</h2></div><BadgeCheck size={22}/></div>
      <SchoolAdminSituationSummary title={snapshot.attention.length ? `${snapshot.attention.length} élément(s) nécessitent une vérification` : 'Programme pédagogique complet'} detail={snapshot.attention.length ? 'SANILA a regroupé les matières, classes, méthodes d’évaluation et ressources qui nécessitent une action.' : 'Toutes les classes disposent des éléments pédagogiques attendus.'} consequence={snapshot.attention.some((item) => item.severity === 'blocking') ? 'Certaines classes ne peuvent pas être considérées comme pleinement prêtes.' : 'Aucun blocage pédagogique critique n’est détecté.'}/>
      <SchoolAdminNextAction title="Action recommandée" detail={firstAction?.recommendedActionLabel || 'Aucune action urgente'} onAction={firstAction?.recommendedActionKey ? () => openAction(firstAction.recommendedActionKey!, issueContext(firstAction)) : undefined}/>
      <div className={styles.crownFacts}><Fact label="Année scolaire" value={snapshot.school.currentAcademicYearLabel || 'À définir'}/><Fact label="Matières actives" value={String(snapshot.subjects.filter((item) => item.lifecycle === 'active').length)}/><Fact label="Programmes actifs" value={String(snapshot.curricula.filter((item) => item.lifecycle === 'active').length)}/><Fact label="Sites" value={String(snapshot.school.siteCount)}/></div>
    </section>
    <section className={styles.attentionPanel}><PanelTitle icon={AlertTriangle} title="Ce qui demande votre attention" subtitle="Chaque élément explique la cause, la conséquence et la prochaine action."/>{snapshot.attention.slice(0, 6).map((item) => <AttentionCard key={item.id} item={item} onOpen={() => openDossier('issue', item.id)} onAction={() => { if (item.recommendedActionKey) openAction(item.recommendedActionKey, issueContext(item)) }}/>)}{!snapshot.attention.length ? <SchoolAdminEmptyState title="Tout est en ordre" detail="Aucune action pédagogique n’est nécessaire aujourd’hui."/> : null}</section>
    <section className={styles.programmeRail}><PanelTitle icon={LibraryBig} title="Programmes en cours" subtitle="Version, couverture et prochaine décision."/>{snapshot.curricula.slice(0, 5).map((item) => <button key={item.id} type="button" className={styles.railRow} onClick={() => openDossier('curriculum', item.id)}><span data-tone={item.tone}/><div><strong>{item.name}</strong><small>{item.academicYearLabel || 'Année à préciser'} · {item.coverageLabel}</small></div><em>{item.lifecycleLabel}</em><ChevronRight size={16}/></button>)}{!snapshot.curricula.length ? <SchoolAdminEmptyState title="Aucun programme préparé" detail="Créez le premier programme pédagogique de l’établissement." actionLabel="Créer un programme" onAction={() => openAction('curriculum.create')}/> : null}</section>
    <section className={styles.coveragePreview}><PanelTitle icon={Network} title="Couverture des classes" subtitle="Les premiers écarts à corriger."/><CoverageRows bindings={snapshot.bindings.slice(0, 8)} openDossier={openDossier} openAction={openAction}/></section>
  </div>
}

function CatalogueView({ subjects, openDossier, openAction }: { subjects: CurriculumSubjectRecord[] } & Pick<ViewProps, 'openDossier' | 'openAction'>) {
  return <section className={styles.fullPanel}><PanelTitle icon={BookOpenCheck} title="Matières & domaines d’apprentissage" subtitle="Catalogue versionné, applicable aux niveaux et classes autorisés." action={<button type="button" onClick={() => openAction('subject.create')}><Plus size={16}/> Créer</button>}/>{subjects.length ? <div className={styles.subjectGrid}>{subjects.map((subject) => <article key={subject.id} className={styles.subjectCard} data-tone={subject.tone}><button type="button" className={styles.cardOpen} onClick={() => openDossier('subject', subject.id)}><span className={styles.subjectIcon}><BookOpenCheck size={20}/></span><div><small>{subject.pedagogicalTypeLabel}</small><h3>{subject.name}</h3><p>{subject.description || `${subject.linkedClasses} classe(s) liée(s)`}</p></div><ChevronRight size={18}/></button><div className={styles.cardStats}><Fact label="Version" value={subject.currentVersionLabel || 'À préparer'}/><Fact label="Classes" value={String(subject.linkedClasses)}/><Fact label="Évaluation" value={`${subject.evaluationReadyCount}/${subject.linkedClasses}`}/></div><div className={styles.cardFooter}><StatusPill tone={subject.tone} label={subject.coverageLabel}/><button type="button" onClick={() => subject.nextActionKey && openAction(subject.nextActionKey, { subjectId: subject.id })}>{subject.nextActionLabel}</button></div></article>)}</div> : <SchoolAdminEmptyState title="Aucune matière ou domaine d’apprentissage" detail="Créez les éléments qui composeront le programme de l’école." actionLabel="Créer la première matière" onAction={() => openAction('subject.create')}/>}</section>
}

function ProgrammesView({ programmes, snapshot, openDossier, openAction }: { programmes: CurriculumFrameworkRecord[]; snapshot: CurriculumSnapshot } & Pick<ViewProps, 'openDossier' | 'openAction'>) {
  return <section className={styles.fullPanel}><PanelTitle icon={LibraryBig} title="Programmes pédagogiques" subtitle="Une structure claire par année, niveau, établissement et site." action={<button type="button" onClick={() => openAction('curriculum.create')}><Plus size={16}/> Créer un programme</button>}/>{programmes.length ? <div className={styles.programmeGrid}>{programmes.map((programme) => <article key={programme.id} className={styles.programmeCard} data-tone={programme.tone}><button type="button" onClick={() => openDossier('curriculum', programme.id)}><span className={styles.programmeMark}><LibraryBig size={22}/></span><div><small>{programme.academicYearLabel || 'Année à préciser'} · {programme.siteLabel || programme.institutionLabel || snapshot.school.name}</small><h3>{programme.name}</h3><p>{programme.description || programme.coverageLabel}</p></div><ChevronRight size={18}/></button><div className={styles.programmeFacts}><Fact label="Niveaux" value={String(programme.applicableLevels.length)}/><Fact label="Matières" value={String(programme.subjectIds.length)}/><Fact label="Classes" value={String(programme.classIds.length)}/><Fact label="Version" value={programme.currentVersionLabel}/></div><div className={styles.cardFooter}><StatusPill tone={programme.tone} label={programme.lifecycleLabel}/><button type="button" onClick={() => programme.nextActionKey && openAction(programme.nextActionKey, { curriculumId: programme.id })}>{programme.nextActionLabel}</button></div></article>)}</div> : <SchoolAdminEmptyState title="Aucun programme pédagogique" detail="Préparez un programme adapté aux niveaux et à l’année scolaire." actionLabel="Créer le premier programme" onAction={() => openAction('curriculum.create')}/>}</section>
}

function LevelsClassesView({ snapshot, openDossier, openAction }: ViewProps) {
  const levels = Array.from(new Set(snapshot.bindings.map((item) => item.levelLabel || 'Niveau à préciser')))
  return <section className={styles.fullPanel}><PanelTitle icon={GraduationCap} title="Niveaux & classes" subtitle="Ce que chaque classe doit apprendre et ce qui reste à compléter."/>{levels.length ? <div className={styles.levelStack}>{levels.map((level) => { const bindings = snapshot.bindings.filter((item) => (item.levelLabel || 'Niveau à préciser') === level); return <article key={level} className={styles.levelCard}><header><div><small>Niveau</small><h3>{level}</h3></div><StatusPill tone={bindings.every((item) => item.coverageState === 'complete') ? 'verified' : 'warning'} label={`${bindings.filter((item) => item.coverageState === 'complete').length}/${bindings.length} complets`}/></header><CoverageRows bindings={bindings} openDossier={openDossier} openAction={openAction}/></article> })}</div> : <SchoolAdminEmptyState title="Aucun rattachement classe-matière" detail="Ajoutez les matières du programme aux niveaux et classes concernés." actionLabel="Ajouter une matière" onAction={() => openAction('curriculum.add_subject', { curriculumId: snapshot.curricula[0]?.id || null })}/>}</section>
}

function CoverageView({ snapshot, openDossier, openAction }: ViewProps) {
  return <section className={styles.fullPanel}><PanelTitle icon={Network} title="Couverture pédagogique" subtitle="Versions, enseignants, évaluations et ressources pour chaque classe." action={<button type="button" onClick={() => openAction('curriculum.preview', { curriculumId: snapshot.curricula[0]?.id || null })}><FileSearch size={16}/> Simuler</button>}/><div className={styles.matrix}><div className={styles.matrixHeader}><span>Classe</span><span>Matière / domaine</span><span>Version</span><span>Enseignant</span><span>Évaluation</span><span>Ressources</span><span>État</span><span/></div>{snapshot.bindings.map((binding) => { const subject = snapshot.subjects.find((item) => item.id === binding.subjectId); return <div key={binding.id} className={styles.matrixRow} data-tone={binding.tone}><button type="button" onClick={() => binding.classId && window.location.assign(binding.exactClassHref || '#')}><strong>{binding.classLabel}</strong><small>{binding.levelLabel || 'Niveau à préciser'}</small></button><button type="button" onClick={() => openDossier('subject', binding.subjectId)}><strong>{subject?.name || 'Matière'}</strong><small>{binding.required ? 'Obligatoire' : 'Optionnelle'}</small></button><span>{subject?.currentVersionLabel || 'À définir'}</span><button type="button" onClick={() => binding.exactAssignmentHref && window.location.assign(binding.exactAssignmentHref)}>{binding.teacherLabels[0] || 'À affecter'}</button><span>{binding.evaluationState === 'ready' ? 'Prête' : binding.evaluationState === 'not_required' ? 'Non requise' : 'À définir'}</span><span>{binding.resourceState === 'ready' ? 'Disponibles' : binding.resourceState === 'not_required' ? 'Non requises' : binding.resourceState === 'restricted' ? 'Accès limité' : 'À vérifier'}</span><StatusPill tone={binding.tone} label={binding.coverageLabel}/><button type="button" className={styles.iconAction} onClick={() => binding.coverageState === 'evaluation_missing' ? openAction('evaluation_policy.create', { subjectId: binding.subjectId, curriculumId: binding.curriculumId }) : openAction('curriculum_issue.assign', { subjectId: binding.subjectId, curriculumId: binding.curriculumId, bindingId: binding.id })}><ChevronRight size={17}/></button></div>})}</div>{!snapshot.bindings.length ? <SchoolAdminEmptyState title="Aucune couverture à analyser" detail="Liez les matières aux programmes et classes pour activer cette matrice."/> : null}</section>
}

function EvaluationView({ snapshot, openDossier, openAction }: ViewProps) {
  return <section className={styles.fullPanel}><PanelTitle icon={ClipboardCheck} title="Méthodes d’évaluation" subtitle="Ce que les enseignants enregistrent, quand et comment cela apparaît dans les documents scolaires." action={<button type="button" onClick={() => openAction('evaluation_policy.create')}><Plus size={16}/> Définir une méthode</button>}/>{snapshot.evaluationPolicies.length ? <div className={styles.policyGrid}>{snapshot.evaluationPolicies.map((policy) => <article key={policy.id} className={styles.policyCard} data-tone={policy.tone}><button type="button" onClick={() => openDossier('evaluation_policy', policy.id)}><ClipboardCheck size={20}/><div><small>{policy.subjectLabel || policy.curriculumLabel || 'Programme'}</small><h3>{policy.methodLabel}</h3><p>{policy.levelLabel || 'Tous les niveaux'} · Version {policy.versionNumber}</p></div><ChevronRight size={17}/></button><div className={styles.cardFooter}><StatusPill tone={policy.tone} label={policy.lifecycleLabel}/><button type="button" onClick={() => openAction(policy.lifecycle === 'active' ? 'evaluation_policy.replace' : 'evaluation_policy.activate', { evaluationPolicyId: policy.id, subjectId: policy.subjectId, curriculumId: policy.curriculumId })}>{policy.lifecycle === 'active' ? 'Préparer une nouvelle version' : 'Rendre active'}</button></div></article>)}</div> : <SchoolAdminEmptyState title="Aucune méthode d’évaluation" detail="Définissez une méthode adaptée aux matières et niveaux concernés." actionLabel="Définir la première méthode" onAction={() => openAction('evaluation_policy.create')}/>}</section>
}

function ResourcesView({ snapshot, openDossier, openAction }: ViewProps) {
  return <section className={styles.fullPanel}><PanelTitle icon={BookMarked} title="Ressources pédagogiques" subtitle="Guides, documents, matériels, modèles et accès liés au programme." action={<button type="button" onClick={() => openAction('curriculum_resource.link')}><Plus size={16}/> Ajouter une ressource</button>}/>{snapshot.resources.length ? <div className={styles.resourceGrid}>{snapshot.resources.map((resource) => <article key={resource.id} className={styles.resourceCard} data-tone={resource.tone}><button type="button" onClick={() => openDossier('resource', resource.id)}><span><BookMarked size={20}/></span><div><small>{resource.category} · {resource.language || 'Langue non précisée'}</small><h3>{resource.name}</h3><p>{resource.subjectLabel || resource.curriculumLabel || 'Ressource commune'}</p></div><ChevronRight size={17}/></button><div className={styles.cardFooter}><StatusPill tone={resource.tone} label={resource.stateLabel}/><button type="button" onClick={() => resource.state === 'restricted' ? openAction('curriculum_resource.request_access', { resourceId: resource.id }) : resource.exactHref ? window.location.assign(resource.exactHref) : openDossier('resource', resource.id)}>{resource.state === 'restricted' ? 'Demander l’accès' : 'Ouvrir'}</button></div></article>)}</div> : <SchoolAdminEmptyState title="Aucune ressource liée" detail="Associez les documents et matériels utiles aux matières et programmes." actionLabel="Ajouter une ressource" onAction={() => openAction('curriculum_resource.link')}/>}<ProductAccessPanel snapshot={snapshot} openAction={openAction}/></section>
}

function AttentionView({ snapshot, openDossier, openAction }: ViewProps) {
  return <section className={styles.fullPanel}><PanelTitle icon={AlertTriangle} title="À régler" subtitle="Programme incomplet, version, évaluation, ressource ou validation."/><div className={styles.attentionList}>{snapshot.attention.map((item) => <AttentionCard key={item.id} item={item} onOpen={() => item.exactHref ? window.location.assign(item.exactHref) : openDossier('issue', item.id)} onAction={() => { if (item.recommendedActionKey) openAction(item.recommendedActionKey, issueContext(item)) }}/>)}</div>{!snapshot.attention.length ? <SchoolAdminEmptyState title="Programme complet" detail="Toutes les classes disposent des matières, objectifs et méthodes d’évaluation attendus."/> : null}</section>
}

function HistoryView({ snapshot, openDossier }: Pick<ViewProps, 'snapshot' | 'openDossier'>) {
  return <section className={styles.fullPanel}><PanelTitle icon={History} title="Historique pédagogique" subtitle="Versions, activations, rattachements, variations et décisions."/>{snapshot.history.length ? <div className={styles.historyList}>{snapshot.history.map((event) => <button key={event.id} type="button" className={styles.historyRow} onClick={() => { if (event.sourceType === 'subject' && event.sourceId) openDossier('subject', event.sourceId, 'history'); else if (event.sourceType === 'curriculum' && event.sourceId) openDossier('curriculum', event.sourceId, 'history') }}><span data-tone={event.tone}/><div><strong>{event.label}</strong><small>{event.detail || 'Modification pédagogique enregistrée'}</small></div><em>{event.actorLabel || 'Système'} · {formatDate(event.createdAt)}</em><ChevronRight size={16}/></button>)}</div> : <SchoolAdminEmptyState title="Aucun historique pédagogique" detail="Les changements importants apparaîtront ici."/>}</section>
}

function DossierOverlay({ dossier, record, snapshot, onClose, onTab, onMode, openDossier, openAction }: { dossier: SelectedDossier; record: CurriculumSubjectRecord | CurriculumFrameworkRecord | EvaluationPolicyRecord | CurriculumResourceRecord | CurriculumAttentionItem; snapshot: CurriculumSnapshot; onClose: () => void; onTab: (tab: CurriculumDossierTab) => void; onMode: (mode: SelectedDossier['mode']) => void } & Pick<ViewProps, 'openDossier' | 'openAction'>) {
  const title = dossier.kind === 'subject' ? (record as CurriculumSubjectRecord).name : dossier.kind === 'curriculum' ? (record as CurriculumFrameworkRecord).name : dossier.kind === 'evaluation_policy' ? (record as EvaluationPolicyRecord).methodLabel : dossier.kind === 'resource' ? (record as CurriculumResourceRecord).name : (record as CurriculumAttentionItem).title
  const status = dossier.kind === 'subject' ? (record as CurriculumSubjectRecord).coverageLabel : dossier.kind === 'curriculum' ? (record as CurriculumFrameworkRecord).lifecycleLabel : dossier.kind === 'evaluation_policy' ? (record as EvaluationPolicyRecord).lifecycleLabel : dossier.kind === 'resource' ? (record as CurriculumResourceRecord).stateLabel : (record as CurriculumAttentionItem).severity === 'blocking' ? 'Bloquant' : 'À vérifier'
  const tone = dossier.kind === 'subject' ? (record as CurriculumSubjectRecord).tone : dossier.kind === 'curriculum' ? (record as CurriculumFrameworkRecord).tone : dossier.kind === 'evaluation_policy' ? (record as EvaluationPolicyRecord).tone : dossier.kind === 'resource' ? (record as CurriculumResourceRecord).tone : (record as CurriculumAttentionItem).tone
  const nextAction = dossier.kind === 'subject' ? { key: (record as CurriculumSubjectRecord).nextActionKey, label: (record as CurriculumSubjectRecord).nextActionLabel } : dossier.kind === 'curriculum' ? { key: (record as CurriculumFrameworkRecord).nextActionKey, label: (record as CurriculumFrameworkRecord).nextActionLabel } : dossier.kind === 'issue' ? { key: (record as CurriculumAttentionItem).recommendedActionKey, label: (record as CurriculumAttentionItem).recommendedActionLabel || 'Traiter ce point' } : { key: null, label: 'Aucune action recommandée' }
  const context = dossierContext(dossier, record)
  return <CustomerOverlaySurface kind={dossier.mode === 'focus' ? 'focus-command' : dossier.mode === 'peek' ? 'quick-peek' : 'dossier'} ariaLabel={title} dirty={false} onClose={onClose}>
    <div className={styles.dossier} data-mode={dossier.mode}>
      <SchoolAdminDossierHeader eyebrow={kindLabel(dossier.kind)} title={title} statusLabel={status} statusTone={tone === 'critical' ? 'critical' : tone === 'warning' ? 'warning' : tone === 'verified' ? 'verified' : tone === 'decision' ? 'decision' : 'neutral'} summary={dossierSummary(dossier.kind, record)} onClose={onClose} onExpand={() => onMode(dossier.mode === 'focus' ? 'dossier' : 'focus')}/>
      <SchoolAdminBreadcrumb items={[{ label: 'Administration', href: '/angelcare-360-command-center/administration' }, { label: 'Matières & programme', onClick: onClose }, { label: title }]}/>
      <nav className={styles.dossierTabs} aria-label="Sections du dossier">{TABS.map((tab) => <button key={tab.key} type="button" data-active={dossier.tab === tab.key} onClick={() => onTab(tab.key)}>{tab.label}</button>)}</nav>
      <div className={styles.dossierCanvas}>{renderDossierTab(dossier, record, snapshot, openDossier, openAction)}</div>
      <SchoolAdminActionDock primaryAction={nextAction.key ? { label: nextAction.label, onClick: () => openAction(nextAction.key!, context) } : undefined} secondaryActions={[{ label: 'Ajouter une note', onClick: () => openAction('curriculum_note.add', context) }, { label: 'Demander un justificatif', onClick: () => openAction('curriculum_evidence.request', context) }]}/>
    </div>
  </CustomerOverlaySurface>
}

function renderDossierTab(dossier: SelectedDossier, record: CurriculumSubjectRecord | CurriculumFrameworkRecord | EvaluationPolicyRecord | CurriculumResourceRecord | CurriculumAttentionItem, snapshot: CurriculumSnapshot, openDossier: ViewProps['openDossier'], openAction: ViewProps['openAction']) {
  if (dossier.kind === 'subject') return <SubjectDossierTab subject={record as CurriculumSubjectRecord} tab={dossier.tab} snapshot={snapshot} openDossier={openDossier} openAction={openAction}/>
  if (dossier.kind === 'curriculum') return <ProgrammeDossierTab programme={record as CurriculumFrameworkRecord} tab={dossier.tab} snapshot={snapshot} openDossier={openDossier} openAction={openAction}/>
  if (dossier.kind === 'evaluation_policy') return <EvaluationDossierTab policy={record as EvaluationPolicyRecord} tab={dossier.tab} snapshot={snapshot} openAction={openAction}/>
  if (dossier.kind === 'resource') return <ResourceDossierTab resource={record as CurriculumResourceRecord} tab={dossier.tab} snapshot={snapshot} openAction={openAction}/>
  return <IssueDossierTab issue={record as CurriculumAttentionItem} tab={dossier.tab} snapshot={snapshot} openAction={openAction}/>
}

function SubjectDossierTab({ subject, tab, snapshot, openDossier, openAction }: { subject: CurriculumSubjectRecord; tab: CurriculumDossierTab; snapshot: CurriculumSnapshot } & Pick<ViewProps, 'openDossier' | 'openAction'>) {
  const context = { subjectId: subject.id }
  if (tab === 'todo') return <DossierSection title="Ce qui demande votre attention"><SchoolAdminSituationSummary title={subject.coverageLabel} detail={subject.description || `${subject.linkedClasses} classe(s) utilisent cette matière.`} consequence={subject.issueIds.length ? `${subject.issueIds.length} point(s) restent à régler.` : 'Aucun problème critique n’est détecté.'}/><SchoolAdminNextAction title="Action recommandée" detail={subject.nextActionLabel} onAction={subject.nextActionKey ? () => openAction(subject.nextActionKey!, context) : undefined}/>{snapshot.attention.filter((item) => item.sourceId === subject.id || item.id.includes(subject.id)).map((item) => <AttentionCard key={item.id} item={item} onOpen={() => { if (item.exactHref) window.location.assign(item.exactHref) }} onAction={() => { if (item.recommendedActionKey) openAction(item.recommendedActionKey, issueContext(item)) }}/>)}</DossierSection>
  if (tab === 'information') return <DossierSection title="Informations essentielles"><DetailGrid items={[['Code', subject.code], ['Type', subject.pedagogicalTypeLabel], ['Département', subject.department || 'À préciser'], ['Langues', subject.languages.join(', ') || 'À préciser'], ['Obligatoire', subject.requiredByDefault ? 'Oui' : 'Non'], ['Volume attendu', subject.expectedWeeklyHours === null ? 'À préciser' : `${subject.expectedWeeklyHours} h / semaine`], ['État', subject.lifecycleLabel], ['Couverture', subject.coverageLabel]]}/><button type="button" className={styles.inlinePrimary} onClick={() => openAction('subject.update', context)}>Modifier les informations</button></DossierSection>
  if (tab === 'levels-classes') return <DossierSection title="Niveaux & classes"><CoverageRows bindings={subject.bindings} openDossier={openDossier} openAction={openAction}/><button type="button" className={styles.inlinePrimary} onClick={() => openAction('curriculum.bind_class', context)}>Ajouter à une classe</button></DossierSection>
  if (tab === 'objectives') return <DossierSection title="Objectifs d’apprentissage">{subject.objectives.length ? <div className={styles.objectiveList}>{subject.objectives.map((objective) => <article key={objective.id}><span>{objective.sequenceOrder}</span><div><strong>{objective.title}</strong><p>{objective.description || objective.observableResult || 'Description à compléter'}</p><small>{objective.levelLabel || 'Tous niveaux'} · {objective.expectedPeriodLabel || 'Période à préciser'}</small></div><button type="button" onClick={() => openAction('learning_objective.update', { ...context, objectiveId: objective.id })}>Modifier</button></article>)}</div> : <SchoolAdminEmptyState title="Aucun objectif défini" detail="Décrivez ce que les enfants doivent apprendre et comment cela peut être observé."/>}<button type="button" className={styles.inlinePrimary} onClick={() => openAction('learning_objective.create', context)}>Ajouter un objectif</button></DossierSection>
  if (tab === 'evaluation') { const policies = snapshot.evaluationPolicies.filter((item) => item.subjectId === subject.id); return <DossierSection title="Méthodes d’évaluation">{policies.length ? policies.map((policy) => <button key={policy.id} type="button" className={styles.dossierRow} onClick={() => openDossier('evaluation_policy', policy.id)}><div><strong>{policy.methodLabel}</strong><small>{policy.levelLabel || 'Tous niveaux'} · Version {policy.versionNumber}</small></div><StatusPill tone={policy.tone} label={policy.lifecycleLabel}/><ChevronRight size={16}/></button>) : <SchoolAdminEmptyState title="Aucune méthode définie" detail="Choisissez comment les progrès doivent être enregistrés et communiqués."/>}<button type="button" className={styles.inlinePrimary} onClick={() => openAction('evaluation_policy.create', context)}>Définir une méthode</button></DossierSection> }
  if (tab === 'resources') { const resources = snapshot.resources.filter((item) => item.subjectId === subject.id); return <DossierSection title="Ressources pédagogiques">{resources.length ? resources.map((resource) => <button key={resource.id} type="button" className={styles.dossierRow} onClick={() => openDossier('resource', resource.id)}><div><strong>{resource.name}</strong><small>{resource.category} · {resource.language || 'Langue à préciser'}</small></div><StatusPill tone={resource.tone} label={resource.stateLabel}/><ChevronRight size={16}/></button>) : <SchoolAdminEmptyState title="Aucune ressource associée" detail="Ajoutez les guides, documents ou matériels utiles."/>}<button type="button" className={styles.inlinePrimary} onClick={() => openAction('curriculum_resource.link', context)}>Associer une ressource</button></DossierSection> }
  if (tab === 'versions') return <DossierSection title="Versions"><div className={styles.versionRail}>{subject.versions.map((version) => <article key={version.id} data-tone={version.state === 'active' ? 'verified' : version.state === 'draft' ? 'warning' : 'neutral'}><div><strong>{version.versionLabel}</strong><small>{version.stateLabel} · {version.effectiveFrom ? formatDate(version.effectiveFrom) : 'Date à préciser'}</small></div><p>{version.changeReason || 'Version de référence'}</p>{version.state === 'draft' ? <button type="button" onClick={() => openAction('subject.publish_version', { ...context, bindingId: version.id })}>Rendre active</button> : null}</article>)}</div><button type="button" className={styles.inlinePrimary} onClick={() => openAction('subject.prepare_version', context)}>Préparer une nouvelle version</button></DossierSection>
  return <DossierSection title="Historique"><HistoryRows events={snapshot.history.filter((item) => item.sourceId === subject.id)}/></DossierSection>
}

function ProgrammeDossierTab({ programme, tab, snapshot, openDossier, openAction }: { programme: CurriculumFrameworkRecord; tab: CurriculumDossierTab; snapshot: CurriculumSnapshot } & Pick<ViewProps, 'openDossier' | 'openAction'>) {
  const context = { curriculumId: programme.id }
  const bindings = snapshot.bindings.filter((item) => item.curriculumId === programme.id)
  if (tab === 'todo') return <DossierSection title="Ce qui demande votre attention"><SchoolAdminSituationSummary title={programme.coverageLabel} detail={programme.description || `${programme.subjectIds.length} matière(s) et ${programme.classIds.length} classe(s).`} consequence={programme.issueIds.length ? `${programme.issueIds.length} point(s) nécessitent une vérification.` : 'Le programme peut poursuivre son cycle de validation.'}/><SchoolAdminNextAction title="Action recommandée" detail={programme.nextActionLabel} onAction={programme.nextActionKey ? () => openAction(programme.nextActionKey!, context) : undefined}/>{snapshot.attention.filter((item) => item.sourceId === programme.id || item.id.includes(programme.id)).map((item) => <AttentionCard key={item.id} item={item} onOpen={() => { if (item.exactHref) window.location.assign(item.exactHref) }} onAction={() => { if (item.recommendedActionKey) openAction(item.recommendedActionKey, issueContext(item)) }}/>)}</DossierSection>
  if (tab === 'information') return <DossierSection title="Vue d’ensemble"><DetailGrid items={[['Code', programme.code], ['Année scolaire', programme.academicYearLabel || 'À préciser'], ['Établissement', programme.institutionLabel || snapshot.school.name], ['Site', programme.siteLabel || 'Programme commun'], ['Niveaux', programme.applicableLevels.join(', ') || 'À préciser'], ['Version', programme.currentVersionLabel], ['État', programme.lifecycleLabel], ['Couverture', programme.coverageLabel]]}/><button type="button" className={styles.inlinePrimary} onClick={() => openAction('curriculum.update', context)}>Modifier le programme</button></DossierSection>
  if (tab === 'levels-classes') return <DossierSection title="Niveaux & classes"><CoverageRows bindings={bindings} openDossier={openDossier} openAction={openAction}/><button type="button" className={styles.inlinePrimary} onClick={() => openAction('curriculum.bind_class', context)}>Ajouter une matière aux classes</button></DossierSection>
  if (tab === 'objectives') { const objectives = snapshot.subjects.flatMap((subject) => subject.objectives).filter((objective) => objective.curriculumId === programme.id || programme.subjectIds.includes(objective.subjectId || '')); return <DossierSection title="Objectifs du programme">{objectives.length ? <div className={styles.objectiveList}>{objectives.map((objective) => <article key={objective.id}><span>{objective.sequenceOrder}</span><div><strong>{objective.title}</strong><p>{objective.observableResult || objective.description || 'À compléter'}</p></div><button type="button" onClick={() => openAction('learning_objective.update', { ...context, objectiveId: objective.id })}>Modifier</button></article>)}</div> : <SchoolAdminEmptyState title="Aucun objectif défini" detail="Ajoutez les attentes pédagogiques du programme."/>}<button type="button" className={styles.inlinePrimary} onClick={() => openAction('learning_objective.create', context)}>Ajouter un objectif</button></DossierSection> }
  if (tab === 'evaluation') { const policies = snapshot.evaluationPolicies.filter((item) => item.curriculumId === programme.id || (item.subjectId && programme.subjectIds.includes(item.subjectId))); return <DossierSection title="Évaluations">{policies.length ? policies.map((policy) => <button key={policy.id} type="button" className={styles.dossierRow} onClick={() => openDossier('evaluation_policy', policy.id)}><div><strong>{policy.subjectLabel || policy.methodLabel}</strong><small>{policy.methodLabel} · {policy.levelLabel || 'Tous niveaux'}</small></div><StatusPill tone={policy.tone} label={policy.lifecycleLabel}/><ChevronRight size={16}/></button>) : <SchoolAdminEmptyState title="Aucune méthode définie" detail="Le programme doit expliquer comment les progrès sont observés."/>}</DossierSection> }
  if (tab === 'resources') { const resources = snapshot.resources.filter((item) => item.curriculumId === programme.id || (item.subjectId && programme.subjectIds.includes(item.subjectId))); return <DossierSection title="Ressources">{resources.length ? resources.map((resource) => <button key={resource.id} type="button" className={styles.dossierRow} onClick={() => openDossier('resource', resource.id)}><div><strong>{resource.name}</strong><small>{resource.subjectLabel || resource.category}</small></div><StatusPill tone={resource.tone} label={resource.stateLabel}/><ChevronRight size={16}/></button>) : <SchoolAdminEmptyState title="Aucune ressource liée" detail="Associez les ressources indispensables au programme."/>}<button type="button" className={styles.inlinePrimary} onClick={() => openAction('curriculum_resource.link', context)}>Associer une ressource</button></DossierSection> }
  if (tab === 'versions') return <DossierSection title="Versions & variations"><div className={styles.versionSummary}><Fact label="Version actuelle" value={programme.currentVersionLabel}/><Fact label="Variations locales" value={String(programme.variationIds.length)}/><Fact label="Matières" value={String(programme.subjectIds.length)}/><Fact label="Classes" value={String(programme.classIds.length)}/></div>{snapshot.variations.filter((item) => item.curriculumId === programme.id).map((variation) => <article key={variation.id} className={styles.variationRow}><div><strong>{variation.title}</strong><small>{variation.siteLabel || 'Site à préciser'} · {variation.lifecycleLabel}</small></div><p>{variation.reason}</p><button type="button" onClick={() => openAction(variation.lifecycle === 'pending' ? 'curriculum_variation.approve' : 'curriculum_variation.request_approval', { ...context, variationId: variation.id })}>{variation.lifecycle === 'pending' ? 'Examiner' : 'Demander la validation'}</button></article>)}<div className={styles.inlineActions}><button type="button" onClick={() => openAction('curriculum_variation.create', context)}>Créer une variation locale</button><button type="button" onClick={() => openAction('curriculum.prepare_replacement', context)}>Préparer un remplacement</button><Link href={`/angelcare-360-command-center/administration?plane=academic-structure&view=next-year&curriculum=${programme.id}&source=subjects`}>Préparer l’année suivante</Link></div></DossierSection>
  return <DossierSection title="Historique"><HistoryRows events={snapshot.history.filter((item) => item.sourceId === programme.id)}/></DossierSection>
}

function EvaluationDossierTab({ policy, tab, snapshot, openAction }: { policy: EvaluationPolicyRecord; tab: CurriculumDossierTab; snapshot: CurriculumSnapshot; openAction: ViewProps['openAction'] }) {
  const context = { evaluationPolicyId: policy.id, subjectId: policy.subjectId, curriculumId: policy.curriculumId }
  if (tab === 'todo') return <DossierSection title="À faire"><SchoolAdminSituationSummary title={policy.lifecycleLabel} detail={`${policy.methodLabel} · ${policy.levelLabel || 'Tous niveaux'}`} consequence={policy.issueIds.length ? `${policy.issueIds.length} point(s) restent à régler.` : 'Aucun conflit détecté.'}/><SchoolAdminNextAction title="Action recommandée" detail={policy.lifecycle === 'active' ? 'Aucune action nécessaire' : 'Rendre cette méthode active'} onAction={policy.lifecycle === 'active' ? undefined : () => openAction('evaluation_policy.activate', context)}/></DossierSection>
  if (tab === 'information') return <DossierSection title="Méthode"><DetailGrid items={[['Matière / programme', policy.subjectLabel || policy.curriculumLabel || 'À préciser'], ['Méthode', policy.methodLabel], ['Niveau', policy.levelLabel || 'Tous niveaux'], ['Échelle', policy.scaleCode || 'Non applicable'], ['Justificatif requis', policy.evidenceRequired ? 'Oui' : 'Non'], ['Document scolaire', policy.reportCardMapping || 'À préciser'], ['Version', String(policy.versionNumber)], ['État', policy.lifecycleLabel]]}/><button type="button" className={styles.inlinePrimary} onClick={() => openAction('evaluation_policy.update', context)}>Modifier la méthode</button></DossierSection>
  if (tab === 'levels-classes') return <DossierSection title="Classes concernées"><CoverageRows bindings={snapshot.bindings.filter((item) => item.evaluationPolicyId === policy.id)} openDossier={() => undefined} openAction={openAction}/></DossierSection>
  if (tab === 'versions') return <DossierSection title="Version"><SchoolAdminImpactPreview title="Préparer une nouvelle méthode" items={[`Version actuelle : ${policy.versionNumber}`, `Classes concernées : ${policy.classCount}`, 'Les évaluations historiques ne seront pas modifiées.']}/><button type="button" className={styles.inlinePrimary} onClick={() => openAction('evaluation_policy.replace', context)}>Préparer une nouvelle version</button></DossierSection>
  if (tab === 'history') return <DossierSection title="Historique"><HistoryRows events={snapshot.history.filter((item) => item.sourceId === policy.id)}/></DossierSection>
  return <DossierSection title={TABS.find((item) => item.key === tab)?.label || 'Détails'}><SchoolAdminEmptyState title="Information centralisée" detail="Cette section est alimentée par la méthode d’évaluation et ses rattachements actifs."/></DossierSection>
}

function ResourceDossierTab({ resource, tab, snapshot, openAction }: { resource: CurriculumResourceRecord; tab: CurriculumDossierTab; snapshot: CurriculumSnapshot; openAction: ViewProps['openAction'] }) {
  const context = { resourceId: resource.id, subjectId: resource.subjectId, curriculumId: resource.curriculumId }
  if (tab === 'todo') return <DossierSection title="À faire"><SchoolAdminSituationSummary title={resource.stateLabel} detail={`${resource.category} · ${resource.subjectLabel || resource.curriculumLabel || 'Ressource commune'}`} consequence={resource.state === 'restricted' ? 'L’accès dépend de la formule ou d’une activation commerciale.' : resource.state === 'expired' ? 'La ressource ne doit plus être utilisée sans remplacement.' : 'Aucun blocage critique détecté.'}/><SchoolAdminNextAction title="Action recommandée" detail={resource.state === 'restricted' ? 'Demander l’accès' : resource.state === 'expired' ? 'Remplacer la ressource' : 'Aucune action nécessaire'} onAction={resource.state === 'restricted' ? () => openAction('curriculum_resource.request_access', context) : resource.state === 'expired' ? () => openAction('curriculum_resource.replace', context) : undefined}/></DossierSection>
  if (tab === 'information') return <DossierSection title="Informations"><DetailGrid items={[['Code', resource.code], ['Catégorie', resource.category], ['Langue', resource.language || 'À préciser'], ['Matière', resource.subjectLabel || 'Non liée'], ['Programme', resource.curriculumLabel || 'Non lié'], ['Niveaux', resource.applicableLevels.join(', ') || 'À préciser'], ['Licence', resource.licenceCode || 'Non applicable'], ['État', resource.stateLabel]]}/>{resource.exactHref ? <Link className={styles.inlinePrimary} href={resource.exactHref}>Ouvrir la ressource</Link> : null}</DossierSection>
  if (tab === 'versions') return <DossierSection title="Remplacement"><SchoolAdminImpactPreview title="Continuité de la ressource" items={['La ressource actuelle restera référencée dans les anciens programmes.', 'La nouvelle ressource prendra effet à la date choisie.', 'Les classes actives seront recalculées.']}/><button type="button" className={styles.inlinePrimary} onClick={() => openAction('curriculum_resource.replace', context)}>Remplacer la ressource</button></DossierSection>
  if (tab === 'history') return <DossierSection title="Historique"><HistoryRows events={snapshot.history.filter((item) => item.sourceId === resource.id)}/></DossierSection>
  return <DossierSection title={TABS.find((item) => item.key === tab)?.label || 'Détails'}><SchoolAdminEmptyState title="Ressource pédagogique" detail="Les relations actives avec les programmes, niveaux et classes apparaissent ici."/></DossierSection>
}

function IssueDossierTab({ issue, tab, snapshot, openAction }: { issue: CurriculumAttentionItem; tab: CurriculumDossierTab; snapshot: CurriculumSnapshot; openAction: ViewProps['openAction'] }) {
  const context = issueContext(issue)
  if (tab === 'todo') return <DossierSection title="Situation"><SchoolAdminSituationSummary title={issue.title} detail={issue.explanation} consequence={issue.consequence || 'Une vérification pédagogique est nécessaire.'}/><SchoolAdminNextAction title="Action recommandée" detail={issue.recommendedActionLabel || 'Traiter ce point'} onAction={issue.recommendedActionKey ? () => openAction(issue.recommendedActionKey!, context) : undefined}/><SchoolAdminAssignmentPanel ownerLabel={issue.ownerLabel} dueAt={issue.dueAt} onAssign={() => openAction('curriculum_issue.assign', context)}/></DossierSection>
  if (tab === 'information') return <DossierSection title="Informations"><DetailGrid items={[['Source', issue.sourceType], ['Gravité', issue.severity === 'blocking' ? 'Bloquante' : issue.severity === 'warning' ? 'À vérifier' : 'Information'], ['Responsable', issue.ownerLabel || 'À attribuer'], ['Échéance', issue.dueAt ? formatDate(issue.dueAt) : 'À définir'], ['État', issue.resolved ? 'Réglé' : 'Actif']]}/></DossierSection>
  if (tab === 'history') return <DossierSection title="Historique"><HistoryRows events={snapshot.history.filter((item) => item.sourceId === issue.id || item.sourceId === issue.sourceId)}/></DossierSection>
  return <DossierSection title={TABS.find((item) => item.key === tab)?.label || 'Détails'}><SchoolAdminEmptyState title="Contexte du point à traiter" detail="Les éléments liés sont disponibles depuis les actions exactes du dossier."/></DossierSection>
}

function ActionOverlay({ chamber, snapshot, busy, simulation, onChange, onClose, onExecute }: { chamber: ActionChamber; snapshot: CurriculumSnapshot; busy: boolean; simulation: Record<string, unknown> | null; onChange: (key: string, value: string) => void; onClose: () => void; onExecute: () => void }) {
  const copy = ACTION_COPY[chamber.actionKey]
  return <CustomerOverlaySurface kind="nested-command" ariaLabel={copy.title} dirty={chamber.dirty} onClose={onClose}>
    <div className={styles.actionChamber}>
      <header className={styles.actionHeader}><div><span className={styles.eyebrow}>Fenêtre d’action</span><h2>{copy.title}</h2><p>{copy.description}</p></div><button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fermer"><X size={20}/></button></header>
      <div className={styles.actionBody}>
        <ActionFields chamber={chamber} snapshot={snapshot} onChange={onChange}/>
        <SchoolAdminImpactPreview title="Ce qui va changer" items={impactItems(chamber, snapshot)}/>
        {simulation ? <SimulationPanel simulation={simulation}/> : null}
      </div>
      <footer className={styles.actionFooter}><button type="button" className={styles.secondaryButton} onClick={onClose}>Annuler</button><button type="button" className={copy.tone === 'danger' ? styles.dangerButton : styles.primaryButton} onClick={onExecute} disabled={busy}>{busy ? <LoaderCircle className={styles.spin} size={17}/> : <Check size={17}/>} {copy.submit}</button></footer>
    </div>
  </CustomerOverlaySurface>
}

function ActionFields({ chamber, snapshot, onChange }: { chamber: ActionChamber; snapshot: CurriculumSnapshot; onChange: (key: string, value: string) => void }) {
  const action = chamber.actionKey
  const field = (key: string, label: string, type: 'text' | 'number' | 'date' | 'textarea' = 'text', placeholder = '') => <label className={styles.field} key={key}><span>{label}</span>{type === 'textarea' ? <textarea value={chamber.values[key] || ''} onChange={(event: { target: { value: string } }) => onChange(key, event.target.value)} placeholder={placeholder}/> : <input type={type} value={chamber.values[key] || ''} onChange={(event: { target: { value: string } }) => onChange(key, event.target.value)} placeholder={placeholder}/>}</label>
  const select = (key: string, label: string, options: Array<{ id: string; label: string }>) => <label className={styles.field} key={key}><span>{label}</span><select value={chamber.values[key] || ''} onChange={(event: { target: { value: string } }) => onChange(key, event.target.value)}><option value="">Choisir…</option>{options.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
  const fields: ReactNode[] = []
  if (action === 'subject.create' || action === 'subject.update') fields.push(field('code', 'Code'), field('name', 'Nom'), field('shortName', 'Nom court'), selectSimple('pedagogicalType', 'Type pédagogique', [['learning_domain','Domaine d’apprentissage'],['required_subject','Matière obligatoire'],['optional_subject','Matière optionnelle'],['activity','Activité pédagogique'],['specialised_programme','Programme spécialisé'],['language_programme','Programme linguistique']], chamber, onChange), field('description', 'Description', 'textarea'), field('languages', 'Langues', 'text', 'Français, Arabe'), field('applicableLevels', 'Niveaux concernés', 'text', 'Petite Section, Moyenne Section'), field('expectedWeeklyHours', 'Volume attendu par semaine', 'number'))
  else if (action === 'curriculum.create' || action === 'curriculum.update') fields.push(field('code', 'Code du programme'), field('name', 'Nom du programme'), field('description', 'Description', 'textarea'), select('academicYearId', 'Année scolaire', snapshot.directory.academicYears), select('institutionId', 'Établissement', snapshot.directory.institutions), select('siteId', 'Site — facultatif', snapshot.directory.sites), field('applicableLevels', 'Niveaux concernés', 'text', 'Petite Section, Moyenne Section'))
  else if (action === 'curriculum.copy_from_previous_year') fields.push(select('targetAcademicYearId', 'Année scolaire cible', snapshot.directory.academicYears), field('reason', 'Consignes de préparation', 'textarea'))
  else if (['curriculum.add_subject','curriculum.bind_level','curriculum.bind_class'].includes(action)) fields.push(select('subjectId', 'Matière ou domaine', snapshot.directory.subjects), select('curriculumId', 'Programme', snapshot.directory.curricula), field('classIds', 'Classes concernées', 'text', 'Identifiants séparés par des virgules'), field('levelLabels', 'Niveaux concernés', 'text'), field('expectedWeeklyHours', 'Volume attendu', 'number'), selectSimple('required', 'Caractère', [['true','Obligatoire'],['false','Optionnel']], chamber, onChange))
  else if (action === 'curriculum.preview') fields.push(field('subjectIds', 'Matières proposées', 'text', 'Identifiants séparés par des virgules'), field('effectiveAt', 'Date prévue', 'date'), field('reason', 'Motif de la simulation', 'textarea'))
  else if (action === 'subject.prepare_version') fields.push(field('versionLabel', 'Nom de la version'), field('effectiveFrom', 'Date de début', 'date'), field('effectiveTo', 'Date de fin — facultatif', 'date'), field('applicableLevels', 'Niveaux concernés'), field('expectedWeeklyHours', 'Volume attendu', 'number'), field('changeReason', 'Pourquoi cette nouvelle version ?', 'textarea'))
  else if (action === 'subject.publish_version') fields.push(field('versionId', 'Identifiant de la version'), field('effectiveAt', 'Date d’activation', 'date'), field('reason', 'Motif de l’activation', 'textarea'))
  else if (action.startsWith('learning_objective.')) fields.push(field('title', 'Objectif d’apprentissage'), field('description', 'Description', 'textarea'), field('observableResult', 'Résultat observable', 'textarea'), field('levelLabel', 'Niveau'), select('expectedPeriodId', 'Période attendue', snapshot.directory.periods), field('competencyCode', 'Code de compétence — facultatif'), field('sequenceOrder', 'Ordre', 'number'))
  else if (action.startsWith('evaluation_policy.')) fields.push(select('subjectId', 'Matière', snapshot.directory.subjects), select('curriculumId', 'Programme — facultatif', snapshot.directory.curricula), field('levelLabel', 'Niveau'), selectSimple('method', 'Méthode', [['continuous_observation','Observation continue'],['competency_scale','Compétences'],['numeric_grade','Note chiffrée'],['descriptive','Appréciation descriptive'],['portfolio','Portfolio'],['project','Projet'],['participation','Participation'],['none','Aucune évaluation formelle']], chamber, onChange), field('scaleCode', 'Échelle'), field('requiredPeriodIds', 'Périodes concernées'), field('reportCardMapping', 'Apparition dans les documents scolaires'), selectSimple('evidenceRequired', 'Justificatif requis', [['true','Oui'],['false','Non']], chamber, onChange))
  else if (action === 'curriculum_resource.link') fields.push(field('code', 'Code de la ressource'), field('name', 'Nom'), field('category', 'Catégorie'), field('language', 'Langue'), select('subjectId', 'Matière — facultatif', snapshot.directory.subjects), select('curriculumId', 'Programme — facultatif', snapshot.directory.curricula), field('applicableLevels', 'Niveaux concernés'), field('licenceCode', 'Licence — facultatif'), field('entitlementCode', 'Droit produit — facultatif'), field('effectiveFrom', 'Date de début', 'date'), field('effectiveTo', 'Date de fin — facultatif', 'date'))
  else if (action === 'curriculum_resource.request_access') fields.push(field('itemCode', 'Programme ou ressource'), field('exactCatalogueHref', 'Lien catalogue exact — prérempli si disponible'), field('reason', 'Pourquoi cet accès est-il nécessaire ?', 'textarea'))
  else if (action === 'curriculum_variation.create') fields.push(select('siteId', 'Site concerné', snapshot.directory.sites), field('title', 'Nom de la variation'), field('reason', 'Motif', 'textarea'), field('changes', 'Différences exactes', 'textarea'), field('effectiveFrom', 'Date de début', 'date'), field('effectiveTo', 'Date de fin — facultatif', 'date'))
  else if (action === 'curriculum_issue.assign' || action === 'curriculum_task.assign') fields.push(field('title', 'Titre'), field('description', 'Instructions', 'textarea'), select('ownerUserId', 'Responsable', snapshot.directory.staff), field('ownerLabel', 'Nom affiché'), field('dueAt', 'Échéance', 'date'), selectSimple('priority', 'Priorité', [['normal','Normale'],['high','Haute'],['critical','Critique']], chamber, onChange))
  else if (action === 'curriculum_note.add') fields.push(field('body', 'Note interne', 'textarea'), selectSimple('important', 'Marquer comme importante', [['false','Non'],['true','Oui']], chamber, onChange))
  else if (action === 'curriculum_evidence.request') fields.push(field('title', 'Justificatif demandé'), field('description', 'Précisions', 'textarea'), select('ownerUserId', 'Responsable', snapshot.directory.staff), field('ownerLabel', 'Nom affiché'), field('dueAt', 'Échéance', 'date'))
  else fields.push(field('reason', 'Motif ou justification', 'textarea'), field('effectiveAt', 'Date d’effet', 'date'))
  return <div className={styles.formGrid}>{fields}</div>
}

function selectSimple(key: string, label: string, options: Array<[string,string]>, chamber: ActionChamber, onChange: (key: string, value: string) => void) { return <label className={styles.field} key={key}><span>{label}</span><select value={chamber.values[key] || ''} onChange={(event: { target: { value: string } }) => onChange(key, event.target.value)}>{options.map(([value, textValue]) => <option key={value} value={value}>{textValue}</option>)}</select></label> }

function normalizeValues(values: Record<string, string>): Record<string, unknown> {
  const arrayKeys = new Set(['languages','applicableLevels','classIds','levelLabels','subjectIds','requiredPeriodIds','resourceIds'])
  const booleanKeys = new Set(['requiredByDefault','required','evidenceRequired','important'])
  const numberKeys = new Set(['expectedWeeklyHours','sequenceOrder'])
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, arrayKeys.has(key) ? value.split(',').map((item) => item.trim()).filter(Boolean) : booleanKeys.has(key) ? value === 'true' : numberKeys.has(key) && value !== '' ? Number(value) : key === 'changes' ? parseJsonOrText(value) : value]))
}
function parseJsonOrText(value: string) { try { return JSON.parse(value) as unknown } catch { return { description: value } } }

function CoverageRows({ bindings, openDossier, openAction }: { bindings: CurriculumBinding[] } & Pick<ViewProps, 'openDossier' | 'openAction'>) {
  return bindings.length ? <div className={styles.coverageRows}>{bindings.map((binding) => <article key={binding.id} data-tone={binding.tone}><button type="button" onClick={() => openDossier('subject', binding.subjectId)}><div><strong>{binding.classLabel}</strong><small>{binding.levelLabel || 'Niveau à préciser'}</small></div><div><strong>{binding.coverageLabel}</strong><small>{binding.teacherLabels[0] || 'Enseignant à affecter'}</small></div><ChevronRight size={16}/></button><div className={styles.rowActions}>{binding.exactClassHref ? <Link href={binding.exactClassHref}>Ouvrir la classe</Link> : null}<button type="button" onClick={() => binding.coverageState === 'evaluation_missing' ? openAction('evaluation_policy.create', { subjectId: binding.subjectId, curriculumId: binding.curriculumId }) : openAction('curriculum_issue.assign', { subjectId: binding.subjectId, curriculumId: binding.curriculumId, bindingId: binding.id })}>{binding.coverageState === 'complete' ? 'Vérifier' : 'Traiter'}</button></div></article>)}</div> : <SchoolAdminEmptyState title="Aucun rattachement" detail="Les matières liées aux classes apparaîtront ici."/>
}

function ProductAccessPanel({ snapshot, openAction }: Pick<ViewProps, 'snapshot' | 'openAction'>) {
  if (!snapshot.productAccess.availableOffers.length) return null
  return <section className={styles.productPanel}><PanelTitle icon={ShieldCheck} title="Programmes et ressources de votre formule" subtitle={snapshot.productAccess.packageVersionName || 'Formule actuelle'}/><div className={styles.productGrid}>{snapshot.productAccess.availableOffers.map((offer) => <article key={offer.code} data-state={offer.state}><div><strong>{offer.label}</strong><small>{offer.state === 'included' ? 'Inclus dans votre formule' : offer.state === 'activated' ? 'Activé' : offer.state === 'trial' ? 'Accès temporaire' : offer.state === 'expired' ? 'Accès expiré' : offer.state === 'available' ? 'Disponible pour activation' : 'Non disponible'}</small></div>{offer.state === 'available' || offer.state === 'expired' ? <button type="button" onClick={() => openAction('curriculum_resource.request_access', { values: { ...actionDefaults('curriculum_resource.request_access').values, itemCode: offer.code, exactCatalogueHref: offer.exactCatalogueHref || '' } })}>Demander l’activation</button> : <BadgeCheck size={18}/>}</article>)}</div></section>
}

function AttentionCard({ item, onOpen, onAction }: { item: CurriculumAttentionItem; onOpen: () => void; onAction: () => void }) {
  return <article className={styles.attentionCard} data-tone={item.tone}><button type="button" className={styles.attentionMain} onClick={onOpen}><span className={styles.attentionSignal}/><div><strong>{item.title}</strong><p>{item.explanation}</p>{item.consequence ? <small>Conséquence : {item.consequence}</small> : null}</div><ChevronRight size={17}/></button><footer><span>{item.ownerLabel || 'Responsable à définir'}{item.dueAt ? ` · avant le ${formatDate(item.dueAt)}` : ''}</span>{item.recommendedActionKey ? <button type="button" onClick={onAction}>{item.recommendedActionLabel || 'Traiter'}</button> : null}</footer></article>
}

function PanelTitle({ icon: Icon, title, subtitle, action }: { icon: LucideIcon; title: string; subtitle: string; action?: ReactNode }) { return <header className={styles.panelTitle}><span><Icon size={18}/></span><div><h2>{title}</h2><p>{subtitle}</p></div>{action ? <div>{action}</div> : null}</header> }
function Fact({ label, value }: { label: string; value: string }) { return <span className={styles.fact}><small>{label}</small><strong>{value}</strong></span> }
function StatusPill({ tone, label }: { tone: CurriculumTone; label: string }) { return <span className={styles.statusPill} data-tone={tone}>{label}</span> }
function DossierSection({ title, children }: { title: string; children: ReactNode }) { return <section className={styles.dossierSection}><h3>{title}</h3>{children}</section> }
function DetailGrid({ items }: { items: Array<[string,string]> }) { return <div className={styles.detailGrid}>{items.map(([label,value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div> }
function HistoryRows({ events }: { events: CurriculumSnapshot['history'] }) { return events.length ? <div className={styles.historyList}>{events.map((event) => <article key={event.id} className={styles.historyStatic}><span data-tone={event.tone}/><div><strong>{event.label}</strong><small>{event.detail || 'Modification enregistrée'}</small></div><em>{event.actorLabel || 'Système'} · {formatDate(event.createdAt)}</em></article>)}</div> : <SchoolAdminEmptyState title="Aucun historique" detail="Les changements importants apparaîtront ici."/> }
function SimulationPanel({ simulation }: { simulation: Record<string, unknown> }) { return <section className={styles.simulationPanel}><div className={styles.panelHeading}><div><span className={styles.eyebrow}>Simulation sans modification</span><h3>Impact pédagogique prévu</h3></div><FileCheck2 size={20}/></div><pre>{JSON.stringify(simulation, null, 2)}</pre></section> }

function impactItems(chamber: ActionChamber, snapshot: CurriculumSnapshot) {
  const copy = ACTION_COPY[chamber.actionKey]
  const items = [copy.description]
  if (chamber.subjectId) items.push(`Matière concernée : ${snapshot.subjects.find((item) => item.id === chamber.subjectId)?.name || 'dossier sélectionné'}`)
  if (chamber.curriculumId) items.push(`Programme concerné : ${snapshot.curricula.find((item) => item.id === chamber.curriculumId)?.name || 'dossier sélectionné'}`)
  if (/activate|publish|replace/.test(chamber.actionKey)) items.push('Les classes et versions concernées seront recalculées après confirmation du serveur.')
  if (/retire|archive|unlink/.test(chamber.actionKey)) items.push('L’historique pédagogique restera disponible.')
  if (chamber.actionKey === 'curriculum_resource.request_access') items.push('Aucun droit ne sera activé avant confirmation par le catalogue Produit officiel.')
  return items
}

function dossierContext(dossier: SelectedDossier, record: CurriculumSubjectRecord | CurriculumFrameworkRecord | EvaluationPolicyRecord | CurriculumResourceRecord | CurriculumAttentionItem): Partial<ActionChamber> {
  if (dossier.kind === 'subject') return { subjectId: (record as CurriculumSubjectRecord).id }
  if (dossier.kind === 'curriculum') return { curriculumId: (record as CurriculumFrameworkRecord).id }
  if (dossier.kind === 'evaluation_policy') { const item = record as EvaluationPolicyRecord; return { evaluationPolicyId: item.id, subjectId: item.subjectId, curriculumId: item.curriculumId } }
  if (dossier.kind === 'resource') { const item = record as CurriculumResourceRecord; return { resourceId: item.id, subjectId: item.subjectId, curriculumId: item.curriculumId } }
  return issueContext(record as CurriculumAttentionItem)
}
function issueContext(item: CurriculumAttentionItem): Partial<ActionChamber> { return { issueId: item.id, subjectId: item.sourceType === 'subject' ? item.sourceId : null, curriculumId: item.sourceType === 'curriculum' ? item.sourceId : null, values: { ...actionDefaults(item.recommendedActionKey || 'curriculum_issue.assign').values, title: item.title, explanation: item.explanation, consequence: item.consequence || '', severity: item.severity, sourceType: item.sourceType, sourceId: item.sourceId, ownerLabel: item.ownerLabel || '', dueAt: item.dueAt || '', recommendedActionKey: item.recommendedActionKey || '', recommendedActionLabel: item.recommendedActionLabel || '' } } }
function dossierSummary(kind: CurriculumDossierKind, record: CurriculumSubjectRecord | CurriculumFrameworkRecord | EvaluationPolicyRecord | CurriculumResourceRecord | CurriculumAttentionItem) {
  if (kind === 'subject') { const item = record as CurriculumSubjectRecord; return `${item.pedagogicalTypeLabel} · ${item.linkedClasses} classe(s) · ${item.coverageLabel}` }
  if (kind === 'curriculum') { const item = record as CurriculumFrameworkRecord; return `${item.academicYearLabel || 'Année à préciser'} · ${item.subjectIds.length} matière(s) · ${item.coverageLabel}` }
  if (kind === 'evaluation_policy') { const item = record as EvaluationPolicyRecord; return `${item.methodLabel} · ${item.classCount} classe(s)` }
  if (kind === 'resource') { const item = record as CurriculumResourceRecord; return `${item.category} · ${item.stateLabel}` }
  return (record as CurriculumAttentionItem).explanation
}
function kindLabel(kind: CurriculumDossierKind) { return kind === 'subject' ? 'Matière ou domaine' : kind === 'curriculum' ? 'Programme pédagogique' : kind === 'evaluation_policy' ? 'Méthode d’évaluation' : kind === 'resource' ? 'Ressource pédagogique' : 'Point à traiter' }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date) }

type ViewProps = { snapshot: CurriculumSnapshot; openDossier: (kind: CurriculumDossierKind, id: string, tab?: CurriculumDossierTab, mode?: SelectedDossier['mode']) => void; openAction: (actionKey: CurriculumActionKey, context?: Partial<ActionChamber>) => void }

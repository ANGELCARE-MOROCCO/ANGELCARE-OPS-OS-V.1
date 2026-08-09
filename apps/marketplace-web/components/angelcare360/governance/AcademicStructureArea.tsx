'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleGauge,
  Clock3,
  FileClock,
  FileSearch,
  GraduationCap,
  History,
  Layers3,
  ListChecks,
  LoaderCircle,
  LockKeyhole,
  Network,
  PanelRightOpen,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
  UsersRound,
  WandSparkles,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import CustomerOverlaySurface from '@/components/angelcare360/customer-experience/CustomerOverlaySurface'
import CustomerOverlayPortal from '@/components/angelcare360/customer-experience/CustomerOverlayPortal'
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
  SchoolAdminSituationSummary,
} from '@/components/angelcare360/customer-experience/SchoolAdminWorkbench'
import type {
  AcademicAttentionItem,
  AcademicDossierKind,
  AcademicDossierTab,
  AcademicHumanStatus,
  AcademicPeriodRecord,
  AcademicStructureActionKey,
  AcademicStructureActionRequest,
  AcademicStructureActionResult,
  AcademicStructureSnapshot,
  AcademicStructureView,
  AcademicTone,
  AcademicTransitionDecision,
  AcademicTransitionItem,
  AcademicTransitionRun,
  AcademicYearRecord,
} from '@/types/angelcare360/academic-structure-area'
import styles from './AcademicStructureArea.module.css'

type Props = {
  initialSnapshot: AcademicStructureSnapshot
  initialView: AcademicStructureView
  initialEntityId: string | null
  initialEntityKind: AcademicDossierKind | null
  initialTab: AcademicDossierTab | null
}

type Toast = { kind: 'success' | 'warning' | 'error'; message: string } | null

type SelectedDossier =
  | { kind: 'academic_year'; record: AcademicYearRecord }
  | { kind: 'period'; record: AcademicPeriodRecord; year: AcademicYearRecord }
  | { kind: 'transition'; record: AcademicTransitionRun; year: AcademicYearRecord }

type ActionOpener = (
  actionKey: AcademicStructureActionKey,
  year?: AcademicYearRecord | null,
  period?: AcademicPeriodRecord | null,
  transition?: AcademicTransitionRun | null,
  item?: AcademicTransitionItem | null,
) => void

type ActionState = {
  actionKey: AcademicStructureActionKey
  academicYearId: string | null
  periodId: string | null
  transitionRunId: string | null
  transitionItemId: string | null
  title: string
  description: string
  values: Record<string, string | boolean>
}

const VIEWS: Array<{ key: AcademicStructureView; label: string; icon: typeof CalendarDays }> = [
  { key: 'today', label: 'Aujourd’hui', icon: CircleGauge },
  { key: 'years', label: 'Années scolaires', icon: Layers3 },
  { key: 'periods', label: 'Périodes', icon: CalendarRange },
  { key: 'calendar', label: 'Calendrier', icon: CalendarDays },
  { key: 'preparation', label: 'Préparation', icon: ListChecks },
  { key: 'closure', label: 'Clôture', icon: LockKeyhole },
  { key: 'next-year', label: 'Année suivante', icon: GraduationCap },
  { key: 'attention', label: 'À régler', icon: AlertTriangle },
  { key: 'history', label: 'Historique', icon: History },
]

const TABS: Array<{ key: AcademicDossierTab; label: string }> = [
  { key: 'todo', label: 'À faire' },
  { key: 'information', label: 'Informations' },
  { key: 'periods-calendar', label: 'Périodes & calendrier' },
  { key: 'organisation', label: 'Organisation' },
  { key: 'closure', label: 'Clôture' },
  { key: 'next-year', label: 'Année suivante' },
  { key: 'history', label: 'Historique' },
]

const STATUS_LABELS: Record<AcademicHumanStatus, string> = {
  draft: 'Brouillon',
  to_verify: 'À vérifier',
  ready: 'Prête à utiliser',
  active: 'Active',
  closing: 'À clôturer',
  closed: 'Clôturée',
  reopened: 'Réouverte',
  archived: 'Archivée',
}

const ACTION_COPY: Partial<Record<AcademicStructureActionKey, { title: string; description: string }>> = {
  'academic_year.create': { title: 'Créer une année scolaire', description: 'Définissez les dates et le nom qui serviront de référence aux classes, présences et activités.' },
  'academic_year.update': { title: 'Mettre à jour l’année scolaire', description: 'Corrigez les informations essentielles et vérifiez l’effet sur le calendrier.' },
  'academic_year.prepare': { title: 'Vérifier la préparation', description: 'Contrôlez les éléments nécessaires avant de rendre l’année active.' },
  'academic_year.request_activation': { title: 'Demander la validation de la direction', description: 'Transmettez le dossier prêt à la personne autorisée à rendre l’année active.' },
  'academic_year.activate': { title: 'Rendre l’année scolaire active', description: 'Cette année deviendra la référence pour les classes, présences et activités.' },
  'academic_year.begin_closure': { title: 'Préparer la clôture de l’année', description: 'Vérifiez les périodes, les dossiers scolaires et le passage des enfants.' },
  'academic_year.request_closure': { title: 'Demander la validation de la clôture', description: 'Transmettez la clôture préparée à la direction.' },
  'academic_year.request_reopen': { title: 'Demander la réouverture de l’année', description: 'Expliquez la correction nécessaire et transmettez la demande à la direction.' },
  'academic_year.close': { title: 'Clôturer l’année scolaire', description: 'Figez cette année tout en conservant son historique complet.' },
  'academic_year.reopen': { title: 'Réouvrir l’année scolaire', description: 'Rendez de nouveau possibles les corrections autorisées sans effacer la clôture précédente.' },
  'academic_year.archive': { title: 'Archiver l’année scolaire', description: 'Retirez cette année des listes actives tout en conservant son historique complet.' },
  'academic_period.create': { title: 'Ajouter une période', description: 'Ajoutez un trimestre, semestre ou autre période au calendrier scolaire.' },
  'academic_period.update': { title: 'Corriger les dates de la période', description: 'Vérifiez les nouvelles dates et leur effet sur le reste du calendrier.' },
  'academic_period.reorder': { title: 'Réorganiser les périodes', description: 'Modifiez leur ordre puis vérifiez la cohérence du calendrier.' },
  'academic_period.verify_calendar': { title: 'Vérifier le calendrier', description: 'Détectez les chevauchements, les intervalles et les dates hors de l’année.' },
  'academic_period.activate': { title: 'Rendre la période active', description: 'La période devient disponible pour les opérations scolaires autorisées.' },
  'academic_period.begin_closure': { title: 'Préparer la clôture de la période', description: 'Vérifiez les présences, évaluations et documents scolaires associés.' },
  'academic_period.request_closure': { title: 'Demander la validation de la clôture', description: 'Transmettez la période vérifiée à la direction pour clôture.' },
  'academic_period.close': { title: 'Clôturer la période', description: 'Verrouillez la période et préservez son état historique.' },
  'academic_period.reopen': { title: 'Réouvrir la période', description: 'Autorisez des corrections ciblées avec un motif et une date de re-clôture.' },
  'academic_period.request_reopen': { title: 'Demander la réouverture de la période', description: 'Expliquez la correction attendue et transmettez la demande à la direction.' },
  'academic_period.replace': { title: 'Remplacer cette période', description: 'Préparez une nouvelle version sans effacer la période historique.' },
  'academic_transition.prepare_target': { title: 'Préparer l’année suivante', description: 'Choisissez l’année cible avant de générer les propositions de passage des enfants.' },
  'academic_transition.copy_structure': { title: 'Reprendre la structure utile', description: 'Copiez les classes utiles sans recopier les inscriptions ni les données historiques.' },
  'academic_transition.generate_proposals': { title: 'Préparer les propositions de passage', description: 'SANILA propose une destination explicable pour chaque enfant.' },
  'academic_transition.update_decision': { title: 'Modifier la destination de l’enfant', description: 'Choisissez une décision et une classe cible avec une justification claire.' },
  'academic_transition.bulk_approve': { title: 'Valider les propositions sans conflit', description: 'Approuvez uniquement les propositions complètes et sans problème de capacité.' },
  'academic_transition.request_approval': { title: 'Demander la validation du passage', description: 'Transmettez la synthèse finale à la direction avant l’exécution.' },
  'academic_transition.execute': { title: 'Effectuer le passage à l’année suivante', description: 'Créez les nouvelles inscriptions sans supprimer l’historique de l’année précédente.' },
  'academic_transition.retry_item': { title: 'Réessayer les dossiers corrigés', description: 'Reprenez uniquement les enfants dont le passage a échoué.' },
  'academic_transition.verify': { title: 'Vérifier le passage', description: 'Confirmez que chaque enfant dispose d’un résultat explicite et cohérent.' },
  'academic_transition.complete': { title: 'Terminer le passage à l’année suivante', description: 'Clôturez le passage après vérification de tous les résultats.' },
  'academic_exception.assign': { title: 'Attribuer l’élément à vérifier', description: 'Confiez cette vérification à la bonne personne avec une échéance.' },
  'academic_exception.resolve': { title: 'Marquer l’élément comme réglé', description: 'Confirmez que le problème a réellement été corrigé.' },
  'academic_exception.reopen': { title: 'Réouvrir l’élément à vérifier', description: 'Remettez cet élément dans la liste active avec une explication.' },
  'academic_task.assign': { title: 'Attribuer une tâche', description: 'Confiez un élément précis à un membre de l’équipe avec une échéance.' },
  'academic_task.start': { title: 'Commencer la tâche', description: 'Indiquez que cette tâche est maintenant prise en charge.' },
  'academic_task.complete': { title: 'Terminer la tâche', description: 'Confirmez le résultat obtenu et conservez la trace de la réalisation.' },
  'academic_task.reopen': { title: 'Réouvrir la tâche', description: 'Remettez la tâche en cours lorsqu’une correction supplémentaire est nécessaire.' },
  'academic_note.add': { title: 'Ajouter une note interne', description: 'Conservez une information utile dans le dossier de l’année scolaire.' },
  'academic_evidence.request': { title: 'Demander un justificatif', description: 'Précisez le document ou la preuve nécessaire et la personne responsable.' },
}

const DECISION_LABELS: Record<AcademicTransitionDecision, string> = {
  promote: 'Passer au niveau suivant',
  repeat: 'Rester dans le même niveau',
  change_class: 'Changer de classe',
  change_section: 'Changer de section',
  change_institution: 'Changer d’établissement',
  suspend: 'Suspendre temporairement',
  withdraw: 'Quitter l’établissement',
  graduate: 'Terminer le cycle',
  reenroll: 'Réinscrire',
  undecided: 'À décider',
}

function adminTone(tone: AcademicTone): 'neutral' | 'info' | 'success' | 'warning' | 'critical' | 'approval' {
  if (tone === 'verified') return 'success'
  if (tone === 'critical') return 'critical'
  if (tone === 'warning') return 'warning'
  if (tone === 'decision') return 'approval'
  if (tone === 'active') return 'info'
  return 'neutral'
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Non renseignée'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(parsed)
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Non renseignée'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(parsed)
}

function newAction(actionKey: AcademicStructureActionKey, year?: AcademicYearRecord | null, period?: AcademicPeriodRecord | null, transition?: AcademicTransitionRun | null, item?: AcademicTransitionItem | null): ActionState {
  const copy = ACTION_COPY[actionKey] || { title: 'Mettre à jour le dossier', description: 'Complétez les informations puis vérifiez ce qui va changer.' }
  const today = new Date().toISOString().slice(0, 10)
  return {
    actionKey,
    academicYearId: year?.id || period?.academicYearId || transition?.sourceAcademicYearId || null,
    periodId: period?.id || null,
    transitionRunId: transition?.id || item?.runId || null,
    transitionItemId: item?.id || null,
    title: copy.title,
    description: copy.description,
    values: {
      yearCode: year?.code || '',
      label: year?.label || period?.label || '',
      startsOn: year?.startsOn || period?.startsOn || today,
      endsOn: year?.endsOn || period?.endsOn || today,
      termCode: period?.code || '',
      orderIndex: period ? String(period.orderIndex) : '1',
      termType: period?.termType || 'trimestre',
      effectiveAt: today,
      reason: '',
      targetAcademicYearId: transition?.targetAcademicYearId || year?.successorYearId || '',
      targetClassId: item?.targetClassId || '',
      targetSectionId: item?.targetSectionId || '',
      decision: item?.finalDecision || 'undecided',
      title: '',
      description: '',
      ownerUserId: '',
      ownerLabel: '',
      dueAt: '',
      priority: 'normal',
      body: '',
      important: false,
    },
  }
}

export default function AcademicStructureArea({ initialSnapshot, initialView, initialEntityId, initialEntityKind, initialTab }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [view, setView] = useState<AcademicStructureView>(VIEWS.some((item) => item.key === initialView) ? initialView : 'today')
  const [selected, setSelected] = useState<SelectedDossier | null>(null)
  const [tab, setTab] = useState<AcademicDossierTab>(initialTab || 'todo')
  const [action, setAction] = useState<ActionState | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<Toast>(null)
  const [search, setSearch] = useState('')
  const [transitionFilter, setTransitionFilter] = useState<'all' | 'decision' | 'capacity' | 'failed' | 'ready'>('all')

  useEffect(() => {
    if (!initialEntityId || !initialEntityKind) return
    if (initialEntityKind === 'academic_year') {
      const record = initialSnapshot.years.find((item) => item.id === initialEntityId)
      if (record) setSelected({ kind: 'academic_year', record })
    } else if (initialEntityKind === 'period') {
      for (const year of initialSnapshot.years) {
        const record = year.periods.find((item) => item.id === initialEntityId)
        if (record) { setSelected({ kind: 'period', record, year }); break }
      }
    } else {
      const record = initialSnapshot.transitionRuns.find((item) => item.id === initialEntityId)
      const year = initialSnapshot.years.find((item) => item.id === record?.sourceAcademicYearId)
      if (record && year) setSelected({ kind: 'transition', record, year })
    }
  }, [initialEntityId, initialEntityKind, initialSnapshot])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const currentYear = snapshot.currentYear || snapshot.years[0] || null
  const activeAttention = useMemo(() => snapshot.attention.filter((item) => !search || `${item.title} ${item.explanation}`.toLowerCase().includes(search.toLowerCase())), [search, snapshot.attention])

  function updateUrl(next: { view?: AcademicStructureView; entity?: string | null; kind?: AcademicDossierKind | null; tab?: AcademicDossierTab | null }) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('plane', 'academic-structure')
    if (next.view) params.set('view', next.view)
    if (next.entity && next.kind) {
      params.set('entity', next.entity)
      params.set('type', next.kind)
      params.set('drawer', 'dossier')
    } else if (next.entity === null) {
      params.delete('entity'); params.delete('type'); params.delete('drawer'); params.delete('tab')
    }
    if (next.tab) params.set('tab', next.tab)
    else if (next.tab === null) params.delete('tab')
    router.replace(`/angelcare-360-command-center/administration?${params.toString()}`, { scroll: false })
  }

  function chooseView(next: AcademicStructureView) {
    setView(next)
    updateUrl({ view: next })
  }

  function openYear(year: AcademicYearRecord, nextTab: AcademicDossierTab = 'todo') {
    setSelected({ kind: 'academic_year', record: year })
    setTab(nextTab)
    updateUrl({ entity: year.id, kind: 'academic_year', tab: nextTab })
  }

  function openPeriod(period: AcademicPeriodRecord, year: AcademicYearRecord, nextTab: AcademicDossierTab = 'information') {
    setSelected({ kind: 'period', record: period, year })
    setTab(nextTab)
    updateUrl({ entity: period.id, kind: 'period', tab: nextTab })
  }

  function openTransition(run: AcademicTransitionRun, year: AcademicYearRecord) {
    setSelected({ kind: 'transition', record: run, year })
    setTab('next-year')
    updateUrl({ entity: run.id, kind: 'transition', tab: 'next-year' })
  }

  function closeDossier() {
    setSelected(null)
    updateUrl({ entity: null, kind: null, tab: null })
  }

  async function refreshSnapshot(silent = false) {
    if (!silent) setBusy(true)
    try {
      const response = await fetch('/api/angelcare360/academic-structure', { cache: 'no-store' })
      const body = await response.json() as { ok: boolean; snapshot?: AcademicStructureSnapshot; message?: string }
      if (!response.ok || !body.ok || !body.snapshot) throw new Error(body.message || 'Les informations ne peuvent pas être actualisées.')
      setSnapshot(body.snapshot)
      if (selected) {
        if (selected.kind === 'academic_year') {
          const record = body.snapshot.years.find((item) => item.id === selected.record.id)
          if (record) setSelected({ kind: 'academic_year', record })
        } else if (selected.kind === 'period') {
          const year = body.snapshot.years.find((item) => item.id === selected.year.id)
          const record = year?.periods.find((item) => item.id === selected.record.id)
          if (year && record) setSelected({ kind: 'period', record, year })
        } else {
          const record = body.snapshot.transitionRuns.find((item) => item.id === selected.record.id)
          const year = body.snapshot.years.find((item) => item.id === record?.sourceAcademicYearId)
          if (record && year) setSelected({ kind: 'transition', record, year })
        }
      }
      if (!silent) setToast({ kind: 'success', message: 'Les informations ont été actualisées.' })
    } catch (error) {
      setToast({ kind: 'error', message: error instanceof Error ? error.message : 'Actualisation impossible.' })
    } finally {
      if (!silent) setBusy(false)
    }
  }

  async function executeAction() {
    if (!action) return
    setBusy(true)
    try {
      const request: AcademicStructureActionRequest = {
        actionKey: action.actionKey,
        academicYearId: action.academicYearId,
        periodId: action.periodId,
        transitionRunId: action.transitionRunId,
        transitionItemId: action.transitionItemId,
        reason: String(action.values.reason || '') || null,
        effectiveAt: String(action.values.effectiveAt || '') || null,
        idempotencyKey: `${action.actionKey}:${action.academicYearId || ''}:${action.periodId || ''}:${action.transitionRunId || ''}:${action.transitionItemId || ''}:${Date.now()}`,
        payload: action.values,
      }
      const response = await fetch('/api/angelcare360/academic-structure', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request) })
      const result = await response.json() as AcademicStructureActionResult
      if (!response.ok || !result.ok) throw new Error(result.message || 'Cette action n’a pas pu être terminée.')
      if (result.state === 'blocked') {
        setToast({ kind: 'warning', message: [result.message, ...(result.blockers || [])].join(' ') })
        return
      }
      setToast({ kind: result.state === 'partially_failed' ? 'warning' : 'success', message: result.message })
      setAction(null)
      await refreshSnapshot(true)
    } catch (error) {
      setToast({ kind: 'error', message: error instanceof Error ? error.message : 'Cette action n’a pas pu être terminée.' })
    } finally {
      setBusy(false)
    }
  }

  function act(actionKey: AcademicStructureActionKey, year?: AcademicYearRecord | null, period?: AcademicPeriodRecord | null, transition?: AcademicTransitionRun | null, item?: AcademicTransitionItem | null) {
    let effectiveAction = actionKey
    if (actionKey === 'academic_year.activate' && !snapshot.viewer.canActivate) effectiveAction = 'academic_year.request_activation'
    if (actionKey === 'academic_year.close' && !snapshot.viewer.canClose) effectiveAction = 'academic_year.request_closure'
    if (actionKey === 'academic_year.reopen' && !snapshot.viewer.canReopen) effectiveAction = 'academic_year.request_reopen'
    if (actionKey === 'academic_period.close' && !snapshot.viewer.canClose) effectiveAction = 'academic_period.request_closure'
    if (actionKey === 'academic_period.reopen' && !snapshot.viewer.canReopen) effectiveAction = 'academic_period.request_reopen'
    if (['academic_transition.execute', 'academic_transition.complete'].includes(actionKey) && !snapshot.viewer.canExecuteTransition) effectiveAction = 'academic_transition.request_approval'
    setAction(newAction(effectiveAction, year, period, transition, item))
  }

  return <div className={styles.area} data-mode={snapshot.mode}>
    <section className={styles.crown}>
      <div className={styles.crownIdentity}>
        <span className={styles.crownIcon}><CalendarRange size={25} /></span>
        <div><span className={styles.eyebrow}>SANILA · Administration scolaire</span><h1>{snapshot.title}</h1><p>{snapshot.subtitle}</p></div>
      </div>
      <div className={styles.crownContext}>
        <div><span>Établissement</span><strong>{snapshot.school.name}</strong></div>
        <div><span>Année active</span><strong>{currentYear?.label || 'À créer'}</strong></div>
        <div><span>Période actuelle</span><strong>{currentYear?.currentPeriodLabel || 'À définir'}</strong></div>
        <button type="button" onClick={() => refreshSnapshot()} disabled={busy}>{busy ? <LoaderCircle className={styles.spin} size={17} /> : <RefreshCw size={17} />} Actualiser</button>
      </div>
      <div className={styles.crownActions}>
        <button type="button" onClick={() => act('academic_year.create')}><Plus size={17} />Créer une année scolaire</button>
        {currentYear ? <button type="button" className={styles.primaryButton} onClick={() => currentYear.nextActionKey && act(currentYear.nextActionKey, currentYear)} disabled={!currentYear.nextActionKey}><Sparkles size={17} />{currentYear.nextActionLabel}</button> : null}
      </div>
    </section>

    <section className={styles.metrics}>
      {snapshot.metrics.map((metric) => <button type="button" key={metric.key} data-tone={metric.tone} onClick={() => chooseView(metric.view)}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small><ChevronRight size={17} /></button>)}
    </section>

    <nav className={styles.viewNav} aria-label="Espaces Année scolaire et calendrier">
      {VIEWS.map((item) => { const Icon = item.icon; return <button type="button" key={item.key} data-active={view === item.key} onClick={() => chooseView(item.key)}><Icon size={16} />{item.label}</button> })}
    </nav>

    <section className={styles.toolbar}>
      <label><Search size={16} /><input value={search} onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)} placeholder="Trouver une année, une période ou un élément à régler…" /></label>
      <div><span>{snapshot.years.length} année(s)</span><span>{snapshot.years.reduce((sum, year) => sum + year.periodCount, 0)} période(s)</span><span>{snapshot.attention.length} élément(s) à régler</span></div>
    </section>

    <main className={styles.canvas}>
      {view === 'today' ? <TodayView snapshot={snapshot} currentYear={currentYear} onView={chooseView} onOpenYear={openYear} onOpenPeriod={openPeriod} onAction={act} /> : null}
      {view === 'years' ? <YearsView years={snapshot.years} search={search} onOpen={openYear} onCreate={() => act('academic_year.create')} /> : null}
      {view === 'periods' ? <PeriodsView years={snapshot.years} search={search} onOpen={openPeriod} onAction={act} /> : null}
      {view === 'calendar' ? <CalendarView years={snapshot.years} findings={snapshot.calendarFindings} onOpen={openPeriod} onAction={act} /> : null}
      {view === 'preparation' ? <PreparationView year={currentYear} onAction={act} onOpen={openYear} /> : null}
      {view === 'closure' ? <ClosureView year={currentYear} onAction={act} onOpenPeriod={openPeriod} /> : null}
      {view === 'next-year' ? <NextYearView year={currentYear} snapshot={snapshot} filter={transitionFilter} onFilter={setTransitionFilter} onAction={act} onOpenTransition={openTransition} /> : null}
      {view === 'attention' ? <AttentionView items={activeAttention} snapshot={snapshot} onAction={act} onOpenYear={openYear} onOpenPeriod={openPeriod} /> : null}
      {view === 'history' ? <HistoryView events={snapshot.history} /> : null}
    </main>

    {selected ? <Dossier selected={selected} tab={tab} snapshot={snapshot} onTab={(next) => { setTab(next); updateUrl({ tab: next }) }} onClose={closeDossier} onAction={act} onOpenYear={openYear} onOpenPeriod={openPeriod} /> : null}
    {action ? <ActionChamber action={action} setAction={setAction} snapshot={snapshot} busy={busy} onClose={() => setAction(null)} onExecute={executeAction} /> : null}
    {toast ? <CustomerOverlayPortal><div className={styles.toast} data-kind={toast.kind} role="status" aria-live="polite">{toast.kind === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}<span>{toast.message}</span></div></CustomerOverlayPortal> : null}
  </div>
}

function TodayView({ snapshot, currentYear, onView, onOpenYear, onOpenPeriod, onAction }: { snapshot: AcademicStructureSnapshot; currentYear: AcademicYearRecord | null; onView: (view: AcademicStructureView) => void; onOpenYear: (year: AcademicYearRecord, tab?: AcademicDossierTab) => void; onOpenPeriod: (period: AcademicPeriodRecord, year: AcademicYearRecord, tab?: AcademicDossierTab) => void; onAction: ActionOpener }) {
  if (!currentYear) return <SchoolAdminEmptyState title="Aucune année scolaire n’a encore été créée" detail="Créez l’année qui servira de référence aux classes, présences et activités." actionLabel="Créer la première année scolaire" onAction={() => onAction('academic_year.create')} />
  const currentPeriod = currentYear.periods.find((item) => item.id === currentYear.currentPeriodId) || null
  return <div className={styles.todayGrid}>
    <section className={styles.yearHero} data-tone={currentYear.tone}>
      <div><span>Année scolaire actuelle</span><h2>{currentYear.label}</h2><p>{currentYear.status === 'active' ? currentPeriod ? `${currentPeriod.label} est en cours${currentPeriod.daysRemaining !== null ? ` et se termine dans ${currentPeriod.daysRemaining} jour(s)` : ''}.` : 'L’année est active. Définissez la période actuelle.' : `${currentYear.blockersCount} élément(s) doivent encore être réglés avant la mise en service.`}</p></div>
      <div className={styles.heroFacts}><span><CalendarDays size={16} />{formatDate(currentYear.startsOn)} → {formatDate(currentYear.endsOn)}</span><span><UsersRound size={16} />{currentYear.childrenCount} enfant(s)</span><span><BookOpenCheck size={16} />{currentYear.classCount} classe(s)</span></div>
      <button type="button" onClick={() => onOpenYear(currentYear)}><PanelRightOpen size={17} />Ouvrir le dossier</button>
    </section>
    <SchoolAdminNextAction config={{ title: currentYear.nextActionLabel, detail: currentYear.blockersCount ? `${currentYear.blockersCount} élément(s) bloquent encore la prochaine étape.` : 'Le dossier est suffisamment préparé pour avancer.', label: currentYear.nextActionLabel, tone: currentYear.blockersCount ? 'warning' : 'approval', disabled: !currentYear.nextActionKey, disabledReason: !currentYear.nextActionKey ? 'Aucune action immédiate n’est nécessaire.' : undefined, onAction: () => currentYear.nextActionKey && onAction(currentYear.nextActionKey, currentYear) }} />
    <section className={styles.attentionPanel}><div className={styles.panelHeading}><AlertTriangle size={19} /><div><strong>Ce qui demande votre attention</strong><span>Les éléments les plus importants apparaissent en premier.</span></div><button type="button" onClick={() => onView('attention')}>Tout voir<ChevronRight size={15} /></button></div><AttentionCards items={snapshot.attention.slice(0, 5)} snapshot={snapshot} onAction={onAction} onOpenYear={onOpenYear} onOpenPeriod={onOpenPeriod} /></section>
    <section className={styles.runwayPanel}><div className={styles.panelHeading}><Layers3 size={19} /><div><strong>Continuité des années scolaires</strong><span>Revenez sur l’historique ou préparez la prochaine année.</span></div><button type="button" onClick={() => onView('years')}>Voir les années<ChevronRight size={15} /></button></div><YearRunway years={snapshot.years.slice(0, 4)} onOpen={onOpenYear} /></section>
    <section className={styles.periodPanel}><div className={styles.panelHeading}><CalendarRange size={19} /><div><strong>Périodes de l’année</strong><span>Le calendrier reste lisible et chaque conflit est directement actionnable.</span></div><button type="button" onClick={() => onView('periods')}>Voir les périodes<ChevronRight size={15} /></button></div><PeriodTimeline year={currentYear} onOpen={onOpenPeriod} /></section>
    <section className={styles.progressPanel}><div className={styles.panelHeading}><GraduationCap size={19} /><div><strong>Passage à l’année suivante</strong><span>Chaque enfant reçoit une destination explicite et vérifiable.</span></div><button type="button" onClick={() => onView('next-year')}>Préparer<ChevronRight size={15} /></button></div><TransitionSummary year={currentYear} onAction={onAction} /></section>
  </div>
}

function YearsView({ years, search, onOpen, onCreate }: { years: AcademicYearRecord[]; search: string; onOpen: (year: AcademicYearRecord, tab?: AcademicDossierTab) => void; onCreate: () => void }) {
  const filtered = years.filter((year) => !search || `${year.label} ${year.code} ${year.statusLabel}`.toLowerCase().includes(search.toLowerCase()))
  if (!filtered.length) return <SchoolAdminEmptyState title="Aucune année scolaire trouvée" detail="Créez une année ou modifiez votre recherche." actionLabel="Créer une année scolaire" onAction={onCreate} />
  return <div className={styles.yearList}>{filtered.map((year) => <article key={year.id} className={styles.yearRow} data-current={year.isCurrent || undefined}><button type="button" className={styles.yearIdentity} onClick={() => onOpen(year)}><span><CalendarRange size={21} /></span><div><strong>{year.label}</strong><small>{year.code} · {formatDate(year.startsOn)} → {formatDate(year.endsOn)}</small></div></button><SchoolAdminHumanStatus label={STATUS_LABELS[year.status]} tone={adminTone(year.tone)} /><div><span>Périodes</span><strong>{year.periodCount}</strong></div><div><span>Classes / enfants</span><strong>{year.classCount} / {year.childrenCount}</strong></div><div><span>Préparation</span><strong>{year.preparationComplete}/{year.preparationRequired}</strong></div><div><span>À régler</span><strong data-alert={year.blockersCount > 0 || undefined}>{year.blockersCount + year.warningsCount}</strong></div><button type="button" className={styles.rowAction} onClick={() => onOpen(year)}>{year.nextActionLabel}<ChevronRight size={15} /></button></article>)}</div>
}

function PeriodsView({ years, search, onOpen, onAction }: { years: AcademicYearRecord[]; search: string; onOpen: (period: AcademicPeriodRecord, year: AcademicYearRecord, tab?: AcademicDossierTab) => void; onAction: ActionOpener }) {
  const pairs = years.flatMap((year) => year.periods.map((period) => ({ year, period }))).filter(({ year, period }) => !search || `${period.label} ${period.code} ${year.label}`.toLowerCase().includes(search.toLowerCase()))
  if (!pairs.length) return <SchoolAdminEmptyState title="Aucune période n’est encore définie" detail="Ajoutez les trimestres ou semestres qui organiseront l’année scolaire." actionLabel="Ajouter une période" onAction={() => onAction('academic_period.create', years[0] || null)} />
  return <div className={styles.periodList}>{pairs.map(({ year, period }) => <article key={period.id} className={styles.periodRow} data-current={period.isCurrent || undefined}><button type="button" className={styles.periodIdentity} onClick={() => onOpen(period, year)}><span>{period.orderIndex}</span><div><strong>{period.label}</strong><small>{year.label} · {formatDate(period.startsOn)} → {formatDate(period.endsOn)}</small></div></button><SchoolAdminHumanStatus label={period.statusLabel} tone={adminTone(period.tone)} /><div><span>Durée</span><strong>{Math.max(1, (daysBetween(period.startsOn, period.endsOn) || 0) + 1)} jours</strong></div><div><span>À régler</span><strong>{period.findings.length + period.closureBlockers}</strong></div><button type="button" onClick={() => onOpen(period, year)}>Ouvrir le dossier<ChevronRight size={15} /></button></article>)}</div>
}

function CalendarView({ years, findings, onOpen, onAction }: { years: AcademicYearRecord[]; findings: AcademicStructureSnapshot['calendarFindings']; onOpen: (period: AcademicPeriodRecord, year: AcademicYearRecord, tab?: AcademicDossierTab) => void; onAction: ActionOpener }) {
  const year = years.find((item) => item.isCurrent) || years[0]
  if (!year) return <SchoolAdminEmptyState title="Aucun calendrier disponible" detail="Créez d’abord une année scolaire." />
  return <div className={styles.calendarWorkspace}>
    <section className={styles.calendarHeader}><div><span>Calendrier de référence</span><h2>{year.label}</h2><p>{formatDate(year.startsOn)} → {formatDate(year.endsOn)}</p></div><button type="button" onClick={() => onAction('academic_period.verify_calendar', year)}><ShieldCheck size={17} />Vérifier le calendrier</button></section>
    <div className={styles.calendarTrack}>{year.periods.map((period) => <button type="button" key={period.id} data-tone={period.tone} data-current={period.isCurrent || undefined} onClick={() => onOpen(period, year, 'periods-calendar')}><span>{period.orderIndex}</span><strong>{period.label}</strong><small>{formatDate(period.startsOn)} → {formatDate(period.endsOn)}</small><em>{period.statusLabel}</em></button>)}</div>
    <section className={styles.findingsPanel}><div className={styles.panelHeading}><AlertTriangle size={19} /><div><strong>Vérifications du calendrier</strong><span>Les conflits empêchant la mise en service sont signalés clairement.</span></div></div>{findings.filter((item) => item.academicYearId === year.id).length ? <div className={styles.findingList}>{findings.filter((item) => item.academicYearId === year.id).map((finding) => { const period = year.periods.find((item) => item.id === finding.periodId); return <article key={finding.id} data-tone={finding.tone}><span><AlertTriangle size={17} /></span><div><strong>{finding.title}</strong><p>{finding.explanation}</p></div><button type="button" onClick={() => period ? onAction('academic_period.update', year, period) : onAction('academic_period.create', year)}>Corriger<ChevronRight size={15} /></button></article> })}</div> : <SchoolAdminEmptyState title="Calendrier vérifié" detail="Aucun chevauchement ni date hors de l’année n’a été détecté." compact />}</section>
  </div>
}

function PreparationView({ year, onAction, onOpen }: { year: AcademicYearRecord | null; onAction: ActionOpener; onOpen: (year: AcademicYearRecord, tab?: AcademicDossierTab) => void }) {
  if (!year) return <SchoolAdminEmptyState title="Aucune année à préparer" detail="Créez d’abord une année scolaire." actionLabel="Créer une année scolaire" onAction={() => onAction('academic_year.create')} />
  return <div className={styles.preparationWorkspace}>
    <SchoolAdminSituationSummary summary={year.blockersCount ? `${year.blockersCount} élément(s) empêchent encore la mise en service.` : 'L’année scolaire est prête pour la prochaine validation.'} reason="SANILA vérifie les informations, le calendrier, les classes, les capacités et les accès administratifs." consequence={year.blockersCount ? 'L’année ne peut pas devenir la référence active tant que les éléments bloquants restent présents.' : 'La direction peut maintenant rendre cette année active.'} tone={year.blockersCount ? 'warning' : 'success'} />
    <section className={styles.journey}><div className={styles.journeyHeader}><div><span>Préparation de l’année</span><h2>{year.preparationComplete} étapes sur {year.preparationRequired} sont terminées</h2></div><strong>{Math.round((year.preparationComplete / Math.max(1, year.preparationRequired)) * 100)}%</strong></div><div className={styles.journeySteps}>{year.requirements.filter((item) => item.applicable).map((item, index) => <article key={item.key} data-state={item.state}><span>{item.passed ? <Check size={16} /> : index + 1}</span><div><strong>{item.label}</strong><p>{item.explanation}</p></div><em>{item.passed ? 'Complet' : item.blocking ? 'Bloqué' : 'À compléter'}</em>{item.actionLabel ? <button type="button" onClick={() => item.actionKey ? onAction(item.actionKey, year) : item.exactHref ? window.location.assign(item.exactHref) : onOpen(year)}>{item.actionLabel}<ChevronRight size={15} /></button> : null}</article>)}</div></section>
    <SchoolAdminActionDock note={year.blockersCount ? 'Terminez les éléments bloquants avant de demander la validation.' : 'Le dossier est prêt pour la direction.'} secondary={[{ key: 'verify', label: 'Vérifier à nouveau', onClick: () => onAction('academic_year.prepare', year) }]} primary={year.blockersCount ? undefined : { label: year.isCurrent ? 'Préparer l’année suivante' : 'Rendre l’année active', onClick: () => onAction(year.isCurrent ? 'academic_transition.prepare_target' : year.status === 'ready' ? 'academic_year.activate' : 'academic_year.request_activation', year) }} />
  </div>
}

function ClosureView({ year, onAction, onOpenPeriod }: { year: AcademicYearRecord | null; onAction: ActionOpener; onOpenPeriod: (period: AcademicPeriodRecord, year: AcademicYearRecord, tab?: AcademicDossierTab) => void }) {
  if (!year) return <SchoolAdminEmptyState title="Aucune année à clôturer" detail="Aucune année scolaire n’est disponible." />
  const openPeriods = year.periods.filter((period) => period.status !== 'closed')
  const blockers = [...openPeriods.map((period) => ({ key: period.id, label: `${period.label} n’est pas clôturée`, detail: 'Terminez les vérifications de cette période avant la clôture de l’année.', tone: 'warning' as const, actionLabel: 'Préparer la clôture', onAction: () => onOpenPeriod(period, year, 'closure') })), ...year.attention.filter((item) => item.sourceType !== 'period').slice(0, 5).map((item) => ({ key: item.id, label: item.title, detail: item.explanation, tone: item.tone === 'critical' ? 'critical' as const : 'warning' as const, actionLabel: item.recommendedActionLabel, onAction: () => item.actionKey && onAction(item.actionKey, year) }))]
  return <div className={styles.closureWorkspace}>
    <SchoolAdminSituationSummary summary={year.status === 'closed' ? 'L’année scolaire est clôturée.' : blockers.length ? `Cette année ne peut pas encore être clôturée. ${blockers.length} élément(s) restent à traiter.` : 'L’année scolaire est prête à être clôturée.'} reason="La clôture protège les présences, résultats, documents et décisions de passage." consequence={year.status === 'closed' ? 'Les données restent disponibles en consultation et dans l’historique.' : blockers.length ? 'Les opérations historiques resteraient incomplètes si la clôture était forcée.' : 'Après clôture, toute correction nécessitera une réouverture autorisée.'} tone={year.status === 'closed' ? 'success' : blockers.length ? 'warning' : 'approval'} />
    <SchoolAdminAttentionBlock title="Vérifications avant clôture" items={blockers} emptyTitle="Prête à clôturer" emptyDetail="Aucun élément bloquant n’est actuellement détecté." />
    <SchoolAdminImpactPreview title="Après la clôture" items={[{ key: 'periods', label: 'Les périodes clôturées resteront figées.' }, { key: 'history', label: 'L’historique et les documents resteront disponibles.' }, { key: 'corrections', label: 'Toute correction nécessitera une réouverture autorisée.' }, { key: 'transition', label: 'Le passage à l’année suivante conservera sa traçabilité.' }]} tone="approval" />
    <SchoolAdminActionDock note={year.status === 'closed' ? 'Une réouverture nécessite un motif et la validation de la direction.' : blockers.length ? 'Réglez les éléments ci-dessus avant de clôturer.' : 'La clôture est une action importante et historisée.'} secondary={year.status === 'closed' ? [] : [{ key: 'prepare', label: 'Préparer la clôture', onClick: () => onAction('academic_year.begin_closure', year) }]} primary={year.status === 'closed' ? { label: 'Réouvrir l’année scolaire', onClick: () => onAction('academic_year.reopen', year) } : blockers.length ? undefined : { label: 'Clôturer l’année scolaire', onClick: () => onAction('academic_year.close', year), danger: true }} />
  </div>
}

function NextYearView({ year, snapshot, filter, onFilter, onAction, onOpenTransition }: { year: AcademicYearRecord | null; snapshot: AcademicStructureSnapshot; filter: 'all' | 'decision' | 'capacity' | 'failed' | 'ready'; onFilter: (value: 'all' | 'decision' | 'capacity' | 'failed' | 'ready') => void; onAction: ActionOpener; onOpenTransition: (run: AcademicTransitionRun, year: AcademicYearRecord) => void }) {
  if (!year) return <SchoolAdminEmptyState title="Aucune année source" detail="Créez et activez une année scolaire avant de préparer la suivante." />
  const run = year.transition
  if (!run) return <div className={styles.nextYearEmpty}><SchoolAdminSituationSummary summary="Le passage à l’année suivante n’a pas encore été préparé." reason="L’année cible et ses classes doivent exister avant de proposer une destination à chaque enfant." consequence="Aucune inscription actuelle ne sera modifiée tant que vous n’aurez pas validé l’exécution." tone="info" /><SchoolAdminImpactPreview items={[{ key: 'target', label: 'Choisir l’année scolaire suivante.' }, { key: 'structure', label: 'Préparer ou reprendre les classes utiles.' }, { key: 'proposals', label: 'Générer une proposition explicable pour chaque enfant.' }, { key: 'review', label: 'Vérifier les exceptions avant l’exécution.' }]} /><button type="button" className={styles.bigAction} onClick={() => onAction('academic_transition.prepare_target', year)}><GraduationCap size={20} />Préparer l’année suivante<ArrowRight size={18} /></button></div>
  const filtered = run.items.filter((item) => filter === 'all' || (filter === 'decision' && (item.finalDecision === 'undecided' || item.state === 'proposed')) || (filter === 'capacity' && item.capacityConflict) || (filter === 'failed' && item.state === 'failed') || (filter === 'ready' && item.state === 'approved'))
  return <div className={styles.transitionWorkspace}>
    <section className={styles.transitionCrown}><div><span>Passage à l’année suivante</span><h2>{run.sourceAcademicYearLabel} → {run.targetAcademicYearLabel}</h2><p>Chaque enfant garde une décision, une destination et un résultat d’exécution vérifiables.</p></div><SchoolAdminHumanStatus label={run.state === 'completed' || run.state === 'verified' ? 'Terminé' : run.state === 'partially_failed' ? 'À corriger' : run.state === 'approved' ? 'Prêt à exécuter' : 'En préparation'} tone={run.failedItems ? 'critical' : run.state === 'completed' || run.state === 'verified' ? 'success' : 'approval'} /><button type="button" onClick={() => onOpenTransition(run, year)}>Ouvrir le dossier<PanelRightOpen size={16} /></button></section>
    <section className={styles.transitionStats}><button type="button" onClick={() => onFilter('all')} data-active={filter === 'all'}><span>Total</span><strong>{run.totalItems}</strong></button><button type="button" onClick={() => onFilter('ready')} data-active={filter === 'ready'}><span>Prêts</span><strong>{run.readyItems}</strong></button><button type="button" onClick={() => onFilter('decision')} data-active={filter === 'decision'}><span>À décider</span><strong>{run.decisionRequired}</strong></button><button type="button" onClick={() => onFilter('capacity')} data-active={filter === 'capacity'}><span>Capacité</span><strong>{run.capacityConflicts}</strong></button><button type="button" onClick={() => onFilter('failed')} data-active={filter === 'failed'}><span>À corriger</span><strong>{run.failedItems}</strong></button></section>
    <div className={styles.transitionTable}><div className={styles.transitionHead}><span>Enfant</span><span>Classe actuelle</span><span>Décision</span><span>Destination</span><span>État</span><span /></div>{filtered.slice(0, 300).map((item) => <TransitionRow key={item.id} item={item} year={year} run={run} snapshot={snapshot} onAction={onAction} />)}</div>
    <SchoolAdminActionDock note={run.failedItems ? 'Réparez uniquement les dossiers en échec. Les autres résultats restent conservés.' : run.decisionRequired || run.capacityConflicts ? 'Toutes les décisions et les conflits doivent être réglés avant l’exécution.' : 'Le passage est idempotent : une deuxième exécution ne dupliquera pas les inscriptions.'} secondary={[{ key: 'generate', label: 'Actualiser les propositions', onClick: () => onAction('academic_transition.generate_proposals', year, null, run) }, { key: 'approve', label: 'Valider les propositions sans conflit', onClick: () => onAction('academic_transition.bulk_approve', year, null, run) }]} primary={run.failedItems ? { label: 'Réessayer les dossiers corrigés', onClick: () => onAction('academic_transition.retry_item', year, null, run) } : run.decisionRequired || run.capacityConflicts ? undefined : run.state === 'completed' ? { label: 'Vérifier le passage', onClick: () => onAction('academic_transition.verify', year, null, run) } : { label: 'Effectuer le passage', onClick: () => onAction('academic_transition.execute', year, null, run), danger: true }} />
  </div>
}

function TransitionRow({ item, year, run, snapshot, onAction }: { item: AcademicTransitionItem; year: AcademicYearRecord; run: AcademicTransitionRun; snapshot: AcademicStructureSnapshot; onAction: ActionOpener }) {
  return <div className={styles.transitionRow} data-state={item.state}><div><strong>{item.studentLabel}</strong><small>{item.blockerReason || 'Dossier prêt'}</small></div><span>{item.sourceClassLabel || 'Non affecté'}</span><span>{DECISION_LABELS[item.finalDecision]}</span><span>{item.targetClassLabel || 'À définir'}</span><SchoolAdminHumanStatus label={item.state === 'completed' ? 'Transféré' : item.state === 'failed' ? 'À corriger' : item.capacityConflict ? 'Conflit de capacité' : item.state === 'approved' ? 'Prêt' : 'À vérifier'} tone={item.state === 'failed' || item.capacityConflict ? 'critical' : item.state === 'completed' ? 'success' : item.state === 'approved' ? 'approval' : 'warning'} /><button type="button" onClick={() => { const next = newAction('academic_transition.update_decision', year, null, run, item); next.values.targetClassId = item.targetClassId || snapshot.directory.classes.find((entry) => entry.secondary === run.targetAcademicYearLabel)?.id || ''; onAction(next.actionKey, year, null, run, item) }}>{item.state === 'failed' ? 'Corriger' : 'Modifier'}<ChevronRight size={15} /></button></div>
}

function AttentionView({ items, snapshot, onAction, onOpenYear, onOpenPeriod }: { items: AcademicAttentionItem[]; snapshot: AcademicStructureSnapshot; onAction: ActionOpener; onOpenYear: (year: AcademicYearRecord, tab?: AcademicDossierTab) => void; onOpenPeriod: (period: AcademicPeriodRecord, year: AcademicYearRecord, tab?: AcademicDossierTab) => void }) {
  if (!items.length) return <SchoolAdminEmptyState title="Tout est en ordre" detail="Aucun élément académique ne demande votre attention pour le moment." />
  return <div className={styles.attentionWorkspace}>{items.map((item) => <article key={item.id} data-tone={item.tone}><span className={styles.attentionSignal}><AlertTriangle size={18} /></span><div><strong>{item.title}</strong><p>{item.explanation}</p><small>{item.consequence}</small></div><div className={styles.attentionMeta}><span>Responsable</span><strong>{item.ownerLabel || 'À attribuer'}</strong><span>Échéance</span><strong>{item.dueAt ? formatDate(item.dueAt) : 'Non définie'}</strong></div><button type="button" onClick={() => { const year = snapshot.years.find((entry) => entry.id === item.academicYearId); const period = year?.periods.find((entry) => entry.id === item.periodId); if (item.actionKey) onAction(item.actionKey, year || null, period || null, year?.transition || null); else if (period && year) onOpenPeriod(period, year); else if (year) onOpenYear(year); else if (item.exactHref) window.location.assign(item.exactHref) }}>{item.recommendedActionLabel}<ChevronRight size={15} /></button></article>)}</div>
}

function HistoryView({ events }: { events: AcademicStructureSnapshot['history'] }) {
  if (!events.length) return <SchoolAdminEmptyState title="Aucun historique disponible" detail="Les changements importants apparaîtront ici après leur première exécution." />
  return <div className={styles.historyList}>{events.map((event) => <article key={event.id}><span data-tone={event.tone} /><div><strong>{event.label}</strong><p>{event.detail || 'Modification enregistrée dans le dossier académique.'}</p><small>{event.actorLabel || 'Administration'} · {formatDateTime(event.createdAt)}</small></div></article>)}</div>
}

function Dossier({ selected, tab, snapshot, onTab, onClose, onAction, onOpenYear, onOpenPeriod }: { selected: SelectedDossier; tab: AcademicDossierTab; snapshot: AcademicStructureSnapshot; onTab: (tab: AcademicDossierTab) => void; onClose: () => void; onAction: ActionOpener; onOpenYear: (year: AcademicYearRecord, tab?: AcademicDossierTab) => void; onOpenPeriod: (period: AcademicPeriodRecord, year: AcademicYearRecord, tab?: AcademicDossierTab) => void }) {
  const year = selected.kind === 'academic_year' ? selected.record : selected.year
  const title = selected.kind === 'academic_year' ? selected.record.label : selected.kind === 'period' ? selected.record.label : `Passage ${selected.record.sourceAcademicYearLabel} → ${selected.record.targetAcademicYearLabel}`
  const status = selected.kind === 'academic_year' ? selected.record.statusLabel : selected.kind === 'period' ? selected.record.statusLabel : selected.record.state === 'completed' || selected.record.state === 'verified' ? 'Terminé' : selected.record.state === 'partially_failed' ? 'À corriger' : 'En préparation'
  const tone = selected.kind === 'academic_year' ? selected.record.tone : selected.kind === 'period' ? selected.record.tone : selected.record.failedItems ? 'critical' : selected.record.state === 'completed' || selected.record.state === 'verified' ? 'verified' : 'decision'
  return <CustomerOverlaySurface kind="dossier" onClose={onClose} ariaLabel={`Dossier ${title}`}>
    <section className={styles.dossier} role="dialog" aria-modal="true">
      <header className={styles.dossierTop}><SchoolAdminBreadcrumb items={[{ key: 'area', label: 'Année scolaire & calendrier', onSelect: onClose }, { key: 'year', label: year.label, onSelect: selected.kind === 'academic_year' ? undefined : () => onOpenYear(year) }, ...(selected.kind === 'academic_year' ? [] : [{ key: selected.kind, label: title }])]} /><button type="button" onClick={onClose} aria-label="Fermer"><X size={19} /></button></header>
      <SchoolAdminDossierHeader eyebrow={selected.kind === 'academic_year' ? 'Dossier de l’année scolaire' : selected.kind === 'period' ? 'Dossier de la période' : 'Passage à l’année suivante'} title={title} description={selected.kind === 'academic_year' ? selected.record.blockersCount ? `${selected.record.blockersCount} élément(s) restent à régler avant la prochaine étape.` : 'Le dossier académique est à jour pour sa prochaine étape.' : selected.kind === 'period' ? selected.record.findings.length ? 'Cette période contient des dates ou dépendances à vérifier.' : 'La période est organisée et reste liée à son année scolaire.' : `${selected.record.completedItems} enfant(s) transféré(s), ${selected.record.failedItems} dossier(s) à corriger.`} status={status} tone={adminTone(tone)} context={<><span>{year.code}</span><span>{formatDate(year.startsOn)} → {formatDate(year.endsOn)}</span><span>{year.childrenCount} enfant(s)</span></>}>
        {selected.kind === 'academic_year' ? <button type="button" className={styles.headerButton} onClick={() => onAction(selected.record.nextActionKey || 'academic_year.prepare', selected.record)}>{selected.record.nextActionLabel}<ChevronRight size={15} /></button> : null}
      </SchoolAdminDossierHeader>
      <nav className={styles.dossierTabs}>{TABS.filter((item) => selected.kind === 'academic_year' || (selected.kind === 'period' && ['todo', 'information', 'periods-calendar', 'closure', 'history'].includes(item.key)) || (selected.kind === 'transition' && ['todo', 'next-year', 'history'].includes(item.key))).map((item) => <button type="button" key={item.key} data-active={tab === item.key} onClick={() => onTab(item.key)}>{item.label}</button>)}</nav>
      <div className={styles.dossierBody}>{selected.kind === 'academic_year' ? <YearDossierTab year={selected.record} tab={tab} snapshot={snapshot} onAction={onAction} onOpenPeriod={onOpenPeriod} /> : selected.kind === 'period' ? <PeriodDossierTab period={selected.record} year={selected.year} tab={tab} onAction={onAction} /> : <TransitionDossierTab run={selected.record} year={selected.year} tab={tab} snapshot={snapshot} onAction={onAction} />}</div>
    </section>
  </CustomerOverlaySurface>
}

function YearDossierTab({ year, tab, snapshot, onAction, onOpenPeriod }: { year: AcademicYearRecord; tab: AcademicDossierTab; snapshot: AcademicStructureSnapshot; onAction: ActionOpener; onOpenPeriod: (period: AcademicPeriodRecord, year: AcademicYearRecord, tab?: AcademicDossierTab) => void }) {
  if (tab === 'todo') return <div className={styles.tabStack}><SchoolAdminSituationSummary summary={year.blockersCount ? `${year.blockersCount} élément(s) empêchent encore la prochaine étape.` : 'Aucune action bloquante n’est actuellement détectée.'} reason="Ce dossier rassemble le calendrier, la préparation, la clôture et la continuité de l’année." consequence={year.blockersCount ? 'L’activation ou la clôture restera bloquée tant que ces éléments ne sont pas réglés.' : 'Vous pouvez poursuivre avec l’action recommandée.'} tone={year.blockersCount ? 'warning' : 'success'} /><SchoolAdminAttentionBlock items={year.attention.slice(0, 12).map((item) => ({ key: item.id, label: item.title, detail: item.explanation, tone: item.tone === 'critical' ? 'critical' : 'warning', actionLabel: item.recommendedActionLabel, onAction: () => { const period = year.periods.find((entry) => entry.id === item.periodId); if (item.actionKey) onAction(item.actionKey, year, period || null, year.transition); else if (period) onOpenPeriod(period, year) } }))} emptyTitle="Tout est en ordre" emptyDetail="Aucune action académique n’est nécessaire pour le moment." /><SchoolAdminNextAction config={{ title: year.nextActionLabel, detail: year.blockersCount ? 'Commencez par le premier élément bloquant.' : 'Le dossier est prêt à avancer.', label: year.nextActionLabel, disabled: !year.nextActionKey, onAction: () => year.nextActionKey && onAction(year.nextActionKey, year) }} /><SchoolAdminAssignmentPanel owner={year.responsibleLabel} dueAt={null} updatedAt={formatDateTime(year.updatedAt)} nextStep={year.nextActionLabel} /></div>
  if (tab === 'information') return <div className={styles.tabStack}><section className={styles.infoGrid}><div><span>Nom officiel</span><strong>{year.label}</strong></div><div><span>Code</span><strong>{year.code}</strong></div><div><span>Date de début</span><strong>{formatDate(year.startsOn)}</strong></div><div><span>Date de fin</span><strong>{formatDate(year.endsOn)}</strong></div><div><span>État</span><strong>{year.statusLabel}</strong></div><div><span>Responsable</span><strong>{year.responsibleLabel || 'À attribuer'}</strong></div><div><span>Classes</span><strong>{year.classCount}</strong></div><div><span>Enfants</span><strong>{year.childrenCount}</strong></div></section><SchoolAdminImpactPreview title="Avant de modifier les dates" items={[{ key: 'periods', label: `${year.periodCount} période(s) seront vérifiées.` }, { key: 'classes', label: `${year.classCount} classe(s) restent liées à cette année.` }, { key: 'history', label: 'La configuration précédente restera visible dans l’historique.' }]} /><SchoolAdminActionDock primary={{ label: 'Modifier les informations', onClick: () => onAction('academic_year.update', year) }} /></div>
  if (tab === 'periods-calendar') return <div className={styles.tabStack}><PeriodTimeline year={year} onOpen={onOpenPeriod} /><SchoolAdminAttentionBlock title="Conflits du calendrier" items={year.periods.flatMap((period) => period.findings.map((finding) => ({ key: finding.id, label: finding.title, detail: finding.explanation, tone: finding.tone === 'critical' ? 'critical' as const : 'warning' as const, actionLabel: 'Corriger les dates', onAction: () => onAction('academic_period.update', year, period) })))} emptyTitle="Calendrier vérifié" emptyDetail="Aucun conflit de date n’est actuellement détecté." /><SchoolAdminActionDock secondary={[{ key: 'add', label: 'Ajouter une période', onClick: () => onAction('academic_period.create', year) }]} primary={{ label: 'Vérifier le calendrier', onClick: () => onAction('academic_period.verify_calendar', year) }} /></div>
  if (tab === 'organisation') return <div className={styles.tabStack}><section className={styles.organisationGrid}><button type="button" onClick={() => window.location.assign(`/angelcare-360-command-center/administration?plane=classes-capacity&view=classes&academicYear=${year.id}&source=academic-structure`)}><BookOpenCheck size={21} /><span>Classes</span><strong>{year.classCount}</strong><small>Ouvrir les classes exactes</small><ChevronRight size={16} /></button><button type="button" onClick={() => window.location.assign(`/angelcare-360-command-center/administration?plane=assignments&view=coverage&academicYear=${year.id}&source=academic-structure`)}><UserCheck size={21} /><span>Affectations</span><strong>Vérifier</strong><small>Couverture des classes</small><ChevronRight size={16} /></button><button type="button" onClick={() => window.location.assign(`/angelcare-360-command-center/administration?plane=subjects&view=coverage&academicYear=${year.id}&source=academic-structure`)}><BookOpenCheck size={21} /><span>Matières</span><strong>Vérifier</strong><small>Couverture pédagogique</small><ChevronRight size={16} /></button><button type="button" onClick={() => window.location.assign(`/angelcare-360-command-center/personnes?plane=students&academicYear=${year.id}&source=academic-structure`)}><UsersRound size={21} /><span>Enfants</span><strong>{year.childrenCount}</strong><small>Ouvrir les dossiers exacts</small><ChevronRight size={16} /></button></section><SchoolAdminImpactPreview title="Organisation actuelle" items={[{ key: 'periods', label: `${year.periodCount} période(s)` }, { key: 'classes', label: `${year.classCount} classe(s)` }, { key: 'children', label: `${year.childrenCount} enfant(s)` }, { key: 'next', label: year.successorYearLabel ? `Année suivante : ${year.successorYearLabel}` : 'Année suivante à préparer' }]} tone={year.blockersCount ? 'warning' : 'success'} /></div>
  if (tab === 'closure') return <ClosureView year={year} onAction={onAction} onOpenPeriod={onOpenPeriod} />
  if (tab === 'next-year') return <NextYearView year={year} snapshot={snapshot} filter="all" onFilter={() => undefined} onAction={onAction} onOpenTransition={() => undefined} />
  return <div className={styles.historyList}>{year.history.length ? year.history.map((event) => <article key={event.id}><span data-tone={event.tone} /><div><strong>{event.label}</strong><p>{event.detail || 'Modification enregistrée.'}</p><small>{event.actorLabel || 'Administration'} · {formatDateTime(event.createdAt)}</small></div></article>) : <SchoolAdminEmptyState title="Aucun historique" detail="Les actions importantes apparaîtront ici." />}</div>
}

function PeriodDossierTab({ period, year, tab, onAction }: { period: AcademicPeriodRecord; year: AcademicYearRecord; tab: AcademicDossierTab; onAction: ActionOpener }) {
  if (tab === 'todo') return <div className={styles.tabStack}><SchoolAdminSituationSummary summary={period.findings.length ? `${period.findings.length} élément(s) du calendrier doivent être vérifiés.` : period.status === 'closed' ? 'Cette période est clôturée.' : 'La période est prête pour sa prochaine étape.'} reason="Une période relie les dates, les présences, les évaluations et les documents scolaires." consequence={period.status === 'closed' ? 'Toute correction nécessite une réouverture autorisée.' : period.findings.length ? 'La période ne peut pas être validée tant que les conflits restent présents.' : 'Les opérations scolaires peuvent continuer normalement.'} tone={period.status === 'closed' ? 'success' : period.findings.length ? 'warning' : 'info'} /><SchoolAdminAttentionBlock items={period.findings.map((finding) => ({ key: finding.id, label: finding.title, detail: finding.explanation, tone: finding.tone === 'critical' ? 'critical' as const : 'warning' as const, actionLabel: 'Corriger les dates', onAction: () => onAction('academic_period.update', year, period) }))} emptyTitle="Aucune action urgente" emptyDetail="Le calendrier de cette période ne présente aucun conflit détecté." /></div>
  if (tab === 'information' || tab === 'periods-calendar') return <div className={styles.tabStack}><section className={styles.infoGrid}><div><span>Nom</span><strong>{period.label}</strong></div><div><span>Code</span><strong>{period.code}</strong></div><div><span>Ordre</span><strong>{period.orderIndex}</strong></div><div><span>Type</span><strong>{period.termType || 'Période scolaire'}</strong></div><div><span>Début</span><strong>{formatDate(period.startsOn)}</strong></div><div><span>Fin</span><strong>{formatDate(period.endsOn)}</strong></div><div><span>État</span><strong>{period.statusLabel}</strong></div><div><span>Jours restants</span><strong>{period.daysRemaining ?? '—'}</strong></div></section><SchoolAdminImpactPreview items={[{ key: 'year', label: `Rattachée à ${year.label}` }, { key: 'calendar', label: `${period.findings.length} vérification(s) de calendrier` }, { key: 'closure', label: period.status === 'closed' ? 'Période déjà clôturée' : 'Clôture à préparer' }]} /><SchoolAdminActionDock primary={{ label: 'Modifier la période', onClick: () => onAction('academic_period.update', year, period) }} /></div>
  if (tab === 'closure') return <div className={styles.tabStack}><SchoolAdminSituationSummary summary={period.status === 'closed' ? 'La période est clôturée.' : period.closureBlockers ? `${period.closureBlockers} élément(s) empêchent encore la clôture.` : 'La période peut être préparée pour la clôture.'} reason="SANILA vérifie les dépendances avant de verrouiller les données de la période." consequence={period.status === 'closed' ? 'Une réouverture autorisée est nécessaire pour toute correction.' : 'Les présences, évaluations et documents associés doivent être complets.'} tone={period.status === 'closed' ? 'success' : period.closureBlockers ? 'warning' : 'approval'} /><SchoolAdminImpactPreview title="Ce qui sera protégé" items={[{ key: 'attendance', label: 'Les présences de la période.' }, { key: 'assessments', label: 'Les évaluations et corrections validées.' }, { key: 'documents', label: 'Les documents scolaires générés.' }, { key: 'history', label: 'La chronologie complète de la clôture.' }]} /><SchoolAdminActionDock secondary={period.status === 'closed' ? [] : [{ key: 'prepare', label: 'Préparer la clôture', onClick: () => onAction('academic_period.begin_closure', year, period) }]} primary={period.status === 'closed' ? { label: 'Réouvrir la période', onClick: () => onAction('academic_period.reopen', year, period) } : { label: 'Clôturer la période', onClick: () => onAction('academic_period.close', year, period), danger: true }} /></div>
  return <SchoolAdminEmptyState title="Historique de la période" detail="Les événements de cette période apparaissent dans l’historique de l’année scolaire." />
}

function TransitionDossierTab({ run, year, tab, snapshot, onAction }: { run: AcademicTransitionRun; year: AcademicYearRecord; tab: AcademicDossierTab; snapshot: AcademicStructureSnapshot; onAction: ActionOpener }) {
  if (tab === 'todo') return <div className={styles.tabStack}><SchoolAdminSituationSummary summary={run.failedItems ? `${run.failedItems} dossier(s) doivent être réparés.` : run.decisionRequired ? `${run.decisionRequired} enfant(s) nécessitent encore une décision.` : 'Le passage est prêt pour sa prochaine étape.'} reason="Chaque enfant doit recevoir une décision et une destination explicites avant l’exécution." consequence={run.failedItems ? 'Les autres enfants restent correctement transférés ; seuls les dossiers en échec doivent être repris.' : run.capacityConflicts ? 'Les enfants concernés restent exclus tant que la capacité n’est pas corrigée.' : 'Aucune inscription ne sera dupliquée lors de l’exécution.'} tone={run.failedItems || run.decisionRequired || run.capacityConflicts ? 'warning' : 'success'} /><SchoolAdminAttentionBlock items={[...(run.decisionRequired ? [{ key: 'decisions', label: `${run.decisionRequired} décision(s) à prendre`, detail: 'Choisissez une destination explicite pour chaque enfant.', tone: 'critical' as const }] : []), ...(run.capacityConflicts ? [{ key: 'capacity', label: `${run.capacityConflicts} conflit(s) de capacité`, detail: 'Ouvrez les classes concernées avant l’exécution.', tone: 'critical' as const, actionLabel: 'Voir les classes', onAction: () => window.location.assign(`/angelcare-360-command-center/administration?plane=classes-capacity&view=conflicts&run=${run.id}&source=academic-transition`) }] : []), ...(run.failedItems ? [{ key: 'failed', label: `${run.failedItems} dossier(s) à corriger`, detail: 'Réessayez uniquement les dossiers réparés.', tone: 'critical' as const, actionLabel: 'Réessayer', onAction: () => onAction('academic_transition.retry_item', year, null, run) }] : [])]} emptyTitle="Aucune exception active" emptyDetail="Toutes les décisions sont prêtes et aucun échec n’est détecté." /></div>
  if (tab === 'next-year') return <div className={styles.tabStack}><section className={styles.transitionStats}><div><span>Total</span><strong>{run.totalItems}</strong></div><div><span>Prêts</span><strong>{run.readyItems}</strong></div><div><span>À décider</span><strong>{run.decisionRequired}</strong></div><div><span>Capacité</span><strong>{run.capacityConflicts}</strong></div><div><span>À corriger</span><strong>{run.failedItems}</strong></div></section><div className={styles.transitionTable}><div className={styles.transitionHead}><span>Enfant</span><span>Classe actuelle</span><span>Décision</span><span>Destination</span><span>État</span><span /></div>{run.items.slice(0, 300).map((item) => <TransitionRow key={item.id} item={item} year={year} run={run} snapshot={snapshot} onAction={onAction} />)}</div></div>
  return <SchoolAdminImpactPreview title="Historique du passage" items={[{ key: 'created', label: `Passage préparé vers ${run.targetAcademicYearLabel}` }, { key: 'executed', label: run.executedAt ? `Exécuté le ${formatDateTime(run.executedAt)}` : 'Pas encore exécuté' }, { key: 'verified', label: run.verifiedAt ? `Vérifié le ${formatDateTime(run.verifiedAt)}` : 'Vérification finale en attente' }, { key: 'results', label: `${run.completedItems} réussite(s), ${run.failedItems} échec(s)` }]} />
}

function ActionChamber({ action, setAction, snapshot, busy, onClose, onExecute }: { action: ActionState; setAction: (value: ActionState | null) => void; snapshot: AcademicStructureSnapshot; busy: boolean; onClose: () => void; onExecute: () => void }) {
  const needsReason = ['academic_year.close', 'academic_year.reopen', 'academic_period.close', 'academic_period.reopen', 'academic_transition.execute'].includes(action.actionKey)
  const dirty = Object.values(action.values).some((value) => Boolean(value))
  function setValue(key: string, value: string | boolean) { setAction({ ...action, values: { ...action.values, [key]: value } }) }
  const year = snapshot.years.find((item) => item.id === action.academicYearId)
  const period = year?.periods.find((item) => item.id === action.periodId)
  const targetYear = snapshot.years.find((item) => item.id === String(action.values.targetAcademicYearId || ''))
  return <CustomerOverlaySurface kind="nested-command" onClose={onClose} dirty={dirty} ariaLabel={action.title}>
    <section className={styles.actionChamber} role="dialog" aria-modal="true">
      <header><div><span>Fenêtre d’action</span><h2>{action.title}</h2><p>{action.description}</p></div><button type="button" onClick={onClose} aria-label="Fermer"><X size={19} /></button></header>
      <div className={styles.actionBody}>
        <SchoolAdminBreadcrumb items={[{ key: 'area', label: 'Année scolaire & calendrier' }, ...(year ? [{ key: 'year', label: year.label }] : []), { key: 'action', label: action.title }]} />
        {action.actionKey === 'academic_year.create' || action.actionKey === 'academic_year.update' ? <div className={styles.formGrid}><label><span>Nom de l’année scolaire</span><input value={String(action.values.label || '')} onChange={(event: ChangeEvent<HTMLInputElement>) => setValue('label', event.target.value)} placeholder="2026–2027" /></label><label><span>Code interne</span><input value={String(action.values.yearCode || '')} onChange={(event: ChangeEvent<HTMLInputElement>) => setValue('yearCode', event.target.value)} placeholder="2026-2027" /></label><label><span>Date de début</span><input type="date" value={String(action.values.startsOn || '')} onChange={(event: ChangeEvent<HTMLInputElement>) => setValue('startsOn', event.target.value)} /></label><label><span>Date de fin</span><input type="date" value={String(action.values.endsOn || '')} onChange={(event: ChangeEvent<HTMLInputElement>) => setValue('endsOn', event.target.value)} /></label><label><span>Responsable</span><select value={String(action.values.ownerUserId || '')} onChange={(event: ChangeEvent<HTMLSelectElement>) => { const option = snapshot.directory.staff.find((item) => item.id === event.target.value); setValue('ownerUserId', event.target.value); setValue('ownerLabel', option?.label || '') }}><option value="">À attribuer</option>{snapshot.directory.staff.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div> : null}
        {action.actionKey === 'academic_period.create' || action.actionKey === 'academic_period.update' ? <div className={styles.formGrid}><label><span>Nom de la période</span><input value={String(action.values.label || '')} onChange={(event: ChangeEvent<HTMLInputElement>) => setValue('label', event.target.value)} placeholder="Trimestre 1" /></label><label><span>Code</span><input value={String(action.values.termCode || '')} onChange={(event: ChangeEvent<HTMLInputElement>) => setValue('termCode', event.target.value)} placeholder="T1" /></label><label><span>Type</span><select value={String(action.values.termType || 'trimestre')} onChange={(event: ChangeEvent<HTMLSelectElement>) => setValue('termType', event.target.value)}><option value="trimestre">Trimestre</option><option value="semestre">Semestre</option><option value="evaluation">Période d’évaluation</option><option value="custom">Autre période</option></select></label><label><span>Ordre</span><input type="number" min="1" value={String(action.values.orderIndex || '1')} onChange={(event: ChangeEvent<HTMLInputElement>) => setValue('orderIndex', event.target.value)} /></label><label><span>Date de début</span><input type="date" value={String(action.values.startsOn || '')} onChange={(event: ChangeEvent<HTMLInputElement>) => setValue('startsOn', event.target.value)} /></label><label><span>Date de fin</span><input type="date" value={String(action.values.endsOn || '')} onChange={(event: ChangeEvent<HTMLInputElement>) => setValue('endsOn', event.target.value)} /></label></div> : null}
        {action.actionKey === 'academic_transition.prepare_target' ? <div className={styles.formGrid}><label className={styles.fullField}><span>Année scolaire suivante</span><select value={String(action.values.targetAcademicYearId || '')} onChange={(event: ChangeEvent<HTMLSelectElement>) => setValue('targetAcademicYearId', event.target.value)}><option value="">Sélectionnez l’année cible</option>{snapshot.years.filter((item) => item.id !== action.academicYearId).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div> : null}
        {action.actionKey === 'academic_transition.update_decision' ? <div className={styles.formGrid}><label><span>Décision</span><select value={String(action.values.decision || 'undecided')} onChange={(event: ChangeEvent<HTMLSelectElement>) => setValue('decision', event.target.value)}>{Object.entries(DECISION_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label><span>Classe de destination</span><select value={String(action.values.targetClassId || '')} onChange={(event: ChangeEvent<HTMLSelectElement>) => setValue('targetClassId', event.target.value)}><option value="">Sélectionnez une classe</option>{snapshot.directory.classes.filter((item) => !targetYear || item.secondary === targetYear.label).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div> : null}
        {action.actionKey === 'academic_task.assign' ? <div className={styles.formGrid}><label className={styles.fullField}><span>Tâche</span><input value={String(action.values.title || '')} onChange={(event: ChangeEvent<HTMLInputElement>) => setValue('title', event.target.value)} placeholder="Ex. Vérifier les périodes" /></label><label className={styles.fullField}><span>Instructions</span><textarea value={String(action.values.description || '')} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setValue('description', event.target.value)} /></label><label><span>Responsable</span><select value={String(action.values.ownerUserId || '')} onChange={(event: ChangeEvent<HTMLSelectElement>) => { const option = snapshot.directory.staff.find((item) => item.id === event.target.value); setValue('ownerUserId', event.target.value); setValue('ownerLabel', option?.label || '') }}><option value="">À attribuer</option>{snapshot.directory.staff.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label><span>Échéance</span><input type="date" value={String(action.values.dueAt || '')} onChange={(event: ChangeEvent<HTMLInputElement>) => setValue('dueAt', event.target.value)} /></label></div> : null}
        {action.actionKey === 'academic_note.add' ? <div className={styles.formGrid}><label className={styles.fullField}><span>Note interne</span><textarea value={String(action.values.body || '')} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setValue('body', event.target.value)} placeholder="Conservez ici une information utile à l’équipe." /></label><label className={styles.checkField}><input type="checkbox" checked={Boolean(action.values.important)} onChange={(event: ChangeEvent<HTMLInputElement>) => setValue('important', event.target.checked)} /><span>Marquer cette note comme importante</span></label></div> : null}
        {needsReason || ['academic_year.begin_closure', 'academic_period.begin_closure', 'academic_year.request_activation', 'academic_year.request_closure', 'academic_year.request_reopen', 'academic_period.request_closure', 'academic_period.request_reopen', 'academic_transition.request_approval'].includes(action.actionKey) ? <div className={styles.formGrid}><label className={styles.fullField}><span>{needsReason ? 'Motif obligatoire' : 'Note pour la validation'}</span><textarea value={String(action.values.reason || '')} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setValue('reason', event.target.value)} placeholder="Expliquez clairement la raison et le résultat attendu." /></label><label><span>Date d’effet</span><input type="date" value={String(action.values.effectiveAt || '')} onChange={(event: ChangeEvent<HTMLInputElement>) => setValue('effectiveAt', event.target.value)} /></label></div> : null}
        <SchoolAdminImpactPreview title="Ce qui va changer" items={impactForAction(action, year || null, period || null, targetYear || null)} tone={action.actionKey.includes('close') || action.actionKey.includes('execute') ? 'approval' : 'info'} />
        {action.actionKey === 'academic_year.activate' && !snapshot.viewer.canActivate ? <SchoolAdminErrorState title="Validation de la direction nécessaire" detail="Votre rôle peut préparer le dossier, mais la mise en service doit être validée par la direction." /> : null}
      </div>
      <SchoolAdminActionDock note="Le résultat sera enregistré dans l’historique et la page sera actualisée automatiquement." secondary={[{ key: 'cancel', label: 'Annuler', onClick: onClose }]} primary={{ label: action.title, onClick: onExecute, busy, danger: action.actionKey.includes('close') || action.actionKey.includes('execute') }} />
    </section>
  </CustomerOverlaySurface>
}

function impactForAction(action: ActionState, year: AcademicYearRecord | null, period: AcademicPeriodRecord | null, targetYear: AcademicYearRecord | null) {
  if (action.actionKey === 'academic_year.activate') return [{ key: 'reference', label: 'Cette année deviendra l’année de référence.', value: year?.label }, { key: 'periods', label: `${year?.periodCount || 0} période(s) deviendront disponibles.` }, { key: 'classes', label: `${year?.classCount || 0} classe(s) resteront rattachées.` }, { key: 'history', label: 'L’ancienne année active restera dans l’historique.' }]
  if (action.actionKey === 'academic_year.close') return [{ key: 'lock', label: 'L’année sera protégée contre les modifications ordinaires.' }, { key: 'history', label: 'Son historique restera consultable.' }, { key: 'reopen', label: 'Une réouverture autorisée restera possible.' }]
  if (action.actionKey === 'academic_period.close') return [{ key: 'period', label: `La période ${period?.label || ''} sera clôturée.` }, { key: 'history', label: 'Les données existantes resteront disponibles.' }, { key: 'reopen', label: 'Toute correction nécessitera une réouverture.' }]
  if (action.actionKey === 'academic_transition.prepare_target') return [{ key: 'source', label: `Année source : ${year?.label || 'à définir'}` }, { key: 'target', label: `Année cible : ${targetYear?.label || 'à sélectionner'}` }, { key: 'safe', label: 'Aucune inscription ne sera modifiée pendant la préparation.' }]
  if (action.actionKey === 'academic_transition.execute') return [{ key: 'children', label: `${year?.transition?.readyItems || 0} enfant(s) prêts seront traités.` }, { key: 'history', label: 'Les affectations de l’année précédente seront conservées.' }, { key: 'idempotent', label: 'Une nouvelle exécution ne créera pas de doublons.' }, { key: 'failures', label: 'Les échecs resteront visibles et réparables individuellement.' }]
  return [{ key: 'record', label: 'Le dossier concerné sera mis à jour.' }, { key: 'reconcile', label: 'Les compteurs, listes et recommandations seront actualisés.' }, { key: 'audit', label: 'Le changement sera ajouté à l’historique.' }]
}

function AttentionCards({ items, snapshot, onAction, onOpenYear, onOpenPeriod }: { items: AcademicAttentionItem[]; snapshot: AcademicStructureSnapshot; onAction: ActionOpener; onOpenYear: (year: AcademicYearRecord, tab?: AcademicDossierTab) => void; onOpenPeriod: (period: AcademicPeriodRecord, year: AcademicYearRecord, tab?: AcademicDossierTab) => void }) {
  if (!items.length) return <SchoolAdminEmptyState title="Tout est en ordre" detail="Aucun élément ne demande votre attention aujourd’hui." compact />
  return <div className={styles.attentionCards}>{items.map((item) => <button type="button" key={item.id} data-tone={item.tone} onClick={() => { const year = snapshot.years.find((entry) => entry.id === item.academicYearId); const period = year?.periods.find((entry) => entry.id === item.periodId); if (item.exactHref) window.location.assign(item.exactHref); else if (item.actionKey) onAction(item.actionKey, year || null, period || null, year?.transition || null); else if (period && year) onOpenPeriod(period, year); else if (year) onOpenYear(year) }}><span><AlertTriangle size={17} /></span><div><strong>{item.title}</strong><small>{item.explanation}</small></div><ChevronRight size={16} /></button>)}</div>
}

function YearRunway({ years, onOpen }: { years: AcademicYearRecord[]; onOpen: (year: AcademicYearRecord, tab?: AcademicDossierTab) => void }) {
  return <div className={styles.yearRunway}>{years.map((year, index) => <button type="button" key={year.id} data-current={year.isCurrent || undefined} data-tone={year.tone} onClick={() => onOpen(year)}><span>{index + 1}</span><div><strong>{year.label}</strong><small>{year.statusLabel}</small></div><em>{year.childrenCount} enfant(s)</em><ChevronRight size={15} /></button>)}</div>
}

function PeriodTimeline({ year, onOpen }: { year: AcademicYearRecord; onOpen: (period: AcademicPeriodRecord, year: AcademicYearRecord, tab?: AcademicDossierTab) => void }) {
  if (!year.periods.length) return <SchoolAdminEmptyState title="Aucune période définie" detail="Ajoutez les trimestres ou semestres qui organiseront l’année scolaire." compact />
  return <div className={styles.periodTimeline}>{year.periods.map((period) => <button type="button" key={period.id} data-current={period.isCurrent || undefined} data-tone={period.tone} onClick={() => onOpen(period, year)}><span>{period.orderIndex}</span><div><strong>{period.label}</strong><small>{formatDate(period.startsOn)} → {formatDate(period.endsOn)}</small></div><SchoolAdminHumanStatus label={period.statusLabel} tone={adminTone(period.tone)} /><ChevronRight size={15} /></button>)}</div>
}

function TransitionSummary({ year, onAction }: { year: AcademicYearRecord; onAction: ActionOpener }) {
  if (!year.transition) return <div className={styles.transitionEmpty}><div><strong>Année suivante à préparer</strong><p>Choisissez l’année cible puis générez les propositions de passage.</p></div><button type="button" onClick={() => onAction('academic_transition.prepare_target', year)}>Préparer maintenant<ChevronRight size={15} /></button></div>
  const run = year.transition
  return <div className={styles.transitionSummary}><div><span>Prêts</span><strong>{run.readyItems}</strong></div><div><span>À décider</span><strong>{run.decisionRequired}</strong></div><div><span>Capacité</span><strong>{run.capacityConflicts}</strong></div><div><span>À corriger</span><strong>{run.failedItems}</strong></div></div>
}

function daysBetween(from: string, to: string) {
  const start = Date.parse(from)
  const end = Date.parse(to)
  if (Number.isNaN(start) || Number.isNaN(end)) return null
  return Math.ceil((end - start) / 86_400_000)
}

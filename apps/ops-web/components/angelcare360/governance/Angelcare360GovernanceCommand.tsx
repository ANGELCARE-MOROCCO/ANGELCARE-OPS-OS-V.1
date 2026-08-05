'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowRight,
  BadgeCheck,
  BookCopy,
  BookOpenCheck,
  Boxes,
  Building2,
  CalendarRange,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleGauge,
  ClipboardCheck,
  Clock3,
  Command,
  CornerUpRight,
  FileClock,
  FileSearch,
  Filter,
  GitBranch,
  GraduationCap,
  History,
  KeyRound,
  Layers3,
  LayoutDashboard,
  ListChecks,
  LoaderCircle,
  LockKeyhole,
  Maximize2,
  Network,
  PanelRightOpen,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  SplitSquareHorizontal,
  TableProperties,
  Target,
  UserCheck,
  UserCog,
  Users,
  X,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
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
  SchoolAdminImpactPreview,
  SchoolAdminNextAction,
  SchoolAdminSituationSummary,
} from '@/components/angelcare360/customer-experience/SchoolAdminWorkbench'
import {
  GOVERNANCE_MATTER_ACTION_LABELS,
  governanceLocalViewLabel,
  governanceOperationLabel,
  humanizeTechnicalLabel,
  schoolEntityLabel,
  schoolStatusLabel,
} from '@/data/angelcare360/customer-language'
import { GOVERNANCE_COMMANDS, GOVERNANCE_PLANES } from '@/data/angelcare360/governance-command'
import type {
  GovernanceAcademicYearRecord,
  GovernanceAssignmentRecord,
  GovernanceBriefing,
  GovernanceCapacityRecord,
  GovernanceCommandResult,
  GovernanceCommandSnapshot,
  GovernanceConfigurationRecord,
  GovernanceDelegationRecord,
  GovernanceEntityRecord,
  GovernanceEntityType,
  GovernanceInstitutionRecord,
  GovernanceMatter,
  GovernanceMatterAction,
  GovernanceOperationKey,
  GovernancePlaneKey,
  GovernanceRoleRecord,
  GovernanceSubjectRecord,
  GovernanceTone,
} from '@/types/angelcare360/governance-command'
import styles from './Angelcare360GovernanceCommand.module.css'

type Props = {
  initialSnapshot: GovernanceCommandSnapshot
  initialPlane: GovernancePlaneKey
  initialEntityId: string | null
  initialEntityType: GovernanceEntityType | null
  initialDrawer: string | null
  initialFocus: string | null
}

type Toast = { kind: 'success' | 'warning' | 'error'; message: string } | null

type SelectedEntity = {
  type: GovernanceEntityType
  record: GovernanceEntityRecord
  mode: 'peek' | 'dossier' | 'focus'
}

type ActionChamber = {
  operationKey: GovernanceOperationKey
  entityType: GovernanceEntityType
  entityId: string | null
  title: string
  description: string
  reason: string
  effectiveAt: string
  capacity: string
  replacementStaffId: string
  targetClassId: string
  targetSectionId: string
  sourceAcademicYearId: string
  targetAcademicYearId: string
  permissionKeys: string
  frozen: boolean
}

type CommandStudio = {
  entityType: GovernanceEntityType
  templateKey: string
  values: Record<string, string>
}

const PLANE_ICONS: Record<GovernancePlaneKey, LucideIcon> = {
  institutions: Building2,
  'academic-structure': CalendarRange,
  'classes-capacity': Boxes,
  subjects: BookOpenCheck,
  assignments: UserCheck,
  'roles-permissions': KeyRound,
  settings: Settings2,
  audit: History,
}

const TONE_LABELS: Record<GovernanceTone, string> = {
  critical: 'Critique',
  warning: 'Attention',
  active: 'Actif',
  verified: 'Vérifié',
  decision: 'Décision',
  neutral: 'Neutre',
}

const MATTER_ACTION_LABELS: Record<GovernanceMatterAction, string> = GOVERNANCE_MATTER_ACTION_LABELS

const OPERATION_COPY: Partial<Record<GovernanceOperationKey, { title: string; description: string }>> = {
  'governance.institution.review': { title: 'Vérifier ce qu’il reste à compléter', description: 'Vérifier chaque élément nécessaire et afficher clairement ce qui empêche l’ouverture.' },
  'governance.institution.activate': { title: 'Ouvrir l’établissement dans le système', description: 'Vérifier que tous les éléments nécessaires sont complets avant l’ouverture.' },
  'governance.institution.suspend': { title: 'Suspendre l’institution', description: 'Suspendre l’exploitation sans supprimer l’historique.' },
  'governance.institution.reactivate': { title: 'Réactiver l’institution', description: 'Restaurer l’état opérationnel après revue.' },
  'governance.institution.close': { title: 'Fermer l’institution', description: 'Engager une fermeture gouvernée et datée.' },
  'governance.institution.archive': { title: 'Archiver l’institution', description: 'Retirer l’institution active tout en préservant sa reconstruction.' },
  'governance.academic_year.publish': { title: 'Publier l’année scolaire', description: 'Créer une version de structure immutable prête à l’activation.' },
  'governance.academic_year.activate': { title: 'Activer l’année scolaire', description: 'Définir cette année comme contexte institutionnel courant.' },
  'governance.academic_year.close': { title: 'Clôturer l’année scolaire', description: 'Figer le cycle et produire sa version de clôture.' },
  'governance.academic_year.reopen': { title: 'Réouvrir l’année scolaire', description: 'Réouvrir avec un motif obligatoire et conserver l’historique.' },
  'governance.rollover.preview': { title: 'Préparer le passage à l’année suivante', description: 'Vérifier les enfants concernés, leurs classes proposées et les dossiers à revoir, sans modifier les inscriptions.' },
  'governance.rollover.execute': { title: 'Appliquer le passage à l’année suivante', description: 'Mettre à jour les inscriptions validées tout en conservant l’historique de chaque enfant.' },
  'governance.rollover.repair': { title: 'Corriger les dossiers non transférés', description: 'Reprendre uniquement les enfants dont le passage n’a pas pu être terminé.' },
  'governance.period.publish': { title: 'Publier la période', description: 'Rendre la période active dans le contexte académique.' },
  'governance.period.close': { title: 'Clôturer la période', description: 'Verrouiller la période et préserver l’état historique.' },
  'governance.period.reopen': { title: 'Réouvrir la période', description: 'Réouvrir la période avec un motif et conserver l’historique.' },
  'governance.capacity.change': { title: 'Modifier la capacité', description: 'Appliquer une nouvelle capacité avec impact et justification.' },
  'governance.population.move': { title: 'Déplacer une population', description: 'Déplacer les élèves sélectionnés vers une classe ou section exacte.' },
  'governance.enrollment.freeze': { title: 'Geler les inscriptions', description: 'Bloquer ou rouvrir l’affectation de nouvelles inscriptions.' },
  'governance.subject.publish': { title: 'Publier la matière', description: 'Activer une version gouvernée de la matière.' },
  'governance.subject.replace': { title: 'Remplacer la matière', description: 'Superséder la matière par une nouvelle référence.' },
  'governance.subject.retire': { title: 'Retirer la matière', description: 'Archiver la matière sans effacer son usage historique.' },
  'governance.assignment.change': { title: 'Modifier l’affectation', description: 'Modifier le contexte effectif de l’affectation.' },
  'governance.assignment.replace': { title: 'Remplacer l’enseignant', description: 'Terminer l’affectation actuelle et créer son remplacement.' },
  'governance.assignment.end': { title: 'Terminer l’affectation', description: 'Clore l’affectation avec date, raison et historique.' },
  'governance.role.publish': { title: 'Publier le rôle', description: 'Publier une version du rôle et sa matrice de permissions.' },
  'governance.role.assign': { title: 'Affecter le rôle', description: 'Attribuer ce rôle à un utilisateur dans le périmètre choisi.' },
  'governance.role.revoke': { title: 'Révoquer le rôle', description: 'Retirer une affectation de rôle avec audit.' },
  'governance.delegation.create': { title: 'Donner un accès temporaire', description: 'Donner un accès limité dans le temps et facile à retirer.' },
  'governance.delegation.revoke': { title: 'Retirer l’accès temporaire', description: 'Retirer immédiatement cet accès temporaire.' },
  'governance.configuration.publish': { title: 'Publier la configuration', description: 'Créer une version effective et superséder l’ancienne.' },
  'governance.configuration.rollback': { title: 'Revenir au réglage précédent', description: 'Préparer le retour à une version précédente du réglage.' },
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function relativeDate(value: string | null | undefined) {
  if (!value) return 'Sans échéance'
  const difference = Date.parse(value) - Date.now()
  const days = Math.ceil(Math.abs(difference) / 86_400_000)
  if (difference < 0) return `En retard de ${days} j`
  if (days === 0) return "Aujourd'hui"
  return `Dans ${days} j`
}

function recordIdentity(record: GovernanceEntityRecord) {
  return `${record.type}:${record.id}`
}

function defaultStudio(type: GovernanceEntityType): CommandStudio {
  return { entityType: type, templateKey: type, values: {} }
}

function createActionChamber(operationKey: GovernanceOperationKey, record: GovernanceEntityRecord | null): ActionChamber {
  const copy = OPERATION_COPY[operationKey] || { title: governanceOperationLabel(operationKey), description: 'Préparez les informations nécessaires avant de confirmer.' }
  return {
    operationKey,
    entityType: record?.type || 'institution',
    entityId: record?.id || null,
    title: copy.title,
    description: copy.description,
    reason: '',
    effectiveAt: new Date().toISOString().slice(0, 10),
    capacity: record && 'targetCapacity' in record ? String((record as GovernanceCapacityRecord).targetCapacity) : '',
    replacementStaffId: '',
    targetClassId: '',
    targetSectionId: '',
    sourceAcademicYearId: '',
    targetAcademicYearId: '',
    permissionKeys: '',
    frozen: true,
  }
}

export default function Angelcare360GovernanceCommand({
  initialSnapshot,
  initialPlane,
  initialEntityId,
  initialEntityType,
  initialDrawer,
  initialFocus,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [plane, setPlane] = useState<GovernancePlaneKey>(GOVERNANCE_PLANES.some((item) => item.key === initialPlane) ? initialPlane : 'institutions')
  const [localView, setLocalView] = useState(GOVERNANCE_PLANES.find((item) => item.key === initialPlane)?.localNavigation[0] || 'Vue réseau')
  const [search, setSearch] = useState('')
  const [toneFilter, setToneFilter] = useState<'all' | GovernanceTone>('all')
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null)
  const [selectedMatter, setSelectedMatter] = useState<GovernanceMatter | null>(null)
  const [studio, setStudio] = useState<CommandStudio | null>(null)
  const [actionChamber, setActionChamber] = useState<ActionChamber | null>(null)
  const [briefingOpen, setBriefingOpen] = useState(false)
  const [briefingType, setBriefingType] = useState<GovernanceBriefing['briefingType']>('weekly')
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast>(null)
  const [matterReason, setMatterReason] = useState('')
  const [matterAssignee, setMatterAssignee] = useState('')
  const [matterDueAt, setMatterDueAt] = useState('')
  const [expandedMatrix, setExpandedMatrix] = useState(false)

  const allEntities = useMemo<GovernanceEntityRecord[]>(() => [
    ...snapshot.institutions,
    ...snapshot.academicYears,
    ...snapshot.terms,
    ...snapshot.capacities,
    ...snapshot.subjects,
    ...snapshot.assignments,
    ...snapshot.roles,
    ...snapshot.delegations,
    ...snapshot.configurations,
  ], [snapshot])

  useEffect(() => {
    if (!initialEntityId) return
    const record = allEntities.find((item) => item.id === initialEntityId && (!initialEntityType || item.type === initialEntityType))
    if (record) setSelectedEntity({ type: record.type, record, mode: initialDrawer === 'focus' ? 'focus' : initialDrawer === 'peek' ? 'peek' : 'dossier' })
  }, [allEntities, initialDrawer, initialEntityId, initialEntityType])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    const definition = GOVERNANCE_PLANES.find((item) => item.key === plane)
    if (definition && !definition.localNavigation.includes(localView)) setLocalView(definition.localNavigation[0])
  }, [localView, plane])

  const currentPlane = GOVERNANCE_PLANES.find((item) => item.key === plane) || GOVERNANCE_PLANES[0]
  const activeMatters = snapshot.matters.filter((item) => !['resolved', 'released', 'cancelled'].includes(item.state))
  const matterLanes = {
    activation: activeMatters.filter((item) => item.lane === 'activation'),
    decision: activeMatters.filter((item) => item.lane === 'decision'),
    conflict: activeMatters.filter((item) => item.lane === 'conflict'),
    publication: activeMatters.filter((item) => item.lane === 'publication'),
  }

  const updateUrl = (nextPlane: GovernancePlaneKey, extras?: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('plane', nextPlane)
    params.delete('entity')
    params.delete('type')
    params.delete('drawer')
    for (const [key, value] of Object.entries(extras || {})) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const choosePlane = (nextPlane: GovernancePlaneKey) => {
    setPlane(nextPlane)
    setSelectedEntity(null)
    setSelectedMatter(null)
    updateUrl(nextPlane)
  }

  const showEntity = (record: GovernanceEntityRecord, mode: SelectedEntity['mode'] = 'dossier') => {
    setSelectedMatter(null)
    setSelectedEntity({ type: record.type, record, mode })
    const params = new URLSearchParams(searchParams.toString())
    params.set('plane', plane)
    params.set('entity', record.id)
    params.set('type', record.type)
    params.set('drawer', mode)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const closeDrawer = () => {
    setSelectedEntity(null)
    setSelectedMatter(null)
    setMatterReason('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('entity')
    params.delete('type')
    params.delete('drawer')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const callCommand = async (command: string, payload: Record<string, unknown>, key: string) => {
    setBusyKey(key)
    try {
      const response = await fetch('/api/angelcare360/governance/command', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ command, payload }),
        credentials: 'same-origin',
      })
      const result = await response.json().catch(() => null) as GovernanceCommandResult | null
      if (!response.ok || !result?.ok) throw new Error(result?.message || result?.blockers?.join(' · ') || 'L’action a échoué.')
      const refreshed = await fetch('/api/angelcare360/governance/command', { credentials: 'same-origin', cache: 'no-store' })
      const body = await refreshed.json().catch(() => null)
      if (refreshed.ok && body?.snapshot) {
        setSnapshot(body.snapshot as GovernanceCommandSnapshot)
        if (selectedMatter) {
          const next = (body.snapshot as GovernanceCommandSnapshot).matters.find((item) => item.fingerprint === selectedMatter.fingerprint)
          setSelectedMatter(next || null)
        }
        if (selectedEntity) {
          const next = ([
            ...(body.snapshot as GovernanceCommandSnapshot).institutions,
            ...(body.snapshot as GovernanceCommandSnapshot).academicYears,
            ...(body.snapshot as GovernanceCommandSnapshot).terms,
            ...(body.snapshot as GovernanceCommandSnapshot).capacities,
            ...(body.snapshot as GovernanceCommandSnapshot).subjects,
            ...(body.snapshot as GovernanceCommandSnapshot).assignments,
            ...(body.snapshot as GovernanceCommandSnapshot).roles,
            ...(body.snapshot as GovernanceCommandSnapshot).delegations,
            ...(body.snapshot as GovernanceCommandSnapshot).configurations,
          ] as GovernanceEntityRecord[]).find((item) => recordIdentity(item) === recordIdentity(selectedEntity.record))
          if (next) setSelectedEntity({ ...selectedEntity, record: next })
        }
      }
      setToast({ kind: result.state === 'blocked' ? 'warning' : 'success', message: result.message })
      return result
    } catch (error) {
      setToast({ kind: 'error', message: error instanceof Error ? error.message : 'Échec inattendu.' })
      return null
    } finally {
      setBusyKey(null)
    }
  }

  const refreshSnapshot = async () => {
    setBusyKey('refresh')
    try {
      const response = await fetch('/api/angelcare360/governance/command', { credentials: 'same-origin', cache: 'no-store' })
      const body = await response.json().catch(() => null)
      if (!response.ok || !body?.snapshot) throw new Error(body?.message || 'Synchronisation impossible.')
      setSnapshot(body.snapshot)
      setToast({ kind: 'success', message: 'Gouvernance synchronisée.' })
    } catch (error) {
      setToast({ kind: 'error', message: error instanceof Error ? error.message : 'Synchronisation impossible.' })
    } finally {
      setBusyKey(null)
    }
  }

  const runMatterAction = async (action: GovernanceMatterAction) => {
    if (!selectedMatter) return
    const result = await callCommand('matter_action', {
      action,
      matterId: selectedMatter.id,
      fingerprint: selectedMatter.fingerprint,
      reason: matterReason || null,
      note: matterReason || null,
      assigneeLabel: matterAssignee || null,
      dueAt: matterDueAt || null,
      snoozedUntil: matterDueAt || null,
      matterSnapshot: selectedMatter,
      idempotencyKey: `${selectedMatter.fingerprint}:${action}:${matterReason}:${matterAssignee}:${matterDueAt}`,
    }, `matter:${action}`)
    if (result && ['resolve', 'release'].includes(action)) {
      setSelectedMatter(null)
      setMatterReason('')
    }
  }

  const runEntityAction = async () => {
    if (!actionChamber) return
    const payload: Record<string, unknown> = {
      capacity: actionChamber.capacity ? Number(actionChamber.capacity) : undefined,
      replacementStaffId: actionChamber.replacementStaffId || undefined,
      targetClassId: actionChamber.targetClassId || undefined,
      targetSectionId: actionChamber.targetSectionId || undefined,
      sourceAcademicYearId: actionChamber.sourceAcademicYearId || undefined,
      targetAcademicYearId: actionChamber.targetAcademicYearId || undefined,
      permissionKeys: actionChamber.permissionKeys.split(',').map((item) => item.trim()).filter(Boolean),
      frozen: actionChamber.frozen,
    }
    const result = await callCommand('entity_action', {
      operationKey: actionChamber.operationKey,
      entityType: actionChamber.entityType,
      entityId: actionChamber.entityId,
      reason: actionChamber.reason || null,
      effectiveAt: actionChamber.effectiveAt ? new Date(`${actionChamber.effectiveAt}T12:00:00`).toISOString() : null,
      payload,
      idempotencyKey: `${actionChamber.operationKey}:${actionChamber.entityId}:${actionChamber.effectiveAt}:${actionChamber.reason}:${JSON.stringify(payload)}`,
    }, `entity:${actionChamber.operationKey}`)
    if (result) setActionChamber(null)
  }

  const createEntity = async () => {
    if (!studio) return
    const values = studio.values
    const result = await callCommand('entity_create', {
      entityType: studio.entityType,
      payload: values,
      idempotencyKey: `create:${studio.entityType}:${JSON.stringify(values)}`,
    }, `create:${studio.entityType}`)
    if (result) setStudio(null)
  }

  const generateBriefing = async () => {
    const result = await callCommand('briefing_generate', { briefingType, idempotencyKey: `briefing:${briefingType}:${new Date().toISOString().slice(0, 10)}` }, `briefing:${briefingType}`)
    if (result) setBriefingOpen(false)
  }

  const filtered = <T extends GovernanceEntityRecord>(items: T[]) => items.filter((item) => {
    const matchesSearch = !search || `${item.title} ${item.subtitle} ${item.code} ${item.status}`.toLowerCase().includes(search.toLowerCase())
    const matchesTone = toneFilter === 'all' || item.tone === toneFilter
    return matchesSearch && matchesTone
  })

  const filteredMatters = activeMatters.filter((matter) => !search || `${matter.title} ${matter.summary} ${matter.sourceLabel}`.toLowerCase().includes(search.toLowerCase()))
  const selectedEntityMatters = selectedEntity ? snapshot.matters.filter((matter) => matter.sourceId === selectedEntity.record.id || matter.linkedRecords.some((item) => item.id === selectedEntity.record.id)) : []

  return (
    <main className={styles.workspace} data-plane={plane}>
      <section className={styles.commandCrown}>
        <div className={styles.crownIdentity}>
          <div className={styles.crownMark}><Network size={22} /></div>
          <div>
            <div className={styles.eyebrow}>Institutional Governance Sovereign OS</div>
            <div className={styles.crownTitleRow}>
              <h1>Gouvernance & autorité institutionnelle</h1>
              <span className={styles.postureBadge} data-tone={snapshot.posture.state === 'critical' ? 'critical' : snapshot.posture.state === 'attention' ? 'warning' : 'verified'}>{snapshot.posture.label}</span>
            </div>
            <p>{snapshot.school.name} · {snapshot.school.currentAcademicYearLabel || 'Aucune année active'} · {snapshot.viewer.roleLabel}</p>
          </div>
        </div>
        <div className={styles.crownActions}>
          <button type="button" className={styles.secondaryButton} onClick={refreshSnapshot} disabled={busyKey === 'refresh'}>
            {busyKey === 'refresh' ? <LoaderCircle className={styles.spin} size={17} /> : <RefreshCw size={17} />} Synchroniser
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => setBriefingOpen(true)}><FileClock size={17} /> Briefing</button>
          <button type="button" className={styles.primaryButton} onClick={() => setStudio(defaultStudio('institution'))}><Command size={17} /> Ajouter ou modifier</button>
        </div>
      </section>

      <section className={styles.metricsGrid}>
        {snapshot.metrics.map((metric) => (
          <button key={metric.key} type="button" className={styles.metricCard} data-tone={metric.tone} onClick={() => {
            if (metric.filter === 'capacity') choosePlane('classes-capacity')
            else if (metric.filter === 'subjects') choosePlane('subjects')
            else if (metric.filter === 'assignments') choosePlane('assignments')
            else if (metric.filter === 'access') choosePlane('roles-permissions')
            else setSearch(metric.filter === 'matters' ? '' : metric.label)
          }}>
            <span className={styles.metricSignal} />
            <span className={styles.metricLabel}>{metric.label}</span>
            <strong>{metric.value}</strong>
            <span>{metric.detail}</span>
            <ChevronRight size={17} />
          </button>
        ))}
      </section>

      <nav className={styles.planeNavigation} aria-label="Plans Gouvernance">
        {GOVERNANCE_PLANES.map((item) => {
          const Icon = PLANE_ICONS[item.key]
          return (
            <button key={item.key} type="button" className={styles.planeButton} data-active={plane === item.key} onClick={() => choosePlane(item.key)}>
              <Icon size={17} /><span>{item.shortLabel}</span>
            </button>
          )
        })}
      </nav>

      <section className={styles.planeHeader}>
        <div>
          <div className={styles.eyebrow}>Espace de travail</div>
          <h2>{currentPlane.label}</h2>
          <p>{currentPlane.description}</p>
        </div>
        <div className={styles.planeHeaderActions}>
          <button type="button" className={styles.iconButton} title="Étendre la matrice" onClick={() => setExpandedMatrix((value) => !value)}>{expandedMatrix ? <SplitSquareHorizontal size={18} /> : <Maximize2 size={18} />}</button>
          <button type="button" className={styles.iconButton} title="Filtrer"><Filter size={18} /></button>
        </div>
      </section>

      <div className={styles.localNavigation}>
        {currentPlane.localNavigation.map((item) => (
          <button key={item} type="button" data-active={localView === item} onClick={() => setLocalView(item)}>{governanceLocalViewLabel(item)}</button>
        ))}
      </div>

      <section className={styles.commandLauncher}>
        <div className={styles.commandLauncherIntro}>
          <Sparkles size={18} />
          <div><strong>Actions rapides</strong><span>Ajoutez ou mettez à jour les éléments de l’école sans perdre votre contexte.</span></div>
        </div>
        <div className={styles.commandLauncherRail}>
          {GOVERNANCE_COMMANDS.filter((item) => item.plane === plane || ['readiness', 'rollover'].includes(item.key)).slice(0, 6).map((item) => (
            <button key={item.key} type="button" onClick={() => {
              if (item.key === 'readiness' && snapshot.institutions[0]) setActionChamber(createActionChamber('governance.institution.review', snapshot.institutions[0]))
              else if (item.key === 'rollover') setActionChamber(createActionChamber('governance.rollover.preview', null))
              else setStudio(defaultStudio(item.key === 'academic_year' ? 'academic_year' : item.key === 'period' ? 'term' : item.key as GovernanceEntityType))
            }}>
              <Plus size={15} /><span>{item.label}</span><ChevronRight size={15} />
            </button>
          ))}
        </div>
      </section>

      {plane === 'institutions' || initialFocus ? (
        <section className={styles.priorityRunway}>
          <RunwayLane label="Ouverture bloquée" icon={LockKeyhole} tone="critical" matters={matterLanes.activation} onOpen={setSelectedMatter} />
          <RunwayLane label="Décision requise" icon={ClipboardCheck} tone="decision" matters={matterLanes.decision} onOpen={setSelectedMatter} />
          <RunwayLane label="Problème d’organisation" icon={AlertTriangle} tone="warning" matters={matterLanes.conflict} onOpen={setSelectedMatter} />
          <RunwayLane label="Réglage à appliquer" icon={FileClock} tone="active" matters={matterLanes.publication} onOpen={setSelectedMatter} />
        </section>
      ) : null}

      <section className={styles.commandBody} data-expanded={expandedMatrix}>
        <div className={styles.primaryCanvas}>
          <Toolbar search={search} onSearch={setSearch} tone={toneFilter} onTone={setToneFilter} count={plane === 'institutions' ? snapshot.institutions.length : plane === 'academic-structure' ? snapshot.academicYears.length + snapshot.terms.length : plane === 'classes-capacity' ? snapshot.capacities.length : plane === 'subjects' ? snapshot.subjects.length : plane === 'assignments' ? snapshot.assignments.length : plane === 'roles-permissions' ? snapshot.roles.length + snapshot.delegations.length : plane === 'settings' ? snapshot.configurations.length : snapshot.activity.length} />
          {plane === 'institutions' ? <InstitutionsPlane records={filtered(snapshot.institutions)} matters={filteredMatters} onOpen={showEntity} onMatter={setSelectedMatter} onAction={(key, record) => setActionChamber(createActionChamber(key, record))} /> : null}
          {plane === 'academic-structure' ? <AcademicPlane years={filtered(snapshot.academicYears)} terms={filtered(snapshot.terms)} matters={filteredMatters} onOpen={showEntity} onMatter={setSelectedMatter} onAction={(key, record) => setActionChamber(createActionChamber(key, record))} /> : null}
          {plane === 'classes-capacity' ? <CapacityPlane records={filtered(snapshot.capacities)} matters={filteredMatters} onOpen={showEntity} onMatter={setSelectedMatter} onAction={(key, record) => setActionChamber(createActionChamber(key, record))} /> : null}
          {plane === 'subjects' ? <SubjectsPlane records={filtered(snapshot.subjects)} matters={filteredMatters} onOpen={showEntity} onMatter={setSelectedMatter} onAction={(key, record) => setActionChamber(createActionChamber(key, record))} /> : null}
          {plane === 'assignments' ? <AssignmentsPlane records={filtered(snapshot.assignments)} matters={filteredMatters} onOpen={showEntity} onMatter={setSelectedMatter} onAction={(key, record) => setActionChamber(createActionChamber(key, record))} /> : null}
          {plane === 'roles-permissions' ? <AccessPlane roles={filtered(snapshot.roles)} delegations={filtered(snapshot.delegations)} matters={filteredMatters} onOpen={showEntity} onMatter={setSelectedMatter} onAction={(key, record) => setActionChamber(createActionChamber(key, record))} /> : null}
          {plane === 'settings' ? <SettingsPlane records={filtered(snapshot.configurations)} matters={filteredMatters} onOpen={showEntity} onMatter={setSelectedMatter} onAction={(key, record) => setActionChamber(createActionChamber(key, record))} /> : null}
          {plane === 'audit' ? <AuditPlane events={snapshot.activity} onOpen={(event) => {
            const record = allEntities.find((item) => item.id === event.entityId)
            if (record) showEntity(record)
          }} /> : null}
        </div>

        <aside className={styles.intelligenceRail}>
          <div className={styles.railSection}>
            <div className={styles.railHeader}><CircleGauge size={17} /><strong>État de préparation</strong></div>
            <div className={styles.readinessGauge} data-tone={snapshot.institutions[0]?.readinessState === 'ready' ? 'verified' : snapshot.institutions[0]?.readinessState === 'blocked' ? 'critical' : 'warning'}>
              <div><strong>{snapshot.institutions[0]?.readinessPassed || 0}</strong><span>/ {snapshot.institutions[0]?.readinessRequired || 0}</span></div>
              <p>{snapshot.institutions[0]?.readinessState ? schoolStatusLabel(snapshot.institutions[0].readinessState) : 'À configurer'}</p>
            </div>
            <button type="button" className={styles.railAction} onClick={() => snapshot.institutions[0] && setActionChamber(createActionChamber('governance.institution.review', snapshot.institutions[0]))}><ClipboardCheck size={16} /> Vérifier ce qu’il reste à compléter</button>
          </div>
          <div className={styles.railSection}>
            <div className={styles.railHeader}><Target size={17} /><strong>À traiter ensuite</strong></div>
            {activeMatters.slice(0, 5).map((matter) => (
              <button key={matter.fingerprint} type="button" className={styles.railMatter} data-tone={matter.tone} onClick={() => setSelectedMatter(matter)}>
                <span /><div><strong>{matter.title}</strong><small>{matter.sourceLabel}</small></div><ChevronRight size={15} />
              </button>
            ))}
            {!activeMatters.length ? <div className={styles.railEmpty}><BadgeCheck size={18} />Aucun dossier à traiter.</div> : null}
          </div>
          <div className={styles.railSection}>
            <div className={styles.railHeader}><History size={17} /><strong>Derniers changements</strong></div>
            {snapshot.activity.slice(0, 5).map((event) => (
              <div key={event.id} className={styles.railEvent}><span data-tone={event.tone} /><div><strong>{event.label}</strong><small>{formatDate(event.createdAt)}</small></div></div>
            ))}
          </div>
        </aside>
      </section>

      {selectedMatter ? (
        <MatterDrawer
          matter={selectedMatter}
          reason={matterReason}
          assignee={matterAssignee}
          dueAt={matterDueAt}
          busyKey={busyKey}
          onReason={setMatterReason}
          onAssignee={setMatterAssignee}
          onDueAt={setMatterDueAt}
          onAction={runMatterAction}
          onClose={closeDrawer}
          onFocus={() => setSelectedMatter({ ...selectedMatter, metadata: { ...selectedMatter.metadata, focus: true } })}
        />
      ) : null}

      {selectedEntity ? (
        <EntityDrawer
          selection={selectedEntity}
          matters={selectedEntityMatters}
          onClose={closeDrawer}
          onMode={(mode) => setSelectedEntity({ ...selectedEntity, mode })}
          onMatter={setSelectedMatter}
          onAction={(key) => setActionChamber(createActionChamber(key, selectedEntity.record))}
        />
      ) : null}

      {studio ? <CommandStudioModal studio={studio} snapshot={snapshot} busy={busyKey === `create:${studio.entityType}`} onChange={setStudio} onSubmit={createEntity} onClose={() => setStudio(null)} /> : null}
      {actionChamber ? <ActionChamberModal state={actionChamber} snapshot={snapshot} busy={busyKey === `entity:${actionChamber.operationKey}`} onChange={setActionChamber} onSubmit={runEntityAction} onClose={() => setActionChamber(null)} /> : null}
      {briefingOpen ? <BriefingModal type={briefingType} briefings={snapshot.briefings} busy={busyKey === `briefing:${briefingType}`} onType={setBriefingType} onGenerate={generateBriefing} onClose={() => setBriefingOpen(false)} /> : null}

      {toast ? <CustomerOverlayPortal><div className={styles.toast} data-kind={toast.kind}><span>{toast.kind === 'success' ? <CheckCheck size={18} /> : toast.kind === 'warning' ? <AlertTriangle size={18} /> : <X size={18} />}</span><strong>{toast.message}</strong></div></CustomerOverlayPortal> : null}
    </main>
  )
}

function Toolbar({ search, onSearch, tone, onTone, count }: { search: string; onSearch: (value: string) => void; tone: 'all' | GovernanceTone; onTone: (value: 'all' | GovernanceTone) => void; count: number }) {
  return (
    <div className={styles.toolbar}>
      <label className={styles.searchField}><Search size={17} /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Rechercher institution, structure, classe, rôle…" /></label>
      <select value={tone} onChange={(event) => onTone(event.target.value as 'all' | GovernanceTone)}>
        <option value="all">Tous les états</option>
        {Object.entries(TONE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
      <div className={styles.resultCount}>{count} résultat(s)</div>
    </div>
  )
}

function RunwayLane({ label, icon: Icon, tone, matters, onOpen }: { label: string; icon: LucideIcon; tone: GovernanceTone; matters: GovernanceMatter[]; onOpen: (matter: GovernanceMatter) => void }) {
  return (
    <article className={styles.runwayLane} data-tone={tone}>
      <header><span><Icon size={17} />{label}</span><strong>{matters.length}</strong></header>
      <div className={styles.runwayItems}>
        {matters.slice(0, 4).map((matter) => (
          <button key={matter.fingerprint} type="button" className={styles.runwayItem} onClick={() => onOpen(matter)}>
            <span className={styles.runwaySeverity} data-tone={matter.tone} />
            <div><strong>{matter.title}</strong><small>{matter.sourceLabel} · {relativeDate(matter.dueAt)}</small></div>
            <ChevronRight size={16} />
          </button>
        ))}
        {!matters.length ? <div className={styles.runwayEmpty}><BadgeCheck size={17} />Aucun élément actif</div> : null}
      </div>
    </article>
  )
}

function InstitutionsPlane({ records, matters, onOpen, onMatter, onAction }: { records: GovernanceInstitutionRecord[]; matters: GovernanceMatter[]; onOpen: (record: GovernanceEntityRecord, mode?: SelectedEntity['mode']) => void; onMatter: (matter: GovernanceMatter) => void; onAction: (key: GovernanceOperationKey, record: GovernanceEntityRecord) => void }) {
  return (
    <div className={styles.planeStack}>
      <section className={styles.topologyPanel}>
        <div className={styles.panelHeading}><div><span>Topologie institutionnelle</span><h3>Architecture opérationnelle active</h3></div><Network size={22} /></div>
        {records.map((record) => (
          <div key={record.id} className={styles.institutionTopology}>
            <button type="button" className={styles.topologyRoot} data-tone={record.tone} onClick={() => onOpen(record, 'dossier')}>
              <Building2 size={24} /><div><strong>{record.title}</strong><small>{record.code} · {record.city || 'Ville non définie'}</small></div><span>{schoolStatusLabel(record.lifecycleState)}</span>
            </button>
            <div className={styles.topologyBranches}>
              <button type="button" onClick={() => onOpen(record)}><Layers3 size={18} /><strong>{record.metrics.find((item) => item.label === 'Sites')?.value || 0}</strong><span>Sites</span></button>
              <button type="button" onClick={() => onOpen(record)}><GraduationCap size={18} /><strong>{record.activeStudents}</strong><span>Élèves</span></button>
              <button type="button" onClick={() => onOpen(record)}><Boxes size={18} /><strong>{record.classCapacity}</strong><span>Capacité</span></button>
              <button type="button" onClick={() => onAction('governance.institution.review', record)}><ClipboardCheck size={18} /><strong>{record.readinessPassed}/{record.readinessRequired}</strong><span>Préparation</span></button>
              <button type="button" onClick={() => onOpen(record)}><AlertTriangle size={18} /><strong>{record.findings}</strong><span>À traiter</span></button>
            </div>
          </div>
        ))}
      </section>
      <section className={styles.matrixPanel}>
        <div className={styles.panelHeading}><div><span>Suivi des établissements</span><h3>Étape, préparation et prochaine action</h3></div><TableProperties size={21} /></div>
        <div className={styles.enterpriseTable}>
          <div className={styles.tableHeader}><span>Institution</span><span>Étape</span><span>Préparation</span><span>Élèves</span><span>Capacité</span><span>À traiter</span><span>Action</span></div>
          {records.map((record) => (
            <div key={record.id} role="button" tabIndex={0} className={styles.tableRow} onClick={() => onOpen(record)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onOpen(record) }}>
              <span><strong>{record.title}</strong><small>{record.code} · {record.city || '—'}</small></span>
              <span><StatusPill tone={record.tone} label={schoolStatusLabel(record.lifecycleState)} /></span>
              <span><strong>{record.readinessPassed}/{record.readinessRequired}</strong><small>{schoolStatusLabel(record.readinessState)}</small></span>
              <span>{record.activeStudents}</span><span>{record.classCapacity}</span><span>{record.findings}</span>
              <span className={styles.inlineActions}><button type="button" onClick={(event) => { event.stopPropagation(); onAction(record.status === 'active' ? 'governance.institution.suspend' : 'governance.institution.activate', record) }}>{record.status === 'active' ? 'Suspendre' : 'Activer'}</button><ChevronRight size={16} /></span>
            </div>
          ))}
        </div>
      </section>
      <MatterStrip matters={matters.filter((matter) => matter.category === 'activation')} onOpen={onMatter} />
    </div>
  )
}

function AcademicPlane({ years, terms, matters, onOpen, onMatter, onAction }: { years: GovernanceAcademicYearRecord[]; terms: GovernanceEntityRecord[]; matters: GovernanceMatter[]; onOpen: (record: GovernanceEntityRecord, mode?: SelectedEntity['mode']) => void; onMatter: (matter: GovernanceMatter) => void; onAction: (key: GovernanceOperationKey, record: GovernanceEntityRecord | null) => void }) {
  return (
    <div className={styles.planeStack}>
      <section className={styles.yearRunway}>
        {years.map((year, index) => (
          <button key={year.id} type="button" className={styles.yearCard} data-current={year.isCurrent} data-tone={year.tone} onClick={() => onOpen(year)}>
            <div className={styles.yearSequence}>{String(index + 1).padStart(2, '0')}</div>
            <div><small>{year.code}</small><h3>{year.title}</h3><p>{formatDate(year.startsOn)} → {formatDate(year.endsOn)}</p></div>
            <div className={styles.yearMetrics}><span><strong>{year.termCount}</strong>Périodes</span><span><strong>{year.classCount}</strong>Classes</span><span><strong>{year.studentCount}</strong>Élèves</span></div>
            <StatusPill tone={year.tone} label={year.lifecycleState} />
          </button>
        ))}
      </section>
      <section className={styles.splitPanels}>
        <article className={styles.matrixPanel}>
          <div className={styles.panelHeading}><div><span>Calendrier académique</span><h3>Périodes et états effectifs</h3></div><CalendarRange size={21} /></div>
          <div className={styles.periodTimeline}>
            {terms.map((term, index) => (
              <button key={term.id} type="button" onClick={() => onOpen(term)}>
                <span className={styles.timelineIndex}>{String(index + 1).padStart(2, '0')}</span>
                <div><strong>{term.title}</strong><small>{term.subtitle}</small></div>
                <StatusPill tone={term.tone} label={term.lifecycleState} />
              </button>
            ))}
            {!terms.length ? <EmptyMessage icon={CalendarRange} title="Aucune période configurée" detail="Créez les périodes avant de publier la structure." /> : null}
          </div>
        </article>
        <article className={styles.rolloverPanel}>
          <div className={styles.panelHeading}><div><span>Passage à l’année suivante</span><h3>Préparer les classes et les enfants pour la prochaine année</h3></div><GitBranch size={21} /></div>
          <div className={styles.rolloverFlow}><span>Classes de destination</span><ArrowRight size={17} /><span>Propositions</span><ArrowRight size={17} /><span>Dossiers à vérifier</span><ArrowRight size={17} /><span>Mise à jour</span></div>
          <div className={styles.rolloverStats}><div><strong>{years[0]?.studentCount || 0}</strong><span>Enfants concernés</span></div><div><strong>{matters.filter((item) => item.category === 'rollover').length}</strong><span>Dossiers à vérifier</span></div><div><strong>{years[0]?.closureBlockers || 0}</strong><span>À régler avant clôture</span></div></div>
          <button type="button" className={styles.primaryButton} onClick={() => onAction('governance.rollover.preview', null)}><GitBranch size={17} /> Préparer le passage à l’année suivante</button>
        </article>
      </section>
      <section className={styles.matrixPanel}>
        <div className={styles.panelHeading}><div><span>Années scolaires</span><h3>Publication, activation et clôture</h3></div><BookCopy size={21} /></div>
        <div className={styles.enterpriseTable}>
          <div className={styles.tableHeader}><span>Année</span><span>Dates</span><span>Structure</span><span>Population</span><span>À corriger</span><span>État</span><span>Action</span></div>
          {years.map((year) => (
            <div key={year.id} role="button" tabIndex={0} className={styles.tableRow} onClick={() => onOpen(year)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onOpen(year) }}>
              <span><strong>{year.title}</strong><small>{year.code}</small></span><span>{formatDate(year.startsOn)}<small>{formatDate(year.endsOn)}</small></span><span>{year.termCount} périodes<small>{year.classCount} classes</small></span><span>{year.studentCount}</span><span>{year.closureBlockers}</span><span><StatusPill tone={year.tone} label={year.lifecycleState} /></span>
              <span className={styles.inlineActions}><button type="button" onClick={(event) => { event.stopPropagation(); onAction(year.status === 'active' ? 'governance.academic_year.close' : 'governance.academic_year.activate', year) }}>{year.status === 'active' ? 'Clôturer' : 'Activer'}</button><ChevronRight size={16} /></span>
            </div>
          ))}
        </div>
      </section>
      <MatterStrip matters={matters.filter((matter) => ['academic_structure', 'rollover', 'closure'].includes(matter.category))} onOpen={onMatter} />
    </div>
  )
}

function CapacityPlane({ records, matters, onOpen, onMatter, onAction }: { records: GovernanceCapacityRecord[]; matters: GovernanceMatter[]; onOpen: (record: GovernanceEntityRecord, mode?: SelectedEntity['mode']) => void; onMatter: (matter: GovernanceMatter) => void; onAction: (key: GovernanceOperationKey, record: GovernanceEntityRecord) => void }) {
  const classes = records.filter((item) => item.type === 'class')
  return (
    <div className={styles.planeStack}>
      <section className={styles.capacityBand}>
        <div><strong>{classes.reduce((sum, item) => sum + item.targetCapacity, 0)}</strong><span>Capacité déclarée</span></div>
        <div><strong>{classes.reduce((sum, item) => sum + item.currentStudents, 0)}</strong><span>Élèves actifs</span></div>
        <div><strong>{classes.reduce((sum, item) => sum + item.availableSeats, 0)}</strong><span>Places disponibles</span></div>
        <div data-tone="critical"><strong>{classes.filter((item) => item.conflictState === 'overcapacity').length}</strong><span>Surcapacités</span></div>
        <div data-tone="warning"><strong>{classes.reduce((sum, item) => sum + item.waitingAdmissions, 0)}</strong><span>Admissions en attente</span></div>
      </section>
      <section className={styles.matrixPanel}>
        <div className={styles.panelHeading}><div><span>Matrice capacité</span><h3>Occupation, réservations et projection</h3></div><Boxes size={21} /></div>
        <div className={styles.enterpriseTable}>
          <div className={styles.tableHeader}><span>Structure</span><span>Type</span><span>Occupation</span><span>Utilisation</span><span>Réservé</span><span>Disponible</span><span>Intervention</span></div>
          {records.map((record) => (
            <div key={recordIdentity(record)} role="button" tabIndex={0} className={styles.tableRow} data-tone={record.tone} onClick={() => onOpen(record)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onOpen(record) }}>
              <span><strong>{record.title}</strong><small>{record.code} · {record.level || record.subtitle}</small></span><span>{record.type === 'class' ? 'Classe' : 'Section'}</span><span>{record.currentStudents}/{record.targetCapacity}</span>
              <span><div className={styles.utilizationBar}><i style={{ width: `${Math.min(100, record.utilizationPercent)}%` }} data-tone={record.tone} /></div><small>{record.utilizationPercent}%</small></span><span>{record.reservedSeats}</span><span>{record.availableSeats}</span>
              <span className={styles.inlineActions}><button type="button" onClick={(event) => { event.stopPropagation(); onAction('governance.capacity.change', record) }}>Ajuster</button><ChevronRight size={16} /></span>
            </div>
          ))}
        </div>
      </section>
      <MatterStrip matters={matters.filter((matter) => matter.category === 'capacity')} onOpen={onMatter} />
    </div>
  )
}

function SubjectsPlane({ records, matters, onOpen, onMatter, onAction }: { records: GovernanceSubjectRecord[]; matters: GovernanceMatter[]; onOpen: (record: GovernanceEntityRecord, mode?: SelectedEntity['mode']) => void; onMatter: (matter: GovernanceMatter) => void; onAction: (key: GovernanceOperationKey, record: GovernanceEntityRecord) => void }) {
  return (
    <div className={styles.planeStack}>
      <section className={styles.subjectGrid}>
        {records.map((record) => (
          <button key={record.id} type="button" className={styles.subjectCard} data-tone={record.tone} onClick={() => onOpen(record)}>
            <div className={styles.subjectIcon}><BookOpenCheck size={21} /></div>
            <div><small>{record.code} · V{record.versionNumber}</small><h3>{record.title}</h3><p>{record.department || 'Département non défini'}</p></div>
            <div className={styles.subjectMetrics}><span><strong>{record.linkedClasses}</strong>Classes</span><span><strong>{record.teacherAssignments}</strong>Affectations</span></div>
            <StatusPill tone={record.tone} label={record.coverageState} />
          </button>
        ))}
      </section>
      <section className={styles.matrixPanel}>
        <div className={styles.panelHeading}><div><span>Couverture pédagogique</span><h3>Matières, classes et enseignants</h3></div><BookOpenCheck size={21} /></div>
        <div className={styles.enterpriseTable}>
          <div className={styles.tableHeader}><span>Matière</span><span>Département</span><span>Classes</span><span>Affectations</span><span>Version</span><span>Couverture</span><span>Action</span></div>
          {records.map((record) => (
            <div key={record.id} role="button" tabIndex={0} className={styles.tableRow} onClick={() => onOpen(record)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onOpen(record) }}><span><strong>{record.title}</strong><small>{record.code}</small></span><span>{record.department || '—'}</span><span>{record.linkedClasses}</span><span>{record.teacherAssignments}</span><span>V{record.versionNumber}</span><span><StatusPill tone={record.tone} label={record.coverageState} /></span><span className={styles.inlineActions}><button type="button" onClick={(event) => { event.stopPropagation(); onAction(record.status === 'active' ? 'governance.subject.retire' : 'governance.subject.publish', record) }}>{record.status === 'active' ? 'Retirer' : 'Publier'}</button><ChevronRight size={16} /></span></div>
          ))}
        </div>
      </section>
      <MatterStrip matters={matters.filter((matter) => matter.category === 'subject_coverage')} onOpen={onMatter} />
    </div>
  )
}

function AssignmentsPlane({ records, matters, onOpen, onMatter, onAction }: { records: GovernanceAssignmentRecord[]; matters: GovernanceMatter[]; onOpen: (record: GovernanceEntityRecord, mode?: SelectedEntity['mode']) => void; onMatter: (matter: GovernanceMatter) => void; onAction: (key: GovernanceOperationKey, record: GovernanceEntityRecord) => void }) {
  const byTeacher = new Map<string, GovernanceAssignmentRecord[]>()
  for (const record of records) byTeacher.set(record.staffLabel, [...(byTeacher.get(record.staffLabel) || []), record])
  return (
    <div className={styles.planeStack}>
      <section className={styles.workloadGrid}>
        {[...byTeacher.entries()].slice(0, 12).map(([teacher, assignments]) => (
          <button key={teacher} type="button" className={styles.workloadCard} data-tone={assignments.some((item) => item.conflictCount) ? 'critical' : 'verified'} onClick={() => onOpen(assignments[0])}>
            <div className={styles.avatarToken}>{teacher.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div>
            <div><strong>{teacher}</strong><small>{assignments.length} affectation(s)</small></div>
            <div><strong>{assignments.reduce((sum, item) => sum + item.weeklyHours, 0)} h</strong><small>Charge configurée</small></div>
            <StatusPill tone={assignments.some((item) => item.conflictCount) ? 'critical' : 'verified'} label={assignments.some((item) => item.conflictCount) ? 'Conflit' : 'Couvert'} />
          </button>
        ))}
      </section>
      <section className={styles.matrixPanel}>
        <div className={styles.panelHeading}><div><span>Matrice affectations</span><h3>Enseignant, classe, matière et charge</h3></div><UserCheck size={21} /></div>
        <div className={styles.enterpriseTable}>
          <div className={styles.tableHeader}><span>Enseignant</span><span>Classe</span><span>Matière</span><span>Section</span><span>Charge</span><span>État</span><span>Action</span></div>
          {records.map((record) => (
            <div key={record.id} role="button" tabIndex={0} className={styles.tableRow} onClick={() => onOpen(record)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onOpen(record) }}><span><strong>{record.staffLabel}</strong><small>{record.code}</small></span><span>{record.classLabel || '—'}</span><span>{record.subjectLabel || '—'}</span><span>{record.sectionLabel || '—'}</span><span>{record.weeklyHours} h</span><span><StatusPill tone={record.tone} label={record.conflictCount ? `${record.conflictCount} conflit` : record.lifecycleState} /></span><span className={styles.inlineActions}><button type="button" onClick={(event) => { event.stopPropagation(); onAction(record.conflictCount ? 'governance.assignment.replace' : 'governance.assignment.end', record) }}>{record.conflictCount ? 'Résoudre' : 'Terminer'}</button><ChevronRight size={16} /></span></div>
          ))}
        </div>
      </section>
      <MatterStrip matters={matters.filter((matter) => matter.category === 'assignment')} onOpen={onMatter} />
    </div>
  )
}

function AccessPlane({ roles, delegations, matters, onOpen, onMatter, onAction }: { roles: GovernanceRoleRecord[]; delegations: GovernanceDelegationRecord[]; matters: GovernanceMatter[]; onOpen: (record: GovernanceEntityRecord, mode?: SelectedEntity['mode']) => void; onMatter: (matter: GovernanceMatter) => void; onAction: (key: GovernanceOperationKey, record: GovernanceEntityRecord) => void }) {
  return (
    <div className={styles.planeStack}>
      <section className={styles.roleGrid}>
        {roles.map((role) => (
          <button key={role.id} type="button" className={styles.roleCard} data-tone={role.tone} onClick={() => onOpen(role)}>
            <div className={styles.roleHeader}><ShieldCheck size={21} /><StatusPill tone={role.tone} label={role.lifecycleState} /></div>
            <h3>{role.title}</h3><p>{role.subtitle}</p>
            <div className={styles.roleMetrics}><span><strong>{role.permissionCount}</strong>Permissions</span><span><strong>{role.userCount}</strong>Utilisateurs</span><span><strong>{role.sensitivePermissionCount}</strong>Sensibles</span></div>
            <div className={styles.roleFooter}><span>{role.scope} · V{role.versionNumber}</span><ChevronRight size={16} /></div>
          </button>
        ))}
      </section>
      <section className={styles.splitPanels}>
        <article className={styles.matrixPanel}>
          <div className={styles.panelHeading}><div><span>Permission impact</span><h3>Exposition et utilisateurs</h3></div><KeyRound size={21} /></div>
          <div className={styles.enterpriseTable}>
            <div className={styles.tableHeader}><span>Rôle</span><span>Périmètre</span><span>Utilisateurs</span><span>Permissions</span><span>Sensibles</span><span>Version</span><span>Publier</span></div>
            {roles.map((role) => <div key={role.id} role="button" tabIndex={0} className={styles.tableRow} onClick={() => onOpen(role)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onOpen(role) }}><span><strong>{role.title}</strong><small>{role.roleKey}</small></span><span>{role.scope}</span><span>{role.userCount}</span><span>{role.permissionCount}</span><span>{role.sensitivePermissionCount}</span><span>V{role.versionNumber}</span><span className={styles.inlineActions}><button type="button" onClick={(event) => { event.stopPropagation(); onAction('governance.role.publish', role) }}>Vérifier les effets</button><ChevronRight size={16} /></span></div>)}
          </div>
        </article>
        <article className={styles.matrixPanel}>
          <div className={styles.panelHeading}><div><span>Délégations</span><h3>Actions temporaires</h3></div><UserCog size={21} /></div>
          <div className={styles.delegationList}>
            {delegations.map((delegation) => <button key={delegation.id} type="button" data-tone={delegation.tone} onClick={() => onOpen(delegation)}><div><strong>{delegation.userLabel}</strong><small>{delegation.roleLabel} · {delegation.scopeType}</small></div><span>{formatDate(delegation.endsAt)}</span><StatusPill tone={delegation.tone} label={schoolStatusLabel(delegation.status)} /></button>)}
            {!delegations.length ? <EmptyMessage icon={UserCog} title="Aucune délégation" detail="Créez une autorité temporaire bornée et révisable." /> : null}
          </div>
        </article>
      </section>
      <MatterStrip matters={matters.filter((matter) => matter.category === 'access')} onOpen={onMatter} />
    </div>
  )
}

function SettingsPlane({ records, matters, onOpen, onMatter, onAction }: { records: GovernanceConfigurationRecord[]; matters: GovernanceMatter[]; onOpen: (record: GovernanceEntityRecord, mode?: SelectedEntity['mode']) => void; onMatter: (matter: GovernanceMatter) => void; onAction: (key: GovernanceOperationKey, record: GovernanceEntityRecord) => void }) {
  return (
    <div className={styles.planeStack}>
      <section className={styles.configurationArchitecture}>
        <div className={styles.ownershipColumn}><strong>Géré par AngelCare</strong><span>Non modifiable par le tenant</span><LockKeyhole size={20} /></div>
        <ArrowRight size={18} />
        <div className={styles.ownershipColumn} data-active><strong>Géré par l’école</strong><span>Modifications préparées, vérifiées puis appliquées</span><Settings2 size={20} /></div>
        <ArrowRight size={18} />
        <div className={styles.ownershipColumn}><strong>Modifiable par l’établissement</strong><span>Périmètre local délégué</span><Building2 size={20} /></div>
        <ArrowRight size={18} />
        <div className={styles.ownershipColumn}><strong>Calculé automatiquement</strong><span>Information en lecture seule</span><Zap size={20} /></div>
      </section>
      <section className={styles.matrixPanel}>
        <div className={styles.panelHeading}><div><span>Configuration registry</span><h3>Changesets, versions et effective dates</h3></div><Settings2 size={21} /></div>
        <div className={styles.enterpriseTable}>
          <div className={styles.tableHeader}><span>Configuration</span><span>Responsable du réglage</span><span>Version</span><span>Changements</span><span>Date prévue</span><span>État</span><span>Action</span></div>
          {records.map((record) => <div key={record.id} role="button" tabIndex={0} className={styles.tableRow} onClick={() => onOpen(record)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onOpen(record) }}><span><strong>{record.title}</strong><small>{record.configurationKey}</small></span><span>{record.ownership}</span><span>V{record.versionNumber}</span><span>{record.changeCount}</span><span>{formatDate(record.effectiveFrom)}</span><span><StatusPill tone={record.tone} label={schoolStatusLabel(record.lifecycleState)} /></span><span className={styles.inlineActions}><button type="button" disabled={record.ownership === 'operator' || record.ownership === 'derived'} onClick={(event) => { event.stopPropagation(); onAction(record.status === 'published' ? 'governance.configuration.rollback' : 'governance.configuration.publish', record) }}>{record.status === 'published' ? 'Revenir en arrière' : 'Publier'}</button><ChevronRight size={16} /></span></div>)}
          {!records.length ? <EmptyMessage icon={Settings2} title="Aucune modification préparée" detail="Préparez un changement, vérifiez ce qu’il modifiera puis choisissez sa date d’application." /> : null}
        </div>
      </section>
      <MatterStrip matters={matters.filter((matter) => matter.category === 'configuration')} onOpen={onMatter} />
    </div>
  )
}

function AuditPlane({ events, onOpen }: { events: GovernanceCommandSnapshot['activity']; onOpen: (event: GovernanceCommandSnapshot['activity'][number]) => void }) {
  return (
    <section className={styles.auditTimeline}>
      <div className={styles.auditRail} />
      {events.map((event) => (
        <button key={event.id} type="button" className={styles.auditEvent} data-tone={event.tone} onClick={() => onOpen(event)}>
          <span className={styles.auditDot} />
          <div className={styles.auditWhen}><strong>{formatDate(event.createdAt)}</strong><small>{new Date(event.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</small></div>
          <div><strong>{event.label}</strong><p>{event.detail || 'Événement institutionnel audité.'}</p><small>{event.actorLabel || 'Acteur non renseigné'}</small></div>
          <ChevronRight size={17} />
        </button>
      ))}
      {!events.length ? <EmptyMessage icon={History} title="Aucune activité récente" detail="Les mutations institutionnelles apparaîtront ici." /> : null}
    </section>
  )
}

function MatterStrip({ matters, onOpen }: { matters: GovernanceMatter[]; onOpen: (matter: GovernanceMatter) => void }) {
  if (!matters.length) return null
  return (
    <section className={styles.matterStrip}>
      <div className={styles.panelHeading}><div><span>Dossiers liés à cette vue</span><h3>Éléments qui demandent votre attention</h3></div><AlertTriangle size={21} /></div>
      <div className={styles.matterStripGrid}>{matters.slice(0, 8).map((matter) => <button key={matter.fingerprint} type="button" data-tone={matter.tone} onClick={() => onOpen(matter)}><span /><div><strong>{matter.title}</strong><small>{matter.summary}</small></div><StatusPill tone={matter.tone} label={schoolStatusLabel(matter.state)} /><ChevronRight size={16} /></button>)}</div>
    </section>
  )
}

function StatusPill({ tone, label }: { tone: GovernanceTone; label: string }) {
  return <span className={styles.statusPill} data-tone={tone}>{schoolStatusLabel(label)}</span>
}

function EmptyMessage({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
  return <div className={styles.emptyMessage}><Icon size={24} /><strong>{title}</strong><span>{detail}</span></div>
}

function MatterDrawer({ matter, reason, assignee, dueAt, busyKey, onReason, onAssignee, onDueAt, onAction, onClose, onFocus }: { matter: GovernanceMatter; reason: string; assignee: string; dueAt: string; busyKey: string | null; onReason: (value: string) => void; onAssignee: (value: string) => void; onDueAt: (value: string) => void; onAction: (action: GovernanceMatterAction) => void; onClose: () => void; onFocus: () => void }) {
  const focus = Boolean(matter.metadata.focus)
  const [view, setView] = useState<'situation' | 'actions' | 'details'>('situation')
  const recommended = matter.availableActions.find((action) => ['request_evidence', 'verify', 'take_ownership', 'assign', 'resolve', 'escalate_direction'].includes(action)) || matter.availableActions[0]
  const consequence = matter.impact.operational || (matter.state === 'waiting_evidence' ? 'Le dossier restera en attente tant que le document nécessaire ne sera pas ajouté.' : 'Le dossier restera dans la liste à traiter tant qu’aucune action n’est confirmée.')
  const attentionItems = matter.availableActions.slice(0, 5).map((action) => ({
    key: action,
    label: MATTER_ACTION_LABELS[action],
    detail: action === 'request_evidence' ? 'Précisez le document attendu et la personne qui doit le fournir.' : action === 'assign' ? 'Choisissez la personne responsable et une échéance réaliste.' : action === 'resolve' ? 'Le système vérifiera que le problème d’origine est réellement réglé.' : 'Cette action restera enregistrée dans l’historique du dossier.',
    tone: action === 'resolve' || action === 'verify' ? 'success' as const : action === 'escalate_direction' ? 'approval' as const : 'warning' as const,
    actionLabel: MATTER_ACTION_LABELS[action],
    onAction: () => onAction(action),
  }))
  return (
    <CustomerOverlaySurface kind={focus ? 'focus-command' : 'dossier'} onClose={onClose} className={styles.drawerOverlay} ariaLabel={matter.title}>
      <aside className={styles.matterDrawer} data-focus={focus} role="dialog" aria-modal="true" aria-label={matter.title} onMouseDown={(event) => event.stopPropagation()}>
        <SchoolAdminDossierHeader
          eyebrow="Dossier administratif à traiter"
          title={matter.title}
          description={matter.summary}
          status={schoolStatusLabel(matter.state)}
          tone={matter.tone === 'critical' ? 'critical' : matter.tone === 'warning' ? 'warning' : matter.tone === 'verified' ? 'success' : matter.tone === 'decision' ? 'approval' : 'info'}
          context={<SchoolAdminBreadcrumb items={[{ key: 'administration', label: 'Administration' }, { key: 'category', label: humanizeTechnicalLabel(matter.category) }, { key: 'matter', label: matter.title }]} />}
        >
          <button type="button" className={styles.iconButton} onClick={onFocus} title="Agrandir le dossier"><Maximize2 size={18} /></button>
          <button type="button" className={styles.iconButton} onClick={onClose} title="Fermer"><X size={19} /></button>
        </SchoolAdminDossierHeader>
        <SchoolAdminAssignmentPanel owner={matter.ownerLabel} dueAt={matter.dueAt ? formatDate(matter.dueAt) : null} updatedAt={formatDate(matter.updatedAt)} nextStep={recommended ? MATTER_ACTION_LABELS[recommended] : 'Vérifier le dossier'} />
        <div className={styles.drawerTabs} role="tablist" aria-label="Contenu du dossier">
          <button type="button" data-active={view === 'situation' || undefined} onClick={() => setView('situation')}>Ce qu’il faut savoir</button>
          <button type="button" data-active={view === 'actions' || undefined} onClick={() => setView('actions')}>À faire</button>
          <button type="button" data-active={view === 'details' || undefined} onClick={() => setView('details')}>Dossier complet</button>
        </div>
        <div className={styles.drawerHumanBody}>
          {view === 'situation' ? <>
            <SchoolAdminSituationSummary summary={matter.summary} reason={`Ce dossier apparaît parce que « ${matter.sourceLabel} » nécessite une vérification ou une décision.`} consequence={consequence} tone={matter.tone === 'critical' ? 'critical' : matter.tone === 'warning' ? 'warning' : 'info'} />
            <SchoolAdminImpactPreview title="Personnes et éléments concernés" items={[
              { key: 'institutions', label: 'Établissements concernés', value: String(matter.impact.institutions) },
              { key: 'students', label: 'Enfants concernés', value: String(matter.impact.students) },
              { key: 'staff', label: 'Membres de l’équipe concernés', value: String(matter.impact.staff) },
              { key: 'classes', label: 'Classes concernées', value: String(matter.impact.classes) },
            ]} tone={matter.tone === 'critical' ? 'critical' : 'info'} />
            {recommended ? <SchoolAdminNextAction config={{ title: MATTER_ACTION_LABELS[recommended], detail: 'Vous pouvez effectuer cette action ici sans quitter le dossier.', label: MATTER_ACTION_LABELS[recommended], onAction: () => { setView('actions'); if (recommended === 'acknowledge' || recommended === 'take_ownership' || recommended === 'verify') onAction(recommended) }, tone: recommended === 'escalate_direction' ? 'approval' : 'warning' }} /> : <SchoolAdminEmptyState title="Aucune action nécessaire" detail="Ce dossier ne demande aucune intervention pour le moment." />}
          </> : null}
          {view === 'actions' ? <>
            <SchoolAdminAttentionBlock items={attentionItems} />
            <section className={styles.actionWorkbench}>
              <div className={styles.sectionTitle}><Command size={18} /><div><strong>Informations utiles pour l’action</strong><span>Ajoutez uniquement ce qui aide la personne chargée du dossier.</span></div></div>
              <div className={styles.actionInputs}><label><span>Note, motif ou document attendu</span><textarea value={reason} onChange={(event) => onReason(event.target.value)} placeholder="Expliquez clairement ce qui doit être vérifié ou corrigé…" /></label><label><span>Attribuer à</span><input value={assignee} onChange={(event) => onAssignee(event.target.value)} placeholder="Nom de la personne responsable" /></label><label><span>À terminer avant</span><input type="datetime-local" value={dueAt} onChange={(event) => onDueAt(event.target.value)} /></label></div>
            </section>
          </> : null}
          {view === 'details' ? <>
            <section className={styles.drawerSection}>
              <div className={styles.sectionTitle}><Layers3 size={18} /><div><strong>Dossiers concernés</strong><span>Ouvrez directement la fiche qui a créé cette alerte.</span></div></div>
              <div className={styles.linkedRecords}>{matter.linkedRecords.map((record) => <Link key={`${record.type}:${record.id}`} href={record.exactHref}><div><strong>{record.label}</strong><small>{record.secondary || schoolEntityLabel(record.type)}</small></div><StatusPill tone={record.status === 'active' ? 'verified' : 'neutral'} label={schoolStatusLabel(record.status || 'open')} /><CornerUpRight size={16} /></Link>)}{!matter.linkedRecords.length ? <SchoolAdminEmptyState title="Aucun autre dossier lié" detail="Toutes les informations utiles sont déjà réunies ici." compact /> : null}</div>
            </section>
            <section className={styles.drawerSection}>
              <div className={styles.sectionTitle}><History size={18} /><div><strong>Historique des actions</strong><span>Qui a fait quoi, et à quel moment.</span></div></div>
              <div className={styles.compactTimeline}>{matter.timeline.map((event) => <div key={event.id}><span data-tone={event.tone} /><div><strong>{event.label}</strong><small>{event.actorLabel || 'Utilisateur'} · {formatDate(event.createdAt)}</small>{event.detail ? <p>{event.detail}</p> : null}</div></div>)}{!matter.timeline.length ? <SchoolAdminEmptyState title="Aucune action enregistrée" detail="La première mise à jour apparaîtra ici." compact /> : null}</div>
            </section>
          </> : null}
        </div>
        <SchoolAdminActionDock note="Les actions restent enregistrées dans l’historique de l’école." secondary={[{ key: 'close', label: 'Fermer', onClick: onClose }]} primary={recommended ? { label: MATTER_ACTION_LABELS[recommended], onClick: () => onAction(recommended), busy: busyKey === `matter:${recommended}` } : undefined} />
      </aside>
    </CustomerOverlaySurface>
  )
}

function EntityDrawer({ selection, matters, onClose, onMode, onMatter, onAction }: { selection: SelectedEntity; matters: GovernanceMatter[]; onClose: () => void; onMode: (mode: SelectedEntity['mode']) => void; onMatter: (matter: GovernanceMatter) => void; onAction: (key: GovernanceOperationKey) => void }) {
  const record = selection.record
  const actions = actionsForEntity(record)
  const [view, setView] = useState<'situation' | 'actions' | 'details'>('situation')
  const recommended = actions[0]
  const openMatters = matters.filter((matter) => !['resolved', 'released', 'cancelled'].includes(matter.state))
  const reason = openMatters.length
    ? `${openMatters.length} élément${openMatters.length > 1 ? 's' : ''} demande${openMatters.length > 1 ? 'nt' : ''} votre attention dans ce dossier.`
    : `Ce dossier regroupe les informations actuellement enregistrées pour ${record.title}.`
  const consequence = openMatters.length
    ? 'Le dossier restera signalé tant que les éléments importants ne seront pas vérifiés ou réglés.'
    : 'Aucune action urgente n’est nécessaire pour le moment.'
  return (
    <CustomerOverlaySurface kind={selection.mode === 'focus' ? 'focus-command' : selection.mode === 'peek' ? 'quick-peek' : 'dossier'} onClose={onClose} className={styles.drawerOverlay} ariaLabel={record.title}>
      <aside className={styles.entityDrawer} data-mode={selection.mode} role="dialog" aria-modal="true" aria-label={record.title} onMouseDown={(event) => event.stopPropagation()}>
        <SchoolAdminDossierHeader
          eyebrow={schoolEntityLabel(record.type)}
          title={record.title}
          description={record.subtitle || `Consultez et mettez à jour ce dossier de l’école.`}
          status={schoolStatusLabel(record.lifecycleState)}
          tone={record.tone === 'critical' ? 'critical' : record.tone === 'warning' ? 'warning' : record.tone === 'verified' ? 'success' : record.tone === 'decision' ? 'approval' : 'info'}
          context={<SchoolAdminBreadcrumb items={[{ key: 'administration', label: 'Administration' }, { key: record.type, label: schoolEntityLabel(record.type) }, { key: record.id, label: record.title }]} />}
        >
          <button type="button" className={styles.iconButton} onClick={() => onMode(selection.mode === 'focus' ? 'dossier' : 'focus')} title={selection.mode === 'focus' ? 'Revenir au dossier' : 'Traiter en détail'}><Maximize2 size={18} /></button>
          <button type="button" className={styles.iconButton} onClick={onClose} title="Fermer"><X size={19} /></button>
        </SchoolAdminDossierHeader>
        <div className={styles.entityCrown}>{record.metrics.map((metric) => <div key={metric.label}><span>{humanizeTechnicalLabel(metric.label)}</span><strong>{metric.value}</strong></div>)}</div>
        <div className={styles.drawerTabs} role="tablist" aria-label="Contenu du dossier">
          <button type="button" data-active={view === 'situation' || undefined} onClick={() => setView('situation')}>Ce qu’il faut savoir</button>
          <button type="button" data-active={view === 'actions' || undefined} onClick={() => setView('actions')}>À faire</button>
          <button type="button" data-active={view === 'details' || undefined} onClick={() => setView('details')}>Dossier complet</button>
        </div>
        <div className={styles.drawerHumanBody}>
          {view === 'situation' ? <>
            <SchoolAdminSituationSummary summary={reason} reason={`Vous consultez la fiche « ${record.title} » dans ${schoolEntityLabel(record.type).toLowerCase()}.`} consequence={consequence} tone={openMatters.some((matter) => matter.tone === 'critical') ? 'critical' : openMatters.length ? 'warning' : 'success'} />
            <SchoolAdminAssignmentPanel owner={String(record.metadata.ownerLabel || record.metadata.responsibleLabel || '') || null} updatedAt={formatDate(record.updatedAt)} nextStep={recommended ? governanceOperationLabel(recommended) : 'Aucune action nécessaire'} />
            {recommended ? <SchoolAdminNextAction config={{ title: governanceOperationLabel(recommended), detail: OPERATION_COPY[recommended]?.description || 'Préparez les informations nécessaires puis confirmez la modification.', label: governanceOperationLabel(recommended), onAction: () => onAction(recommended), tone: record.tone === 'critical' ? 'critical' : 'approval' }} /> : <SchoolAdminEmptyState title="Dossier complet" detail="Aucune action n’est nécessaire pour le moment." />}
          </> : null}
          {view === 'actions' ? <>
            <SchoolAdminAttentionBlock items={openMatters.map((matter) => ({ key: matter.fingerprint, label: matter.title, detail: matter.summary, tone: matter.tone === 'critical' ? 'critical' as const : 'warning' as const, actionLabel: 'Ouvrir ce point', onAction: () => onMatter(matter) }))} emptyTitle="Aucun point en attente" emptyDetail="Ce dossier ne contient aucun élément à vérifier pour le moment." />
            <section className={styles.drawerSection}>
              <div className={styles.sectionTitle}><Command size={18} /><div><strong>Actions possibles</strong><span>Chaque action indique clairement ce qui sera modifié.</span></div></div>
              <div className={styles.entityActions}>{actions.map((action) => <button key={action} type="button" onClick={() => onAction(action)}><Command size={16} />{governanceOperationLabel(action)}</button>)}{!actions.length ? <SchoolAdminEmptyState title="Aucune modification disponible" detail="Votre rôle ou l’état actuel du dossier ne permet pas de modification." compact /> : null}</div>
            </section>
          </> : null}
          {view === 'details' ? <>
            <section className={styles.drawerSection}>
              <div className={styles.sectionTitle}><LayoutDashboard size={18} /><div><strong>Informations du dossier</strong><span>Les informations avancées restent disponibles sans gêner le travail quotidien.</span></div></div>
              <div className={styles.metadataGrid}>{Object.entries(record.metadata).filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value) && value !== '').slice(0, 12).map(([key, value]) => <div key={key}><span>{humanizeTechnicalLabel(key)}</span><strong>{typeof value === 'string' ? schoolStatusLabel(value) : String(value)}</strong></div>)}{!Object.keys(record.metadata).length ? <SchoolAdminEmptyState title="Aucune information complémentaire" detail="Les informations principales sont déjà affichées en haut du dossier." compact /> : null}</div>
            </section>
            <div className={styles.entityActions}><Link href={record.exactHref}><CornerUpRight size={16} />Ouvrir la fiche complète</Link></div>
          </> : null}
        </div>
        <SchoolAdminActionDock note="Les modifications sont enregistrées dans l’historique de l’école." secondary={[{ key: 'close', label: 'Fermer', onClick: onClose }]} primary={recommended ? { label: governanceOperationLabel(recommended), onClick: () => onAction(recommended) } : undefined} />
      </aside>
    </CustomerOverlaySurface>
  )
}

function actionsForEntity(record: GovernanceEntityRecord): GovernanceOperationKey[] {
  if (record.type === 'institution') return record.status === 'active' ? ['governance.institution.review', 'governance.institution.suspend', 'governance.institution.close'] : ['governance.institution.review', 'governance.institution.activate', 'governance.institution.archive']
  if (record.type === 'academic_year') return record.status === 'active' ? ['governance.academic_year.close', 'governance.rollover.preview'] : record.status === 'closed' ? ['governance.academic_year.reopen'] : ['governance.academic_year.publish', 'governance.academic_year.activate']
  if (record.type === 'term') return record.status === 'active' ? ['governance.period.close'] : record.status === 'closed' ? ['governance.period.reopen'] : ['governance.period.publish']
  if (record.type === 'class' || record.type === 'section') return ['governance.capacity.change', 'governance.enrollment.freeze']
  if (record.type === 'subject') return record.status === 'active' ? ['governance.subject.replace', 'governance.subject.retire'] : ['governance.subject.publish']
  if (record.type === 'assignment') return ['governance.assignment.change', 'governance.assignment.replace', 'governance.assignment.end']
  if (record.type === 'role') return ['governance.role.publish', 'governance.role.assign']
  if (record.type === 'delegation') return ['governance.delegation.revoke']
  if (record.type === 'configuration') return record.status === 'published' ? ['governance.configuration.rollback'] : ['governance.configuration.publish']
  return []
}

function CommandStudioModal({ studio, snapshot, busy, onChange, onSubmit, onClose }: { studio: CommandStudio; snapshot: GovernanceCommandSnapshot; busy: boolean; onChange: (state: CommandStudio) => void; onSubmit: () => void; onClose: () => void }) {
  const setValue = (key: string, value: string) => onChange({ ...studio, values: { ...studio.values, [key]: value } })
  const fields = creationFields(studio.entityType, snapshot)
  return (
    <CustomerOverlaySurface kind="nested-command" onClose={onClose} className={styles.modalOverlay} dirty={Object.values(studio.values).some(Boolean)} ariaLabel="Assistant de création">
      <section className={styles.commandStudioModal} role="dialog" aria-modal="true" aria-label="Assistant de création" onMouseDown={(event) => event.stopPropagation()}>
        <header className={styles.modalHeader}><div><div className={styles.eyebrow}>Assistant de création</div><h2>Ajouter un nouvel élément à l’école</h2><p>Choisissez ce que vous souhaitez ajouter, complétez les informations puis vérifiez le résultat avant d’enregistrer.</p></div><button type="button" className={styles.iconButton} onClick={onClose}><X size={19} /></button></header>
        <div className={styles.studioLayout}>
          <aside className={styles.templateRail}>{GOVERNANCE_COMMANDS.map((template) => <button key={template.key} type="button" data-active={studio.templateKey === template.key} onClick={() => onChange(defaultStudio(template.key === 'academic_year' ? 'academic_year' : template.key === 'period' ? 'term' : template.key as GovernanceEntityType))}><span><Command size={16} /></span><div><strong>{template.label}</strong><small>{template.description}</small></div><ChevronRight size={15} /></button>)}</aside>
          <div className={styles.studioForm}><div className={styles.sectionTitle}><Settings2 size={18} /><div><strong>Informations à compléter</strong><span>Les champs s’adaptent à ce que vous souhaitez créer.</span></div></div><div className={styles.formGrid}>{fields.map((field) => <label key={field.key} data-wide={field.wide}><span>{field.label}</span>{field.type === 'select' ? <select value={studio.values[field.key] || ''} onChange={(event) => setValue(field.key, event.target.value)}><option value="">Sélectionner</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.type === 'textarea' ? <textarea value={studio.values[field.key] || ''} onChange={(event) => setValue(field.key, event.target.value)} placeholder={field.placeholder} /> : <input type={field.type} value={studio.values[field.key] || ''} onChange={(event) => setValue(field.key, event.target.value)} placeholder={field.placeholder} />}{field.hint ? <small>{field.hint}</small> : null}</label>)}</div></div>
          <aside className={styles.impactPreview}><div className={styles.sectionTitle}><CircleGauge size={18} /><div><strong>Ce qui sera enregistré</strong><span>Aucune modification ne sera faite avant votre confirmation.</span></div></div><div className={styles.previewEntity}><span>{studio.entityType.replaceAll('_', ' ')}</span><strong>{studio.values.name || studio.values.label || studio.values.title || 'Nouvel élément'}</strong><small>{studio.values.schoolCode || studio.values.yearCode || studio.values.classCode || studio.values.configurationKey || 'Référence à définir'}</small></div><div className={styles.previewChecks}><span><Check size={15} />École concernée</span><span><Check size={15} />Historique conservé</span><span><Check size={15} />Aucun doublon automatique</span><span><Check size={15} />Espace client sécurisé</span></div><button type="button" className={styles.primaryButton} onClick={onSubmit} disabled={busy}>{busy ? <LoaderCircle className={styles.spin} size={17} /> : <Zap size={17} />}Créer et enregistrer</button><button type="button" className={styles.secondaryButton} onClick={onClose}>Annuler</button></aside>
        </div>
      </section>
    </CustomerOverlaySurface>
  )
}

function creationFields(type: GovernanceEntityType, snapshot: GovernanceCommandSnapshot): Array<{ key: string; label: string; type: string; placeholder?: string; hint?: string; wide?: boolean; options?: Array<{ value: string; label: string }> }> {
  const years = snapshot.academicYears.map((item) => ({ value: item.id, label: item.title }))
  const classes = snapshot.capacities.filter((item) => item.type === 'class').map((item) => ({ value: item.id, label: item.title }))
  const staff = snapshot.directory.staff.map((item) => ({ value: item.id, label: item.secondary ? `${item.label} · ${item.secondary}` : item.label }))
  const users = snapshot.directory.users.map((item) => ({ value: item.id, label: item.secondary ? `${item.label} · ${item.secondary}` : item.label }))
  const subjects = snapshot.directory.subjects.map((item) => ({ value: item.id, label: item.secondary ? `${item.label} · ${item.secondary}` : item.label }))
  const roles = snapshot.directory.roles.map((item) => ({ value: item.id, label: item.secondary ? `${item.label} · ${item.secondary}` : item.label }))
  if (type === 'institution') return [{ key: 'schoolCode', label: 'Code institution', type: 'text', placeholder: 'AC-RABAT-02' }, { key: 'name', label: 'Nom officiel', type: 'text', placeholder: 'AngelCare Institution Rabat', wide: true }, { key: 'schoolType', label: 'Type', type: 'select', options: [{ value: 'creche', label: 'Crèche' }, { value: 'maternelle', label: 'Maternelle' }, { value: 'ecole', label: 'École' }] }, { key: 'city', label: 'Ville', type: 'text', placeholder: 'Rabat' }, { key: 'ownerLabel', label: 'Responsable setup', type: 'text', placeholder: 'Nom du responsable' }]
  if (type === 'academic_year') return [{ key: 'yearCode', label: 'Code', type: 'text', placeholder: '2027-2028' }, { key: 'label', label: 'Libellé', type: 'text', placeholder: 'Année scolaire 2027–2028' }, { key: 'startsOn', label: 'Début', type: 'date' }, { key: 'endsOn', label: 'Fin', type: 'date' }]
  if (type === 'term') return [{ key: 'academicYearId', label: 'Année scolaire', type: 'select', options: years }, { key: 'termCode', label: 'Code période', type: 'text', placeholder: 'T1' }, { key: 'label', label: 'Libellé', type: 'text', placeholder: 'Premier trimestre' }, { key: 'startsOn', label: 'Début', type: 'date' }, { key: 'endsOn', label: 'Fin', type: 'date' }, { key: 'orderIndex', label: 'Ordre', type: 'number', placeholder: '1' }]
  if (type === 'class') return [{ key: 'academicYearId', label: 'Année scolaire', type: 'select', options: years }, { key: 'classCode', label: 'Code classe', type: 'text', placeholder: 'MS-A' }, { key: 'name', label: 'Nom', type: 'text', placeholder: 'Moyenne Section A' }, { key: 'level', label: 'Niveau', type: 'text', placeholder: 'Moyenne Section' }, { key: 'capacity', label: 'Capacité', type: 'number', placeholder: '24' }, { key: 'reservedSeats', label: 'Places réservées', type: 'number', placeholder: '2' }]
  if (type === 'section') return [{ key: 'academicYearId', label: 'Année scolaire', type: 'select', options: years }, { key: 'classId', label: 'Classe', type: 'select', options: classes }, { key: 'sectionCode', label: 'Code section', type: 'text', placeholder: 'MS-A1' }, { key: 'name', label: 'Nom', type: 'text', placeholder: 'Section A1' }, { key: 'capacity', label: 'Capacité', type: 'number', placeholder: '12' }, { key: 'room', label: 'Salle', type: 'text', placeholder: 'Salle 04' }]
  if (type === 'subject') return [{ key: 'subjectCode', label: 'Code matière', type: 'text', placeholder: 'LANG-FR' }, { key: 'name', label: 'Nom', type: 'text', placeholder: 'Langage & communication' }, { key: 'shortName', label: 'Nom court', type: 'text', placeholder: 'Langage' }, { key: 'department', label: 'Département', type: 'text', placeholder: 'Pédagogie' }, { key: 'creditHours', label: 'Heures attendues', type: 'number', placeholder: '4' }]
  if (type === 'assignment') return [{ key: 'academicYearId', label: 'Année scolaire', type: 'select', options: years }, { key: 'staffId', label: 'Enseignant', type: 'select', options: staff, hint: staff.length ? undefined : 'Aucun enseignant actif n’est disponible dans le registre Personnel.' }, { key: 'classId', label: 'Classe', type: 'select', options: classes }, { key: 'subjectId', label: 'Matière', type: 'select', options: subjects, hint: subjects.length ? undefined : 'Aucune matière n’est publiée dans ce tenant.' }, { key: 'weeklyHours', label: 'Charge hebdomadaire', type: 'number', placeholder: '12' }, { key: 'assignedFrom', label: 'Date effective', type: 'date' }]
  if (type === 'role') return [{ key: 'roleKey', label: 'Code du rôle', type: 'text', placeholder: 'site_director' }, { key: 'label', label: 'Libellé', type: 'text', placeholder: 'Directeur de site' }, { key: 'scope', label: 'Périmètre', type: 'select', options: [{ value: 'school', label: 'Établissement' }, { value: 'module', label: 'Module' }, { value: 'class', label: 'Classe' }] }, { key: 'description', label: 'Responsabilités', type: 'textarea', placeholder: 'Action, limites et responsabilités.', wide: true }]
  if (type === 'delegation') return [{ key: 'userId', label: 'Utilisateur autorisé', type: 'select', options: users, hint: users.length ? 'Seuls les comptes portail liés au personnel du tenant sont proposés.' : 'Aucun compte portail lié au personnel n’est disponible.' }, { key: 'roleId', label: 'Rôle délégué', type: 'select', options: roles, hint: roles.length ? undefined : 'Aucun rôle gouverné n’est disponible.' }, { key: 'scopeType', label: 'Périmètre', type: 'select', options: [{ value: 'school', label: 'Établissement' }, { value: 'site', label: 'Site' }, { value: 'module', label: 'Module' }] }, { key: 'startsAt', label: 'Début', type: 'datetime-local' }, { key: 'endsAt', label: 'Fin', type: 'datetime-local' }, { key: 'reviewAt', label: 'Revue', type: 'datetime-local' }]
  return [{ key: 'changesetCode', label: 'Référence de la modification', type: 'text', placeholder: 'CFG-ATTENDANCE-01' }, { key: 'title', label: 'Titre', type: 'text', placeholder: 'Réviser le seuil de retard' }, { key: 'configurationKey', label: 'Configuration', type: 'text', placeholder: 'attendance.grace_minutes' }, { key: 'ownership', label: 'Responsable du réglage', type: 'select', options: [{ value: 'tenant', label: 'Géré par l’école' }, { value: 'institution', label: 'Modifiable par l’établissement' }, { value: 'operator', label: 'Géré par AngelCare' }, { value: 'policy', label: 'Contrôlé par une règle' }] }, { key: 'currentValue', label: 'Valeur actuelle', type: 'textarea', placeholder: '{"minutes":10}', wide: true }, { key: 'proposedValue', label: 'Valeur proposée', type: 'textarea', placeholder: '{"minutes":15}', wide: true }, { key: 'effectiveAt', label: 'Date effective', type: 'date' }]
}

function ActionChamberModal({ state, snapshot, busy, onChange, onSubmit, onClose }: { state: ActionChamber; snapshot: GovernanceCommandSnapshot; busy: boolean; onChange: (state: ActionChamber) => void; onSubmit: () => void; onClose: () => void }) {
  const needsCapacity = state.operationKey === 'governance.capacity.change'
  const needsReplacement = state.operationKey === 'governance.assignment.replace'
  const needsRollover = ['governance.rollover.preview', 'governance.rollover.execute', 'governance.rollover.repair'].includes(state.operationKey)
  const needsPermissions = state.operationKey === 'governance.role.publish'
  const needsFreeze = state.operationKey === 'governance.enrollment.freeze'
  return (
    <CustomerOverlaySurface kind="nested-command" onClose={onClose} className={styles.modalOverlay} dirty={Boolean(state.reason || state.capacity || state.replacementStaffId || state.targetClassId || state.targetSectionId || state.permissionKeys)} ariaLabel={state.title}>
      <section className={styles.actionChamberModal} role="dialog" aria-modal="true" aria-label={state.title} onMouseDown={(event) => event.stopPropagation()}>
        <header className={styles.modalHeader}><div><div className={styles.eyebrow}>Action sur le dossier</div><h2>{state.title}</h2><p>{state.description}</p></div><button type="button" className={styles.iconButton} onClick={onClose}><X size={19} /></button></header>
        <div className={styles.actionChamberBody}>
          <div className={styles.actionAuthority}><div><ShieldCheck size={20} /><span>Action choisie</span><strong>{governanceOperationLabel(state.operationKey)}</strong></div><div><Building2 size={20} /><span>École</span><strong>{snapshot.school.name}</strong></div><div><Clock3 size={20} /><span>Date prévue</span><strong>{formatDate(state.effectiveAt)}</strong></div></div>
          <div className={styles.formGrid}>
            <label data-wide><span>Pourquoi cette modification est-elle nécessaire ?</span><textarea value={state.reason} onChange={(event) => onChange({ ...state, reason: event.target.value })} placeholder="Expliquez simplement la raison de cette modification…" /></label>
            <label><span>Date effective</span><input type="date" value={state.effectiveAt} onChange={(event) => onChange({ ...state, effectiveAt: event.target.value })} /></label>
            {needsCapacity ? <label><span>Nouvelle capacité</span><input type="number" min="0" value={state.capacity} onChange={(event) => onChange({ ...state, capacity: event.target.value })} /></label> : null}
            {needsReplacement ? <label><span>Enseignant remplaçant</span><select value={state.replacementStaffId} onChange={(event) => onChange({ ...state, replacementStaffId: event.target.value })}><option value="">Sélectionner</option>{snapshot.directory.staff.map((item) => <option key={item.id} value={item.id}>{item.secondary ? `${item.label} · ${item.secondary}` : item.label}</option>)}</select><small>La nouvelle affectation conservera le lien avec l’affectation remplacée.</small></label> : null}
            {needsRollover ? <><label><span>Année source</span><select value={state.sourceAcademicYearId} onChange={(event) => onChange({ ...state, sourceAcademicYearId: event.target.value })}><option value="">Sélectionner</option>{snapshot.academicYears.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label><span>Année cible</span><select value={state.targetAcademicYearId} onChange={(event) => onChange({ ...state, targetAcademicYearId: event.target.value })}><option value="">Sélectionner</option>{snapshot.academicYears.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></> : null}
            {needsPermissions ? <label data-wide><span>Droits d’accès à appliquer</span><textarea value={state.permissionKeys} onChange={(event) => onChange({ ...state, permissionKeys: event.target.value })} placeholder="classes.view, classes.update, audit.view" /><small>Séparez les droits par une virgule.</small></label> : null}
            {needsFreeze ? <label className={styles.switchField}><span>État des inscriptions</span><button type="button" data-active={state.frozen} onClick={() => onChange({ ...state, frozen: !state.frozen })}><i />{state.frozen ? 'Gelées' : 'Ouvertes'}</button></label> : null}
          </div>
          <div className={styles.consequencePreview}><AlertTriangle size={19} /><div><strong>Ce qui va se passer</strong><p>Le système vérifiera vos droits, l’état actuel du dossier et les informations saisies avant d’appliquer la modification. L’historique sera conservé.</p></div></div>
        </div>
        <footer className={styles.modalFooter}><button type="button" className={styles.secondaryButton} onClick={onClose}>Annuler</button><button type="button" className={styles.primaryButton} onClick={onSubmit} disabled={busy}>{busy ? <LoaderCircle className={styles.spin} size={17} /> : <Zap size={17} />}{governanceOperationLabel(state.operationKey)}</button></footer>
      </section>
    </CustomerOverlaySurface>
  )
}

function BriefingModal({ type, briefings, busy, onType, onGenerate, onClose }: { type: GovernanceBriefing['briefingType']; briefings: GovernanceBriefing[]; busy: boolean; onType: (type: GovernanceBriefing['briefingType']) => void; onGenerate: () => void; onClose: () => void }) {
  const types: Array<{ value: GovernanceBriefing['briefingType']; label: string }> = [{ value: 'readiness', label: 'Préparation de l’établissement' }, { value: 'academic_structure', label: 'Structure académique' }, { value: 'capacity_risk', label: 'Classes proches ou au-dessus de leur capacité' }, { value: 'assignment_coverage', label: 'Classes et matières sans enseignant' }, { value: 'access', label: 'Utilisateurs et droits d’accès' }, { value: 'rollover', label: 'Préparation de l’année suivante' }, { value: 'configuration', label: 'Réglages à appliquer' }, { value: 'weekly', label: 'Résumé hebdomadaire' }]
  return (
    <CustomerOverlaySurface kind="nested-command" onClose={onClose} className={styles.modalOverlay} ariaLabel="Résumé de l’école">
      <section className={styles.briefingModal} role="dialog" aria-modal="true" aria-label="Résumé de l’école" onMouseDown={(event) => event.stopPropagation()}>
        <header className={styles.modalHeader}><div><div className={styles.eyebrow}>Résumé de l’école</div><h2>Préparer un résumé de la situation</h2><p>Le résumé utilise uniquement les informations réelles actuellement enregistrées dans l’école.</p></div><button type="button" className={styles.iconButton} onClick={onClose}><X size={19} /></button></header>
        <div className={styles.briefingTypes}>{types.map((item) => <button key={item.value} type="button" data-active={type === item.value} onClick={() => onType(item.value)}><FileSearch size={18} /><span>{item.label}</span><ChevronRight size={15} /></button>)}</div>
        <div className={styles.briefingHistory}><div className={styles.sectionTitle}><History size={18} /><div><strong>Résumés récents</strong><span>Résumés préparés à partir des informations de l’école.</span></div></div>{briefings.slice(0, 4).map((briefing) => <div key={briefing.id}><strong>{briefing.title}</strong><span>{formatDate(briefing.generatedAt)}</span><small>{briefing.summary[0]}</small></div>)}{!briefings.length ? <div className={styles.timelineBlank}>Aucun résumé n’a encore été préparé.</div> : null}</div>
        <footer className={styles.modalFooter}><button type="button" className={styles.secondaryButton} onClick={onClose}>Fermer</button><button type="button" className={styles.primaryButton} onClick={onGenerate} disabled={busy}>{busy ? <LoaderCircle className={styles.spin} size={17} /> : <FileClock size={17} />}Préparer le résumé</button></footer>
      </section>
    </CustomerOverlaySurface>
  )
}

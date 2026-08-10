'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BellRing,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Command,
  CornerUpRight,
  FileCheck2,
  FileSearch,
  Gauge,
  Gavel,
  GitBranch,
  Hand,
  History,
  Landmark,
  Layers3,
  ListChecks,
  LoaderCircle,
  LockKeyhole,
  Maximize2,
  MessageSquareText,
  Network,
  PanelRightOpen,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  UserCheck,
  UserRoundCog,
  Users,
  X,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import CustomerOverlayPortal from '@/components/angelcare360/customer-experience/CustomerOverlayPortal'
import CustomerOverlaySurface from '@/components/angelcare360/customer-experience/CustomerOverlaySurface'
import {
  SchoolAdminAssignmentPanel,
  SchoolAdminBreadcrumb,
  SchoolAdminEmptyState,
  SchoolAdminNextAction,
  SchoolAdminSituationSummary,
} from '@/components/angelcare360/customer-experience/SchoolAdminWorkbench'
import { DIRECTION_MATTER_ACTION_LABELS, humanizeTechnicalLabel, schoolStatusLabel } from '@/data/angelcare360/customer-language'
import { DIRECTION_COMMAND_TEMPLATES, DIRECTION_DOMAINS, DIRECTION_PLANES } from '@/data/angelcare360/direction-command'
import type {
  DirectionBriefing,
  DirectionCommandResult,
  DirectionCommandSnapshot,
  DirectionCommitment,
  DirectionCommitmentActionRequest,
  DirectionCommitmentCreateRequest,
  DirectionDecision,
  DirectionDecisionCreateRequest,
  DirectionDomainKey,
  DirectionMatter,
  DirectionMatterAction,
  DirectionPlaneKey,
  DirectionSeverity,
  DirectionTone,
} from '@/types/angelcare360/direction-command'
import styles from './Angelcare360DirectionCommand.module.css'

type Props = {
  initialSnapshot: DirectionCommandSnapshot
  initialPlane: DirectionPlaneKey
  initialMatterId: string | null
}

type ToastState = { kind: 'success' | 'warning' | 'error'; message: string } | null

type CommandStudioState = {
  templateKey: string
  matterId: string | null
  domain: DirectionDomainKey
  title: string
  question: string
  severity: DirectionSeverity
  dueAt: string
  ownerLabel: string
  recommendedOptionKey: string
  options: Array<{ key: string; label: string; consequence: string }>
  conditions: string
  operationalImpact: string
  financialImpact: string
  peopleCount: string
}

type CommitmentStudioState = {
  matterId: string | null
  domain: DirectionDomainKey
  title: string
  ownerLabel: string
  dueAt: string
  nextCheckpoint: string
  evidenceRequired: string
}


const ACTION_LABELS: Record<DirectionMatterAction, string> = DIRECTION_MATTER_ACTION_LABELS

const ACTION_ICONS: Partial<Record<DirectionMatterAction, LucideIcon>> = {
  acknowledge: Hand,
  take_ownership: UserCheck,
  assign: UserRoundCog,
  mark_checked: CheckCheck,
  request_evidence: FileSearch,
  add_note: MessageSquareText,
  snooze: TimerReset,
  escalate: ShieldAlert,
  resolve: BadgeCheck,
  release: CornerUpRight,
  reopen: RotateCcw,
}

function defaultStudio(matter?: DirectionMatter | null): CommandStudioState {
  const domain = matter?.domain || 'governance'
  return {
    templateKey: matter ? 'risk' : 'operational',
    matterId: matter?.id || null,
    domain,
    title: matter ? `Décision · ${matter.title}` : '',
    question: matter ? `Quelle décision faut-il prendre pour régler « ${matter.title} » ?` : '',
    severity: matter?.severity || 'medium',
    dueAt: matter?.dueAt ? matter.dueAt.slice(0, 16) : '',
    ownerLabel: '',
    recommendedOptionKey: 'approve',
    options: [
      { key: 'approve', label: 'Approuver l’action recommandée', consequence: 'Déclenche la conséquence opérationnelle autorisée.' },
      { key: 'return', label: 'Demander des éléments complémentaires', consequence: 'La décision reste en attente jusqu’à réception des informations nécessaires.' },
      { key: 'reject', label: 'Refuser', consequence: 'La proposition est clôturée sans appliquer de changement.' },
    ],
    conditions: '',
    operationalImpact: matter?.impact.operational || '',
    financialImpact: matter?.impact.financialMinor ? String(Math.round(matter.impact.financialMinor / 100)) : '',
    peopleCount: matter?.impact.peopleCount ? String(matter.impact.peopleCount) : '',
  }
}


function defaultCommitment(matter?: DirectionMatter | null): CommitmentStudioState {
  return {
    matterId: matter?.id || null,
    domain: matter?.domain || 'governance',
    title: matter ? `Résoudre · ${matter.title}` : '',
    ownerLabel: matter?.ownerLabel || '',
    dueAt: matter?.dueAt ? matter.dueAt.slice(0, 16) : '',
    nextCheckpoint: matter ? `Confirmer la résolution de « ${matter.title} »` : '',
    evidenceRequired: matter?.evidence.map((item) => item.label).join('\n') || '',
  }
}

function formatMoneyMinor(value: number, currency: string) {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(value / 100))} ${currency}`
}

function formatDate(value: string | null, withTime = false) {
  if (!value) return 'Non définie'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Non définie'
  return new Intl.DateTimeFormat('fr-FR', withTime
    ? { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function relativeTime(value: string) {
  const difference = Date.now() - Date.parse(value)
  if (!Number.isFinite(difference)) return 'Date inconnue'
  const minutes = Math.max(0, Math.floor(difference / 60000))
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours} h`
  return `Il y a ${Math.floor(hours / 24)} j`
}

function toneClass(tone: DirectionTone) {
  return styles[`tone_${tone}`]
}

function stateLabel(value: string) {
  return schoolStatusLabel(value)
}

function laneTitle(lane: DirectionMatter['lane']) {
  return {
    immediate: 'Intervention immédiate',
    decision: 'Décision requise',
    overdue: 'Engagement en retard',
    watch: 'Sous surveillance',
    resolved: 'Historique résolu',
  }[lane]
}

function domainIcon(domain: DirectionDomainKey) {
  const icons: Record<DirectionDomainKey, typeof Command> = {
    governance: Landmark,
    people: Users,
    admissions: UserCheck,
    attendance: ClipboardCheck,
    academics: BookOpenCheck,
    finance: CircleDollarSign,
    payroll: BriefcaseBusiness,
    transport: GitBranch,
    quality: ShieldAlert,
    communications: MessageSquareText,
    compliance: ShieldCheck,
  }
  return icons[domain]
}

export default function Angelcare360DirectionCommand({ initialSnapshot, initialPlane, initialMatterId }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [plane, setPlane] = useState<DirectionPlaneKey>(DIRECTION_PLANES.some((item) => item.key === initialPlane) ? initialPlane : 'today')
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>(initialMatterId)
  const [drawerMode, setDrawerMode] = useState<'peek' | 'detail' | 'focus'>('detail')
  const [drawerTab, setDrawerTab] = useState<'situation' | 'impact' | 'records' | 'evidence' | 'timeline' | 'authority' | 'audit'>('situation')
  const [search, setSearch] = useState('')
  const [domainFilter, setDomainFilter] = useState<DirectionDomainKey | 'all'>('all')
  const [metricFilter, setMetricFilter] = useState<string>('active')
  const [toast, setToast] = useState<ToastState>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [commandStudio, setCommandStudio] = useState<CommandStudioState | null>(null)
  const [commitmentStudio, setCommitmentStudio] = useState<CommitmentStudioState | null>(null)
  const [briefing, setBriefing] = useState<DirectionBriefing | null>(null)
  const [briefingMenu, setBriefingMenu] = useState(false)

  const selectedMatter = useMemo(
    () => snapshot.matters.find((matter) => matter.id === selectedMatterId || matter.fingerprint === selectedMatterId) || null,
    [snapshot.matters, selectedMatterId],
  )

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!selectedMatterId) setReason('')
  }, [selectedMatterId])

  function updateUrl(next: { plane?: DirectionPlaneKey; matter?: string | null }) {
    const params = new URLSearchParams(searchParams.toString())
    if (next.plane) params.set('plane', next.plane)
    if (next.matter === null) params.delete('matter')
    else if (next.matter) params.set('matter', next.matter)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function choosePlane(next: DirectionPlaneKey) {
    setPlane(next)
    updateUrl({ plane: next })
  }

  function openMatter(matter: DirectionMatter, mode: 'peek' | 'detail' | 'focus' = 'detail') {
    setSelectedMatterId(matter.id)
    setDrawerMode(mode)
    setDrawerTab('situation')
    updateUrl({ matter: matter.id })
  }

  function closeMatter() {
    setSelectedMatterId(null)
    setDrawerMode('detail')
    updateUrl({ matter: null })
  }

  async function refreshSnapshot(silent = false) {
    if (!silent) setLoading('refresh')
    try {
      const response = await fetch('/api/angelcare360/direction/command', { cache: 'no-store' })
      const result = await response.json() as { ok: boolean; snapshot?: DirectionCommandSnapshot; message?: string }
      if (!response.ok || !result.ok || !result.snapshot) throw new Error(result.message || 'Actualisation impossible.')
      setSnapshot(result.snapshot)
      if (!silent) setToast({ kind: 'success', message: 'La page a été mise à jour.' })
    } catch (error) {
      setToast({ kind: 'error', message: error instanceof Error ? error.message : 'Actualisation impossible.' })
    } finally {
      if (!silent) setLoading(null)
    }
  }

  async function matterAction(action: DirectionMatterAction, matter = selectedMatter) {
    if (!matter) return
    const requiresReason = ['resolve', 'release', 'reopen', 'escalate', 'snooze'].includes(action)
    if (requiresReason && !reason.trim()) {
      setToast({ kind: 'warning', message: 'Ajoutez une raison explicite avant cette action.' })
      return
    }
    setLoading(`matter:${matter.id}:${action}`)
    try {
      const response = await fetch(`/api/angelcare360/direction/matters/${encodeURIComponent(matter.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          fingerprint: matter.fingerprint,
          reason: reason.trim() || null,
          note: action === 'add_note' ? reason.trim() || null : null,
          matterSnapshot: matter,
          idempotencyKey: `${matter.fingerprint}:${action}:${Date.now()}`,
        }),
      })
      const result = await response.json() as DirectionCommandResult
      if (!response.ok || !result.ok) throw new Error(result.message || 'Cette action n’a pas pu être terminée.')
      if (result.snapshot) setSnapshot(result.snapshot)
      else await refreshSnapshot(true)
      setReason('')
      setToast({ kind: 'success', message: result.message })
      if (['resolve', 'release'].includes(action)) closeMatter()
    } catch (error) {
      setToast({ kind: 'error', message: error instanceof Error ? error.message : 'Cette action n’a pas pu être terminée.' })
    } finally {
      setLoading(null)
    }
  }

  async function createDecision(state: 'draft' | 'submitted' = 'submitted') {
    if (!commandStudio) return
    if (!commandStudio.title.trim() || !commandStudio.question.trim()) {
      setToast({ kind: 'warning', message: 'Le titre et la question de décision sont requis.' })
      return
    }
    setLoading(`decision:create:${state}`)
    const payload: DirectionDecisionCreateRequest = {
      state,
      matterId: commandStudio.matterId,
      title: commandStudio.title,
      question: commandStudio.question,
      domain: commandStudio.domain,
      severity: commandStudio.severity,
      dueAt: commandStudio.dueAt || null,
      ownerLabel: commandStudio.ownerLabel || null,
      recommendedOptionKey: commandStudio.recommendedOptionKey || null,
      options: commandStudio.options.filter((option) => option.label.trim()),
      conditions: commandStudio.conditions.split('\n').map((item) => item.trim()).filter(Boolean),
      impact: {
        operational: commandStudio.operationalImpact || null,
        financialMinor: commandStudio.financialImpact ? Math.round(Number(commandStudio.financialImpact) * 100) : null,
        peopleCount: commandStudio.peopleCount ? Number(commandStudio.peopleCount) : null,
      },
      idempotencyKey: `direction-decision:${Date.now()}:${commandStudio.title}`,
    }
    try {
      const response = await fetch('/api/angelcare360/direction/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', payload }),
      })
      const result = await response.json() as DirectionCommandResult
      if (!response.ok || !result.ok) throw new Error(result.message || 'Décision non créée.')
      if (result.snapshot) setSnapshot(result.snapshot)
      setCommandStudio(null)
      setToast({ kind: 'success', message: result.message })
      if (state === 'submitted') {
        setPlane('decisions')
        updateUrl({ plane: 'decisions' })
      }
    } catch (error) {
      setToast({ kind: 'error', message: error instanceof Error ? error.message : 'Décision non créée.' })
    } finally {
      setLoading(null)
    }
  }


  async function createCommitment() {
    if (!commitmentStudio) return
    if (!commitmentStudio.title.trim()) {
      setToast({ kind: 'warning', message: "Le titre de l'engagement est requis." })
      return
    }
    setLoading('commitment:create')
    const payload: DirectionCommitmentCreateRequest = {
      matterId: commitmentStudio.matterId,
      title: commitmentStudio.title.trim(),
      domain: commitmentStudio.domain,
      ownerLabel: commitmentStudio.ownerLabel.trim() || null,
      dueAt: commitmentStudio.dueAt || null,
      nextCheckpoint: commitmentStudio.nextCheckpoint.trim() || null,
      evidenceRequired: commitmentStudio.evidenceRequired.split('\n').map((item) => item.trim()).filter(Boolean),
      idempotencyKey: `direction-commitment:${Date.now()}:${commitmentStudio.title}`,
    }
    try {
      const response = await fetch('/api/angelcare360/direction/commitments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', payload }),
      })
      const result = await response.json() as DirectionCommandResult
      if (!response.ok || !result.ok) throw new Error(result.message || 'Engagement non créé.')
      if (result.snapshot) setSnapshot(result.snapshot)
      setCommitmentStudio(null)
      setPlane('commitments')
      updateUrl({ plane: 'commitments' })
      setToast({ kind: 'success', message: result.message })
    } catch (error) {
      setToast({ kind: 'error', message: error instanceof Error ? error.message : 'Engagement non créé.' })
    } finally { setLoading(null) }
  }

  async function commitmentAction(commitment: DirectionCommitment, action: DirectionCommitmentActionRequest['action'], reasonOverride?: string) {
    const actionReason = reasonOverride || reason.trim() || (action === 'complete' ? 'Engagement terminé et vérifié.' : null)
    if (['block', 'complete', 'cancel', 'reopen'].includes(action) && !actionReason) {
      setToast({ kind: 'warning', message: 'Une justification est requise pour cette action.' })
      return
    }
    setLoading(`commitment:${commitment.id}:${action}`)
    try {
      const response = await fetch('/api/angelcare360/direction/commitments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', payload: {
          commitmentId: commitment.id, action, reason: actionReason,
          progressPercent: action === 'start' ? Math.max(10, commitment.progressPercent) : action === 'complete' ? 100 : commitment.progressPercent,
          idempotencyKey: `${commitment.id}:${action}:${Date.now()}`,
        } satisfies DirectionCommitmentActionRequest }),
      })
      const result = await response.json() as DirectionCommandResult
      if (!response.ok || !result.ok) throw new Error(result.message || 'Engagement non mis à jour.')
      if (result.snapshot) setSnapshot(result.snapshot)
      setReason('')
      setToast({ kind: 'success', message: result.message })
    } catch (error) {
      setToast({ kind: 'error', message: error instanceof Error ? error.message : 'Engagement non mis à jour.' })
    } finally { setLoading(null) }
  }

  async function decisionAction(decision: DirectionDecision, action: 'request_evidence' | 'approve' | 'conditional_approval' | 'reject' | 'execute') {
    if (['approve', 'conditional_approval', 'reject', 'execute'].includes(action) && !reason.trim()) {
      setToast({ kind: 'warning', message: 'Ajoutez une justification dans le champ de commande.' })
      return
    }
    setLoading(`decision:${decision.id}:${action}`)
    try {
      const response = await fetch('/api/angelcare360/direction/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          payload: {
            decisionId: decision.id,
            action,
            selectedOptionKey: decision.recommendedOptionKey || decision.options[0]?.key || null,
            reason: reason.trim() || null,
            idempotencyKey: `${decision.id}:${action}:${Date.now()}`,
          },
        }),
      })
      const result = await response.json() as DirectionCommandResult
      if (!response.ok || !result.ok) throw new Error(result.message || 'La décision n’a pas pu être appliquée.')
      if (result.snapshot) setSnapshot(result.snapshot)
      setReason('')
      setToast({ kind: 'success', message: result.message })
    } catch (error) {
      setToast({ kind: 'error', message: error instanceof Error ? error.message : 'La décision n’a pas pu être appliquée.' })
    } finally {
      setLoading(null)
    }
  }

  async function generateBriefing(type: DirectionBriefing['briefingType']) {
    setBriefingMenu(false)
    setLoading(`briefing:${type}`)
    try {
      const response = await fetch('/api/angelcare360/direction/briefings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefingType: type, idempotencyKey: `briefing:${type}:${new Date().toISOString().slice(0, 13)}` }),
      })
      const result = await response.json() as DirectionCommandResult
      if (!response.ok || !result.ok || !result.briefing) throw new Error(result.message || 'Le résumé n’a pas pu être préparé.')
      setBriefing(result.briefing)
      setToast({ kind: 'success', message: result.message })
    } catch (error) {
      setToast({ kind: 'error', message: error instanceof Error ? error.message : 'Le résumé n’a pas pu être préparé.' })
    } finally {
      setLoading(null)
    }
  }

  const activeMatters = useMemo(() => snapshot.matters.filter((matter) => !['resolved', 'released', 'rejected', 'cancelled'].includes(matter.state)), [snapshot.matters])
  const visibleMatters = useMemo(() => {
    const term = search.trim().toLowerCase()
    return snapshot.matters.filter((matter) => {
      if (domainFilter !== 'all' && matter.domain !== domainFilter) return false
      if (metricFilter === 'critical' && matter.severity !== 'critical') return false
      if (metricFilter === 'decision' && matter.lane !== 'decision') return false
      if (metricFilter === 'finance' && matter.domain !== 'finance') return false
      if (metricFilter === 'people' && !['people', 'payroll', 'admissions', 'attendance'].includes(matter.domain)) return false
      if (metricFilter === 'active' && ['resolved', 'released', 'rejected', 'cancelled'].includes(matter.state)) return false
      if (!term) return true
      return [matter.title, matter.summary, matter.sourceLabel, DIRECTION_DOMAINS[matter.domain].label, matter.ownerLabel]
        .filter(Boolean).join(' ').toLowerCase().includes(term)
    })
  }, [snapshot.matters, domainFilter, metricFilter, search])

  return (
    <div className={styles.page} data-posture={snapshot.posture.state}>
      <ExecutiveCrown
        snapshot={snapshot}
        loading={loading}
        onRefresh={() => refreshSnapshot()}
        onOpenDecision={() => setCommandStudio(defaultStudio())}
        onOpenIntervention={() => setCommandStudio({ ...defaultStudio(), templateKey: 'risk', domain: 'quality', title: 'Situation à traiter en priorité', question: 'Que faut-il faire, qui doit s’en charger et avant quelle date ?' })}
        onAssignCommitment={() => {
          const first = activeMatters.find((matter) => !matter.ownerLabel) || activeMatters[0] || null
          setCommitmentStudio(defaultCommitment(first))
        }}
        onRequestEvidence={() => {
          const first = activeMatters.find((matter) => matter.availableActions.includes('request_evidence'))
          if (first) openMatter(first)
          else setToast({ kind: 'warning', message: 'Aucun dossier actif ne nécessite de document complémentaire.' })
        }}
        onDirective={() => setCommandStudio({ ...defaultStudio(), templateKey: 'directive', title: 'Instruction à l’équipe', question: 'Quelle instruction doit être appliquée, par qui et avant quelle date ?' })}
        onScheduleReview={() => setCommandStudio({ ...defaultStudio(), templateKey: 'review', title: 'Revue planifiée', question: 'Quelle situation doit être revue et quelle décision faut-il préparer ?' })}
        onOpenResearch={() => {
          window.setTimeout(() => document.getElementById('direction-executive-search')?.focus(), 0)
        }}
        onOpenBriefing={() => setBriefingMenu((value) => !value)}
        briefingMenu={briefingMenu}
        onGenerateBriefing={generateBriefing}
      />

      <nav className={styles.planeNav} aria-label="Navigation Direction">
        {DIRECTION_PLANES.map((item) => (
          <button
            type="button"
            key={item.key}
            className={`${styles.planeButton} ${plane === item.key ? styles.planeButtonActive : ''}`}
            onClick={() => choosePlane(item.key)}
          >
            <span>{item.shortLabel}</span>
            {item.key === 'today' && activeMatters.length > 0 ? <b>{activeMatters.length}</b> : null}
            {item.key === 'decisions' && snapshot.decisions.filter((decision) => ['submitted', 'evidence_required'].includes(decision.state)).length > 0
              ? <b>{snapshot.decisions.filter((decision) => ['submitted', 'evidence_required'].includes(decision.state)).length}</b>
              : null}
          </button>
        ))}
      </nav>

      <section className={styles.intelligenceBar} aria-label="Filtres Direction">
        <div className={styles.searchBox}>
          <Search size={18} />
          <input id="direction-executive-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un dossier, une famille, une facture ou une décision…" />
          {search ? <button type="button" onClick={() => setSearch('')} aria-label="Effacer"><X size={16} /></button> : null}
        </div>
        <div className={styles.filterGroup}>
          <select value={domainFilter} onChange={(event) => setDomainFilter(event.target.value as DirectionDomainKey | 'all')}>
            <option value="all">Tous les domaines</option>
            {(Object.keys(DIRECTION_DOMAINS) as DirectionDomainKey[]).map((domain) => <option key={domain} value={domain}>{DIRECTION_DOMAINS[domain].label}</option>)}
          </select>
          <button type="button" className={styles.syncButton} onClick={() => refreshSnapshot()} disabled={loading === 'refresh'}>
            <RefreshCw size={16} className={loading === 'refresh' ? styles.spin : ''} /> Synchroniser
          </button>
        </div>
      </section>

      {plane === 'today' ? (
        <TodayPlane
          snapshot={snapshot}
          matters={visibleMatters}
          metricFilter={metricFilter}
          onMetricFilter={setMetricFilter}
          onOpenMatter={openMatter}
          onQuickAction={matterAction}
          onOpenDecision={(matter) => setCommandStudio(defaultStudio(matter))}
          loading={loading}
        />
      ) : null}
      {plane === 'network' ? <NetworkPlane snapshot={snapshot} onDomain={(domain) => { setDomainFilter(domain); setPlane('today'); updateUrl({ plane: 'today' }) }} /> : null}
      {plane === 'decisions' ? <DecisionsPlane snapshot={snapshot} reason={reason} setReason={setReason} onAction={decisionAction} onNew={() => setCommandStudio(defaultStudio())} loading={loading} /> : null}
      {plane === 'risks' ? <RisksPlane matters={visibleMatters} onOpenMatter={openMatter} /> : null}
      {plane === 'commitments' ? <CommitmentsPlane snapshot={snapshot} loading={loading} onAction={commitmentAction} onOpenMatter={(id) => { const matter = snapshot.matters.find((item) => item.id === id); if (matter) openMatter(matter) }} onNew={() => setCommitmentStudio(defaultCommitment())} /> : null}
      {plane === 'performance' ? <PerformancePlane snapshot={snapshot} onDomain={(domain) => { setDomainFilter(domain); setPlane('today'); updateUrl({ plane: 'today' }) }} /> : null}
      {plane === 'calendar' ? <CalendarPlane snapshot={snapshot} onOpenMatter={openMatter} /> : null}
      {plane === 'audit' ? <AuditPlane snapshot={snapshot} /> : null}

      {selectedMatter ? (
        <MatterDrawer
          matter={selectedMatter}
          mode={drawerMode}
          tab={drawerTab}
          setTab={setDrawerTab}
          onMode={setDrawerMode}
          onClose={closeMatter}
          onAction={matterAction}
          onCreateDecision={() => setCommandStudio(defaultStudio(selectedMatter))}
          onCreateCommitment={() => setCommitmentStudio(defaultCommitment(selectedMatter))}
          reason={reason}
          setReason={setReason}
          loading={loading}
          currency={snapshot.school.currency}
        />
      ) : null}

      {commandStudio ? (
        <CommandStudio
          value={commandStudio}
          onChange={setCommandStudio}
          onClose={() => setCommandStudio(null)}
          onSaveDraft={() => createDecision('draft')}
          onSubmit={() => createDecision('submitted')}
          loading={Boolean(loading?.startsWith('decision:create'))}
          currency={snapshot.school.currency}
        />
      ) : null}

      {commitmentStudio ? (
        <CommitmentStudio
          value={commitmentStudio}
          onChange={setCommitmentStudio}
          onClose={() => setCommitmentStudio(null)}
          onSubmit={createCommitment}
          loading={loading === 'commitment:create'}
        />
      ) : null}

      {briefing ? <BriefingDrawer briefing={briefing} onClose={() => setBriefing(null)} snapshot={snapshot} onOpenMatter={openMatter} /> : null}

      {toast ? <CustomerOverlayPortal>
        <div className={`${styles.toast} ${styles[`toast_${toast.kind}`]}`} role="status">
          {toast.kind === 'success' ? <BadgeCheck size={20} /> : toast.kind === 'warning' ? <AlertTriangle size={20} /> : <ShieldAlert size={20} />}
          <span>{toast.message}</span>
        </div>
      </CustomerOverlayPortal> : null}
    </div>
  )
}

function ExecutiveCrown({
  snapshot,
  loading,
  onRefresh,
  onOpenDecision,
  onOpenIntervention,
  onAssignCommitment,
  onRequestEvidence,
  onDirective,
  onScheduleReview,
  onOpenResearch,
  onOpenBriefing,
  briefingMenu,
  onGenerateBriefing,
}: {
  snapshot: DirectionCommandSnapshot
  loading: string | null
  onRefresh: () => void
  onOpenDecision: () => void
  onOpenIntervention: () => void
  onAssignCommitment: () => void
  onRequestEvidence: () => void
  onDirective: () => void
  onScheduleReview: () => void
  onOpenResearch: () => void
  onOpenBriefing: () => void
  briefingMenu: boolean
  onGenerateBriefing: (type: DirectionBriefing['briefingType']) => void
}) {
  return (
    <header className={styles.crown}>
      <div className={styles.crownSignal}>
        <div className={`${styles.postureOrb} ${toneClass(snapshot.posture.state === 'critical' ? 'critical' : snapshot.posture.state === 'attention' ? 'warning' : 'verified')}`}>
          <Gauge size={24} />
          <strong>{snapshot.posture.score}</strong>
        </div>
        <div>
          <span className={styles.eyebrow}>ANGELCARE 360 · DIRECTION EXECUTIVE INTERVENTION OS</span>
          <h1>{snapshot.school.name}</h1>
          <p><strong>{snapshot.posture.label}</strong> · {snapshot.posture.rationale}</p>
        </div>
      </div>
      <div className={styles.crownContext}>
        <div><span>Contexte</span><strong>{snapshot.school.academicYearLabel || 'Année non configurée'}</strong></div>
        <div><span>Validation</span><strong>{snapshot.viewer.roleLabel}</strong></div>
        <div><span>Synchronisation</span><strong>{formatDate(snapshot.generatedAt, true)}</strong></div>
      </div>
      <div className={styles.commandLauncher}>
        <button type="button" className={styles.primaryCommand} onClick={onOpenDecision}><Gavel size={17} /> Préparer une décision</button>
        <button type="button" onClick={onOpenIntervention}><Zap size={17} /> Lancer une intervention</button>
        <button type="button" onClick={onAssignCommitment}><Target size={17} /> Assigner un engagement</button>
        <button type="button" onClick={onRequestEvidence}><FileSearch size={17} /> Demander une preuve</button>
        <button type="button" onClick={onDirective}><Command size={17} /> Émettre une directive</button>
        <button type="button" onClick={onScheduleReview}><CalendarClock size={17} /> Programmer une revue</button>
        <button type="button" onClick={onOpenResearch}><Search size={17} /> Recherche exécutive</button>
        <button type="button" onClick={onOpenBriefing}><FileCheck2 size={17} /> Générer le briefing <ChevronDown size={15} /></button>
        <button type="button" className={styles.iconButton} onClick={onRefresh} disabled={loading === 'refresh'} aria-label="Synchroniser"><RefreshCw size={18} className={loading === 'refresh' ? styles.spin : ''} /></button>
        {briefingMenu ? (
          <div className={styles.briefingMenu}>
            <button type="button" onClick={() => onGenerateBriefing('morning')}>Brief du matin</button>
            <button type="button" onClick={() => onGenerateBriefing('end_of_day')}>Clôture de journée</button>
            <button type="button" onClick={() => onGenerateBriefing('weekly')}>Brief hebdomadaire</button>
            <button type="button" onClick={() => onGenerateBriefing('financial_risk')}>Risques financiers</button>
            <button type="button" onClick={() => onGenerateBriefing('people_workforce')}>Personnes & workforce</button>
          </div>
        ) : null}
      </div>
    </header>
  )
}

function TodayPlane({
  snapshot,
  matters,
  metricFilter,
  onMetricFilter,
  onOpenMatter,
  onQuickAction,
  onOpenDecision,
  loading,
}: {
  snapshot: DirectionCommandSnapshot
  matters: DirectionMatter[]
  metricFilter: string
  onMetricFilter: (filter: string) => void
  onOpenMatter: (matter: DirectionMatter, mode?: 'peek' | 'detail' | 'focus') => void
  onQuickAction: (action: DirectionMatterAction, matter: DirectionMatter) => void
  onOpenDecision: (matter: DirectionMatter) => void
  loading: string | null
}) {
  const lanes: DirectionMatter['lane'][] = ['immediate', 'decision', 'overdue', 'watch']
  return (
    <main className={styles.planeCanvas}>
      <section className={styles.metricRail}>
        {snapshot.metrics.map((metric) => (
          <button type="button" key={metric.key} className={`${styles.metricCard} ${toneClass(metric.tone)} ${metricFilter === metric.filter ? styles.metricCardActive : ''}`} onClick={() => onMetricFilter(metric.filter)}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
            <ChevronRight size={16} />
          </button>
        ))}
      </section>

      <section className={styles.sectionHeader}>
        <div>
          <span className={styles.eyebrow}>EXECUTIVE PRIORITY RUNWAY</span>
          <h2>Voir, comprendre et résoudre sans quitter Direction</h2>
          <p>Chaque matière ouvre son contexte, ses preuves, ses conséquences et ses actions réelles.</p>
        </div>
        <div className={styles.headerLegend}>
          <span><i className={styles.legendCritical} /> Critique</span>
          <span><i className={styles.legendDecision} /> Décision</span>
          <span><i className={styles.legendVerified} /> Vérifié</span>
        </div>
      </section>

      <section className={styles.runway}>
        {lanes.map((lane) => {
          const laneMatters = matters.filter((matter) => matter.lane === lane)
          return (
            <div className={styles.lane} key={lane} data-lane={lane}>
              <div className={styles.laneHeader}>
                <span>{laneTitle(lane)}</span>
                <b>{laneMatters.length}</b>
              </div>
              <div className={styles.laneBody}>
                {laneMatters.length ? laneMatters.slice(0, 8).map((matter) => (
                  <MatterCard
                    key={matter.id}
                    matter={matter}
                    onOpen={() => onOpenMatter(matter)}
                    onQuickAction={(action) => onQuickAction(action, matter)}
                    onDecision={() => onOpenDecision(matter)}
                    loading={loading}
                    currency={snapshot.school.currency}
                  />
                )) : <EmptyLane label="Aucune matière dans cette lane." />}
              </div>
            </div>
          )
        })}
      </section>

      <div className={styles.bottomGrid}>
        <DomainMatrix snapshot={snapshot} onOpen={(domain) => { const first = matters.find((matter) => matter.domain === domain); if (first) onOpenMatter(first) }} />
        <CommitmentLedger snapshot={snapshot} onOpenMatter={onOpenMatter} />
      </div>

      <ActivityTimeline snapshot={snapshot} />
    </main>
  )
}

function MatterCard({ matter, onOpen, onQuickAction, onDecision, loading, currency }: {
  matter: DirectionMatter
  onOpen: () => void
  onQuickAction: (action: DirectionMatterAction) => void
  onDecision: () => void
  loading: string | null
  currency: string
}) {
  const Icon = domainIcon(matter.domain)
  const quickAction = matter.availableActions.includes('acknowledge') ? 'acknowledge'
    : matter.availableActions.includes('take_ownership') ? 'take_ownership'
      : matter.availableActions.includes('mark_checked') ? 'mark_checked' : null
  const loadingThis = loading?.startsWith(`matter:${matter.id}:`)
  return (
    <article className={`${styles.matterCard} ${toneClass(matter.tone)}`}>
      <button type="button" className={styles.matterOpen} onClick={onOpen} aria-label={`Ouvrir ${matter.title}`}>
        <div className={styles.matterTop}>
          <span className={styles.domainBadge}><Icon size={14} /> {DIRECTION_DOMAINS[matter.domain].shortLabel}</span>
          <span className={styles.stateBadge}>{stateLabel(matter.state)}</span>
        </div>
        <h3>{matter.title}</h3>
        <p>{matter.summary}</p>
        <div className={styles.impactStrip}>
          {matter.impact.financialMinor ? <span><CircleDollarSign size={14} /> {formatMoneyMinor(matter.impact.financialMinor, currency)}</span> : null}
          {matter.impact.peopleCount ? <span><Users size={14} /> {matter.impact.peopleCount} pers.</span> : null}
          {matter.dueAt ? <span className={Date.parse(matter.dueAt) < Date.now() ? styles.overdueText : ''}><Clock3 size={14} /> {formatDate(matter.dueAt, true)}</span> : null}
        </div>
        <div className={styles.matterFooter}>
          <span>{matter.ownerLabel || 'Non assigné'}</span>
          <span>{relativeTime(matter.detectedAt)}</span>
        </div>
      </button>
      <div className={styles.quickActions}>
        {quickAction ? (
          <button type="button" onClick={() => onQuickAction(quickAction)} disabled={Boolean(loadingThis)}>
            {loadingThis ? <LoaderCircle size={15} className={styles.spin} /> : quickAction === 'acknowledge' ? <Hand size={15} /> : quickAction === 'take_ownership' ? <UserCheck size={15} /> : <CheckCheck size={15} />}
            {ACTION_LABELS[quickAction]}
          </button>
        ) : null}
        {matter.availableActions.includes('escalate') ? <button type="button" onClick={onDecision}><Gavel size={15} /> Décider</button> : null}
        <button type="button" onClick={onOpen} className={styles.detailButton}><PanelRightOpen size={15} /> Détails</button>
      </div>
    </article>
  )
}

function EmptyLane({ label }: { label: string }) {
  return <div className={styles.emptyLane}><BadgeCheck size={22} /><span>{label}</span><small>La lane se remplira uniquement avec des sources réelles.</small></div>
}

function DomainMatrix({ snapshot, onOpen }: { snapshot: DirectionCommandSnapshot; onOpen: (domain: DirectionDomainKey) => void }) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div><span className={styles.eyebrow}>CROSS-DOMAIN EXECUTIVE MATRIX</span><h2>Posture des domaines</h2></div>
        <Network size={22} />
      </div>
      <div className={styles.domainTable}>
        <div className={styles.domainTableHead}><span>Domaine</span><span>État</span><span>Actifs</span><span>Critiques</span><span>Décisions</span><span>Exposition</span></div>
        {snapshot.domains.map((domain) => (
          <button type="button" key={domain.domain} className={styles.domainRow} onClick={() => onOpen(domain.domain)}>
            <span className={styles.domainIdentity}>{DIRECTION_DOMAINS[domain.domain].label}</span>
            <span className={`${styles.postureBadge} ${toneClass(domain.tone)}`}>{domain.posture}</span>
            <strong>{domain.openMatters}</strong>
            <strong>{domain.criticalMatters}</strong>
            <strong>{domain.decisionsRequired}</strong>
            <span>{domain.financialExposureMinor ? formatMoneyMinor(domain.financialExposureMinor, snapshot.school.currency) : '—'}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function CommitmentLedger({ snapshot, onOpenMatter }: { snapshot: DirectionCommandSnapshot; onOpenMatter: (matter: DirectionMatter) => void }) {
  const commitments = snapshot.commitments.slice(0, 7)
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div><span className={styles.eyebrow}>EXECUTIVE COMMITMENT LEDGER</span><h2>Engagements & échéances</h2></div>
        <ListChecks size={22} />
      </div>
      <div className={styles.commitmentList}>
        {commitments.length ? commitments.map((commitment) => {
          const matter = commitment.matterId ? snapshot.matters.find((item) => item.id === commitment.matterId) : null
          return (
            <button type="button" key={commitment.id} className={styles.commitmentRow} onClick={() => matter && onOpenMatter(matter)} disabled={!matter}>
              <div><strong>{commitment.title}</strong><span>{commitment.ownerLabel || 'Responsable non défini'} · {stateLabel(commitment.state)}</span></div>
              <div className={styles.progressTrack}><i style={{ width: `${commitment.progressPercent}%` }} /></div>
              <span className={commitment.dueAt && Date.parse(commitment.dueAt) < Date.now() ? styles.overdueText : ''}>{formatDate(commitment.dueAt, true)}</span>
            </button>
          )
        }) : <div className={styles.emptyPanel}><ListChecks size={28} /><strong>Aucun engagement exécutif actif</strong><span>Les engagements créés depuis les décisions apparaîtront ici.</span></div>}
      </div>
    </section>
  )
}

function ActivityTimeline({ snapshot }: { snapshot: DirectionCommandSnapshot }) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div><span className={styles.eyebrow}>IMMUTABLE EXECUTIVE TIMELINE</span><h2>Conséquences et activité récente</h2></div>
        <History size={22} />
      </div>
      <div className={styles.activityGrid}>
        {snapshot.activity.slice(0, 12).map((event) => (
          <article key={event.id} className={styles.activityItem}>
            <i className={toneClass(event.tone)} />
            <div><strong>{event.label}</strong><span>{event.detail || 'Événement Direction'}</span></div>
            <small>{event.actorLabel || 'Système'} · {relativeTime(event.createdAt)}</small>
          </article>
        ))}
        {!snapshot.activity.length ? <div className={styles.emptyPanel}><History size={28} /><strong>Aucune activité récente</strong><span>Les actions réelles seront journalisées ici.</span></div> : null}
      </div>
    </section>
  )
}

function NetworkPlane({ snapshot, onDomain }: { snapshot: DirectionCommandSnapshot; onDomain: (domain: DirectionDomainKey) => void }) {
  return (
    <main className={styles.planeCanvas}>
      <section className={styles.sectionHeader}><div><span className={styles.eyebrow}>NETWORK AUTHORITY</span><h2>Réseau, sites et domaines opérationnels</h2><p>Une lecture consolidée sans masquer les sources et les exceptions.</p></div></section>
      <div className={styles.networkGrid}>
        {snapshot.sites.map((site) => (
          <article className={styles.siteCard} key={site.id}>
            <div className={styles.siteCardHead}><div><span>Établissement</span><h3>{site.label}</h3></div><span className={styles.stateBadge}>{site.status}</span></div>
            <div className={styles.readinessRing}><strong>{site.readinessPercent ?? '—'}</strong><span>Readiness</span></div>
            <div className={styles.siteSignals}>
              <span className={toneClass(site.attendanceTone)}>Présence</span>
              <span className={toneClass(site.admissionsTone)}>Admissions</span>
              <span className={toneClass(site.financeTone)}>Finance</span>
              <span className={toneClass(site.workforceTone)}>Workforce</span>
              <span className={toneClass(site.complianceTone)}>Conformité</span>
            </div>
            <div className={styles.siteFooter}><strong>{site.openMatters} matter(s)</strong><span>{site.incidents} incident(s)</span></div>
          </article>
        ))}
      </div>
      <DomainMatrix snapshot={snapshot} onOpen={onDomain} />
    </main>
  )
}

function DecisionsPlane({ snapshot, reason, setReason, onAction, onNew, loading }: {
  snapshot: DirectionCommandSnapshot
  reason: string
  setReason: (value: string) => void
  onAction: (decision: DirectionDecision, action: 'request_evidence' | 'approve' | 'conditional_approval' | 'reject' | 'execute') => void
  onNew: () => void
  loading: string | null
}) {
  return (
    <main className={styles.planeCanvas}>
      <section className={styles.sectionHeader}>
        <div><span className={styles.eyebrow}>EXECUTIVE DECISION COUNCIL</span><h2>Décider avec preuves, conséquences et exécution</h2><p>Une décision n’est terminée que lorsque sa conséquence est exécutée ou explicitement planifiée.</p></div>
        <button type="button" className={styles.sectionAction} onClick={onNew}><Gavel size={17} /> Nouvelle décision</button>
      </section>
      <div className={styles.decisionLayout}>
        <div className={styles.decisionList}>
          {snapshot.decisions.length ? snapshot.decisions.map((decision) => (
            <article className={`${styles.decisionCard} ${toneClass(decision.state === 'rejected' ? 'critical' : decision.state === 'approved' || decision.state === 'executed' ? 'verified' : 'decision')}`} key={decision.id}>
              <div className={styles.decisionTop}><span>{decision.decisionCode}</span><span className={styles.stateBadge}>{stateLabel(decision.state)}</span></div>
              <h3>{decision.title}</h3>
              <p>{decision.question}</p>
              <div className={styles.decisionMeta}><span>{DIRECTION_DOMAINS[decision.domain].label}</span><span>{decision.ownerLabel || 'Direction'}</span><span>{formatDate(decision.dueAt, true)}</span></div>
              <div className={styles.optionStack}>
                {decision.options.map((option) => <div key={option.key} className={decision.recommendedOptionKey === option.key ? styles.recommendedOption : ''}><strong>{option.label}</strong><span>{option.consequence}</span></div>)}
              </div>
              <div className={styles.decisionActions}>
                {['submitted', 'evidence_required'].includes(decision.state) ? <>
                  <button type="button" onClick={() => onAction(decision, 'request_evidence')} disabled={Boolean(loading)}><FileSearch size={15} /> Preuve</button>
                  <button type="button" onClick={() => onAction(decision, 'approve')} disabled={Boolean(loading)}><Check size={15} /> Approuver</button>
                  <button type="button" onClick={() => onAction(decision, 'conditional_approval')} disabled={Boolean(loading)}><ListChecks size={15} /> Sous conditions</button>
                  <button type="button" onClick={() => onAction(decision, 'reject')} disabled={Boolean(loading)}><X size={15} /> Rejeter</button>
                </> : null}
                {['approved', 'conditionally_approved'].includes(decision.state) ? <button type="button" className={styles.primaryInline} onClick={() => onAction(decision, 'execute')} disabled={Boolean(loading)}><Zap size={15} /> Exécuter la conséquence</button> : null}
              </div>
            </article>
          )) : <div className={styles.emptyPanel}><Gavel size={32} /><strong>Aucune décision enregistrée</strong><span>Créez une décision gouvernée depuis une matière ou le studio exécutif.</span></div>}
        </div>
        <aside className={styles.decisionRail}>
          <span className={styles.eyebrow}>JUSTIFICATION DE COMMANDE</span>
          <h3>Motif de la prochaine action</h3>
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Expliquez le choix, les conditions, la preuve ou la raison du rejet…" />
          <div className={styles.authorityCard}><LockKeyhole size={18} /><div><strong>Validation active</strong><span>{snapshot.viewer.roleLabel}</span></div></div>
          <div className={styles.authorityCard}><ShieldCheck size={18} /><div><strong>Audit automatique</strong><span>Avant, après, acteur et conséquence</span></div></div>
        </aside>
      </div>
    </main>
  )
}

function RisksPlane({ matters, onOpenMatter }: { matters: DirectionMatter[]; onOpenMatter: (matter: DirectionMatter, mode?: 'peek' | 'detail' | 'focus') => void }) {
  const risks = matters.filter((matter) => matter.severity === 'critical' || matter.severity === 'high' || matter.lane === 'overdue')
  return (
    <main className={styles.planeCanvas}>
      <section className={styles.sectionHeader}><div><span className={styles.eyebrow}>RISK & INTERVENTION AUTHORITY</span><h2>Risques, expositions et résolution</h2><p>Les matières sont classées par sévérité, délai et impact réel.</p></div></section>
      <div className={styles.riskBoard}>
        {risks.map((matter) => (
          <button type="button" className={`${styles.riskRow} ${toneClass(matter.tone)}`} key={matter.id} onClick={() => onOpenMatter(matter, 'focus')}>
            <span className={styles.riskSeverity}>{matter.severity}</span>
            <div><strong>{matter.title}</strong><span>{matter.summary}</span></div>
            <span>{DIRECTION_DOMAINS[matter.domain].label}</span>
            <span>{matter.ownerLabel || 'Non assigné'}</span>
            <span>{formatDate(matter.dueAt, true)}</span>
            <Maximize2 size={17} />
          </button>
        ))}
        {!risks.length ? <div className={styles.emptyPanel}><ShieldCheck size={34} /><strong>Aucun risque élevé actif</strong><span>Les risques réels apparaîtront ici sans données simulées.</span></div> : null}
      </div>
    </main>
  )
}

function CommitmentsPlane({ snapshot, onOpenMatter, onAction, onNew, loading }: { snapshot: DirectionCommandSnapshot; onOpenMatter: (id: string) => void; onAction: (commitment: DirectionCommitment, action: DirectionCommitmentActionRequest['action'], reasonOverride?: string) => void; onNew: () => void; loading: string | null }) {
  return (
    <main className={styles.planeCanvas}>
      <section className={styles.sectionHeader}><div><span className={styles.eyebrow}>EXECUTIVE COMMITMENT CONTROL</span><h2>Responsabilités, échéances et preuves</h2><p>Chaque engagement conserve son origine, son propriétaire et sa condition de clôture.</p></div><button type="button" className={styles.sectionAction} onClick={onNew}><Target size={16} /> Nouvel engagement</button></section>
      <div className={styles.commitmentBoard}>
        {snapshot.commitments.map((commitment) => {
          const busy = Boolean(loading?.startsWith(`commitment:${commitment.id}:`))
          const sourceMatterId = commitment.matterId
          return (
          <article className={styles.commitmentCard} key={commitment.id}>
            <div className={styles.commitmentCardTop}><span>{commitment.commitmentCode}</span><span className={styles.stateBadge}>{stateLabel(commitment.state)}</span></div>
            <h3>{commitment.title}</h3>
            <div className={styles.commitmentOwner}><UserCheck size={16} /><span>{commitment.ownerLabel || 'Responsable non défini'}</span></div>
            <div className={styles.progressTrackLarge}><i style={{ width: `${commitment.progressPercent}%` }} /><strong>{commitment.progressPercent}%</strong></div>
            <div className={styles.commitmentFacts}><span>Échéance <strong>{formatDate(commitment.dueAt, true)}</strong></span><span>Checkpoint <strong>{commitment.nextCheckpoint || 'Non défini'}</strong></span></div>
            {commitment.blocker ? <div className={styles.blocker}><AlertTriangle size={16} /> {commitment.blocker}</div> : null}
            <div className={styles.commitmentActions}>
              {commitment.state === 'open' ? <button type="button" onClick={() => onAction(commitment, 'acknowledge')} disabled={busy}><Hand size={15} /> Accuser</button> : null}
              {['open','acknowledged','blocked'].includes(commitment.state) ? <button type="button" onClick={() => onAction(commitment, 'start')} disabled={busy}><Zap size={15} /> Démarrer</button> : null}
              {!['completed','cancelled'].includes(commitment.state) ? <button type="button" className={styles.actionPositive} onClick={() => onAction(commitment, 'complete')} disabled={busy}>{busy ? <LoaderCircle size={15} className={styles.spin} /> : <BadgeCheck size={15} />} Terminer</button> : null}
              {commitment.state === 'completed' ? <button type="button" onClick={() => onAction(commitment, 'reopen', 'Engagement réouvert pour action complémentaire.')} disabled={busy}><RotateCcw size={15} /> Réouvrir</button> : null}
              {sourceMatterId ? <button type="button" onClick={() => onOpenMatter(sourceMatterId)}>Matter source <ArrowRight size={15} /></button> : commitment.exactHref ? <Link href={commitment.exactHref}>Dossier exact <CornerUpRight size={15} /></Link> : null}
            </div>
          </article>
        )})}
        {!snapshot.commitments.length ? <div className={styles.emptyPanel}><Target size={34} /><strong>Aucun engagement actif</strong><span>Créez un suivi depuis un dossier ou une décision.</span><button type="button" className={styles.sectionAction} onClick={onNew}>Créer le premier engagement</button></div> : null}
      </div>
    </main>
  )
}

function PerformancePlane({ snapshot, onDomain }: { snapshot: DirectionCommandSnapshot; onDomain: (domain: DirectionDomainKey) => void }) {
  return (
    <main className={styles.planeCanvas}>
      <section className={styles.sectionHeader}><div><span className={styles.eyebrow}>EXECUTIVE PERFORMANCE FABRIC</span><h2>Santé, charge et exposition consolidées</h2><p>Aucune prédiction non prouvée: uniquement les signaux autoritatifs disponibles.</p></div></section>
      <section className={styles.performanceHero}>
        <div className={`${styles.scoreDial} ${toneClass(snapshot.posture.state === 'critical' ? 'critical' : snapshot.posture.state === 'attention' ? 'warning' : 'verified')}`}><strong>{snapshot.posture.score}</strong><span>Posture globale</span></div>
        <div className={styles.performanceNarrative}><span>{snapshot.posture.label}</span><h3>{snapshot.posture.rationale}</h3><p>{snapshot.matters.filter((matter) => !['resolved', 'released'].includes(matter.state)).length} dossiers actifs · {snapshot.decisions.filter((decision) => ['submitted', 'evidence_required'].includes(decision.state)).length} décisions requises.</p></div>
      </section>
      <div className={styles.performanceGrid}>
        {snapshot.domains.map((domain) => {
          const pressure = Math.min(100, domain.criticalMatters * 35 + domain.openMatters * 8 + domain.decisionsRequired * 12)
          return (
            <button type="button" className={styles.performanceDomain} key={domain.domain} onClick={() => onDomain(domain.domain)}>
              <div><strong>{domain.label}</strong><span>{domain.posture}</span></div>
              <div className={styles.pressureTrack}><i style={{ width: `${pressure}%` }} /></div>
              <div><span>{domain.openMatters} actifs</span><span>{domain.criticalMatters} critiques</span><span>{domain.peopleAffected} pers.</span></div>
            </button>
          )
        })}
      </div>
    </main>
  )
}

function CalendarPlane({ snapshot, onOpenMatter }: { snapshot: DirectionCommandSnapshot; onOpenMatter: (matter: DirectionMatter) => void }) {
  const items = [
    ...snapshot.matters.filter((matter) => matter.dueAt).map((matter) => ({ id: matter.id, type: 'matter', label: matter.title, dueAt: matter.dueAt as string, domain: matter.domain, matter })),
    ...snapshot.commitments.filter((commitment) => commitment.dueAt).map((commitment) => ({ id: commitment.id, type: 'commitment', label: commitment.title, dueAt: commitment.dueAt as string, domain: commitment.domain, matter: commitment.matterId ? snapshot.matters.find((item) => item.id === commitment.matterId) || null : null })),
    ...snapshot.decisions.filter((decision) => decision.dueAt).map((decision) => ({ id: decision.id, type: 'decision', label: decision.title, dueAt: decision.dueAt as string, domain: decision.domain, matter: decision.matterId ? snapshot.matters.find((item) => item.id === decision.matterId) || null : null })),
  ].sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt))
  return (
    <main className={styles.planeCanvas}>
      <section className={styles.sectionHeader}><div><span className={styles.eyebrow}>CALENDRIER DE LA DIRECTION</span><h2>Échéances et décisions à ne pas manquer</h2><p>Chaque date est reliée au dossier, à la décision ou à l’engagement concerné.</p></div></section>
      <div className={styles.calendarList}>
        {items.map((item) => (
          <button type="button" className={styles.calendarItem} key={`${item.type}:${item.id}`} onClick={() => item.matter && onOpenMatter(item.matter)} disabled={!item.matter}>
            <div className={Date.parse(item.dueAt) < Date.now() ? styles.calendarDateOverdue : styles.calendarDate}><strong>{new Date(item.dueAt).getDate()}</strong><span>{new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(new Date(item.dueAt))}</span></div>
            <div><span>{item.type} · {DIRECTION_DOMAINS[item.domain].shortLabel}</span><strong>{item.label}</strong></div>
            <span>{formatDate(item.dueAt, true)}</span>
            <ChevronRight size={17} />
          </button>
        ))}
        {!items.length ? <div className={styles.emptyPanel}><CalendarClock size={34} /><strong>Aucune échéance active</strong><span>Les deadlines réelles apparaîtront ici.</span></div> : null}
      </div>
    </main>
  )
}

function AuditPlane({ snapshot }: { snapshot: DirectionCommandSnapshot }) {
  return (
    <main className={styles.planeCanvas}>
      <section className={styles.sectionHeader}><div><span className={styles.eyebrow}>HISTORIQUE DE LA DIRECTION</span><h2>Qui a fait quoi, quand et avec quel résultat</h2><p>Retrouvez les décisions, les actions et leurs conséquences pour l’école.</p></div></section>
      <div className={styles.auditTable}>
        <div className={styles.auditHead}><span>Événement</span><span>Contexte</span><span>Acteur</span><span>Date</span></div>
        {snapshot.activity.map((event) => (
          <article className={styles.auditRow} key={event.id}>
            <div><i className={toneClass(event.tone)} /><strong>{event.label}</strong></div>
            <span>{event.detail || 'Direction'}</span>
            <span>{event.actorLabel || 'Système'}</span>
            <span>{formatDate(event.createdAt, true)}</span>
          </article>
        ))}
        {!snapshot.activity.length ? <div className={styles.emptyPanel}><History size={34} /><strong>Aucune action enregistrée</strong><span>Les décisions et modifications apparaîtront ici dès leur enregistrement.</span></div> : null}
      </div>
    </main>
  )
}

function MatterDrawer({ matter, mode, tab, setTab, onMode, onClose, onAction, onCreateDecision, onCreateCommitment, reason, setReason, loading, currency }: {
  matter: DirectionMatter
  mode: 'peek' | 'detail' | 'focus'
  tab: 'situation' | 'impact' | 'records' | 'evidence' | 'timeline' | 'authority' | 'audit'
  setTab: (tab: 'situation' | 'impact' | 'records' | 'evidence' | 'timeline' | 'authority' | 'audit') => void
  onMode: (mode: 'peek' | 'detail' | 'focus') => void
  onClose: () => void
  onAction: (action: DirectionMatterAction, matter: DirectionMatter) => void
  onCreateDecision: () => void
  onCreateCommitment: () => void
  reason: string
  setReason: (value: string) => void
  loading: string | null
  currency: string
}) {
  const Icon = domainIcon(matter.domain)
  const tabs = [
    ['situation', 'Ce qu’il faut savoir'], ['impact', 'Conséquences'], ['records', 'Dossiers concernés'], ['evidence', 'Documents'],
    ['timeline', 'Historique'], ['authority', 'Validation'], ['audit', 'Historique'],
  ] as const
  return (
    <CustomerOverlaySurface kind={mode === 'focus' ? 'focus-command' : mode === 'peek' ? 'quick-peek' : 'dossier'} onClose={onClose} className={`${styles.drawerOverlay} ${mode === 'focus' ? styles.drawerOverlayFocus : ''}`} ariaLabel={matter.title}>
      <aside className={`${styles.matterDrawer} ${styles[`matterDrawer_${mode}`]}`} role="dialog" aria-modal="true" aria-label={matter.title}>
        <header className={styles.drawerHeader}>
          <div className={styles.drawerIdentity}>
            <span className={`${styles.drawerIcon} ${toneClass(matter.tone)}`}><Icon size={22} /></span>
            <div><SchoolAdminBreadcrumb items={[{ key: 'direction', label: 'Direction' }, { key: matter.domain, label: DIRECTION_DOMAINS[matter.domain].label }, { key: matter.id, label: matter.title }]} /><span>{matter.sourceLabel}</span><h2>{matter.title}</h2></div>
          </div>
          <div className={styles.drawerControls}>
            <button type="button" onClick={() => onMode(mode === 'focus' ? 'detail' : 'focus')} aria-label="Agrandir ou réduire le dossier"><Maximize2 size={18} /></button>
            <button type="button" onClick={onClose} aria-label="Fermer"><X size={19} /></button>
          </div>
        </header>

        <SchoolAdminAssignmentPanel owner={matter.ownerLabel} dueAt={formatDate(matter.dueAt, true)} updatedAt={formatDate(matter.updatedAt, true)} nextStep={matter.availableActions[0] ? ACTION_LABELS[matter.availableActions[0]] : 'Vérifier le dossier'} />

        <nav className={styles.drawerTabs}>
          {tabs.map(([key, label]) => <button type="button" key={key} className={tab === key ? styles.drawerTabActive : ''} onClick={() => setTab(key)}>{label}</button>)}
        </nav>

        <div className={styles.drawerBody}>
          {tab === 'situation' ? <>
            <SchoolAdminSituationSummary
              summary={matter.summary}
              reason={`Ce dossier apparaît parce que ${matter.sourceLabel} demande une vérification, une décision ou un suivi de la direction.`}
              consequence={matter.impact.operational || 'Le dossier restera visible dans les éléments à traiter tant que la situation ne sera pas réglée.'}
              tone={matter.tone === 'critical' ? 'critical' : matter.tone === 'warning' ? 'warning' : matter.tone === 'verified' ? 'success' : 'info'}
            />
            {matter.availableActions[0] ? <SchoolAdminNextAction config={{
              title: ACTION_LABELS[matter.availableActions[0]],
              detail: 'Cette action peut être effectuée ici. Le résultat sera immédiatement visible dans le dossier et sur la page Direction.',
              label: ACTION_LABELS[matter.availableActions[0]],
              onAction: () => onAction(matter.availableActions[0], matter),
              tone: matter.tone === 'critical' ? 'critical' : 'approval',
            }} /> : <SchoolAdminEmptyState title="Aucune action nécessaire" detail="Ce dossier ne demande aucune intervention de la direction pour le moment." />}
            <div className={styles.situationGrid}>
              <InfoBlock icon={Clock3} label="Depuis combien de temps ?" value={relativeTime(matter.detectedAt)} />
              <InfoBlock icon={UserCheck} label="Qui s’en occupe ?" value={matter.ownerLabel || 'À attribuer'} />
              <InfoBlock icon={Target} label="Résultat attendu" value={matter.impact.operational || 'Situation vérifiée et réglée'} />
            </div>
          </> : null}

          {tab === 'impact' ? <div className={styles.impactMap}>
            <ImpactBlock icon={Activity} label="Opérationnel" value={matter.impact.operational || 'Non renseigné'} />
            <ImpactBlock icon={CircleDollarSign} label="Financier" value={matter.impact.financialMinor ? formatMoneyMinor(matter.impact.financialMinor, currency) : 'Aucun impact chiffré'} />
            <ImpactBlock icon={Users} label="Personnes" value={matter.impact.peopleCount ? `${matter.impact.peopleCount} personne(s)` : 'Non quantifié'} />
            <ImpactBlock icon={UserCheck} label="Familles" value={matter.impact.familyCount ? `${matter.impact.familyCount} famille(s)` : 'Non quantifié'} />
            <ImpactBlock icon={ShieldCheck} label="Conformité" value={matter.impact.compliance || 'Aucun signal déclaré'} />
            <ImpactBlock icon={GitBranch} label="Dépendances" value={matter.impact.dependencies.length ? matter.impact.dependencies.join(' · ') : 'Aucune dépendance déclarée'} />
          </div> : null}

          {tab === 'records' ? <div className={styles.recordList}>
            {matter.linkedRecords.map((record) => (
              <Link className={styles.recordRow} key={`${record.type}:${record.id}`} href={record.href}>
                <Layers3 size={18} />
                <div><strong>{record.label}</strong><span>{record.secondary || record.type}</span></div>
                <span>{record.status || 'Ouvrir'}</span><ArrowRight size={17} />
              </Link>
            ))}
            {!matter.linkedRecords.length ? <div className={styles.emptyPanel}><Layers3 size={30} /><strong>Aucun autre dossier concerné</strong><span>Toutes les informations utiles sont déjà réunies dans ce dossier.</span></div> : null}
            <Link className={styles.exactOpenButton} href={matter.exactHref}><CornerUpRight size={17} /> Ouvrir la fiche complète concernée</Link>
          </div> : null}

          {tab === 'evidence' ? <div className={styles.evidenceList}>
            {matter.evidence.map((item) => (
              item.href ? <Link href={item.href} className={styles.evidenceRow} key={item.id}><FileCheck2 size={18} /><div><strong>{item.label}</strong><span>{item.kind} · {item.state}</span></div><ChevronRight size={17} /></Link>
                : <article className={styles.evidenceRow} key={item.id}><FileCheck2 size={18} /><div><strong>{item.label}</strong><span>{item.kind} · {item.state}</span></div></article>
            ))}
            {!matter.evidence.length ? <div className={styles.emptyPanel}><FileSearch size={30} /><strong>Aucun document ajouté</strong><span>Utilisez « Demander le document manquant » pour préciser ce qui doit être fourni.</span></div> : null}
          </div> : null}

          {tab === 'timeline' ? <div className={styles.timeline}>
            {matter.timeline.map((event) => <article key={event.id}><i className={toneClass(event.tone)} /><div><strong>{event.label}</strong><span>{event.detail || event.eventType}</span></div><small>{event.actorLabel || 'Système'} · {formatDate(event.createdAt, true)}</small></article>)}
            {!matter.timeline.length ? <div className={styles.emptyPanel}><History size={30} /><strong>Aucune action enregistrée</strong><span>La première mise à jour apparaîtra ici.</span></div> : null}
          </div> : null}

          {tab === 'authority' ? <div className={styles.authorityGrid}>
            <InfoBlock icon={LockKeyhole} label="Validation nécessaire" value={matter.availableActions.includes('resolve') ? 'Direction ou autorité déléguée' : 'Intervenant autorisé'} />
            <InfoBlock icon={ShieldCheck} label="Actions possibles" value={matter.availableActions.map((action) => ACTION_LABELS[action]).join(' · ') || 'Lecture seule'} />
            <InfoBlock icon={GitBranch} label="Conséquence" value="La situation sera mise à jour et l’historique de l’école conservera la modification." />
            <InfoBlock icon={RotateCcw} label="Correction" value="Le dossier pourra être réouvert sans supprimer son historique." />
          </div> : null}

          {tab === 'audit' ? <div className={styles.auditDetail}>
            <InfoBlock icon={History} label="Référence de suivi" value={matter.fingerprint} />
            <InfoBlock icon={Layers3} label="Dossier d’origine" value={`${matter.sourceType} · ${matter.sourceId}`} />
            <InfoBlock icon={Clock3} label="Dernière mise à jour" value={formatDate(matter.updatedAt, true)} />
            <InfoBlock icon={ShieldCheck} label="Résultat final" value={matter.resolutionReason || 'Aucun résultat final enregistré'} />
          </div> : null}
        </div>

        <footer className={styles.drawerFooter}>
          <div className={styles.reasonBox}>
            <label>Note ou motif de la décision</label>
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Expliquez simplement la décision, les conditions ou le document attendu…" />
          </div>
          <div className={styles.drawerActionGrid}>
            {matter.availableActions.map((action) => {
              const IconAction = ACTION_ICONS[action] || Command
              const busy = loading === `matter:${matter.id}:${action}`
              if (action === 'assign') return null
              return <button type="button" key={action} className={['resolve', 'approve'].includes(action) ? styles.actionPositive : ['release', 'reopen', 'escalate'].includes(action) ? styles.actionImportant : ''} onClick={() => onAction(action, matter)} disabled={Boolean(loading)}>{busy ? <LoaderCircle size={16} className={styles.spin} /> : <IconAction size={16} />}{ACTION_LABELS[action]}</button>
            })}
            <button type="button" onClick={onCreateCommitment}><Target size={16} /> Attribuer un suivi</button>
            {matter.availableActions.includes('escalate') ? <button type="button" className={styles.actionDecision} onClick={onCreateDecision}><Gavel size={16} /> Ouvrir le Conseil</button> : null}
            <Link className={styles.actionExact} href={matter.exactHref}><CornerUpRight size={16} /> Aller résoudre dans le dossier exact</Link>
          </div>
        </footer>
      </aside>
    </CustomerOverlaySurface>
  )
}

function InfoBlock({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <article className={styles.infoBlock}><Icon size={18} /><div><span>{label}</span><strong>{value}</strong></div></article>
}

function ImpactBlock({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <article className={styles.impactBlock}><span><Icon size={18} /></span><div><small>{label}</small><strong>{value}</strong></div></article>
}

function CommandStudio({ value, onChange, onClose, onSaveDraft, onSubmit, loading, currency }: {
  value: CommandStudioState
  onChange: (value: CommandStudioState) => void
  onClose: () => void
  onSaveDraft: () => void
  onSubmit: () => void
  loading: boolean
  currency: string
}) {
  function selectTemplate(key: string) {
    const template = DIRECTION_COMMAND_TEMPLATES.find((item) => item.key === key)
    if (!template) return
    onChange({ ...value, templateKey: key, domain: template.domain, title: value.title || template.label, question: value.question || `Quelle décision doit être prise pour ${template.description.toLowerCase()} ?` })
  }
  return (
    <CustomerOverlaySurface kind="nested-command" onClose={onClose} className={styles.studioOverlay} dirty={Boolean(value.title || value.question || value.conditions || value.operationalImpact)} ariaLabel="Executive Command Studio">
      <section className={styles.commandStudio} role="dialog" aria-modal="true" aria-label="Executive Command Studio">
        <header><div><span className={styles.eyebrow}>PRÉPARER UNE DÉCISION</span><h2>Préparer une décision claire pour l’école</h2><p>Expliquez la question à décider, comparez les choix possibles et vérifiez ce qui changera avant de soumettre.</p></div><button type="button" onClick={onClose}><X size={20} /></button></header>
        <div className={styles.studioColumns}>
          <aside className={styles.templateColumn}>
            <span className={styles.columnTitle}>01 · Type de décision</span>
            {DIRECTION_COMMAND_TEMPLATES.map((template) => <button type="button" key={template.key} className={value.templateKey === template.key ? styles.templateActive : ''} onClick={() => selectTemplate(template.key)}><strong>{template.label}</strong><span>{template.description}</span></button>)}
          </aside>
          <main className={styles.constructionColumn}>
            <span className={styles.columnTitle}>02 · Informations à compléter</span>
            <label>Titre de la décision<input value={value.title} onChange={(event) => onChange({ ...value, title: event.target.value })} placeholder="Ex. Arbitrage capacité admission septembre" /></label>
            <label>Question à trancher<textarea value={value.question} onChange={(event) => onChange({ ...value, question: event.target.value })} placeholder="Formulez clairement la question à laquelle la direction doit répondre." /></label>
            <div className={styles.formRow}>
              <label>Domaine<select value={value.domain} onChange={(event) => onChange({ ...value, domain: event.target.value as DirectionDomainKey })}>{(Object.keys(DIRECTION_DOMAINS) as DirectionDomainKey[]).map((domain) => <option key={domain} value={domain}>{DIRECTION_DOMAINS[domain].label}</option>)}</select></label>
              <label>Priorité<select value={value.severity} onChange={(event) => onChange({ ...value, severity: event.target.value as DirectionSeverity })}><option value="critical">Critique</option><option value="high">Haute</option><option value="medium">Moyenne</option><option value="low">Basse</option></select></label>
            </div>
            <div className={styles.formRow}><label>Échéance<input type="datetime-local" value={value.dueAt} onChange={(event) => onChange({ ...value, dueAt: event.target.value })} /></label><label>Responsable<input value={value.ownerLabel} onChange={(event) => onChange({ ...value, ownerLabel: event.target.value })} placeholder="Direction ou responsable" /></label></div>
            <span className={styles.fieldHeading}>Options et conséquences</span>
            {value.options.map((option, index) => <div className={styles.optionEditor} key={option.key}><input value={option.label} onChange={(event) => { const options = [...value.options]; options[index] = { ...option, label: event.target.value }; onChange({ ...value, options }) }} /><textarea value={option.consequence} onChange={(event) => { const options = [...value.options]; options[index] = { ...option, consequence: event.target.value }; onChange({ ...value, options }) }} /></div>)}
            <label>Conditions<textarea value={value.conditions} onChange={(event) => onChange({ ...value, conditions: event.target.value })} placeholder="Une condition par ligne" /></label>
          </main>
          <aside className={styles.impactColumn}>
            <span className={styles.columnTitle}>03 · Ce qui va changer</span>
            <label>Conséquence pour l’école<textarea value={value.operationalImpact} onChange={(event) => onChange({ ...value, operationalImpact: event.target.value })} placeholder="Ce qui changera réellement" /></label>
            <div className={styles.formRow}><label>Impact financier ({currency})<input type="number" value={value.financialImpact} onChange={(event) => onChange({ ...value, financialImpact: event.target.value })} /></label><label>Personnes affectées<input type="number" value={value.peopleCount} onChange={(event) => onChange({ ...value, peopleCount: event.target.value })} /></label></div>
            <div className={styles.previewCard}><span>Validation</span><strong>Direction ou personne autorisée</strong><small>Les droits seront vérifiés au moment de la validation.</small></div>
            <div className={styles.previewCard}><span>Résultat attendu</span><strong>{value.options.find((option) => option.key === value.recommendedOptionKey)?.consequence || 'À définir'}</strong><small>La décision restera ouverte tant que la conséquence n’est pas exécutée.</small></div>
            <div className={styles.previewCard}><span>Historique</span><strong>Situation avant et après · motif · document</strong><small>La décision restera enregistrée dans l’historique de l’école.</small></div>
          </aside>
        </div>
        <footer><button type="button" onClick={onClose}>Annuler</button><button type="button" className={styles.studioSecondary} onClick={onSaveDraft} disabled={loading}><FileCheck2 size={16} /> Enregistrer brouillon</button><button type="button" className={styles.studioPrimary} onClick={onSubmit} disabled={loading}>{loading ? <LoaderCircle size={17} className={styles.spin} /> : <Send size={17} />} Envoyer pour validation</button></footer>
      </section>
    </CustomerOverlaySurface>
  )
}

function CommitmentStudio({ value, onChange, onClose, onSubmit, loading }: { value: CommitmentStudioState; onChange: (value: CommitmentStudioState) => void; onClose: () => void; onSubmit: () => void; loading: boolean }) {
  return (
    <CustomerOverlaySurface kind="nested-command" onClose={onClose} className={styles.studioOverlay} dirty={Boolean(value.title || value.ownerLabel || value.dueAt || value.nextCheckpoint || value.evidenceRequired)} ariaLabel="Studio engagement exécutif">
      <section className={`${styles.commandStudio} ${styles.commitmentStudio}`} role="dialog" aria-modal="true" aria-label="Studio engagement exécutif">
        <header><div><span className={styles.eyebrow}>ATTRIBUER UN SUIVI</span><h2>Confier une action et suivre sa réalisation</h2><p>Responsable, échéance, checkpoint, preuve et matter source restent liés jusqu’à la clôture.</p></div><button type="button" onClick={onClose}><X size={20} /></button></header>
        <div className={styles.commitmentStudioGrid}>
          <main className={styles.constructionColumn}>
            <label>Action à réaliser<input value={value.title} onChange={(event) => onChange({ ...value, title: event.target.value })} placeholder="Ex. Fermer les dossiers admission incomplets" /></label>
            <div className={styles.formRow}><label>Domaine<select value={value.domain} onChange={(event) => onChange({ ...value, domain: event.target.value as DirectionDomainKey })}>{(Object.keys(DIRECTION_DOMAINS) as DirectionDomainKey[]).map((domain) => <option key={domain} value={domain}>{DIRECTION_DOMAINS[domain].label}</option>)}</select></label><label>Responsable<input value={value.ownerLabel} onChange={(event) => onChange({ ...value, ownerLabel: event.target.value })} placeholder="Responsable ou équipe" /></label></div>
            <div className={styles.formRow}><label>Échéance<input type="datetime-local" value={value.dueAt} onChange={(event) => onChange({ ...value, dueAt: event.target.value })} /></label><label>Prochaine vérification<input value={value.nextCheckpoint} onChange={(event) => onChange({ ...value, nextCheckpoint: event.target.value })} placeholder="Résultat attendu au prochain contrôle" /></label></div>
            <label>Document ou résultat attendu<textarea value={value.evidenceRequired} onChange={(event) => onChange({ ...value, evidenceRequired: event.target.value })} placeholder="Une preuve par ligne" /></label>
          </main>
          <aside className={styles.impactColumn}>
            <span className={styles.columnTitle}>RÉSUMÉ DU SUIVI</span>
            <div className={styles.previewCard}><span>Dossier d’origine</span><strong>{value.matterId ? 'Dossier Direction lié' : 'Suivi créé par la direction'}</strong><small>Le dossier d’origine restera visible dans l’historique.</small></div>
            <div className={styles.previewCard}><span>Fermeture</span><strong>Action terminée et résultat vérifié</strong><small>Une fois terminé, le suivi disparaîtra des actions en cours mais restera dans l’historique.</small></div>
            <div className={styles.previewCard}><span>En cas de retard</span><strong>Échéance, difficulté et responsable</strong><small>Les suivis en retard réapparaissent dans les priorités de la direction.</small></div>
          </aside>
        </div>
        <footer><button type="button" onClick={onClose}>Annuler</button><button type="button" className={styles.studioPrimary} onClick={onSubmit} disabled={loading}>{loading ? <LoaderCircle size={17} className={styles.spin} /> : <Target size={17} />} Attribuer ce suivi</button></footer>
      </section>
    </CustomerOverlaySurface>
  )
}

function BriefingDrawer({ briefing, onClose, snapshot, onOpenMatter }: { briefing: DirectionBriefing; onClose: () => void; snapshot: DirectionCommandSnapshot; onOpenMatter: (matter: DirectionMatter) => void }) {
  return (
    <CustomerOverlaySurface kind="dossier" onClose={onClose} className={styles.drawerOverlay} ariaLabel={briefing.title}>
      <aside className={`${styles.matterDrawer} ${styles.matterDrawer_detail}`} role="dialog" aria-modal="true" aria-label={briefing.title}>
        <header className={styles.drawerHeader}><div className={styles.drawerIdentity}><span className={`${styles.drawerIcon} ${toneClass('decision')}`}><FileCheck2 size={22} /></span><div><span>RÉSUMÉ DE LA DIRECTION · {formatDate(briefing.generatedAt, true)}</span><h2>{briefing.title}</h2></div></div><button type="button" className={styles.iconButton} onClick={onClose}><X size={19} /></button></header>
        <div className={styles.briefingBody}>
          <section className={styles.briefingSummary}><span>Posture</span><h3>{briefing.posture}</h3>{briefing.executiveSummary.map((line) => <p key={line}>{line}</p>)}</section>
          <section><span className={styles.eyebrow}>DOSSIERS PRIORITAIRES</span><div className={styles.briefingMatterList}>{briefing.topMatters.map((matter) => <button type="button" key={matter.id} onClick={() => { onClose(); const current = snapshot.matters.find((item) => item.id === matter.id) || matter; onOpenMatter(current) }}><span className={toneClass(matter.tone)}>{matter.severity}</span><div><strong>{matter.title}</strong><small>{DIRECTION_DOMAINS[matter.domain].label}</small></div><ChevronRight size={17} /></button>)}</div></section>
          <section><span className={styles.eyebrow}>DÉCISIONS À PRENDRE</span><div className={styles.briefingFacts}><strong>{briefing.decisionsRequired.length}</strong><span>décision(s) en attente</span></div></section>
          <section><span className={styles.eyebrow}>SUIVIS À TERMINER</span><div className={styles.briefingFacts}><strong>{briefing.commitmentsDue.length}</strong><span>engagement(s) suivis</span></div></section>
        </div>
      </aside>
    </CustomerOverlaySurface>
  )
}

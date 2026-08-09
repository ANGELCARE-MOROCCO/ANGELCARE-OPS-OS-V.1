'use client'

import Link from 'next/link'
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ChangeEvent, FormEvent, MouseEvent, ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Command,
  FileText,
  Gauge,
  Gavel,
  Layers3,
  LayoutDashboard,
  Network,
  Plus,
  RefreshCw,
  Scale,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react'
import AngelCareLogo from '@/components/brand/AngelCareLogo'
import type {
  ExecutiveAgendaStream,
  ExecutiveBoardSession,
  ExecutiveDecision,
  ExecutiveEntityType,
  ExecutiveInitiative,
  ExecutiveMandate,
  ExecutiveObjective,
  ExecutivePaper,
  ExecutivePriority,
  ExecutiveRisk,
  ExecutiveSceneKey,
  ExecutiveSnapshot,
  ExecutiveTone,
} from '@/types/angelcare360/operator/executive-command'
import styles from './ExecutiveCommandCabinet.module.css'

const SCENES: Array<{
  key: ExecutiveSceneKey
  number: string
  label: string
  short: string
  description: string
  icon: typeof Command
}> = [
  { key: 'command', number: '01', label: 'Executive Command Center', short: 'Command', description: 'Priorités, interventions et autorité en temps réel.', icon: Command },
  { key: 'decisions', number: '02', label: 'Decisions & Authority', short: 'Decisions', description: 'Arbitrage, conditions, mandat et outcome.', icon: Gavel },
  { key: 'agenda', number: '03', label: 'Strategic Agenda', short: 'Agenda', description: 'Piliers, horizons, dépendances et résultats.', icon: Target },
  { key: 'performance', number: '04', label: 'Performance & Outcomes', short: 'Performance', description: 'Objectifs, trajectoires, confiance et correction.', icon: Gauge },
  { key: 'growth', number: '05', label: 'Growth & Value Steering', short: 'Growth', description: 'Valeur, comptes stratégiques et accélération.', icon: TrendingUp },
  { key: 'risk', number: '06', label: 'Risk, Scenarios & Crisis', short: 'Risk', description: 'Exposition, scénarios et réponse exécutive.', icon: ShieldAlert },
  { key: 'transformation', number: '07', label: 'Transformation Studio', short: 'Transformation', description: 'Initiatives, workstreams, jalons et frictions.', icon: Layers3 },
  { key: 'board', number: '08', label: 'Board & Executive Papers', short: 'Board', description: 'Sessions, agendas, résolutions et papers.', icon: Building2 },
]

const TONE_LABELS: Record<ExecutiveTone, string> = {
  good: 'Sous contrôle',
  info: 'En mouvement',
  warning: 'Attention',
  critical: 'Intervention',
  neutral: 'À structurer',
}

const ENTITY_LABELS: Record<ExecutiveEntityType, string> = {
  priority: 'Priorité exécutive',
  decision: 'Décision',
  agenda: 'Flux stratégique',
  objective: 'Objectif',
  initiative: 'Initiative',
  risk: 'Risque',
  board_session: 'Session de gouvernance',
  paper: 'Executive paper',
  mandate: 'Mandat exécutif',
}

type PortalState = {
  entityType: ExecutiveEntityType
  mode: 'create' | 'edit'
  id?: string
  title: string
  subtitle: string
  values: Record<string, string | number | boolean>
}

type InspectorState = {
  eyebrow: string
  title: string
  summary: string
  rows: Array<{ label: string; value: string }>
  href?: string
}

function toneClass(tone: ExecutiveTone) {
  return styles[`tone_${tone}`] || styles.tone_neutral
}

function formatDate(value?: string | null) {
  if (!value) return 'Non planifié'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Non planifié'
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function statusLabel(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value))
}

function emptyForm(entityType: ExecutiveEntityType): PortalState {
  const common = {
    status: entityType === 'decision' ? 'proposed' : entityType === 'risk' ? 'watch' : entityType === 'board_session' ? 'planned' : 'active',
    owner_name: 'À assigner',
    due_at: '',
  }

  const configurations: Record<ExecutiveEntityType, PortalState> = {
    priority: { entityType, mode: 'create', title: 'Créer une priorité exécutive', subtitle: 'Structurez une intervention avec impact, autorité et prochaine action.', values: { ...common, title: '', summary: '', priority: 'high', authority_level: 'Direction Générale', impact: '', evidence_state: 'partial', next_action: '' } },
    decision: { entityType, mode: 'create', title: 'Ouvrir une Decision Chamber', subtitle: 'Formalisez l’arbitrage, les preuves, les conditions et l’autorité.', values: { ...common, title: '', statement: '', decision_type: 'executive', authority_level: 'Direction Générale', financial_impact_mad: 0, customer_impact: 'À évaluer', risk_level: 'medium', evidence_state: 'partial', rationale: '', conditions: '' } },
    agenda: { entityType, mode: 'create', title: 'Créer un flux stratégique', subtitle: 'Connectez un pilier, un horizon, un sponsor et un résultat attendu.', values: { ...common, title: '', strategic_pillar: 'Croissance durable', horizon: 'Quarter', executive_sponsor: 'Direction Générale', objective: '', progress: 0, confidence: 50, dependencies: '', pressure: 'normal', expected_outcome: '' } },
    objective: { entityType, mode: 'create', title: 'Créer un objectif exécutif', subtitle: 'Définissez target, actual, confiance, preuve et correction.', values: { ...common, title: '', domain: 'Company', target_value: 100, actual_value: 0, unit: '%', confidence: 50, trend: 'stable', evidence_state: 'partial', corrective_action: '' } },
    initiative: { entityType, mode: 'create', title: 'Créer une initiative de transformation', subtitle: 'Gouvernez valeur attendue, jalons, dépendances et blockers.', values: { ...common, title: '', program_type: 'transformation', sponsor_name: 'Direction Générale', progress: 0, confidence: 50, expected_value: '', current_milestone: 'Initialisation', next_milestone: '', dependencies: '', blockers: '' } },
    risk: { entityType, mode: 'create', title: 'Déclarer un risque exécutif', subtitle: 'Construisez l’exposition, les signaux et les plans A/B/C.', values: { ...common, title: '', domain: 'Strategic', likelihood: 3, impact: 3, exposure: 36, sponsor_name: '', early_signals: '', plan_a: '', plan_b: '', plan_c: '', escalation_threshold: '', current_response: '', next_review_at: '' } },
    board_session: { entityType, mode: 'create', title: 'Créer une session de gouvernance', subtitle: 'Préparez le comité, son agenda, ses participants et ses résolutions.', values: { ...common, title: '', session_type: 'executive_review', scheduled_at: '', chair_name: 'Managing Director', secretary_name: '', agenda_count: 0, resolution_count: 0, open_commitments: 0, evidence_state: 'partial', agenda: '', participants: '' } },
    paper: { entityType, mode: 'create', title: 'Créer un Executive Paper', subtitle: 'Préparez un brief, une résolution ou un pack de gouvernance.', values: { ...common, title: '', paper_type: 'executive_brief', audience: 'Executive Committee', approval_state: 'draft', version_number: 1, confidentiality: 'restricted', content: '' } },
    mandate: { entityType, mode: 'create', title: 'Créer un mandat exécutif', subtitle: 'Transformez une décision en mission accountable et vérifiable.', values: { ...common, title: '', sponsor_name: 'Direction Générale', progress: 0, expected_outcome: '', outcome_state: '', source_type: '', source_id: '' } },
  }

  return configurations[entityType]
}

function portalFromRecord(entityType: ExecutiveEntityType, record: Record<string, unknown>): PortalState {
  const portal = emptyForm(entityType)
  const values: Record<string, string | number | boolean> = {}
  Object.entries(record).forEach(([key, value]) => {
    if (value === null || value === undefined) return
    if (Array.isArray(value)) values[key] = value.join('\n')
    else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') values[key] = value
  })
  return {
    ...portal,
    mode: 'edit',
    id: String(record.id || ''),
    title: `Administrer — ${String(record.title || ENTITY_LABELS[entityType])}`,
    subtitle: 'Les valeurs actuelles sont préchargées. Toute modification est auditée.',
    values: { ...portal.values, ...values },
  }
}

function Field({ label, name, value, onChange, type = 'text', options, wide, min, max }: {
  label: string
  name: string
  value: string | number | boolean
  onChange: (name: string, value: string | number | boolean) => void
  type?: 'text' | 'number' | 'date' | 'datetime-local' | 'textarea' | 'select'
  options?: Array<{ value: string; label: string }>
  wide?: boolean
  min?: number
  max?: number
}) {
  return (
    <label className={wide ? styles.fieldWide : styles.field}>
      <span>{label}</span>
      {type === 'textarea' ? (
        <textarea value={String(value)} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(name, event.target.value)} rows={4} />
      ) : type === 'select' ? (
        <select value={String(value)} onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(name, event.target.value)}>
          {(options || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={typeof value === 'boolean' ? String(value) : value}
          min={min}
          max={max}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(name, type === 'number' ? Number(event.target.value) : event.target.value)}
        />
      )}
    </label>
  )
}

function EntityForm({ portal, onChange }: { portal: PortalState; onChange: (name: string, value: string | number | boolean) => void }) {
  const v = portal.values
  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'planned', label: 'Planned' },
    { value: 'active', label: 'Active' },
    { value: 'attention', label: 'Attention' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'completed', label: 'Completed' },
  ]

  if (portal.entityType === 'priority') return <>
    <Field label="Titre exécutif" name="title" value={v.title} onChange={onChange} wide />
    <Field label="Situation / synthèse" name="summary" value={v.summary} onChange={onChange} type="textarea" wide />
    <Field label="Priorité" name="priority" value={v.priority} onChange={onChange} type="select" options={[{ value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]} />
    <Field label="Statut" name="status" value={v.status} onChange={onChange} type="select" options={statusOptions} />
    <Field label="Autorité" name="authority_level" value={v.authority_level} onChange={onChange} />
    <Field label="Owner" name="owner_name" value={v.owner_name} onChange={onChange} />
    <Field label="Deadline" name="due_at" value={v.due_at} onChange={onChange} type="datetime-local" />
    <Field label="État de preuve" name="evidence_state" value={v.evidence_state} onChange={onChange} type="select" options={[{ value: 'missing', label: 'Missing' }, { value: 'partial', label: 'Partial' }, { value: 'complete', label: 'Complete' }, { value: 'verified', label: 'Verified' }]} />
    <Field label="Impact" name="impact" value={v.impact} onChange={onChange} type="textarea" wide />
    <Field label="Prochaine action" name="next_action" value={v.next_action} onChange={onChange} type="textarea" wide />
  </>

  if (portal.entityType === 'decision') return <>
    <Field label="Décision" name="title" value={v.title} onChange={onChange} wide />
    <Field label="Statement" name="statement" value={v.statement} onChange={onChange} type="textarea" wide />
    <Field label="Statut" name="status" value={v.status} onChange={onChange} type="select" options={[{ value: 'proposed', label: 'Proposed' }, { value: 'under_review', label: 'Under review' }, { value: 'evidence_required', label: 'Evidence required' }, { value: 'scenario_review', label: 'Scenario review' }, { value: 'approved', label: 'Approved' }, { value: 'deferred', label: 'Deferred' }, { value: 'rejected', label: 'Rejected' }]} />
    <Field label="Type" name="decision_type" value={v.decision_type} onChange={onChange} type="select" options={[{ value: 'executive', label: 'Executive' }, { value: 'commercial', label: 'Commercial' }, { value: 'financial', label: 'Financial' }, { value: 'product', label: 'Product' }, { value: 'customer', label: 'Customer' }, { value: 'crisis', label: 'Crisis' }]} />
    <Field label="Autorité" name="authority_level" value={v.authority_level} onChange={onChange} />
    <Field label="Owner" name="owner_name" value={v.owner_name} onChange={onChange} />
    <Field label="Deadline" name="due_at" value={v.due_at} onChange={onChange} type="datetime-local" />
    <Field label="Impact financier (Dh)" name="financial_impact_mad" value={v.financial_impact_mad} onChange={onChange} type="number" min={0} />
    <Field label="Risque" name="risk_level" value={v.risk_level} onChange={onChange} type="select" options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]} />
    <Field label="État de preuve" name="evidence_state" value={v.evidence_state} onChange={onChange} type="select" options={[{ value: 'missing', label: 'Missing' }, { value: 'partial', label: 'Partial' }, { value: 'complete', label: 'Complete' }, { value: 'verified', label: 'Verified' }]} />
    <Field label="Impact client" name="customer_impact" value={v.customer_impact} onChange={onChange} type="textarea" wide />
    <Field label="Rationale" name="rationale" value={v.rationale} onChange={onChange} type="textarea" wide />
    <Field label="Conditions d’approbation" name="conditions" value={v.conditions} onChange={onChange} type="textarea" wide />
  </>

  if (portal.entityType === 'agenda') return <>
    <Field label="Flux stratégique" name="title" value={v.title} onChange={onChange} wide />
    <Field label="Pilier" name="strategic_pillar" value={v.strategic_pillar} onChange={onChange} />
    <Field label="Horizon" name="horizon" value={v.horizon} onChange={onChange} type="select" options={[{ value: 'Month', label: 'Month' }, { value: 'Quarter', label: 'Quarter' }, { value: 'Year', label: 'Year' }, { value: 'Three years', label: 'Three years' }]} />
    <Field label="Statut" name="status" value={v.status} onChange={onChange} type="select" options={statusOptions} />
    <Field label="Executive sponsor" name="executive_sponsor" value={v.executive_sponsor} onChange={onChange} />
    <Field label="Owner" name="owner_name" value={v.owner_name} onChange={onChange} />
    <Field label="Progression" name="progress" value={v.progress} onChange={onChange} type="number" min={0} max={100} />
    <Field label="Confiance" name="confidence" value={v.confidence} onChange={onChange} type="number" min={0} max={100} />
    <Field label="Deadline" name="due_at" value={v.due_at} onChange={onChange} type="datetime-local" />
    <Field label="Pression" name="pressure" value={v.pressure} onChange={onChange} type="select" options={[{ value: 'normal', label: 'Normal' }, { value: 'attention', label: 'Attention' }, { value: 'blocked', label: 'Blocked' }]} />
    <Field label="Objectif" name="objective" value={v.objective} onChange={onChange} type="textarea" wide />
    <Field label="Résultat attendu" name="expected_outcome" value={v.expected_outcome} onChange={onChange} type="textarea" wide />
    <Field label="Dépendances" name="dependencies" value={v.dependencies} onChange={onChange} type="textarea" wide />
  </>

  if (portal.entityType === 'objective') return <>
    <Field label="Objectif" name="title" value={v.title} onChange={onChange} wide />
    <Field label="Domaine" name="domain" value={v.domain} onChange={onChange} />
    <Field label="Owner" name="owner_name" value={v.owner_name} onChange={onChange} />
    <Field label="Statut" name="status" value={v.status} onChange={onChange} type="select" options={statusOptions} />
    <Field label="Target" name="target_value" value={v.target_value} onChange={onChange} type="number" />
    <Field label="Actual" name="actual_value" value={v.actual_value} onChange={onChange} type="number" />
    <Field label="Unité" name="unit" value={v.unit} onChange={onChange} />
    <Field label="Confiance" name="confidence" value={v.confidence} onChange={onChange} type="number" min={0} max={100} />
    <Field label="Trend" name="trend" value={v.trend} onChange={onChange} type="select" options={[{ value: 'up', label: 'Up' }, { value: 'stable', label: 'Stable' }, { value: 'down', label: 'Down' }]} />
    <Field label="Deadline" name="due_at" value={v.due_at} onChange={onChange} type="datetime-local" />
    <Field label="État de preuve" name="evidence_state" value={v.evidence_state} onChange={onChange} type="select" options={[{ value: 'missing', label: 'Missing' }, { value: 'partial', label: 'Partial' }, { value: 'complete', label: 'Complete' }, { value: 'verified', label: 'Verified' }]} />
    <Field label="Action corrective" name="corrective_action" value={v.corrective_action} onChange={onChange} type="textarea" wide />
  </>

  if (portal.entityType === 'initiative') return <>
    <Field label="Initiative" name="title" value={v.title} onChange={onChange} wide />
    <Field label="Programme" name="program_type" value={v.program_type} onChange={onChange} type="select" options={[{ value: 'transformation', label: 'Transformation' }, { value: 'growth', label: 'Growth' }, { value: 'product', label: 'Product' }, { value: 'operations', label: 'Operations' }, { value: 'cost_optimization', label: 'Cost optimization' }]} />
    <Field label="Statut" name="status" value={v.status} onChange={onChange} type="select" options={statusOptions} />
    <Field label="Sponsor" name="sponsor_name" value={v.sponsor_name} onChange={onChange} />
    <Field label="Owner" name="owner_name" value={v.owner_name} onChange={onChange} />
    <Field label="Progression" name="progress" value={v.progress} onChange={onChange} type="number" min={0} max={100} />
    <Field label="Confiance" name="confidence" value={v.confidence} onChange={onChange} type="number" min={0} max={100} />
    <Field label="Deadline" name="due_at" value={v.due_at} onChange={onChange} type="datetime-local" />
    <Field label="Valeur attendue" name="expected_value" value={v.expected_value} onChange={onChange} type="textarea" wide />
    <Field label="Jalon actuel" name="current_milestone" value={v.current_milestone} onChange={onChange} />
    <Field label="Jalon suivant" name="next_milestone" value={v.next_milestone} onChange={onChange} />
    <Field label="Dépendances" name="dependencies" value={v.dependencies} onChange={onChange} type="textarea" wide />
    <Field label="Blockers" name="blockers" value={v.blockers} onChange={onChange} type="textarea" wide />
  </>

  if (portal.entityType === 'risk') return <>
    <Field label="Risque" name="title" value={v.title} onChange={onChange} wide />
    <Field label="Domaine" name="domain" value={v.domain} onChange={onChange} />
    <Field label="Statut" name="status" value={v.status} onChange={onChange} type="select" options={[{ value: 'watch', label: 'Watch' }, { value: 'active', label: 'Active' }, { value: 'mitigating', label: 'Mitigating' }, { value: 'crisis', label: 'Crisis' }, { value: 'contained', label: 'Contained' }, { value: 'closed', label: 'Closed' }]} />
    <Field label="Likelihood (1–5)" name="likelihood" value={v.likelihood} onChange={onChange} type="number" min={1} max={5} />
    <Field label="Impact (1–5)" name="impact" value={v.impact} onChange={onChange} type="number" min={1} max={5} />
    <Field label="Exposure (0–100)" name="exposure" value={v.exposure} onChange={onChange} type="number" min={0} max={100} />
    <Field label="Owner" name="owner_name" value={v.owner_name} onChange={onChange} />
    <Field label="Sponsor" name="sponsor_name" value={v.sponsor_name} onChange={onChange} />
    <Field label="Prochaine revue" name="next_review_at" value={v.next_review_at} onChange={onChange} type="datetime-local" />
    <Field label="Signaux précoces" name="early_signals" value={v.early_signals} onChange={onChange} type="textarea" wide />
    <Field label="Plan A" name="plan_a" value={v.plan_a} onChange={onChange} type="textarea" wide />
    <Field label="Plan B" name="plan_b" value={v.plan_b} onChange={onChange} type="textarea" wide />
    <Field label="Plan C" name="plan_c" value={v.plan_c} onChange={onChange} type="textarea" wide />
    <Field label="Seuil d’escalade" name="escalation_threshold" value={v.escalation_threshold} onChange={onChange} type="textarea" wide />
    <Field label="Réponse actuelle" name="current_response" value={v.current_response} onChange={onChange} type="textarea" wide />
  </>

  if (portal.entityType === 'board_session') return <>
    <Field label="Session" name="title" value={v.title} onChange={onChange} wide />
    <Field label="Type" name="session_type" value={v.session_type} onChange={onChange} type="select" options={[{ value: 'executive_review', label: 'Executive review' }, { value: 'board', label: 'Board' }, { value: 'steering_committee', label: 'Steering committee' }, { value: 'crisis_committee', label: 'Crisis committee' }]} />
    <Field label="Statut" name="status" value={v.status} onChange={onChange} type="select" options={[{ value: 'draft', label: 'Draft' }, { value: 'planned', label: 'Planned' }, { value: 'preparing', label: 'Preparing' }, { value: 'ready', label: 'Ready' }, { value: 'in_session', label: 'In session' }, { value: 'completed', label: 'Completed' }]} />
    <Field label="Date" name="scheduled_at" value={v.scheduled_at} onChange={onChange} type="datetime-local" />
    <Field label="Chair" name="chair_name" value={v.chair_name} onChange={onChange} />
    <Field label="Secretary" name="secretary_name" value={v.secretary_name} onChange={onChange} />
    <Field label="Agenda items" name="agenda_count" value={v.agenda_count} onChange={onChange} type="number" min={0} />
    <Field label="Résolutions" name="resolution_count" value={v.resolution_count} onChange={onChange} type="number" min={0} />
    <Field label="Engagements ouverts" name="open_commitments" value={v.open_commitments} onChange={onChange} type="number" min={0} />
    <Field label="État de preuve" name="evidence_state" value={v.evidence_state} onChange={onChange} type="select" options={[{ value: 'missing', label: 'Missing' }, { value: 'partial', label: 'Partial' }, { value: 'complete', label: 'Complete' }, { value: 'verified', label: 'Verified' }]} />
    <Field label="Agenda" name="agenda" value={v.agenda} onChange={onChange} type="textarea" wide />
    <Field label="Participants" name="participants" value={v.participants} onChange={onChange} type="textarea" wide />
  </>

  if (portal.entityType === 'paper') return <>
    <Field label="Titre" name="title" value={v.title} onChange={onChange} wide />
    <Field label="Type" name="paper_type" value={v.paper_type} onChange={onChange} type="select" options={[{ value: 'executive_brief', label: 'Executive brief' }, { value: 'board_pack', label: 'Board pack' }, { value: 'resolution', label: 'Resolution' }, { value: 'risk_report', label: 'Risk report' }, { value: 'performance_review', label: 'Performance review' }]} />
    <Field label="Statut" name="status" value={v.status} onChange={onChange} type="select" options={[{ value: 'draft', label: 'Draft' }, { value: 'review', label: 'Review' }, { value: 'approved', label: 'Approved' }, { value: 'published', label: 'Published' }]} />
    <Field label="Audience" name="audience" value={v.audience} onChange={onChange} />
    <Field label="Owner" name="owner_name" value={v.owner_name} onChange={onChange} />
    <Field label="Approval" name="approval_state" value={v.approval_state} onChange={onChange} />
    <Field label="Deadline" name="due_at" value={v.due_at} onChange={onChange} type="datetime-local" />
    <Field label="Version" name="version_number" value={v.version_number} onChange={onChange} type="number" min={1} />
    <Field label="Confidentialité" name="confidentiality" value={v.confidentiality} onChange={onChange} type="select" options={[{ value: 'internal', label: 'Internal' }, { value: 'restricted', label: 'Restricted' }, { value: 'board_only', label: 'Board only' }, { value: 'confidential', label: 'Confidential' }]} />
    <Field label="Contenu / structure" name="content" value={v.content} onChange={onChange} type="textarea" wide />
  </>

  return <>
    <Field label="Mandat" name="title" value={v.title} onChange={onChange} wide />
    <Field label="Statut" name="status" value={v.status} onChange={onChange} type="select" options={[{ value: 'mandated', label: 'Mandated' }, { value: 'executing', label: 'Executing' }, { value: 'attention', label: 'Attention' }, { value: 'blocked', label: 'Blocked' }, { value: 'completed', label: 'Completed' }, { value: 'verified', label: 'Verified' }]} />
    <Field label="Owner" name="owner_name" value={v.owner_name} onChange={onChange} />
    <Field label="Sponsor" name="sponsor_name" value={v.sponsor_name} onChange={onChange} />
    <Field label="Deadline" name="due_at" value={v.due_at} onChange={onChange} type="datetime-local" />
    <Field label="Progression" name="progress" value={v.progress} onChange={onChange} type="number" min={0} max={100} />
    <Field label="Résultat attendu" name="expected_outcome" value={v.expected_outcome} onChange={onChange} type="textarea" wide />
    <Field label="État du résultat" name="outcome_state" value={v.outcome_state} onChange={onChange} type="textarea" wide />
  </>
}

function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return <div className={styles.emptyState}>{icon}<strong>{title}</strong><p>{text}</p>{action}</div>
}

export default function ExecutiveCommandCabinet({ initialSnapshot, initialScene, operatorName }: {
  initialSnapshot: ExecutiveSnapshot
  initialScene: ExecutiveSceneKey
  operatorName: string
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [scene, setScene] = useState<ExecutiveSceneKey>(initialScene)
  const [query, setQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [portal, setPortal] = useState<PortalState | null>(null)
  const [inspector, setInspector] = useState<InspectorState | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const requestRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setMounted(true)
    return () => requestRef.current?.abort()
  }, [])

  const updateUrl = useCallback((nextScene: ExecutiveSceneKey) => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    url.searchParams.set('view', nextScene)
    window.history.replaceState({}, '', url)
  }, [])

  const changeScene = useCallback((nextScene: ExecutiveSceneKey) => {
    setScene(nextScene)
    updateUrl(nextScene)
    setQuery('')
  }, [updateUrl])

  const refresh = useCallback(async () => {
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setRefreshing(true)
    try {
      const response = await fetch('/api/angelcare360/operator/executive-command', { cache: 'no-store', signal: controller.signal })
      const payload = await response.json()
      if (!response.ok) throw new Error(String(payload.error || 'Refresh impossible.'))
      setSnapshot(payload as ExecutiveSnapshot)
    } catch (error) {
      if ((error as Error).name !== 'AbortError') setMessage(error instanceof Error ? error.message : 'Refresh impossible.')
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null
        setRefreshing(false)
      }
    }
  }, [])

  const openCreate = useCallback((entityType: ExecutiveEntityType) => setPortal(emptyForm(entityType)), [])
  const openEdit = useCallback((entityType: ExecutiveEntityType, record: Record<string, unknown>) => setPortal(portalFromRecord(entityType, record)), [])

  const post = useCallback(async (operation: string, payload: Record<string, unknown>) => {
    const response = await fetch('/api/angelcare360/operator/executive-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation, payload }),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(String(result.error || 'Action refusée.'))
    return result
  }, [])

  const savePortal = useCallback(async (event: FormEvent) => {
    event.preventDefault()
    if (!portal) return
    setSaving(true)
    setMessage(null)
    try {
      const values: Record<string, unknown> = { ...portal.values, entityType: portal.entityType }
      ;['conditions', 'dependencies', 'blockers', 'early_signals', 'agenda', 'participants'].forEach((key) => {
        if (typeof values[key] === 'string') values[key] = String(values[key]).split(/\n|,|;/).map((item) => item.trim()).filter(Boolean)
      })
      if (portal.entityType === 'paper' && typeof values.content === 'string') values.content = { body: values.content }
      if (portal.mode === 'edit') values.id = portal.id
      await post(portal.mode === 'edit' ? 'entity.update' : 'entity.create', values)
      setPortal(null)
      setMessage(`${ENTITY_LABELS[portal.entityType]} enregistré avec audit.`)
      await refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Enregistrement impossible.')
    } finally {
      setSaving(false)
    }
  }, [portal, post, refresh])

  const transition = useCallback(async (entityType: ExecutiveEntityType, id: string, status: string) => {
    setSaving(true)
    try {
      await post('entity.transition', { entityType, id, status })
      setMessage(`Transition vers ${statusLabel(status)} confirmée.`)
      await refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Transition impossible.')
    } finally {
      setSaving(false)
    }
  }, [post, refresh])

  const currentScene = SCENES.find((item) => item.key === scene) || SCENES[0]
  const normalizedQuery = query.trim().toLowerCase()
  const filteredPriorities = useMemo(() => snapshot.priorities.filter((item) => !normalizedQuery || `${item.title} ${item.summary} ${item.ownerName}`.toLowerCase().includes(normalizedQuery)), [normalizedQuery, snapshot.priorities])
  const filteredDecisions = useMemo(() => snapshot.decisions.filter((item) => !normalizedQuery || `${item.title} ${item.statement} ${item.ownerName}`.toLowerCase().includes(normalizedQuery)), [normalizedQuery, snapshot.decisions])
  const filteredAgenda = useMemo(() => snapshot.agenda.filter((item) => !normalizedQuery || `${item.title} ${item.strategicPillar} ${item.ownerName}`.toLowerCase().includes(normalizedQuery)), [normalizedQuery, snapshot.agenda])
  const filteredObjectives = useMemo(() => snapshot.objectives.filter((item) => !normalizedQuery || `${item.title} ${item.domain} ${item.ownerName}`.toLowerCase().includes(normalizedQuery)), [normalizedQuery, snapshot.objectives])
  const filteredInitiatives = useMemo(() => snapshot.initiatives.filter((item) => !normalizedQuery || `${item.title} ${item.programType} ${item.ownerName}`.toLowerCase().includes(normalizedQuery)), [normalizedQuery, snapshot.initiatives])
  const filteredRisks = useMemo(() => snapshot.risks.filter((item) => !normalizedQuery || `${item.title} ${item.domain} ${item.ownerName}`.toLowerCase().includes(normalizedQuery)), [normalizedQuery, snapshot.risks])
  const filteredBoard = useMemo(() => snapshot.boardSessions.filter((item) => !normalizedQuery || `${item.title} ${item.sessionType} ${item.chairName}`.toLowerCase().includes(normalizedQuery)), [normalizedQuery, snapshot.boardSessions])
  const filteredPapers = useMemo(() => snapshot.papers.filter((item) => !normalizedQuery || `${item.title} ${item.paperType} ${item.ownerName}`.toLowerCase().includes(normalizedQuery)), [normalizedQuery, snapshot.papers])

  function sceneAction() {
    const map: Record<ExecutiveSceneKey, { label: string; type: ExecutiveEntityType }> = {
      command: { label: 'New executive priority', type: 'priority' },
      decisions: { label: 'Open Decision Chamber', type: 'decision' },
      agenda: { label: 'New strategic stream', type: 'agenda' },
      performance: { label: 'New objective', type: 'objective' },
      growth: { label: 'Create executive mandate', type: 'mandate' },
      risk: { label: 'Declare risk', type: 'risk' },
      transformation: { label: 'New initiative', type: 'initiative' },
      board: { label: 'Create board session', type: 'board_session' },
    }
    return map[scene]
  }

  function CommandScene() {
    const pulseEntries = Object.entries(snapshot.companyPulse)
    return <div className={styles.commandScene}>
      <aside className={styles.priorityRail}>
        <div className={styles.panelHeading}><div><span>Executive intervention queue</span><h2>Act now</h2></div><strong>{filteredPriorities.length}</strong></div>
        <div className={styles.priorityStack}>
          {filteredPriorities.length ? filteredPriorities.slice(0, 8).map((item) => (
            <button key={item.id} className={`${styles.priorityCard} ${toneClass(item.tone)}`} onClick={() => openEdit('priority', item as unknown as Record<string, unknown>)}>
              <span className={styles.priorityCode}>{item.priorityCode}</span>
              <strong>{item.title}</strong>
              <p>{item.summary}</p>
              <div><span>{item.ownerName}</span><span>{formatDate(item.dueAt)}</span></div>
            </button>
          )) : <EmptyState icon={<Command size={26} />} title="Aucune priorité formalisée" text="Les signaux live restent visibles. Créez une priorité pour transformer un signal en commandement accountable." action={<button onClick={() => openCreate('priority')}>Créer la première priorité</button>} />}
        </div>
      </aside>

      <section className={styles.companyTheatre}>
        <div className={styles.theatreHeader}>
          <div><span>Company operating theatre</span><h2>AngelCare Executive Field</h2><p>Six domaines synchronisés autour de l’autorité, de la valeur et de l’exécution.</p></div>
          <div className={styles.healthOrb}><strong>{snapshot.strategicHealth}%</strong><span>Strategic health</span></div>
        </div>
        <div className={styles.pulseMap}>
          <div className={styles.pulseCore}><AngelCareLogo size="sm" /><strong>EXECUTIVE</strong><span>COMMAND CABINET</span></div>
          {pulseEntries.map(([key, value], index) => (
            <button key={key} className={`${styles.pulseNode} ${styles[`pulseNode${index + 1}`]}`} onClick={() => setInspector({ eyebrow: 'Company pulse', title: statusLabel(key), summary: 'Composite live reading from the authoritative operating sources.', rows: [{ label: 'Health', value: `${value}%` }, { label: 'State', value: value >= 80 ? 'Strong' : value >= 60 ? 'Attention' : 'Intervention' }] })}>
              <span>{statusLabel(key)}</span><strong>{value}%</strong><i style={{ '--health': `${value}%` } as CSSProperties} />
            </button>
          ))}
          <div className={styles.pulseOrbitOne} /><div className={styles.pulseOrbitTwo} /><div className={styles.pulseScanner} />
        </div>
        <div className={styles.authorityStrip}>
          <div><Gavel size={18} /><span>Authority queue</span><strong>{snapshot.authorityQueue}</strong></div>
          <div><ShieldAlert size={18} /><span>Critical risks</span><strong>{snapshot.criticalRiskCount}</strong></div>
          <div><Gauge size={18} /><span>Execution confidence</span><strong>{snapshot.executionConfidence}%</strong></div>
        </div>
      </section>

      <aside className={styles.intelligenceRail}>
        <div className={styles.panelHeading}><div><span>Live executive intelligence</span><h2>Signal stream</h2></div><Activity size={20} /></div>
        <div className={styles.signalStream}>
          {snapshot.signals.slice(0, 12).map((signal) => (
            <button key={signal.id} className={styles.signalItem} onClick={() => setInspector({ eyebrow: signal.domain, title: signal.title, summary: signal.summary, rows: [{ label: 'Context', value: signal.context }, { label: 'Time', value: `${formatDate(signal.occurredAt)} · ${formatTime(signal.occurredAt)}` }, { label: 'State', value: TONE_LABELS[signal.tone] }], href: signal.href })}>
              <i className={toneClass(signal.tone)} /><div><span>{signal.domain} · {formatTime(signal.occurredAt)}</span><strong>{signal.title}</strong><p>{signal.context}</p></div><ChevronRight size={16} />
            </button>
          ))}
          {!snapshot.signals.length && <EmptyState icon={<Activity size={24} />} title="No live signal" text="The stream will populate from executive, commercial, customer and platform events." />}
        </div>
      </aside>
    </div>
  }

  function DecisionsScene() {
    const stages = ['proposed', 'under_review', 'evidence_required', 'scenario_review', 'approved', 'mandated', 'executing', 'verified']
    return <div className={styles.sceneCanvas}>
      <div className={styles.decisionArchitecture}>
        <div className={styles.sceneIntro}><div><span>Decision operating engine</span><h2>Authority pipeline</h2><p>Chaque arbitrage progresse de la proposition à l’outcome vérifié, sans perdre conditions ni preuves.</p></div><button className={styles.primaryAction} onClick={() => openCreate('decision')}><Plus size={17} />Open Decision Chamber</button></div>
        <div className={styles.decisionPipeline}>
          {stages.map((stage) => {
            const records = filteredDecisions.filter((item) => item.status === stage)
            return <section key={stage} className={styles.decisionLane}>
              <header><span>{statusLabel(stage)}</span><strong>{records.length}</strong></header>
              <div>{records.slice(0, 4).map((item) => <button key={item.id} className={styles.decisionCard} onClick={() => openEdit('decision', item as unknown as Record<string, unknown>)}><small>{item.decisionCode}</small><strong>{item.title}</strong><p>{item.statement}</p><footer><span>{item.authorityLevel}</span><span>{formatDate(item.dueAt)}</span></footer></button>)}{!records.length && <span className={styles.laneEmpty}>No item</span>}</div>
            </section>
          })}
        </div>
      </div>
      <div className={styles.decisionLowerGrid}>
        <section className={styles.authorityMatrix}>
          <div className={styles.sectionHeader}><div><span>Authority architecture</span><h3>Decision thresholds</h3></div><Scale size={22} /></div>
          {['Account Manager', 'Commercial Manager', 'Finance Director', 'Operations Director', 'Managing Director'].map((level, index) => <div key={level} className={styles.authorityRow}><span>{String(index + 1).padStart(2, '0')}</span><strong>{level}</strong><i /><em>{index < 2 ? 'Operational' : index < 4 ? 'Executive' : 'Sovereign'}</em></div>)}
        </section>
        <section className={styles.mandateBoard}>
          <div className={styles.sectionHeader}><div><span>Execution mandates</span><h3>Approved → accountable</h3></div><button onClick={() => openCreate('mandate')}><Plus size={16} />Mandate</button></div>
          {snapshot.mandates.slice(0, 6).map((mandate) => <button key={mandate.id} className={styles.mandateRow} onClick={() => openEdit('mandate', mandate as unknown as Record<string, unknown>)}><div><span>{mandate.mandateCode}</span><strong>{mandate.title}</strong><p>{mandate.ownerName} · {formatDate(mandate.dueAt)}</p></div><div className={styles.miniProgress}><i style={{ width: `${mandate.progress}%` }} /><span>{mandate.progress}%</span></div></button>)}
          {!snapshot.mandates.length && <EmptyState icon={<ClipboardCheck size={22} />} title="No mandate yet" text="Approve a decision, then convert it into an execution mandate with owner and outcome." />}
        </section>
      </div>
    </div>
  }

  function AgendaScene() {
    const pillars = Array.from(new Set(filteredAgenda.map((item) => item.strategicPillar)))
    return <div className={styles.sceneCanvas}>
      <div className={styles.sceneIntro}><div><span>Strategy made operational</span><h2>Strategic Agenda Navigator</h2><p>Des piliers structurants reliés aux horizons, sponsors, dépendances et résultats vérifiables.</p></div><button className={styles.primaryAction} onClick={() => openCreate('agenda')}><Plus size={17} />New strategic stream</button></div>
      <div className={styles.agendaLayout}>
        <section className={styles.strategyMap}>
          <div className={styles.strategyAxis}><span>Now</span><span>Quarter</span><span>Year</span><span>Three years</span></div>
          <div className={styles.pillarStack}>
            {(pillars.length ? pillars : ['Croissance durable', 'Product leadership', 'Operational excellence']).map((pillar, pillarIndex) => {
              const items = filteredAgenda.filter((item) => item.strategicPillar === pillar)
              return <div key={pillar} className={styles.pillarRow}>
                <div className={styles.pillarIdentity}><span>0{pillarIndex + 1}</span><strong>{pillar}</strong><em>{items.length} streams</em></div>
                <div className={styles.pillarTimeline}>
                  {items.map((item, index) => <button key={item.id} className={`${styles.agendaStream} ${toneClass(item.confidence < 45 ? 'warning' : item.status === 'blocked' ? 'critical' : 'info')}`} style={{ '--start': `${Math.min(72, index * 14 + 4)}%`, '--width': `${Math.max(20, item.progress * 0.55)}%` } as CSSProperties} onClick={() => openEdit('agenda', item as unknown as Record<string, unknown>)}><span>{item.streamCode}</span><strong>{item.title}</strong><small>{item.progress}% · {item.confidence}% confidence</small></button>)}
                  {!items.length && <button className={styles.agendaPlaceholder} onClick={() => openCreate('agenda')}><Plus size={15} />Structure this pillar</button>}
                </div>
              </div>
            })}
          </div>
        </section>
        <aside className={styles.dependencyRail}>
          <div className={styles.sectionHeader}><div><span>Dependency pressure</span><h3>Cross-company constraints</h3></div><Network size={22} /></div>
          {filteredAgenda.slice(0, 8).map((item) => <button key={item.id} onClick={() => openEdit('agenda', item as unknown as Record<string, unknown>)} className={styles.dependencyCard}><div><strong>{item.title}</strong><span>{item.ownerName}</span></div><em>{item.dependencies.length} dependencies</em><i style={{ width: `${item.confidence}%` }} /></button>)}
          {!filteredAgenda.length && <EmptyState icon={<Network size={22} />} title="Agenda ready to structure" text="Create strategic streams to expose dependencies, pressure and executive sponsorship." />}
        </aside>
      </div>
    </div>
  }

  function PerformanceScene() {
    return <div className={styles.sceneCanvas}>
      <div className={styles.sceneIntro}><div><span>Management control system</span><h2>Performance & Outcomes Nerve Center</h2><p>Targets, actuals, confidence, evidence and corrective action in one accountable field.</p></div><button className={styles.primaryAction} onClick={() => openCreate('objective')}><Plus size={17} />New objective</button></div>
      <div className={styles.performanceGrid}>
        <section className={styles.objectiveTree}>
          <div className={styles.sectionHeader}><div><span>Objective architecture</span><h3>Company → domain → owner</h3></div><Target size={22} /></div>
          {filteredObjectives.map((item) => {
            const attainment = clamp(item.targetValue ? item.actualValue / item.targetValue * 100 : 0)
            return <button key={item.id} className={styles.objectiveRow} onClick={() => openEdit('objective', item as unknown as Record<string, unknown>)}>
              <div className={styles.objectiveIdentity}><span>{item.objectiveCode}</span><strong>{item.title}</strong><small>{item.domain} · {item.ownerName}</small></div>
              <div className={styles.trajectory}><i className={styles.trajectoryBase} /><i className={styles.trajectoryActual} style={{ width: `${attainment}%` }} /><b style={{ left: `${attainment}%` }} /></div>
              <div className={styles.objectiveNumbers}><strong>{item.actualValue.toLocaleString('fr-FR')} {item.unit}</strong><span>Target {item.targetValue.toLocaleString('fr-FR')} {item.unit}</span></div>
              <div className={styles.confidenceDial} style={{ '--confidence': `${item.confidence * 3.6}deg` } as CSSProperties}><strong>{item.confidence}%</strong><span>confidence</span></div>
            </button>
          })}
          {!filteredObjectives.length && <EmptyState icon={<Target size={24} />} title="No executive objective" text="Create the objective tree and connect targets, confidence and corrective action." action={<button onClick={() => openCreate('objective')}>Create objective</button>} />}
        </section>
        <aside className={styles.recoveryLane}>
          <div className={styles.sectionHeader}><div><span>Underperformance recovery</span><h3>Corrective action queue</h3></div><Zap size={22} /></div>
          {filteredObjectives.filter((item) => item.targetValue && item.actualValue / item.targetValue < 0.75).map((item) => <button key={item.id} className={styles.recoveryCard} onClick={() => openEdit('objective', item as unknown as Record<string, unknown>)}><AlertTriangle size={18} /><div><strong>{item.title}</strong><p>{item.correctiveAction || 'Corrective action not yet defined.'}</p><span>{item.ownerName} · confidence {item.confidence}%</span></div></button>)}
          {!filteredObjectives.some((item) => item.targetValue && item.actualValue / item.targetValue < 0.75) && <EmptyState icon={<CheckCircle2 size={24} />} title="No objective below threshold" text="Any drift below 75% attainment will enter this executive recovery lane." />}
        </aside>
      </div>
    </div>
  }

  function GrowthScene() {
    return <div className={styles.sceneCanvas}>
      <div className={styles.sceneIntro}><div><span>Executive value steering</span><h2>Enterprise Growth & Value Steering</h2><p>Leadership sees conversion, value pressure and strategic intervention without duplicating the sales workspace.</p></div><button className={styles.primaryAction} onClick={() => openCreate('mandate')}><Plus size={17} />Executive growth mandate</button></div>
      <section className={styles.valueRiver}>
        <div className={styles.valueRiverLine} />
        {snapshot.growthLevers.map((lever, index) => <Link key={lever.key} href={lever.href} className={`${styles.valueStation} ${toneClass(lever.tone)}`} style={{ '--pressure': `${lever.pressure}%`, '--delay': `${index * 0.18}s` } as CSSProperties}><span>0{index + 1}</span><strong>{lever.label}</strong><b>{lever.value}</b><small>{lever.detail}</small><i /></Link>)}
        <div className={styles.valuePacket} />
      </section>
      <div className={styles.growthLowerGrid}>
        <section className={styles.executiveAccounts}>
          <div className={styles.sectionHeader}><div><span>Strategic pressure</span><h3>Executive interventions</h3></div><CircleDollarSign size={22} /></div>
          {snapshot.priorities.filter((item) => item.sourceType === 'growth' || item.href?.includes('growth')).slice(0, 6).map((item) => <button key={item.id} className={styles.accountIntervention} onClick={() => openEdit('priority', item as unknown as Record<string, unknown>)}><div className={styles.accountPulse} /><div><span>{item.priorityCode}</span><strong>{item.title}</strong><p>{item.impact}</p></div><ArrowRight size={18} /></button>)}
          {!snapshot.priorities.some((item) => item.sourceType === 'growth' || item.href?.includes('growth')) && <EmptyState icon={<TrendingUp size={24} />} title="No executive growth intervention" text="Create a mandate when an opportunity, renewal or account requires Direction sponsorship." />}
        </section>
        <section className={styles.valueMandates}>
          <div className={styles.sectionHeader}><div><span>Mandated value capture</span><h3>Accountable execution</h3></div><ClipboardCheck size={22} /></div>
          {snapshot.mandates.slice(0, 6).map((item) => <button key={item.id} className={styles.valueMandateCard} onClick={() => openEdit('mandate', item as unknown as Record<string, unknown>)}><header><span>{item.mandateCode}</span><em>{statusLabel(item.status)}</em></header><strong>{item.title}</strong><p>{item.expectedOutcome}</p><div><i style={{ width: `${item.progress}%` }} /><span>{item.progress}%</span></div></button>)}
          {!snapshot.mandates.length && <EmptyState icon={<ClipboardCheck size={24} />} title="No active mandate" text="Mandates connect Direction decisions to measurable execution outcomes." />}
        </section>
      </div>
    </div>
  }

  function RiskScene() {
    const maxExposure = Math.max(1, ...filteredRisks.map((item) => item.exposure))
    return <div className={styles.sceneCanvas}>
      <div className={styles.sceneIntro}><div><span>Crisis theatre & scenario lab</span><h2>Risk, Scenarios & Crisis Room</h2><p>Exposure topology, early-warning evidence and multi-plan response under executive control.</p></div><button className={styles.primaryAction} onClick={() => openCreate('risk')}><Plus size={17} />Declare risk</button></div>
      <div className={styles.riskLayout}>
        <section className={styles.riskConstellation}>
          <div className={styles.riskAxisVertical}><span>High impact</span><span>Low impact</span></div>
          <div className={styles.riskAxisHorizontal}><span>Low likelihood</span><span>High likelihood</span></div>
          <div className={styles.riskGridLines} />
          {filteredRisks.map((risk, index) => <button key={risk.id} className={`${styles.riskNode} ${toneClass(risk.tone)}`} style={{ left: `${8 + (risk.likelihood - 1) * 21}%`, bottom: `${8 + (risk.impact - 1) * 21}%`, '--size': `${48 + risk.exposure / maxExposure * 56}px`, '--delay': `${index * 0.16}s` } as CSSProperties} onClick={() => openEdit('risk', risk as unknown as Record<string, unknown>)}><span>{risk.riskCode}</span><strong>{risk.exposure}</strong><small>{risk.title}</small></button>)}
          {!filteredRisks.length && <div className={styles.riskEmpty}><ShieldAlert size={32} /><strong>No governed risk</strong><p>Declare risks to populate likelihood, impact and exposure topology.</p></div>}
        </section>
        <aside className={styles.scenarioRail}>
          <div className={styles.sectionHeader}><div><span>Scenario response</span><h3>Plans A / B / C</h3></div><Scale size={22} /></div>
          {filteredRisks.slice(0, 6).map((risk) => <button key={risk.id} className={styles.scenarioCard} onClick={() => openEdit('risk', risk as unknown as Record<string, unknown>)}><header><span>{risk.riskCode}</span><em className={toneClass(risk.tone)}>{risk.exposure}</em></header><strong>{risk.title}</strong><div><span>A</span><p>{risk.planA || 'Not defined'}</p></div><div><span>B</span><p>{risk.planB || 'Not defined'}</p></div><div><span>C</span><p>{risk.planC || 'Not defined'}</p></div></button>)}
          {!filteredRisks.length && <EmptyState icon={<Scale size={22} />} title="Scenario lab ready" text="Every executive risk can carry plans A, B and C with an escalation threshold." />}
        </aside>
      </div>
    </div>
  }

  function TransformationScene() {
    return <div className={styles.sceneCanvas}>
      <div className={styles.sceneIntro}><div><span>Cross-functional execution portfolio</span><h2>Transformation & Execution Studio</h2><p>Programs, milestones, value, dependencies and friction under one steering architecture.</p></div><button className={styles.primaryAction} onClick={() => openCreate('initiative')}><Plus size={17} />New initiative</button></div>
      <div className={styles.transformationLayout}>
        <section className={styles.initiativeMosaic}>
          {filteredInitiatives.map((item, index) => <button key={item.id} className={`${styles.initiativeTile} ${styles[`initiativeTile${index % 4}`]}`} onClick={() => openEdit('initiative', item as unknown as Record<string, unknown>)}><header><span>{item.initiativeCode}</span><em>{statusLabel(item.status)}</em></header><strong>{item.title}</strong><p>{item.expectedValue}</p><div className={styles.initiativeStats}><span><b>{item.progress}%</b>progress</span><span><b>{item.confidence}%</b>confidence</span><span><b>{item.blockers.length}</b>blockers</span></div><div className={styles.initiativeProgress}><i style={{ width: `${item.progress}%` }} /></div><footer><span>{item.currentMilestone}</span><ArrowRight size={16} /><span>{item.nextMilestone || 'Outcome'}</span></footer></button>)}
          {!filteredInitiatives.length && <EmptyState icon={<Layers3 size={26} />} title="Transformation portfolio empty" text="Create initiatives for product, market, operations, cost and platform transformation." action={<button onClick={() => openCreate('initiative')}>Create initiative</button>} />}
        </section>
        <aside className={styles.milestoneRail}>
          <div className={styles.sectionHeader}><div><span>Milestone runway</span><h3>Next executive checkpoints</h3></div><CalendarDays size={22} /></div>
          {filteredInitiatives.slice(0, 8).map((item, index) => <button key={item.id} className={styles.milestoneItem} onClick={() => openEdit('initiative', item as unknown as Record<string, unknown>)}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.nextMilestone || item.currentMilestone}</strong><p>{item.title}</p><small>{formatDate(item.dueAt)} · {item.ownerName}</small></div><i className={item.blockers.length ? styles.milestoneBlocked : styles.milestoneReady} /></button>)}
          {!filteredInitiatives.length && <EmptyState icon={<CalendarDays size={22} />} title="No milestone" text="Milestones will appear as soon as initiatives are created." />}
        </aside>
      </div>
    </div>
  }

  function BoardScene() {
    return <div className={styles.sceneCanvas}>
      <div className={styles.sceneIntro}><div><span>Boardroom operating workspace</span><h2>Board, Committees & Executive Papers</h2><p>Governance calendar, agenda readiness, resolutions, papers and follow-through commitments.</p></div><div className={styles.doubleActions}><button onClick={() => openCreate('paper')}><FileText size={17} />New paper</button><button className={styles.primaryAction} onClick={() => openCreate('board_session')}><Plus size={17} />New session</button></div></div>
      <div className={styles.boardLayout}>
        <section className={styles.governanceCalendar}>
          <div className={styles.sectionHeader}><div><span>Governance calendar</span><h3>Sessions & committees</h3></div><CalendarDays size={22} /></div>
          <div className={styles.boardTimeline}>
            {filteredBoard.map((session, index) => <button key={session.id} className={styles.boardSession} onClick={() => openEdit('board_session', session as unknown as Record<string, unknown>)}><div className={styles.boardDate}><span>{session.scheduledAt ? new Date(session.scheduledAt).toLocaleDateString('fr-FR', { day: '2-digit' }) : '--'}</span><em>{session.scheduledAt ? new Date(session.scheduledAt).toLocaleDateString('fr-FR', { month: 'short' }) : 'TBD'}</em></div><div><small>{session.sessionCode} · {statusLabel(session.status)}</small><strong>{session.title}</strong><p>{session.chairName} · {session.sessionType.replaceAll('_', ' ')}</p><footer><span>{session.agendaCount} agenda</span><span>{session.resolutionCount} resolutions</span><span>{session.openCommitments} open</span></footer></div><ChevronRight size={18} /></button>)}
            {!filteredBoard.length && <EmptyState icon={<Building2 size={25} />} title="No governance session" text="Create board, executive review or steering committee sessions with formal readiness control." action={<button onClick={() => openCreate('board_session')}>Create session</button>} />}
          </div>
        </section>
        <section className={styles.paperStudio}>
          <div className={styles.sectionHeader}><div><span>Executive papers</span><h3>Draft → review → approved</h3></div><FileText size={22} /></div>
          {filteredPapers.map((paper) => <button key={paper.id} className={styles.paperCard} onClick={() => openEdit('paper', paper as unknown as Record<string, unknown>)}><header><span>{paper.paperCode}</span><em>{paper.confidentiality}</em></header><strong>{paper.title}</strong><p>{paper.paperType.replaceAll('_', ' ')} · {paper.audience}</p><footer><span>v{paper.versionNumber}</span><span>{statusLabel(paper.status)}</span><span>{formatDate(paper.dueAt)}</span></footer></button>)}
          {!filteredPapers.length && <EmptyState icon={<FileText size={24} />} title="No executive paper" text="Build briefs, resolutions, board packs and performance reviews under governed approval." action={<button onClick={() => openCreate('paper')}>Create paper</button>} />}
        </section>
      </div>
    </div>
  }

  const sceneRenderer: Record<ExecutiveSceneKey, () => ReactNode> = {
    command: CommandScene,
    decisions: DecisionsScene,
    agenda: AgendaScene,
    performance: PerformanceScene,
    growth: GrowthScene,
    risk: RiskScene,
    transformation: TransformationScene,
    board: BoardScene,
  }
  const ActiveScene = sceneRenderer[scene]
  const action = sceneAction()

  return <div className={styles.workspace}>
    <div className={styles.ambientOne} /><div className={styles.ambientTwo} />
    <header className={styles.executiveCrown}>
      <div className={styles.brandLockup}><AngelCareLogo size="sm" /><div><span>DIRECTION GÉNÉRALE</span><strong>Executive Command Cabinet</strong></div></div>
      <div className={styles.crownStatus}>
        <span className={`${styles.liveDot} ${snapshot.sourceState === 'live' ? styles.live : snapshot.sourceState === 'partial' ? styles.partial : styles.offline}`} />
        <div><strong>{snapshot.sourceState === 'live' ? 'LIVE EXECUTIVE TRUTH' : snapshot.sourceState === 'partial' ? 'PARTIAL SOURCE' : 'SOURCE DEGRADED'}</strong><span>Synced {formatTime(snapshot.generatedAt)}</span></div>
      </div>
      <div className={styles.crownIdentity}><span>Executive operator</span><strong>{operatorName}</strong></div>
      <button className={styles.iconButton} onClick={() => void refresh()} disabled={refreshing} aria-label="Refresh executive command"><RefreshCw size={18} className={refreshing ? styles.spin : undefined} /></button>
    </header>

    <nav className={styles.sceneRail} aria-label="Executive Command sections">
      {SCENES.map((item) => {
        const Icon = item.icon
        return <button key={item.key} className={scene === item.key ? styles.sceneActive : undefined} onClick={() => changeScene(item.key)}><span>{item.number}</span><Icon size={17} /><div><strong>{item.short}</strong><small>{item.label}</small></div></button>
      })}
    </nav>

    <section className={styles.workspaceCommandBar}>
      <div className={styles.sceneIdentity}><span>{currentScene.number} · {currentScene.label}</span><strong>{currentScene.description}</strong></div>
      <label className={styles.searchBox}><Search size={17} /><input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="Search current executive scene…" /></label>
      <button className={styles.primaryAction} onClick={() => openCreate(action.type)}><Plus size={17} />{action.label}</button>
    </section>

    <section className={styles.metricRibbon}>
      {snapshot.metrics.map((metric) => <Link key={metric.key} href={metric.href || '#'} className={`${styles.metricCard} ${toneClass(metric.tone)}`}><span>{metric.label}</span><strong>{metric.value}</strong><p>{metric.detail}</p><small>{metric.delta}</small></Link>)}
    </section>

    {message && <div className={styles.message}><CheckCircle2 size={17} /><span>{message}</span><button onClick={() => setMessage(null)}><X size={15} /></button></div>}

    <main className={styles.activeCanvas}><ActiveScene /></main>

    <footer className={styles.commandDock}>
      <div><Sparkles size={17} /><span>Executive intelligence</span><strong>{snapshot.sources.filter((item) => item.state === 'live').length}/{snapshot.sources.length} sources live</strong></div>
      <div className={styles.sourceDots}>{snapshot.sources.map((source) => <button key={source.key} title={`${source.label}: ${source.state}`} onClick={() => setInspector({ eyebrow: 'Source evidence', title: source.label, summary: source.message || 'Authoritative operational source is available.', rows: [{ label: 'State', value: source.state }, { label: 'Records', value: String(source.count) }, { label: 'Updated', value: `${formatDate(source.updatedAt)} · ${formatTime(source.updatedAt)}` }] })} className={source.state === 'live' ? styles.sourceLive : source.state === 'partial' ? styles.sourcePartial : styles.sourceOffline} />)}</div>
      <Link href="/angelcare-360-operator"><LayoutDashboard size={17} />Return to Sovereign Pulse</Link>
    </footer>

    {mounted && portal && createPortal(
      <div className={styles.portalBackdrop} role="presentation" onMouseDown={(event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) setPortal(null) }}>
        <form className={styles.portal} onSubmit={savePortal}>
          <header className={styles.portalHeader}><div><span>{portal.mode === 'create' ? 'CREATE & GOVERN' : 'EDIT & CONTROL'} · {ENTITY_LABELS[portal.entityType]}</span><h2>{portal.title}</h2><p>{portal.subtitle}</p></div><button type="button" onClick={() => setPortal(null)}><X size={20} /></button></header>
          <div className={styles.portalBody}><div className={styles.formGrid}><EntityForm portal={portal} onChange={(name, value) => setPortal((current) => current ? { ...current, values: { ...current.values, [name]: value } } : current)} /></div><aside className={styles.portalImpact}><span>EXECUTIVE IMPACT</span><h3>Governance before submission</h3><ul><li>Authority and owner are explicit.</li><li>Changes are persisted server-side.</li><li>Every mutation creates an audit event.</li><li>Archived records remain traceable.</li><li>No raw technical identifier is requested.</li></ul><div><strong>{snapshot.strategicHealth}%</strong><span>Current strategic health</span></div></aside></div>
          <footer className={styles.portalFooter}><button type="button" onClick={() => setPortal(null)}>Cancel</button><button type="submit" data-primary disabled={saving}>{saving ? 'Saving…' : portal.mode === 'create' ? `Create ${ENTITY_LABELS[portal.entityType]}` : 'Save governed changes'}</button></footer>
        </form>
      </div>, document.body,
    )}

    {mounted && inspector && createPortal(
      <div className={styles.inspectorBackdrop} role="presentation" onMouseDown={(event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) setInspector(null) }}>
        <aside className={styles.inspector}><header><div><span>{inspector.eyebrow}</span><h2>{inspector.title}</h2><p>{inspector.summary}</p></div><button onClick={() => setInspector(null)}><X size={20} /></button></header><div className={styles.inspectorRows}>{inspector.rows.map((row) => <div key={row.label}><span>{row.label}</span><strong>{row.value}</strong></div>)}</div><footer>{inspector.href ? <Link href={inspector.href}>Open authoritative workspace <ArrowRight size={17} /></Link> : <button onClick={() => setInspector(null)}>Close evidence</button>}</footer></aside>
      </div>, document.body,
    )}
  </div>
}

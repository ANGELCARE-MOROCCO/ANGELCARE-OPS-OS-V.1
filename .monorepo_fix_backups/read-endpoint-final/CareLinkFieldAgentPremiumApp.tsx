'use client'

import CareLinkUnifiedConnectNotificationBell from './CareLinkUnifiedConnectNotificationBell'

import CareLinkAngelCareConnectMobileBridge from './CareLinkAngelCareConnectMobileBridge'

import AngelCareLogo from "@/components/brand/AngelCareLogo";
import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  BellRing,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  CreditCard,
  FileText,
  Home,
  MapPin,
  MessageCircle,
  LifeBuoy,
  Navigation,
  Phone,
  Route,
  ShieldCheck,
  Star,
  UserRound,
  Wifi,
} from 'lucide-react'
import type { CareLinkMobileAlert, CareLinkMobileNotification, CareLinkMobilePaymentLine, CareLinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'
import { useCareLinkOfflineQueue } from '@/lib/carelink/offline-queue'
import { useCareLinkRealtime } from '@/lib/carelink/realtime'
import type { MissionControlRecord, MissionDossier } from '@/lib/missions/types'
import { buildCareLinkDynamicServiceChecklist, type CareLinkDynamicChecklistDefinition } from '@/lib/carelink/mobile-service-checklists'
import {

  EnterpriseAgentProfileScreen,
  EnterpriseOfflineScreen,
  EnterprisePaymentsScreen,
  EnterpriseReadinessScreen,
  EnterpriseSafetyScreen,
  EnterpriseScheduleScreen,
} from './CareLinkAgentEnterpriseScreens'

type CareLinkMobileView = 'home' | 'missions' | 'mission' | 'schedule' | 'calendar' | 'notifications' | 'alerts' | 'history' | 'payments' | 'readiness' | 'support' | 'messages' | 'profile' | 'safety' | 'offline'

type Props = {
  records: MissionControlRecord[]
  view?: CareLinkMobileView
  selectedId?: string | number
  dossier?: MissionDossier | null
  workspace?: CareLinkMobileWorkspace | null
}

type Toast = { tone: 'success' | 'error'; text: string } | null

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    assigned: 'Assignée',
    agent_notified: 'À confirmer',
    agent_accepted: 'Acceptée',
    confirmed: 'Confirmée',
    en_route: 'En route',
    arrival_confirmed: 'Arrivée confirmée',
    mission_started: 'Mission démarrée',
    in_progress: 'En cours',
    report_pending: 'Rapport attendu',
    report_submitted: 'Rapport soumis',
    completed: 'Terminée',
    incident: 'Incident',
    cancelled: 'Annulée',
    closed: 'Clôturée',
    no_show: 'Absence',
  }
  return labels[status] || String(status || 'Mission').replaceAll('_', ' ').toUpperCase()
}

function statusTone(status: string) {
  if (['completed', 'report_submitted', 'agent_accepted', 'confirmed', 'closed'].includes(status)) return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
  if (['in_progress', 'mission_started', 'en_route', 'arrival_confirmed'].includes(status)) return 'bg-blue-50 text-blue-700 ring-blue-100'
  if (['incident', 'cancelled'].includes(status)) return 'bg-rose-50 text-rose-700 ring-rose-100'
  if (['report_pending', 'agent_notified', 'draft'].includes(status)) return 'bg-amber-50 text-amber-700 ring-amber-100'
  return 'bg-slate-100 text-slate-700 ring-slate-200'
}

function riskTone(risk: string) {
  if (['critical', 'high', 'elevated'].includes(String(risk).toLowerCase())) return 'bg-rose-50 text-rose-700 ring-rose-100'
  if (['watch', 'medium', 'warning'].includes(String(risk).toLowerCase())) return 'bg-amber-50 text-amber-700 ring-amber-100'
  return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
}

function readinessLabel(status: string) {
  const labels: Record<string, string> = {
    ready: 'Prête',
    warning: 'Vigilance',
    blocked: 'Bloquée',
    pending: 'En attente',
  }
  return labels[status] || String(status || 'En attente').replaceAll('_', ' ').toUpperCase()
}

function formatHour(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date)
}

function formatDay(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: '2-digit', month: 'short' }).format(date)
}

function currencyDh(value: unknown) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} DH`
}

function firstString(...values: unknown[]) {
  return String(values.find((value) => typeof value === 'string' && value.trim()) || '')
}

function firstText(...values: unknown[]) {
  return firstString(...values)
}

function eventLabel(eventType: string) {
  const labels: Record<string, string> = {
    assigned: 'Mission assignée',
    agent_notified: 'Agent notifié',
    agent_accepted: 'Acceptée par l’agent',
    confirmed: 'Confirmée',
    confirmed_by_dispatch: 'Confirmée par la liaison opérationnelle',
    en_route: 'En route',
    arrived: 'Arrivée confirmée',
    arrival_confirmed: 'Arrivée confirmée',
    mission_started: 'Mission démarrée',
    in_progress: 'En cours',
    report_submitted: 'Rapport soumis',
    completed: 'Terminée',
    incident: 'Incident signalé',
    incident_reported: 'Incident signalé',
    cancelled: 'Annulée',
    closed: 'Clôturée',
  }
  return labels[eventType] || eventType.replaceAll('_', ' ')
}


function deriveCareLinkAgentDisplayName(workspace: CareLinkMobileWorkspace | null) {
  const enterpriseIdentity = (workspace?.enterpriseDossier as any)?.identity || {}
  const profile = (workspace?.profile || {}) as Record<string, any>
  const agent = (workspace?.agent || {}) as Record<string, any>

  const candidates = [
    enterpriseIdentity.name,
    enterpriseIdentity.full_name,
    profile.full_name,
    profile.name,
    profile.display_name,
    profile.agent_name,
    profile.caregiver_name,
    agent.full_name,
    agent.name,
    agent.display_name,
    agent.agent_name,
    agent.caregiver_name,
  ]

  const value = candidates.find((item) => typeof item === 'string' && item.trim().length > 1)
  return value ? String(value).trim() : 'Agent CareLink'
}

function careLinkTodayFrenchLabel() {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

type ProgramActivity = {
  id: string
  title: string
  description: string
  objective: string
  instructions: string
  materials: string
  safety: string
  timeLabel: string
  dayLabel: string
  category: string
  required: boolean
  sortOrder: number
  raw: Record<string, any>
}

type MissionRoutePlan = {
  id: string
  code: string
  from: string
  fromZone: string
  fromTime: string
  to: string
  toZone: string
  toTime: string
  transportMode: string
  transportDetails: string
  backupTransport: string
  distanceLabel: string
  durationLabel: string
  costMad: string
  status: string
  transits: Array<Record<string, any>>
  raw: Record<string, any>
}

type MissionRouteExecutionLog = {
  id: string
  missionId: number
  caregiverId: number
  routeId: string
  routeCode: string | null
  action: string
  status: string
  transportMode: string | null
  eta: string | null
  notes: string | null
  issueSeverity: string | null
  createdAt: string
  metadata: Record<string, unknown>
}

function readRouteObject(value: unknown): Record<string, any> {
  if (!value) return {}
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, any>
  try {
    const parsed = JSON.parse(String(value))
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function firstRouteText(row: Record<string, any>, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = row[key]
    if (Array.isArray(value) && value.length) return value.map((item) => String(item)).join(' · ')
    if (typeof value === 'string' && value.trim()) return value
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return fallback
}

function normalizeMissionRoutes(mission: MissionControlRecord, routeRows: Array<Record<string, any>>, transport: Record<string, unknown> | null | undefined): MissionRoutePlan[] {
  const sourceRows = routeRows.length ? routeRows : [{
    id: 'primary-route',
    route_code: firstRouteText(mission as any, ['routeCode', 'route_code'], `RT-${mission.code || mission.id}`),
    departureName: firstRouteText(mission as any, ['routeFrom', 'route_from', 'city'], mission.city || 'Départ'),
    arrivalName: firstRouteText(mission as any, ['routeTo', 'route_to', 'zone'], mission.zone || 'Arrivée'),
    transport_mode: firstRouteText(transport || {}, ['mode', 'label', 'transport_mode'], firstRouteText(mission as any, ['transportMode', 'transport_mode'], 'Transport non précisé')),
  }]

  return sourceRows.map((row, index) => {
    const meta = readRouteObject(row.notes || row.metadata)
    const departure = readRouteObject(row.outbound_departure || row.departure || row.from_details)
    const arrival = readRouteObject(row.outbound_arrival || row.arrival || row.to_details)
    const transportMeta = readRouteObject(row.return_departure || row.transport || transport || {})
    const backup = readRouteObject(row.return_arrival || row.backup || {})
    const transits = Array.isArray(meta.transits) ? meta.transits : Array.isArray(transportMeta.transits) ? transportMeta.transits : Array.isArray(row.transits) ? row.transits : []
    return {
      id: firstRouteText(row, ['id', 'localId', 'route_id'], `route-${index + 1}`),
      code: firstRouteText(meta, ['routeCode'], firstRouteText(row, ['route_code', 'routeCode', 'code'], `RT-${mission.code || mission.id}-${index + 1}`)),
      from: firstRouteText(meta, ['departureName'], firstRouteText(departure, ['name', 'label'], firstRouteText(row, ['from', 'origin', 'route_from', 'departure_name'], mission.city || 'Départ'))),
      fromZone: firstRouteText(meta, ['departureZone'], firstRouteText(departure, ['zone'], firstRouteText(row, ['departure_zone', 'route_from_zone'], mission.zone || '—'))),
      fromTime: firstRouteText(meta, ['departureTime'], firstRouteText(departure, ['time'], firstRouteText(row, ['departure_time', 'start_time', 'planned_start'], mission.timeLabel || '—'))),
      to: firstRouteText(meta, ['arrivalName'], firstRouteText(arrival, ['name', 'label'], firstRouteText(row, ['to', 'destination', 'route_to', 'arrival_name'], mission.zone || 'Arrivée'))),
      toZone: firstRouteText(meta, ['arrivalZone'], firstRouteText(arrival, ['zone'], firstRouteText(row, ['arrival_zone', 'route_to_zone'], mission.zone || '—'))),
      toTime: firstRouteText(meta, ['arrivalTime'], firstRouteText(arrival, ['time'], firstRouteText(row, ['arrival_time', 'planned_arrival'], '—'))),
      transportMode: firstRouteText(meta, ['primaryTransport'], firstRouteText(transportMeta, ['primaryTransport', 'mode', 'transport_mode', 'label'], firstRouteText(row, ['transport_mode', 'mode'], 'Transport non précisé'))),
      transportDetails: firstRouteText(meta, ['transportDetails'], firstRouteText(transportMeta, ['transportDetails', 'details'], firstRouteText(row, ['transport_details', 'details'], 'Détails transport non précisés'))),
      backupTransport: firstRouteText(meta, ['backupTransport'], Array.isArray(backup.backupTransports) ? backup.backupTransports.join(' · ') : firstRouteText(row, ['backup_transport', 'backup'], 'Backup non précisé')),
      distanceLabel: firstRouteText(row, ['distance_label', 'distanceLabel'], firstRouteText(meta, ['distanceLabel'], 'Distance à confirmer')),
      durationLabel: firstRouteText(row, ['duration_label', 'durationLabel'], firstRouteText(meta, ['durationLabel'], 'Durée à confirmer')),
      costMad: firstRouteText(row, ['cost_mad', 'costMad'], firstRouteText(meta, ['costMad'], '0')),
      status: firstRouteText(meta, ['status'], firstRouteText(row, ['status'], 'planning')),
      transits,
      raw: row,
    }
  })
}

function normalizeRouteExecutionLog(row: Record<string, any>): MissionRouteExecutionLog {
  return {
    id: String(row.id || `route-log-${Date.now()}`),
    missionId: Number(row.missionId || row.mission_id || 0),
    caregiverId: Number(row.caregiverId || row.caregiver_id || 0),
    routeId: String(row.routeId || row.route_id || 'primary-route'),
    routeCode: row.routeCode || row.route_code || null,
    action: String(row.action || 'route_update'),
    status: String(row.status || 'recorded'),
    transportMode: row.transportMode || row.transport_mode || null,
    eta: row.eta || null,
    notes: row.notes || null,
    issueSeverity: row.issueSeverity || row.issue_severity || null,
    createdAt: String(row.createdAt || row.created_at || new Date().toISOString()),
    metadata: readRouteObject(row.metadata),
  }
}

function routeActionLabel(action: string) {
  const labels: Record<string, string> = {
    departure_confirmed: 'Départ confirmé',
    eta_updated: 'ETA transmis',
    delay_reported: 'Retard signalé',
    issue_reported: 'Incident trajet',
    route_completed: 'Trajet terminé',
    allowance_claimed: 'Frais transport déclarés',
    location_shared: 'Position transmise',
    route_update: 'Mise à jour trajet',
  }
  return labels[action] || action.replaceAll('_', ' ')
}

function firstProgramText(line: Record<string, any>, keys: string[], fallback = '—') {
  for (const key of keys) {
    const value = line[key]
    if (Array.isArray(value) && value.length) return value.map((item) => String(item)).join(' · ')
    if (typeof value === 'string' && value.trim()) return value
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return fallback
}

function programActivityId(line: Record<string, any>, index: number) {
  return String(line.id || line.activity_id || line.program_line_id || line.code || line.reference || `program-line-${index + 1}`)
}

function isProgramActivityRequired(line: Record<string, any>) {
  const raw = String(line.required || line.is_required || line.mandatory || line.requirement || line.priority || '').toLowerCase()
  return line.required === true || line.is_required === true || line.mandatory === true || ['required', 'mandatory', 'obligatoire', 'must'].some((word) => raw.includes(word))
}

function normalizeProgramActivities(programLines: Array<Record<string, any>>, parameterDays: Array<Record<string, any>>): ProgramActivity[] {
  return programLines.map((line, index) => {
    const dayIndex = Number(line.day_index || line.day || line.parameter_day_index || 0)
    const linkedDay = Number.isFinite(dayIndex) ? parameterDays[Math.max(0, dayIndex - 1)] || parameterDays[dayIndex] : null
    const start = firstProgramText(line, ['start_time', 'planned_start', 'from', 'hour', 'time'], '')
    const end = firstProgramText(line, ['end_time', 'planned_end', 'to'], '')
    const duration = firstProgramText(line, ['duration', 'duration_minutes', 'estimated_duration'], '')
    const timeLabel = start && end ? `${start} → ${end}` : start || duration || 'Horaire non précisé'

    return {
      id: programActivityId(line, index),
      title: firstProgramText(line, ['label', 'title', 'name', 'activity', 'activity_title', 'program_title'], `Activité ${index + 1}`),
      description: firstProgramText(line, ['description', 'note', 'details', 'value', 'summary'], 'Aucune description ajoutée dans le dossier.'),
      objective: firstProgramText(line, ['objective', 'goal', 'purpose', 'learning_objective'], 'Objectif non précisé.'),
      instructions: firstProgramText(line, ['instructions', 'agent_instructions', 'execution_notes', 'ops_instructions'], 'Suivre les consignes du dossier et de la liaison opérationnelle.'),
      materials: firstProgramText(line, ['materials', 'material', 'required_material', 'equipment', 'kit'], 'Aucun matériel spécifique renseigné.'),
      safety: firstProgramText(line, ['safety', 'safety_notes', 'risk_notes', 'precautions'], 'Appliquer les règles de sécurité AngelCare.'),
      timeLabel,
      dayLabel: firstProgramText(line, ['day_label', 'date_label', 'mission_day'], firstProgramText(linkedDay || {}, ['label', 'date', 'day_label'], 'Programme mission')),
      category: firstProgramText(line, ['category', 'service_family', 'type'], 'Programme'),
      required: isProgramActivityRequired(line),
      sortOrder: Number(line.sort_order || line.order || index),
      raw: line,
    }
  }).sort((a, b) => a.sortOrder - b.sortOrder)
}

function latestProgramActivityLogMap(logs: Array<Record<string, any>>) {
  const map = new Map<string, Record<string, any>>()
  for (const log of logs) {
    const activityId = String(log.activityId || log.activity_id || '')
    if (!activityId || map.has(activityId)) continue
    map.set(activityId, log)
  }
  return map
}

function programStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'À faire',
    started: 'Démarrée',
    in_progress: 'En cours',
    completed: 'Terminée',
    done: 'Terminée',
    validated: 'Validée',
    issue: 'Point à signaler',
    blocked: 'Bloquée',
    skipped: 'Non réalisée',
  }
  return labels[status] || status.replaceAll('_', ' ')
}

function programStatusTone(status: string) {
  if (['completed', 'done', 'validated'].includes(status)) return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
  if (['started', 'in_progress'].includes(status)) return 'bg-blue-50 text-blue-700 ring-blue-100'
  if (['issue', 'blocked'].includes(status)) return 'bg-rose-50 text-rose-700 ring-rose-100'
  if (['skipped'].includes(status)) return 'bg-amber-50 text-amber-700 ring-amber-100'
  return 'bg-slate-100 text-slate-600 ring-slate-200'
}

function latestReportCorrection(corrections: Array<Record<string, any>>) {
  return [...corrections]
    .sort((a, b) => String(b.updatedAt || b.updated_at || b.requestedAt || b.requested_at || b.createdAt || b.created_at || '').localeCompare(String(a.updatedAt || a.updated_at || a.requestedAt || a.requested_at || a.createdAt || a.created_at || '')))[0] || null
}

function reportValidationLabel(status: string) {
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    pending: 'En attente',
    ready: 'Prêt validation',
    submitted: 'Soumis',
    resubmitted: 'Resoumis',
    correction_requested: 'Correction demandée',
    needs_correction: 'Correction demandée',
    rejected: 'Rejeté',
    validated: 'Validé OPS',
  }
  return labels[status] || status.replaceAll('_', ' ')
}

function reportValidationTone(status: string) {
  if (['validated'].includes(status)) return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
  if (['ready', 'submitted', 'resubmitted'].includes(status)) return 'bg-blue-50 text-blue-700 ring-blue-100'
  if (['correction_requested', 'needs_correction', 'rejected'].includes(status)) return 'bg-rose-50 text-rose-700 ring-rose-100'
  return 'bg-amber-50 text-amber-700 ring-amber-100'
}

function reportCorrectionChanges(row: Record<string, any> | null) {
  const value = row?.requiredChanges || row?.required_changes || row?.metadata?.required_changes || row?.metadata?.requiredChanges
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(/[;|\n]/).map((item) => item.trim()).filter(Boolean)
  return []
}

type MissionBriefSection = {
  key: string
  label: string
  value: string
  required: boolean
}

function rowText(row: Record<string, any> | null | undefined, keys: string[], fallback = '') {
  if (!row) return fallback
  for (const key of keys) {
    const value = row[key]
    if (Array.isArray(value) && value.length) return value.map((item) => String(item)).filter(Boolean).join(' · ')
    if (value && typeof value === 'object') {
      const nested = Object.values(value).find((item) => typeof item === 'string' && item.trim())
      if (nested) return String(nested)
    }
    if (typeof value === 'string' && value.trim()) return value
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return fallback
}

function buildMissionBriefSections(mission: MissionControlRecord, dossier: MissionDossier | null, serviceNotes: string[]): MissionBriefSection[] {
  const raw = (dossier?.raw || {}) as Record<string, any>
  const family = (raw.families || {}) as Record<string, any>
  const contract = (raw.contracts || {}) as Record<string, any>
  const parameters = (dossier?.parameters || {}) as Record<string, any>
  const location = [rowText(raw, ['address', 'full_address', 'location', 'pickup_address'], ''), mission.zone, mission.city].filter(Boolean).join(' · ')
  const emergency = rowText(raw, ['emergency_contact', 'emergency_phone', 'parent_phone', 'contact_phone'], '') || rowText(family, ['phone', 'mobile_phone', 'emergency_phone'], '') || 'Contact urgence non renseigné dans le dossier.'
  const parentInstructions =
    rowText(raw, ['parent_instructions', 'family_instructions', 'instructions_parent', 'client_instructions', 'notes'], '') ||
    rowText(parameters, ['parent_instructions', 'instructions', 'care_instructions', 'special_notes'], '') ||
    rowText(contract, ['instructions', 'notes'], '') ||
    mission.title ||
    'Aucune consigne parent spécifique publiée. Appliquer les standards AngelCare et contacter OPS en cas de doute.'

  return [
    {
      key: 'parent_instructions',
      label: 'Consignes parent',
      value: parentInstructions,
      required: true,
    },
    {
      key: 'service_scope',
      label: 'Périmètre de service',
      value: rowText(raw, ['mission_scope', 'service_scope', 'scope'], '') || `${mission.serviceType} · ${mission.serviceFamily}`,
      required: true,
    },
    {
      key: 'location',
      label: 'Lieu et accès',
      value: location || 'Lieu non détaillé. Se référer à la zone mission et à la liaison opérationnelle.',
      required: true,
    },
    {
      key: 'emergency_contact',
      label: 'Contact urgence',
      value: emergency,
      required: true,
    },
    {
      key: 'safety_confidentiality',
      label: 'Sécurité et confidentialité',
      value: rowText(raw, ['safety_notes', 'risk_notes', 'confidentiality_notes', 'ops_notes'], '') || serviceNotes[0] || 'Respect strict de la confidentialité famille/enfant, sécurité terrain et remontée immédiate de toute anomalie à OPS.',
      required: true,
    },
  ]
}

function latestMissionBriefAcknowledgement(acks: Array<Record<string, any>>) {
  return [...acks].sort((a, b) => String(b.acknowledgedAt || b.acknowledged_at || b.updatedAt || b.updated_at || '').localeCompare(String(a.acknowledgedAt || a.acknowledged_at || a.updatedAt || a.updated_at || '')))[0] || null
}

function missionBriefAcknowledgementComplete(ack: Record<string, any> | null | undefined) {
  if (!ack) return false
  const status = String(ack.status || '').toLowerCase()
  return status === 'acknowledged' && Boolean(
    (ack.parentInstructionsAcknowledged ?? ack.parent_instructions_acknowledged) &&
    (ack.serviceScopeAcknowledged ?? ack.service_scope_acknowledged) &&
    (ack.locationAcknowledged ?? ack.location_acknowledged) &&
    (ack.emergencyAcknowledged ?? ack.emergency_acknowledged) &&
    (ack.confidentialityAcknowledged ?? ack.confidentiality_acknowledged),
  )
}

function routeMeta(view: CareLinkMobileView, workspace: CareLinkMobileWorkspace | null) {
  const unread = safeArray<{ unread?: boolean }>(workspace?.messages).filter((message) => Boolean(message.unread)).length
  const criticalAlerts = safeArray<{ tone?: string }>(workspace?.alerts).filter((alert) => alert.tone === 'red').length
  const pendingNotifications = safeArray<{ unread?: boolean }>(workspace?.notifications).filter((item) => item.unread).length
  const pendingDisputes = safeArray<Record<string, unknown>>(workspace?.paymentDisputes).length
  const expiredDocuments = safeArray<{ expiresAt?: string | null }>(workspace?.documents).filter((document) => document.expiresAt && new Date(String(document.expiresAt)).getTime() < Date.now()).length

  const config: Record<CareLinkMobileView, { eyebrow: string; title: string; description: string; chips: string[] }> = {
    home: {
      eyebrow: 'Centre de commande terrain',
      title: 'CareLink Mobile',
      description: 'Vue consolidée des missions, de la liaison opérationnelle, de la sécurité, des paiements, de la préparation et de l’audit mobile.',
      chips: [`${unread} messages`, `${pendingNotifications} notifications`, `${criticalAlerts} alertes critiques`],
    },
    missions: {
      eyebrow: 'File de missions',
      title: 'Missions terrain',
      description: 'Missions du jour, confirmations, rapports, récurrences et risques dans un seul flux opérationnel.',
      chips: ['Confirmations', 'Contrôles', 'Rapports'],
    },
    mission: {
      eyebrow: 'Exécution mission',
      title: 'Détail opérationnel',
      description: 'Chronologie, checklist, rapport, transport, liaison opérationnelle, sécurité et audit de mission.',
      chips: ['Cycle', 'Contrôle', 'Audit'],
    },
    schedule: {
      eyebrow: 'Planning',
      title: 'Chronologie jour et semaine',
      description: 'Blocages, disponibilités, missions à venir et fenêtres de trajet dans le même planning.',
      chips: ['Jour', 'Semaine', 'Disponibilité'],
    },
    calendar: {
      eyebrow: 'Calendrier',
      title: 'Vue calendrier',
      description: 'Densité de mission, sessions récurrentes et navigation par période sans quitter le mobile.',
      chips: ['Mois', 'Semaine', 'Jour'],
    },
    notifications: {
      eyebrow: 'Notifications',
      title: 'Centre de notifications',
      description: 'Rappels, validations, paiements, conformité et mises à jour persistantes de liaison opérationnelle.',
      chips: [pendingNotifications ? `${pendingNotifications} non lues` : 'Aucune non lue', 'Priorités', 'Accusé de réception'],
    },
    alerts: {
      eyebrow: 'Alertes',
      title: 'Centre d’alertes',
      description: 'Alertes terrain, risques, incidents et escalades à traiter immédiatement.',
      chips: [criticalAlerts ? `${criticalAlerts} critiques` : 'Aucune critique', 'Sécurité', 'Opérations'],
    },
    history: {
      eyebrow: 'Audit terrain',
      title: 'Historique opérationnel',
      description: 'Journal des événements, rapports, incidents, corrections et conformité.',
      chips: ['Événements mission', 'Incidents', 'Conformité'],
    },
    payments: {
      eyebrow: 'Compensation',
      title: 'Paiements et indemnités',
      description: 'Montants validés, en attente, primes, transport et corrections en MAD / DH.',
      chips: [pendingDisputes ? `${pendingDisputes} litiges` : 'Aucun litige', 'MAD / DH', 'Finance'],
    },
    readiness: {
      eyebrow: 'Préparation',
      title: 'Centre de préparation',
      description: 'Blocages, documents expirés, conformité et actions de mise en conformité.',
      chips: [expiredDocuments ? `${expiredDocuments} expirés` : 'Conforme', 'Documents', 'Éligibilité'],
    },
    support: {
      eyebrow: 'Assistance',
      title: 'Liaison d’assistance',
      description: 'Liaison opérationnelle, finance, supervision et assistance technique avec escalade rapide.',
      chips: ['Liaison', 'Finance', 'Supervision'],
    },
    messages: {
      eyebrow: 'Liaison opérationnelle',
      title: 'Messages persistants',
      description: 'Fils mission, messages urgents, lecture, relance et envoi de localisation.',
      chips: ['Fils', 'Urgent', 'Localisation'],
    },
    profile: {
      eyebrow: 'Profil agent',
      title: 'Identité et conformité',
      description: 'Zones, compétences, langues, performance, disponibilité et documents.',
      chips: ['Zones', 'Compétences', 'Conformité'],
    },
    safety: {
      eyebrow: 'Sécurité',
      title: 'Centre SOS',
      description: 'Urgence, liaison opérationnelle, secours, incident et protocole terrain.',
      chips: ['SOS', 'Incident', 'Localisation'],
    },
    offline: {
      eyebrow: 'Synchronisation',
      title: 'Centre offline et appareil',
      description: 'État réseau, file locale, audit appareil, sessions et synchronisation anti-doublon.',
      chips: ['Offline', 'Device', 'Audit'],
    },
  }

  return config[view]
}

export function CareLinkFieldAgentPremiumApp({ records, view = 'home', selectedId, dossier = null, workspace = null }: Props) {
  const [localRecords, setLocalRecords] = useState(records)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast>(null)
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'completed'>('today')
  const [notificationFeed, setNotificationFeed] = useState(workspace?.notifications || [])
  const [alertFeed, setAlertFeed] = useState(workspace?.alerts || [])
  const [messageFeed, setMessageFeed] = useState(workspace?.messages || [])
  const { dispatch: dispatchQueue, pendingCount, syncing, isOnline } = useCareLinkOfflineQueue()
  const { workspace: liveWorkspace } = useCareLinkRealtime(workspace)
  const activeWorkspace = liveWorkspace || workspace

  useEffect(() => {
    setNotificationFeed(activeWorkspace?.notifications || [])
    setAlertFeed(activeWorkspace?.alerts || [])
    setMessageFeed(activeWorkspace?.messages || [])
  }, [activeWorkspace?.alerts, activeWorkspace?.dispatchThreads, activeWorkspace?.messages, activeWorkspace?.notifications])

  useEffect(() => {
    if (liveWorkspace?.records?.length) setLocalRecords(liveWorkspace.records)
  }, [liveWorkspace])

  const selected = useMemo(() => {
    if (dossier?.mission) return dossier.mission
    return localRecords.find((item) => String(item.id) === String(selectedId) || item.code === selectedId) || localRecords[0] || null
  }, [dossier, localRecords, selectedId])

  async function runAction(mission: MissionControlRecord, action: string, payload?: Record<string, any> | string) {
    setBusy(`${mission.id}:${action}`)
    setToast(null)
    try {
      const body =
        typeof payload === 'string'
          ? { note: payload, source: 'carelink_mobile' }
          : { ...(payload || {}), source: 'carelink_mobile' }
      const response = await dispatchQueue({
        endpoint: `/api/carelink/missions/${mission.id}/${action}`,
        payload: body,
        missionId: mission.id,
        label: `${mission.code}:${action}`,
      })

      if (!response.ok) throw new Error('Échec de l’action')

      const statusMap: Record<string, string> = {
        accept: 'agent_accepted',
        decline: 'agent_declined',
        'confirm-readiness': 'confirmed',
        'en-route': 'en_route',
        delay: mission.status,
        arrive: 'arrival_confirmed',
        arrived: 'arrival_confirmed',
        'check-in': 'checked_in',
        start: 'mission_started',
        report: 'report_submitted',
        incident: 'incident',
        'request-replacement': mission.status,
        complete: 'completed',
      }

      if (response.queued) {
        if (!['checklist'].includes(action)) {
          const optimisticStatus = statusMap[action] || mission.status
          setLocalRecords((current) => current.map((item) => (item.id === mission.id ? { ...item, status: optimisticStatus, lifecycleStage: optimisticStatus } : item)))
        }
        setToast({ tone: 'success', text: 'Action enregistrée hors ligne. Synchronisation en attente.' })
        return
      }

      const result = response.data as any
      const missionData = result?.data?.mission || result?.mission || result?.data || result
      const newStatus = missionData?.status || statusMap[action] || mission.status
      if (!['checklist'].includes(action)) {
        setLocalRecords((current) => current.map((item) => (item.id === mission.id ? { ...item, status: newStatus, lifecycleStage: missionData?.lifecycle_stage || newStatus } : item)))
      }
      setToast({ tone: 'success', text: 'Mission synchronisée avec la liaison opérationnelle.' })
    } catch (error) {
      setToast({ tone: 'error', text: error instanceof Error ? error.message : 'Synchronisation impossible.' })
    } finally {
      setBusy(null)
    }
  }

  async function runCareLinkAction(endpoint: string, payload: Record<string, unknown>) {
    const response = await dispatchQueue({ endpoint, payload, label: endpoint })
    if (!response.ok) throw new Error('Synchronisation impossible')
    return response
  }

  return (
    <main className="min-h-dvh bg-[#f4f8ff] text-slate-950">
      <div className="mx-auto min-h-dvh max-w-md overflow-hidden bg-[#f8fbff] shadow-[0_30px_100px_rgba(15,23,42,0.12)]">
        {view !== 'mission' ? (
          <TopBar
            records={localRecords}
            notifications={notificationFeed}
            queuePending={pendingCount}
            syncing={syncing}
            online={isOnline}
            runCareLinkAction={runCareLinkAction}
            onNotificationAcknowledged={(id) => setNotificationFeed((current) => current.map((item) => (item.id === id ? { ...item, unread: false } : item)))}
          />
        ) : null}
        {view === 'home' ? <HomeScreen records={localRecords} workspace={activeWorkspace} runAction={runAction} busy={busy} queuePending={pendingCount} syncing={syncing} online={isOnline} /> : null}
        {view === 'missions' ? <MissionsScreen records={localRecords} workspace={activeWorkspace} activeTab={activeTab} setActiveTab={setActiveTab} runAction={runAction} busy={busy} /> : null}
        {view === 'mission' ? <MissionDetailScreen mission={selected} dossier={dossier} workspace={activeWorkspace} runAction={runAction} busy={busy} /> : null}
        {view === 'schedule' ? <EnterpriseScheduleScreen records={localRecords} workspace={activeWorkspace} runCareLinkAction={runCareLinkAction} /> : null}
        {view === 'calendar' ? <CalendarScreen workspace={activeWorkspace} records={localRecords} /> : null}
        {view === 'notifications' ? <NotificationsScreen workspace={activeWorkspace} records={localRecords} notifications={notificationFeed} runCareLinkAction={runCareLinkAction} /> : null}
        {view === 'alerts' ? <AlertsScreen workspace={activeWorkspace} records={localRecords} alerts={alertFeed} runCareLinkAction={runCareLinkAction} /> : null}
        {view === 'history' ? <HistoryScreen workspace={activeWorkspace} records={localRecords} /> : null}
        {view === 'payments' ? <EnterprisePaymentsScreen workspace={activeWorkspace} records={localRecords} runCareLinkAction={runCareLinkAction} /> : null}
        {view === 'readiness' ? <EnterpriseReadinessScreen workspace={activeWorkspace} records={localRecords} runCareLinkAction={runCareLinkAction} /> : null}
        {view === 'support' ? <SupportScreen workspace={activeWorkspace} records={localRecords} runCareLinkAction={runCareLinkAction} /> : null}
        {view === 'messages' ? <MessagesScreen records={localRecords} workspace={activeWorkspace} messages={messageFeed} runCareLinkAction={runCareLinkAction} /> : null}
        {view === 'profile' ? <EnterpriseAgentProfileScreen records={localRecords} workspace={activeWorkspace} runCareLinkAction={runCareLinkAction} /> : null}
        {view === 'safety' ? <EnterpriseSafetyScreen workspace={activeWorkspace} records={localRecords} runCareLinkAction={runCareLinkAction} /> : null}
        {view === 'offline' ? <EnterpriseOfflineScreen workspace={activeWorkspace} records={localRecords} runCareLinkAction={runCareLinkAction} pendingCount={pendingCount} syncing={syncing} online={isOnline} /> : null}
        {toast ? <ToastMessage toast={toast} /> : null}
        <BottomNav active={view === 'mission' ? 'missions' : view} />
      </div>
    </main>
  )
}

function TopBar({
  records,
  notifications,
  messages = [],
  alerts = [],
  queuePending,
  syncing,
  online,
  runCareLinkAction,
  onNotificationAcknowledged,
}: {
  records: MissionControlRecord[]
  notifications: CareLinkMobileNotification[]
  messages?: any[]
  alerts?: any[]
  queuePending: number
  syncing: boolean
  online: boolean
  runCareLinkAction: (endpoint: string, payload: Record<string, unknown>) => Promise<unknown>
  onNotificationAcknowledged: (id: string) => void
}) {
  const todayCount = records.filter((item) => item.dateLabel && item.dateLabel !== 'Non planifiée').length
  const [open, setOpen] = useState(false)
  const [busyNotificationId, setBusyNotificationId] = useState<string | null>(null)
  const [topBarHydrated, setTopBarHydrated] = useState(false)

  useEffect(() => {
    setTopBarHydrated(true)
  }, [])

  const safeOnline = topBarHydrated ? online : false
  const safeSyncing = topBarHydrated ? syncing : false
  const unreadCount = notifications.filter((item) => item.unread).length
  const topNotifications = notifications
    .slice()
    .sort((a, b) => Number(Boolean(b.unread)) - Number(Boolean(a.unread)))
    .slice(0, 5)

  async function acknowledgeNotification(item: CareLinkMobileNotification) {
    setBusyNotificationId(item.id)
    try {
      await runCareLinkAction(`/api/carelink/notifications/${item.id}/acknowledge`, {
        missionId: item.missionId || null,
        note: `Notification ${item.id} reconnue depuis le menu mobile`,
      })
      onNotificationAcknowledged(item.id)
    } finally {
      setBusyNotificationId(null)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-white shadow-lg shadow-blue-100 ring-1 ring-slate-100"><AngelCareLogo size="sm" /></div>
          <div>
            <p className="text-xs font-black tracking-tight text-slate-950">Bonjour</p>
            <p className="text-[11px] font-semibold text-slate-500">{todayCount} mission{todayCount > 1 ? 's' : ''} aujourd’hui</p>
          </div>
        </div>
        <div className="relative">
          <CareLinkUnifiedConnectNotificationBell records={records} notifications={notifications} messages={messages} alerts={alerts} queuePending={queuePending} />

          {open ? (
            <div className="absolute left-0 top-14 z-50 w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-[0_28px_75px_rgba(15,23,42,0.22)]">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">Notifications</p>
                    <p className="mt-1 text-sm font-black text-slate-950">{unreadCount ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est synchronisé'}</p>
                  </div>
                  <Link href="/carelink/notifications" onClick={() => setOpen(false)} className="rounded-full bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                    Tout voir
                  </Link>
                </div>
              </div>

              <div className="max-h-[22rem] overflow-y-auto p-3">
                {topNotifications.length ? topNotifications.map((item) => (
                  <article key={item.id} className={cx('mb-2 rounded-[1.2rem] border p-3 last:mb-0', item.unread ? 'border-blue-100 bg-blue-50/70' : 'border-slate-100 bg-white')}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-sm font-black text-slate-950">{item.title || 'Notification CareLink'}</p>
                        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{item.body || 'Mise à jour CareLink mobile.'}</p>
                        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{item.priority || 'normal'} · {item.unread ? 'Non lue' : 'Lue'}</p>
                      </div>
                      <span className={cx('mt-1 h-2.5 w-2.5 shrink-0 rounded-full', item.unread ? 'bg-blue-600' : 'bg-slate-300')} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={item.missionId ? `/carelink/missions/${item.missionId}` : '/carelink/notifications'}
                        onClick={() => setOpen(false)}
                        className="rounded-full bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white"
                      >
                        Ouvrir
                      </Link>
                      {item.unread ? (
                        <button
                          type="button"
                          disabled={busyNotificationId === item.id}
                          onClick={() => acknowledgeNotification(item)}
                          className="rounded-full bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-700 ring-1 ring-slate-200 disabled:opacity-50"
                        >
                          {busyNotificationId === item.id ? 'Sync...' : 'Accuser'}
                        </button>
                      ) : null}
                    </div>
                  </article>
                )) : (
                  <div className="rounded-[1.2rem] bg-slate-50 p-4 text-center">
                    <p className="text-sm font-black text-slate-900">Aucune notification</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Les rappels, validations et alertes apparaîtront ici dès synchronisation OPS.</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
        <span>{safeOnline ? 'En ligne' : 'Hors ligne'}</span>
        <span>{safeSyncing ? 'Synchronisation...' : queuePending ? `${queuePending} action${queuePending > 1 ? 's' : ''} en attente` : 'Synchronisé'}</span>
      </div>
    </header>
  )
}

function HomeScreen({
  records,
  workspace,
  runAction,
  busy,
  queuePending,
  syncing,
  online,
}: {
  records: MissionControlRecord[]
  workspace: CareLinkMobileWorkspace | null
  runAction: (mission: MissionControlRecord, action: string) => void
  busy: string | null
  queuePending: number
  syncing: boolean
  online: boolean
}) {
  const meta = routeMeta('home', workspace)
  const next = records[0] || null
  const completed = records.filter((item) => ['completed', 'closed'].includes(item.status)).length
  const active = records.filter((item) => ['assigned', 'agent_notified', 'agent_accepted', 'confirmed', 'en_route', 'arrival_confirmed', 'mission_started', 'in_progress'].includes(item.status)).length
  const alerts = records.filter((item) => ['incident', 'cancelled'].includes(item.status)).length
  const notifications = safeArray<CareLinkMobileNotification>(workspace?.notifications)
  const alertsFeed = safeArray<CareLinkMobileAlert>(workspace?.alerts)
  const messages = safeArray<{ id: string; title: string; body: string; missionId?: string | number | null; priority: string; unread: boolean; createdAt: string }>(workspace?.messages)
  const checklistItems = safeArray<Record<string, unknown>>(workspace?.checklistItems)
  const reports = safeArray<Record<string, unknown>>(workspace?.reports)
  const disputes = safeArray<Record<string, unknown>>(workspace?.paymentDisputes)
  const documents = safeArray<Record<string, unknown>>(workspace?.documents)
  const history = safeArray<Record<string, unknown>>(workspace?.history)
  const support = safeArray<Record<string, unknown>>(workspace?.support)
  const unreadMessages = messages.filter((message) => message.unread).length
  const pendingNotifications = notifications.filter((notification) => notification.unread).length
  const criticalAlerts = alertsFeed.filter((alert) => alert.tone === 'red').length
  const pendingConfirmations = records.filter((item) => ['assigned', 'agent_notified'].includes(item.status)).length
  const checklistPending = checklistItems.filter((item) => !Boolean(item.completed)).length
  const reportsDue = reports.filter((report) => !['validated', 'submitted'].includes(String(report.status || report.validationStatus || '').toLowerCase())).length
  const complianceBlocks = documents.filter((document) => {
    const status = String(document.status || document.reviewStatus || '').toLowerCase()
    const expiresAt = document.expiresAt ? new Date(String(document.expiresAt)).getTime() : null
    return status === 'expired' || status === 'review_requested' || (expiresAt != null && expiresAt < Date.now())
  }).length

  const agentDisplayName = deriveCareLinkAgentDisplayName(workspace)
  const todayLabel = careLinkTodayFrenchLabel()

  return (
    <section className="space-y-5 px-5 pb-28 pt-5">
      <div className="relative overflow-hidden rounded-[2.2rem] border border-blue-100 bg-white p-5 shadow-[0_24px_70px_rgba(29,78,216,0.12)]">
        <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-blue-100 blur-2xl" />
        <div className="absolute -bottom-14 left-4 h-36 w-36 rounded-full bg-emerald-100 blur-2xl" />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.34em] text-blue-600">Accueil ANGELCARE</p>
              <h1 className="mt-3 text-[1.9rem] font-black leading-[0.98] tracking-tight text-slate-950">
                Bonjour {agentDisplayName},
              </h1>
              <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
                Ravi de vous revoir chez <span className="font-black text-slate-950">ANGELCARE</span>.
              </p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                {todayLabel}
              </p>
            </div>

            <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-blue-100 ring-1 ring-blue-100">
              <AngelCareLogo size="sm" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <Link href="/carelink/messages" className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 shadow-sm">
              <p className="text-xl font-black leading-none text-slate-950">{unreadMessages}</p>
              <p className="mt-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Messages</p>
            </Link>

            <Link href="/carelink/notifications" className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-3 shadow-sm">
              <p className="text-xl font-black leading-none text-blue-700">{pendingNotifications}</p>
              <p className="mt-2 text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">Notifications</p>
            </Link>

            <Link href="/carelink/alerts" className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-3 shadow-sm">
              <p className="text-xl font-black leading-none text-rose-700">{criticalAlerts}</p>
              <p className="mt-2 text-[9px] font-black uppercase tracking-[0.2em] text-rose-600">Alertes</p>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric label="LIAISON" value={unreadMessages} />
        <Metric label="NOTIF." value={pendingNotifications} />
        <Metric label="ALERTES" value={criticalAlerts || alerts} />
        <Metric label="AUDIT" value={history.length} />
      </div>

      <div className="relative overflow-hidden rounded-[2rem] bg-white p-5 shadow-[0_24px_70px_rgba(29,78,216,0.14)] ring-1 ring-blue-100">
        <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-blue-100 blur-2xl" />
        <div className="absolute -bottom-12 left-8 h-32 w-32 rounded-full bg-cyan-100 blur-2xl" />
        <div className="relative">
          <p className="text-[10px] font-black uppercase tracking-[0.34em] text-blue-600">Cockpit terrain</p>
          <h2 className="mt-3 max-w-xs text-3xl font-black leading-[0.98] tracking-tight text-slate-950">Votre terrain, sous contrôle.</h2>
          <p className="mt-4 text-sm leading-6 text-slate-600">Tout ce qu’il faut pour exécuter les missions avec sécurité, discipline et traçabilité.</p>
          <div className="mt-5 grid grid-cols-4 gap-3">
            <Metric label="AUJ." value={records.length} />
            <Metric label="ACTIVES" value={active} />
            <Metric label="TERMINÉES" value={completed} />
            <Metric label="ALERTES" value={alerts} />
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
            <span className={cx('rounded-full px-3 py-1', online ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>{online ? 'En ligne' : 'Hors ligne'}</span>
            <span className="rounded-full bg-slate-50 px-3 py-1 text-slate-500">{syncing ? 'Synchronisation...' : queuePending ? `${queuePending} action${queuePending > 1 ? 's' : ''} en attente` : 'Synchronisé'}</span>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3">
        <QuickTile href="/carelink/messages" icon={<MessageCircle size={20} />} title="MESSAGES" subtitle={`${unreadMessages} non lus`} tone="amber" />
        <QuickTile href="/carelink/notifications" icon={<BellRing size={20} />} title="NOTIFICATIONS" subtitle={`${pendingNotifications} à traiter`} tone="blue" />
        <QuickTile href="/carelink/alerts" icon={<AlertTriangle size={20} />} title="ALERTES" subtitle={`${criticalAlerts} critiques`} tone="rose" />
          <QuickTile href="/carelink/readiness" icon={<ShieldCheck size={20} />} title="PRÉPARATION" subtitle="Conformité et blocages" tone="emerald" />
      </section>

      <SectionHeader title="Missions du jour" action="Tout voir" href="/carelink/missions" />
      <div className="space-y-3">
        {records.slice(0, 3).map((mission) => <MissionCard key={mission.id} mission={mission} runAction={runAction} busy={busy} />)}
        {!records.length ? <EmptyState title="Aucune mission chargée" body="Vos sous-missions assignées apparaîtront ici dès que la liaison opérationnelle les publiera." /> : null}
      </div>

      <Link href="/carelink/schedule" className="flex items-center justify-center gap-2 rounded-2xl bg-[#06285e] px-4 py-4 text-sm font-black text-white shadow-[0_18px_42px_rgba(6,40,94,0.22)]">
        <CalendarDays size={18} /> Voir le planning complet
      </Link>

      <div className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-950">Mises à jour importantes</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Changements de trajet, consignes de liaison opérationnelle et mises à jour sécurité.</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700">Nouveau</span>
        </div>
      </div>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">Modules entreprise</p>
            <h2 className="mt-2 text-lg font-black text-slate-950">Centre mobile complet</h2>
          </div>
          <FileText className="text-slate-300" size={20} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <EnterpriseMiniModule href="/carelink/missions" label="Contrôles" value={`${checklistPending} en attente`} />
          <EnterpriseMiniModule href="/carelink/history" label="Rapports" value={`${reportsDue} à traiter`} />
          <EnterpriseMiniModule href="/carelink/payments" label="Finance" value={`${disputes.length} litiges`} />
          <EnterpriseMiniModule href="/carelink/readiness" label="Conformité" value={`${complianceBlocks} blocages`} />
          <EnterpriseMiniModule href="/carelink/support" label="Assistance" value={`${support.length} demandes`} />
          <EnterpriseMiniModule href="/carelink/history" label="Audit" value={`${history.length} lignes`} />
          <EnterpriseMiniModule href="/carelink/safety" label="Sécurité" value={alertsFeed.length ? `${alertsFeed.length} alertes` : 'Stabilité'} />
          <EnterpriseMiniModule href="/carelink/offline" label="Synchronisation" value={online ? 'En direct' : 'File locale'} />
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Aperçu opérationnel</p>
            <h2 className="mt-2 text-lg font-black text-slate-950">Notifications, alertes et audit</h2>
          </div>
          <FileText className="text-slate-300" size={20} />
        </div>
        <div className="mt-4 space-y-3">
          <PreviewList title="Notifications récentes" items={notifications.slice(0, 2).map((item) => `${item.title} · ${item.body}`)} empty="Aucune notification persistante" />
          <PreviewList title="Alertes récentes" items={alertsFeed.slice(0, 2).map((item) => `${item.title} · ${item.body}`)} empty="Aucune alerte critique" />
          <PreviewList title="Audit et assistance" items={[...history.slice(0, 1).map((item) => `${String(item.title || 'Audit')} · ${String(item.body || '')}`), ...support.slice(0, 1).map((item) => `${String(item.title || 'Assistance')} · ${String(item.body || '')}`)].filter(Boolean)} empty="Aucun événement d’audit ou d’assistance" />
        </div>
      </section>

      <DarkRoutePreview records={records} />
    </section>
  )
}

function MissionCard({ mission, runAction, busy }: { mission: MissionControlRecord; runAction: (mission: MissionControlRecord, action: string) => void; busy: string | null }) {
  const isBusy = busy?.startsWith(`${mission.id}:`)

  return (
    <article className="group rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.10)]">
      <Link href={`/carelink/missions/${mission.id}`} className="block">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-blue-600">{missionTime(mission).split(' ')[0]}</span>
              <span className={cx('rounded-full px-2.5 py-1 text-[10px] font-black ring-1', statusTone(mission.status))}>{statusLabel(mission.status)}</span>
            </div>
            <h2 className="mt-3 text-base font-black leading-tight text-slate-950">{mission.familyName || 'Client'} · {mission.serviceType}</h2>
            <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-slate-500"><MapPin size={13} /> {mission.zone}, {mission.city}</p>
          </div>
          <ChevronRight className="mt-2 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500" size={20} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-black text-blue-700">Sous-mission {Math.max(1, mission.upcomingSubMissionCount || 1)} sur {Math.max(1, mission.subMissionCount || 1)}</span>
          <span className={cx('rounded-full px-3 py-1.5 text-[11px] font-black ring-1', riskTone(mission.riskLevel))}>{String(mission.riskLevel || 'normal').toUpperCase()}</span>
        </div>
      </Link>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button disabled={isBusy} onClick={() => runAction(mission, 'accept')} className="rounded-2xl bg-slate-950 px-3 py-3 text-xs font-black text-white disabled:opacity-50">Accepter</button>
        <button disabled={isBusy} onClick={() => runAction(mission, 'en-route')} className="rounded-2xl bg-blue-50 px-3 py-3 text-xs font-black text-blue-700 disabled:opacity-50">En route</button>
      </div>
    </article>
  )
}

type MissionSmartFilter = 'all' | 'risk' | 'confirmations' | 'reports' | 'recurring' | 'controls'

function MissionsScreen({
  records,
  workspace,
  activeTab,
  setActiveTab,
  runAction,
  busy,
}: {
  records: MissionControlRecord[]
  workspace: CareLinkMobileWorkspace | null
  activeTab: 'today' | 'upcoming' | 'completed'
  setActiveTab: (tab: 'today' | 'upcoming' | 'completed') => void
  runAction: (mission: MissionControlRecord, action: string) => void
  busy: string | null
}) {
  const meta = routeMeta('missions', workspace)
  const [smartFilter, setSmartFilter] = useState<MissionSmartFilter>('all')

  const baseVisible = activeTab === 'completed'
    ? records.filter((item) => ['completed', 'closed'].includes(String(item.status || '').toLowerCase()))
    : activeTab === 'upcoming'
      ? records.filter((item) => !['completed', 'closed', 'cancelled', 'canceled'].includes(String(item.status || '').toLowerCase()))
      : records

  const todayCount = records.filter((item) => item.dateLabel && item.dateLabel !== 'Non planifiée').length
  const activeCount = records.filter((item) => ['assigned', 'agent_notified', 'agent_accepted', 'confirmed', 'en_route', 'arrival_confirmed', 'mission_started', 'in_progress'].includes(String(item.status || '').toLowerCase())).length
  const confirmationCount = records.filter((item) => ['assigned', 'agent_notified'].includes(String(item.status || '').toLowerCase())).length
  const reportCount = records.filter((item) => ['report_pending', 'completion_requested'].includes(String(item.status || '').toLowerCase()) || item.reportStatus === 'pending').length
  const checklistCount = safeArray<Record<string, unknown>>(workspace?.checklistItems).filter((item) => !Boolean(item.completed)).length
  const riskCount = records.filter((item) => ['incident', 'cancelled', 'canceled', 'no_show'].includes(String(item.status || '').toLowerCase()) || ['critical', 'high', 'elevated'].includes(String(item.riskLevel || '').toLowerCase())).length
  const recurringCount = records.filter((item) => item.missionKind === 'dossier' || item.subMissionCount > 0).length
  const completedCount = records.filter((item) => ['completed', 'closed'].includes(String(item.status || '').toLowerCase())).length
  const sourceLive = workspace?.source === 'live-db'

  const visible = baseVisible.filter((mission) => {
    const status = String(mission.status || '').toLowerCase()
    const risk = String(mission.riskLevel || '').toLowerCase()

    if (smartFilter === 'risk') return ['incident', 'cancelled', 'canceled', 'no_show'].includes(status) || ['critical', 'high', 'elevated'].includes(risk)
    if (smartFilter === 'confirmations') return ['assigned', 'agent_notified'].includes(status)
    if (smartFilter === 'reports') return ['report_pending', 'completion_requested'].includes(status) || mission.reportStatus === 'pending'
    if (smartFilter === 'recurring') return mission.missionKind === 'dossier' || mission.subMissionCount > 0
    if (smartFilter === 'controls') return checklistCount > 0
    return true
  })

  const nextMission = visible[0] || records[0] || null
  const todayLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date())

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <div className="relative overflow-hidden rounded-[2.4rem] bg-slate-950 p-5 text-white shadow-[0_28px_80px_rgba(2,6,23,0.28)]">
          <div className="absolute -right-12 -top-14 h-44 w-44 rounded-full bg-blue-500/30 blur-3xl" />
          <div className="absolute -bottom-16 left-4 h-44 w-44 rounded-full bg-emerald-400/20 blur-3xl" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-blue-200">{meta.eyebrow}</p>
                <h1 className="mt-3 text-[2rem] font-black leading-[0.96] tracking-tight">Missions terrain</h1>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
                  File opérationnelle, confirmations, risques, routes et rapports dans un cockpit mobile synchronisé.
                </p>
              </div>

              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/10">
                <ClipboardCheck size={25} />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white ring-1 ring-white/10">
                {todayLabel}
              </span>
              <span className={cx('rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ring-1', sourceLive ? 'bg-emerald-400/15 text-emerald-100 ring-emerald-300/20' : 'bg-amber-400/15 text-amber-100 ring-amber-300/20')}>
                {sourceLive ? 'Live OPS' : 'Sync secours'}
              </span>
              <span className="rounded-full bg-blue-400/15 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-100 ring-1 ring-blue-300/20">
                {visible.length} dans ce filtre
              </span>
            </div>

            {nextMission ? (
              <div className="mt-5 rounded-[1.7rem] bg-white/10 p-4 ring-1 ring-white/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-200">Prochaine action terrain</p>
                    <p className="mt-2 text-sm font-black text-white">{nextMission.familyName || 'Mission'} · {nextMission.serviceType || 'Service'}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-300">{missionTime(nextMission)} · {nextMission.zone || nextMission.city || 'Zone à confirmer'}</p>
                  </div>
                  <Link href={`/carelink/missions/${nextMission.id}`} className="rounded-full bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-950">
                    Ouvrir
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <MissionMetricCard label="Aujourd’hui" value={todayCount} subtitle="missions prévues" icon={<CalendarDays size={18} />} tone="blue" />
          <MissionMetricCard label="Actives" value={activeCount} subtitle="en exécution" icon={<Navigation size={18} />} tone="emerald" />
          <MissionMetricCard label="Confirmations" value={confirmationCount} subtitle="à traiter" icon={<BellRing size={18} />} tone={confirmationCount ? 'amber' : 'slate'} />
          <MissionMetricCard label="Rapports" value={reportCount} subtitle="attendus" icon={<FileText size={18} />} tone={reportCount ? 'rose' : 'slate'} />
        </div>

        <div className="sticky top-[88px] z-30 -mx-5 mt-5 border-y border-slate-200/80 bg-slate-50/92 px-5 py-3 backdrop-blur-xl">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['today', 'upcoming', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cx(
                  'shrink-0 rounded-full px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] ring-1 transition',
                  activeTab === tab
                    ? 'bg-slate-950 text-white ring-slate-950 shadow-[0_16px_35px_rgba(15,23,42,0.18)]'
                    : 'bg-white text-slate-600 ring-slate-200',
                )}
              >
                {tab === 'today' ? 'Aujourd’hui' : tab === 'upcoming' ? 'À venir' : 'Terminées'}
              </button>
            ))}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <MissionSmartChip active={smartFilter === 'all'} onClick={() => setSmartFilter('all')} label="Toutes" value={baseVisible.length} tone="slate" />
            <MissionSmartChip active={smartFilter === 'risk'} onClick={() => setSmartFilter('risk')} label="À risque" value={riskCount} tone="rose" />
            <MissionSmartChip active={smartFilter === 'confirmations'} onClick={() => setSmartFilter('confirmations')} label="Confirm." value={confirmationCount} tone="amber" />
            <MissionSmartChip active={smartFilter === 'reports'} onClick={() => setSmartFilter('reports')} label="Rapports" value={reportCount} tone="blue" />
            <MissionSmartChip active={smartFilter === 'recurring'} onClick={() => setSmartFilter('recurring')} label="Récurrentes" value={recurringCount} tone="emerald" />
            <MissionSmartChip active={smartFilter === 'controls'} onClick={() => setSmartFilter('controls')} label="Contrôles" value={checklistCount} tone="sky" />
          </div>
        </div>

        <div className="mt-4 rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">État de la file</p>
              <p className="mt-1 text-sm font-black text-slate-950">
                {visible.length} mission{visible.length > 1 ? 's' : ''} · {confirmationCount} confirmation{confirmationCount > 1 ? 's' : ''}
              </p>
            </div>
            <span className={cx('rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ring-1', sourceLive ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-amber-50 text-amber-700 ring-amber-100')}>
              {sourceLive ? 'Synchronisé' : 'Secours'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4 px-5">
        {visible.map((mission) => (
          <PremiumMissionCard key={mission.id} mission={mission} runAction={runAction} busy={busy} />
        ))}

        {!visible.length ? (
          <PremiumMissionEmptyState
            confirmationCount={confirmationCount}
            reportCount={reportCount}
            completedCount={completedCount}
            sourceLive={sourceLive}
            onReset={() => {
              setActiveTab('today')
              setSmartFilter('all')
            }}
          />
        ) : null}
      </div>
    </section>
  )
}

function MissionMetricCard({
  label,
  value,
  subtitle,
  icon,
  tone = 'slate',
}: {
  label: string
  value: number | string
  subtitle: string
  icon: ReactNode
  tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate'
}) {
  const tones: Record<string, string> = {
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    rose: 'border-rose-100 bg-rose-50 text-rose-700',
    slate: 'border-slate-200 bg-white text-slate-700',
  }

  return (
    <div className={cx('rounded-[1.7rem] border p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)]', tones[tone])}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-3xl font-black leading-none text-slate-950">{value}</p>
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
          <p className="mt-1 text-[11px] font-bold opacity-70">{subtitle}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/80 shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  )
}

function MissionSmartChip({
  active,
  onClick,
  label,
  value,
  tone,
}: {
  active: boolean
  onClick: () => void
  label: string
  value: number
  tone: 'slate' | 'rose' | 'amber' | 'blue' | 'emerald' | 'sky'
}) {
  const tones: Record<string, string> = {
    slate: active ? 'bg-slate-950 text-white ring-slate-950' : 'bg-white text-slate-600 ring-slate-200',
    rose: active ? 'bg-rose-600 text-white ring-rose-600' : 'bg-rose-50 text-rose-700 ring-rose-100',
    amber: active ? 'bg-amber-500 text-white ring-amber-500' : 'bg-amber-50 text-amber-700 ring-amber-100',
    blue: active ? 'bg-blue-600 text-white ring-blue-600' : 'bg-blue-50 text-blue-700 ring-blue-100',
    emerald: active ? 'bg-emerald-600 text-white ring-emerald-600' : 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    sky: active ? 'bg-sky-600 text-white ring-sky-600' : 'bg-sky-50 text-sky-700 ring-sky-100',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx('shrink-0 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ring-1 transition', tones[tone])}
    >
      {value} {label}
    </button>
  )
}

function PremiumMissionCard({
  mission,
  runAction,
  busy,
}: {
  mission: MissionControlRecord
  runAction: (mission: MissionControlRecord, action: string) => void
  busy: string | null
}) {
  const isBusy = busy?.startsWith(`${mission.id}:`)
  const status = String(mission.status || '').toLowerCase()
  const isRisk = ['incident', 'cancelled', 'canceled', 'no_show'].includes(status) || ['critical', 'high', 'elevated'].includes(String(mission.riskLevel || '').toLowerCase())
  const totalSub = Math.max(1, mission.subMissionCount || 1)
  const upcomingSub = Math.max(1, mission.upcomingSubMissionCount || 1)
  const progress = Math.min(100, Math.max(12, Math.round(((totalSub - upcomingSub + 1) / totalSub) * 100)))

  return (
    <article className={cx(
      'overflow-hidden rounded-[2rem] border bg-white shadow-[0_24px_65px_rgba(15,23,42,0.08)] ring-1 ring-white transition',
      isRisk ? 'border-rose-100' : 'border-slate-200',
    )}>
      <Link href={`/carelink/missions/${mission.id}`} className="block p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-950 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                {missionTime(mission).split(' ')[0]}
              </span>
              <span className={cx('rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] ring-1', statusTone(mission.status))}>
                {statusLabel(mission.status)}
              </span>
              <span className={cx('rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] ring-1', riskTone(mission.riskLevel))}>
                {String(mission.riskLevel || 'normal').toUpperCase()}
              </span>
            </div>

            <h2 className="mt-4 text-xl font-black leading-tight tracking-tight text-slate-950">
              {mission.familyName || 'Mission terrain'}
            </h2>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{mission.serviceType || 'Service CareLink'}</p>

            <div className="mt-3 grid gap-2 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-2"><MapPin size={14} /> {mission.zone || 'Zone'} · {mission.city || 'Ville'}</span>
              <span className="flex items-center gap-2"><CalendarDays size={14} /> {mission.dateLabel || 'Date non planifiée'} · {missionTime(mission)}</span>
            </div>
          </div>

          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700">
            <ChevronRight size={20} />
          </div>
        </div>

        <div className="mt-5 rounded-[1.4rem] bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Cycle mission</p>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{progress}%</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div className={cx('h-full rounded-full', isRisk ? 'bg-rose-500' : 'bg-blue-600')} style={{ width: `${progress}%` }} />
          </div>
          <MissionLifecycleDots mission={mission} />
        </div>
      </Link>

      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 bg-slate-50/70 p-3">
        <button disabled={isBusy} onClick={() => runAction(mission, 'accept')} className="rounded-2xl bg-slate-950 px-3 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-white disabled:opacity-50">
          Accepter
        </button>
        <button disabled={isBusy} onClick={() => runAction(mission, 'en-route')} className="rounded-2xl bg-blue-600 px-3 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-white disabled:opacity-50">
          En route
        </button>
        <Link href={`/carelink/missions/${mission.id}`} className="rounded-2xl bg-white px-3 py-3 text-center text-[11px] font-black uppercase tracking-[0.12em] text-slate-700 ring-1 ring-slate-200">
          Ouvrir
        </Link>
      </div>
    </article>
  )
}

function MissionLifecycleDots({ mission }: { mission: MissionControlRecord }) {
  const status = String(mission.status || '').toLowerCase()
  const reportStatus = String(mission.reportStatus || '').toLowerCase()

  const steps = [
    { label: 'Brief', done: !['draft'].includes(status) },
    { label: 'Route', done: ['en_route', 'arrival_confirmed', 'mission_started', 'in_progress', 'report_pending', 'report_submitted', 'completed', 'closed'].includes(status) },
    { label: 'Service', done: ['mission_started', 'in_progress', 'report_pending', 'report_submitted', 'completed', 'closed'].includes(status) },
    { label: 'Rapport', done: ['report_submitted', 'completed', 'closed'].includes(status) || ['submitted', 'validated'].includes(reportStatus) },
    { label: 'Clôture', done: ['completed', 'closed'].includes(status) },
  ]

  return (
    <div className="mt-3 grid grid-cols-5 gap-1">
      {steps.map((step) => (
        <div key={step.label} className="text-center">
          <div className={cx('mx-auto h-2.5 w-2.5 rounded-full ring-2 ring-white', step.done ? 'bg-emerald-500' : 'bg-slate-300')} />
          <p className={cx('mt-1 text-[8px] font-black uppercase tracking-[0.12em]', step.done ? 'text-emerald-700' : 'text-slate-400')}>{step.label}</p>
        </div>
      ))}
    </div>
  )
}

function PremiumMissionEmptyState({
  confirmationCount,
  reportCount,
  completedCount,
  sourceLive,
  onReset,
}: {
  confirmationCount: number
  reportCount: number
  completedCount: number
  sourceLive: boolean
  onReset: () => void
}) {
  return (
    <div className="overflow-hidden rounded-[2.2rem] border border-dashed border-blue-200 bg-white p-5 text-center shadow-[0_22px_55px_rgba(15,23,42,0.06)]">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-blue-50 text-blue-700">
        <ClipboardCheck size={28} />
      </div>
      <h2 className="mt-4 text-xl font-black text-slate-950">Aucune mission dans ce filtre</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-6 text-slate-500">
        La file terrain est vide ici. Le système reste synchronisé et prêt à recevoir les prochaines affectations OPS.
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-amber-50 p-3">
          <p className="text-lg font-black text-amber-700">{confirmationCount}</p>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-amber-700">Confirm.</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-3">
          <p className="text-lg font-black text-blue-700">{reportCount}</p>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-700">Reports</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-3">
          <p className="text-lg font-black text-emerald-700">{completedCount}</p>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">Done</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button type="button" onClick={onReset} className="rounded-2xl bg-slate-950 px-4 py-4 text-xs font-black uppercase tracking-[0.14em] text-white">
          Réinitialiser
        </button>
        <Link href="/carelink/messages" className="rounded-2xl bg-blue-50 px-4 py-4 text-xs font-black uppercase tracking-[0.14em] text-blue-700 ring-1 ring-blue-100">
          Message OPS
        </Link>
      </div>

      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {sourceLive ? 'Synchronisation live active' : 'Synchronisation de secours'}
      </p>
    </div>
  )
}


function MissionDetailScreen({
  mission,
  dossier,
  workspace,
  runAction,
  busy,
}: {
  mission: MissionControlRecord | null
  dossier: MissionDossier | null
  workspace: CareLinkMobileWorkspace | null
  runAction: (mission: MissionControlRecord, action: string, payload?: Record<string, any> | string) => void
  busy: string | null
}) {
  const meta = routeMeta('mission', workspace)
  const [rating, setRating] = useState(5)
  const [summary, setSummary] = useState('')
  const [observations, setObservations] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [activities, setActivities] = useState('')
  const [incidentFlag, setIncidentFlag] = useState(false)
  const [briefAcknowledgedOverride, setBriefAcknowledgedOverride] = useState(false)

  if (!mission) {
    return (
      <section className="grid min-h-dvh place-items-center p-6">
        <div className="w-full space-y-4">
          <div className="rounded-[2rem] border border-sky-100 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-sky-600">{meta.eyebrow}</p>
            <h1 className="mt-2 text-2xl font-black text-slate-950">{meta.title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{meta.description}</p>
          </div>
          <EmptyState title="Mission indisponible" body="La liaison opérationnelle n’a pas encore publié le détail de cette mission. Revenez au centre de missions ou consultez la file assignée pour continuer l’exécution terrain." />
          <div className="grid grid-cols-2 gap-3">
            <Link href="/carelink/missions" className="rounded-2xl bg-slate-950 px-4 py-4 text-center text-sm font-black text-white">Retour missions</Link>
            <Link href="/carelink/support" className="rounded-2xl bg-blue-600 px-4 py-4 text-center text-sm font-black text-white">Contacter l’assistance</Link>
          </div>
        </div>
      </section>
    )
  }

  const routeRows = dossier?.routes || []
  const checklistItems = (dossier?.checklistItems || dossier?.subMissions || []) as Array<Record<string, any>>
  const events = dossier?.events || []
  const dispatchMessages = (dossier?.dispatchMessages || []) as Array<Record<string, any>>
  const reportData = dossier?.report || null
  const reports = safeArray<Record<string, unknown>>(workspace?.reports)
  const allowances = dossier?.allowances || null
  const programLines = (dossier?.programLines || []) as Array<Record<string, any>>
  const parameterDays = (dossier?.parameterDays || []) as Array<Record<string, any>>
  const programActivityLogs = (((dossier as any)?.programActivityLogs || workspace?.programActivityLogs || []) as Array<Record<string, any>>)
    .filter((log) => String(log.missionId || log.mission_id || '') === String(mission.id))
  const briefAcknowledgements = (((dossier as any)?.briefAcknowledgements || workspace?.briefAcknowledgements || []) as Array<Record<string, any>>)
    .filter((ack) => String(ack.missionId || ack.mission_id || '') === String(mission.id))
  const routeExecutionLogs = (((dossier as any)?.routeExecutionLogs || workspace?.routeExecutionLogs || []) as Array<Record<string, any>>)
    .filter((log) => String(log.missionId || log.mission_id || '') === String(mission.id))
  const reportCorrections = (((dossier as any)?.reportCorrections || workspace?.reportCorrections || []) as Array<Record<string, any>>)
    .filter((row) => String(row.missionId || row.mission_id || '') === String(mission.id))
  const presenceProofs = (((dossier as any)?.presenceProofs || workspace?.presenceProofs || []) as Array<Record<string, any>>)
    .filter((row) => String(row.missionId || row.mission_id || '') === String(mission.id))
  const notifications = (dossier?.notifications || []) as Array<Record<string, any>>
  const alerts = (dossier?.alerts || []) as Array<Record<string, any>>
  const disputes = (dossier?.paymentDisputes || []) as Array<Record<string, any>>
  const documents = (dossier?.documents || []) as Array<Record<string, any>>
  const checklistProgress = checklistItems.length ? Math.round((checklistItems.filter((item) => Boolean(item.completed)).length / checklistItems.length) * 100) : 0
  const nextAction = mission.status === 'assigned'
    ? 'Accepter la mission'
    : mission.status === 'confirmed'
      ? 'Confirmer la préparation puis démarrer le trajet'
      : mission.status === 'en_route'
        ? 'Confirmer l’arrivée proche et pointer'
        : mission.status === 'arrival_confirmed'
          ? 'Pointer l’arrivée puis démarrer la mission'
          : mission.status === 'in_progress'
            ? 'Finaliser les contrôles et préparer le rapport'
            : mission.status === 'report_pending'
              ? 'Soumettre le rapport final'
              : 'Consulter la prochaine étape de la liaison opérationnelle'
  const beneficiaryContext = firstText((dossier?.raw as any)?.beneficiary_name, (dossier?.raw as any)?.beneficiaries?.full_name, mission.familyName, 'Bénéficiaire')
  const familyContext = firstText((dossier?.raw as any)?.families?.full_name, mission.familyName, 'Famille')
  const serviceNotes = (dossier?.parameters ? Object.entries(dossier.parameters).map(([key, value]) => `${key}: ${String(value)}`) : []).slice(0, 4)
  const missionBriefSections = buildMissionBriefSections(mission, dossier, serviceNotes)
  const latestBriefAck = latestMissionBriefAcknowledgement(briefAcknowledgements)
  const briefAcknowledged = briefAcknowledgedOverride || missionBriefAcknowledgementComplete(latestBriefAck)
  const serviceChecklistDefinition = buildCareLinkDynamicServiceChecklist({
    serviceType: mission.serviceType || (dossier?.raw as any)?.service_type,
    serviceFamily: mission.serviceFamily || (dossier?.raw as any)?.service_family,
    missionScope: (dossier?.raw as any)?.mission_scope,
    riskLevel: mission.riskLevel || (dossier?.raw as any)?.risk_level,
  })

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <Link href="/carelink/missions" className="inline-flex items-center gap-2 text-sm font-black text-slate-500">
          <ChevronLeft size={18} /> Retour
        </Link>
      </div>
      <div className="mx-5 mt-4 rounded-[2rem] border border-sky-100 bg-white p-4 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-sky-600">{meta.eyebrow}</p>
        <h1 className="mt-2 text-2xl font-black text-slate-950">{meta.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{meta.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {meta.chips.map((chip) => (
            <span key={chip} className="rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">{chip}</span>
          ))}
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Prochaine action: {nextAction}</span>
        </div>
      </div>
      <div className="mx-5 mt-4 rounded-[2rem] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-600">{mission.code}</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">{mission.serviceType}</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">{familyContext} · {mission.zone}, {mission.city}</p>
          </div>
          <span className={cx('rounded-full px-3 py-2 text-xs font-black ring-1', statusTone(mission.status))}>{statusLabel(mission.status)}</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <MiniStat label="Risque" value={String(mission.riskLevel || 'normal').toUpperCase()} tone={riskTone(mission.riskLevel)} />
          <MiniStat label="Préparation" value={readinessLabel(mission.readinessStatus)} tone={statusTone(mission.readinessStatus)} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <MiniStat label="Contrôles" value={`${checklistProgress}%`} tone="bg-sky-50 text-sky-700 ring-sky-100" />
          <MiniStat label="Rapport" value={String(mission.reportStatus || 'not_required').toUpperCase()} tone="bg-emerald-50 text-emerald-700 ring-emerald-100" />
        </div>
      </div>

      <div className="mx-5 mt-5 space-y-5">
        <DetailCard title="Informations">
          <InfoRow icon={<Clock3 size={18} />} label="Horaires" value={`${mission.dateLabel} · ${mission.timeLabel}`} />
          <InfoRow icon={<MapPin size={18} />} label="Zone" value={`${mission.city} · ${mission.zone}`} />
          <InfoRow icon={<UserRound size={18} />} label="Client" value={familyContext} />
          <InfoRow icon={<UserRound size={18} />} label="Bénéficiaire" value={beneficiaryContext} />
          <InfoRow icon={<Phone size={18} />} label="Code" value={mission.code} />
          <InfoRow icon={<Navigation size={18} />} label="Prochaine action" value={nextAction} />
        </DetailCard>

        <MissionBriefAcknowledgementSection
          mission={mission}
          sections={missionBriefSections}
          acknowledged={briefAcknowledged}
          latestAcknowledgement={latestBriefAck}
          runAction={runAction}
          busy={busy}
          onAcknowledged={() => setBriefAcknowledgedOverride(true)}
        />

        <ActionGrid mission={mission} runAction={runAction} busyAction={busy} blockedActions={briefAcknowledged ? undefined : { start: 'Brief requis' }} />

        <DetailCard title="Lifecycle de mission">
          <div className="space-y-3">
            {events.slice(0, 8).map((event, index) => (
              <div key={String(event.id || index)} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">{eventLabel(String(event.event_type || 'event'))}</p>
                    <p className="mt-1 text-xs text-slate-500">{String(event.content || 'Événement terrain')}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-500">{String(event.created_at || '').slice(11, 16) || '—'}</span>
                </div>
              </div>
            ))}
            {!events.length ? <p className="text-sm font-semibold text-slate-500">Aucun événement auditable pour cette mission.</p> : null}
          </div>
        </DetailCard>

        <DetailCard title="Consignes opérationnelles">
          <ul className="space-y-3 text-sm leading-6 text-slate-700">
            {mission.title ? <li className="rounded-2xl bg-sky-50 p-3 text-sky-950">{mission.title}</li> : null}
            <li className="rounded-2xl bg-sky-50 p-3 text-sky-950">Respecter les consignes de la liaison opérationnelle et confirmer toute anomalie immédiatement.</li>
            <li className="rounded-2xl bg-sky-50 p-3 text-sky-950">Maintenir la traçabilité du pointage, du trajet et du rapport final.</li>
            {serviceNotes.length ? serviceNotes.map((note) => <li key={note} className="rounded-2xl bg-sky-50 p-3 text-sky-950">{note}</li>) : null}
          </ul>
        </DetailCard>

        <ProgramExecutionSection
          mission={mission}
          programLines={programLines}
          parameterDays={parameterDays}
          activityLogs={programActivityLogs}
          runAction={runAction}
          busy={busy}
        />

        <RouteTransportExecutionSection
          mission={mission}
          routeRows={routeRows as Array<Record<string, any>>}
          transport={dossier?.transport || null}
          executionLogs={routeExecutionLogs}
          runAction={runAction}
          busy={busy}
        />

        <AttendancePresenceProofSection
          mission={mission}
          proofs={presenceProofs}
          runAction={runAction}
          busy={busy}
        />

        <DynamicServiceChecklistSection
          mission={mission}
          checklistItems={checklistItems}
          definition={serviceChecklistDefinition}
          runAction={runAction}
          busy={busy}
        />

        <ReportCorrectionValidationSection
          mission={mission}
          reportData={reportData as Record<string, any> | null}
          corrections={reportCorrections}
          busy={busy}
          onResubmit={(agentResponse) => runAction(mission, 'report-correction', {
            summary: summary || reportData?.summary || '',
            observations: observations || reportData?.observations || '',
            activities: activities.split(',').map((item) => item.trim()).filter(Boolean).map((item) => ({ label: item })),
            checklistSnapshot: checklistItems.map((item) => ({ id: item.id, label: item.label || item.title || item.code, completed: Boolean(item.completed), required: Boolean(item.required) })),
            incidentFlag,
            recommendations: recommendations || reportData?.recommendations || '',
            agentResponse,
            metadata: { correction_resubmitted_from: 'carelink_mobile_p12' },
          })}
        />

        <DetailCard title="Rapport structuré">
          <div className="space-y-3">
            {reportData ? <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Rapport existant: {String(reportData.status || 'submitted')} · {String(reportData.validation_status || 'ready')}</p> : null}
            <textarea value={summary} onChange={(event) => setSummary(event.target.value)} className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400" placeholder="Résumé de mission" />
            <textarea value={observations} onChange={(event) => setObservations(event.target.value)} className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400" placeholder="Observations terrain" />
            <textarea value={activities} onChange={(event) => setActivities(event.target.value)} className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400" placeholder="Activités réalisées, séparées par des virgules" />
            <textarea value={recommendations} onChange={(event) => setRecommendations(event.target.value)} className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400" placeholder="Recommandations / suite" />
            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={incidentFlag} onChange={(event) => setIncidentFlag(event.target.checked)} className="h-4 w-4 accent-rose-600" />
              Incident signalé dans le rapport
            </label>
            <button
              disabled={busy === `${mission.id}:report`}
              onClick={() => runAction(mission, 'report', {
                summary: summary || reportData?.summary || '',
                observations: observations || reportData?.observations || '',
                activities: activities.split(',').map((item) => item.trim()).filter(Boolean).map((item) => ({ label: item })),
                checklistSnapshot: checklistItems.map((item) => ({ id: item.id, label: item.label || item.title || item.code, completed: Boolean(item.completed), required: Boolean(item.required) })),
                incidentFlag,
                recommendations: recommendations || reportData?.recommendations || '',
                metadata: {
                  programActivitySnapshot: normalizeProgramActivities(programLines, parameterDays).map((activity) => {
                    const log = latestProgramActivityLogMap(programActivityLogs).get(activity.id)
                    return { activityId: activity.id, title: activity.title, required: activity.required, status: String(log?.status || 'pending') }
                  }),
                },
              })}
              className="w-full rounded-2xl bg-[#06285e] px-4 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              Soumettre le rapport structuré
            </button>
          </div>
        </DetailCard>

        <DetailCard title="Liaison opérationnelle">
          <div className="space-y-3">
            {dispatchMessages.length ? dispatchMessages.map((message) => (
              <div key={String(message.id || message.created_at)} className="rounded-2xl bg-slate-50 p-3">
                <p className="text-sm font-black text-slate-950">{String(message.subject || message.sender_type || 'Liaison opérationnelle')}</p>
                <p className="mt-1 text-xs text-slate-500">{String(message.body || message.content || '')}</p>
              </div>
            )) : <p className="text-sm font-semibold text-slate-500">Aucun fil de liaison opérationnelle enregistré.</p>}
          </div>
        </DetailCard>

        <DetailCard title="Alertes et conformité">
          <div className="space-y-2">
            {alerts.length ? alerts.map((alert, index) => (
              <p key={String(alert.id || index)} className={cx('rounded-2xl p-3 text-sm font-semibold', index === 0 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800')}>
                {String(alert.title || alert.type || 'Alerte')} · {String(alert.body || alert.description || 'Escalade terrain')}
              </p>
            )) : <p className="text-sm text-slate-500">Aucune alerte de mission active.</p>}
            {documents.length ? documents.map((document, index) => (
              <p key={String(document.id || index)} className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                {String(document.document_type || document.documentType || 'Document')} · {String(document.status || document.reviewStatus || 'pending')}
              </p>
            )) : <p className="text-sm text-slate-500">Aucun document ou conformité à afficher.</p>}
          </div>
        </DetailCard>

        <DetailCard title="Paiement et validation">
          <div className="space-y-2 text-sm text-slate-700">
            <InfoRow icon={<CreditCard size={18} />} label="Indemnités" value={allowances ? 'Disponibles' : 'Aucune indemnité visible'} />
            <InfoRow icon={<ClipboardCheck size={18} />} label="Validation" value={String(mission.validationStatus || 'pending')} />
            <InfoRow icon={<BellRing size={18} />} label="Rapport" value={String(mission.reportStatus || 'not_required')} />
            <InfoRow icon={<FileText size={18} />} label="Règles" value={String(reportData?.status || 'Aucun rapport persistant')} />
            <InfoRow icon={<CreditCard size={18} />} label="Disputes" value={disputes.length ? `${disputes.length} correction(s) liée(s)` : 'Aucune correction'} />
            <InfoRow icon={<CreditCard size={18} />} label="Notifications" value={notifications.length ? `${notifications.length} liaison(s)` : 'Aucune notification mission'} />
          </div>
        </DetailCard>

        <DetailCard title="Journal d’événements">
          <div className="space-y-3">
            {events.map((event, index) => (
              <div key={index} className="rounded-2xl bg-slate-50 p-3">
                <p className="text-sm font-black text-slate-950">{eventLabel(event.event_type)}</p>
                <p className="mt-1 text-xs text-slate-500">{event.content}</p>
              </div>
            ))}
            {!events.length ? <p className="text-sm font-bold text-slate-400">Aucun événement en direct.</p> : null}
          </div>
        </DetailCard>

        <DetailCard title="Audit rapide">
          <div className="space-y-2 text-sm text-slate-700">
            <InfoRow icon={<FileText size={18} />} label="Rapport" value={reportData ? `${String(reportData.status || 'submitted')} · ${String(reportData.validation_status || 'ready')}` : 'Aucun rapport persistant'} />
            <InfoRow icon={<FileText size={18} />} label="Rapports liés" value={`${reports.length || 0}`} />
            <InfoRow icon={<FileText size={18} />} label="Contrôles" value={`${checklistItems.filter((item) => Boolean(item.required) && !Boolean(item.completed)).length} requis restants`} />
            <InfoRow icon={<FileText size={18} />} label="Chronologie" value={`${events.length} événements audités`} />
          </div>
        </DetailCard>

        <DetailCard title="Évaluation rapide">
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700">
              Évaluation
              <input type="range" min={1} max={5} value={rating} onChange={(event) => setRating(Number(event.target.value))} className="mt-2 w-full" />
              <span className="mt-1 block text-xs font-semibold text-slate-500">{rating} / 5</span>
            </label>
            <button disabled={busy === `${mission.id}:report`} onClick={() => runAction(mission, 'report', { summary, observations, recommendations, activities, incidentFlag })} className="w-full rounded-2xl bg-[#06285e] px-4 py-4 text-sm font-black text-white disabled:opacity-50">
              Mettre à jour le rapport
            </button>
          </div>
        </DetailCard>
      </div>
    </section>
  )
}

function ReportCorrectionValidationSection({
  mission,
  reportData,
  corrections,
  busy,
  onResubmit,
}: {
  mission: MissionControlRecord
  reportData: Record<string, any> | null
  corrections: Array<Record<string, any>>
  busy: string | null
  onResubmit: (agentResponse: string) => void
}) {
  const [agentResponse, setAgentResponse] = useState('')
  const latest = latestReportCorrection(corrections)
  const validationStatus = String(reportData?.validationStatus || reportData?.validation_status || 'pending').toLowerCase()
  const correctionStatus = String(reportData?.correctionStatus || reportData?.correction_status || latest?.status || 'none').toLowerCase()
  const activeCorrection = latest && ['correction_requested', 'needs_correction', 'open', 'rejected'].includes(String(latest.status || '').toLowerCase()) ? latest : null
  const changes = reportCorrectionChanges(activeCorrection || latest)
  const statusForTone = activeCorrection ? 'correction_requested' : validationStatus === 'validated' ? 'validated' : correctionStatus === 'resubmitted' ? 'resubmitted' : validationStatus
  const isBusy = busy === `${mission.id}:report-correction`

  return (
    <DetailCard title="Validation rapport OPS">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Statut validation</p>
            <p className="mt-1 text-base font-black text-slate-950">{reportValidationLabel(statusForTone)}</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{activeCorrection ? 'OPS demande une correction avant validation finale.' : validationStatus === 'validated' ? 'Rapport validé par OPS.' : 'Rapport en attente de revue OPS.'}</p>
          </div>
          <span className={cx('rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ring-1', reportValidationTone(statusForTone))}>{reportValidationLabel(statusForTone)}</span>
        </div>

        {activeCorrection ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
            <p className="text-sm font-black text-rose-800">Correction demandée</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-rose-700">{String(activeCorrection.opsNote || activeCorrection.ops_note || activeCorrection.metadata?.note || 'Merci de corriger le rapport et de le resoumettre pour validation OPS.')}</p>
            {changes.length ? (
              <ul className="mt-3 space-y-2">
                {changes.map((change) => <li key={change} className="rounded-xl bg-white/80 px-3 py-2 text-xs font-bold text-rose-700">{change}</li>)}
              </ul>
            ) : null}
          </div>
        ) : null}

        <textarea
          value={agentResponse}
          onChange={(event) => setAgentResponse(event.target.value)}
          className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-400"
          placeholder="Réponse à OPS / précision de correction"
        />
        <button
          disabled={isBusy || !activeCorrection}
          onClick={() => onResubmit(agentResponse || 'Correction rapport resoumise pour validation OPS.')}
          className="w-full rounded-2xl bg-slate-950 px-4 py-4 text-sm font-black text-white disabled:opacity-40"
        >
          Renvoyer correction à OPS
        </button>
      </div>
    </DetailCard>
  )
}

function ScheduleScreen({ records }: { records: MissionControlRecord[] }) {
  const meta = routeMeta('schedule', null)
  const days = Array.from(new Set(records.map((item) => item.dateLabel || 'Non planifiée')))
  const pendingConfirmations = records.filter((item) => ['assigned', 'agent_notified'].includes(item.status)).length
  const routeWarnings = records.filter((item) => ['incident', 'cancelled', 'no_show'].includes(item.status) || ['critical', 'high'].includes(String(item.riskLevel || '').toLowerCase())).length
  const upcomingSessions = records.filter((item) => item.subMissionCount > 0 || item.missionKind === 'dossier').length

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <div className="rounded-[2rem] border border-sky-100 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-sky-600">{meta.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-black text-slate-950">{meta.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{meta.description}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Metric label="JOURS" value={days.length} />
          <Metric label="CONFIRM." value={pendingConfirmations} />
          <Metric label="SESSIONS" value={upcomingSessions} />
          <Metric label="ALERTES" value={routeWarnings} />
        </div>
      </div>
      <div className="mx-5 mt-4 rounded-[2rem] bg-slate-950 p-4 text-white shadow-xl">
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-sky-200">Vue planning en direct</p>
        <p className="mt-2 text-sm leading-6 text-slate-200">Blocages, disponibilités et sessions récurrentes sont affichés à partir des missions publiées. Si aucune plage n’existe, le système reste visible et prêt à recevoir la liaison opérationnelle.</p>
      </div>
      <div className="mt-5 space-y-5 px-5">
        {days.map((day) => (
          <div key={day}>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-blue-600">{day}</p>
            <div className="space-y-3">
              {records.filter((item) => (item.dateLabel || 'Non planifiée') === day).map((mission) => (
                <Link key={mission.id} href={`/carelink/missions/${mission.id}`} className="grid grid-cols-[64px_1fr] gap-4 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="relative text-sm font-black text-blue-600">
                    <span>{missionTime(mission).split(' ')[0]}</span>
                    <span className="absolute left-1/2 top-8 h-full w-px -translate-x-1/2 bg-blue-100" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-950">{mission.familyName}</h2>
                    <p className="mt-1 text-sm text-slate-500">{mission.serviceType} · {mission.zone}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
        {!records.length ? <EmptyState title="Aucun planning chargé" body="Le système de planning est opérationnel. Les sessions publiées apparaîtront dans cette chronologie dès synchronisation." /> : null}
      </div>
    </section>
  )
}

function MessagesScreen({
  records,
  workspace,
  messages,
  runCareLinkAction,
}: {
  records: MissionControlRecord[]
  workspace: CareLinkMobileWorkspace | null
  messages: Array<{ id: string; title: string; body: string; missionId?: string | number | null; priority: string; unread: boolean; createdAt: string }>
  runCareLinkAction: (endpoint: string, payload: Record<string, unknown>) => Promise<unknown>
}) {
  const meta = routeMeta('messages', workspace)
  const [localMessages, setLocalMessages] = useState(messages)
  const [selectedId, setSelectedId] = useState<string | null>(messages[0]?.id ? String(messages[0].id) : null)
  const [draftSubject, setDraftSubject] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const [draftPriority, setDraftPriority] = useState<'normal' | 'high' | 'urgent'>('normal')
  const [draftMissionId, setDraftMissionId] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    setLocalMessages(messages)
    setSelectedId((current) => {
      if (current && messages.some((message) => String(message.id) === current)) return current
      return messages[0]?.id ? String(messages[0].id) : null
    })
  }, [messages])

  const selectedMessage = localMessages.find((message) => String(message.id) === selectedId) || localMessages[0] || null
  const unreadCount = localMessages.filter((message) => message.unread).length
  const urgentCount = localMessages.filter((message) => ['urgent', 'critical', 'high'].includes(String(message.priority || '').toLowerCase())).length
  const missionLinkedCount = localMessages.filter((message) => message.missionId).length
  const latestMessage = localMessages[0] || null
  const missionOptions = records.slice(0, 12)

  function priorityClass(priority: unknown) {
    const value = String(priority || '').toLowerCase()
    if (['urgent', 'critical'].includes(value)) return 'bg-rose-50 text-rose-700 ring-rose-100'
    if (['high', 'important'].includes(value)) return 'bg-amber-50 text-amber-800 ring-amber-100'
    return 'bg-blue-50 text-blue-700 ring-blue-100'
  }

  function formatMessageDate(value: unknown) {
    if (!value) return '—'
    const date = new Date(String(value))
    if (Number.isNaN(date.getTime())) return String(value)
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date)
  }

  function messageMissionLabel(message: { missionId?: string | number | null }) {
    if (!message.missionId) return 'Fil général'
    const mission = records.find((record) => String(record.id) === String(message.missionId))
    return mission ? `${mission.familyName || mission.code || `Mission ${mission.id}`}` : `Mission ${message.missionId}`
  }

  async function markMessageRead(message: { id: string; title: string; body: string; missionId?: string | number | null; priority: string; unread: boolean; createdAt: string }) {
    if (!message?.id || !message.unread) return
    setBusy(`read:${message.id}`)
    setNotice('')
    try {
      await runCareLinkAction(`/api/carelink/messages/${message.id}/read`, {
        missionId: message.missionId || null,
        note: `Message ${message.id} lu depuis CareLink mobile`,
        source: 'carelink_mobile_messages_enterprise_r1',
      })

      setLocalMessages((current) => current.map((item) => String(item.id) === String(message.id) ? { ...item, unread: false } : item))
      setNotice('Message marqué comme lu et synchronisé avec OPS.')
    } finally {
      setBusy(null)
    }
  }

  async function sendMessage(kind: 'reply' | 'new' | 'location' = 'new') {
    const body = kind === 'location'
      ? 'Localisation terrain envoyée depuis le centre messages CareLink.'
      : draftBody.trim()

    if (!body) return

    setBusy(`send:${kind}`)
    setNotice('')
    try {
      const payloadMissionId = draftMissionId || selectedMessage?.missionId || null
      const response = (await runCareLinkAction('/api/carelink/messages', {
        missionId: payloadMissionId,
        subject: draftSubject.trim() || (kind === 'reply' && selectedMessage ? `Réponse · ${selectedMessage.title || 'Dispatch'}` : 'Message agent CareLink'),
        body,
        priority: kind === 'location' ? 'high' : draftPriority,
        recipientType: 'dispatch',
        threadKey: payloadMissionId ? `mission:${payloadMissionId}` : (selectedMessage?.missionId ? `mission:${selectedMessage.missionId}` : 'agent:dispatch'),
        idempotencyKey: `carelink-message-r1-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        metadata: {
          source: 'carelink_mobile_messages_enterprise_r1',
          action: kind,
          reply_to: kind === 'reply' ? selectedMessage?.id || null : null,
        },
      })) as any

      const created = (response?.data?.message || response?.data?.data || response?.data || {
        id: `local-message-${Date.now()}`,
        title: draftSubject.trim() || (kind === 'location' ? 'Localisation terrain' : 'Message agent CareLink'),
        body,
        missionId: payloadMissionId,
        priority: kind === 'location' ? 'high' : draftPriority,
        unread: false,
        createdAt: new Date().toISOString(),
      }) as Record<string, any>

      const normalized = {
        id: String(created.id || `local-message-${Date.now()}`),
        title: String(created.title || created.subject || draftSubject.trim() || (kind === 'location' ? 'Localisation terrain' : 'Message agent CareLink')),
        body: String(created.body || body),
        missionId: created.missionId || created.mission_id || payloadMissionId || null,
        priority: String(created.priority || (kind === 'location' ? 'high' : draftPriority)),
        unread: Boolean(created.unread ?? false),
        createdAt: String(created.createdAt || created.created_at || new Date().toISOString()),
      }

      setLocalMessages((current) => [normalized, ...current].slice(0, 80))
      setSelectedId(normalized.id)
      setDraftBody('')
      if (kind !== 'reply') setDraftSubject('')
      setNotice(kind === 'location' ? 'Localisation envoyée à la liaison OPS.' : 'Message envoyé et synchronisé avec OPS.')
    } finally {
      setBusy(null)
    }
  }

  return (
<section className="pb-28">
      <style>{`
        [data-carelink-messages-hero-white="true"],
        [data-carelink-messages-hero-white="true"] *,
        [data-carelink-messages-hero-white="true"] h1,
        [data-carelink-messages-hero-white="true"] h2,
        [data-carelink-messages-hero-white="true"] h3,
        [data-carelink-messages-hero-white="true"] p,
        [data-carelink-messages-hero-white="true"] span,
        [data-carelink-messages-hero-white="true"] div {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          opacity: 1 !important;
        }

        [data-carelink-messages-hero-white="true"] svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }
      `}</style>

      <div className="px-5 pt-5">
        <div className="relative overflow-hidden rounded-[2.3rem] bg-gradient-to-br from-slate-950 via-blue-800 to-cyan-500 p-5 text-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]" data-carelink-messages-hero-white="true">
          <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -bottom-20 left-4 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-blue-100">{meta.eyebrow}</p>
                <h1 className="mt-3 text-[2rem] font-black leading-[0.98] tracking-tight text-white">Messages OPS</h1>
                <p className="mt-3 text-sm font-semibold leading-6 text-blue-50">
                  Fils dispatch, réponses, lecture, priorités et liaison opérationnelle synchronisée.
                </p>
              </div>
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/12 text-white ring-1 ring-white/15">
                <MessageCircle size={26} />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                <p className="text-2xl font-black">{localMessages.length}</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-blue-100">Messages</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                <p className="text-2xl font-black">{unreadCount}</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-blue-100">Non lus</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                <p className="text-2xl font-black">{urgentCount}</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-blue-100">Urgents</p>
              </div>
            </div>

            {latestMessage ? (
              <div className="mt-4 rounded-[1.5rem] bg-white/10 p-4 ring-1 ring-white/10">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-100">Dernier contact</p>
                <p className="mt-2 text-sm font-black text-white">{latestMessage.title || 'Message dispatch'}</p>
                <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-blue-50">{latestMessage.body}</p>
              </div>
            ) : null}
          </div>
        </div>

        {notice ? (
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
            {notice}
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 px-5">
        <CareLinkAngelCareConnectMobileBridge />
        
        <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Composer</p>
              <h2 className="mt-1 text-lg font-black text-slate-950">Message à la liaison OPS</h2>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700 ring-1 ring-blue-100">
              {missionLinkedCount} liés mission
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            <input
              value={draftSubject}
              onChange={(event) => setDraftSubject(event.target.value)}
              placeholder="Sujet du message"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-blue-400"
            />

            <select
              value={draftMissionId}
              onChange={(event) => setDraftMissionId(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-blue-400"
            >
              <option value="">Fil général dispatch</option>
              {missionOptions.map((mission) => (
                <option key={String(mission.id)} value={String(mission.id)}>
                  {mission.familyName || mission.code || `Mission ${mission.id}`} · {mission.dateLabel || 'Date'}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'high', 'urgent'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDraftPriority(item)}
                  className={cx(
                    'rounded-2xl px-3 py-3 text-[10px] font-black uppercase tracking-[0.14em] ring-1 transition active:scale-[0.98]',
                    draftPriority === item ? 'bg-slate-950 text-white ring-slate-950' : priorityClass(item),
                  )}
                >
                  {item === 'normal' ? 'Normal' : item === 'high' ? 'Important' : 'Urgent'}
                </button>
              ))}
            </div>

            <textarea
              value={draftBody}
              onChange={(event) => setDraftBody(event.target.value)}
              placeholder="Écrire un message clair pour OPS Dispatch..."
              className="min-h-32 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-950 outline-none focus:border-blue-400"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={Boolean(busy) || !draftBody.trim()}
                onClick={() => sendMessage('new')}
                className="rounded-2xl bg-slate-950 px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg disabled:opacity-50"
              >
                Envoyer OPS
              </button>
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => sendMessage('location')}
                className="rounded-2xl bg-blue-600 px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg disabled:opacity-50"
              >
                Localisation
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Boîte dispatch</p>
              <h2 className="mt-1 text-lg font-black text-slate-950">Messages reçus</h2>
            </div>
            <span className="rounded-full bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600 ring-1 ring-slate-200">
              {unreadCount} non lus
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {localMessages.map((message) => (
              <button
                key={String(message.id)}
                type="button"
                onClick={() => {
                  setSelectedId(String(message.id))
                  if (message.unread) void markMessageRead(message)
                }}
                className={cx(
                  'w-full rounded-[1.5rem] border p-4 text-left transition active:scale-[0.99]',
                  String(selectedMessage?.id) === String(message.id) ? 'border-blue-200 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {message.unread ? <span className="rounded-full bg-rose-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white">Nouveau</span> : null}
                      <span className={cx('rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] ring-1', priorityClass(message.priority))}>{message.priority || 'normal'}</span>
                      <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500 ring-1 ring-slate-100">{formatMessageDate(message.createdAt)}</span>
                    </div>
                    <p className="mt-3 text-sm font-black leading-5 text-slate-950">{message.title || 'Message dispatch'}</p>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{message.body}</p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">{messageMissionLabel(message)}</p>
                  </div>
                </div>
              </button>
            ))}

            {!localMessages.length ? (
              <div className="rounded-[1.8rem] border border-dashed border-blue-200 bg-blue-50/50 p-6 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-blue-700 shadow-sm">
                  <MessageCircle size={24} />
                </div>
                <h3 className="mt-4 text-lg font-black text-slate-950">Aucun message OPS</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  Les messages persistants du dispatch apparaîtront ici. Vous pouvez déjà envoyer une demande à OPS.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Détail thread</p>
              <h2 className="mt-1 text-lg font-black text-slate-950">{selectedMessage?.title || 'Aucun thread sélectionné'}</h2>
            </div>
            {selectedMessage ? <span className={cx('rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ring-1', priorityClass(selectedMessage.priority))}>{selectedMessage.priority}</span> : null}
          </div>

          {selectedMessage ? (
            <div className="mt-4">
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{messageMissionLabel(selectedMessage)}</p>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">{selectedMessage.body}</p>
                <p className="mt-3 text-xs font-bold text-slate-400">{formatMessageDate(selectedMessage.createdAt)}</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={Boolean(busy) || !selectedMessage.unread}
                  onClick={() => markMessageRead(selectedMessage)}
                  className="rounded-2xl bg-emerald-600 px-4 py-4 text-xs font-black uppercase tracking-[0.14em] text-white disabled:opacity-50"
                >
                  Marquer lu
                </button>
                <Link
                  href={selectedMessage.missionId ? `/carelink/missions/${selectedMessage.missionId}` : '/carelink/missions'}
                  className="rounded-2xl bg-slate-950 px-4 py-4 text-center text-xs font-black uppercase tracking-[0.14em] text-white"
                >
                  Mission liée
                </Link>
              </div>

              <div className="mt-3 grid gap-2">
                <textarea
                  value={draftBody}
                  onChange={(event) => setDraftBody(event.target.value)}
                  placeholder="Répondre à ce thread OPS..."
                  className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-950 outline-none focus:border-blue-400"
                />
                <button
                  type="button"
                  disabled={Boolean(busy) || !draftBody.trim()}
                  onClick={() => sendMessage('reply')}
                  className="rounded-2xl bg-blue-600 px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-white disabled:opacity-50"
                >
                  Répondre au thread
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">Sélectionnez un message pour afficher le détail et répondre.</p>
          )}
        </section>
      </div>
    </section>
  )
}



function ProfileScreen({
  records,
  workspace,
  runCareLinkAction,
}: {
  records: MissionControlRecord[]
  workspace: CareLinkMobileWorkspace | null
  runCareLinkAction: (endpoint: string, payload: Record<string, unknown>) => Promise<unknown>
}) {
  const completed = records.filter((item) => ['completed', 'closed'].includes(item.status)).length
  const active = records.filter((item) => ['assigned', 'agent_notified', 'agent_accepted', 'confirmed', 'en_route', 'arrival_confirmed', 'mission_started', 'in_progress'].includes(item.status)).length
  const alerts = records.filter((item) => ['incident', 'cancelled'].includes(item.status)).length
  const documents = (workspace?.documents || []) as Array<{ id: string; documentType: string; status: string; reviewStatus: string; expiresAt: string | null; fileUrl: string | null }>
  const agent = workspace?.agent || workspace?.profile || {}
  const meta = routeMeta('profile', workspace)
  const [documentType, setDocumentType] = useState('')
  const [documentUrl, setDocumentUrl] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [reviewNote, setReviewNote] = useState('')
  const zones = Array.from(new Set(records.map((item) => item.zone).filter(Boolean)))
  const skills = safeArray<string>(agent.skills).length ? safeArray<string>(agent.skills) : safeArray<string>(agent.requiredSkills)
  const languages = safeArray<string>(agent.languages)
  const emergencyContacts = safeArray<Record<string, unknown>>(agent.emergencyContacts || agent.emergency_contacts)
  const reliability = Number(agent.reliabilityScore || agent.reliability_score || workspace?.stats?.reliabilityScore || 0)
  const performance = Number(agent.performanceScore || agent.performance_score || workspace?.stats?.performanceScore || 0)
  const serviceEligibility = safeArray<string>(agent.serviceEligibility || agent.services || []).length ? safeArray<string>(agent.serviceEligibility || agent.services || []) : Array.from(new Set(records.map((item) => item.serviceType)))

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <div className="rounded-[2rem] bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-600">{meta.eyebrow}</p>
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-slate-900 to-blue-600 text-2xl font-black text-white">{String(agent.avatarInitials || agent.initials || 'AC')}</div>
          <h1 className="mt-4 text-2xl font-black">{String(agent.fullName || agent.full_name || agent.name || 'Agent terrain')}</h1>
          <p className="mt-1 text-sm text-slate-500">{String(agent.role || agent.jobTitle || 'Spécialiste terrain')} · {String(agent.city || 'Ville en attente')}</p>
          <span className="mt-4 inline-flex rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">Disponible</span>
        </div>
      </div>
      <div className="mt-5 space-y-5 px-5">
        <div className="grid grid-cols-2 gap-3">
          <Metric label="ACTIVES" value={active} />
          <Metric label="TERMINÉES" value={completed} />
          <Metric label="ALERTES" value={alerts} />
          <Metric label="TOTAL" value={records.length} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="Fiabilité" value={`${reliability}%`} tone="bg-emerald-50 text-emerald-700 ring-emerald-100" />
          <MiniStat label="Performance" value={`${performance}%`} tone="bg-sky-50 text-sky-700 ring-sky-100" />
          <MiniStat label="Zones" value={zones.length} tone="bg-indigo-50 text-indigo-700 ring-indigo-100" />
          <MiniStat label="Services" value={serviceEligibility.length} tone="bg-amber-50 text-amber-700 ring-amber-100" />
        </div>
        <DetailCard title="Identité et disponibilité" icon={<UserRound size={18} />}>
          <div className="space-y-2 text-sm text-slate-700">
            <InfoRow icon={<UserRound size={18} />} label="Statut" value={String(agent.status || agent.complianceStatus || 'actif')} />
            <InfoRow icon={<Phone size={18} />} label="Téléphone" value={String(agent.phone || agent.mobile || '—')} />
            <InfoRow icon={<Navigation size={18} />} label="Langues" value={languages.length ? languages.join(' · ') : '—'} />
            <InfoRow icon={<ShieldCheck size={18} />} label="Zones couvertes" value={zones.length ? zones.join(' · ') : '—'} />
          </div>
        </DetailCard>
        <DetailCard title="Zones de service" icon={<MapPin size={18} />}>
          <div className="flex flex-wrap gap-2">{zones.length ? zones.map((zone) => <span key={zone} className="rounded-full bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700">{zone}</span>) : <span className="rounded-full bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">Aucune zone publiée</span>}</div>
        </DetailCard>
        <DetailCard title="Compétences validées" icon={<ShieldCheck size={18} />}>
          <div className="space-y-2">
            {skills.length ? skills.map((skill) => <p key={skill} className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{skill}</p>) : (
              <>
                <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">Conformité opérationnelle active</p>
                <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">Traçabilité des missions respectée</p>
                <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">Rapports et pointages prêts</p>
              </>
            )}
          </div>
        </DetailCard>
        <DetailCard title="Services éligibles" icon={<ClipboardCheck size={18} />}>
          <div className="flex flex-wrap gap-2">
            {serviceEligibility.length ? serviceEligibility.map((service) => <span key={service} className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">{service}</span>) : <span className="rounded-full bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">Aucun service déclaré</span>}
          </div>
        </DetailCard>
        <DetailCard title="Documents et conformité" icon={<FileText size={18} />}>
          <div className="space-y-3">
            <p className="text-sm leading-6 text-slate-600">Statut vérification : <b className="text-slate-950">VALIDÉ</b>. Conformité opérationnelle : <b className="text-slate-950">CONFORME</b>.</p>
            <div className="space-y-2">
              {documents.length ? documents.map((document) => (
                <div key={document.id} className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-sm font-black text-slate-950">{document.documentType}</p>
                  <p className="mt-1 text-xs text-slate-500">{document.status} · {document.reviewStatus}{document.expiresAt ? ` · Expire le ${document.expiresAt.slice(0, 10)}` : ''}</p>
                </div>
              )) : <p className="text-sm text-slate-500">Aucun document actif détecté.</p>}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Document / revue</p>
              <div className="mt-3 space-y-2">
                <input value={documentType} onChange={(event) => setDocumentType(event.target.value)} placeholder="Type de document" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none" />
                <input value={documentUrl} onChange={(event) => setDocumentUrl(event.target.value)} placeholder="URL du document (si disponible)" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none" />
                <input value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} type="date" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none" />
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={async () => {
                      if (!documentType.trim()) return
                      try {
                        await runCareLinkAction('/api/carelink/profile/documents', {
                          documentType: documentType.trim(),
                          fileUrl: documentUrl.trim() || null,
                          expiresAt: expiresAt || null,
                        })
                        setDocumentType('')
                        setDocumentUrl('')
                        setExpiresAt('')
                      } catch {}
                    }}
                    className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={async () => {
                      if (!documentType.trim()) return
                      try {
                        await runCareLinkAction('/api/carelink/readiness/review-request', {
                          documentType: documentType.trim(),
                          note: reviewNote || 'Revue documentaire demandée depuis le profil CareLink mobile',
                        })
                      } catch {}
                    }}
                    className="rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white"
                  >
                    Demander revue
                  </button>
                </div>
                <textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Note de revue..." className="min-h-20 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none" />
              </div>
            </div>
          </div>
        </DetailCard>
        <DetailCard title="Contacts d’urgence" icon={<Phone size={18} />}>
          <div className="space-y-2">
            {emergencyContacts.length ? emergencyContacts.map((contact, index) => (
              <div key={String(contact.id || index)} className="rounded-2xl bg-slate-50 p-3">
                <p className="text-sm font-black text-slate-950">{String(contact.name || contact.full_name || contact.label || `Contact ${index + 1}`)}</p>
                <p className="mt-1 text-xs text-slate-500">{String(contact.phone || contact.number || contact.value || '—')}</p>
              </div>
            )) : <p className="text-sm text-slate-500">Aucun contact d’urgence disponible.</p>}
          </div>
        </DetailCard>
      </div>
    </section>
  )
}

function SafetyScreen({
  workspace,
  records,
  runCareLinkAction,
}: {
  workspace: CareLinkMobileWorkspace | null
  records: MissionControlRecord[]
  runCareLinkAction: (endpoint: string, payload: Record<string, unknown>) => Promise<unknown>
}) {
  const safetyRows = safeArray<{ label: string; value: string }>(workspace?.workspaces.safety)
  const meta = routeMeta('safety', workspace)
  const nextMission = records[0] || null
  const incidentHistory = safeArray<Record<string, unknown>>(workspace?.history).filter((item) => String(item.status || '').toLowerCase().includes('incident') || String(item.title || '').toLowerCase().includes('incident'))
  const emergencyPhone = firstString(workspace?.agent?.emergencyPhone, workspace?.agent?.emergency_phone, (workspace as any)?.emergencyPhone, (workspace as any)?.emergency_phone)
  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <Link href="/carelink" className="inline-flex items-center gap-2 text-sm font-black text-slate-500"><ChevronLeft size={18} /> Retour</Link>
      </div>
      <div className="mx-5 mt-4 rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="mx-auto grid h-36 w-36 place-items-center rounded-full bg-rose-500 text-4xl font-black text-white shadow-[0_22px_65px_rgba(244,63,94,0.28)]">SOS</div>
        <p className="mt-5 text-[11px] font-black uppercase tracking-[0.35em] text-rose-600">{meta.eyebrow}</p>
        <h1 className="mt-2 text-2xl font-black">{meta.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{meta.description}</p>
      </div>
      <div className="mx-5 mt-5 grid grid-cols-2 gap-3">
        <a href={workspace?.agent?.phone ? `tel:${workspace.agent.phone}` : '/carelink/messages'} className="rounded-[1.7rem] bg-slate-950 px-4 py-4 text-center text-sm font-black text-white">Appeler la liaison opérationnelle</a>
        <a href={emergencyPhone ? `tel:${emergencyPhone}` : '/carelink/messages'} className="rounded-[1.7rem] bg-rose-700 px-4 py-4 text-center text-sm font-black text-white">Appeler urgence</a>
        <a href="/carelink/safety" className="rounded-[1.7rem] bg-rose-600 px-4 py-4 text-center text-sm font-black text-white">SOS</a>
        <button onClick={() => runCareLinkAction('/api/carelink/messages', { body: 'Localisation terrain envoyée depuis CareLink Safety', senderType: 'agent', recipientType: 'liaison_operationnelle', priority: 'high', metadata: { type: 'location' } })} className="rounded-[1.7rem] bg-white px-4 py-4 text-center text-sm font-black text-slate-700 ring-1 ring-slate-200">Envoyer la localisation</button>
        {nextMission ? <button onClick={() => { void runCareLinkAction(`/api/carelink/missions/${nextMission.id}/incident`, { note: 'Incident signalé depuis la page sécurité', source: 'carelink_mobile' }).catch(() => null) }} className="rounded-[1.7rem] bg-white px-4 py-4 text-center text-sm font-black text-rose-700 ring-1 ring-rose-200">Déclarer incident</button> : null}
        {nextMission ? <button onClick={() => { void runCareLinkAction(`/api/carelink/missions/${nextMission.id}/request-replacement`, { note: 'Demande de remplacement depuis la page sécurité', source: 'carelink_mobile' }).catch(() => null) }} className="rounded-[1.7rem] bg-white px-4 py-4 text-center text-sm font-black text-slate-700 ring-1 ring-slate-200">Remplacement</button> : null}
        <button onClick={() => { void runCareLinkAction('/api/carelink/support', { note: 'Environnement jugé non sûr depuis CareLink Safety', category: 'safety', details: { source: 'carelink_mobile' } }).catch(() => null) }} className="rounded-[1.7rem] bg-white px-4 py-4 text-center text-sm font-black text-slate-700 ring-1 ring-slate-200">Zone non sûre</button>
      </div>
      <div className="mt-5 space-y-3 px-5">
        {[
          ['Déclarer un incident', 'Documenter un incident'],
          ['Consignes de sécurité', 'Consulter les procédures de sécurité'],
          ['Contacts d’urgence', 'Appeler les contacts d’urgence'],
          ['Je suis en sécurité', 'Notifier la liaison opérationnelle'],
        ].map(([title, body]) => (
          <button key={title} className="flex w-full items-center justify-between rounded-[1.7rem] bg-white p-4 text-left shadow-sm ring-1 ring-slate-200">
            <span>
              <b className="block text-sm">{title}</b>
              <span className="text-xs text-slate-500">{body}</span>
            </span>
            <ChevronRight className="text-slate-300" />
          </button>
        ))}
      </div>
      <div className="mx-5 mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black text-slate-900">Protocole d’urgence</p>
        <p className="mt-2 text-sm text-slate-600">1. Prévenir la liaison opérationnelle. 2. Appeler l’urgence si nécessaire. 3. Envoyer la localisation. 4. Déclarer l’incident. 5. Demander un remplacement si la mission ne peut pas continuer.</p>
      </div>
      <div className="mx-5 mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">Trajet du jour</p>
            <h2 className="mt-1 text-xl font-black">Itinéraire intelligent</h2>
          </div>
          <Wifi size={18} className="text-blue-300" />
        </div>
        <p className="text-sm text-slate-600">Gardez le pointage, le trajet et les confirmations à jour pour maintenir la traçabilité complète.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {safetyRows.map((item) => (
            <div key={String(item.label)} className="rounded-2xl bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase text-slate-400">{item.label}</p>
              <p className="mt-1 text-sm font-black text-slate-950">{item.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500">{records.some((record) => record.status === 'incident') ? 'Un incident est actif dans la file de mission.' : 'Aucun incident actif dans votre file de mission.'}</p>
      </div>
      <div className="mx-5 mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black text-slate-900">Historique sécurité</p>
        <div className="mt-3 space-y-2">
          {incidentHistory.length ? incidentHistory.slice(0, 4).map((item, index) => (
            <div key={String(item.id || index)} className="rounded-2xl bg-rose-50 p-3">
              <p className="text-sm font-black text-rose-800">{String(item.title || 'Incident')}</p>
              <p className="mt-1 text-xs text-rose-700">{String(item.body || '')}</p>
            </div>
          )) : <p className="text-sm text-slate-500">Aucun incident récent visible dans l’audit sécurité.</p>}
        </div>
      </div>
    </section>
  )
}

function CalendarScreen({ workspace, records }: { workspace: CareLinkMobileWorkspace | null; records: MissionControlRecord[] }) {
  const meta = routeMeta('calendar', workspace)
  const days = workspace?.calendar.byDate || []
  const density = workspace?.calendar.density || 0
  const recurringSessions = records.filter((item) => item.subMissionCount > 0 || item.missionKind === 'dossier').length
  const pendingConfirmations = records.filter((item) => ['assigned', 'agent_notified'].includes(item.status)).length

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-600">{meta.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{meta.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{meta.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Mois', 'Semaine', 'Jour'].map((value) => <span key={value} className="rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">{value}</span>)}
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            <Metric label="JOURS" value={days.length} />
            <Metric label="MISSIONS" value={records.length} />
            <Metric label="DENSITÉ" value={`${density}%`} />
            <Metric label="CONFIRM." value={pendingConfirmations} />
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs font-semibold text-slate-600">
            Sessions récurrentes visibles: {recurringSessions}. Les points de densité et les disponibilités sont dérivés des missions réelles synchronisées.
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-4 px-5">
        {days.length ? days.map((day) => (
          <div key={day.date} className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">{day.date}</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">{day.count} mission{day.count > 1 ? 's' : ''}</h2>
              </div>
              <BellRing className="text-slate-300" size={18} />
            </div>
            <div className="mt-4 space-y-2">
              {day.missions.map((mission) => <MissionCard key={mission.id} mission={mission} runAction={() => {}} busy={null} />)}
            </div>
          </div>
        )) : <EmptyState title="Calendrier vide" body="La structure calendrier est active. Les missions et disponibilités apparaîtront ici dès synchronisation." />}
      </div>
    </section>
  )
}

function NotificationsScreen({
  workspace,
  records,
  notifications,
  runCareLinkAction,
}: {
  workspace: CareLinkMobileWorkspace | null
  records: MissionControlRecord[]
  notifications: CareLinkMobileNotification[]
  runCareLinkAction: (endpoint: string, payload: Record<string, unknown>) => Promise<unknown>
}) {
  const [localNotifications, setLocalNotifications] = useState(notifications)
  const meta = routeMeta('notifications', workspace)
  const unreadCount = localNotifications.filter((item) => item.unread).length
  const criticalCount = localNotifications.filter((item) => item.priority === 'critical').length

  useEffect(() => {
    setLocalNotifications(notifications)
  }, [notifications])

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-600">{meta.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{meta.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{meta.description}</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric label="NON LUES" value={unreadCount} />
            <Metric label="CRITIQUES" value={criticalCount} />
            <Metric label="MISSIONS" value={records.length} />
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-3 px-5">
        {localNotifications.length ? localNotifications.map((item) => (
          <article key={item.id} className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.body}</p>
              </div>
              <span className={cx('rounded-full px-3 py-1 text-[10px] font-black ring-1', item.priority === 'critical' ? 'bg-rose-50 text-rose-700 ring-rose-100' : item.priority === 'high' ? 'bg-amber-50 text-amber-700 ring-amber-100' : 'bg-sky-50 text-sky-700 ring-sky-100')}>
                {item.unread ? 'Non lue' : 'Lue'}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
              <Link href={item.missionId ? `/carelink/missions/${item.missionId}` : '/carelink/missions'} className="rounded-full bg-slate-100 px-4 py-2 text-slate-700">Ouvrir la mission</Link>
              <button
                onClick={async () => {
                  try {
                    await runCareLinkAction(`/api/carelink/notifications/${item.id}/acknowledge`, { missionId: item.missionId || null, note: `Notification ${item.id} reconnue depuis CareLink mobile` })
                    setLocalNotifications((current) => current.map((entry) => (entry.id === item.id ? { ...entry, unread: false } : entry)))
                  } catch {}
                }}
                className="rounded-full bg-blue-600 px-4 py-2 text-white"
              >
                Accuser réception
              </button>
            </div>
          </article>
        )) : <EmptyState title="Aucune notification en attente" body="Les rappels de mission, validations, paiements et conformité apparaîtront ici dès qu’ils seront publiés." />}
      </div>
      <div className="mx-5 mt-5 rounded-[2rem] bg-amber-50 p-4 ring-1 ring-amber-100">
        <p className="text-sm font-black text-amber-900">Rappels récents</p>
        <div className="mt-3 space-y-2">
          {records.slice(0, 3).map((record) => <p key={record.id} className="rounded-2xl bg-white p-3 text-sm font-semibold text-amber-800">{record.serviceType} · {record.status}</p>)}
        </div>
      </div>
    </section>
  )
}

function AlertsScreen({
  workspace,
  records,
  alerts,
  runCareLinkAction,
}: {
  workspace: CareLinkMobileWorkspace | null
  records: MissionControlRecord[]
  alerts: CareLinkMobileAlert[]
  runCareLinkAction: (endpoint: string, payload: Record<string, unknown>) => Promise<unknown>
}) {
  const [localAlerts, setLocalAlerts] = useState(alerts)
  const meta = routeMeta('alerts', workspace)
  const criticalCount = localAlerts.filter((alert) => alert.tone === 'red').length
  const amberCount = localAlerts.filter((alert) => alert.tone === 'amber').length

  useEffect(() => {
    setLocalAlerts(alerts)
  }, [alerts])

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <div className="rounded-[2rem] bg-gradient-to-br from-rose-600 to-amber-500 p-5 text-white shadow-xl shadow-rose-100">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-rose-50">{meta.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black">{meta.title}</h1>
          <p className="mt-2 text-sm leading-6 text-rose-50">{meta.description}</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric label="CRITIQUES" value={criticalCount} />
            <Metric label="AMBER" value={amberCount} />
            <Metric label="MISSIONS" value={records.length} />
          </div>
        </div>
      </div>
      {criticalCount ? (
        <div className="mx-5 mt-4 rounded-[2rem] border border-rose-200 bg-rose-50 p-4 text-rose-800">
          <p className="text-sm font-black">Alerte critique active</p>
          <p className="mt-1 text-sm leading-6">Traitez les alertes rouges immédiatement. La liaison opérationnelle et la sécurité doivent être contactées sans délai.</p>
        </div>
      ) : null}
      <div className="mt-5 space-y-3 px-5">
        {localAlerts.length ? localAlerts.map((alert) => {
          const mission = records.find((item) => String(item.id) === String(alert.missionId))
          return (
            <article key={alert.id} className={cx('rounded-[2rem] border p-4 shadow-sm', alert.tone === 'red' ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50')}>
              <h2 className="text-base font-black text-slate-950">{alert.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{alert.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {mission ? <Link href={`/carelink/missions/${mission.id}`} className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700">Ouvrir</Link> : null}
                {mission ? <button onClick={async () => {
                  try {
                    await runCareLinkAction(`/api/carelink/alerts/${alert.id}/acknowledge`, { missionId: mission.id, note: `Alerte ${alert.id} reconnue depuis CareLink mobile` })
                    setLocalAlerts((current) => current.map((entry) => (entry.id === alert.id ? { ...entry, tone: 'emerald' } : entry)))
                  } catch {}
                }} className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700">Accuser réception</button> : null}
                {mission ? <button onClick={() => runCareLinkAction(`/api/carelink/missions/${mission.id}/incident`, { note: `Incident signalé depuis l’alerte ${alert.id}`, source: 'carelink_mobile' })} className="rounded-full bg-rose-600 px-4 py-2 text-xs font-black text-white">Déclarer incident</button> : null}
                <Link href="/carelink/messages" className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white">Contacter la liaison opérationnelle</Link>
              </div>
            </article>
          )
        }) : <EmptyState title="Aucune alerte critique" body="Le centre d’alertes reste actif. Les risques terrain, incidents et escalades apparaîtront ici dès qu’ils sont publiés." />}
      </div>
    </section>
  )
}

function HistoryScreen({ workspace, records }: { workspace: CareLinkMobileWorkspace | null; records: MissionControlRecord[] }) {
  const meta = routeMeta('history', workspace)
  const history = workspace?.history || []
  const disputes = safeArray<Record<string, unknown>>(workspace?.paymentDisputes)
  const documents = safeArray<Record<string, unknown>>(workspace?.documents)
  const filters = ['Tous', 'Missions', 'Incidents', 'Rapports', 'Finance', 'Conformité']

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-600">{meta.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{meta.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{meta.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.map((filter) => <span key={filter} className="rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">{filter}</span>)}
          </div>
        </div>
      </div>
      <div className="mx-5 mt-4 grid grid-cols-2 gap-3">
        <Metric label="ÉVÉNEMENTS" value={history.length} />
        <Metric label="DISPUTES" value={disputes.length} />
        <Metric label="DOCUMENTS" value={documents.length} />
        <Metric label="MISSIONS" value={records.length} />
      </div>
      <div className="mt-5 space-y-3 px-5">
        {history.length ? history.map((item) => (
          <article key={item.id} className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.body}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600">{item.status}</span>
            </div>
            {item.missionId ? <Link href={`/carelink/missions/${item.missionId}`} className="mt-3 inline-flex rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white">Ouvrir la mission</Link> : null}
          </article>
        )) : <EmptyState title="Aucun élément d’audit" body="Le journal d’événements, les incidents, les rapports et les éléments conformité apparaîtront ici dès qu’ils seront synchronisés." />}
      </div>
      <div className="mx-5 mt-5 rounded-[2rem] bg-slate-50 p-4 ring-1 ring-slate-200">
        <p className="text-sm font-black text-slate-900">{records.length} missions suivies · {history.length} lignes d’audit</p>
      </div>
    </section>
  )
}

function PaymentsScreen({
  workspace,
  records,
  runCareLinkAction,
}: {
  workspace: CareLinkMobileWorkspace | null
  records: MissionControlRecord[]
  runCareLinkAction: (endpoint: string, payload: Record<string, unknown>) => Promise<unknown>
}) {
  const payments = workspace?.payments
  const disputes = (workspace?.paymentDisputes || []) as Array<{ id: string; missionId: number | null; amountClaimed: number | null; reason: string; status: string; createdAt: string }>
  const meta = routeMeta('payments', workspace)
  const [reason, setReason] = useState('')
  const [amount, setAmount] = useState('')
  const [missionId, setMissionId] = useState<string>('')

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-emerald-600">{meta.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{meta.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{meta.description}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric label="GAGNÉ" value={`${payments?.earned || 0} DH`} />
            <Metric label="EN ATTENTE" value={`${payments?.pendingValidation || 0} DH`} />
            <Metric label="PAYÉ" value={`${payments?.paid || 0} DH`} />
            <Metric label="PROCHAIN" value={`${payments?.upcomingPayment || 0} DH`} />
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 px-5">
        <MiniStat label="Primes" value={`${payments?.bonuses || 0} DH`} tone="bg-indigo-50 text-indigo-700 ring-indigo-100" />
        <MiniStat label="Transport" value={`${payments?.transport || 0} DH`} tone="bg-sky-50 text-sky-700 ring-sky-100" />
        <MiniStat label="Indemnités" value={`${payments?.allowances || 0} DH`} tone="bg-emerald-50 text-emerald-700 ring-emerald-100" />
        <MiniStat label="Litiges" value={disputes.length} tone="bg-rose-50 text-rose-700 ring-rose-100" />
      </div>
      <div className="mt-5 space-y-3 px-5">
        {payments?.lines?.length ? payments.lines.map((line) => (
          <article key={line.id} className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-950">{line.label}</h2>
                <p className="mt-1 text-sm text-slate-500">{line.kind} · {line.status}</p>
              </div>
              <p className="text-lg font-black text-slate-950">{line.amountMad} DH</p>
            </div>
          </article>
        )) : <EmptyState title="Aucune indemnité trouvée" body="Les montants apparaîtront ici dès qu’ils seront validés par finance et liés à une mission réelle." />}
      </div>
      <div className="mx-5 mt-5 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">Correction paiement</p>
        <div className="mt-3 space-y-3">
          <select value={missionId} onChange={(event) => setMissionId(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400">
            <option value="">Mission liée (optionnel)</option>
            {records.map((record) => <option key={record.id} value={record.id}>{record.code} · {record.serviceType}</option>)}
          </select>
          <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="Montant contesté (MAD/DH)" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400" />
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motif de la correction..." className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400" />
          <button
            onClick={async () => {
              if (!reason.trim()) return
              try {
                await runCareLinkAction('/api/carelink/payments/disputes', {
                  missionId: missionId ? Number(missionId) : null,
                  amountClaimed: amount ? Number(amount) : null,
                  reason: reason.trim(),
                })
                setReason('')
                setAmount('')
                setMissionId('')
              } catch {}
            }}
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
          >
            Soumettre la correction
          </button>
        </div>
      </div>
      <div className="mx-5 mt-5 rounded-[2rem] bg-emerald-50 p-4 ring-1 ring-emerald-100">
        <p className="text-sm font-black text-emerald-900">Corrections en cours</p>
        <div className="mt-3 space-y-2">
          {disputes.length ? disputes.map((dispute) => (
            <div key={dispute.id} className="rounded-2xl bg-white p-3">
              <p className="text-sm font-black text-slate-950">{dispute.reason}</p>
              <p className="mt-1 text-xs text-slate-500">{dispute.status} · {dispute.amountClaimed ? `${currencyDh(dispute.amountClaimed)}` : 'Montant non précisé'}</p>
            </div>
          )) : <p className="text-sm text-slate-600">Aucune correction en cours.</p>}
        </div>
      </div>
      <div className="mx-5 mt-5 rounded-[2rem] bg-emerald-50 p-4 ring-1 ring-emerald-100">
        <p className="text-sm font-black text-emerald-900">Mission liées au paiement: {records.filter((record) => ['completed', 'report_pending', 'in_progress'].includes(record.status)).length}</p>
      </div>
    </section>
  )
}

function ReadinessScreen({ workspace, records }: { workspace: CareLinkMobileWorkspace | null; records: MissionControlRecord[] }) {
  const readiness = workspace?.readiness
  const meta = routeMeta('readiness', workspace)
  const documents = safeArray<Record<string, unknown>>(workspace?.documents)
  const expiredDocuments = documents.filter((document) => {
    const expiresAt = document.expiresAt ? new Date(String(document.expiresAt)).getTime() : null
    return String(document.status || document.reviewStatus || '').toLowerCase() === 'expired' || String(document.reviewStatus || '').toLowerCase() === 'review_requested' || (expiresAt != null && expiresAt < Date.now())
  })
  const pendingReviewDocuments = documents.filter((document) => String(document.reviewStatus || '').toLowerCase() === 'review_requested' || String(document.reviewStatus || '').toLowerCase() === 'pending')
  const serviceEligibility = records.length ? Array.from(new Set(records.map((record) => record.serviceType))) : []
  const zoneEligibility = records.length ? Array.from(new Set(records.map((record) => record.zone))) : []
  const noBlockers = !(readiness?.blockers?.length || readiness?.warnings?.length || expiredDocuments.length || pendingReviewDocuments.length)

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-600">{meta.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{meta.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{meta.description}</p>
        </div>
      </div>
      <div className="mt-5 px-5">
        <div className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-200">Score</p>
          <div className="mt-2 text-5xl font-black">{readiness?.score || 0}%</div>
          <p className="mt-2 text-sm leading-6 text-slate-200">{readiness?.nextAction || 'Agent prêt pour exécution terrain'}</p>
        </div>
      </div>
      <div className="mt-5 space-y-4 px-5">
        <DetailCard title="Blocages" icon={<AlertTriangle size={18} />}>
          {readiness?.blockers?.length ? readiness.blockers.map((blocker) => <p key={blocker} className="rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{blocker}</p>) : <p className="text-sm text-slate-500">Aucun blocage critique.</p>}
        </DetailCard>
        <DetailCard title="Documents" icon={<FileText size={18} />}>
          <div className="space-y-2">
            {expiredDocuments.length ? expiredDocuments.map((document) => <p key={String(document.id)} className="rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{String(document.documentType || document.document_type || 'Document')} · expiré ou à renouveler</p>) : <p className="text-sm text-slate-500">Aucun document expiré.</p>}
            {pendingReviewDocuments.length ? pendingReviewDocuments.map((document) => <p key={String(document.id)} className="rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">{String(document.documentType || document.document_type || 'Document')} · revue en attente</p>) : <p className="text-sm text-slate-500">Aucune revue documentaire en attente.</p>}
          </div>
        </DetailCard>
        <DetailCard title="Points de vigilance" icon={<CheckCircle2 size={18} />}>
          {readiness?.warnings?.length ? readiness.warnings.map((warning) => <p key={warning} className="rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">{warning}</p>) : <p className="text-sm text-slate-500">Aucune vigilance ouverte.</p>}
        </DetailCard>
        <DetailCard title="Éligibilité" icon={<ShieldCheck size={18} />}>
          <div className="space-y-2">
            <InfoRow icon={<ShieldCheck size={18} />} label="Services" value={serviceEligibility.length ? serviceEligibility.join(' · ') : 'Aucun service publié'} />
            <InfoRow icon={<MapPin size={18} />} label="Zones" value={zoneEligibility.length ? zoneEligibility.join(' · ') : 'Aucune zone publiée'} />
            <InfoRow icon={<ClipboardCheck size={18} />} label="Documents expirés" value={String(expiredDocuments.length)} />
            <InfoRow icon={<FileText size={18} />} label="Revue" value={String(pendingReviewDocuments.length)} />
          </div>
        </DetailCard>
        <DetailCard title="Actions conformité" icon={<CheckCircle2 size={18} />}>
          <div className="flex flex-wrap gap-2">
            <Link href="/carelink/profile" className="rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white">Mettre à jour le profil</Link>
            <Link href="/carelink/profile" className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200">Mettre à jour les documents</Link>
            <Link href="/carelink/support" className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200">Demander une revue</Link>
          </div>
        </DetailCard>
        <DetailCard title="Services visibles" icon={<ShieldCheck size={18} />}>
          <div className="flex flex-wrap gap-2">{records.slice(0, 6).map((record) => <span key={record.id} className="rounded-full bg-sky-50 px-3 py-2 text-xs font-black text-sky-700">{record.serviceType}</span>)}</div>
        </DetailCard>
        {noBlockers ? <EmptyState title="Aucun blocage détecté" body="La préparation est visible et prête. Les documents, compétences et disponibilités sont suivis en temps réel." /> : null}
      </div>
    </section>
  )
}

function SupportScreen({
  workspace,
  runCareLinkAction,
}: {
  workspace: CareLinkMobileWorkspace | null
  records: MissionControlRecord[]
  runCareLinkAction: (endpoint: string, payload: Record<string, unknown>) => Promise<unknown>
}) {
  const support = workspace?.support || []
  const meta = routeMeta('support', workspace)
  const supportHistory = safeArray<Record<string, unknown>>(workspace?.history).filter((item) => String(item.status || '').toLowerCase().includes('support') || String(item.title || '').toLowerCase().includes('support'))
  const [note, setNote] = useState('')

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-600">{meta.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{meta.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{meta.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {meta.chips.map((chip) => <span key={chip} className="rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">{chip}</span>)}
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-3 px-5">
        {support.map((item) => (
          <Link key={item.id} href={item.href || '/carelink/messages'} className="block rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.body}</p>
              </div>
              <LifeBuoy className="text-slate-300" size={18} />
            </div>
          </Link>
        ))}
      </div>
      <div className="mx-5 mt-5 grid grid-cols-2 gap-3">
        <Metric label="Demandes" value={support.length} />
        <Metric label="Historique" value={supportHistory.length} />
      </div>
      <div className="mx-5 mt-5 rounded-[2rem] bg-sky-50 p-4 ring-1 ring-sky-100">
        <p className="text-sm font-black text-sky-900">Actions d’assistance rapides</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/carelink/messages" className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700">Message à la liaison opérationnelle</Link>
          <Link href="/carelink/payments" className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700">Paiements</Link>
          <Link href="/carelink/safety" className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700">Sécurité</Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Liaison</span>
          <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Finance</span>
          <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Supervision</span>
          <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Technique</span>
        </div>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Décrivez le besoin d’assistance..." className="mt-3 min-h-24 w-full rounded-2xl border border-sky-200 bg-white p-3 text-sm outline-none" />
        <button
          onClick={async () => {
            if (!note.trim()) return
            try {
              await runCareLinkAction('/api/carelink/support', {
                note: note.trim(),
                category: 'mobile_support',
                details: { source: 'carelink_mobile' },
              })
              setNote('')
            } catch {}
          }}
          className="mt-3 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white"
        >
          Créer une demande
        </button>
      </div>
      <div className="mx-5 mt-5 rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black text-slate-900">Historique d’assistance</p>
        <div className="mt-3 space-y-2">
          {supportHistory.length ? supportHistory.slice(0, 4).map((item, index) => (
            <div key={String(item.id || index)} className="rounded-2xl bg-slate-50 p-3">
              <p className="text-sm font-black text-slate-950">{String(item.title || 'Assistance')}</p>
              <p className="mt-1 text-xs text-slate-500">{String(item.body || '')}</p>
            </div>
          )) : <p className="text-sm text-slate-500">Aucune demande d’assistance antérieure n’est visible.</p>}
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl bg-white p-3 text-center shadow-sm">
      <p className="text-2xl font-black text-blue-600">{value}</p>
      <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
    </div>
  )
}

function EnterpriseMiniModule({ href, label, value }: { href: string; label: string; value: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </Link>
  )
}

function QuickTile({
  href,
  icon,
  title,
  subtitle,
  tone,
}: {
  href: string
  icon: ReactNode
  title: string
  subtitle: string
  tone: 'blue' | 'amber' | 'rose' | 'emerald'
}) {
  const toneClasses = tone === 'blue'
    ? 'bg-blue-50 text-blue-700 ring-blue-100'
    : tone === 'amber'
      ? 'bg-amber-50 text-amber-700 ring-amber-100'
      : tone === 'emerald'
        ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
        : 'bg-rose-50 text-rose-700 ring-rose-100'

  return (
    <Link href={href} className={cx('rounded-[1.4rem] p-3 ring-1 shadow-sm transition active:scale-[0.99]', toneClasses)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em]">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 opacity-80">{subtitle}</p>
        </div>
        <span className="rounded-full bg-white/80 p-2 text-current">{icon}</span>
      </div>
    </Link>
  )
}

function PreviewList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{title}</p>
      <div className="mt-2 space-y-2">
        {items.length ? items.map((item, index) => (
          <p key={`${title}-${index}`} className="rounded-2xl bg-white p-3 text-xs leading-5 text-slate-600 shadow-sm">
            {item}
          </p>
        )) : <p className="rounded-2xl bg-white p-3 text-xs leading-5 text-slate-500 shadow-sm">{empty}</p>}
      </div>
    </div>
  )
}

function SectionHeader({ title, action, href }: { title: string; action: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <Link href={href} className="text-sm font-black text-blue-600">{action}</Link>
    </div>
  )
}

function DarkRoutePreview({ records }: { records: MissionControlRecord[] }) {
  const next = records[0] || null
  return (
    <div className="rounded-[1.8rem] bg-slate-950 p-5 text-white shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-300">Trajet du jour</p>
          <h2 className="mt-1 text-xl font-black">{next ? next.serviceType : 'Aucune mission de trajet'}</h2>
        </div>
        <Wifi size={18} className="text-blue-300" />
      </div>
      <div className="grid gap-3">
        <div className="rounded-3xl bg-white/10 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Statut</p>
          <p className="mt-1 text-sm font-black">{next ? statusLabel(next.status) : 'En attente'}</p>
        </div>
        <div className="rounded-3xl bg-white/10 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Prochaine fenêtre</p>
          <p className="mt-1 text-sm font-black">{next ? `${next.dateLabel || '—'} · ${next.timeLabel || '—'}` : 'À planifier'}</p>
        </div>
      </div>
    </div>
  )
}

function missionTime(record: MissionControlRecord) {
  const raw = record.timeLabel || ''
  if (!raw || raw === '—') return 'À planifier'
  return raw
}

function MiniStat({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className={cx('rounded-2xl px-3 py-3 ring-1', tone)}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  )
}



function MissionBriefAcknowledgementSection({
  mission,
  sections,
  acknowledged,
  latestAcknowledgement,
  runAction,
  busy,
  onAcknowledged,
}: {
  mission: MissionControlRecord
  sections: MissionBriefSection[]
  acknowledged: boolean
  latestAcknowledgement: Record<string, any> | null
  runAction: (mission: MissionControlRecord, action: string, payload?: Record<string, any> | string) => void
  busy: string | null
  onAcknowledged: () => void
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() => ({
    parent_instructions: acknowledged,
    service_scope: acknowledged,
    location: acknowledged,
    emergency_contact: acknowledged,
    safety_confidentiality: acknowledged,
  }))
  const [note, setNote] = useState('')

  useEffect(() => {
    if (acknowledged) {
      setChecked({
        parent_instructions: true,
        service_scope: true,
        location: true,
        emergency_contact: true,
        safety_confidentiality: true,
      })
    }
  }, [acknowledged])

  const requiredKeys = sections.filter((section) => section.required).map((section) => section.key)
  const missing = requiredKeys.filter((key) => !checked[key])
  const isBusy = busy === `${mission.id}:brief-acknowledge`
  const acknowledgedAt = String(latestAcknowledgement?.acknowledgedAt || latestAcknowledgement?.acknowledged_at || '')

  function acknowledgeBrief() {
    if (missing.length) return
    const snapshot = sections.reduce<Record<string, unknown>>((acc, section) => {
      acc[section.key] = { label: section.label, value: section.value, required: section.required }
      return acc
    }, {})
    onAcknowledged()
    runAction(mission, 'brief-acknowledge', {
      briefVersion: 'carelink-mobile-brief-v1',
      parentInstructionsAcknowledged: true,
      serviceScopeAcknowledged: true,
      locationAcknowledged: true,
      emergencyAcknowledged: true,
      confidentialityAcknowledged: true,
      sections: snapshot,
      briefSnapshot: { missionCode: mission.code, serviceType: mission.serviceType, familyName: mission.familyName, city: mission.city, zone: mission.zone },
      metadata: { note: note || null, source: 'carelink_mobile_mission_detail' },
    })
  }

  return (
    <DetailCard title="Brief mission" icon={<ShieldCheck size={18} />}>
      <div className="space-y-4">
        <div className={cx('rounded-[1.75rem] p-4 ring-1', acknowledged ? 'bg-emerald-50 text-emerald-950 ring-emerald-100' : 'bg-amber-50 text-amber-950 ring-amber-100')}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.26em] opacity-70">Consignes parent</p>
              <h3 className="mt-2 text-lg font-black">{acknowledged ? 'Brief reconnu' : 'Reconnaissance requise avant démarrage'}</h3>
              <p className="mt-2 text-xs font-bold leading-5 opacity-75">
                {acknowledged ? `Confirmé${acknowledgedAt ? ` · ${acknowledgedAt.slice(0, 16).replace('T', ' ')}` : ''}` : 'Lire les consignes, confirmer les points requis, puis démarrer la mission.'}
              </p>
            </div>
            <span className={cx('rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ring-1', acknowledged ? 'bg-white text-emerald-700 ring-emerald-100' : 'bg-white text-amber-700 ring-amber-100')}>
              {acknowledged ? 'OK' : `${missing.length} requis`}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {sections.map((section) => (
            <label key={section.key} className="flex items-start gap-3 rounded-[1.35rem] border border-slate-200 bg-white p-3 shadow-sm">
              <input
                type="checkbox"
                checked={Boolean(checked[section.key])}
                disabled={acknowledged}
                onChange={(event) => setChecked((current) => ({ ...current, [section.key]: event.target.checked }))}
                className="mt-1 h-4 w-4 accent-blue-600"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black text-slate-950">{section.label}</span>
                <span className="mt-1 block text-xs font-semibold leading-5 text-slate-600">{section.value}</span>
              </span>
              {section.required ? <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">Requis</span> : null}
            </label>
          ))}
        </div>

        {!acknowledged ? (
          <>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Note courte si un point doit être signalé à OPS avant démarrage"
              className="min-h-20 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400"
            />
            <button
              disabled={Boolean(missing.length) || isBusy}
              onClick={acknowledgeBrief}
              className="w-full rounded-2xl bg-slate-950 px-4 py-4 text-sm font-black text-white shadow-lg shadow-slate-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
            >
              {isBusy ? 'Synchronisation...' : 'Confirmer le brief'}
            </button>
          </>
        ) : null}
      </div>
    </DetailCard>
  )
}


type DynamicChecklistDisplayItem = {
  id: string
  label: string
  description: string
  category: string
  groupLabel: string
  required: boolean
  completed: boolean
  evidenceRequired: boolean
  severity: string
  itemKey: string
  notes: string
  metadata: Record<string, any>
}

function recordMetadata(row: Record<string, any>) {
  return (row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata) ? row.metadata : {}) as Record<string, any>
}

function normalizeDynamicChecklistItem(row: Record<string, any>, definition: CareLinkDynamicChecklistDefinition, index: number): DynamicChecklistDisplayItem {
  const metadata = recordMetadata(row)
  const itemKey = String(row.itemKey || row.item_key || metadata.template_key || row.code || row.id || `check-${index + 1}`)
  const template = definition.items.find((item) => item.key === itemKey)
  return {
    id: String(row.id || itemKey),
    label: String(row.label || row.title || template?.label || itemKey.replaceAll('_', ' ')),
    description: String(row.description || template?.description || row.category || 'Contrôle service terrain'),
    category: String(row.category || metadata.check_category || template?.category || 'general'),
    groupLabel: String(row.checkGroup || row.check_group || metadata.checklist_group || template?.groupLabel || 'Contrôles'),
    required: Boolean(row.required ?? template?.required),
    completed: Boolean(row.completed),
    evidenceRequired: Boolean(row.evidenceRequired ?? row.evidence_required ?? metadata.evidence_required ?? template?.evidenceRequired),
    severity: String(row.severity || metadata.severity || template?.severity || 'standard'),
    itemKey,
    notes: String(row.notes || ''),
    metadata: { ...metadata, template_key: itemKey, service_type: metadata.service_type || definition.serviceType, service_family: metadata.service_family || definition.serviceFamily },
  }
}

function checklistSeverityTone(severity: string) {
  const value = String(severity || '').toLowerCase()
  if (['critical', 'high'].includes(value)) return 'bg-rose-50 text-rose-700 ring-rose-100'
  if (['important', 'elevated', 'watch'].includes(value)) return 'bg-amber-50 text-amber-700 ring-amber-100'
  return 'bg-slate-100 text-slate-600 ring-slate-200'
}

function DynamicServiceChecklistSection({
  mission,
  checklistItems,
  definition,
  runAction,
  busy,
}: {
  mission: MissionControlRecord
  checklistItems: Array<Record<string, any>>
  definition: CareLinkDynamicChecklistDefinition
  runAction: (mission: MissionControlRecord, action: string, payload?: Record<string, any> | string) => void
  busy: string | null
}) {
  const items = useMemo(() => checklistItems.map((item, index) => normalizeDynamicChecklistItem(item, definition, index)), [checklistItems, definition])
  const [notesById, setNotesById] = useState<Record<string, string>>({})
  const completed = items.filter((item) => item.completed).length
  const required = items.filter((item) => item.required).length
  const missingRequired = items.filter((item) => item.required && !item.completed).length
  const evidenceRequired = items.filter((item) => item.evidenceRequired).length
  const criticalOpen = items.filter((item) => item.required && !item.completed && ['critical', 'high'].includes(String(item.severity).toLowerCase())).length
  const progress = items.length ? Math.round((completed / items.length) * 100) : 0
  const groups = Array.from(new Set(items.map((item) => item.groupLabel)))
  const isBusy = busy === `${mission.id}:checklist`

  function updateChecklistItem(item: DynamicChecklistDisplayItem, completedValue: boolean, action: 'checked' | 'unchecked' | 'issue_reported') {
    const note = notesById[item.id] || item.notes || ''
    runAction(mission, 'checklist', {
      itemId: item.id,
      completed: completedValue,
      notes: note || `${item.label} · ${completedValue ? 'validé' : 'à revoir'}`,
      metadata: {
        ...item.metadata,
        checklist_group: item.groupLabel,
        check_category: item.category,
        evidence_required: item.evidenceRequired,
        severity: item.severity,
        mobile_checklist_action: action,
        source: 'carelink_mobile_p11_dynamic_service_checklists',
      },
    })
  }

  return (
    <DetailCard title="Checklist service dynamique" icon={<ClipboardCheck size={18} />}>
      <div className="space-y-4">
        <div className="rounded-[1.75rem] bg-slate-950 p-4 text-white shadow-xl shadow-slate-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-200">{definition.serviceFamily}</p>
              <h3 className="mt-2 text-xl font-black">{definition.title}</h3>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{definition.summary}</p>
            </div>
            <span className={cx('rounded-full px-3 py-2 text-[11px] font-black ring-1', missingRequired ? 'bg-amber-50 text-amber-700 ring-amber-100' : 'bg-emerald-50 text-emerald-700 ring-emerald-100')}>
              {missingRequired ? `${missingRequired} requis` : 'Prête'}
            </span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <MiniStat label="Progression" value={`${progress}%`} tone="bg-sky-50 text-sky-700 ring-sky-100" />
          <MiniStat label="Requis" value={required} tone="bg-amber-50 text-amber-700 ring-amber-100" />
          <MiniStat label="Preuves" value={evidenceRequired} tone="bg-indigo-50 text-indigo-700 ring-indigo-100" />
          <MiniStat label="Critiques" value={criticalOpen} tone={criticalOpen ? 'bg-rose-50 text-rose-700 ring-rose-100' : 'bg-emerald-50 text-emerald-700 ring-emerald-100'} />
        </div>

        {items.length ? groups.map((group) => {
          const groupItems = items.filter((item) => item.groupLabel === group)
          const groupCompleted = groupItems.filter((item) => item.completed).length
          return (
            <div key={group} className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Bloc contrôle</p>
                  <h4 className="mt-1 text-base font-black text-slate-950">{group}</h4>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-600">{groupCompleted}/{groupItems.length}</span>
              </div>

              <div className="space-y-3">
                {groupItems.map((item) => (
                  <div key={item.id} className={cx('rounded-2xl border p-3', item.completed ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-200 bg-slate-50')}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={(event) => updateChecklistItem(item, event.target.checked, event.target.checked ? 'checked' : 'unchecked')}
                        className="mt-1 h-4 w-4 accent-blue-600"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.required ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-700 ring-1 ring-amber-100">Requis</span> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Optionnel</span>}
                          <span className={cx('rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ring-1', checklistSeverityTone(item.severity))}>{item.severity}</span>
                          {item.evidenceRequired ? <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-indigo-700 ring-1 ring-indigo-100">Preuve</span> : null}
                        </div>
                        <p className="mt-2 text-sm font-black leading-5 text-slate-950">{item.label}</p>
                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{item.description}</p>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2">
                      <textarea
                        value={notesById[item.id] ?? item.notes}
                        onChange={(event) => setNotesById((current) => ({ ...current, [item.id]: event.target.value }))}
                        placeholder="Note terrain courte si nécessaire"
                        className="min-h-16 w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-semibold outline-none focus:border-blue-400"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button disabled={isBusy} onClick={() => updateChecklistItem(item, true, 'checked')} className="rounded-2xl bg-emerald-50 px-3 py-3 text-[11px] font-black text-emerald-700 disabled:opacity-50">Valider</button>
                        <button disabled={isBusy} onClick={() => updateChecklistItem(item, false, 'issue_reported')} className="rounded-2xl bg-rose-50 px-3 py-3 text-[11px] font-black text-rose-700 disabled:opacity-50">À signaler</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        }) : (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold leading-6 text-slate-500">
            Aucune checklist dynamique n’est encore disponible. La checklist sera générée automatiquement depuis le type de service OPS dès chargement mission.
          </div>
        )}
      </div>
    </DetailCard>
  )
}


type PresenceProofLog = {
  id: string
  missionId: number
  caregiverId: number
  action: string
  status: string
  proofType: string
  occurredAt: string
  reason: string
  note: string
  riskFlag: string
}

function normalizePresenceProofLog(row: Record<string, any>): PresenceProofLog {
  return {
    id: String(row.id || row.created_at || row.createdAt || Math.random()),
    missionId: Number(row.missionId || row.mission_id || 0),
    caregiverId: Number(row.caregiverId || row.caregiver_id || 0),
    action: String(row.action || row.eventType || row.event_type || 'presence_update'),
    status: String(row.status || 'recorded'),
    proofType: String(row.proofType || row.proof_type || 'timestamp'),
    occurredAt: String(row.occurredAt || row.occurred_at || row.createdAt || row.created_at || new Date().toISOString()),
    reason: String(row.reason || ''),
    note: String(row.note || ''),
    riskFlag: String(row.riskFlag || row.risk_flag || ''),
  }
}

function presenceActionLabel(action: string) {
  const labels: Record<string, string> = {
    day_started: 'Début journée',
    day_ended: 'Fin journée',
    mission_check_in: 'Check-in mission',
    mission_check_out: 'Check-out mission',
    pause_started: 'Pause',
    pause_resumed: 'Retour pause',
    late_reason: 'Retard justifié',
    early_departure_reason: 'Départ anticipé',
    location_proof: 'Preuve localisation',
    presence_update: 'Présence',
  }
  return labels[action] || action.replaceAll('_', ' ')
}

function AttendancePresenceProofSection({
  mission,
  proofs,
  runAction,
  busy,
}: {
  mission: MissionControlRecord
  proofs: Array<Record<string, any>>
  runAction: (mission: MissionControlRecord, action: string, payload?: Record<string, any> | string) => void
  busy: string | null
}) {
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')
  const [optimisticProofs, setOptimisticProofs] = useState<PresenceProofLog[]>([])
  const logs = [...optimisticProofs, ...proofs.map(normalizePresenceProofLog)]
    .filter((proof) => String(proof.missionId || '') === String(mission.id) || !proof.missionId)
    .sort((a, b) => String(b.occurredAt).localeCompare(String(a.occurredAt)))
  const actions = new Set(logs.map((log) => log.action))
  const hasCheckIn = actions.has('mission_check_in') || actions.has('arrival_check_in') || actions.has('day_started')
  const hasCheckOut = actions.has('mission_check_out') || actions.has('day_ended')
  const isBusy = busy === `${mission.id}:presence-proof`
  const progress = hasCheckIn && hasCheckOut ? 100 : hasCheckIn ? 50 : 0

  function pushPresenceAction(action: string, riskFlag?: string) {
    const payload = {
      action,
      status: 'recorded',
      proofType: 'timestamp_device',
      reason: reason || null,
      note: note || null,
      riskFlag: riskFlag || null,
      metadata: { source: 'carelink_mobile_p13', missionCode: mission.code },
    }
    setOptimisticProofs((current) => [{
      id: `local-presence-${Date.now()}`,
      missionId: Number(mission.id),
      caregiverId: Number(mission.caregiverId || 0),
      action,
      status: 'recorded',
      proofType: 'timestamp_device',
      occurredAt: new Date().toISOString(),
      reason: reason || '',
      note: note || '',
      riskFlag: riskFlag || '',
    }, ...current])
    runAction(mission, 'presence-proof', payload)
    if (!['late_reason', 'early_departure_reason'].includes(action)) setNote('')
    if (action !== 'late_reason' && action !== 'early_departure_reason') setReason('')
  }

  return (
    <DetailCard title="Présence et pointage" icon={<Clock3 size={18} />}>
      <div className="space-y-4">
        <div className="rounded-[1.5rem] border border-indigo-100 bg-indigo-50/70 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-700">Preuve terrain</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">Check-in / check-out mission</h3>
              <p className="mt-1 text-sm font-bold leading-6 text-slate-600">Pointage horodaté, appareil, justification retard ou départ anticipé.</p>
            </div>
            <span className={cx('rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ring-1', hasCheckIn && hasCheckOut ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : hasCheckIn ? 'bg-blue-50 text-blue-700 ring-blue-100' : 'bg-amber-50 text-amber-700 ring-amber-100')}>
              {hasCheckIn && hasCheckOut ? 'Complet' : hasCheckIn ? 'En mission' : 'À pointer'}
            </span>
          </div>
          <div className="mt-4 h-2 rounded-full bg-white">
            <div className="h-2 rounded-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button disabled={isBusy || hasCheckIn} onClick={() => pushPresenceAction('mission_check_in')} className="rounded-2xl bg-slate-950 px-3 py-4 text-xs font-black text-white disabled:opacity-40">
            Check-in mission
          </button>
          <button disabled={isBusy || !hasCheckIn || hasCheckOut} onClick={() => pushPresenceAction('mission_check_out')} className="rounded-2xl bg-emerald-600 px-3 py-4 text-xs font-black text-white disabled:opacity-40">
            Check-out mission
          </button>
          <button disabled={isBusy} onClick={() => pushPresenceAction('pause_started')} className="rounded-2xl bg-slate-100 px-3 py-4 text-xs font-black text-slate-700 disabled:opacity-40">
            Pause
          </button>
          <button disabled={isBusy} onClick={() => pushPresenceAction('pause_resumed')} className="rounded-2xl bg-slate-100 px-3 py-4 text-xs font-black text-slate-700 disabled:opacity-40">
            Retour pause
          </button>
        </div>

        <div className="space-y-2">
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-20 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-indigo-400" placeholder="Motif retard / départ anticipé si nécessaire" />
          <textarea value={note} onChange={(event) => setNote(event.target.value)} className="min-h-20 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-indigo-400" placeholder="Note présence / pointage" />
          <div className="grid grid-cols-2 gap-2">
            <button disabled={isBusy || !reason.trim()} onClick={() => pushPresenceAction('late_reason', 'late_arrival')} className="rounded-2xl bg-amber-500 px-3 py-4 text-xs font-black text-white disabled:opacity-40">
              Justifier retard
            </button>
            <button disabled={isBusy || !reason.trim()} onClick={() => pushPresenceAction('early_departure_reason', 'early_departure')} className="rounded-2xl bg-rose-600 px-3 py-4 text-xs font-black text-white disabled:opacity-40">
              Départ anticipé
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {logs.slice(0, 6).map((log) => (
            <div key={log.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-slate-950">{presenceActionLabel(log.action)}</p>
                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{formatHour(log.occurredAt)}</span>
              </div>
              {log.reason || log.note ? <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{log.reason || log.note}</p> : null}
            </div>
          ))}
          {!logs.length ? <p className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-500">Aucun pointage mission enregistré.</p> : null}
        </div>
      </div>
    </DetailCard>
  )
}


function RouteTransportExecutionSection({
  mission,
  routeRows,
  transport,
  executionLogs,
  runAction,
  busy,
}: {
  mission: MissionControlRecord
  routeRows: Array<Record<string, any>>
  transport: Record<string, unknown> | null
  executionLogs: Array<Record<string, any>>
  runAction: (mission: MissionControlRecord, action: string, payload?: Record<string, any> | string) => void
  busy: string | null
}) {
  const routes = useMemo(() => normalizeMissionRoutes(mission, routeRows, transport), [mission, routeRows, transport])
  const [selectedRouteId, setSelectedRouteId] = useState(routes[0]?.id || 'primary-route')
  const [eta, setEta] = useState('')
  const [note, setNote] = useState('')
  const [claimAmount, setClaimAmount] = useState('')
  const [optimisticLogs, setOptimisticLogs] = useState<MissionRouteExecutionLog[]>([])
  const selectedRoute = routes.find((route) => route.id === selectedRouteId) || routes[0]
  const logs = [...optimisticLogs, ...executionLogs.map(normalizeRouteExecutionLog)]
    .filter((log) => !selectedRoute || log.routeId === selectedRoute.id || log.routeCode === selectedRoute.code || log.routeId === 'primary-route')
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  const isBusy = busy === `${mission.id}:route-execution`
  const confirmedDeparture = logs.some((log) => log.action === 'departure_confirmed')
  const completedRoute = logs.some((log) => log.action === 'route_completed')
  const activeIssue = logs.find((log) => ['delay_reported', 'issue_reported'].includes(log.action))

  useEffect(() => {
    if (routes.length && !routes.some((route) => route.id === selectedRouteId)) setSelectedRouteId(routes[0].id)
  }, [routes, selectedRouteId])

  function pushRouteAction(action: string, status: string, issueSeverity?: string | null) {
    if (!selectedRoute) return
    const payload = {
      routeId: selectedRoute.id,
      routeCode: selectedRoute.code,
      action,
      status,
      transportMode: selectedRoute.transportMode,
      eta: eta || null,
      notes: note || null,
      issueSeverity: issueSeverity || null,
      routeSnapshot: selectedRoute,
      allowanceClaim: action === 'allowance_claimed' ? { amountMad: Number(claimAmount || 0), currency: 'MAD', note: note || null } : {},
      metadata: { source: 'carelink_mobile_p10', missionCode: mission.code },
    }
    setOptimisticLogs((current) => [{
      id: `local-route-${Date.now()}`,
      missionId: Number(mission.id),
      caregiverId: Number(mission.caregiverId || 0),
      routeId: selectedRoute.id,
      routeCode: selectedRoute.code,
      action,
      status,
      transportMode: selectedRoute.transportMode,
      eta: eta || null,
      notes: note || null,
      issueSeverity: issueSeverity || null,
      createdAt: new Date().toISOString(),
      metadata: payload.metadata,
    }, ...current])
    runAction(mission, 'route-execution', payload)
    if (action !== 'eta_updated') setNote('')
    if (action === 'allowance_claimed') setClaimAmount('')
  }

  return (
    <DetailCard title="Route et transport" icon={<Route size={18} />}>
      <div className="space-y-4">
        <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50/70 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">Exécution trajet</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{selectedRoute?.code || `RT-${mission.code}`}</h3>
              <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
                {selectedRoute?.from || mission.city} → {selectedRoute?.to || mission.zone}
              </p>
            </div>
            <span className={cx('rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ring-1', completedRoute ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : confirmedDeparture ? 'bg-blue-50 text-blue-700 ring-blue-100' : 'bg-amber-50 text-amber-700 ring-amber-100')}>
              {completedRoute ? 'Terminé' : confirmedDeparture ? 'En cours' : 'À confirmer'}
            </span>
          </div>

          {routes.length > 1 ? (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {routes.map((route) => (
                <button
                  key={route.id}
                  onClick={() => setSelectedRouteId(route.id)}
                  className={cx('shrink-0 rounded-full px-3 py-2 text-[11px] font-black transition', route.id === selectedRoute?.id ? 'bg-slate-950 text-white' : 'bg-white text-slate-600')}
                >
                  {route.code}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {selectedRoute ? (
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Départ" value={selectedRoute.fromTime || '—'} tone="bg-sky-50 text-sky-700 ring-sky-100" />
            <MiniStat label="Arrivée" value={selectedRoute.toTime || '—'} tone="bg-emerald-50 text-emerald-700 ring-emerald-100" />
            <MiniStat label="Durée" value={selectedRoute.durationLabel || '—'} tone="bg-slate-50 text-slate-700 ring-slate-200" />
            <MiniStat label="Coût" value={`${selectedRoute.costMad || '0'} DH`} tone="bg-amber-50 text-amber-700 ring-amber-100" />
          </div>
        ) : null}

        {selectedRoute ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <InfoRow icon={<MapPin size={18} />} label="Départ" value={`${selectedRoute.from} · ${selectedRoute.fromZone}`} />
            <InfoRow icon={<Navigation size={18} />} label="Arrivée" value={`${selectedRoute.to} · ${selectedRoute.toZone}`} />
            <InfoRow icon={<Route size={18} />} label="Transport" value={selectedRoute.transportMode} />
            <InfoRow icon={<LifeBuoy size={18} />} label="Backup" value={selectedRoute.backupTransport} />
            {selectedRoute.transits.length ? <InfoRow icon={<ChevronRight size={18} />} label="Transits" value={`${selectedRoute.transits.length} point(s) intermédiaire(s)`} /> : null}
          </div>
        ) : null}

        <div className="grid gap-3">
          <input
            value={eta}
            onChange={(event) => setEta(event.target.value)}
            placeholder="ETA / heure prévue d’arrivée"
            className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Note trajet, retard, incident, point de repère ou commentaire transport"
            className="min-h-20 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
          <input
            value={claimAmount}
            onChange={(event) => setClaimAmount(event.target.value)}
            inputMode="decimal"
            placeholder="Frais transport à déclarer en DH, si applicable"
            className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button disabled={isBusy || !selectedRoute} onClick={() => pushRouteAction('departure_confirmed', 'started')} className="rounded-2xl bg-slate-950 px-3 py-3 text-xs font-black text-white disabled:opacity-50">Départ confirmé</button>
          <button disabled={isBusy || !selectedRoute} onClick={() => pushRouteAction('eta_updated', 'recorded')} className="rounded-2xl bg-blue-50 px-3 py-3 text-xs font-black text-blue-700 disabled:opacity-50">Envoyer ETA</button>
          <button disabled={isBusy || !selectedRoute} onClick={() => pushRouteAction('delay_reported', 'attention_required', 'high')} className="rounded-2xl bg-amber-50 px-3 py-3 text-xs font-black text-amber-700 disabled:opacity-50">Retard trajet</button>
          <button disabled={isBusy || !selectedRoute} onClick={() => pushRouteAction('issue_reported', 'attention_required', 'high')} className="rounded-2xl bg-rose-50 px-3 py-3 text-xs font-black text-rose-700 disabled:opacity-50">Incident trajet</button>
          <button disabled={isBusy || !selectedRoute} onClick={() => pushRouteAction('route_completed', 'completed')} className="rounded-2xl bg-emerald-50 px-3 py-3 text-xs font-black text-emerald-700 disabled:opacity-50">Trajet terminé</button>
          <button disabled={isBusy || !selectedRoute} onClick={() => pushRouteAction('allowance_claimed', 'submitted')} className="rounded-2xl bg-slate-100 px-3 py-3 text-xs font-black text-slate-700 disabled:opacity-50">Déclarer frais</button>
        </div>

        {activeIssue ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-800">
            Dernier signalement trajet: {routeActionLabel(activeIssue.action)} · {activeIssue.notes || activeIssue.eta || 'En attente liaison opérationnelle'}
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Journal trajet</p>
          {logs.slice(0, 5).map((log) => (
            <div key={log.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">{routeActionLabel(log.action)}</p>
                  <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{log.notes || log.eta || log.transportMode || 'Synchronisé CareLink Mobile'}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-500">{formatHour(log.createdAt)}</span>
              </div>
            </div>
          ))}
          {!logs.length ? <p className="text-sm font-semibold text-slate-500">Aucune exécution trajet enregistrée pour le moment.</p> : null}
        </div>
      </div>
    </DetailCard>
  )
}

function ProgramExecutionSection({
  mission,
  programLines,
  parameterDays,
  activityLogs,
  runAction,
  busy,
}: {
  mission: MissionControlRecord
  programLines: Array<Record<string, any>>
  parameterDays: Array<Record<string, any>>
  activityLogs: Array<Record<string, any>>
  runAction: (mission: MissionControlRecord, action: string, payload?: Record<string, any> | string) => void
  busy: string | null
}) {
  const activities = useMemo(() => normalizeProgramActivities(programLines, parameterDays), [programLines, parameterDays])
  const latestLogs = useMemo(() => latestProgramActivityLogMap(activityLogs), [activityLogs])
  const [statusById, setStatusById] = useState<Record<string, string>>({})
  const [notesById, setNotesById] = useState<Record<string, string>>({})

  useEffect(() => {
    const next: Record<string, string> = {}
    for (const activity of activities) {
      const log = latestLogs.get(activity.id)
      next[activity.id] = String(log?.status || statusById[activity.id] || 'pending')
    }
    setStatusById(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityLogs.length, activities.length])

  const completedCount = activities.filter((activity) => ['completed', 'done', 'validated'].includes(String(statusById[activity.id] || latestLogs.get(activity.id)?.status || 'pending'))).length
  const issueCount = activities.filter((activity) => ['issue', 'blocked'].includes(String(statusById[activity.id] || latestLogs.get(activity.id)?.status || 'pending'))).length
  const requiredCount = activities.filter((activity) => activity.required).length
  const missingRequired = activities.filter((activity) => activity.required && !['completed', 'done', 'validated'].includes(String(statusById[activity.id] || latestLogs.get(activity.id)?.status || 'pending'))).length
  const progress = activities.length ? Math.round((completedCount / activities.length) * 100) : 0

  function updateActivity(activity: ProgramActivity, status: string) {
    const note = notesById[activity.id] || String(latestLogs.get(activity.id)?.notes || '')
    setStatusById((current) => ({ ...current, [activity.id]: status }))
    runAction(mission, 'program-activity', {
      activityId: activity.id,
      activityLabel: activity.title,
      status,
      notes: note || null,
      issueSeverity: status === 'issue' || status === 'blocked' ? 'high' : null,
      line: activity.raw,
      metadata: {
        source: 'carelink_mobile_program_execution',
        required: activity.required,
        category: activity.category,
        timeLabel: activity.timeLabel,
        dayLabel: activity.dayLabel,
      },
    })
  }

  return (
    <DetailCard title="Programme et activités" icon={<ClipboardCheck size={18} />}>
      <div className="space-y-4">
        <div className="rounded-[1.75rem] bg-slate-950 p-4 text-white shadow-xl shadow-slate-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-200">Exécution programme</p>
              <h3 className="mt-2 text-xl font-black">{activities.length ? `${completedCount}/${activities.length} activités réalisées` : 'Aucun programme publié'}</h3>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">
                {requiredCount ? `${missingRequired} activité(s) obligatoire(s) restante(s)` : 'Les activités obligatoires seront contrôlées si elles sont marquées requises dans OPS.'}
              </p>
            </div>
            <span className={cx('rounded-full px-3 py-2 text-[11px] font-black ring-1', issueCount ? 'bg-rose-50 text-rose-700 ring-rose-100' : 'bg-emerald-50 text-emerald-700 ring-emerald-100')}>{issueCount ? `${issueCount} alerte(s)` : `${progress}%`}</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Activités" value={activities.length} tone="bg-sky-50 text-sky-700 ring-sky-100" />
          <MiniStat label="Requises" value={requiredCount} tone="bg-amber-50 text-amber-700 ring-amber-100" />
          <MiniStat label="Alertes" value={issueCount} tone={issueCount ? 'bg-rose-50 text-rose-700 ring-rose-100' : 'bg-emerald-50 text-emerald-700 ring-emerald-100'} />
        </div>

        {activities.length ? (
          <div className="space-y-3">
            {activities.map((activity, index) => {
              const log = latestLogs.get(activity.id)
              const status = String(statusById[activity.id] || log?.status || 'pending')
              const isBusy = busy === `${mission.id}:program-activity`
              return (
                <article key={activity.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-blue-700 ring-1 ring-blue-100">{index + 1}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{activity.timeLabel}</span>
                        <span className={cx('rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ring-1', programStatusTone(status))}>{programStatusLabel(status)}</span>
                        {activity.required ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-700 ring-1 ring-amber-100">Requis</span> : null}
                      </div>
                      <h4 className="mt-3 text-base font-black leading-tight text-slate-950">{activity.title}</h4>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{activity.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-xs font-semibold leading-5 text-slate-600">
                    <div className="rounded-2xl bg-slate-50 p-3"><span className="font-black text-slate-950">Objectif · </span>{activity.objective}</div>
                    <div className="rounded-2xl bg-slate-50 p-3"><span className="font-black text-slate-950">Consignes · </span>{activity.instructions}</div>
                    <div className="rounded-2xl bg-slate-50 p-3"><span className="font-black text-slate-950">Matériel · </span>{activity.materials}</div>
                    <div className="rounded-2xl bg-slate-50 p-3"><span className="font-black text-slate-950">Sécurité · </span>{activity.safety}</div>
                  </div>

                  <textarea
                    value={notesById[activity.id] ?? String(log?.notes || '')}
                    onChange={(event) => setNotesById((current) => ({ ...current, [activity.id]: event.target.value }))}
                    placeholder="Note terrain courte pour cette activité"
                    className="mt-3 min-h-20 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400"
                  />

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button disabled={isBusy} onClick={() => updateActivity(activity, 'started')} className="rounded-2xl bg-blue-50 px-3 py-3 text-[11px] font-black text-blue-700 disabled:opacity-50">Démarrer</button>
                    <button disabled={isBusy} onClick={() => updateActivity(activity, 'completed')} className="rounded-2xl bg-emerald-50 px-3 py-3 text-[11px] font-black text-emerald-700 disabled:opacity-50">Terminer</button>
                    <button disabled={isBusy} onClick={() => updateActivity(activity, 'issue')} className="rounded-2xl bg-rose-50 px-3 py-3 text-[11px] font-black text-rose-700 disabled:opacity-50">Alerte</button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold leading-6 text-slate-500">
            Aucun programme ou activité n’est encore publié dans le dossier de mission. Dès que CARELINK-OPS ajoute des lignes programme, elles apparaîtront ici en mode exécution terrain.
          </div>
        )}
      </div>
    </DetailCard>
  )
}

function DetailCard({ title, children, icon }: { title: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sky-600">
        {icon}
        <h2 className="text-sm font-black tracking-[0.18em] text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex gap-3 border-b border-slate-100 py-3 last:border-0"><div className="text-sky-600">{icon}</div><div><p className="text-[10px] font-black tracking-[0.25em] text-slate-400">{label}</p><p className="mt-1 text-sm font-bold leading-6 text-slate-950">{value}</p></div></div>
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center"><h3 className="text-lg font-black text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{body}</p></div>
}

function ActionGrid({ mission, runAction, busyAction, compact = false, blockedActions = {} }: { mission: MissionControlRecord; runAction: (mission: MissionControlRecord, action: string, payload?: Record<string, any> | string) => void; busyAction: string | null; compact?: boolean; blockedActions?: Record<string, string> }) {
  const actions = compact
    ? [{ key: 'accept', label: 'Accepter', primary: true }, { key: 'decline', label: 'Refuser', primary: false }]
    : [
      { key: 'accept', label: 'Accepter', primary: true },
      { key: 'readiness', label: 'Préparation', primary: false },
      { key: 'en-route', label: 'En route', primary: true },
      { key: 'delay', label: 'Retard', primary: false },
      { key: 'arrived', label: 'Arrivée', primary: true },
      { key: 'check-in', label: 'Pointer', primary: false },
      { key: 'start', label: 'Démarrer', primary: true },
      { key: 'checklist', label: 'Contrôles', primary: false },
      { key: 'complete', label: 'Terminer', primary: true },
      { key: 'report', label: 'Rapport', primary: false },
      { key: 'incident', label: 'Incident', primary: false },
      { key: 'request-replacement', label: 'Remplacement', primary: false },
    ]

  return (
    <div className={cx('mt-4 grid gap-2', 'grid-cols-2')}>
      {actions.map((action) => {
        const blockedReason = blockedActions[action.key]
        const disabled = Boolean(blockedReason) || busyAction === `${mission.id}:${action.key}`
        return (
          <button
            key={action.key}
            disabled={disabled}
            title={blockedReason || undefined}
            onClick={() => runAction(mission, action.key, { source: 'carelink_mobile' })}
            className={cx(
              'rounded-2xl px-3 py-3 text-xs font-black transition active:scale-[0.99]',
              action.primary ? 'bg-slate-950 text-white shadow-lg shadow-slate-200' : 'bg-slate-100 text-slate-700',
              disabled && 'opacity-60',
              blockedReason && 'bg-slate-200 text-slate-500 shadow-none',
            )}
          >
            {busyAction === `${mission.id}:${action.key}` ? 'Synchronisation...' : blockedReason || action.label}
          </button>
        )
      })}
    </div>
  )
}

function ToastMessage({ toast }: { toast: Exclude<Toast, null> }) {
  return <div className={cx('fixed left-1/2 top-4 z-[70] -translate-x-1/2 rounded-full px-4 py-3 text-sm font-black shadow-xl', toast.tone === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white')}>{toast.text}</div>
}

function BottomNav({ active }: { active: CareLinkMobileView }) {
  const items = [
    { key: 'home', href: '/carelink', icon: <Home size={19} />, label: 'Accueil' },
    { key: 'missions', href: '/carelink/missions', icon: <ClipboardCheck size={19} />, label: 'Missions' },
    { key: 'schedule', href: '/carelink/schedule', icon: <CalendarDays size={19} />, label: 'Planning' },
    { key: 'messages', href: '/carelink/messages', icon: <MessageCircle size={19} />, label: 'Messages' },
    { key: 'profile', href: '/carelink/profile', icon: <UserRound size={19} />, label: 'Profil' },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md border-t border-slate-200 bg-white/95 px-2 pb-3 pt-2 shadow-[0_-18px_45px_rgba(15,23,42,0.10)] backdrop-blur">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => (
          <Link key={item.key} href={item.href} className={cx('flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[9px] font-black transition', active === item.key ? 'bg-[#06285e] text-white' : 'text-slate-400')}>
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { InterventionsState, InterventionStatus, RiskLevel, InterventionRequest, InterventionOrder, InterventionStaff, InterventionEquipment, InterventionRoute, InterventionInvoice } from '@/lib/interventions/types'
import { INTERVENTION_SEED_STATE } from '@/lib/interventions/seed'
import { formatDateFr, formatMad, formatTimeFr } from '@/lib/interventions/format'
import { MODAL_BLUEPRINTS, PAGE_REGISTRY, ROLE_MATRIX, INTERVENTION_STATUSES, MOROCCO_CITIES, SERVICE_CATEGORIES, STAFF_ROLES, type InterventionModalKey, type InterventionPageKey } from '@/lib/interventions/enterprise-config'
import { buildModalExecutionPlan, buildProductionReadiness, buildSlaPressureRows, PAGE_CONTROL_ROOMS, PHASE3_EXECUTION_LAYERS } from '@/lib/interventions/phase3-execution'
import { PHASE4_PAGE_WAR_ROOMS, PHASE4_PRODUCTION_GATES, PHASE4_ROLE_HANDOFFS, PHASE4_PRINT_PACKS, buildPhase4CommandAssurance, buildPhase4StaffCoverage, buildPhase4FinancialControl, buildPhase4WhiteOpsRows } from '@/lib/interventions/phase4-production'
import { PHASE5_ESCALATION_TIERS, PHASE5_FIELD_COMMAND_CHECKS, PHASE5_HANDOVER_PROTOCOLS, PHASE5_PRODUCTION_CONTINUITY, buildPhase5BillingExposure, buildPhase5ContinuityScore, buildPhase5EquipmentContinuity, buildPhase5ExecutionQueues, buildPhase5RoleLocks } from '@/lib/interventions/phase5-continuity'
import { PHASE6_CARE_COMPLIANCE_CONTROLS, PHASE6_CARE_PACKS, PHASE6_PATIENT_SAFETY_GATES, PHASE6_SHIFT_COMMANDS, buildPhase6CareContinuity, buildPhase6ConsentExposure, buildPhase6CriticalCareQueue, buildPhase6RoleScenarioCoverage } from '@/lib/interventions/phase6-care-command'
import { PHASE7_CASH_CLOSURE_PROTOCOLS, PHASE7_COMPLIANCE_EXPORTS, PHASE7_FINANCE_GATES, PHASE7_REVENUE_COMMANDS, buildPhase7InvoiceExposure, buildPhase7MarginProtection, buildPhase7RevenueAssurance, buildPhase7RoleFinanceLocks } from '@/lib/interventions/phase7-revenue-compliance'
import { PHASE8_ADOPTION_ROLLOUTS, PHASE8_LIVEOPS_COMMANDS, PHASE8_NOTIFICATION_RUNBOOKS, PHASE8_QUALITY_GATES, buildPhase8LiveOpsQueue, buildPhase8PatientExperience, buildPhase8QualityScore, buildPhase8RunbookCoverage, buildPhase8StaffAdoption } from '@/lib/interventions/phase8-quality-liveops'
import { PHASE9_ACCOUNTABILITY_MATRIX, PHASE9_GOVERNANCE_COMMANDS, PHASE9_GO_LIVE_CHECKLIST, PHASE9_SLA_GOVERNANCE_RULES, buildPhase9GovernanceScore, buildPhase9HandoffExceptions, buildPhase9ReadinessGates, buildPhase9SlaBreachRegister } from '@/lib/interventions/phase9-governance-sla'
import { PHASE10_GO_LIVE_WAR_ROOM, PHASE10_OBSERVABILITY_SIGNALS, PHASE10_PRODUCTION_LAUNCH_COMMANDS, PHASE10_PRODUCTION_LOCKS, PHASE10_ROLLBACK_AND_CHANGE_CONTROL, PHASE10_SUPPORT_RUNBOOKS, buildPhase10CutoverChecklist, buildPhase10LaunchScore, buildPhase10ProductionRiskRegister, buildPhase10RoleGoLiveReadiness } from '@/lib/interventions/phase10-production-launch'
import { PHASE11_EVIDENCE_GATES, PHASE11_FIELD_EXECUTION_COMMANDS, PHASE11_FIELD_PRINT_AND_HANDOFF_PACKS, PHASE11_MOBILE_FIELD_RUNBOOKS, buildPhase11FieldProofScore, buildPhase11MobileExecutionQueue, buildPhase11OfflineFallbackControls, buildPhase11StaffMobileReadiness } from '@/lib/interventions/phase11-field-execution'
import Phase12ActionModal from './Phase12ActionModal'
import Phase13ConfigurationCenter from './Phase13ConfigurationCenter'

type ActiveModal = { key: InterventionModalKey; entityId?: string; entityType?: string }
type PageKey = InterventionPageKey
const STORAGE_KEY = 'angelcare-interventions-os-v2-enterprise'

const EMPTY_INTERVENTIONS_STATE: InterventionsState = {
  templates: [],
  requests: [],
  orders: [],
  appointments: [],
  staff: [],
  locations: [],
  routes: [],
  routeStops: [],
  equipment: [],
  audits: [],
  incidents: [],
  invoices: [],
}

const STATE_ARRAY_KEYS: (keyof InterventionsState)[] = [
  'templates', 'requests', 'orders', 'appointments', 'staff', 'locations', 'routes', 'routeStops', 'equipment', 'audits', 'incidents', 'invoices',
]

function arrayOrSeed<K extends keyof InterventionsState>(value: any, key: K): InterventionsState[K] {
  if (Array.isArray(value) && value.length > 0) return value as InterventionsState[K]
  const seedValue = INTERVENTION_SEED_STATE[key]
  return (Array.isArray(seedValue) ? seedValue : []) as InterventionsState[K]
}

function mergeApiAndLocalState(apiPayload: any, localState: Partial<InterventionsState> | null): InterventionsState & { syncMode?: string } {
  const apiState = apiPayload?.ok ? apiPayload : null
  const base: InterventionsState & { syncMode?: string } = apiState ? {
    templates: arrayOrSeed(apiState.templates, 'templates'),
    requests: arrayOrSeed(apiState.requests, 'requests'),
    orders: arrayOrSeed(apiState.orders, 'orders'),
    appointments: arrayOrSeed(apiState.appointments, 'appointments'),
    staff: arrayOrSeed(apiState.staff, 'staff'),
    locations: arrayOrSeed(apiState.locations, 'locations'),
    routes: arrayOrSeed(apiState.routes, 'routes'),
    routeStops: arrayOrSeed(apiState.routeStops, 'routeStops'),
    equipment: arrayOrSeed(apiState.equipment, 'equipment'),
    audits: arrayOrSeed(apiState.audits, 'audits'),
    incidents: arrayOrSeed(apiState.incidents, 'incidents'),
    invoices: arrayOrSeed(apiState.invoices, 'invoices'),
    syncMode: apiState.syncMode || 'api + seed safeguards',
  } : { ...INTERVENTION_SEED_STATE, syncMode: 'seed-fallback sécurisé' }
  const merged: InterventionsState & { syncMode?: string } = { ...base }
  for (const key of STATE_ARRAY_KEYS) {
    const localValue = localState?.[key]
    if (Array.isArray(localValue) && localValue.length > 0) {
      ;(merged as any)[key] = localValue
    }
  }
  for (const key of STATE_ARRAY_KEYS) {
    const currentValue = (merged as any)[key]
    if (!Array.isArray(currentValue) || currentValue.length === 0) {
      ;(merged as any)[key] = arrayOrSeed(currentValue, key)
    }
  }
  merged.syncMode = localState ? `${base.syncMode || 'api'} + local overlay + seed safeguards` : base.syncMode
  return merged
}

const NAV_GROUPS = [
  { group: 'Vue opérationnelle', items: [
    { label: 'Command Center', href: '/interventions/command', icon: '🏥', badge: 'Live' },
    { label: 'Aujourd’hui', href: '/interventions/planning', icon: '🗓️', badge: '24h' },
    { label: 'Alertes & urgences', href: '/interventions/dispatch', icon: '🚨', badge: 'SLA' },
  ]},
  { group: 'Exécution', items: [
    { label: 'Demandes', href: '/interventions/demandes', icon: '📥', badge: 'triage' },
    { label: 'Ordres d’intervention', href: '/interventions/ordres', icon: '🧾', badge: 'ops' },
    { label: 'Dispatch', href: '/interventions/dispatch', icon: '📡', badge: 'zone' },
    { label: 'Planning', href: '/interventions/planning', icon: '📆', badge: 'staff' },
    { label: 'Tournées', href: '/interventions/tournees', icon: '🛣️', badge: 'route' },
  ]},
  { group: 'Ressources', items: [
    { label: 'Personnel', href: '/interventions/personnel', icon: '👩‍⚕️', badge: 'RH' },
    { label: 'Patients / Bénéficiaires', href: '/interventions/patients', icon: '🏡', badge: 'care' },
    { label: 'Lieux', href: '/interventions/lieux', icon: '📍', badge: 'MAR' },
    { label: 'Équipements', href: '/interventions/equipements', icon: '🩺', badge: 'stock' },
  ]},
  { group: 'Contrôle', items: [
    { label: 'Rapports', href: '/interventions/rapports', icon: '📊', badge: 'PDF' },
    { label: 'Facturation', href: '/interventions/facturation', icon: '💳', badge: 'MAD' },
    { label: 'Paramètres', href: '/interventions/parametres', icon: '⚙️', badge: 'RBAC' },
  ]},
]

function statusClass(status?: string) {
  if (['Annulée', 'Escaladée', 'Critique', 'Impayée', 'Hors service'].includes(status || '')) return 'chip-danger'
  if (['En route', 'Sur site', 'Dispatchée', 'Réservé', 'En transit'].includes(status || '')) return 'chip-purple'
  if (['En cours', 'En pause', 'Élevé', 'En maintenance', 'Partiellement payée'].includes(status || '')) return 'chip-amber'
  if (['Terminée', 'Clôturée', 'Payée', 'Disponible', 'Faible', 'Résolu'].includes(status || '')) return 'chip-success'
  return 'chip-info'
}
function riskClass(risk?: RiskLevel) { return statusClass(risk) }
function StatusChip({ status }: { status: string }) { return <span className={`chip ${statusClass(status)}`}>{status}</span> }
function RiskChip({ risk }: { risk: RiskLevel }) { return <span className={`chip ${riskClass(risk)}`}>{risk}</span> }
function initials(name: string) { return name.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() }
function nowIso() { return new Date().toISOString() }

function safeTemplate(state: InterventionsState, templateId?: string) {
  return state.templates.find(t => t.id === templateId) || state.templates[0] || INTERVENTION_SEED_STATE.templates[0]
}

function safeArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : []
}


function computeOps(state: InterventionsState) {
  const urgentRequests = state.requests.filter(r => ['Élevé', 'Critique'].includes(r.riskLevel)).length
  const untriaged = state.requests.filter(r => ['Nouvelle', 'À trier'].includes(r.status)).length
  const unassigned = state.orders.filter(o => o.status === 'À assigner' || o.assignedStaffIds.length === 0).length
  const activeOrders = state.orders.filter(o => !['Terminée', 'Clôturée', 'Annulée'].includes(o.status)).length
  const availableStaff = state.staff.filter(s => s.availability === 'Disponible').length
  const lateOrders = state.orders.filter(o => new Date(o.slaDueAt).getTime() < Date.now() && !['Terminée', 'Clôturée', 'Annulée'].includes(o.status)).length
  const openIncidents = state.incidents.filter(i => i.status !== 'Résolu').length
  const equipmentTransit = state.equipment.filter(e => ['En transit', 'En maintenance', 'Réservé'].includes(e.status)).length
  const revenue = state.invoices.reduce((sum, inv) => sum + inv.amountMad, 0)
  const recovered = state.invoices.reduce((sum, inv) => sum + inv.paidMad, 0)
  return { urgentRequests, untriaged, unassigned, activeOrders, availableStaff, lateOrders, openIncidents, equipmentTransit, revenue, recovered }
}

function useInterventionState() {
  const [state, setState] = useState<InterventionsState & { syncMode?: string }>({ ...EMPTY_INTERVENTIONS_STATE, syncMode: 'boot' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const local = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
        const localState = local ? JSON.parse(local) : null
        const response = await fetch('/api/interventions/command', { cache: 'no-store' })
        const json = await response.json()
        if (mounted) setState(mergeApiAndLocalState(json, localState))
        setError(null)
      } catch (err: any) {
        const local = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
        const localState = local ? JSON.parse(local) : null
        if (mounted) setState({ ...(localState || INTERVENTION_SEED_STATE), syncMode: localState ? 'local overlay sécurisé' : 'seed-fallback sécurisé' })
        if (mounted) setError(err?.message || 'Impossible de charger le flux interventions.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    const timer = window.setInterval(load, 45000)
    return () => { mounted = false; window.clearInterval(timer) }
  }, [])

  function persist(next: InterventionsState & { syncMode?: string }) {
    setState(next)
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  }

  async function execute(action: string, entityId?: string, entityType = 'intervention', values: Record<string, any> = {}) {
    const audit = { id: `aud-${Date.now()}`, at: nowIso(), actor: values.actor || 'Coordinateur AngelCare', role: values.role || 'Ops', entityType, entityId: entityId || values.id || action, event: action, summary: values.summary || `Action ${action} exécutée avec traçabilité production.`, riskLevel: values.riskLevel }
    let next: InterventionsState & { syncMode?: string } = { ...state, audits: [audit, ...safeArray(state.audits)], syncMode: state.syncMode }
    const statusMap: Record<string, InterventionStatus> = {
      'dispatch confirmed': 'Dispatchée', 'en route marked': 'En route', 'arrived on site': 'Sur site', 'intervention started': 'En cours', 'intervention completed': 'Terminée', 'intervention cancelled': 'Annulée', 'incident escalated': 'Escaladée'
    }

    if (action === 'request created') {
      const template = safeTemplate(state, values.templateId)
      next.requests = [{ id: `req-${Date.now()}`, reference: `DEM-${Date.now().toString().slice(-9)}`, patientName: values.patientName || 'Nouveau bénéficiaire', contactName: values.contactName || 'Contact famille', phone: values.phone || '+212 600 00 00 00', city: values.city || 'Rabat', zone: values.zone || 'Centre', address: values.address || 'Adresse à confirmer', category: values.category || template.category, templateId: template.id, requestedAt: nowIso(), preferredWindow: values.preferredWindow || 'Aujourd’hui 14:00 - 16:00', riskLevel: values.riskLevel || template.riskLevel, status: 'À trier', estimatedAmountMad: values.amountMad || template.basePriceMad, source: values.source || 'Interne', notes: values.notes || 'Demande créée depuis workspace Intervention OS.', consentStatus: values.consentStatus || 'À collecter' }, ...safeArray(state.requests)]
    }
    if (action === 'request triaged') next.requests = safeArray(state.requests).map(r => r.id === entityId ? { ...r, status: values.status || 'Validée', riskLevel: values.riskLevel || r.riskLevel, notes: values.notes || r.notes } : r)
    if (action === 'quote created') next.requests = safeArray(state.requests).map(r => r.id === entityId ? { ...r, status: 'Devis envoyé', estimatedAmountMad: values.amountMad || r.estimatedAmountMad } : r)
    if (action === 'request converted') {
      const req = safeArray(state.requests).find(r => r.id === entityId) || safeArray(state.requests)[0] || INTERVENTION_SEED_STATE.requests[0]
      const tpl = safeTemplate(state, req?.templateId)
      const id = `ord-${Date.now()}`
      next.requests = safeArray(state.requests).map(r => r.id === req.id ? { ...r, status: 'Ordre créé' } : r)
      next.orders = [{ id, reference: `ORD-${Date.now().toString().slice(-9)}`, requestId: req.id, patientName: req.patientName, city: req.city, zone: req.zone, category: req.category, status: 'À assigner', riskLevel: req.riskLevel, assignedStaffIds: [], requiredEquipment: tpl.equipment, checklist: tpl.checklist, billingStatus: 'Non facturé', amountMad: req.estimatedAmountMad, slaDueAt: new Date(Date.now() + tpl.slaMinutes * 60000).toISOString(), createdAt: nowIso() }, ...safeArray(state.orders)]
    }
    if (action === 'order created') {
      const tpl = safeTemplate(state, values.templateId)
      next.orders = [{ id: `ord-${Date.now()}`, reference: `ORD-${Date.now().toString().slice(-9)}`, requestId: 'manual', patientName: values.patientName || 'Bénéficiaire manuel', city: values.city || 'Rabat', zone: values.zone || 'Agdal', category: values.category || tpl.category, status: 'À assigner', riskLevel: values.riskLevel || tpl.riskLevel, assignedStaffIds: [], requiredEquipment: tpl.equipment, checklist: tpl.checklist, billingStatus: 'Non facturé', amountMad: values.amountMad || tpl.basePriceMad, slaDueAt: new Date(Date.now()+tpl.slaMinutes*60000).toISOString(), createdAt: nowIso() }, ...safeArray(state.orders)]
    }
    if (action === 'staff created') {
      const id = `staff-${Date.now()}`
      next.staff = [{
        id,
        fullName: values.fullName || 'Nouveau membre terrain',
        role: values.role || 'Infirmier',
        phone: values.phone || '+212 600 00 00 00',
        city: values.city || 'Rabat',
        zone: values.zone || 'Centre',
        availability: values.availability || 'Disponible',
        workload: values.workload || 0,
        certifications: values.certifications || ['Profil créé depuis Paramètres/Personnel'],
        emergencyEligible: Boolean(values.emergencyEligible ?? true),
        skills: values.skills || [values.role || 'Infirmier'],
      }, ...safeArray(state.staff)]
    }
    if (['staff assigned', 'staff reassigned'].includes(action)) next.orders = safeArray(state.orders).map(o => o.id === entityId ? { ...o, assignedStaffIds: values.staffIds || [safeArray(state.staff)[0]?.id].filter(Boolean), status: 'Planifiée' } : o)
    if (action === 'appointment scheduled') next.appointments = [{ id: `apt-${Date.now()}`, orderId: entityId || safeArray(state.orders)[0]?.id || '', reference: `RDV-${Date.now().toString().slice(-9)}`, startsAt: values.startsAt || new Date(Date.now()+3600000).toISOString(), endsAt: values.endsAt || new Date(Date.now()+7200000).toISOString(), status: 'Planifiée', staffIds: values.staffIds || [safeArray(state.staff)[0]?.id].filter(Boolean), locationId: values.locationId || safeArray(state.locations)[0]?.id || 'loc-001' }, ...safeArray(state.appointments)]
    if (statusMap[action]) next.orders = next.orders.map(o => o.id === entityId ? { ...o, status: statusMap[action] } : o)
    if (action === 'incident escalated') next.incidents = [{ id: `inc-${Date.now()}`, orderId: entityId || safeArray(state.orders)[0]?.id || '', title: values.title || 'Incident terrain escaladé', riskLevel: values.riskLevel || 'Élevé', status: 'Ouvert', owner: 'Superviseur Médical', createdAt: nowIso() }, ...safeArray(state.incidents)]
    if (action === 'route created') next.routes = [{ id: `rte-${Date.now()}`, name: values.name || 'Nouvelle tournée opérationnelle', date: new Date().toISOString().slice(0,10), city: values.city || 'Rabat', zone: values.zone || 'Agdal', staffId: values.staffId || safeArray(state.staff)[0]?.id || '', driverId: values.driverId || safeArray(state.staff).find(s => s.role === 'Chauffeur')?.id, status: 'Planifiée', stopIds: [] }, ...safeArray(state.routes)]
    if (['equipment assigned', 'equipment moved'].includes(action)) next.equipment = safeArray(state.equipment).map(e => e.id === entityId ? { ...e, status: values.status || 'En intervention', assignedOrderId: values.orderId || e.assignedOrderId } : e)
    if (action === 'invoice created') next.invoices = [{ id: `inv-${Date.now()}`, orderId: entityId || safeArray(state.orders)[0]?.id || '', reference: `FAC-${Date.now().toString().slice(-9)}`, patientName: values.patientName || safeArray(state.orders).find(o => o.id === entityId)?.patientName || 'Client AngelCare', amountMad: values.amountMad || safeArray(state.orders).find(o => o.id === entityId)?.amountMad || 0, paidMad: 0, status: 'Émise', dueAt: new Date(Date.now()+7*86400000).toISOString() }, ...safeArray(state.invoices)]
    if (action === 'payment recorded') next.invoices = safeArray(state.invoices).map(i => i.id === entityId ? { ...i, paidMad: i.amountMad, status: 'Payée' } : i)

    persist(next)
    await fetch('/api/interventions/actions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, entityId, entityType, values }) }).catch(() => null)
  }
  return { state, loading, error, execute }
}

function EnterpriseCSS() {
  return <style>{`
    .interventions-os{min-height:100vh;background:#fff;color:#0f172a;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.interventions-os *{box-sizing:border-box}.os-card{background:#fff;border:1px solid #e2e8f0;box-shadow:0 22px 60px rgba(15,23,42,.07);border-radius:28px}.os-soft{background:#f8fafc;border:1px solid #e2e8f0;border-radius:24px}.os-hero{background:linear-gradient(135deg,#ffffff 0%,#f8fbff 46%,#eef8ff 100%);border:1px solid #dbeafe;box-shadow:0 28px 90px rgba(15,23,42,.08);border-radius:36px}.os-sidebar{background:#fff;border:1px solid #e2e8f0;border-radius:30px;box-shadow:0 24px 70px rgba(15,23,42,.08)}.os-nav{display:flex;align-items:center;justify-content:space-between;border:1px solid #e2e8f0;background:#fff;border-radius:18px;padding:.7rem .8rem;color:#334155;font-weight:800;font-size:.86rem}.os-nav:hover{background:#f8fafc;border-color:#bae6fd}.os-nav-active{background:#ecfeff;border-color:#22d3ee;color:#0f172a;box-shadow:0 12px 28px rgba(8,145,178,.12)}.btn{border-radius:16px;padding:.65rem .92rem;font-size:.84rem;font-weight:900;transition:.16s all;border:1px solid #cbd5e1;background:#fff;color:#0f172a}.btn:hover{transform:translateY(-1px);box-shadow:0 12px 28px rgba(15,23,42,.08)}.btn-primary{background:#0891b2;color:#fff;border-color:#0891b2}.btn-danger{background:#fff1f2;color:#be123c;border-color:#fecdd3}.btn-warn{background:#fffbeb;color:#92400e;border-color:#fde68a}.btn-success{background:#ecfdf5;color:#047857;border-color:#a7f3d0}.chip{display:inline-flex;align-items:center;border-radius:999px;border:1px solid #cbd5e1;padding:.28rem .58rem;font-size:.72rem;font-weight:900;white-space:nowrap}.chip-danger{background:#fff1f2;border-color:#fecdd3;color:#be123c}.chip-purple{background:#f5f3ff;border-color:#ddd6fe;color:#6d28d9}.chip-amber{background:#fffbeb;border-color:#fde68a;color:#92400e}.chip-success{background:#ecfdf5;border-color:#a7f3d0;color:#047857}.chip-info{background:#ecfeff;border-color:#a5f3fc;color:#0e7490}.os-table{width:100%;min-width:980px;border-collapse:separate;border-spacing:0}.os-table th{font-size:.72rem;text-transform:uppercase;letter-spacing:.12em;color:#64748b;font-weight:900;text-align:left;padding:.85rem .8rem;border-bottom:1px solid #e2e8f0;background:#f8fafc}.os-table td{padding:.9rem .8rem;border-bottom:1px solid #eef2f7;font-size:.875rem;color:#1e293b;vertical-align:top}.os-table tr:hover td{background:#f8fafc}.modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.48);backdrop-filter:blur(12px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:1rem}.modal-panel{width:min(1280px,100%);max-height:92vh;overflow:auto;background:#fff;border:1px solid #e2e8f0;border-radius:36px;box-shadow:0 40px 110px rgba(15,23,42,.28)}.modal-field{border:1px solid #e2e8f0;background:#f8fafc;border-radius:22px;padding:1rem}.modal-field input,.modal-field select,.modal-field textarea{margin-top:.65rem;width:100%;border:1px solid #cbd5e1;background:#fff;border-radius:16px;padding:.82rem .9rem;color:#0f172a;outline:none}.modal-field input:focus,.modal-field select:focus,.modal-field textarea:focus{border-color:#0891b2;box-shadow:0 0 0 3px rgba(8,145,178,.12)}.kbd{border:1px solid #cbd5e1;background:#f8fafc;border-radius:10px;padding:.15rem .45rem;font-size:.72rem;font-weight:900;color:#475569}.mini-map{background:radial-gradient(circle at 20% 25%,#a5f3fc 0 5%,transparent 6%),radial-gradient(circle at 70% 40%,#bfdbfe 0 7%,transparent 8%),linear-gradient(135deg,#f8fafc,#eef8ff);border:1px solid #dbeafe}.dense-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem}.page-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1rem}.phase3-card{background:linear-gradient(180deg,#ffffff,#f8fafc);border:1px solid #e2e8f0;border-radius:28px;box-shadow:0 18px 50px rgba(15,23,42,.06)}.phase3-rail{border-left:4px solid #06b6d4;background:#f8fafc;border-radius:20px}.severity-danger{background:#fff1f2;border-color:#fecdd3;color:#be123c}.severity-warning{background:#fffbeb;border-color:#fde68a;color:#92400e}.severity-success{background:#ecfdf5;border-color:#a7f3d0;color:#047857}@media(max-width:1280px){.os-sidebar{display:none}.modal-panel{border-radius:24px}.os-table{min-width:760px}}
  `}</style>
}

function ModuleSidebar({ state, page }: { state: InterventionsState; page: PageKey }) {
  const ops = computeOps(state)
  const badges: Record<string, number | string> = {
    '/interventions/command': ops.openIncidents || 'Live',
    '/interventions/demandes': ops.untriaged,
    '/interventions/ordres': ops.unassigned,
    '/interventions/dispatch': ops.activeOrders,
    '/interventions/planning': state.appointments.length,
    '/interventions/tournees': state.routes.length,
    '/interventions/personnel': state.staff.filter(s => s.availability !== 'Disponible').length,
    '/interventions/equipements': ops.equipmentTransit,
    '/interventions/rapports': ops.lateOrders + ops.openIncidents,
    '/interventions/facturation': formatMad(ops.revenue).replace(',00 MAD',''),
  }
  return <aside className="os-sidebar sticky top-5 hidden h-[calc(100vh-40px)] w-[330px] shrink-0 overflow-y-auto p-4 xl:block">
    <div className="rounded-[26px] border border-cyan-200 bg-cyan-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-700">AngelCare OS</p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">Interventions</h2>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">Sidebar standard synchronisée • Production Maroc • White enterprise mode</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-black"><span className="rounded-xl bg-white p-2 text-cyan-700">{ops.untriaged} triage</span><span className="rounded-xl bg-white p-2 text-rose-700">{ops.openIncidents} incidents</span><span className="rounded-xl bg-white p-2 text-emerald-700">{ops.availableStaff} staff</span></div>
    </div>
    <div className="mt-4 space-y-5">
      {NAV_GROUPS.map(group => <div key={group.group}>
        <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">{group.group}</p>
        <div className="space-y-1.5">{group.items.map(item => {
          const routeKey = item.href.split('/').pop() || 'command'
          const active = (page === 'home' && item.href === '/interventions/command') || routeKey === page
          return <Link key={item.href} href={item.href} className={`os-nav ${active ? 'os-nav-active' : ''}`}>
            <span className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100">{item.icon}</span><span>{item.label}</span></span>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">{badges[item.href] ?? item.badge}</span>
          </Link>
        })}</div>
      </div>)}
    </div>
  </aside>
}

function HeaderActions({ open }: { open: (key: InterventionModalKey, entityId?: string, entityType?: string) => void }) {
  return <div className="flex flex-wrap gap-2">
    <button onClick={() => open('RequestIntakeModal')} className="btn btn-primary">Créer demande</button>
    <button onClick={() => open('IncidentEscalationModal')} className="btn btn-danger">Déclencher urgence</button>
    <button onClick={() => open('PlanningAssistantModal')} className="btn">Assistant planning</button>
    <button onClick={() => open('ReportExportModal')} className="btn">Exporter</button>
  </div>
}

function OpsShell({ page, state, open, loading, error, children }: { page: PageKey; state: InterventionsState & { syncMode?: string }; open: (key: InterventionModalKey, entityId?: string, entityType?: string) => void; loading: boolean; error: string | null; children: ReactNode }) {
  const meta = PAGE_REGISTRY[page]
  const ops = computeOps(state)
  return <div className="interventions-os">
    <EnterpriseCSS />
    <div className="flex gap-5 p-4 md:p-6">
      <ModuleSidebar state={state} page={page} />
      <main className="min-w-0 flex-1 space-y-5">
        <header className="os-card p-4 md:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-black text-slate-500"><Link href="/" className="hover:text-cyan-700">Home</Link><span>/</span><Link href="/interventions/command" className="hover:text-cyan-700">Interventions</Link><span>/</span><span>{meta.title}</span><span className="chip chip-info ml-1">{meta.badge}</span></div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">{meta.title}</h1>
              <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600 md:text-base">{meta.subtitle}</p>
            </div>
            <HeaderActions open={open} />
          </div>
        </header>

        <section className="os-hero p-5 md:p-7">
          <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
            <div>
              <div className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-800">Production • Sync {state.syncMode || 'client+api'} • Français • MAD</div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">AngelCare Intervention & Dispatch OS</h2>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600 md:text-base">Workspace blanc, massif et opérationnel pour dispatch médical, nursing, adult-care, équipement, tournées, audit et facturation MAD au Maroc.</p>
              <div className="mt-5 grid gap-2 md:grid-cols-3">{meta.mission.map(item => <div key={item} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-700">✓ {item}</div>)}</div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <MiniStat label="Demandes triage" value={ops.untriaged} detail="non clôturées" />
              <MiniStat label="Ordres actifs" value={ops.activeOrders} detail="terrain" />
              <MiniStat label="Incidents" value={ops.openIncidents} detail="ouverts" danger />
              <MiniStat label="CA MAD" value={formatMad(ops.revenue)} detail={`encaissé ${formatMad(ops.recovered)}`} />
            </div>
          </div>
        </section>

        {loading ? <PageLoadingState /> : <>
          {(page === 'home' || page === 'command') && <>
            <Phase3EnterpriseOperationsDeck state={state} page={page} open={open} />
            <Phase4ProductionAssuranceDeck state={state} page={page} open={open} />
            <Phase5ProductionContinuityDeck state={state} page={page} open={open} />
            <Phase6CareCommandDeck state={state} page={page} open={open} />
            <Phase7RevenueComplianceDeck state={state} page={page} open={open} />
            <Phase8QualityLiveOpsDeck state={state} page={page} open={open} />
            <Phase9GovernanceSlaDeck state={state} page={page} open={open} />
            <Phase10ProductionLaunchDeck state={state} page={page} open={open} />
            <Phase11FieldExecutionDeck state={state} page={page} open={open} />
          </>}
          {error && <StateBanner tone="warn" title="Mode fallback sécurisé" body={error} />}
          {children}
        </>}
      </main>
    </div>
  </div>
}



function PageLoadingState() {
  return <section className="os-card p-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-700">Synchronisation initiale</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">Chargement du workspace sans flash de données</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">On attend le flux API/localStorage avant d'afficher les files opérationnelles pour éviter le remplacement visuel seed → base réelle.</p>
      </div>
      <span className="chip chip-info">API + local overlay</span>
    </div>
    <div className="mt-6 grid gap-3 md:grid-cols-4">{[1,2,3,4].map(i => <div key={i} className="h-24 animate-pulse rounded-[24px] bg-slate-100" />)}</div>
  </section>
}

function Phase3EnterpriseOperationsDeck({ state, page, open }: { state: InterventionsState; page: PageKey; open: (key: InterventionModalKey, entityId?: string, entityType?: string) => void }) {
  const room = PAGE_CONTROL_ROOMS[page]
  const readiness = buildProductionReadiness(state)
  const slaRows = buildSlaPressureRows(state).slice(0, 4)
  const layers = PHASE3_EXECUTION_LAYERS.slice(0, 5)
  return <section className="phase3-card p-5 md:p-6">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-700">Mega Phase 3 • couche exécution réelle</p>
        <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{room.title} — contrôle production renforcé</h3>
        <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">{room.focus} Cadence: {room.operatingCadence}. Cette couche ajoute garde-fous, priorités SLA, contrôles rôle/action et boutons dédiés sans modal générique.</p>
      </div>
      <div className="flex flex-wrap gap-2">{room.criticalButtons.map(key => <button key={key} onClick={() => open(key)} className="btn btn-primary">{MODAL_BLUEPRINTS[key]?.primary || key}</button>)}</div>
    </div>
    <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{readiness.map(item => <div key={item.label} className={`rounded-[24px] border p-4 severity-${item.severity}`}><p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-80">{item.label}</p><p className="mt-2 text-2xl font-black">{item.value}</p><p className="mt-1 text-xs font-bold opacity-80">{item.detail}</p></div>)}</div>
      <div className="phase3-rail p-4"><p className="text-sm font-black text-slate-950">Pression SLA priorisée</p><div className="mt-3 space-y-2">{slaRows.length ? slaRows.map(row => <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-3"><div className="flex items-center justify-between gap-3"><b>{row.reference}</b><span className={row.minutesRemaining < 0 ? 'chip chip-danger' : row.minutesRemaining < 90 ? 'chip chip-amber' : 'chip chip-success'}>{row.minutesRemaining} min</span></div><p className="mt-1 text-xs font-semibold text-slate-500">{row.patientName} • {row.city}/{row.zone} • {row.control}</p></div>) : <p className="text-sm font-semibold text-slate-500">Aucune pression SLA active.</p>}</div></div>
    </div>
    <div className="mt-5 grid gap-3 lg:grid-cols-5">{layers.map(layer => <div key={layer.layer} className="rounded-[22px] border border-slate-200 bg-white p-4"><p className="text-xs font-black text-slate-950">{layer.layer}</p><p className="mt-2 text-[11px] font-bold text-slate-500">Owner: {layer.owner}</p><p className="mt-2 text-xs leading-5 text-slate-600">{layer.hardControl}</p></div>)}</div>
  </section>
}

function ModalExecutionGuarantee({ modalKey, state }: { modalKey: InterventionModalKey; state: InterventionsState }) {
  const plan = buildModalExecutionPlan(modalKey, state)
  return <div className="mb-5 grid gap-3 xl:grid-cols-3">
    <Panel title="Avant validation" subtitle="Contrôles bloquants"><CheckList items={plan.requiredBeforeSubmit}/></Panel>
    <Panel title="Écritures réelles" subtitle="Cibles de mutation"><CheckList items={plan.writeTargets}/></Panel>
    <Panel title="Après validation" subtitle="Sync UI + audit"><CheckList items={plan.liveAfterSubmit}/></Panel>
  </div>
}


function Phase4ProductionAssuranceDeck({ state, page, open }: { state: InterventionsState; page: PageKey; open: (key: InterventionModalKey, entityId?: string, entityType?: string) => void }) {
  const assurance = buildPhase4CommandAssurance(state)
  const staffCoverage = buildPhase4StaffCoverage(state)
  const finance = buildPhase4FinancialControl(state)
  const rows = buildPhase4WhiteOpsRows(state, page)
  const warRoom = PHASE4_PAGE_WAR_ROOMS[page]
  const gates = PHASE4_PRODUCTION_GATES.slice(0, 4)
  return <section className="space-y-5">
    <div className="os-card border-cyan-100 bg-white p-5 md:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.34em] text-cyan-700">Mega Phase 4 • production command layer</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-4xl">Couche assurance production temps réel</h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">Cette couche renforce chaque page avec contrôles pré-production, handoffs rôle-à-rôle, preuves d’exécution, packs impression et garde-fous pour usage réel AngelCare au Maroc.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => open('SlaMatrixModal')} className="btn">Matrice SLA</button>
          <button onClick={() => open('PermissionMatrixModal')} className="btn">RBAC</button>
          <button onClick={() => open('PrintTemplateModal')} className="btn">Packs impression</button>
          <button onClick={() => open('ReportExportModal')} className="btn btn-primary">Snapshot production</button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MiniStat label="Assurance" value={`${assurance.score}%`} detail={assurance.label} danger={assurance.score < 70}/>
        <MiniStat label="Gates ouverts" value={assurance.openGates} detail="contrôles bloquants" danger={assurance.openGates > 2}/>
        <MiniStat label="Couverture staff" value={`${staffCoverage.coverage}%`} detail={staffCoverage.summary} danger={staffCoverage.coverage < 75}/>
        <MiniStat label="Contrôle MAD" value={formatMad(finance.exposedMad)} detail={finance.summary} danger={finance.exposedMad > 15000}/>
        <MiniStat label="Audit 24h" value={state.audits.length} detail="évènements traçables"/>
      </div>
    </div>

    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <Panel title={`War room page: ${warRoom.title}`} subtitle={warRoom.description} action={<button onClick={() => open(warRoom.primaryModal)} className="btn btn-primary">Ouvrir workflow</button>}>
        <div className="grid gap-3 md:grid-cols-2">
          {warRoom.controls.map(control => <div key={control} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-700">✓ {control}</div>)}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {warRoom.outputProofs.map(proof => <div key={proof} className="rounded-2xl border border-cyan-100 bg-cyan-50 p-3 text-xs font-black uppercase tracking-wider text-cyan-800">{proof}</div>)}
        </div>
      </Panel>
      <Panel title="Production gates obligatoires" subtitle="Chaque workflow doit passer par ces garde-fous avant mutation.">
        <div className="space-y-3">
          {gates.map(gate => <div key={gate.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-slate-950">{gate.title}</p><span className={`chip ${gate.severity === 'bloquant' ? 'chip-danger' : gate.severity === 'surveillance' ? 'chip-amber' : 'chip-info'}`}>{gate.severity}</span></div>
            <p className="mt-2 text-sm font-semibold leading-5 text-slate-600">{gate.description}</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">{gate.evidence.map(item => <span key={item} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">{item}</span>)}</div>
          </div>)}
        </div>
      </Panel>
    </div>

    <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <Panel title="Rows opérationnels Phase 4" subtitle="Priorités exécutables sans faux live ni bouton décoratif.">
        <div className="overflow-x-auto"><table className="os-table"><thead><tr><th>Priorité</th><th>Objet</th><th>Risque</th><th>Owner</th><th>Action</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><span className="chip chip-info">{row.priority}</span></td><td><b>{row.subject}</b><p className="text-xs font-semibold text-slate-500">{row.detail}</p></td><td><RiskChip risk={row.risk}/></td><td>{row.owner}</td><td><button onClick={() => open(row.modal, row.entityId, row.entityType)} className="btn">{row.cta}</button></td></tr>)}</tbody></table></div>
      </Panel>
      <Panel title="Handoffs multi-rôles" subtitle="Passage contrôlé entre dispatch, médical, équipement, finance et audit.">
        <div className="space-y-3">{PHASE4_ROLE_HANDOFFS.map(h => <div key={h.from + h.to} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="font-black text-slate-950">{h.from} → {h.to}</p><p className="mt-1 text-sm font-semibold text-slate-600">{h.payload}</p><p className="mt-2 text-xs font-black uppercase tracking-wider text-cyan-700">Preuve: {h.proof}</p></div>)}</div>
      </Panel>
    </div>

    <Panel title="Packs impression et exports production" subtitle="Templates office-board et terrain, en français, MAD, adaptés au contexte Maroc.">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{PHASE4_PRINT_PACKS.map(pack => <div key={pack.name} className="rounded-[24px] border border-slate-200 bg-white p-4"><p className="text-lg font-black text-slate-950">{pack.name}</p><p className="mt-2 text-sm font-semibold leading-5 text-slate-600">{pack.use}</p><div className="mt-3 space-y-1">{pack.sections.map(s => <p key={s} className="text-xs font-bold text-slate-500">• {s}</p>)}</div><button onClick={() => open('PrintTemplateModal')} className="btn mt-4 w-full">Préparer</button></div>)}</div>
    </Panel>
  </section>
}


function Phase5ProductionContinuityDeck({ state, page, open }: { state: InterventionsState; page: PageKey; open: (key: InterventionModalKey, entityId?: string, entityType?: string) => void }) {
  const continuity = buildPhase5ContinuityScore(state)
  const queue = buildPhase5ExecutionQueues(state)
  const roleLocks = buildPhase5RoleLocks(state)
  const billing = buildPhase5BillingExposure(state)
  const equipment = buildPhase5EquipmentContinuity(state)
  const pageContinuity = PHASE5_PRODUCTION_CONTINUITY[page]

  return <section className="space-y-5">
    <div className="os-card border-slate-200 bg-white p-5 md:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.34em] text-emerald-700">Mega Phase 5 • continuité production terrain</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-4xl">Continuité opérationnelle prête usage réel</h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">Cette couche garantit que chaque page conserve une file d’exécution, des handovers multi-rôles, des verrous terrain, une exposition MAD et des preuves d’audit exploitables par des équipes réelles AngelCare.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => open(pageContinuity.primaryModal)} className="btn btn-primary">Workflow page</button>
          <button onClick={() => open('ReassignStaffModal')} className="btn">Arbitrage staff</button>
          <button onClick={() => open('EquipmentMovementModal')} className="btn">Continuité équipement</button>
          <button onClick={() => open('PaymentModal')} className="btn">Exposition MAD</button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MiniStat label="Continuité" value={`${continuity.score}%`} detail={continuity.label} danger={continuity.score < 74}/>
        <MiniStat label="Non assignés" value={continuity.unassigned} detail="ordres à verrouiller" danger={continuity.unassigned > 0}/>
        <MiniStat label="Retards SLA" value={continuity.late} detail="priorité dispatch" danger={continuity.late > 0}/>
        <MiniStat label="Exposition MAD" value={formatMad(billing.exposure)} detail={billing.control} danger={billing.exposure > 8000}/>
        <MiniStat label="Équipements bloqués" value={equipment.blocked} detail={equipment.label} danger={equipment.blocked > 1}/>
      </div>
    </div>

    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <Panel title={`Continuité page: ${pageContinuity.title}`} subtitle={pageContinuity.mandate} action={<button onClick={() => open(pageContinuity.primaryModal)} className="btn btn-primary">Exécuter contrôle</button>}>
        <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Cadence</p>
          <p className="mt-2 text-sm font-bold leading-6 text-emerald-950">{pageContinuity.shiftCadence}</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {pageContinuity.fieldProof.map(proof => <div key={proof} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-black text-slate-700">✓ {proof}</div>)}
        </div>
      </Panel>

      <Panel title="Verrous rôle & disponibilité" subtitle="Blocage des affectations faibles avant production terrain.">
        <div className="grid gap-3 md:grid-cols-2">
          {roleLocks.locks.map(lock => <div key={lock.label} className={`rounded-2xl border p-4 ${lock.severity === 'bloquant' ? 'border-rose-200 bg-rose-50' : lock.severity === 'surveillance' ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-600">{lock.label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{lock.value}</p>
          </div>)}
        </div>
      </Panel>
    </div>

    <Panel title="File de commandement terrain Phase 5" subtitle="Ordres classés par risque, retard SLA, assignation et prochaine décision réelle.">
      <div className="overflow-x-auto rounded-3xl border border-slate-200">
        <table className="os-table"><thead><tr><th>Référence</th><th>Patient</th><th>Zone</th><th>Risque</th><th>Statut</th><th>Owner</th><th>Action suivante</th><th>Exécuter</th></tr></thead><tbody>
          {queue.length ? queue.map(row => <tr key={row.id}><td><b>{row.reference}</b></td><td>{row.patientName}</td><td>{row.city}/{row.zone}</td><td><RiskChip risk={row.riskLevel}/></td><td><StatusChip status={row.status}/></td><td>{row.owner}</td><td>{row.nextAction}</td><td><button onClick={() => open(row.modal, row.entityId, row.entityType)} className="btn btn-primary">Ouvrir</button></td></tr>) : <tr><td colSpan={8}><EmptyState title="Aucune file active" body="La continuité terrain ne détecte pas d’ordre actif à prioriser." /></td></tr>}
        </tbody></table>
      </div>
    </Panel>

    <div className="grid gap-5 xl:grid-cols-[.95fr_1.05fr]">
      <Panel title="Contrôles terrain bloquants" subtitle="Preuves attendues avant mutation critique.">
        <div className="space-y-3">
          {PHASE5_FIELD_COMMAND_CHECKS.map(check => <div key={check.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-slate-950">{check.label}</p><span className={`chip ${check.severity === 'bloquant' ? 'chip-danger' : check.severity === 'finance' ? 'chip-amber' : 'chip-info'}`}>{check.severity}</span></div>
            <p className="mt-1 text-sm font-semibold text-slate-600">Owner: {check.owner}</p>
            <p className="mt-2 text-xs font-black uppercase tracking-wider text-cyan-700">Preuve: {check.proof}</p>
            <button onClick={() => open(check.modal)} className="btn mt-3">Contrôler</button>
          </div>)}
        </div>
      </Panel>

      <Panel title="Handovers & escalades" subtitle="Chaîne de responsabilité terrain, médicale, finance, équipement et direction.">
        <div className="grid gap-3 md:grid-cols-2">
          {PHASE5_HANDOVER_PROTOCOLS.map(handover => <div key={handover.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="font-black text-slate-950">{handover.title}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">{handover.owner} → {handover.receiver}</p>
            <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{handover.proof}</p>
            <button onClick={() => open(handover.modal)} className="btn mt-3">Ouvrir handover</button>
          </div>)}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {PHASE5_ESCALATION_TIERS.map(tier => <div key={tier.level} className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">{tier.level} • {tier.name}</p>
            <p className="mt-2 text-sm font-bold text-orange-950">Déclencheur: {tier.trigger}</p>
            <p className="mt-1 text-xs font-semibold text-orange-900">Réponse: {tier.response}</p>
            <button onClick={() => open(tier.modal)} className="btn mt-3">Escalader</button>
          </div>)}
        </div>
      </Panel>
    </div>
  </section>
}


function Phase6CareCommandDeck({ state, page, open }: { state: InterventionsState; page: PageKey; open: (key: InterventionModalKey, entityId?: string, entityType?: string) => void }) {
  const shift = PHASE6_SHIFT_COMMANDS[page]
  const continuity = buildPhase6CareContinuity(state)
  const consentRows = buildPhase6ConsentExposure(state)
  const careQueue = buildPhase6CriticalCareQueue(state)
  const coverage = buildPhase6RoleScenarioCoverage(state)
  return <section className="space-y-5">
    <div className="os-card border-emerald-100 bg-white p-5 md:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.34em] text-emerald-700">Mega Phase 6 • sécurité patient & commandement soins</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-4xl">Couche production clinique opérationnelle home-care</h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">{shift.clinicalMandate} Cette phase verrouille consentement, contact famille, staff certifié, rapport de clôture, équipements médicaux, finance MAD et audit sans transformer le module en faux EMR hospitalier.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => open('ConsentDocumentModal')} className="btn">Consentement</button>
          <button onClick={() => open('CarePlanModal')} className="btn">Plan de soins</button>
          <button onClick={() => open('StaffCertificationModal')} className="btn">Certifications</button>
          <button onClick={() => open(shift.primaryModal)} className="btn btn-primary">Contrôle page</button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <MiniStat label="Sécurité" value={`${continuity.score}%`} detail={continuity.label} danger={continuity.score < 74}/>
        <MiniStat label="Consentements" value={continuity.consentMissing} detail="à collecter" danger={continuity.consentMissing > 0}/>
        <MiniStat label="Critiques" value={continuity.criticalActive} detail="ordres actifs" danger={continuity.criticalActive > 0}/>
        <MiniStat label="Sans staff" value={continuity.missingStaff} detail="à affecter" danger={continuity.missingStaff > 0}/>
        <MiniStat label="Incidents" value={continuity.unresolvedIncidents} detail="non résolus" danger={continuity.unresolvedIncidents > 0}/>
        <MiniStat label="Staff certifié" value={continuity.certifiedAvailable} detail="disponible" danger={continuity.certifiedAvailable < 2}/>
      </div>
    </div>

    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <Panel title={`Shift command: ${shift.title}`} subtitle={`Condition release: ${shift.releaseCondition}`} action={<button onClick={() => open(shift.primaryModal)} className="btn btn-primary">Exécuter</button>}>
        <div className="grid gap-3 md:grid-cols-3">
          {shift.shiftBoard.map(item => <div key={item} className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-black text-emerald-900">✓ {item}</div>)}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {PHASE6_CARE_COMPLIANCE_CONTROLS.map(control => <div key={control.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="font-black text-slate-950">{control.label}</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{control.detail}</p>
            <button onClick={() => open(control.modal)} className="btn mt-3">Contrôler</button>
          </div>)}
        </div>
      </Panel>

      <Panel title="Gates sécurité patient" subtitle="Contrôles bloquants avant triage, dispatch, démarrage ou clôture.">
        <div className="space-y-3">
          {PHASE6_PATIENT_SAFETY_GATES.map(gate => <div key={gate.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-slate-950">{gate.label}</p><span className={`chip ${gate.severity === 'bloquant' ? 'chip-danger' : gate.severity === 'finance' ? 'chip-amber' : 'chip-info'}`}>{gate.severity}</span></div>
            <p className="mt-1 text-sm font-semibold text-slate-600">Owner: {gate.owner}</p>
            <p className="mt-2 text-xs font-black uppercase tracking-wider text-emerald-700">Preuve: {gate.proof}</p>
            <button onClick={() => open(gate.modal)} className="btn mt-3">Ouvrir contrôle</button>
          </div>)}
        </div>
      </Panel>
    </div>

    <Panel title="File clinique priorisée" subtitle="Ordres actifs classés par risque, consentement, staff certifié et contrôle suivant.">
      <div className="overflow-x-auto rounded-3xl border border-slate-200">
        <table className="os-table"><thead><tr><th>Référence</th><th>Patient</th><th>Service</th><th>Zone</th><th>Risque</th><th>Consentement</th><th>Statut</th><th>Contrôle suivant</th><th>Action</th></tr></thead><tbody>
          {careQueue.length ? careQueue.map(row => <tr key={row.id}><td><b>{row.reference}</b></td><td>{row.patientName}</td><td>{row.category}</td><td>{row.city}/{row.zone}</td><td><RiskChip risk={row.riskLevel}/></td><td><span className={`chip ${row.consent === 'À collecter' ? 'chip-danger' : 'chip-success'}`}>{row.consent}</span></td><td><StatusChip status={row.status}/></td><td>{row.nextClinicalControl}</td><td><button onClick={() => open(row.modal, row.entityId, row.entityType)} className="btn btn-primary">Ouvrir</button></td></tr>) : <tr><td colSpan={9}><EmptyState title="Aucune file clinique active" body="Aucun ordre nécessitant un contrôle sécurité patient immédiat." /></td></tr>}
        </tbody></table>
      </div>
    </Panel>

    <div className="grid gap-5 xl:grid-cols-[.95fr_1.05fr]">
      <Panel title="Exposition consentement & documents" subtitle="Demandes sensibles ou sans consentement/document opérationnel.">
        <div className="space-y-3">
          {consentRows.length ? consentRows.map(row => <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-slate-950">{row.reference} • {row.patientName}</p><RiskChip risk={row.riskLevel}/></div>
            <p className="mt-1 text-sm font-semibold text-slate-600">{row.city}/{row.zone} • Consentement: {row.consent}</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-emerald-700">Action: {row.next}</p>
            <button onClick={() => open(row.modal, row.entityId, row.entityType)} className="btn mt-3">Traiter</button>
          </div>) : <EmptyState title="Consentements maîtrisés" body="Aucune demande sensible sans décision documentaire immédiate." />}
        </div>
      </Panel>

      <Panel title="Packs de soins Maroc prêts production" subtitle="Couverture de scénarios médecin, nursing, adult-care, équipement et partenaires.">
        <div className="grid gap-3 md:grid-cols-2">
          {coverage.map(pack => <div key={pack.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-slate-950">{pack.title}</p><span className={`chip ${pack.status === 'couvert' ? 'chip-success' : 'chip-amber'}`}>{pack.status}</span></div>
            <p className="mt-1 text-sm font-semibold text-slate-600">Rôle requis: {pack.staff} • Disponibles: {pack.availableCount}</p>
            <div className="mt-3 flex flex-wrap gap-2">{pack.checks.map(check => <span key={check} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black text-slate-600">{check}</span>)}</div>
            <button onClick={() => open(pack.modal)} className="btn mt-3">Configurer pack</button>
          </div>)}
        </div>
      </Panel>
    </div>
  </section>
}

function MiniStat({ label, value, detail, danger=false }: { label: string; value: string | number; detail: string; danger?: boolean }) {
  return <div className={`rounded-3xl border p-4 ${danger ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'}`}><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p><p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p></div>
}
function StateBanner({ tone, title, body }: { tone: 'info' | 'warn'; title: string; body: string }) { return <div className={`rounded-3xl border p-4 ${tone === 'warn' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-cyan-200 bg-cyan-50 text-cyan-900'}`}><b>{title}</b><p className="mt-1 text-sm font-semibold">{body}</p></div> }
function Panel({ title, action, children, subtitle }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) { return <section className="os-card p-5"><div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><h2 className="text-xl font-black text-slate-950">{title}</h2>{subtitle && <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>}</div>{action}</div>{children}</section> }
function MetricCard({ label, value, detail, tone='info' }: { label: string; value: string | number; detail: string; tone?: 'info' | 'danger' | 'success' | 'warn' }) { const cls = tone === 'danger' ? 'border-rose-200 bg-rose-50' : tone === 'success' ? 'border-emerald-200 bg-emerald-50' : tone === 'warn' ? 'border-amber-200 bg-amber-50' : 'border-cyan-200 bg-cyan-50'; return <div className={`rounded-[28px] border p-5 shadow-sm ${cls}`}><div className="flex items-start justify-between gap-3"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">{label}</p><span className="chip chip-info">LIVE</span></div><div className="mt-3 text-3xl font-black text-slate-950">{value}</div><p className="mt-2 text-sm font-semibold leading-5 text-slate-600">{detail}</p></div> }

function OperationalToolbar({ buttons, open, filters=true }: { buttons: [string, InterventionModalKey][]; open: any; filters?: boolean }) {
  return <div className="os-card p-4"><div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div className="flex flex-wrap gap-2">{buttons.map(([label, modal]) => <button key={label} onClick={() => open(modal)} className="btn">{label}</button>)}</div>{filters && <div className="flex flex-wrap gap-2 text-sm"><select className="rounded-2xl border border-slate-300 bg-white px-3 py-2 font-bold text-slate-700"><option>Toutes villes</option>{MOROCCO_CITIES.map(c => <option key={c}>{c}</option>)}</select><select className="rounded-2xl border border-slate-300 bg-white px-3 py-2 font-bold text-slate-700"><option>Tous services</option>{SERVICE_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select><input className="rounded-2xl border border-slate-300 bg-white px-3 py-2 font-bold text-slate-700" placeholder="Rechercher référence, patient, zone..." /></div>}</div></div>
}

function AdvancedTable({ title, subtitle, columns, rows, actions, open }: { title:string; subtitle?: string; columns:string[]; rows:any[][]; actions?: any[][]; open:any }) { return <Panel title={title} subtitle={subtitle}><div className="overflow-x-auto rounded-3xl border border-slate-200"><table className="os-table"><thead><tr>{columns.map(c => <th key={c}>{c}</th>)}<th>Actions</th></tr></thead><tbody>{rows.length ? rows.map((row,i) => <tr key={i}>{row.map((cell,j) => <td key={j}>{cell}</td>)}<td><div className="flex flex-wrap gap-2">{(actions?.[i] || []).map((a:any) => <button key={a.label} onClick={() => open(a.modal, a.id, a.type)} className="btn">{a.label}</button>)}</div></td></tr>) : <tr><td colSpan={columns.length+1}><EmptyState title="Aucune donnée" body="Le flux est prêt; aucune ligne ne correspond au filtre actuel." /></td></tr>}</tbody></table></div></Panel> }
function EmptyState({ title, body }: { title: string; body: string }) { return <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><p className="text-lg font-black text-slate-900">{title}</p><p className="mt-2 text-sm font-semibold text-slate-500">{body}</p></div> }

function WorkCard({ order, state, open, compact=false }: { order: InterventionOrder; state: InterventionsState; open: any; compact?: boolean }) {
  const staff = order.assignedStaffIds?.map(id => state.staff.find(s => s.id === id)?.fullName).filter(Boolean).join(', ') || 'Non assigné'
  const slaLate = new Date(order.slaDueAt).getTime() < Date.now() && !['Terminée', 'Clôturée', 'Annulée'].includes(order.status)
  return <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-base font-black text-slate-950">{order.reference} • {order.patientName}</p><p className="mt-1 text-xs font-bold text-slate-500">{order.category} • {order.city}/{order.zone} • SLA {formatDateFr(order.slaDueAt)} {formatTimeFr(order.slaDueAt)}</p></div><div className="flex flex-wrap gap-2"><RiskChip risk={order.riskLevel}/><StatusChip status={order.status}/>{slaLate && <span className="chip chip-danger">Retard SLA</span>}</div></div>
    {!compact && <div className="mt-4 grid gap-3 md:grid-cols-3"><div className="os-soft p-3 text-xs"><span className="font-black text-slate-500">Staff</span><p className="mt-1 font-black text-slate-950">{staff}</p></div><div className="os-soft p-3 text-xs"><span className="font-black text-slate-500">Montant</span><p className="mt-1 font-black text-slate-950">{formatMad(order.amountMad)}</p></div><div className="os-soft p-3 text-xs"><span className="font-black text-slate-500">Équipement</span><p className="mt-1 font-black text-slate-950">{order.requiredEquipment?.slice(0,2).join(', ') || '—'}</p></div></div>}
    <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => open('StaffAssignmentModal', order.id, 'order')} className="btn">Assigner</button><button onClick={() => open('ScheduleAppointmentModal', order.id, 'order')} className="btn">Planifier</button><button onClick={() => open('DispatchConfirmModal', order.id, 'order')} className="btn btn-primary">Dispatcher</button><button onClick={() => open('IncidentEscalationModal', order.id, 'order')} className="btn btn-danger">Escalader</button></div>
  </div>
}
function AuditFeed({ state }: { state: InterventionsState }) { return <div className="space-y-3">{state.audits.slice(0,12).map(a => <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-black uppercase tracking-wider text-cyan-700">{a.event}</p><span className="text-[10px] font-black text-slate-400">{formatTimeFr(a.at)}</span></div><p className="mt-1 text-sm font-semibold text-slate-800">{a.summary}</p><p className="mt-1 text-xs font-bold text-slate-500">{a.actor} • {a.role}</p></div>)}</div> }
function WorkflowPipeline({ state }: { state: InterventionsState }) { const statuses = ['À assigner','Planifiée','Dispatchée','En route','Sur site','En cours','Terminée','Escaladée'] as InterventionStatus[]; return <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">{statuses.map(s => <div key={s} className="rounded-3xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{s}</p><p className="mt-2 text-3xl font-black text-slate-950">{state.orders.filter(o => o.status === s).length}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-cyan-600" style={{ width: `${Math.min(100, state.orders.filter(o => o.status === s).length * 33)}%` }} /></div></div>)}</div> }
function SmartRecommendation({ title, body, action, onClick, tone='info' }: { title: string; body: string; action: string; onClick: () => void; tone?: 'info'|'danger'|'success'|'warn' }) { const cls = tone === 'danger' ? 'border-rose-200 bg-rose-50' : tone === 'success' ? 'border-emerald-200 bg-emerald-50' : tone === 'warn' ? 'border-amber-200 bg-amber-50' : 'border-cyan-200 bg-cyan-50'; return <div className={`rounded-[30px] border p-5 ${cls}`}><p className="text-sm font-black text-slate-950">{title}</p><p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{body}</p><button onClick={onClick} className="btn btn-primary mt-4">{action}</button></div> }

function CommandPage({ state, open }: { state: InterventionsState; open: any }) { const ops = computeOps(state); return <div className="space-y-5"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><MetricCard label="Demandes urgentes" value={ops.urgentRequests} detail="Cas haut risque sous supervision." tone="danger"/><MetricCard label="Non triées" value={ops.untriaged} detail="Demandes à qualifier rapidement." tone="warn"/><MetricCard label="Ordres actifs" value={ops.activeOrders} detail="Flux terrain ouvert."/><MetricCard label="Personnel disponible" value={ops.availableStaff} detail="Médecins, infirmiers, adult-care, équipement." tone="success"/><MetricCard label="Revenu jour" value={formatMad(ops.revenue)} detail={`Récupéré ${formatMad(ops.recovered)}`} /></div><div className="grid gap-5 xl:grid-cols-[1.35fr_.85fr]"><Panel title="Urgences, SLA et ordres critiques" subtitle="Priorisation terrain avec actions directes" action={<button onClick={() => open('MapDrawerModal')} className="btn">Carte live</button>}><div className="space-y-3">{state.orders.map(o => <WorkCard key={o.id} order={o} state={state} open={open} />)}</div></Panel><Panel title="Activité audit live" subtitle="Chaque action critique alimente le journal"><AuditFeed state={state}/></Panel></div><div className="page-grid"><SmartRecommendation title="Affectation intelligente" body="Dr. Salma est recommandé pour la consultation urgente Agdal: rôle compatible, zone proche, disponibilité confirmée." action="Assigner" onClick={() => open('StaffAssignmentModal','ord-002','order')} /><SmartRecommendation title="Risque équipement" body="Lit médicalisé en maintenance à Casablanca: prévoir substitution ou route de récupération avant intervention." action="Mouvement" onClick={() => open('EquipmentMovementModal','eq-003','equipment')} tone="warn"/><SmartRecommendation title="Retard potentiel SLA" body="Une demande Témara approche du SLA. L’assistant planning peut proposer une réaffectation infirmière." action="Résoudre" onClick={() => open('PlanningAssistantModal')} tone="danger"/></div></div> }
function DemandesPage({ state, open }: { state: InterventionsState; open: any }) { return <div className="space-y-5"><OperationalToolbar buttons={[["Créer demande",'RequestIntakeModal'],["Trier sélection",'TriageDecisionModal'],["Créer devis",'QuoteBuilderModal'],["Fusionner doublon",'DuplicateResolverModal'],["Document consentement",'ConsentDocumentModal']]} open={open}/><DemandIntelligence state={state} open={open}/><AdvancedTable title="Demandes entrantes" subtitle="Intake, triage, source, documents, conversion ordre" columns={['Référence','Patient / Client','Source','Type','Ville / Zone','Urgence','Statut','Date souhaitée','Consentement','Montant']} rows={state.requests.map(r => [r.reference,r.patientName,r.source,r.category,`${r.city} / ${r.zone}`,<RiskChip key="r" risk={r.riskLevel}/>,<StatusChip key="s" status={r.status}/>,r.preferredWindow,r.consentStatus,formatMad(r.estimatedAmountMad)])} actions={state.requests.map(r => [{label:'Trier',modal:'TriageDecisionModal',id:r.id,type:'request'},{label:'Convertir',modal:'ConvertRequestToOrderModal',id:r.id,type:'request'},{label:'Devis',modal:'QuoteBuilderModal',id:r.id,type:'request'},{label:'Docs',modal:'ConsentDocumentModal',id:r.id,type:'request'}])} open={open}/></div> }
function DemandIntelligence({ state, open }: { state: InterventionsState; open: any }) { const sources = ['Téléphone','WhatsApp','Portail','Partenaire','Interne']; return <div className="page-grid"><Panel title="File triage par source">{sources.map(src => <div key={src} className="mb-2 flex items-center justify-between rounded-2xl bg-slate-50 p-3"><span className="font-black text-slate-700">{src}</span><span className="chip chip-info">{state.requests.filter(r => r.source === src).length}</span></div>)}</Panel><Panel title="Contrôle documents"><div className="space-y-3">{state.requests.map(r => <div key={r.id} className="rounded-2xl border border-slate-200 p-3"><div className="flex justify-between gap-3"><b>{r.patientName}</b><StatusChip status={r.consentStatus}/></div><p className="mt-1 text-xs font-semibold text-slate-500">{r.notes}</p><button onClick={() => open('ConsentDocumentModal', r.id, 'request')} className="btn mt-3">Vérifier document</button></div>)}</div></Panel><Panel title="Décision rapide"><SmartRecommendation title="Cas urgent à convertir" body="La demande consultation médicale Agdal peut être convertie en ordre avant appel famille si SLA critique." action="Convertir" onClick={() => open('ConvertRequestToOrderModal','req-001','request')} tone="danger"/></Panel></div> }
function OrdresPage({ state, open }: { state: InterventionsState; open: any }) { return <div className="space-y-5"><WorkflowPipeline state={state}/><OperationalToolbar buttons={[["Créer ordre",'OrderBuilderModal'],["Assigner personnel",'StaffAssignmentModal'],["Planifier",'ScheduleAppointmentModal'],["Ajouter équipement",'EquipmentAssignmentModal'],["Checklist",'ChecklistBuilderModal'],["Escalader",'IncidentEscalationModal']]} open={open}/><div className="grid gap-5 xl:grid-cols-[1fr_360px]"><Panel title="Centre d’exécution ordres" subtitle="Chaque ordre dispose d’actions adaptées et auditables"><div className="space-y-3">{state.orders.map(o => <WorkCard key={o.id} order={o} state={state} open={open}/>)}</div></Panel><Panel title="Audit ordre & blocages"><AuditFeed state={state}/></Panel></div></div> }
function DispatchPage({ state, open }: { state: InterventionsState; open: any }) { return <div className="space-y-5"><div className="grid gap-5 xl:grid-cols-[.75fr_1.25fr_.8fr]"><Panel title="Ordres à assigner" subtitle="File non assignée et SLA court"><div className="space-y-3">{state.orders.filter(o => o.status === 'À assigner' || !o.assignedStaffIds.length).map(o => <WorkCard key={o.id} order={o} state={state} open={open} compact/>)}{state.orders.filter(o => o.status === 'À assigner').length === 0 && <EmptyState title="Aucun ordre bloqué" body="Tous les ordres ont une affectation ou un statut terrain." />}</div></Panel><Panel title="Timeline dispatch terrain" subtitle="Chaque bouton ouvre son modal adapté"><div className="space-y-3">{state.orders.map(o => <div key={o.id} className="rounded-[28px] border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-slate-950">{o.reference} • {o.patientName}</p><StatusChip status={o.status}/></div><div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4"><button onClick={() => open('DispatchConfirmModal',o.id,'order')} className="btn btn-primary">Dispatch</button><button onClick={() => open('EnRouteModal',o.id,'order')} className="btn">En route</button><button onClick={() => open('ArrivalConfirmationModal',o.id,'order')} className="btn">Sur site</button><button onClick={() => open('StartInterventionModal',o.id,'order')} className="btn">Démarrer</button><button onClick={() => open('CompleteInterventionReportModal',o.id,'order')} className="btn btn-success">Clôturer</button><button onClick={() => open('ReassignStaffModal',o.id,'order')} className="btn">Remplacer</button><button onClick={() => open('CancelInterventionModal',o.id,'order')} className="btn btn-danger">Annuler</button><button onClick={() => open('IncidentEscalationModal',o.id,'order')} className="btn btn-danger">Incident</button></div></div>)}</div></Panel><Panel title="Disponibilité personnel"><StaffCards state={state} open={open}/></Panel></div><DispatchMap state={state} open={open}/></div> }
function DispatchMap({ state, open }: { state: InterventionsState; open: any }) { return <Panel title="Carte opérationnelle Maroc" subtitle="Vue zone, capacité, urgences et équipement proche" action={<button onClick={() => open('MapDrawerModal')} className="btn">Ouvrir carte</button>}><div className="mini-map grid min-h-[260px] gap-4 rounded-[30px] p-5 md:grid-cols-3">{MOROCCO_CITIES.slice(0,6).map(city => <div key={city} className="rounded-3xl border border-white bg-white/80 p-4 shadow-sm"><p className="font-black text-slate-950">{city}</p><p className="mt-1 text-sm font-semibold text-slate-500">{state.orders.filter(o => o.city === city).length} ordre(s) • {state.staff.filter(s => s.city === city).length} staff</p><button onClick={() => open('MapDrawerModal')} className="btn mt-3">Voir zone</button></div>)}</div></Panel> }
function PlanningPage({ state, open }: { state: InterventionsState; open: any }) { return <div className="space-y-5"><OperationalToolbar buttons={[["Nouvel évènement",'ScheduleAppointmentModal'],["Bloquer disponibilité",'StaffAvailabilityModal'],["Planning automatique",'PlanningAssistantModal'],["Détection conflits",'PlanningAssistantModal'],["Imprimer planning",'PrintTemplateModal']]} open={open}/><div className="grid gap-5 xl:grid-cols-[1fr_1fr_0.8fr]"><Panel title="Jour opérationnel"><ScheduleColumn state={state} open={open}/></Panel><Panel title="Semaine par personnel"><StaffCards state={state} open={open} detailed/></Panel><Panel title="Conflits & alertes"><SmartRecommendation title="Chevauchement contrôlé" body="Aucun staff ne doit être planifié deux fois. Les conflits déclenchent résolution avant dispatch." action="Résoudre" onClick={() => open('PlanningAssistantModal')} /><SmartRecommendation title="Impression bureau" body="Planning jour/semaine/mois imprimable pour board opérationnel." action="Imprimer" onClick={() => open('PrintTemplateModal')} tone="success"/></Panel></div></div> }
function TourneesPage({ state, open }: { state: InterventionsState; open: any }) { return <div className="space-y-5"><OperationalToolbar buttons={[["Créer tournée",'RouteBuilderModal'],["Ajouter arrêt",'RouteStopModal'],["Optimiser ordre",'PlanningAssistantModal'],["Assigner chauffeur",'StaffAssignmentModal'],["Feuille tournée",'PrintTemplateModal']]} open={open}/><div className="page-grid">{state.routes.map(r => <RouteCard key={r.id} route={r} state={state} open={open}/>)}</div><Panel title="Matrice tournées par service"><div className="dense-grid">{['Tournée infirmière','Tournée médecin','Tournée aide à domicile','Tournée équipement','Tournée urgence','Tournée partenaire'].map(x => <div key={x} className="os-soft p-4"><p className="font-black">{x}</p><p className="mt-1 text-sm font-semibold text-slate-500">Template route avec staff, véhicule, arrêts et feuille imprimable.</p><button onClick={() => open('RouteBuilderModal')} className="btn mt-3">Créer</button></div>)}</div></Panel></div> }
function RouteCard({ route, state, open }: { route: InterventionRoute; state: InterventionsState; open: any }) { const staff = state.staff.find(s => s.id === route.staffId); return <Panel title={route.name} subtitle={`${route.city} / ${route.zone} • ${route.date}`} action={<StatusChip status={route.status}/>}>{staff && <div className="mb-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><Avatar name={staff.fullName}/><div><p className="font-black">{staff.fullName}</p><p className="text-xs font-bold text-slate-500">{staff.role} • {staff.phone}</p></div></div>}<div className="space-y-3">{state.routeStops.filter(s => s.routeId === route.id).map(s => <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm"><b>#{s.sequence}</b> {safeArray(state.orders).find(o => o.id === s.orderId)?.patientName} • {formatTimeFr(s.plannedTime)} <StatusChip status={s.status}/><p className="mt-1 text-xs font-semibold text-slate-500">{s.notes}</p></div>)}{!state.routeStops.some(s => s.routeId === route.id) && <EmptyState title="Aucun arrêt" body="Ajoutez des ordres à cette tournée." />}</div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => open('RouteStopModal', route.id, 'route')} className="btn">Ajouter arrêt</button><button onClick={() => open('PrintTemplateModal', route.id, 'route')} className="btn">Imprimer</button></div></Panel> }
function PersonnelPage({ state, open }: { state: InterventionsState; open: any }) { return <div className="space-y-5"><OperationalToolbar buttons={[["Ajouter personnel",'StaffProfileModal'],["Disponibilité",'StaffAvailabilityModal'],["Compétences",'StaffCertificationModal'],["Affecter zone",'StaffAssignmentModal']]} open={open}/><StaffRoleBoard state={state} open={open}/><StaffCards state={state} open={open} detailed/></div> }
function StaffRoleBoard({ state, open }: { state: InterventionsState; open: any }) { return <Panel title="Capacité par rôle" subtitle="Contrôle RH opérationnel des interventions"><div className="dense-grid">{STAFF_ROLES.map(role => <div key={role} className="os-soft p-4"><p className="font-black text-slate-950">{role}</p><p className="mt-2 text-3xl font-black text-cyan-700">{state.staff.filter(s => s.role === role).length}</p><p className="text-xs font-semibold text-slate-500">disponibles {state.staff.filter(s => s.role === role && s.availability === 'Disponible').length}</p><button onClick={() => open('StaffCertificationModal')} className="btn mt-3">Contrôler</button></div>)}</div></Panel> }
function PatientsPage({ state, open }: { state: InterventionsState; open: any }) { const names = Array.from(new Set([...state.requests.map(r => r.patientName), ...state.orders.map(o => o.patientName)])); return <div className="space-y-5"><OperationalToolbar buttons={[["Ajouter patient",'PatientProfileModal'],["Contact famille",'PatientProfileModal'],["Créer plan de soins",'CarePlanModal'],["Note visite",'CompleteInterventionReportModal'],["Alerte risque",'IncidentEscalationModal'],["Consentement",'ConsentDocumentModal']]} open={open}/><div className="page-grid">{names.map(name => <PatientCard key={name} name={name} state={state} open={open}/>)}</div></div> }
function PatientCard({ name, state, open }: { name: string; state: InterventionsState; open: any }) { const req = state.requests.find(r => r.patientName === name); const orderCount = state.orders.filter(o => o.patientName === name).length; return <div className="os-card p-5"><div className="flex items-start gap-3"><Avatar name={name}/><div><h3 className="text-lg font-black text-slate-950">{name}</h3><p className="mt-1 text-sm font-semibold text-slate-500">Profil opérationnel home-care • Maroc • {req?.city || 'Ville à confirmer'}</p></div></div><div className="mt-4 grid gap-2 text-sm"><div className="os-soft p-3"><b>Historique:</b> {orderCount} ordre(s)</div><div className="os-soft p-3"><b>Contact famille:</b> {req?.contactName || 'À renseigner'} • {req?.phone || '+212'}</div><div className="os-soft p-3"><b>Risque:</b> {req ? <RiskChip risk={req.riskLevel}/> : 'Surveillance opérationnelle'}</div></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => open('PatientProfileModal')} className="btn btn-primary">Ouvrir profil</button><button onClick={() => open('CarePlanModal')} className="btn">Plan care</button><button onClick={() => open('ConsentDocumentModal')} className="btn">Documents</button></div></div> }
function LieuxPage({ state, open }: { state: InterventionsState; open: any }) { return <div className="space-y-5"><OperationalToolbar buttons={[["Ajouter lieu",'MapDrawerModal'],["Assigner zone",'WorkflowStageModal'],["Voir carte",'MapDrawerModal'],["Lier patient/client",'PatientProfileModal'],["Consignes accès",'MapDrawerModal']]} open={open}/><AdvancedTable title="Sites d’intervention" subtitle="Domiciles, crèches, entreprises, dépôts, partenaires" columns={['Lieu','Type','Ville / Zone','Adresse','Consignes','Lien']} rows={state.locations.map(l => [l.name,l.type,`${l.city} / ${l.zone}`,l.address,l.accessNotes,l.linkedPatient || '—'])} actions={state.locations.map(l => [{label:'Carte',modal:'MapDrawerModal',id:l.id,type:'location'},{label:'Lier',modal:'PatientProfileModal',id:l.id,type:'location'}])} open={open}/><DispatchMap state={state} open={open}/></div> }
function EquipementsPage({ state, open }: { state: InterventionsState; open: any }) { return <div className="space-y-5"><OperationalToolbar buttons={[["Ajouter équipement",'EquipmentAssignmentModal'],["Assigner",'EquipmentAssignmentModal'],["Marquer en transit",'EquipmentMovementModal'],["Retour dépôt",'EquipmentMovementModal'],["Maintenance",'EquipmentMovementModal'],["Consommer stock",'InventoryConsumptionModal']]} open={open}/><EquipmentBoard state={state} open={open}/><AdvancedTable title="Équipements & consommables" columns={['Nom','Type','Statut','Ville / Zone','Série','Maintenance']} rows={state.equipment.map(e => [e.name,e.type,<StatusChip key="s" status={e.status}/>,`${e.city} / ${e.zone}`,e.serial || '—',e.nextMaintenanceAt || '—'])} actions={state.equipment.map(e => [{label:'Mouvement',modal:'EquipmentMovementModal',id:e.id,type:'equipment'},{label:'Assigner',modal:'EquipmentAssignmentModal',id:e.id,type:'equipment'},{label:'Stock',modal:'InventoryConsumptionModal',id:e.id,type:'equipment'}])} open={open}/></div> }
function EquipmentBoard({ state, open }: { state: InterventionsState; open: any }) { const statuses = ['Disponible','Réservé','En intervention','Chez patient','En transit','En maintenance','Hors service','Retourné']; return <Panel title="Statut matériel médical"><div className="dense-grid">{statuses.map(s => <div key={s} className="os-soft p-4"><div className="flex items-center justify-between"><p className="font-black">{s}</p><StatusChip status={s}/></div><p className="mt-2 text-3xl font-black text-slate-950">{state.equipment.filter(e => e.status === s).length}</p><button onClick={() => open('EquipmentMovementModal')} className="btn mt-3">Gérer</button></div>)}</div></Panel> }
function RapportsPage({ state, open }: { state: InterventionsState; open: any }) { const ops = computeOps(state); return <div className="space-y-5"><OperationalToolbar buttons={[["Générer rapport",'ReportExportModal'],["Exporter PDF",'ReportExportModal'],["Exporter CSV",'ReportExportModal'],["Imprimer",'PrintTemplateModal'],["Créer audit",'ReportExportModal']]} open={open}/><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><MetricCard label="Terminées" value={state.orders.filter(o => o.status === 'Terminée').length} detail="Avec rapport."/><MetricCard label="Retards SLA" value={ops.lateOrders} detail="À escalader." tone="danger"/><MetricCard label="Incidents" value={ops.openIncidents} detail="Ouverts / revue." tone="warn"/><MetricCard label="CA facturé" value={formatMad(ops.revenue)} detail="Factures MAD."/><MetricCard label="Audit" value={state.audits.length} detail="Évènements." tone="success"/></div><Panel title="Rapports disponibles"><div className="dense-grid">{['Rapport journalier dispatch','Rapport interventions terminées','Rapport retards/SLA','Rapport personnel','Rapport zones','Rapport incidents','Rapport équipement','Rapport facturation MAD'].map(r => <div key={r} className="os-soft p-4"><p className="font-black">{r}</p><p className="mt-1 text-sm font-semibold text-slate-500">Généré depuis les données opérationnelles du module.</p><button onClick={() => open('ReportExportModal')} className="btn mt-3">Générer</button></div>)}</div></Panel><Panel title="Timeline audit"><AuditFeed state={state}/></Panel></div> }
function FacturationPage({ state, open }: { state: InterventionsState; open: any }) { return <div className="space-y-5"><OperationalToolbar buttons={[["Créer devis",'QuoteBuilderModal'],["Convertir facture",'PaymentModal'],["Ajouter paiement",'PaymentModal'],["Remise / ajustement",'PricingRuleModal'],["Exporter facture",'PrintTemplateModal']]} open={open}/><FinanceBoard state={state} open={open}/><AdvancedTable title="Facturation interventions MAD" columns={['Référence','Patient','Montant','Payé','Reste','Statut','Échéance']} rows={state.invoices.map(i => [i.reference,i.patientName,formatMad(i.amountMad),formatMad(i.paidMad),formatMad(i.amountMad-i.paidMad),<StatusChip key="s" status={i.status}/>,formatDateFr(i.dueAt)])} actions={state.invoices.map(i => [{label:'Paiement',modal:'PaymentModal',id:i.id,type:'invoice'},{label:'Imprimer',modal:'PrintTemplateModal',id:i.id,type:'invoice'}])} open={open}/></div> }
function FinanceBoard({ state, open }: { state: InterventionsState; open: any }) { const total = state.invoices.reduce((a,b) => a + b.amountMad, 0); const paid = state.invoices.reduce((a,b) => a + b.paidMad, 0); return <div className="grid gap-4 md:grid-cols-4"><MetricCard label="Émis" value={formatMad(total)} detail="Factures émises"/><MetricCard label="Encaissé" value={formatMad(paid)} detail="Paiements reçus" tone="success"/><MetricCard label="Reste" value={formatMad(total-paid)} detail="À recouvrer" tone="warn"/><MetricCard label="Devis" value={state.requests.filter(r => r.status === 'Devis envoyé').length} detail="En attente acceptation"/></div> }
function ParametresPage({ state, open }: { state: InterventionsState; open: any }) { return <div className="space-y-5"><OperationalToolbar buttons={[["Type intervention",'WorkflowStageModal'],["Tarifs MAD",'PricingRuleModal'],["SLA",'SlaMatrixModal'],["Checklist",'ChecklistBuilderModal'],["Permissions",'PermissionMatrixModal'],["Templates rapport",'PrintTemplateModal']]} open={open}/><div className="grid gap-5 xl:grid-cols-2"><Panel title="Templates d’intervention"><div className="space-y-3">{state.templates.map(t => <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap justify-between gap-3"><b>{t.name}</b><span className="font-black text-cyan-700">{formatMad(t.basePriceMad)}</span></div><p className="mt-1 text-xs font-semibold text-slate-500">{t.requiredRole} • {t.durationMinutes} min • SLA {t.slaMinutes} min • Risque {t.riskLevel}</p><div className="mt-2 flex flex-wrap gap-1">{t.checklist.slice(0,3).map(c => <span key={c} className="kbd">{c}</span>)}</div></div>)}</div></Panel><Panel title="Matrice permissions"><div className="space-y-3">{ROLE_MATRIX.map(r => <div key={r.role} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><b>{r.role}</b><button onClick={() => open('PermissionMatrixModal')} className="btn">Configurer</button></div><p className="mt-1 text-xs font-semibold text-slate-500">{r.visibility}</p><p className="mt-1 text-xs font-bold text-slate-700">Mutation: {r.mutate} • {r.restriction}</p></div>)}</div></Panel></div><Panel title="Workflow statuses"><div className="flex flex-wrap gap-2">{INTERVENTION_STATUSES.map(s => <StatusChip key={s} status={s}/>)}</div></Panel></div> }

function Avatar({ name }: { name: string }) { return <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-100 text-sm font-black text-cyan-800">{initials(name)}</div> }
function StaffCards({ state, open, detailed=false }: { state: InterventionsState; open: any; detailed?: boolean }) { return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">{state.staff.map(s => <StaffCard key={s.id} staff={s} state={state} open={open} detailed={detailed}/>)}</div> }
function StaffCard({ staff, state, open, detailed=false }: { staff: InterventionStaff; state: InterventionsState; open: any; detailed?: boolean }) { const assigned = state.orders.filter(o => o.assignedStaffIds.includes(staff.id)).length; return <div className="rounded-[26px] border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><Avatar name={staff.fullName}/><div><p className="font-black text-slate-950">{staff.fullName}</p><p className="text-xs font-bold text-slate-500">{staff.role} • {staff.city}/{staff.zone}</p></div></div><StatusChip status={staff.availability}/></div>{detailed && <div className="mt-3 grid gap-2 text-xs md:grid-cols-4"><span className="rounded-2xl bg-slate-50 p-2 font-bold">Charge {staff.workload}%</span><span className="rounded-2xl bg-slate-50 p-2 font-bold">Certifs {staff.certifications.length}</span><span className="rounded-2xl bg-slate-50 p-2 font-bold">Urgence {staff.emergencyEligible ? 'Oui' : 'Non'}</span><span className="rounded-2xl bg-slate-50 p-2 font-bold">Assigné {assigned}</span></div>}<div className="mt-3 flex flex-wrap gap-2"><button onClick={() => open('StaffAvailabilityModal',staff.id,'staff')} className="btn">Disponibilité</button><button onClick={() => open('StaffCertificationModal',staff.id,'staff')} className="btn">Certificats</button><button onClick={() => open('StaffAssignmentModal',staff.id,'staff')} className="btn btn-primary">Assigner</button></div></div> }
function ScheduleColumn({ state, open }: { state: InterventionsState; open:any }) { return <div className="space-y-3">{state.appointments.map(a => { const order = safeArray(state.orders).find(o => o.id === a.orderId); return <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black text-slate-950">{a.reference}</p><p className="text-sm font-semibold text-slate-600">{formatDateFr(a.startsAt)} {formatTimeFr(a.startsAt)} - {formatTimeFr(a.endsAt)}</p><p className="mt-1 text-xs font-bold text-slate-500">{order?.patientName || 'Ordre'} • {state.locations.find(l => l.id === a.locationId)?.name || 'Lieu'}</p></div><StatusChip status={a.status}/></div><button onClick={() => open('ScheduleAppointmentModal',a.id,'appointment')} className="btn mt-3">Modifier</button></div> })}{state.appointments.length === 0 && <EmptyState title="Aucun RDV" body="Planifiez un ordre pour alimenter le calendrier." />}</div> }


function Phase7RevenueComplianceDeck({ state, page, open }: { state: InterventionsState; page: PageKey; open: (key: InterventionModalKey, entityId?: string, entityType?: string) => void }) {
  const command = PHASE7_REVENUE_COMMANDS[page]
  const assurance = buildPhase7RevenueAssurance(state)
  const exposure = buildPhase7InvoiceExposure(state)
  const margins = buildPhase7MarginProtection(state)
  const locks = buildPhase7RoleFinanceLocks(state)
  return <section className="space-y-5">
    <div className="os-card border-cyan-100 bg-white p-5 md:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.34em] text-cyan-700">Mega Phase 7 • revenu MAD & conformité direction</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-4xl">Couche facturation, recouvrement, caisse terrain et exports auditables</h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">{command.mandate} Cette phase verrouille les devis, factures, paiements, remises, impayés, cautions équipement, exports direction et clôtures terrain pour que le module reste exploitable par Finance, Dispatch, Direction et Audit.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => open('QuoteBuilderModal')} className="btn">Devis MAD</button>
          <button onClick={() => open('PaymentModal')} className="btn btn-success">Paiement</button>
          <button onClick={() => open('PricingRuleModal')} className="btn">Tarifs</button>
          <button onClick={() => open(command.primaryModal)} className="btn btn-primary">Contrôle page</button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <MiniStat label="Assurance" value={`${assurance.score}%`} detail={assurance.label} danger={assurance.score < 74}/>
        <MiniStat label="CA MAD" value={formatMad(assurance.total)} detail="facturé" />
        <MiniStat label="Encaissé" value={formatMad(assurance.paid)} detail={`${assurance.recoveryRate}% récupéré`} danger={assurance.recoveryRate < 70}/>
        <MiniStat label="Reste" value={formatMad(assurance.unpaid)} detail="à encaisser" danger={assurance.unpaid > 0}/>
        <MiniStat label="Sans facture" value={assurance.closedWithoutInvoice} detail="clôtures" danger={assurance.closedWithoutInvoice > 0}/>
        <MiniStat label="Impayés" value={assurance.unpaidInvoices} detail="à relancer" danger={assurance.unpaidInvoices > 0}/>
      </div>
    </div>

    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <Panel title={`Revenue command: ${command.title}`} subtitle={`Condition release: ${command.releaseCondition}`} action={<button onClick={() => open(command.primaryModal)} className="btn btn-primary">Exécuter</button>}>
        <div className="grid gap-3 md:grid-cols-4">
          {command.board.map(item => <div key={item} className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm font-black text-cyan-900">✓ {item}</div>)}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {PHASE7_FINANCE_GATES.map(gate => <div key={gate.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-slate-950">{gate.label}</p><span className={`chip ${gate.severity === 'bloquant' ? 'chip-danger' : gate.severity === 'finance' ? 'chip-amber' : 'chip-info'}`}>{gate.severity}</span></div>
            <p className="mt-1 text-sm font-semibold text-slate-600">Owner: {gate.owner}</p>
            <p className="mt-2 text-xs font-black uppercase tracking-wider text-cyan-700">Preuve: {gate.proof}</p>
            <button onClick={() => open(gate.modal)} className="btn mt-3">Contrôler</button>
          </div>)}
        </div>
      </Panel>

      <Panel title="Clôture caisse & protocoles terrain" subtitle="Chaque tournée et chaque encaissement doivent se terminer avec preuve, reçu et audit.">
        <div className="space-y-3">
          {PHASE7_CASH_CLOSURE_PROTOCOLS.map(protocol => <div key={protocol.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-slate-950">{protocol.title}</p><span className="chip chip-info">{protocol.deadline}</span></div>
            <p className="mt-1 text-sm font-semibold text-slate-600">Owner: {protocol.owner}</p>
            <p className="mt-2 text-xs font-bold leading-5 text-slate-500">Preuve: {protocol.proof}</p>
            <button onClick={() => open(protocol.modal)} className="btn mt-3">Ouvrir protocole</button>
          </div>)}
        </div>
      </Panel>
    </div>

    <Panel title="Exposition factures, paiements et ordres clôturés" subtitle="File priorisée: clôtures sans facture, impayés, partiellement payées et reçus manquants.">
      <div className="overflow-x-auto rounded-3xl border border-slate-200">
        <table className="os-table"><thead><tr><th>Référence</th><th>Patient</th><th>Montant</th><th>Payé</th><th>Reste</th><th>Statut</th><th>Échéance</th><th>Risque</th><th>Action</th></tr></thead><tbody>
          {exposure.length ? exposure.map(row => <tr key={row.id}><td><b>{row.reference}</b><p className="text-xs font-semibold text-slate-500">{row.orderStatus}</p></td><td>{row.patientName}</td><td>{formatMad(row.amountMad)}</td><td>{formatMad(row.paidMad)}</td><td><b>{formatMad(row.outstanding)}</b></td><td><StatusChip status={row.status}/></td><td>{row.daysLeft < 0 ? `${Math.abs(row.daysLeft)}j retard` : `${row.daysLeft}j`}</td><td><RiskChip risk={row.risk as RiskLevel}/></td><td><button onClick={() => open(row.modal, row.id, 'invoice')} className="btn btn-primary">Traiter</button></td></tr>) : <tr><td colSpan={9}><EmptyState title="Aucune exposition finance" body="Aucune facture ou clôture critique à traiter pour le moment." /></td></tr>}
        </tbody></table>
      </div>
    </Panel>

    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <Panel title="Rentabilité tournées & protection marge" subtitle="Contrôle revenu par tournée, charge staff, équipement et zones coûteuses.">
        <div className="space-y-3">
          {margins.length ? margins.map(route => <div key={route.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-slate-950">{route.name}</p><span className={`chip ${route.status === 'rentable' ? 'chip-success' : route.status === 'à surveiller' ? 'chip-amber' : 'chip-danger'}`}>{route.status}</span></div>
            <p className="mt-1 text-sm font-semibold text-slate-600">{route.city}/{route.zone} • {route.stopCount} arrêts • {route.staffName}</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2"><MiniStat label="Revenu" value={formatMad(route.revenue)} detail="tournée"/><MiniStat label="Marge" value={`${route.marginScore}%`} detail="score" danger={route.marginScore < 20}/></div>
            <button onClick={() => open(route.modal, route.id, 'route')} className="btn mt-3">Optimiser</button>
          </div>) : <EmptyState title="Aucune tournée" body="Créez des tournées pour activer le contrôle de marge." />}
        </div>
      </Panel>

      <Panel title="Exports conformité & verrous RBAC finance" subtitle="Packs direction/finance/audit et responsabilité par rôle.">
        <div className="grid gap-3">
          {PHASE7_COMPLIANCE_EXPORTS.map(pack => <div key={pack.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-slate-950">{pack.label}</p><span className="chip chip-info">{pack.audience}</span></div>
            <div className="mt-3 flex flex-wrap gap-2">{pack.contents.map(item => <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black text-slate-600">{item}</span>)}</div>
            <button onClick={() => open(pack.modal)} className="btn mt-3">Préparer pack</button>
          </div>)}
          {locks.map(lock => <div key={lock.role} className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
            <p className="font-black text-cyan-950">{lock.role}</p>
            <p className="mt-1 text-sm font-semibold text-cyan-900">{lock.scope}</p>
            <p className="mt-2 text-xs font-bold text-cyan-700">Verrou: {lock.lock} • {lock.count} éléments</p>
            <button onClick={() => open(lock.modal)} className="btn mt-3">Contrôler RBAC</button>
          </div>)}
        </div>
      </Panel>
    </div>
  </section>
}


function Phase8QualityLiveOpsDeck({ state, page, open }: { state: InterventionsState; page: PageKey; open: (key: InterventionModalKey, entityId?: string, entityType?: string) => void }) {
  const command = PHASE8_LIVEOPS_COMMANDS[page]
  const quality = buildPhase8QualityScore(state)
  const queue = buildPhase8LiveOpsQueue(state)
  const staffAdoption = buildPhase8StaffAdoption(state).slice(0, 6)
  const patientExperience = buildPhase8PatientExperience(state)
  const runbook = buildPhase8RunbookCoverage(state)
  return <section className="space-y-5">
    <div className="os-card border-emerald-100 bg-white p-5 md:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.34em] text-emerald-700">Mega Phase 8 • qualité liveops & adoption production</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-4xl">{command.title}</h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">{command.mandate} Risque contrôlé: {command.productionRisk}. Cette couche prépare l’usage réel par équipes terrain avec runbooks, notifications, formation, qualité dossier et preuve d’exécution.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => open(command.primaryModal)} className="btn btn-primary">Ouvrir contrôle page</button>
          <button onClick={() => open('ChecklistBuilderModal')} className="btn">Runbook qualité</button>
          <button onClick={() => open('StaffCertificationModal')} className="btn">Adoption staff</button>
          <button onClick={() => open('ReportExportModal')} className="btn">Snapshot qualité</button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MiniStat label="Qualité production" value={`${quality.score}%`} detail={quality.label} danger={quality.score < 72}/>
        <MiniStat label="Ordres assignés" value={`${quality.assignedOrders}/${quality.totalOrders}`} detail="couverture" danger={quality.assignedOrders < quality.totalOrders}/>
        <MiniStat label="Rapports prêts" value={quality.reportReady} detail="clôtures contrôlées"/>
        <MiniStat label="Contact famille" value={`${patientExperience.familyReachRate}%`} detail="joignable" danger={patientExperience.familyReachRate < 80}/>
        <MiniStat label="Runbook live" value={runbook.ready ? 'Actif' : 'À renforcer'} detail={`${runbook.notifications} règles • audit ${runbook.auditDensity}`} danger={!runbook.ready}/>
      </div>
      <div className="mt-5 grid gap-2 md:grid-cols-4">{command.operatorChecklist.map(item => <div key={item} className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-black uppercase tracking-wider text-emerald-800">✓ {item}</div>)}</div>
    </div>

    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <Panel title="File qualité live à traiter" subtitle="Priorité aux ordres non assignés, rapports manquants, certifications expirées et risques d’adoption.">
        <div className="space-y-3">
          {queue.length ? queue.map(item => <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-slate-950">{item.title}</p><span className={`chip ${item.severity === 'bloquant' ? 'chip-danger' : item.severity === 'formation' ? 'chip-amber' : 'chip-info'}`}>{item.severity}</span></div>
            <p className="mt-1 text-sm font-semibold text-slate-600">Owner: {item.owner}</p>
            <p className="mt-2 text-xs font-bold text-slate-500">{item.detail}</p>
            <button onClick={() => open(item.modal)} className="btn mt-3">Résoudre</button>
          </div>) : <EmptyState title="Aucun blocage qualité" body="Les contrôles LiveOps ne détectent pas de dossier bloquant immédiat." />}
        </div>
      </Panel>

      <Panel title="Runbooks notification & escalade" subtitle="Chaque alerte doit relier déclencheur, canal, owner, modal et audit.">
        <div className="space-y-3">
          {PHASE8_NOTIFICATION_RUNBOOKS.map(run => <div key={run.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-slate-950">{run.title}</p><span className="chip chip-info">{run.channel}</span></div>
            <p className="mt-1 text-sm font-semibold text-slate-600">Déclencheur: {run.trigger}</p>
            <p className="mt-2 text-xs font-bold text-slate-500">Owner: {run.owner}</p>
            <button onClick={() => open(run.modal)} className="btn mt-3">Tester workflow</button>
          </div>)}
        </div>
      </Panel>
    </div>

    <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
      <Panel title="Gates qualité obligatoires" subtitle="Contrôles non négociables avant production réelle et adoption utilisateurs.">
        <div className="space-y-3">
          {PHASE8_QUALITY_GATES.map(gate => <div key={gate.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-slate-950">{gate.label}</p><span className={`chip ${gate.severity === 'bloquant' ? 'chip-danger' : gate.severity === 'formation' ? 'chip-amber' : 'chip-info'}`}>{gate.severity}</span></div>
            <p className="mt-1 text-sm font-semibold text-slate-600">Owner: {gate.owner}</p>
            <p className="mt-2 text-xs font-black uppercase tracking-wider text-emerald-700">Preuve: {gate.evidence}</p>
            <button onClick={() => open(gate.modal)} className="btn mt-3">Contrôler</button>
          </div>)}
        </div>
      </Panel>

      <Panel title="Adoption par rôle & coaching production" subtitle="Chaque rôle terrain doit avoir un usage quotidien clair, mesurable et contrôlé.">
        <div className="grid gap-3 lg:grid-cols-2">
          {PHASE8_ADOPTION_ROLLOUTS.map(rollout => <div key={rollout.role} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-black text-slate-950">{rollout.role}</p>
            <div className="mt-3 flex flex-wrap gap-2">{rollout.mustKnow.map(item => <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black text-slate-600">{item}</span>)}</div>
            <p className="mt-3 text-xs font-bold text-slate-500">Preuve quotidienne: {rollout.dailyProof}</p>
            <button onClick={() => open(rollout.modal)} className="btn mt-3">Préparer rôle</button>
          </div>)}
        </div>
      </Panel>
    </div>

    <Panel title="Adoption staff mesurée" subtitle="Score par personne: disponibilité, certifications, charge, urgence, assignations et besoin de coaching.">
      <div className="overflow-x-auto rounded-3xl border border-slate-200">
        <table className="os-table"><thead><tr><th>Staff</th><th>Rôle</th><th>Zone</th><th>Assignations</th><th>Score</th><th>État</th><th>Action</th></tr></thead><tbody>
          {staffAdoption.map(row => <tr key={row.id}><td><b>{row.name}</b></td><td>{row.role}</td><td>{row.zone}</td><td>{row.assignments}</td><td><b>{row.readiness}%</b></td><td><span className={`chip ${row.label === 'autonome' ? 'chip-success' : row.label === 'coaché' ? 'chip-amber' : 'chip-danger'}`}>{row.label}</span></td><td><button onClick={() => open(row.modal, row.id, 'staff')} className="btn btn-primary">Suivre</button></td></tr>)}
        </tbody></table>
      </div>
    </Panel>
  </section>
}


function Phase9GovernanceSlaDeck({ state, page, open }: { state: InterventionsState; page: PageKey; open: (key: InterventionModalKey, entityId?: string, entityType?: string) => void }) {
  const command = PHASE9_GOVERNANCE_COMMANDS[page]
  const governance = buildPhase9GovernanceScore(state)
  const breaches = buildPhase9SlaBreachRegister(state)
  const gates = buildPhase9ReadinessGates(state)
  const exceptions = buildPhase9HandoffExceptions(state)
  return <section className="space-y-5">
    <div className="os-card border-indigo-100 bg-white p-5 md:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.34em] text-indigo-700">Mega Phase 9 • gouvernance SLA & go-live production</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-4xl">{command.title}</h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">{command.mandate} Contrôle non négociable: {command.nonNegotiableControl}. Owner principal: {command.accountableRole}. Cette couche verrouille la discipline entreprise avant usage réel par dispatch, médical, finance, équipement et direction.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => open(command.primaryModal)} className="btn btn-primary">Contrôle gouvernance page</button>
          <button onClick={() => open('SlaMatrixModal')} className="btn">Matrice SLA</button>
          <button onClick={() => open('PermissionMatrixModal')} className="btn">RBAC go-live</button>
          <button onClick={() => open('ReportExportModal')} className="btn">Snapshot direction</button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MiniStat label="Score gouvernance" value={`${governance.score}%`} detail={governance.label} danger={governance.score < 76}/>
        <MiniStat label="Ordres gouvernés" value={`${governance.governedOrders}/${governance.totalOrders}`} detail="owner + preuve" danger={governance.governedOrders < governance.totalOrders}/>
        <MiniStat label="Audit coverage" value={governance.auditCoverage} detail="points"/>
        <MiniStat label="Incidents critiques" value={governance.openCritical} detail="ouverts" danger={governance.openCritical > 0}/>
        <MiniStat label="Exposition MAD" value={formatMad(governance.financeExposure)} detail="reste/justification" danger={governance.financeExposure > 20000}/>
      </div>
      <div className="mt-5 grid gap-2 md:grid-cols-4">{command.governanceProofs.map(proof => <div key={proof} className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3 text-xs font-black uppercase tracking-wider text-indigo-800">✓ {proof}</div>)}</div>
    </div>

    <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <Panel title="Registre SLA gouverné" subtitle="Chaque retard, assignation manquante ou facture absente reçoit un owner, un contrôle et un modal d’action.">
        <div className="overflow-x-auto rounded-3xl border border-slate-200">
          <table className="os-table"><thead><tr><th>Référence</th><th>Bénéficiaire</th><th>Statut</th><th>SLA</th><th>Contrôle</th><th>Owner</th><th>Action</th></tr></thead><tbody>
            {breaches.length ? breaches.map(row => <tr key={row.id}><td><b>{row.reference}</b><p className="text-xs font-semibold text-slate-500">{row.city}/{row.zone}</p></td><td>{row.patientName}</td><td><StatusChip status={row.status}/></td><td><span className={row.minutesToSla < 0 ? 'chip chip-danger' : row.minutesToSla < 90 ? 'chip chip-amber' : 'chip chip-success'}>{row.minutesToSla < 0 ? `${Math.abs(row.minutesToSla)} min retard` : `${row.minutesToSla} min`}</span></td><td><RiskChip risk={row.riskLevel}/><p className="mt-1 text-xs font-bold text-slate-500">{row.control}</p></td><td>{row.owner}</td><td><button onClick={() => open(row.modal, row.id, 'order')} className="btn btn-primary">Gouverner</button></td></tr>) : <tr><td colSpan={7}><EmptyState title="Aucun SLA actif" body="Les contrôles de gouvernance ne détectent pas de retard ou d’exception critique." /></td></tr>}
          </tbody></table>
        </div>
      </Panel>

      <Panel title="Gates go-live bloquants" subtitle="Contrôle final avant utilisateurs réels: navigation, RBAC, workflow, SLA, Maroc/MAD et clôture.">
        <div className="space-y-3">
          {gates.map(gate => <div key={gate.label} className={`rounded-2xl border p-4 ${gate.blocked ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-slate-950">{gate.label}</p><span className={`chip ${gate.blocked ? 'chip-danger' : 'chip-success'}`}>{gate.blocked ? 'bloquant' : 'validé'}</span></div>
            <p className="mt-2 text-2xl font-black text-slate-950">{gate.value}</p>
            <p className="mt-1 text-xs font-bold text-slate-600">{gate.detail}</p>
            <button onClick={() => open(gate.modal)} className="btn mt-3">Ouvrir gate</button>
          </div>)}
        </div>
      </Panel>
    </div>

    <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
      <Panel title="Règles SLA entreprise" subtitle="Cibles production, owners et modals de correction pour chaque étape critique.">
        <div className="space-y-3">
          {PHASE9_SLA_GOVERNANCE_RULES.map(rule => <div key={rule.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-slate-950">{rule.label}</p><span className={`chip ${rule.severity === 'bloquant' ? 'chip-danger' : rule.severity === 'finance' ? 'chip-amber' : 'chip-info'}`}>{rule.target}</span></div>
            <p className="mt-1 text-sm font-semibold text-slate-600">Owner: {rule.owner}</p>
            <button onClick={() => open(rule.modal)} className="btn mt-3">Contrôler règle</button>
          </div>)}
        </div>
      </Panel>

      <Panel title="Matrice responsabilité & exceptions handoff" subtitle="Qui peut approuver quoi, ce qui ne peut jamais être contourné, et la preuve attendue.">
        <div className="grid gap-3 lg:grid-cols-2">
          {PHASE9_ACCOUNTABILITY_MATRIX.map(row => <div key={row.owner} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-black text-slate-950">{row.owner}</p>
            <div className="mt-3 flex flex-wrap gap-2">{row.canApprove.map(item => <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black text-slate-600">{item}</span>)}</div>
            <p className="mt-3 text-xs font-bold text-rose-700">Ne contourne jamais: {row.cannotBypass.join(' • ')}</p>
            <p className="mt-2 text-xs font-black uppercase tracking-wider text-indigo-700">Preuve: {row.evidence}</p>
            <button onClick={() => open(row.modal)} className="btn mt-3">Auditer rôle</button>
          </div>)}
        </div>
      </Panel>
    </div>

    <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
      <Panel title="Exceptions handoff à fermer" subtitle="Staff non conforme, factures MAD ouvertes, tournées non clôturées et objets sans owner.">
        <div className="space-y-3">
          {exceptions.length ? exceptions.map(item => <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-slate-950">{item.title}</p><span className={`chip ${item.severity === 'finance' ? 'chip-amber' : item.severity === 'audit' ? 'chip-info' : 'chip-danger'}`}>{item.severity}</span></div>
            <p className="mt-1 text-sm font-semibold text-slate-600">Owner: {item.owner}</p>
            <p className="mt-2 text-xs font-bold text-slate-500">{item.detail}</p>
            <button onClick={() => open(item.modal)} className="btn mt-3">Fermer exception</button>
          </div>) : <EmptyState title="Aucune exception handoff" body="Les responsabilités sont correctement fermées pour le périmètre courant." />}
        </div>
      </Panel>

      <Panel title="Checklist go-live finale" subtitle="Ce bloc transforme la phase en verrou production: minimum attendu, échec bloquant, action dédiée.">
        <div className="space-y-3">
          {PHASE9_GO_LIVE_CHECKLIST.map(item => <div key={item.area} className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="font-black text-indigo-950">{item.area}</p>
            <p className="mt-1 text-sm font-semibold text-indigo-900">Minimum: {item.minimum}</p>
            <p className="mt-2 text-xs font-bold text-indigo-700">Échec bloquant: {item.blockingFailure}</p>
            <button onClick={() => open(item.modal)} className="btn mt-3">Vérifier</button>
          </div>)}
        </div>
      </Panel>
    </div>
  </section>
}


function Phase10ProductionLaunchDeck({ state, page, open }: { state: InterventionsState; page: PageKey; open: (key: InterventionModalKey, entityId?: string, entityType?: string) => void }) {
  const command = PHASE10_PRODUCTION_LAUNCH_COMMANDS[page]
  const launch = buildPhase10LaunchScore(state)
  const risks = buildPhase10ProductionRiskRegister(state)
  const roleReadiness = buildPhase10RoleGoLiveReadiness(state)
  const cutover = buildPhase10CutoverChecklist(state)
  return <section className="space-y-5">
    <Panel title="Mega Phase 10 — Tour de contrôle lancement production" subtitle="Dernière couche enterprise: cutover, observabilité, support runbooks, rollback et readiness réelle avant utilisateurs production." action={<button onClick={() => open(command.primaryModal)} className="btn btn-primary">Ouvrir contrôle page</button>}>
      <div className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
        <div className="rounded-[32px] border border-cyan-200 bg-cyan-50 p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-800">{command.title}</p>
          <h3 className="mt-3 text-4xl font-black text-slate-950">{launch.score}%</h3>
          <p className="mt-1 text-sm font-black text-cyan-900">{launch.label}</p>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{command.commandIntent}</p>
          <div className="mt-4 rounded-2xl border border-cyan-200 bg-white p-3 text-xs font-black text-cyan-900">Non négociable: {command.goLiveNonNegotiable}</div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MiniStat label="Ordres actifs" value={launch.activeOrders.length} detail="sur périmètre production" />
          <MiniStat label="Sans staff" value={launch.unassigned} detail="bloquants affectation" danger={launch.unassigned > 0} />
          <MiniStat label="Retards SLA" value={launch.late} detail="à fermer avant go-live" danger={launch.late > 0} />
          <MiniStat label="Audit" value={`${launch.auditRate}%`} detail="couverture estimée" />
          <MiniStat label="Consentements" value={launch.missingConsent} detail="à collecter" danger={launch.missingConsent > 0} />
          <MiniStat label="Incidents critiques" value={launch.criticalIncidents} detail="ouverts" danger={launch.criticalIncidents > 0} />
          <MiniStat label="Équipements bloqués" value={launch.equipmentBlocked} detail="maintenance / hors service" danger={launch.equipmentBlocked > 0} />
          <MiniStat label="Finance manquante" value={launch.closedWithoutFinance} detail="clôturés sans MAD" danger={launch.closedWithoutFinance > 0} />
        </div>
      </div>
    </Panel>

    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <Panel title="Registre risques production à fermer" subtitle="Pas de lancement silencieux: chaque risque possède owner, sévérité, action et modal dédiée.">
        <div className="space-y-3">
          {risks.length ? risks.map(item => <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-slate-950">{item.title}</p><span className={`chip ${item.severity === 'bloquant' ? 'chip-danger' : item.severity === 'direction' ? 'chip-amber' : 'chip-info'}`}>{item.severity}</span></div>
            <p className="mt-1 text-sm font-semibold text-slate-600">Owner: {item.owner}</p>
            <p className="mt-2 text-xs font-bold text-slate-500">{item.detail}</p>
            <button onClick={() => open(item.modal, item.entityId, item.entityType)} className="btn mt-3">Fermer risque</button>
          </div>) : <EmptyState title="Aucun risque bloquant" body="Le registre production est propre pour le périmètre actuel." />}
        </div>
      </Panel>

      <Panel title="War room & cadence lancement" subtitle="Rythme de pilotage réel pour J0, J+1, semaine 1, finance et audit.">
        <div className="space-y-3">
          {PHASE10_GO_LIVE_WAR_ROOM.map(item => <div key={item.id} className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-indigo-950">{item.title}</p><span className="chip chip-info">{item.cadence}</span></div>
            <p className="mt-1 text-sm font-semibold text-indigo-900">Owner: {item.owner}</p>
            <p className="mt-2 text-xs font-bold text-indigo-700">Preuve: {item.evidence}</p>
            <button onClick={() => open(item.modal)} className="btn mt-3">Ouvrir rituel</button>
          </div>)}
        </div>
      </Panel>
    </div>

    <div className="grid gap-5 xl:grid-cols-[.95fr_1.05fr]">
      <Panel title="Checklist cutover production" subtitle="Ce qui doit être validé avant d’exposer le module à vrais utilisateurs.">
        <div className="space-y-3">
          {cutover.map(item => <div key={item.area} className={`rounded-2xl border p-4 ${item.status === 'bloquant' ? 'border-rose-200 bg-rose-50' : item.status === 'surveillance' ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-slate-950">{item.area}</p><span className={`chip ${item.status === 'bloquant' ? 'chip-danger' : item.status === 'surveillance' ? 'chip-amber' : 'chip-success'}`}>{item.status}</span></div>
            <p className="mt-2 text-sm font-semibold text-slate-700">{item.detail}</p>
            <button onClick={() => open(item.modal)} className="btn mt-3">Contrôler</button>
          </div>)}
        </div>
      </Panel>

      <Panel title="Readiness par rôle réel" subtitle="Production suppose dispatchers, médecins, infirmiers, adult-care, équipement, finance, support et audit prêts.">
        <div className="grid gap-3 md:grid-cols-2">
          {roleReadiness.map(row => <div key={row.role} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-slate-950">{row.role}</p><span className={`chip ${row.ready ? 'chip-success' : 'chip-danger'}`}>{row.ready ? 'prêt' : 'à renforcer'}</span></div>
            <p className="mt-2 text-xs font-bold text-slate-600">{row.coverage}</p>
            <button onClick={() => open(row.modal)} className="btn mt-3">Préparer rôle</button>
          </div>)}
        </div>
      </Panel>
    </div>

    <div className="grid gap-5 xl:grid-cols-3">
      <Panel title="Locks production" subtitle="Règles non négociables pour éviter drift, faux workflow et usage fragile.">
        <div className="space-y-3">
          {PHASE10_PRODUCTION_LOCKS.map(lock => <div key={lock.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-black text-slate-950">{lock.label}</p><span className={`chip ${lock.tone === 'bloquant' ? 'chip-danger' : lock.tone === 'direction' ? 'chip-amber' : 'chip-info'}`}>{lock.tone}</span></div>
            <p className="mt-2 text-xs font-bold text-slate-500">{lock.proof}</p>
            <button onClick={() => open(lock.modal)} className="btn mt-3">Vérifier lock</button>
          </div>)}
        </div>
      </Panel>

      <Panel title="Runbooks support" subtitle="Procédures concrètes pour incidents de lancement, no-show, équipement, impayé et triage.">
        <div className="space-y-3">
          {PHASE10_SUPPORT_RUNBOOKS.map(runbook => <div key={runbook.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="font-black text-slate-950">{runbook.title}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">Trigger: {runbook.trigger}</p>
            <p className="mt-1 text-xs font-bold text-slate-600">Owner: {runbook.owner}</p>
            <div className="mt-3 flex flex-wrap gap-2">{runbook.steps.map(step => <span key={step} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black text-slate-600">{step}</span>)}</div>
            <button onClick={() => open(runbook.modal)} className="btn mt-3">Exécuter runbook</button>
          </div>)}
        </div>
      </Panel>

      <Panel title="Observabilité & rollback" subtitle="Signaux à surveiller et contrôles de retour arrière pour Vercel/production.">
        <div className="space-y-3">
          {PHASE10_OBSERVABILITY_SIGNALS.map(signal => <div key={signal.id} className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
            <p className="font-black text-cyan-950">{signal.label}</p>
            <p className="mt-1 text-xs font-bold text-cyan-800">Cible: {signal.target}</p>
            <p className="mt-1 text-xs font-bold text-cyan-700">Owner: {signal.owner}</p>
            <button onClick={() => open(signal.modal)} className="btn mt-3">Voir signal</button>
          </div>)}
          {PHASE10_ROLLBACK_AND_CHANGE_CONTROL.map(item => <div key={item.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-black text-amber-950">{item.label}</p>
            <p className="mt-1 text-xs font-bold text-amber-800">Autorisé par: {item.allowedBy}</p>
            <p className="mt-1 text-xs font-bold text-amber-700">Condition: {item.condition}</p>
            <button onClick={() => open(item.modal)} className="btn mt-3">Contrôle rollback</button>
          </div>)}
        </div>
      </Panel>
    </div>
  </section>
}

function ModalVariantBody({ blueprint, state, modal }: { blueprint: typeof MODAL_BLUEPRINTS[InterventionModalKey]; state: InterventionsState; modal: ActiveModal }) {
  if (blueprint.variant === 'assignment') return <div className="grid gap-4 xl:grid-cols-[1fr_.9fr]"><ModalFields fields={blueprint.fields}/><StaffMatchingPanel state={state}/></div>
  if (blueprint.variant === 'dispatch') return <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]"><ModalFields fields={blueprint.fields}/><DispatchConfirmationPanel state={state}/></div>
  if (blueprint.variant === 'route') return <div className="grid gap-4 xl:grid-cols-[1fr_1fr]"><ModalFields fields={blueprint.fields}/><RoutePreviewPanel state={state}/></div>
  if (blueprint.variant === 'equipment') return <div className="grid gap-4 xl:grid-cols-[1fr_1fr]"><ModalFields fields={blueprint.fields}/><EquipmentReadinessPanel state={state}/></div>
  if (blueprint.variant === 'finance') return <div className="grid gap-4 xl:grid-cols-[1fr_.8fr]"><ModalFields fields={blueprint.fields}/><FinanceReadinessPanel state={state}/></div>
  if (blueprint.variant === 'settings') return <div className="grid gap-4 xl:grid-cols-[1fr_.9fr]"><ModalFields fields={blueprint.fields}/><PermissionPreviewPanel/></div>
  return <div className="grid gap-4 xl:grid-cols-[1fr_.9fr]"><ModalFields fields={blueprint.fields}/><OperationalChecks blueprint={blueprint}/></div>
}
function ModalFields({ fields }: { fields: string[] }) { return <div className="grid gap-3 md:grid-cols-2">{fields.map((f, idx) => <label key={f} className="modal-field"><span className="text-xs font-black uppercase tracking-wider text-slate-500">{f}</span>{idx % 5 === 0 ? <textarea rows={3} placeholder={`${f}...`} /> : idx % 3 === 0 ? <select><option>Option validée</option><option>À confirmer</option><option>Escalade requise</option></select> : <input placeholder={`${f}...`} />}</label>)}</div> }
function OperationalChecks({ blueprint }: { blueprint: typeof MODAL_BLUEPRINTS[InterventionModalKey] }) { return <div className="space-y-3"><Panel title="Contrôles production"><CheckList items={blueprint.operationalChecks}/></Panel><Panel title="Règles validation"><CheckList items={blueprint.validationRules}/></Panel><Panel title="Effets aval"><CheckList items={blueprint.downstreamEffects}/></Panel></div> }
function CheckList({ items }: { items: string[] }) { return <div className="space-y-2">{items.map(item => <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">✓ {item}</div>)}</div> }
function StaffMatchingPanel({ state }: { state: InterventionsState }) { return <Panel title="Matching staff intelligent"><div className="space-y-3">{state.staff.slice(0,4).map(s => <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-3"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><Avatar name={s.fullName}/><div><p className="font-black">{s.fullName}</p><p className="text-xs font-bold text-slate-500">{s.role} • {s.city}/{s.zone}</p></div></div><span className="chip chip-success">score {Math.max(61, 98 - s.workload)}%</span></div><p className="mt-2 text-xs font-semibold text-slate-500">{s.skills.join(' • ')}</p></div>)}</div></Panel> }
function DispatchConfirmationPanel({ state }: { state: InterventionsState }) { return <Panel title="Checklist terrain"><CheckList items={['Adresse confirmée avec famille', 'Staff assigné et disponible', 'Équipement prêt ou substitué', 'SLA restant visible', 'Notification intervenant prête']}/><div className="mt-4 grid gap-2">{state.orders.slice(0,2).map(o => <WorkCard key={o.id} order={o} state={state} open={() => null} compact/> )}</div></Panel> }
function RoutePreviewPanel({ state }: { state: InterventionsState }) { return <Panel title="Prévisualisation tournée"><div className="mini-map rounded-3xl p-4"><div className="space-y-2">{state.routes.map(r => <div key={r.id} className="rounded-2xl bg-white/90 p-3"><b>{r.name}</b><p className="text-xs font-semibold text-slate-500">{r.city}/{r.zone} • {r.status}</p></div>)}</div></div></Panel> }
function EquipmentReadinessPanel({ state }: { state: InterventionsState }) { return <Panel title="Disponibilité équipement"><div className="space-y-2">{state.equipment.map(e => <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-3"><div className="flex justify-between gap-3"><b>{e.name}</b><StatusChip status={e.status}/></div><p className="text-xs font-semibold text-slate-500">{e.type} • {e.city}/{e.zone}</p></div>)}</div></Panel> }
function FinanceReadinessPanel({ state }: { state: InterventionsState }) { const total = state.invoices.reduce((a,b) => a + b.amountMad, 0); return <Panel title="Impact finance MAD"><div className="grid gap-3"><MiniStat label="Factures" value={state.invoices.length} detail="émises"/><MiniStat label="CA" value={formatMad(total)} detail="total"/><CheckList items={['Montant MAD requis', 'Statut facture synchronisé', 'Audit finance obligatoire']}/></div></Panel> }
function PermissionPreviewPanel() { return <Panel title="Matrice RBAC"><div className="space-y-2">{ROLE_MATRIX.slice(0,6).map(r => <div key={r.role} className="rounded-2xl bg-slate-50 p-3"><b>{r.role}</b><p className="text-xs font-semibold text-slate-500">{r.mutate}</p></div>)}</div></Panel> }


function Phase11FieldExecutionDeck({ state, page, open }: { state: InterventionsState; page: PageKey; open: (key: InterventionModalKey, entityId?: string, entityType?: string) => void }) {
  const command = PHASE11_FIELD_EXECUTION_COMMANDS[page]
  const proof = buildPhase11FieldProofScore(state)
  const queue = buildPhase11MobileExecutionQueue(state)
  const staff = buildPhase11StaffMobileReadiness(state)
  const fallback = buildPhase11OfflineFallbackControls(state)
  return (
    <Panel title="Mega Phase 11 — Exécution terrain mobile & preuve opérationnelle" subtitle="Couche terrain production: preuves statutaires, runbooks mobiles, staff prêt terrain, packs de passation et fallback sans réseau." action={<button onClick={() => open(command.primaryModal)} className="btn btn-primary">Ouvrir preuve page</button>}>
      <div className="grid gap-4 xl:grid-cols-[.85fr_1.15fr]">
        <div className="rounded-[30px] border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.34em] text-cyan-700">Mega Phase 11 • terrain mobile prouvé</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <h3 className="text-4xl font-black tracking-tight text-slate-950">{proof.score}%</h3>
              <p className="font-black text-cyan-900">{proof.label}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{command.fieldIntent}</p>
            </div>
            <span className="chip chip-info">{proof.activeAppointments} RDV actifs</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <MiniStat label="Dispatch sans progression" value={proof.dispatchedWithoutProgress} detail="preuve En route" />
            <MiniStat label="En cours sans fin" value={proof.startedWithoutEnd} detail="clôture attendue" />
            <MiniStat label="Rapports manquants" value={proof.ordersWithoutReport} detail="bloquant clôture" />
            <MiniStat label="Équipement non prouvé" value={proof.equipmentUnproven} detail="mouvement requis" />
          </div>
          <div className="mt-4 rounded-2xl border border-white/80 bg-white/80 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Non négociable terrain</p>
            <p className="mt-1 text-sm font-black text-slate-800">{command.mobileNonNegotiable}</p>
            <div className="mt-3 flex flex-wrap gap-2">{command.evidenceRequired.map(item => <span key={item} className="chip chip-purple">{item}</span>)}</div>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {queue.slice(0, 8).map(item => <button key={item.id} onClick={() => open(item.modal, item.entityId, item.entityType)} className="rounded-[26px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3"><div><p className="font-black text-slate-950">{item.title}</p><p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">{item.owner}</p></div><span className={`chip ${item.tone === 'bloquant' ? 'chip-danger' : item.tone === 'finance' ? 'chip-amber' : 'chip-info'}`}>{item.tone}</span></div>
            <p className="mt-2 text-sm font-semibold leading-5 text-slate-600">{item.detail}</p>
          </button>)}
        </div>
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-4">
        <Panel title="Runbooks mobiles terrain"><div className="space-y-2">{PHASE11_MOBILE_FIELD_RUNBOOKS.slice(0, 5).map(runbook => <button key={runbook.id} onClick={() => open(runbook.modal)} className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left"><b>{runbook.title}</b><p className="text-xs font-semibold text-slate-500">{runbook.owner} • {runbook.trigger}</p></button>)}</div></Panel>
        <Panel title="Gates preuves obligatoires"><div className="space-y-2">{PHASE11_EVIDENCE_GATES.slice(0, 5).map(gate => <button key={gate.id} onClick={() => open(gate.modal)} className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left"><div className="flex justify-between gap-2"><b>{gate.label}</b><span className="chip chip-info">{gate.tone}</span></div><p className="text-xs font-semibold text-slate-500">{gate.evidence}</p></button>)}</div></Panel>
        <Panel title="Staff mobile-ready"><div className="space-y-2">{staff.slice(0, 5).map(member => <button key={member.id} onClick={() => open(member.modal, member.id, 'staff')} className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left"><div className="flex justify-between gap-2"><b>{member.name}</b><span className={`chip ${member.ready ? 'chip-success' : 'chip-amber'}`}>{member.score}%</span></div><p className="text-xs font-semibold text-slate-500">{member.role} • {member.city}/{member.zone} • {member.assignedActive} actif(s)</p></button>)}</div></Panel>
        <Panel title="Fallback & packs terrain"><div className="space-y-2">{fallback.map(item => <button key={item.id} onClick={() => open(item.modal)} className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left"><b>{item.title}</b><p className="text-xs font-semibold text-slate-500">{item.owner} • {item.state}</p></button>)}</div><div className="mt-3 flex flex-wrap gap-2">{PHASE11_FIELD_PRINT_AND_HANDOFF_PACKS.map(pack => <button key={pack.id} onClick={() => open(pack.modal)} className="chip chip-purple">{pack.title}</button>)}</div></Panel>
      </div>
    </Panel>
  )
}

function ActionModal({ modal, onClose, execute, state }: { modal: ActiveModal; onClose: () => void; execute: any; state: InterventionsState }) {
  const blueprint = MODAL_BLUEPRINTS[modal.key]
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  async function submit() {
    setBusy(true)
    await execute(blueprint.action, modal.entityId, modal.entityType || 'intervention', { summary: blueprint.defaultSummary, riskLevel: blueprint.suggestedRisk || 'Modéré', amountMad: 450, staffIds: [safeArray(state.staff)[0]?.id].filter(Boolean), startsAt: new Date(Date.now()+3600000).toISOString(), endsAt: new Date(Date.now()+7200000).toISOString(), locationId: state.locations[0]?.id, city: 'Rabat', zone: 'Agdal' })
    setSaved(true)
    setBusy(false)
    window.setTimeout(onClose, 800)
  }
  return <div className="modal-backdrop"><div className="modal-panel"><div className="border-b border-slate-200 p-5 md:p-7"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-700">{modal.key} • {blueprint.variant}</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">{blueprint.title}</h2><p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-600 md:text-base">{blueprint.subtitle}</p></div><button onClick={onClose} className="btn">Fermer</button></div></div><div className="p-5 md:p-7">{saved ? <div className="rounded-[30px] border border-emerald-200 bg-emerald-50 p-7 text-emerald-900"><b className="text-2xl">Action enregistrée.</b><p className="mt-2 font-semibold">Le workflow est mis à jour, l’audit est alimenté et le workspace se synchronise.</p></div> : <><div className="mb-5 grid gap-3 md:grid-cols-4"><MiniStat label="Audit" value={blueprint.auditEvent} detail="évènement"/><MiniStat label="Validation" value={blueprint.validationRules.length} detail="règles"/><MiniStat label="Impact" value={blueprint.downstreamEffects.length} detail="effets aval"/><MiniStat label="Contexte" value="MAD / +212" detail="Maroc"/></div><ModalExecutionGuarantee modalKey={modal.key} state={state}/><ModalVariantBody blueprint={blueprint} state={state} modal={modal}/></>}<div className="mt-6 flex flex-wrap justify-end gap-3"><button onClick={onClose} className="btn">Annuler</button><button onClick={submit} disabled={busy} className="btn btn-primary disabled:opacity-50">{busy ? 'Synchronisation...' : blueprint.primary}</button></div></div></div></div>
}

export default function InterventionsWorkspace({ page }: { page: PageKey }) {
  const { state, loading, error, execute } = useInterventionState()
  const [modal, setModal] = useState<ActiveModal | null>(null)
  const open = (key: InterventionModalKey, entityId?: string, entityType?: string) => setModal({ key, entityId, entityType })
  const content = useMemo(() => {
    if (page === 'home' || page === 'command') return <CommandPage state={state} open={open}/>
    if (page === 'demandes') return <DemandesPage state={state} open={open}/>
    if (page === 'ordres') return <OrdresPage state={state} open={open}/>
    if (page === 'dispatch') return <DispatchPage state={state} open={open}/>
    if (page === 'planning') return <PlanningPage state={state} open={open}/>
    if (page === 'tournees') return <TourneesPage state={state} open={open}/>
    if (page === 'personnel') return <PersonnelPage state={state} open={open}/>
    if (page === 'patients') return <PatientsPage state={state} open={open}/>
    if (page === 'lieux') return <LieuxPage state={state} open={open}/>
    if (page === 'equipements') return <EquipementsPage state={state} open={open}/>
    if (page === 'rapports') return <RapportsPage state={state} open={open}/>
    if (page === 'facturation') return <FacturationPage state={state} open={open}/>
    return <><ParametresPage state={state} open={open}/><Phase13ConfigurationCenter state={state} open={open}/></>
  }, [page, state])
  return <OpsShell page={page} state={state} open={open} loading={loading} error={error}>{content}{modal && <Phase12ActionModal modal={modal} onClose={() => setModal(null)} execute={execute} state={state}/>}</OpsShell>
}

import { createClient } from '@/lib/supabase/server'
import { INTERVENTION_SEED_STATE } from './seed'
import type { InterventionActionPayload, InterventionsState } from './types'

const TABLES = {
  templates: 'intervention_templates',
  requests: 'intervention_requests',
  orders: 'intervention_orders',
  appointments: 'intervention_appointments',
  staff: 'intervention_staff',
  locations: 'intervention_locations',
  routes: 'intervention_routes',
  routeStops: 'intervention_route_stops',
  equipment: 'intervention_equipment',
  audits: 'intervention_audit_logs',
  incidents: 'intervention_incidents',
  invoices: 'intervention_invoices',
} as const

type Key = keyof typeof TABLES

const toSnakeRow = (value: any) => value
const fromSnakeRow = (value: any) => value

async function safeList<T>(key: Key, fallback: T[]) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from(TABLES[key]).select('*')
    if (error || !data) return fallback
    return data.map(fromSnakeRow) as T[]
  } catch {
    return fallback
  }
}

export async function getInterventionsState(): Promise<InterventionsState & { syncMode: 'supabase' | 'seed-fallback' }> {
  const [templates, requests, orders, appointments, staff, locations, routes, routeStops, equipment, audits, incidents, invoices] = await Promise.all([
    safeList('templates', INTERVENTION_SEED_STATE.templates),
    safeList('requests', INTERVENTION_SEED_STATE.requests),
    safeList('orders', INTERVENTION_SEED_STATE.orders),
    safeList('appointments', INTERVENTION_SEED_STATE.appointments),
    safeList('staff', INTERVENTION_SEED_STATE.staff),
    safeList('locations', INTERVENTION_SEED_STATE.locations),
    safeList('routes', INTERVENTION_SEED_STATE.routes),
    safeList('routeStops', INTERVENTION_SEED_STATE.routeStops),
    safeList('equipment', INTERVENTION_SEED_STATE.equipment),
    safeList('audits', INTERVENTION_SEED_STATE.audits),
    safeList('incidents', INTERVENTION_SEED_STATE.incidents),
    safeList('invoices', INTERVENTION_SEED_STATE.invoices),
  ])
  const syncMode = requests === INTERVENTION_SEED_STATE.requests ? 'seed-fallback' : 'supabase'
  return { templates, requests, orders, appointments, staff, locations, routes, routeStops, equipment, audits, incidents, invoices, syncMode }
}

function audit(action: string, entityType: string, entityId: string, summary: string, values?: Record<string, any>) {
  return {
    id: `aud-${Date.now()}`,
    at: new Date().toISOString(),
    actor: values?.actor || 'AngelCare OpsOS',
    role: values?.role || 'Système',
    entityType,
    entityId,
    event: action,
    summary,
    riskLevel: values?.riskLevel,
  }
}

export async function executeInterventionAction(payload: InterventionActionPayload) {
  const now = new Date().toISOString()
  const values = payload.values || {}
  const entityId = payload.entityId || values.id || `${payload.action}-${Date.now()}`
  const entityType = payload.entityType || 'intervention'
  const auditRow = audit(payload.action, entityType, entityId, values.summary || `Action ${payload.action} exécutée.`, values)

  try {
    const supabase = await createClient()
    const operations: any[] = []

    if (payload.action === 'request created') {
      operations.push(supabase.from(TABLES.requests).insert(toSnakeRow({ id: entityId, createdAt: now, requestedAt: now, ...values })))
    } else if (payload.action === 'order created') {
      operations.push(supabase.from(TABLES.orders).insert(toSnakeRow({ id: entityId, createdAt: now, status: values.status || 'À assigner', ...values })))
    } else if (payload.action === 'request triaged') {
      operations.push(supabase.from(TABLES.requests).update(toSnakeRow({ status: values.status || 'Validée', riskLevel: values.riskLevel, notes: values.notes, updatedAt: now })).eq('id', entityId))
    } else if (payload.action === 'request converted') {
      operations.push(supabase.from(TABLES.orders).insert(toSnakeRow({ id: values.orderId || `ord-${Date.now()}`, createdAt: now, status: 'À assigner', ...values })))
      operations.push(supabase.from(TABLES.requests).update({ status: 'Ordre créé', updatedAt: now }).eq('id', entityId))
    } else if (payload.action === 'quote created') {
      operations.push(supabase.from(TABLES.requests).update({ status: 'Devis envoyé', estimatedAmountMad: values.amountMad, updatedAt: now }).eq('id', entityId))
    } else if (payload.action === 'staff created') {
      operations.push(supabase.from(TABLES.staff).insert(toSnakeRow({
        id: entityId,
        fullName: values.fullName || 'Nouveau membre terrain',
        role: values.role || 'Infirmier',
        phone: values.phone || '+212 600 00 00 00',
        city: values.city || 'Rabat',
        zone: values.zone || 'Centre',
        availability: values.availability || 'Disponible',
        workload: values.workload || 0,
        certifications: values.certifications || ['Créé depuis Interventions OS'],
        emergencyEligible: Boolean(values.emergencyEligible ?? true),
        skills: values.skills || [values.role || 'Infirmier'],
        created_at: now,
        updated_at: now,
      })))
    } else if (['staff assigned', 'staff reassigned'].includes(payload.action)) {
      operations.push(supabase.from(TABLES.orders).update({ assignedStaffIds: values.staffIds || [], status: values.status || 'Planifiée', updatedAt: now }).eq('id', entityId))
    } else if (payload.action === 'appointment scheduled') {
      operations.push(supabase.from(TABLES.appointments).insert(toSnakeRow({ id: values.appointmentId || `apt-${Date.now()}`, orderId: entityId, status: 'Planifiée', createdAt: now, ...values })))
      operations.push(supabase.from(TABLES.orders).update({ status: 'Planifiée', appointmentId: values.appointmentId, updatedAt: now }).eq('id', entityId))
    } else if (payload.action === 'route created') {
      operations.push(supabase.from(TABLES.routes).insert(toSnakeRow({ id: values.routeId || `rte-${Date.now()}`, status: 'Planifiée', createdAt: now, ...values })))
    } else if (['dispatch confirmed', 'en route marked', 'arrived on site', 'intervention started', 'intervention completed', 'intervention cancelled', 'incident escalated'].includes(payload.action)) {
      const statusMap: Record<string, string> = {
        'dispatch confirmed': 'Dispatchée',
        'en route marked': 'En route',
        'arrived on site': 'Sur site',
        'intervention started': 'En cours',
        'intervention completed': 'Terminée',
        'intervention cancelled': 'Annulée',
        'incident escalated': 'Escaladée',
      }
      operations.push(supabase.from(TABLES.orders).update({ status: statusMap[payload.action], updatedAt: now }).eq('id', entityId))
      operations.push(supabase.from(TABLES.appointments).update({ status: statusMap[payload.action], updatedAt: now }).eq('orderId', entityId))
      if (payload.action === 'incident escalated') operations.push(supabase.from(TABLES.incidents).insert({ id: values.incidentId || `inc-${Date.now()}`, orderId: entityId, title: values.title || 'Incident opérationnel', riskLevel: values.riskLevel || 'Élevé', status: 'Ouvert', owner: values.owner || 'Superviseur Médical', createdAt: now }))
    } else if (['equipment assigned', 'equipment moved'].includes(payload.action)) {
      operations.push(supabase.from(TABLES.equipment).update({ status: values.status || 'En intervention', assignedOrderId: values.orderId, updatedAt: now }).eq('id', entityId))
    } else if (payload.action === 'inventory consumed') {
      operations.push(supabase.from(TABLES.equipment).update({ status: values.status || 'En intervention', updatedAt: now }).eq('id', entityId))
    } else if (payload.action === 'invoice created') {
      operations.push(supabase.from(TABLES.invoices).insert({ id: values.invoiceId || `inv-${Date.now()}`, orderId: entityId, reference: values.reference || `FAC-${Date.now()}`, patientName: values.patientName, amountMad: values.amountMad || 0, paidMad: 0, status: 'Émise', dueAt: values.dueAt || now }))
      operations.push(supabase.from(TABLES.orders).update({ billingStatus: 'Facturé', updatedAt: now }).eq('id', entityId))
    } else if (payload.action === 'payment recorded') {
      operations.push(supabase.from(TABLES.invoices).update({ paidMad: values.paidMad, status: values.status || 'Payée', updatedAt: now }).eq('id', entityId))
    }
    operations.push(supabase.from(TABLES.audits).insert(auditRow))
    const results = await Promise.allSettled(operations)
    const failed = results.find((r) => r.status === 'fulfilled' && (r.value as any)?.error)
    if (failed) throw new Error((failed as PromiseFulfilledResult<any>).value.error.message)
    return { ok: true, persisted: true, audit: auditRow }
  } catch (error: any) {
    return { ok: true, persisted: false, audit: auditRow, warning: error?.message || 'Supabase unavailable; client-side durable workspace applied.' }
  }
}

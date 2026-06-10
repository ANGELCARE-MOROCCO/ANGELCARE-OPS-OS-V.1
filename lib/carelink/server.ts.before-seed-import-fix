import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSeedDashboard, seedAgent, seedMessages, seedMissions } from './seed'
import type { CareLinkMission, CareLinkStatus } from './types'

export const CARELINK_TABLES = {
  agents: 'carelink_field_agents',
  missions: 'carelink_field_missions',
  assignments: 'carelink_mission_assignments',
  events: 'carelink_mission_events',
  reports: 'carelink_mission_reports',
  incidents: 'carelink_mission_incidents',
  messages: 'carelink_dispatch_messages',
  availability: 'carelink_agent_availability',
  documents: 'carelink_agent_documents',
} as const

type JsonInit = ResponseInit & { status?: number }

export function carelinkJson(payload: unknown, init?: JsonInit) {
  const response = NextResponse.json(payload, init)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

export function safeError(error: unknown, fallback = 'CareLink request failed') {
  return error instanceof Error ? error.message : fallback
}

export async function getCarelinkSupabase() {
  try {
    return await createClient()
  } catch {
    return null
  }
}

export async function loadCarelinkDashboard() {
  const supabase = await getCarelinkSupabase()
  if (!supabase) return { source: 'seed', data: getSeedDashboard() }

  try {
    const [missionsRes, messagesRes] = await Promise.all([
      supabase.from(CARELINK_TABLES.missions).select('*').order('scheduled_start', { ascending: true }).limit(50),
      supabase.from(CARELINK_TABLES.messages).select('*').order('created_at', { ascending: false }).limit(30),
    ])

    if (missionsRes.error) throw new Error(missionsRes.error.message)

    const rows = Array.isArray(missionsRes.data) ? missionsRes.data : []
    const missions = rows.map(mapMissionRow)
    const dashboard = getSeedDashboard()
    dashboard.upcomingMissions = missions.length ? missions : seedMissions
    dashboard.todayMissions = dashboard.upcomingMissions.filter((mission) => mission.scheduledStart.slice(0, 10) === new Date().toISOString().slice(0, 10))
    dashboard.nextMission = dashboard.upcomingMissions[0] || null
    dashboard.messages = messagesRes.error || !Array.isArray(messagesRes.data) ? seedMessages : messagesRes.data.map((row: any) => ({
      id: String(row.id),
      missionId: row.mission_id ? String(row.mission_id) : undefined,
      sender: row.sender || 'dispatch',
      title: row.title || 'MESSAGE DISPATCH',
      body: row.body || '',
      createdAt: row.created_at || new Date().toISOString(),
      urgent: Boolean(row.urgent),
    }))
    dashboard.stats.todayMissions = dashboard.todayMissions.length
    dashboard.stats.weekHours = dashboard.upcomingMissions.reduce((sum, mission) => sum + mission.hoursEstimate, 0)
    return { source: 'supabase', data: dashboard }
  } catch {
    return { source: 'seed', data: getSeedDashboard() }
  }
}

export async function loadCarelinkMissions() {
  const dashboard = await loadCarelinkDashboard()
  return { source: dashboard.source, data: dashboard.data.upcomingMissions }
}

export async function loadCarelinkMission(id: string) {
  const supabase = await getCarelinkSupabase()
  if (supabase) {
    try {
      const { data, error } = await supabase.from(CARELINK_TABLES.missions).select('*').eq('id', id).maybeSingle()
      if (!error && data) return { source: 'supabase', data: mapMissionRow(data) }
    } catch {}
  }
  const mission = seedMissions.find((item) => item.id === id || item.code === id) || seedMissions[0] || null
  return { source: 'seed', data: mission }
}

export async function recordMissionAction(id: string, action: string, payload: Record<string, any> = {}) {
  const statusByAction: Record<string, CareLinkStatus> = {
    accept: 'agent_accepted',
    decline: 'agent_declined',
    'en-route': 'en_route',
    arrived: 'arrived',
    start: 'started',
    complete: 'completed',
    incident: 'incident_reported',
    report: 'completed',
  }
  const newStatus = statusByAction[action] || 'agent_notified'
  const supabase = await getCarelinkSupabase()
  if (supabase) {
    try {
      await supabase.from(CARELINK_TABLES.events).insert({
        mission_id: id,
        agent_id: payload.agentId || seedAgent.id,
        event_type: action,
        event_payload: payload,
        gps_lat: payload.gpsLat || null,
        gps_lng: payload.gpsLng || null,
        created_by: payload.actor || 'field_agent',
      })
      await supabase.from(CARELINK_TABLES.missions).update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id)
      if (action === 'incident') {
        await supabase.from(CARELINK_TABLES.incidents).insert({
          mission_id: id,
          agent_id: payload.agentId || seedAgent.id,
          severity: payload.severity || 'medium',
          title: payload.title || 'Incident signalé depuis CareLink',
          description: payload.description || payload.note || null,
          status: 'open',
        })
      }
      if (action === 'report') {
        await supabase.from(CARELINK_TABLES.reports).insert({
          mission_id: id,
          agent_id: payload.agentId || seedAgent.id,
          summary: payload.summary || null,
          care_notes: payload.careNotes || null,
          incident_flag: Boolean(payload.incidentFlag),
          completion_status: payload.completionStatus || 'submitted',
          submitted_at: new Date().toISOString(),
        })
      }
      return { source: 'supabase', status: newStatus }
    } catch (error) {
      return { source: 'seed', status: newStatus, warning: safeError(error) }
    }
  }
  return { source: 'seed', status: newStatus }
}

function arr(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : []
}

function mapMissionRow(row: any): CareLinkMission {
  return {
    id: String(row.id),
    code: row.mission_code || row.code || `AC-MISSION-${row.id}`,
    serviceType: row.service_type || 'MISSION TERRAIN ANGELCARE',
    serviceCategory: (row.service_category || 'home_support') as CareLinkMission['serviceCategory'],
    clientName: row.client_name || 'CLIENT PRIVÉ',
    beneficiaryName: row.beneficiary_name || 'BÉNÉFICIAIRE PRIVÉ',
    beneficiaryAge: row.beneficiary_age || undefined,
    scheduledStart: row.scheduled_start || new Date().toISOString(),
    scheduledEnd: row.scheduled_end || new Date().toISOString(),
    city: row.city || 'Rabat',
    zone: row.zone || row.area || 'Zone non précisée',
    addressHint: row.address_hint || row.address || 'ADRESSE MASQUÉE',
    riskLevel: (row.risk_level || 'low') as CareLinkMission['riskLevel'],
    priority: (row.priority || 'normal') as CareLinkMission['priority'],
    status: (row.status || 'assigned') as CareLinkMission['status'],
    payEstimateMad: Number(row.pay_estimate_mad || 0),
    hoursEstimate: Number(row.hours_estimate || 0),
    instructions: arr(row.instructions),
    safetyNotes: arr(row.safety_notes),
    checklist: Array.isArray(row.checklist) ? row.checklist : [],
    dispatcherName: row.dispatcher_name || 'DISPATCH ANGELCARE',
    dispatcherPhone: row.dispatcher_phone || '+212 5 00 00 00 00',
    lastEventAt: row.updated_at || row.created_at || new Date().toISOString(),
  }
}

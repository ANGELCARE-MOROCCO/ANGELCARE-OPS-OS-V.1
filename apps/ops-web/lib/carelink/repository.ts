import { carelinkAgents, carelinkMissions, dispatchThreads, opsKpis } from './seed'
import { computeReadiness } from './readiness'
import { detectScheduleConflicts } from './schedule-conflicts'
import type { CareLinkMission, CareLinkStatus } from './types'

export async function getCareLinkAgent() { return carelinkAgents[0] }
export async function getCareLinkAgents() { return carelinkAgents }
export async function getCareLinkMissions() { return carelinkMissions }
export async function getCareLinkMission(id: string) { return carelinkMissions.find((mission) => mission.id === id || mission.code === id) || carelinkMissions[0] }
export async function getCareLinkThreads() { return dispatchThreads }
export async function getCareLinkOpsKpis() { return opsKpis }

export async function getCareLinkDashboard() {
  const agent = await getCareLinkAgent()
  const missions = await getCareLinkMissions()
  const nextMission = missions[0]
  return {
    agent,
    nextMission,
    missionsToday: missions,
    readiness: computeReadiness(agent, nextMission),
    alerts: dispatchThreads.filter((thread) => thread.priority !== 'normal'),
    conflicts: detectScheduleConflicts(missions),
  }
}

export async function transitionMission(id: string, to: CareLinkStatus, note?: string): Promise<CareLinkMission> {
  const mission = await getCareLinkMission(id)
  return {
    ...mission,
    status: to,
    lifecycle: [
      ...mission.lifecycle,
      { id: `event-${Date.now()}`, status: to, label: `Transition vers ${to}`, timestamp: new Date().toISOString(), actor: 'CareLink', note },
    ],
  }
}

export async function getCareLinkOpsDashboard() {
  const missions = await getCareLinkMissions()
  const agents = await getCareLinkAgents()
  return {
    kpis: opsKpis,
    missions,
    agents,
    incidents: missions.filter((mission) => mission.riskLevel === 'high' || mission.riskLevel === 'critical'),
    reportsPending: missions.filter((mission) => ['completion_requested', 'final_report_submitted'].includes(mission.status)),
    conflicts: detectScheduleConflicts(missions),
  }
}

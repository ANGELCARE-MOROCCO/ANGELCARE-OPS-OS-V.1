import { getServiceBlueprints, getServiceMissions } from "./engine"
import type { ServiceBlueprint, ServiceMission, ServiceWorkflowStep } from "./types"

type NormalizedWorkflowStep = {
  id: string
  label: string
  status: string
  required: boolean
  slaMinutes: number
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value : fallback
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function normalizeWorkflowStep(step: ServiceWorkflowStep, index: number): NormalizedWorkflowStep {
  if (typeof step === "string") {
    return {
      id: `step-${index + 1}`,
      label: step,
      status: "configured",
      required: true,
      slaMinutes: 60,
    }
  }

  return {
    id: text(step?.id ?? step?.key, `step-${index + 1}`),
    label: text(step?.label ?? step?.name ?? step?.key ?? step?.id, `Step ${index + 1}`),
    status: text(step?.status, "configured"),
    required: Boolean((step as { required?: boolean })?.required ?? true),
    slaMinutes: numberOr((step as { slaMinutes?: number })?.slaMinutes, 60),
  }
}

function normalizeBlueprintWorkflow(bp: ServiceBlueprint): NormalizedWorkflowStep[] {
  const workflowSource =
    Array.isArray(bp.workflows) && bp.workflows.length
      ? bp.workflows
      : (bp.defaultWorkflow ?? [])

  return workflowSource.map(normalizeWorkflowStep)
}

export function getServiceWorkflowBlueprints() {
  return getServiceBlueprints().map((bp) => {
    const workflows = normalizeBlueprintWorkflow(bp)
    const criticalPath = workflows.filter((step) => step.required).length
    const totalSla = workflows.reduce((sum, step) => sum + step.slaMinutes, 0)

    return {
      blueprintId: bp.id,
      blueprintCode: bp.serviceCode ?? bp.code ?? bp.id,
      name: bp.name,
      workflows,
      criticalPath,
      totalSla,
      status: workflows.length ? "configured" : "missing",
      recommendation:
        bp.complianceLevel === "critical"
          ? "Escalation immédiate + conformité"
          : "Surveillance Ops",
    }
  })
}

export function getOperationsSnapshot() {
  const missions = getServiceMissions()
  const blueprints = getServiceBlueprints()
  const workflows = getServiceWorkflowBlueprints()

  return {
    active: missions.filter((m) => ["assigned", "live", "incident"].includes(m.status ?? "")).length,
    configuredBlueprints: workflows.filter((w) => w.status === "configured").length,
    totalBlueprints: blueprints.length,
    escalated: missions.filter((m) => (m.riskScore ?? 0) >= 45 || m.status === "incident").length,
    workflows,
    missions,
  }
}

export function getExecutionCommandCenter() {
  const snapshot = getOperationsSnapshot()

  return {
    ...snapshot,
    priorities: [
      "Validate workflow coverage for critical services",
      "Monitor live missions and SLA pressure",
      "Escalate incidents linked to vulnerable care segments",
    ],
    readiness:
      snapshot.configuredBlueprints >= snapshot.totalBlueprints
        ? "ready"
        : "needs-workflow-hardening",
  }
}

export function getMissionExecutionTimeline(mission: ServiceMission) {
  const blueprint = getServiceBlueprints().find((bp) => {
    const code = bp.serviceCode ?? bp.code ?? bp.id
    return code === mission.serviceCode || bp.id === mission.blueprintId
  })

  const workflow = blueprint ? normalizeBlueprintWorkflow(blueprint) : []

  return workflow.map((step, index) => ({
    ...step,
    order: index + 1,
    missionId: mission.id,
    missionStatus: mission.status ?? "assigned",
  }))
}


export const serviceMissions = getServiceMissions()


export function getOperationalSnapshot() {
  return getOperationsSnapshot()
}


export function getEscalations() {
  return getServiceMissions()
    .filter((mission) => (mission.riskScore ?? 0) >= 45 || mission.status === "incident")
    .map((mission) => ({
      id: `escalation-${mission.id}`,
      missionId: mission.id,
      serviceCode: mission.serviceCode,
      city: mission.city,
      clientName: mission.clientName,
      riskScore: mission.riskScore ?? 0,
      status: mission.status ?? "assigned",
      priority: (mission.riskScore ?? 0) >= 70 ? "critical" : "high",
      action: "Operations manager review required",
    }))
}

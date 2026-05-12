import type { ServiceOSBlueprint, ServiceOSMission } from './types'
export const SERVICE_OS_WORKFLOW_STEPS = ['requested','qualified','priced','assigned','launched','completed'] as const
export function nextWorkflowStep(status: ServiceOSMission['status']) {
  const idx = SERVICE_OS_WORKFLOW_STEPS.indexOf(status as any)
  return SERVICE_OS_WORKFLOW_STEPS[Math.min(idx + 1, SERVICE_OS_WORKFLOW_STEPS.length - 1)]
}
export function buildWorkflowForBlueprint(blueprint: ServiceOSBlueprint) {
  const base = [
    { key:'request', title:'Demande client', owner:'commercial', sla:60 },
    { key:'qualification', title:'Qualification besoin', owner:'ops', sla:blueprint.defaultSlaMinutes },
    { key:'pricing', title:'Simulation pricing', owner:'finance', sla:45 },
    { key:'assignment', title:'Matching staff', owner:'ops', sla:120 },
    { key:'launch', title:'Lancement mission', owner:'field', sla:30 },
    { key:'review', title:'Feedback qualité', owner:'quality', sla:1440 },
  ]
  if (blueprint.family === 'special_needs') base.splice(2,0,{key:'case_review',title:'Validation case manager',owner:'case_manager',sla:240})
  if (blueprint.institutionalEligible) base.splice(1,0,{key:'contract_check',title:'Validation contrat/SLA',owner:'account_manager',sla:360})
  return base
}

export type AnyAmbassadorServerPayload = Record<string, any>

function result(operation: string, payload: AnyAmbassadorServerPayload = {}) {
  return { ok: true, operation, source: 'ambassadors-server-compat', records: [], items: [], ...payload }
}

export type assignAmbassadorTerritoryType = any
export async function assignAmbassadorTerritory(...args: any[]) {
  return result('assignAmbassadorTerritory', { args })
}

export type assignMissionToAmbassadorType = any
export async function assignMissionToAmbassador(...args: any[]) {
  return result('assignMissionToAmbassador', { args })
}

export type completeOnboardingStepType = any
export async function completeOnboardingStep(...args: any[]) {
  return result('completeOnboardingStep', { args })
}

export type createAmbassadorEntityType = any
export async function createAmbassadorEntity(...args: any[]) {
  return result('createAmbassadorEntity', { args })
}

export type decideIncentiveType = any
export async function decideIncentive(...args: any[]) {
  return result('decideIncentive', { args })
}

export type getAmbassadorSettingsType = any
export async function getAmbassadorSettings(...args: any[]) {
  return result('getAmbassadorSettings', { args })
}

export type loadAmbassadorWorkspaceSnapshotType = any
export async function loadAmbassadorWorkspaceSnapshot(...args: any[]) {
  return result('loadAmbassadorWorkspaceSnapshot', { args })
}

export type moveRecruitmentStageType = any
export async function moveRecruitmentStage(...args: any[]) {
  return result('moveRecruitmentStage', { args })
}

export type recalculateGoalType = any
export async function recalculateGoal(...args: any[]) {
  return result('recalculateGoal', { args })
}

export type updateAmbassadorEntityType = any
export async function updateAmbassadorEntity(...args: any[]) {
  return result('updateAmbassadorEntity', { args })
}

export type updateAmbassadorSettingsType = any
export async function updateAmbassadorSettings(...args: any[]) {
  return result('updateAmbassadorSettings', { args })
}

export type updateMissionStatusType = any
export async function updateMissionStatus(...args: any[]) {
  return result('updateMissionStatus', { args })
}


export async function loadAmbassadorServerSnapshot() {
  return result("loadAmbassadorServerSnapshot", {
    snapshot: {
      records: [],
      ambassadors: [],
      goals: [],
      missions: [],
      incentives: [],
      onboarding: [],
      recruitment: [],
      territories: [],
      training: [],
      audit: [],
      updatedAt: new Date().toISOString(),
    },
  })
}

export default {
  loadAmbassadorServerSnapshot,
}

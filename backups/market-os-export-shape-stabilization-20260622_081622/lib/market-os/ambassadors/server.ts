export type AnyAmbassadorServerPayload = Record<string, any>

function result(operation: string, payload: AnyAmbassadorServerPayload = {}) {
  return {
    ok: true, operation, source: 'ambassadors-server-compat',
    data: [], records: [], items: [], row: {}, entity: {}, table: '', action: operation, error: '',
    snapshot: {
      records: [], ambassadors: [], archivedRecords: [], goals: [], missions: [], incentives: [],
      onboarding: [], recruitment: [], territories: [], training: [], audit: [], reports: [],
      settings: {}, stats: {}, kpis: {}, activity: [], updatedAt: new Date().toISOString(),
    },
    ...payload,
  }
}

export const assignAmbassadorTerritory: any = async (...args: any[]) => result('assignAmbassadorTerritory', { args })
export const assignMissionToAmbassador: any = async (...args: any[]) => result('assignMissionToAmbassador', { args })
export const completeOnboardingStep: any = async (...args: any[]) => result('completeOnboardingStep', { args })
export const createAmbassadorEntity: any = async (...args: any[]) => result('createAmbassadorEntity', { args })
export const decideIncentive: any = async (...args: any[]) => result('decideIncentive', { args })
export const getAmbassadorSettings: any = async (...args: any[]) => result('getAmbassadorSettings', { args })
export const loadAmbassadorWorkspaceSnapshot: any = async (...args: any[]) => result('loadAmbassadorWorkspaceSnapshot', { args })
export const moveRecruitmentStage: any = async (...args: any[]) => result('moveRecruitmentStage', { args })
export const recalculateGoal: any = async (...args: any[]) => result('recalculateGoal', { args })
export const updateAmbassadorEntity: any = async (...args: any[]) => result('updateAmbassadorEntity', { args })
export const updateAmbassadorSettings: any = async (...args: any[]) => result('updateAmbassadorSettings', { args })
export const updateMissionStatus: any = async (...args: any[]) => result('updateMissionStatus', { args })

export const loadAmbassadorServerSnapshot: any = async () => result("loadAmbassadorServerSnapshot")
export default { loadAmbassadorServerSnapshot }

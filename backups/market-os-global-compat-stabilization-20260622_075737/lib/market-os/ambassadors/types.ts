
export type AnyAmbassadorRecord = Record<string, any>

export type AmbassadorRecord = AnyAmbassadorRecord
export type AmbassadorWorkspaceSnapshot = {
  records?: AmbassadorRecord[]
  ambassadors?: AmbassadorRecord[]
  archivedRecords?: AmbassadorRecord[]
  goals?: AnyAmbassadorRecord[]
  missions?: AnyAmbassadorRecord[]
  incentives?: AnyAmbassadorRecord[]
  onboarding?: AnyAmbassadorRecord[]
  recruitment?: AnyAmbassadorRecord[]
  territories?: AnyAmbassadorRecord[]
  training?: AnyAmbassadorRecord[]
  audit?: AnyAmbassadorRecord[]
  settings?: AnyAmbassadorRecord
  stats?: AnyAmbassadorRecord
  kpis?: AnyAmbassadorRecord
  activity?: AnyAmbassadorRecord[]
  updatedAt?: string
  [key: string]: any
}

export type AmbassadorGoal = AnyAmbassadorRecord
export type AmbassadorMission = AnyAmbassadorRecord
export type AmbassadorIncentive = AnyAmbassadorRecord
export type AmbassadorOnboardingStep = AnyAmbassadorRecord
export type AmbassadorRecruitmentRecord = AnyAmbassadorRecord
export type AmbassadorTerritory = AnyAmbassadorRecord
export type AmbassadorTrainingRecord = AnyAmbassadorRecord
export type AmbassadorAuditEvent = AnyAmbassadorRecord
export type AmbassadorSettings = AnyAmbassadorRecord

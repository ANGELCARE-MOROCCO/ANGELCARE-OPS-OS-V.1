
export type AnyAmbassadorRecord = Record<string, any>
export type AmbassadorWorkspaceMode = string

export type Ambassador = AnyAmbassadorRecord
export type AmbassadorRecord = AnyAmbassadorRecord
export type AmbassadorEntity = AnyAmbassadorRecord
export type AmbassadorEntityRecord = AnyAmbassadorRecord
export type AmbassadorAuditLog = AnyAmbassadorRecord
export type AmbassadorChecklistItem = AnyAmbassadorRecord
export type AmbassadorGoal = AnyAmbassadorRecord
export type AmbassadorKpiGoal = AnyAmbassadorRecord
export type AmbassadorMission = AnyAmbassadorRecord
export type AmbassadorIncentive = AnyAmbassadorRecord
export type AmbassadorModuleSettings = AnyAmbassadorRecord
export type AmbassadorSettings = AnyAmbassadorRecord
export type AmbassadorOnboardingStep = AnyAmbassadorRecord
export type AmbassadorOnboardingRecord = AnyAmbassadorRecord
export type AmbassadorRecruitmentRecord = AnyAmbassadorRecord
export type AmbassadorReport = AnyAmbassadorRecord
export type AmbassadorTerritory = AnyAmbassadorRecord
export type AmbassadorTrainingRecord = AnyAmbassadorRecord
export type AmbassadorTrainingCertification = AnyAmbassadorRecord
export type AmbassadorAuditEvent = AnyAmbassadorRecord

export type AmbassadorWorkspaceSnapshot = {
  records: AmbassadorRecord[]
  ambassadors: Ambassador[]
  archivedRecords: AmbassadorRecord[]
  goals: AmbassadorKpiGoal[]
  missions: AmbassadorMission[]
  incentives: AmbassadorIncentive[]
  onboarding: AmbassadorOnboardingRecord[]
  recruitment: AmbassadorRecruitmentRecord[]
  territories: AmbassadorTerritory[]
  training: AmbassadorTrainingRecord[]
  audit: AmbassadorAuditLog[]
  reports: AmbassadorReport[]
  settings: AmbassadorModuleSettings
  stats: AnyAmbassadorRecord
  kpis: AnyAmbassadorRecord
  activity: AnyAmbassadorRecord[]
  updatedAt: string
  [key: string]: any
}

export const STUDIO_CONTRACT_SATURATION_VERSION=1 as const
export const STUDIO_CONTRACT_COMPATIBILITY_LEVELS=['PATCH_SAFE','MIGRATION_REQUIRED','BREAKING_FORBIDDEN'] as const
export type StudioContractCompatibilityLevel=typeof STUDIO_CONTRACT_COMPATIBILITY_LEVELS[number]
export type StudioContractScope={
  scope:string
  phase:string
  label:string
  schemaVersion:string
  hash:string
  authority:string
  exportScope:string
  stableIds:number
  dependsOn:readonly string[]
}
export type StudioContractCrossLink={from:string;to:string;relation:string;required:boolean}

export type StationMode = "standard" | "focus" | "locked"
export type StationTargetType = "device" | "installation" | "user" | "department" | "workspace" | "fleet"
export type StationCommandState = "created" | "delivered" | "received" | "executing" | "completed" | "failed" | "expired" | "cancelled"
export type StationRow = Record<string, any>
export interface EffectiveStationPolicy extends StationRow {
  id?: string
  name: string
  mode: StationMode
  policy_version: number
  maximum_tabs: number
  browser_policy?: StationRow
  tab_templates?: StationRow[]
}

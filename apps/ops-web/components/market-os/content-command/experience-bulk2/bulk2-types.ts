export type Bulk2Signal = {
  id: string
  code: string
  title: string
  summary: string
  source_type?: string | null
  source_label?: string | null
  source_url?: string | null
  detected_at?: string | null
  status: string
  services?: unknown
  audiences?: unknown
  cities?: unknown
  confidence?: number | null
  urgency?: number | null
  opportunity_score?: number | null
  ai_interpretation?: string | null
  human_conclusion?: string | null
}

export type Bulk2Strategy = {
  id: string
  code: string
  title: string
  status: string
  problem_statement?: string | null
  business_objective?: string | null
  content_objective?: string | null
  desired_perception?: string | null
  signal_ids?: unknown
  services?: unknown
  audiences?: unknown
  cities?: unknown
  assumptions?: unknown
  scenarios?: unknown
  owner_id?: string | null
  updated_at?: string | null
}

export type Bulk2ActionPlan = {
  id: string
  strategy_id: string
  title?: string | null
  objective?: string | null
  status?: string | null
  capacity_hours?: number | null
  required_roles?: unknown
  deliverables?: unknown
}

export type Bulk2Mission = {
  id: string
  code?: string | null
  title?: string | null
  strategy_id?: string | null
  status?: string | null
  owner_id?: string | null
}

export type Bulk2Snapshot = {
  migrationReady?: boolean
  signals: Bulk2Signal[]
  strategies: Bulk2Strategy[]
  actionPlans: Bulk2ActionPlan[]
  missions: Bulk2Mission[]
  rollups?: Record<string, number>
}

export type StrategicContext = {
  caseId?: string
  caseCode?: string
  title?: string
  stage: "observation" | "strategy" | "brief" | "planning" | "brand"
  owner?: string
  deadline?: string
  status?: string
  returnTo?: string
}

export type ReadinessCheck = {
  id: string
  label: string
  passed: boolean
  reason: string
  owner?: string
}

export type Collision = {
  id: string
  severity: "critical" | "warning" | "info"
  title: string
  basis: string
  affectedIds: string[]
  consequence: string
}

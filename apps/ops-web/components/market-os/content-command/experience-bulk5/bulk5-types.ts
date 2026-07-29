export type Bulk5Tone = "neutral" | "info" | "success" | "warning" | "danger" | "violet"
export type Bulk5WorkspaceMode = "evidence" | "review" | "corrections" | "rubrics" | "validation"

export type Bulk5Dossier = {
  id: string
  content_code?: string
  title: string
  status: string
  family?: string
  category?: string
  service_label?: string
  service?: string
  audience?: string
  channel?: string
  language?: string
  city?: string
  owner_name?: string
  reviewer_name?: string
  sponsor_name?: string
  source_state?: string
  progress?: number
  readiness?: number
  due_at?: string
  updated_at?: string
  campaign_label?: string
  brief_version?: string
  mission_id?: string
}

export type Bulk5Evidence = {
  id: string
  dossier_id: string
  title?: string
  filename?: string
  evidence_type?: string
  content_type?: string
  preview_url?: string
  status?: string
  note?: string
  progress_percent?: number
  created_at?: string
  created_by?: string
  owner_name?: string
  metadata?: Record<string, unknown>
}

export type Bulk5Review = {
  id: string
  dossier_id: string
  evidence_id?: string
  review_type?: "ai" | "human" | string
  result: string
  summary?: string
  score?: number
  corrections?: unknown
  reviewer_name?: string
  authority_role?: string
  created_at?: string
}

export type Bulk5Task = {
  id: string
  dossier_id?: string
  mission_id?: string
  title: string
  status: string
  owner_name?: string
  due_at?: string
  blocker_reason?: string
  completion_definition?: string
}

export type Bulk5Snapshot = {
  migrationReady?: boolean
  dossiers: Bulk5Dossier[]
  evidence: Bulk5Evidence[]
  reviews: Bulk5Review[]
  tasks: Bulk5Task[]
  missions: Array<Record<string, unknown>>
  sources: Array<Record<string, unknown>>
  publicationPackages: Array<Record<string, unknown>>
}

export type Finding = {
  id: string
  code: string
  criterion: string
  instruction: string
  severity: "advisory" | "minor" | "material" | "major" | "critical" | "blocking"
  status: "issued" | "under_correction" | "resubmitted" | "resolved" | "unresolved"
}

export type ReviewCriterion = {
  code: string
  title: string
  purpose: string
  severity: "advisory" | "minor" | "material" | "major" | "critical" | "blocking"
  blocking: boolean
  evidence: string
}

export type ReviewRubric = {
  code: string
  name: string
  family: string
  version: string
  authority: string
  status: "active" | "limited" | "superseded"
  appliesTo: string[]
  criteria: ReviewCriterion[]
}

export type ProofCase = {
  id: string
  dossier: Bulk5Dossier
  evidence: Bulk5Evidence[]
  reviews: Bulk5Review[]
  humanReviews: Bulk5Review[]
  aiReviews: Bulk5Review[]
  latestEvidence?: Bulk5Evidence
  latestHumanReview?: Bulk5Review
  latestAiReview?: Bulk5Review
  findings: Finding[]
  reviewRound: number
  proofState: "missing" | "incomplete" | "awaiting" | "sufficient" | "insufficient" | "superseded"
  reviewState: "not_started" | "under_review" | "correction_required" | "accepted" | "blocked"
  validationState: "not_ready" | "ready" | "validated" | "conditional" | "rejected"
}

export type Bulk5Context = {
  dossierId?: string
  dossierTitle?: string
  missionId?: string
  taskId?: string
  assetId?: string
  evidenceId?: string
  reviewId?: string
  version?: string
  stage: Bulk5WorkspaceMode
  sourceHref: string
  returnTo: string
  updatedAt: string
}

export type ReadinessGate = {
  id: string
  label: string
  detail: string
  passed: boolean
  blocking: boolean
}

export type JsonRecord = Record<string, unknown>

export type ContentFamily = 'digital' | 'print_offline' | 'corporate_document'
export type SignalStatus = 'captured' | 'enriching' | 'verified' | 'qualified' | 'converted' | 'deferred' | 'rejected' | 'expired'
export type StrategyStatus = 'draft' | 'review' | 'approved' | 'active' | 'completed' | 'suspended' | 'archived'
export type MissionStatus = 'proposed' | 'qualifying' | 'scope_approved' | 'ready' | 'assigned' | 'accepted' | 'in_progress' | 'checkpoint' | 'submitted' | 'ai_review' | 'human_review' | 'revision' | 'validated' | 'closed' | 'blocked' | 'paused' | 'cancelled' | 'archived'
export type DossierStatus = 'opportunity' | 'ideation' | 'brief' | 'scope_locked' | 'planned' | 'assigned' | 'in_creation' | 'checkpoint_review' | 'draft_submitted' | 'ai_review' | 'human_review' | 'revision' | 'validated' | 'source_required' | 'source_secured' | 'classified' | 'ready_distribution' | 'scheduled' | 'published' | 'performance_review' | 'closed' | 'archived'

export type MarketSignal = {
  id: string
  code: string
  title: string
  summary: string
  source_type: string
  source_label: string
  source_url: string | null
  status: SignalStatus
  confidence: number
  urgency: number
  opportunity_score: number
  freshness: string
  services: string[]
  audiences: string[]
  cities: string[]
  evidence: JsonRecord[]
  ai_interpretation: string | null
  human_conclusion: string | null
  detected_at: string
  next_scan_at: string | null
  created_at: string
  updated_at: string
}

export type ContentStrategy = {
  id: string
  code: string
  title: string
  problem_statement: string
  desired_perception: string
  business_objective: string
  content_objective: string
  status: StrategyStatus
  services: string[]
  audiences: string[]
  cities: string[]
  journey_stages: string[]
  pillars: JsonRecord[]
  channel_plan: JsonRecord[]
  risks: JsonRecord[]
  measurement_doctrine: JsonRecord
  signal_ids: string[]
  owner_id: string | null
  owner_name: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

export type ContentActionPlan = {
  id: string
  strategy_id: string
  code: string
  title: string
  objective: string
  status: string
  start_date: string | null
  end_date: string | null
  deliverables: JsonRecord[]
  required_roles: string[]
  capacity_estimate_hours: number
  created_at: string
  updated_at: string
}

export type ContentMission = {
  id: string
  code: string
  strategy_id: string | null
  action_plan_id: string | null
  dossier_id: string | null
  title: string
  objective: string
  scope: string
  out_of_scope: string
  success_definition: string
  status: MissionStatus
  priority: string
  origin_type: string
  origin_ref: string | null
  assigned_to: string | null
  assigned_to_name: string | null
  reviewer_id: string | null
  reviewer_name: string | null
  ai_director_id: string | null
  due_at: string | null
  progress: number
  risk_level: string
  blockers: JsonRecord[]
  created_at: string
  updated_at: string
}

export type ContentMissionTask = {
  id: string
  mission_id: string
  dossier_id: string | null
  code: string
  title: string
  description: string
  status: string
  priority: string
  sequence_number: number
  depends_on: string[]
  assigned_to: string | null
  assigned_to_name: string | null
  due_at: string | null
  evidence_required: boolean
  completion_definition: string
  progress: number
  created_at: string
  updated_at: string
}

export type ContentDossier = {
  id: string
  content_code: string
  title: string
  family: ContentFamily
  category: string
  subcategory: string
  service_key: string
  service_label: string
  campaign_id: string | null
  campaign_label: string | null
  strategy_id: string | null
  mission_id: string | null
  audience: string
  city: string
  language: string
  channel: string
  journey_stage: string
  objective: string
  message_pillar: string
  offer: string
  cta: string
  status: DossierStatus
  priority: string
  owner_id: string | null
  owner_name: string | null
  reviewer_id: string | null
  reviewer_name: string | null
  ai_director_id: string | null
  due_at: string | null
  progress: number
  readiness: number
  source_state: string
  publication_state: string
  rights_state: string
  confidentiality: string
  brief: JsonRecord
  scope_constitution: JsonRecord
  classification: JsonRecord
  created_at: string
  updated_at: string
}

export type ContentCheckpoint = {
  id: string
  dossier_id: string
  mission_id: string | null
  task_id: string | null
  checkpoint_type: string
  title: string
  instructions: string
  required_evidence: string[]
  status: string
  sequence_number: number
  due_at: string | null
  completed_at: string | null
}

export type ContentEvidence = {
  id: string
  dossier_id: string
  mission_id: string | null
  task_id: string | null
  checkpoint_id: string | null
  evidence_type: string
  title: string
  note: string
  bridge_file_id: string | null
  storage_key: string | null
  content_type: string | null
  filename: string | null
  size_bytes: number
  preview_url: string | null
  progress_percent: number
  submitted_by: string | null
  submitted_by_name: string | null
  status: string
  created_at: string
}

export type ContentReview = {
  id: string
  dossier_id: string
  evidence_id: string | null
  review_type: 'ai' | 'human'
  result: string
  score: number
  summary: string
  findings: JsonRecord[]
  corrections: JsonRecord[]
  rubric: JsonRecord
  reviewer_id: string | null
  reviewer_name: string | null
  created_at: string
}

export type ContentSourceObject = {
  id: string
  dossier_id: string
  content_code: string
  bridge_file_id: string
  storage_key: string
  original_filename: string
  safe_filename: string
  content_type: string
  size_bytes: number
  sha256_hash: string
  source_version: number
  is_current: boolean
  integrity_state: string
  deletion_verified_at: string | null
  created_at: string
}

export type GeneratedSample = {
  id: string
  dossier_id: string
  mission_id: string | null
  credit_number: number
  prompt: string
  model_code: string
  bridge_file_id: string | null
  preview_data_url: string | null
  status: string
  generated_by: string | null
  created_at: string
}

export type AiDirectorProfile = {
  id: string
  code: string
  name: string
  director_type: string
  mandate: string
  status: string
  provider_module_key: string
  preferred_model: string
  grounding_enabled: boolean
  image_generation_enabled: boolean
  authority_mode: string
  services: string[]
  content_families: string[]
  audiences: string[]
  cities: string[]
  languages: string[]
  allowed_sources: string[]
  excluded_sources: string[]
  schedule_policy: JsonRecord
  rate_policy: JsonRecord
  skill_codes: string[]
  command_codes: string[]
  prompt_version_id: string | null
  human_supervisor_id: string | null
  human_supervisor_name: string | null
  last_run_at?: string | null
  next_run_at?: string | null
  created_at: string
  updated_at: string
}

export type PublicationPackage = {
  id: string
  dossier_id: string
  channel: string
  scheduled_at: string | null
  status: string
  package_readiness: number
  required_renditions: JsonRecord[]
  evidence: JsonRecord[]
  published_at: string | null
  external_reference: string | null
  created_at: string
  updated_at: string
}

export type ContentHeadquartersSnapshot = {
  generatedAt: string
  migrationReady: boolean
  signals: MarketSignal[]
  strategies: ContentStrategy[]
  actionPlans: ContentActionPlan[]
  missions: ContentMission[]
  tasks: ContentMissionTask[]
  dossiers: ContentDossier[]
  checkpoints: ContentCheckpoint[]
  evidence: ContentEvidence[]
  reviews: ContentReview[]
  sources: ContentSourceObject[]
  generatedSamples: GeneratedSample[]
  aiDirectors: AiDirectorProfile[]
  publicationPackages: PublicationPackage[]
  bridge: {
    enabled: boolean
    available: boolean
    message: string
    usage: JsonRecord | null
  }
  provider: {
    available: boolean
    message: string
  }
  rollups: {
    activeSignals: number
    anticipationOpportunities: number
    activeStrategies: number
    activeMissions: number
    tasksDueToday: number
    overdueTasks: number
    dossiersInProduction: number
    dossiersAwaitingEvidence: number
    dossiersAwaitingValidation: number
    dossiersAwaitingSource: number
    sourceIntegrityRisks: number
    readyForDistribution: number
    aiReviewsPending: number
    humanDecisionsPending: number
  }
}

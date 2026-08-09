export type SocialUniverse = "command" | "studio" | "publish" | "engage" | "automate" | "control"
export type SocialChannel = "facebook" | "instagram"
export type SocialFormat = "post" | "story" | "reel" | "carousel"
export type SocialPublicationStatus =
  | "draft"
  | "ready"
  | "scheduled"
  | "queued"
  | "preparing"
  | "publishing"
  | "confirming"
  | "published"
  | "paused"
  | "failed"
  | "cancelled"
  | "archived"

export type SocialJobStatus =
  | "queued"
  | "preparing"
  | "publishing"
  | "confirming"
  | "published"
  | "retrying"
  | "failed"
  | "cancelled"

export type ConnectionHealth = "healthy" | "warning" | "unhealthy" | "disconnected" | "unknown"

export type SocialConnection = {
  id: string
  status: string
  facebook_page_id: string | null
  facebook_page_name: string | null
  instagram_business_id: string | null
  instagram_username: string | null
  granted_scopes: string[]
  token_expires_at: string | null
  last_verified_at: string | null
  connection_health: ConnectionHealth
  meta_json: Record<string, unknown>
  connected_by: string | null
  connected_at: string
  disconnected_at: string | null
}

export type SocialMediaAsset = {
  id: string
  status: string
  storage_provider: "windows_node" | string
  storage_key: string | null
  original_filename: string
  safe_filename: string
  mime_type: string
  size_bytes: number
  width: number | null
  height: number | null
  duration_seconds: number | null
  sha256_hash: string | null
  thumbnail_key: string | null
  campaign_id: string | null
  tags: string[]
  metadata: Record<string, unknown>
  usage_count: number
  created_by: string | null
  created_at: string
  archived_at: string | null
  preview_url?: string | null
}

export type SocialCampaign = {
  id: string
  title: string
  objective: string | null
  status: string
  start_at: string | null
  end_at: string | null
  owner_user_id: string | null
  channels: SocialChannel[]
  internal_tags: string[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export type SocialPublication = {
  id: string
  title: string
  format: SocialFormat
  status: SocialPublicationStatus
  channels: SocialChannel[]
  caption: string
  hashtags: string[]
  campaign_id: string | null
  owner_user_id: string | null
  scheduled_at: string | null
  published_at: string | null
  platform_variants: Record<string, unknown>
  internal_tags: string[]
  metadata: Record<string, unknown>
  created_by: string | null
  created_at: string
  updated_at: string
  media?: SocialMediaAsset[]
  jobs?: SocialExecutionJob[]
}

export type SocialExecutionJob = {
  id: string
  publication_id: string
  channel: SocialChannel
  status: SocialJobStatus
  due_at: string
  locked_at: string | null
  attempt_count: number
  max_attempts: number
  last_error: string | null
  provider_reference: string | null
  provider_state: Record<string, unknown>
  next_attempt_at: string | null
  created_at: string
  updated_at: string
}

export type SocialActionOperation = {
  id: string
  operation_key: string
  operation_type: string
  label: string
  status: "preparing" | "processing" | "waiting" | "completed" | "failed"
  progress: number
  current_step: string | null
  total_items: number
  completed_items: number
  failed_items: number
  error_message: string | null
  metadata: Record<string, unknown>
  created_by: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

export type BulkSlotDraft = {
  slotNo: number
  format: SocialFormat
  channels: SocialChannel[]
  scheduledAt: string
  caption: string
  hashtags: string[]
  assetIds: string[]
  title: string
  platformVariants?: Record<string, { caption?: string; hashtags?: string[] }>
  internalTags?: string[]
}

export type SocialBootstrap = {
  connection: SocialConnection | null
  capabilities: {
    facebookPublish: boolean
    facebookStory: boolean
    instagramPublish: boolean
    instagramMessages: boolean
  }
  assets: SocialMediaAsset[]
  campaigns: SocialCampaign[]
  publications: SocialPublication[]
  jobs: SocialExecutionJob[]
  operations: SocialActionOperation[]
  storage: {
    configured: boolean
    healthy: boolean
    publicUrl: string | null
    rootLabel?: string | null
    freeBytes?: number | null
    usedBytes?: number | null
    error?: string | null
  }
  stats: {
    todayScheduled: number
    todayPublished: number
    processing: number
    failed: number
    stories: number
    reels: number
    posts: number
    carousels: number
  }
  mz2?: SocialMZ2Bootstrap
}

// MZ2 · Engagement, automation, intelligence and control
export type SocialConversationStatus = "new" | "open" | "waiting" | "priority" | "assigned" | "responded" | "resolved" | "archived"
export type SocialMessageDirection = "inbound" | "outbound"
export type SocialMessageStatus = "received" | "queued" | "sending" | "sent" | "failed" | "read"
export type SocialEngagementKind = "dm" | "comment" | "mention" | "reaction" | "postback"
export type SocialCapabilityState = "available" | "unavailable" | "requires_reconnect" | "provider_limited" | "permission_missing" | "degraded"
export type SocialAutomationStatus = "active" | "paused" | "disabled"
export type SocialAutomationRunStatus = "running" | "completed" | "failed" | "skipped"
export type SocialMetricTruthState = "live" | "syncing" | "stale" | "unavailable" | "insufficient_data" | "provider_limited" | "failed"

export type SocialConversation = {
  id: string
  channel: SocialChannel
  provider_conversation_id: string | null
  participant_id: string
  participant_username: string | null
  participant_name: string | null
  participant_profile_picture_url: string | null
  status: SocialConversationStatus
  priority: string
  assigned_user_id: string | null
  campaign_id: string | null
  source_publication_id: string | null
  triage_category: string | null
  triage_source: string | null
  triage_confidence: number | null
  unread_count: number
  first_received_at: string
  last_message_at: string
  first_response_at: string | null
  resolved_at: string | null
  due_at: string | null
  last_message_preview: string | null
  tags: string[]
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  messages?: SocialMessage[]
}

export type SocialMessage = {
  id: string
  conversation_id: string
  provider_message_id: string | null
  direction: SocialMessageDirection
  sender_id: string | null
  recipient_id: string | null
  sender_username: string | null
  message_type: string
  text: string
  attachments: Array<Record<string, unknown>>
  status: SocialMessageStatus
  sent_by_user_id: string | null
  provider_timestamp: string | null
  provider_payload: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type SocialComment = {
  id: string
  provider_comment_id: string
  channel: SocialChannel
  media_id: string | null
  publication_id: string | null
  campaign_id: string | null
  commenter_id: string | null
  commenter_username: string | null
  text: string
  status: "new" | "unanswered" | "priority" | "sensitive" | "answered" | "resolved"
  assigned_user_id: string | null
  provider_created_at: string | null
  replied_at: string | null
  resolved_at: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type SocialMention = {
  id: string
  provider_mention_id: string
  channel: SocialChannel
  actor_id: string | null
  actor_username: string | null
  media_id: string | null
  text: string | null
  status: "new" | "reviewed" | "resolved"
  metadata: Record<string, unknown>
  provider_created_at: string | null
  created_at: string
  updated_at: string
}

export type SocialAutomation = {
  id: string
  automation_code: string
  name: string
  description: string
  family: string
  status: SocialAutomationStatus
  trigger_type: string
  trigger_config: Record<string, unknown>
  condition_config: Record<string, unknown>
  action_config: Record<string, unknown>
  guardrail_config: Record<string, unknown>
  execution_mode: "automatic" | "proposal" | "manual"
  run_count: number
  success_count: number
  failure_count: number
  last_run_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type SocialAutomationRun = {
  id: string
  automation_id: string
  automation_code: string
  trigger_type: string
  trigger_entity_type: string | null
  trigger_entity_id: string | null
  status: SocialAutomationRunStatus
  decision: string | null
  input_snapshot: Record<string, unknown>
  condition_results: Record<string, unknown>
  action_results: Array<Record<string, unknown>>
  error_message: string | null
  started_at: string
  completed_at: string | null
  created_at: string
}

export type SocialChannelCapability = {
  id: string
  connection_id: string
  channel: SocialChannel
  capability: string
  supported: boolean
  state?: SocialCapabilityState
  source: string
  reason: string | null
  checked_at: string
}

export type SocialMetricSnapshot = {
  id: string
  provider: string
  channel: SocialChannel
  entity_type: string
  entity_id: string
  metric_code: string
  canonical_metric: string
  value_numeric: number | null
  value_text: string | null
  period: string | null
  observed_at: string
  truth_state: SocialMetricTruthState
  provider_payload: Record<string, unknown>
  created_at: string
}

export type SocialWebhookHealth = {
  configured: boolean
  verified: boolean
  lastEventAt: string | null
  events24h: number
  rejected24h: number
  duplicates24h: number
  failed24h: number
  lastLatencyMs: number | null
  endpoint: string | null
}

export type SocialPerformanceSummary = {
  truthState: SocialMetricTruthState
  observedAt: string | null
  publications: number
  publishingSuccessRate: number | null
  failureRate: number | null
  recoveredJobs: number
  inboundMessages: number
  unreadConversations: number
  openConversations: number
  medianFirstResponseMinutes: number | null
  comments: number
  unresolvedComments: number
  metrics: SocialMetricSnapshot[]
  formatPerformance: Array<{ format: SocialFormat; publications: number; metric: number | null; metricCode: string | null }>
  channelPerformance: Array<{ channel: SocialChannel; publications: number; metric: number | null; metricCode: string | null }>
  hotSlots: Array<{ weekday: number; hour: number; sampleSize: number; score: number | null; state: SocialMetricTruthState }>
}

export type SocialMZ2Bootstrap = {
  conversations: SocialConversation[]
  comments: SocialComment[]
  mentions: SocialMention[]
  automations: SocialAutomation[]
  automationRuns: SocialAutomationRun[]
  capabilities: SocialChannelCapability[]
  webhook: SocialWebhookHealth
  performance: SocialPerformanceSummary
  ai: {
    configured: boolean
    operations24h: number
    failed24h: number
    lastOperationAt: string | null
  }
}

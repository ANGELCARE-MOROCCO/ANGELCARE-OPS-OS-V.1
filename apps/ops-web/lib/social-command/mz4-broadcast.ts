import type { SocialBootstrap, SocialCampaign, SocialChannelCapability, SocialConversation, SocialPublication } from "./types"

export type BroadcastSeverity = "critical" | "warning" | "attention" | "healthy" | "info"
export type BroadcastFamily =
  | "publishing"
  | "engagement"
  | "campaign"
  | "brand"
  | "media"
  | "meta"
  | "automation"
  | "commercial"
  | "governance"
  | "system"
  | "intelligence"
  | "workflow"

export type BroadcastRule = {
  code: string
  family: BroadcastFamily
  ordinal: number
  title: string
  condition: string
  source: string
  resolution: string
  defaultSeverity: BroadcastSeverity
  dedupeMinutes: number
  operatorAction: string
}

export type BroadcastSignal = {
  id: string
  ruleCode: string
  family: BroadcastFamily
  severity: BroadcastSeverity
  title: string
  message: string
  detail: string
  resolution: string
  source: string
  observedAt: string
  entityLabel?: string
  entityId?: string
  actionLabel?: string
}

export type BroadcastSnapshot = {
  observedAt: string
  signals: BroadcastSignal[]
  rules: BroadcastRule[]
  counts: Record<BroadcastSeverity, number>
  activeFamilies: Array<{ family: BroadcastFamily; count: number }>
}

const familyDefinitions: Record<BroadcastFamily, Array<[string, string, string, string, BroadcastSeverity]>> = {
  publishing: [
    ["Scheduled departure approaching", "A scheduled publication enters the next operating window.", "publications.scheduled_at", "Open the publishing runway and verify media, channel and timing readiness.", "attention"],
    ["Publication overdue", "A scheduled publication is past due without a published state.", "publications.status", "Open the affected publication, inspect its jobs and either recover, reschedule or cancel intentionally.", "critical"],
    ["Publishing failure", "One or more execution jobs are failed.", "execution_jobs.status", "Open Failures, inspect the provider reason and use recovery only after the cause is understood.", "critical"],
    ["Retry pressure", "Execution jobs are retrying or have more than one attempt.", "execution_jobs.attempt_count", "Check provider health and avoid stacking duplicate manual publishes while recovery is active.", "warning"],
    ["Queue pressure", "The queued/publishing job volume is elevated.", "execution_jobs.status", "Inspect Temporal Command and spread non-urgent departures if the queue is congested.", "attention"],
    ["Media readiness gap", "A publication intended for execution has no ready media.", "publication.media", "Attach a ready Media Vault asset before the departure window.", "warning"],
    ["Draft accumulation", "Draft inventory is growing without an execution window.", "publications.status", "Review drafts, promote viable work into the runway and archive abandoned drafts.", "info"],
    ["Channel imbalance", "A publication wave is concentrated on one channel.", "publications.channels", "Confirm the imbalance is intentional or prepare native variants for the missing channel.", "info"],
    ["Daily target achieved", "Today has at least one confirmed published item and no failed publication jobs.", "stats.todayPublished", "Maintain the runway; no intervention is required.", "healthy"],
    ["Publishing runway clear", "No failed jobs and no overdue scheduled publications are detected.", "publications + execution_jobs", "Continue normal operation and watch the next departure window.", "healthy"],
  ],
  engagement: [
    ["Unread conversation", "At least one conversation contains unread inbound messages.", "conversations.unread_count", "Open Live Inbox and claim the oldest unread relationship.", "attention"],
    ["Unanswered comment", "A comment remains new, unanswered, priority or sensitive.", "comments.status", "Open Comments, review the public context and answer or resolve deliberately.", "attention"],
    ["Sensitive interaction", "A conversation or comment is marked sensitive or high priority.", "engagement.priority/status", "Escalate to the responsible operator and respond using an approved tone.", "critical"],
    ["SLA risk", "An open conversation due time is approaching or past.", "conversations.due_at", "Assign an owner and respond before the relationship breaches its operating window.", "critical"],
    ["Waiting relationship", "A relationship remains in waiting state.", "conversations.status", "Review whether AngelCare or the external contact owns the next action.", "warning"],
    ["Unassigned relationship", "An open relationship has no assigned operator.", "conversations.assigned_user_id", "Assign the relationship to prevent invisible ownership gaps.", "warning"],
    ["Mention signal", "A new or unreviewed Instagram mention exists.", "mentions.status", "Review the brand mention and decide whether acknowledgement, reply or escalation is appropriate.", "attention"],
    ["Inbox clear", "No unread conversations or unanswered comments are detected.", "engagement", "No intervention is required; maintain response discipline.", "healthy"],
    ["Response recovery", "Previously waiting/priority relationships have moved to responded or resolved.", "conversations.status", "Confirm closure quality and preserve context for future contact.", "healthy"],
    ["Engagement load concentration", "Open relationship volume is high relative to the available queue.", "conversations", "Use bulk triage carefully, prioritise high-impact relationships and assign ownership.", "warning"],
  ],
  campaign: [
    ["Campaign active", "At least one campaign is currently active.", "campaigns.status", "Keep campaign publications, assets and engagement context linked to the campaign.", "healthy"],
    ["Campaign without publications", "An active campaign has no linked publication.", "campaigns + publications", "Create the first content wave or pause the campaign if execution is not ready.", "warning"],
    ["Campaign execution gap", "A campaign has drafts but no scheduled or published work.", "campaign publications", "Move approved creative into an execution window.", "attention"],
    ["Campaign failure", "A campaign contains a failed publication job.", "campaign publications.jobs", "Open the affected campaign stream and resolve the failed departure before adding volume.", "critical"],
    ["Campaign completion", "All linked publications for a campaign are published.", "campaign publications", "Close the wave, review performance and capture reusable learning.", "healthy"],
    ["Campaign end approaching", "A campaign end date is within seven days.", "campaigns.end_at", "Review remaining publication commitments and decide whether to accelerate, extend or close.", "attention"],
    ["Campaign date drift", "Campaign-linked publication timing sits outside the campaign window.", "campaign dates + publication schedule", "Reschedule the publication or correct the campaign window deliberately.", "warning"],
    ["Campaign channel concentration", "A campaign uses only one channel despite multiple connected channels.", "campaigns.channels", "Confirm single-channel intent or prepare native cross-channel variants.", "info"],
    ["Campaign objective missing", "A campaign has no explicit objective.", "campaigns.objective", "Add an operational objective so creative and performance review retain context.", "warning"],
    ["Campaign portfolio quiet", "No campaign is active.", "campaigns.status", "No intervention is required unless an active market initiative is expected.", "info"],
  ],
  brand: [
    ["Official identity locked", "The Social Command shell uses the registered official AngelCare logo asset.", "brand asset registry", "Keep the immutable official logo asset; never regenerate or approximate it.", "healthy"],
    ["Brand context missing", "A publication has no internal campaign or service context.", "publication campaign/tags", "Add campaign or internal tags before scaling the content into a series.", "info"],
    ["Caption empty", "A non-story draft has no caption.", "publications.caption", "Complete the copy before approval or scheduling.", "attention"],
    ["Hashtag context empty", "A publication has no hashtag context.", "publications.hashtags", "Add deliberate hashtags only when useful to the campaign; do not fabricate volume.", "info"],
    ["Asset lineage incomplete", "A publication has no media relationship.", "publication.media", "Attach a registered Media Vault asset to preserve lineage.", "warning"],
    ["Brand approval attention", "A publication remains draft close to an intended operating window.", "publication status + dates", "Complete brand review before moving the item into the runway.", "warning"],
    ["Channel-native copy", "Platform variants are present on at least one publication.", "publication.platform_variants", "Maintain native channel expression instead of copy-pasting blindly.", "healthy"],
    ["Internal tags healthy", "Recent publications contain structured internal tags.", "publication.internal_tags", "Continue using internal context for retrieval and governance.", "healthy"],
    ["Service-line ambiguity", "No recognised service-line tag is visible on current draft work.", "publication.internal_tags", "Add the relevant AngelCare service context where the content is service-specific.", "info"],
    ["Brand governance quiet", "No brand-risk signal is currently inferred from available structured data.", "structured publication data", "No intervention is required; visual and copy review remain human responsibilities.", "healthy"],
  ],
  media: [
    ["Vault online", "The Windows Media Vault health check is positive.", "storage.healthy", "No intervention is required.", "healthy"],
    ["Vault unavailable", "The Windows Media Vault is not healthy.", "storage.healthy", "Check the Windows gateway before scheduling media-dependent publication work.", "critical"],
    ["Disk pressure", "Reported free storage is below ten GiB.", "storage.freeBytes", "Free Windows storage, archive old material or expand capacity before large ingestion.", "critical"],
    ["Media ingest failure", "One or more media assets are failed.", "assets.status", "Open Media Vault, inspect failed assets and retry ingestion after resolving the source issue.", "warning"],
    ["Unused media stock", "Ready media exists with zero recorded usage.", "assets.usage_count", "Review unused assets for campaign reuse or intentional archival.", "info"],
    ["Media library empty", "No media asset is registered.", "assets", "Import the first approved media set through the Windows Vault.", "attention"],
    ["Large asset watch", "A registered asset exceeds 500 MiB.", "assets.size_bytes", "Confirm the file is necessary and suitable for the intended provider format.", "warning"],
    ["Duplicate evidence available", "Media hashes are present for registered assets.", "assets.sha256_hash", "Use hash evidence during future deduplication; do not remove lineage metadata.", "healthy"],
    ["Media used", "At least one ready media asset is linked to execution history.", "assets.usage_count", "Maintain lineage between source assets and publications.", "healthy"],
    ["Media readiness healthy", "No failed media assets are detected.", "assets.status", "Continue normal ingestion discipline.", "healthy"],
  ],
  meta: [
    ["Meta connection healthy", "The primary Meta connection health is healthy.", "connection.connection_health", "No intervention is required.", "healthy"],
    ["Meta disconnected", "No active Meta connection is available.", "connection", "Open Control and connect the authorised AngelCare Meta estate.", "critical"],
    ["Meta connection warning", "The Meta connection reports a non-healthy state.", "connection.connection_health", "Open Control, verify credentials and inspect provider health before publishing.", "warning"],
    ["Token expiry approaching", "The connection token expires within fourteen days.", "connection.token_expires_at", "Plan a controlled reauthorization before expiry; do not wait for a publishing failure.", "warning"],
    ["Webhook quiet", "The webhook is configured but has no recent accepted event.", "mz2.webhook.lastEventAt", "Confirm whether traffic is genuinely quiet before treating this as a fault.", "info"],
    ["Webhook rejection", "Rejected webhook deliveries exist in the last 24 hours.", "mz2.webhook.rejected24h", "Inspect signature and subscription diagnostics; distinguish historical tests from current rejection state.", "warning"],
    ["Webhook failure", "Processed webhook failures exist in the last 24 hours.", "mz2.webhook.failed24h", "Open webhook diagnostics and replay only after correcting the processing cause.", "critical"],
    ["Webhook live", "The webhook is verified and has accepted event traffic.", "mz2.webhook", "No intervention is required; keep subscription truth observable.", "healthy"],
    ["Provider capability gap", "At least one provider capability is unavailable or permission-limited.", "mz2.capabilities", "Open Capability Intelligence and distinguish provider support, permission and AngelCare implementation state.", "attention"],
    ["Meta estate verified", "The connection has a recent verification timestamp.", "connection.last_verified_at", "Keep verification evidence current when credentials or assets change.", "healthy"],
  ],
  automation: [
    ["Automation active", "At least one automation is active.", "automations.status", "Monitor outcomes and guardrails; automatic operation never removes audit responsibility.", "healthy"],
    ["Automation failed", "A recent automation run failed.", "automationRuns.status", "Open Automation exceptions, inspect the failed action and correct the cause before rerunning.", "critical"],
    ["Automation paused", "One or more automations are paused.", "automations.status", "Confirm the pause is intentional and document the owner of the next action.", "attention"],
    ["Automation never run", "An enabled automation has no recorded run.", "automations.run_count", "Validate its trigger conditions using a controlled scenario before relying on it.", "info"],
    ["Automation success", "Recent automation runs completed successfully.", "automationRuns.status", "No intervention is required; review outcomes periodically.", "healthy"],
    ["Automation failure ratio", "An automation records more failures than successes.", "automations.success_count/failure_count", "Pause or downgrade to proposal mode until the failure pattern is understood.", "critical"],
    ["Manual execution mode", "An automation is intentionally configured as manual.", "automations.execution_mode", "Treat it as an operator-assist rule, not autonomous execution.", "info"],
    ["Proposal execution mode", "An automation is configured to propose actions rather than execute them.", "automations.execution_mode", "Review proposals and preserve human approval where policy requires it.", "healthy"],
    ["Automation inventory empty", "No automation is configured.", "automations", "Create rules only when a repeated operational responsibility genuinely benefits from automation.", "info"],
    ["Automation estate healthy", "No recent automation failure is detected.", "automationRuns", "Continue normal supervision.", "healthy"],
  ],
  commercial: [
    ["Commercial intent detected", "A conversation triage category indicates commercial or sales intent.", "conversations.triage_category", "Assign to the appropriate commercial owner and preserve social context during handoff.", "attention"],
    ["Pricing enquiry", "A relationship is categorised around price, quotation or buying intent.", "conversation triage/tags", "Use an approved commercial response and route qualified demand to the correct service line.", "attention"],
    ["Partnership signal", "A conversation triage category indicates partnership or B2B intent.", "conversation triage", "Assign to partnerships/revenue ownership and preserve the originating content context.", "attention"],
    ["Lead waiting", "A commercially categorised relationship is waiting.", "conversation status + triage", "Clarify the next action and prevent social-generated demand from becoming invisible.", "critical"],
    ["Lead unresolved", "A commercial relationship remains open without resolution.", "conversation status + triage", "Confirm owner, next action and SLA.", "warning"],
    ["Campaign commercial context", "An active campaign has an explicit objective containing commercial language.", "campaigns.objective", "Keep publication and engagement outcomes linked to the campaign for later conversion analysis.", "info"],
    ["Commercial evidence absent", "No structured commercial triage is present in current engagement data.", "conversations.triage_category", "Do not invent lead counts; improve triage only when real interactions exist.", "info"],
    ["Commercial response confirmed", "A commercially categorised relationship is responded or resolved.", "conversation status + triage", "Preserve outcome notes in the downstream commercial system when available.", "healthy"],
    ["High-priority lead", "Commercial intent and high priority occur on the same relationship.", "conversation priority + triage", "Escalate immediately to the commercial owner.", "critical"],
    ["Commercial social quiet", "No open commercial social interaction is detected.", "engagement", "No intervention is required.", "healthy"],
  ],
  governance: [
    ["Audit trail active", "Social Command has recorded operations or automation runs.", "operations + automationRuns", "Keep audit evidence immutable and review privileged changes periodically.", "healthy"],
    ["Privileged connection action", "Meta connection state has changed recently.", "connection timestamps", "Confirm the change was authorised and its downstream capabilities remain healthy.", "attention"],
    ["Unresolved operational failure", "A failed publishing or automation action exists.", "jobs + automationRuns", "Assign ownership and document the resolution path before closure.", "critical"],
    ["Mass-operation watch", "Bulk operation activity is present.", "operations.total_items", "Review scope, approval and outcome evidence for high-volume actions.", "attention"],
    ["Configuration truth gap", "A capability is marked degraded, permission-missing or provider-limited.", "mz2.capabilities", "Expose the limitation accurately; never translate an unavailable provider capability into a fake success state.", "warning"],
    ["Data retention attention", "Old operational objects remain active beyond their useful window.", "created_at timestamps", "Review retention and archival policy before deleting evidence.", "info"],
    ["Human approval posture", "Proposal/manual automation modes are present.", "automations.execution_mode", "Preserve the human approval boundary for actions configured to require it.", "healthy"],
    ["Governance exception quiet", "No critical failed job or automation run is detected.", "jobs + automationRuns", "No intervention is required.", "healthy"],
    ["Unknown provider state", "A capability or metric truth state is unknown/unavailable.", "capabilities + metrics", "Keep the UI explicit about unavailable truth instead of fabricating a value.", "attention"],
    ["Brand asset governance", "The immutable AngelCare logo asset is registered in the MZ4 shell.", "brand asset", "Keep the source asset unchanged and reuse it rather than generating substitutes.", "healthy"],
  ],
  system: [
    ["System healthy", "Meta connection and Windows Vault are both healthy and there are no failed jobs.", "connection + storage + jobs", "Normal operation may continue.", "healthy"],
    ["Windows gateway down", "Windows storage health is false.", "storage.healthy", "Restore the media gateway before media-dependent operations.", "critical"],
    ["Execution worker pressure", "Publishing jobs are processing or retrying in elevated volume.", "jobs.status", "Inspect queue age and worker heartbeat before adding another large batch.", "warning"],
    ["Operational error", "The bootstrap reports failed publishing state.", "stats.failed", "Open Exceptions and resolve the root cause before scaling activity.", "critical"],
    ["Storage telemetry missing", "Storage is configured but free/used telemetry is unavailable.", "storage.freeBytes/usedBytes", "Keep the gateway health visible and enable capacity telemetry when available.", "info"],
    ["Connection verification stale", "Connection verification is older than seven days.", "connection.last_verified_at", "Run a controlled verification from Control.", "attention"],
    ["Operation in progress", "A Social Command action operation is still processing or waiting.", "operations.status", "Let the operation finish or open its Action Pulse before issuing a duplicate action.", "info"],
    ["Operation failed", "A Social Command action operation failed.", "operations.status", "Open the operation detail, identify the failed step and retry only when safe.", "critical"],
    ["System snapshot fresh", "A new Social Command snapshot was captured by load, navigation, refresh or mutation.", "snapshot lifecycle", "Read the snapshot timestamp; hover pauses the broadcast rail without causing data refresh.", "healthy"],
    ["System quiet", "No critical system or execution signal is active.", "system", "No intervention is required.", "healthy"],
  ],
  intelligence: [
    ["Performance truth live", "The performance truth state is live.", "performance.truthState", "Use the measured intelligence; preserve its observation timestamp.", "healthy"],
    ["Performance insufficient", "The performance layer reports insufficient data.", "performance.truthState", "Do not invent recommendations; accumulate real execution history.", "info"],
    ["Performance stale", "The performance layer reports stale data.", "performance.truthState", "Synchronise only when provider access is healthy.", "warning"],
    ["Publishing success signal", "A measured publishing success rate is available.", "performance.publishingSuccessRate", "Use the measured rate as evidence, not as a vanity metric.", "healthy"],
    ["Response-time signal", "A measured median first-response time is available.", "performance.medianFirstResponseMinutes", "Compare against internal service expectations and investigate deterioration.", "info"],
    ["Hot-slot evidence", "At least one time slot has enough live evidence for scoring.", "performance.hotSlots", "Use the evidence as a planning input, not an automatic publishing rule.", "healthy"],
    ["Metric provider limited", "A performance metric is provider-limited.", "metrics.truth_state", "Explain the provider limitation instead of displaying zero.", "attention"],
    ["Channel performance evidence", "Measured channel performance rows are available.", "performance.channelPerformance", "Use channel evidence when adapting content, preserving sample size and metric context.", "info"],
    ["Format performance evidence", "Measured format performance rows are available.", "performance.formatPerformance", "Use observed format evidence to inform future creative experiments.", "info"],
    ["Intelligence quiet", "No reliable provider metric is currently available.", "performance", "Operate from execution truth until enough measured data exists.", "info"],
  ],
  workflow: [
    ["Ownership gap", "An actionable relationship has no assigned operator.", "conversation ownership", "Assign ownership before the next SLA boundary.", "warning"],
    ["Work waiting", "A workflow object is waiting on an external or internal next action.", "conversation/job status", "Record who owns the next action and when it should be revisited.", "attention"],
    ["Work resolved", "A relationship or execution item is resolved/published.", "status", "Retain evidence and remove it from active attention queues.", "healthy"],
    ["Next action overdue", "A due time is in the past on an unresolved relationship.", "conversations.due_at", "Escalate ownership immediately.", "critical"],
    ["Bulk work active", "A multi-item operation is processing.", "operations.total_items", "Use Action Pulse rather than starting a duplicate mass action.", "info"],
    ["Recovery available", "A failed job is eligible for operator recovery.", "execution_jobs.status", "Open Failures, inspect provider evidence and recover deliberately.", "warning"],
    ["Content factory accumulation", "Drafts exceed scheduled work.", "publication status counts", "Move viable work through review into the runway or archive abandoned drafts.", "attention"],
    ["Media-to-content gap", "Ready media inventory exists but no future publication is scheduled.", "assets + publications", "Review campaign demand and convert approved assets into planned work when appropriate.", "info"],
    ["Campaign-to-engagement context", "Engagement relationships reference campaign or source publication context.", "conversation campaign/source", "Preserve context through assignment and resolution.", "healthy"],
    ["Workflow balanced", "No overdue relationship and no failed publication job is detected.", "workflow", "Normal operation may continue.", "healthy"],
  ],
}

const familyPrefix: Record<BroadcastFamily, string> = {
  publishing: "PUB",
  engagement: "ENG",
  campaign: "CAM",
  brand: "BRD",
  media: "MED",
  meta: "META",
  automation: "AUT",
  commercial: "COM",
  governance: "GOV",
  system: "SYS",
  intelligence: "INT",
  workflow: "WRK",
}

export const BROADCAST_RULES: BroadcastRule[] = (Object.keys(familyDefinitions) as BroadcastFamily[]).flatMap((family) =>
  familyDefinitions[family].map(([title, condition, source, resolution, defaultSeverity], index) => ({
    code: `${familyPrefix[family]}-${String(index + 1).padStart(3, "0")}`,
    family,
    ordinal: index + 1,
    title,
    condition,
    source,
    resolution,
    defaultSeverity,
    dedupeMinutes: defaultSeverity === "critical" ? 5 : defaultSeverity === "warning" ? 15 : 30,
    operatorAction: resolution.split(".")[0] || resolution,
  })),
)

function rule(code: string): BroadcastRule {
  const found = BROADCAST_RULES.find((item) => item.code === code)
  if (!found) throw new Error(`Unknown broadcast rule ${code}`)
  return found
}

function signal(
  code: string,
  observedAt: string,
  message: string,
  detail: string,
  overrides: Partial<Pick<BroadcastSignal, "severity" | "entityId" | "entityLabel" | "actionLabel">> = {},
): BroadcastSignal {
  const definition = rule(code)
  return {
    id: `${code}:${overrides.entityId || "global"}:${message}`,
    ruleCode: code,
    family: definition.family,
    severity: overrides.severity || definition.defaultSeverity,
    title: definition.title,
    message,
    detail,
    resolution: definition.resolution,
    source: definition.source,
    observedAt,
    entityId: overrides.entityId,
    entityLabel: overrides.entityLabel,
    actionLabel: overrides.actionLabel || definition.operatorAction,
  }
}

const GB = 1024 * 1024 * 1024
const DAY = 24 * 60 * 60 * 1000
const MINUTE = 60 * 1000

function isOpenConversation(conversation: SocialConversation) {
  return !["resolved", "archived"].includes(conversation.status)
}

function containsCommercialIntent(value: string | null | undefined) {
  return /(commercial|sales|lead|prix|price|tarif|devis|quote|parten|b2b|achat|buy)/i.test(value || "")
}

function campaignPublications(campaign: SocialCampaign, publications: SocialPublication[]) {
  return publications.filter((publication) => publication.campaign_id === campaign.id)
}

function capabilityAttention(capabilities: SocialChannelCapability[]) {
  return capabilities.filter((capability) => !capability.supported || ["unavailable", "requires_reconnect", "provider_limited", "permission_missing", "degraded"].includes(capability.state || "available"))
}

export function buildBroadcastSnapshot(data: SocialBootstrap, observedAt = new Date().toISOString()): BroadcastSnapshot {
  const now = new Date(observedAt).getTime()
  const signals: BroadcastSignal[] = []
  const publications = data.publications || []
  const jobs = data.jobs || []
  const campaigns = data.campaigns || []
  const assets = data.assets || []
  const mz2 = data.mz2
  const conversations = mz2?.conversations || []
  const comments = mz2?.comments || []
  const mentions = mz2?.mentions || []
  const automations = mz2?.automations || []
  const automationRuns = mz2?.automationRuns || []

  const scheduledFuture = publications
    .filter((publication) => publication.scheduled_at && new Date(publication.scheduled_at).getTime() >= now && !["published", "cancelled", "archived"].includes(publication.status))
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
  const scheduledSoon = scheduledFuture.filter((publication) => new Date(publication.scheduled_at!).getTime() - now <= 2 * 60 * MINUTE)
  const overdue = publications.filter((publication) => publication.scheduled_at && new Date(publication.scheduled_at).getTime() < now && !["published", "cancelled", "archived"].includes(publication.status))
  const failedJobs = jobs.filter((job) => job.status === "failed")
  const retryJobs = jobs.filter((job) => job.status === "retrying" || job.attempt_count > 1)
  const liveJobs = jobs.filter((job) => ["queued", "preparing", "publishing", "confirming", "retrying"].includes(job.status))
  const drafts = publications.filter((publication) => publication.status === "draft")

  if (scheduledSoon.length) {
    const first = scheduledSoon[0]
    signals.push(signal("PUB-001", observedAt, `${scheduledSoon.length} départ${scheduledSoon.length > 1 ? "s" : ""} dans les 2 prochaines heures`, `Prochain départ : ${first.title} · ${new Date(first.scheduled_at!).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`, { entityId: first.id, entityLabel: first.title }))
  }
  if (overdue.length) signals.push(signal("PUB-002", observedAt, `${overdue.length} publication${overdue.length > 1 ? "s" : ""} en retard`, `La plus ancienne : ${overdue[0].title}`, { entityId: overdue[0].id, entityLabel: overdue[0].title }))
  if (failedJobs.length) signals.push(signal("PUB-003", observedAt, `${failedJobs.length} job${failedJobs.length > 1 ? "s" : ""} de publication en échec`, failedJobs[0].last_error || "Cause fournisseur à inspecter", { entityId: failedJobs[0].id }))
  if (retryJobs.length) signals.push(signal("PUB-004", observedAt, `${retryJobs.length} job${retryJobs.length > 1 ? "s" : ""} en reprise`, `Tentatives maximales observées : ${Math.max(...retryJobs.map((job) => job.attempt_count))}`))
  if (liveJobs.length >= 10) signals.push(signal("PUB-005", observedAt, `${liveJobs.length} jobs actuellement dans la queue`, "La file d’exécution mérite une lecture opérateur avant d’ajouter un nouveau volume."))
  if (drafts.length >= Math.max(5, scheduledFuture.length * 2)) signals.push(signal("PUB-007", observedAt, `${drafts.length} brouillons pour ${scheduledFuture.length} départs futurs`, "Le stock créatif dépasse largement le travail déjà placé dans le runway."))
  if (data.stats.todayPublished > 0 && failedJobs.length === 0) signals.push(signal("PUB-009", observedAt, `${data.stats.todayPublished} publication${data.stats.todayPublished > 1 ? "s" : ""} confirmée${data.stats.todayPublished > 1 ? "s" : ""} aujourd’hui`, "Aucun job échoué n’est actuellement présent."))
  if (!failedJobs.length && !overdue.length) signals.push(signal("PUB-010", observedAt, "Runway de publication sans anomalie critique détectée", `${scheduledFuture.length} départ${scheduledFuture.length > 1 ? "s" : ""} futur${scheduledFuture.length > 1 ? "s" : ""} actuellement enregistré${scheduledFuture.length > 1 ? "s" : ""}.`))

  const unread = conversations.reduce((total, conversation) => total + conversation.unread_count, 0)
  const unansweredComments = comments.filter((comment) => !["answered", "resolved"].includes(comment.status))
  const sensitive = comments.filter((comment) => ["sensitive", "priority"].includes(comment.status)).length + conversations.filter((conversation) => conversation.priority === "high" || conversation.status === "priority").length
  const dueRisk = conversations.filter((conversation) => isOpenConversation(conversation) && conversation.due_at && new Date(conversation.due_at).getTime() - now <= 30 * MINUTE)
  const unassigned = conversations.filter((conversation) => isOpenConversation(conversation) && !conversation.assigned_user_id)
  const waiting = conversations.filter((conversation) => conversation.status === "waiting")
  const activeMentions = mentions.filter((mention) => mention.status !== "resolved")
  if (unread) signals.push(signal("ENG-001", observedAt, `${unread} message${unread > 1 ? "s" : ""} non lu${unread > 1 ? "s" : ""}`, `${conversations.filter((conversation) => conversation.unread_count > 0).length} relation${conversations.filter((conversation) => conversation.unread_count > 0).length > 1 ? "s" : ""} concernée${conversations.filter((conversation) => conversation.unread_count > 0).length > 1 ? "s" : ""}.`))
  if (unansweredComments.length) signals.push(signal("ENG-002", observedAt, `${unansweredComments.length} commentaire${unansweredComments.length > 1 ? "s" : ""} à traiter`, unansweredComments[0].text || "Commentaire sans texte disponible", { entityId: unansweredComments[0].id }))
  if (sensitive) signals.push(signal("ENG-003", observedAt, `${sensitive} interaction${sensitive > 1 ? "s" : ""} sensible${sensitive > 1 ? "s" : ""} ou prioritaire${sensitive > 1 ? "s" : ""}`, "Une lecture humaine prioritaire est requise.", { severity: "critical" }))
  if (dueRisk.length) signals.push(signal("ENG-004", observedAt, `${dueRisk.length} relation${dueRisk.length > 1 ? "s" : ""} en risque SLA`, `La plus proche : ${dueRisk[0].participant_name || dueRisk[0].participant_username || "Instagram contact"}`, { entityId: dueRisk[0].id }))
  if (waiting.length) signals.push(signal("ENG-005", observedAt, `${waiting.length} relation${waiting.length > 1 ? "s" : ""} en attente`, "Vérifiez qui possède réellement la prochaine action."))
  if (unassigned.length) signals.push(signal("ENG-006", observedAt, `${unassigned.length} relation${unassigned.length > 1 ? "s" : ""} ouverte${unassigned.length > 1 ? "s" : ""} sans propriétaire`, "L’absence d’assignation est visible mais n’est pas automatiquement corrigée."))
  if (activeMentions.length) signals.push(signal("ENG-007", observedAt, `${activeMentions.length} mention${activeMentions.length > 1 ? "s" : ""} de marque à revoir`, activeMentions[0].text || "Mention détectée sans texte disponible", { entityId: activeMentions[0].id }))
  if (!unread && !unansweredComments.length) signals.push(signal("ENG-008", observedAt, "Inbox sans interaction non lue ou commentaire non répondu", "La charge relationnelle structurée est actuellement claire."))

  const activeCampaigns = campaigns.filter((campaign) => campaign.status === "active")
  if (activeCampaigns.length) signals.push(signal("CAM-001", observedAt, `${activeCampaigns.length} campagne${activeCampaigns.length > 1 ? "s" : ""} active${activeCampaigns.length > 1 ? "s" : ""}`, activeCampaigns.map((campaign) => campaign.title).slice(0, 3).join(" · ")))
  for (const campaign of activeCampaigns.slice(0, 3)) {
    const pubs = campaignPublications(campaign, publications)
    if (!pubs.length) signals.push(signal("CAM-002", observedAt, `${campaign.title} n’a encore aucune publication liée`, campaign.objective || "Objectif non renseigné", { entityId: campaign.id, entityLabel: campaign.title }))
    else if (pubs.every((publication) => publication.status === "draft")) signals.push(signal("CAM-003", observedAt, `${campaign.title} reste entièrement en brouillon`, `${pubs.length} création${pubs.length > 1 ? "s" : ""} sans départ planifié.`, { entityId: campaign.id, entityLabel: campaign.title }))
    if (!campaign.objective?.trim()) signals.push(signal("CAM-009", observedAt, `${campaign.title} n’a pas d’objectif explicite`, "L’absence d’objectif réduit la qualité du brief et de la lecture de performance.", { entityId: campaign.id, entityLabel: campaign.title }))
    if (campaign.end_at) {
      const delta = new Date(campaign.end_at).getTime() - now
      if (delta >= 0 && delta <= 7 * DAY) signals.push(signal("CAM-006", observedAt, `${campaign.title} se termine dans ${Math.max(1, Math.ceil(delta / DAY))} jour${delta > DAY ? "s" : ""}`, "Vérifiez les engagements de publication restants.", { entityId: campaign.id, entityLabel: campaign.title }))
    }
  }
  if (!activeCampaigns.length) signals.push(signal("CAM-010", observedAt, "Aucune campagne active", "La plateforme n’invente aucune campagne ou performance lorsque le portefeuille est calme."))

  signals.push(signal("BRD-001", observedAt, "Identité AngelCare officielle verrouillée dans le shell MZ4", "Le logo est référencé depuis l’actif binaire officiel conservé sans redessin."))
  const emptyCaptions = drafts.filter((publication) => publication.format !== "story" && !publication.caption.trim())
  if (emptyCaptions.length) signals.push(signal("BRD-003", observedAt, `${emptyCaptions.length} brouillon${emptyCaptions.length > 1 ? "s" : ""} sans légende`, `Premier : ${emptyCaptions[0].title}`, { entityId: emptyCaptions[0].id, entityLabel: emptyCaptions[0].title }))
  const variantCount = publications.filter((publication) => Object.keys(publication.platform_variants || {}).length > 0).length
  if (variantCount) signals.push(signal("BRD-007", observedAt, `${variantCount} publication${variantCount > 1 ? "s" : ""} possède${variantCount > 1 ? "nt" : ""} des variantes plateforme`, "Le travail natif par canal est explicitement enregistré."))

  if (data.storage.healthy) signals.push(signal("MED-001", observedAt, "Windows Media Vault opérationnel", data.storage.freeBytes != null ? `${(data.storage.freeBytes / GB).toFixed(1)} GiB libres` : "Passerelle de stockage disponible."))
  else signals.push(signal("MED-002", observedAt, "Windows Media Vault à vérifier", data.storage.error || "Le health check n’est pas positif.", { severity: "critical" }))
  if (data.storage.freeBytes != null && data.storage.freeBytes < 10 * GB) signals.push(signal("MED-003", observedAt, `Stockage Windows sous le seuil de 10 GiB`, `${(data.storage.freeBytes / GB).toFixed(1)} GiB libres`))
  const failedAssets = assets.filter((asset) => asset.status === "failed")
  if (failedAssets.length) signals.push(signal("MED-004", observedAt, `${failedAssets.length} média${failedAssets.length > 1 ? "s" : ""} en échec d’ingestion`, failedAssets[0].original_filename, { entityId: failedAssets[0].id, entityLabel: failedAssets[0].original_filename }))
  const unusedAssets = assets.filter((asset) => asset.status === "ready" && asset.usage_count === 0)
  if (unusedAssets.length) signals.push(signal("MED-005", observedAt, `${unusedAssets.length} média${unusedAssets.length > 1 ? "s" : ""} prêt${unusedAssets.length > 1 ? "s" : ""} encore inutilisé${unusedAssets.length > 1 ? "s" : ""}`, "Signal d’inventaire, pas une obligation de publication."))
  if (!assets.length) signals.push(signal("MED-006", observedAt, "Media Vault sans actif indexé", "Importez uniquement des médias approuvés lorsque la production l’exige."))
  if (!failedAssets.length && assets.length) signals.push(signal("MED-010", observedAt, `${assets.filter((asset) => asset.status === "ready").length} média${assets.filter((asset) => asset.status === "ready").length > 1 ? "s" : ""} prêt${assets.filter((asset) => asset.status === "ready").length > 1 ? "s" : ""}`, "Aucun échec média actif détecté."))

  if (!data.connection) signals.push(signal("META-002", observedAt, "Meta n’est pas connecté", "Les opérations fournisseur nécessitant une connexion resteront indisponibles.", { severity: "critical" }))
  else if (data.connection.connection_health === "healthy") signals.push(signal("META-001", observedAt, `Meta connecté · ${data.connection.facebook_page_name || "Page active"}`, data.connection.instagram_username ? `Instagram @${data.connection.instagram_username}` : "Instagram lié non observé"))
  else signals.push(signal("META-003", observedAt, `Connexion Meta : ${data.connection.connection_health}`, "Ouvrez Control avant une nouvelle vague de publication."))
  if (data.connection?.token_expires_at) {
    const delta = new Date(data.connection.token_expires_at).getTime() - now
    if (delta >= 0 && delta <= 14 * DAY) signals.push(signal("META-004", observedAt, `Autorisation Meta expire dans ${Math.max(1, Math.ceil(delta / DAY))} jour${delta > DAY ? "s" : ""}`, "Préparez une réautorisation contrôlée."))
  }
  if (mz2?.webhook?.verified && mz2.webhook.events24h > 0) signals.push(signal("META-008", observedAt, `${mz2.webhook.events24h} événement${mz2.webhook.events24h > 1 ? "s" : ""} webhook accepté${mz2.webhook.events24h > 1 ? "s" : ""} / 24h`, mz2.webhook.lastLatencyMs != null ? `Dernière latence observée : ${mz2.webhook.lastLatencyMs} ms` : "Webhook vérifié."))
  if (mz2?.webhook?.rejected24h) signals.push(signal("META-006", observedAt, `${mz2.webhook.rejected24h} livraison${mz2.webhook.rejected24h > 1 ? "s" : ""} webhook rejetée${mz2.webhook.rejected24h > 1 ? "s" : ""} / 24h`, "Les rejets historiques restent visibles séparément des événements traités."))
  if (mz2?.webhook?.failed24h) signals.push(signal("META-007", observedAt, `${mz2.webhook.failed24h} événement${mz2.webhook.failed24h > 1 ? "s" : ""} webhook en échec de traitement`, "Un diagnostic de traitement est requis.", { severity: "critical" }))
  const capabilityGaps = capabilityAttention(mz2?.capabilities || [])
  if (capabilityGaps.length) signals.push(signal("META-009", observedAt, `${capabilityGaps.length} capacité${capabilityGaps.length > 1 ? "s" : ""} Meta limitée${capabilityGaps.length > 1 ? "s" : ""}`, capabilityGaps.slice(0, 3).map((capability) => capability.capability).join(" · ")))

  const activeAutomations = automations.filter((automation) => automation.status === "active")
  const failedRuns = automationRuns.filter((run) => run.status === "failed")
  if (activeAutomations.length) signals.push(signal("AUT-001", observedAt, `${activeAutomations.length} automation${activeAutomations.length > 1 ? "s" : ""} active${activeAutomations.length > 1 ? "s" : ""}`, activeAutomations.slice(0, 3).map((automation) => automation.name).join(" · ")))
  if (failedRuns.length) signals.push(signal("AUT-002", observedAt, `${failedRuns.length} exécution${failedRuns.length > 1 ? "s" : ""} d’automation en échec`, failedRuns[0].error_message || failedRuns[0].automation_code, { severity: "critical" }))
  const paused = automations.filter((automation) => automation.status === "paused")
  if (paused.length) signals.push(signal("AUT-003", observedAt, `${paused.length} automation${paused.length > 1 ? "s" : ""} en pause`, paused.slice(0, 3).map((automation) => automation.name).join(" · ")))
  if (!automations.length) signals.push(signal("AUT-009", observedAt, "Aucune automation configurée", "Le système reste explicite : aucune règle n’est prétendue active."))
  if (automations.length && !failedRuns.length) signals.push(signal("AUT-010", observedAt, "Aucun échec récent d’automation détecté", `${automationRuns.filter((run) => run.status === "completed").length} run${automationRuns.filter((run) => run.status === "completed").length > 1 ? "s" : ""} complété${automationRuns.filter((run) => run.status === "completed").length > 1 ? "s" : ""} dans l’historique chargé.`))

  const commercial = conversations.filter((conversation) => containsCommercialIntent(`${conversation.triage_category || ""} ${(conversation.tags || []).join(" ")}`))
  const openCommercial = commercial.filter(isOpenConversation)
  if (openCommercial.length) signals.push(signal("COM-001", observedAt, `${openCommercial.length} relation${openCommercial.length > 1 ? "s" : ""} à intention commerciale détectée${openCommercial.length > 1 ? "s" : ""}`, openCommercial.slice(0, 3).map((conversation) => conversation.participant_name || conversation.participant_username || "contact").join(" · ")))
  const highCommercial = openCommercial.filter((conversation) => conversation.priority === "high" || conversation.status === "priority")
  if (highCommercial.length) signals.push(signal("COM-009", observedAt, `${highCommercial.length} lead${highCommercial.length > 1 ? "s" : ""} social${highCommercial.length > 1 ? "aux" : ""} prioritaire${highCommercial.length > 1 ? "s" : ""}`, highCommercial[0].last_message_preview || "Interaction prioritaire", { entityId: highCommercial[0].id, severity: "critical" }))
  if (!commercial.length) signals.push(signal("COM-007", observedAt, "Aucune intention commerciale structurée dans les interactions chargées", "Aucun lead n’est inventé lorsque le triage réel ne le démontre pas."))

  if (data.operations.length || automationRuns.length) signals.push(signal("GOV-001", observedAt, "Traçabilité opérationnelle active", `${data.operations.length} opération${data.operations.length > 1 ? "s" : ""} · ${automationRuns.length} run${automationRuns.length > 1 ? "s" : ""} d’automation chargé${automationRuns.length > 1 ? "s" : ""}.`))
  if (failedJobs.length || failedRuns.length) signals.push(signal("GOV-003", observedAt, "Des échecs opérationnels non silencieux sont présents", `${failedJobs.length} publishing · ${failedRuns.length} automation.`))
  if (capabilityGaps.length) signals.push(signal("GOV-005", observedAt, "La matrice de capacités contient des limitations réelles", "MZ4 les expose comme limites fournisseur/permission/runtime au lieu de les masquer."))
  signals.push(signal("GOV-010", observedAt, "Actif logo officiel protégé par provenance SHA-256", "Le shell MZ4 référence l’actif exact, sans génération ni approximation."))

  const inProgressOps = data.operations.filter((operation) => ["preparing", "processing", "waiting"].includes(operation.status))
  const failedOps = data.operations.filter((operation) => operation.status === "failed")
  if (data.connection?.connection_health === "healthy" && data.storage.healthy && !failedJobs.length) signals.push(signal("SYS-001", observedAt, "Socle Meta + Windows + publisher sans alerte critique", "Le snapshot courant ne détecte pas d’échec de job actif."))
  if (!data.storage.healthy) signals.push(signal("SYS-002", observedAt, "Windows gateway non sain", data.storage.error || "Health check négatif.", { severity: "critical" }))
  if (data.stats.failed) signals.push(signal("SYS-004", observedAt, `${data.stats.failed} échec${data.stats.failed > 1 ? "s" : ""} dans les statistiques opérationnelles`, "Ouvrez Exceptions avant d’augmenter le volume."))
  if (inProgressOps.length) signals.push(signal("SYS-007", observedAt, `${inProgressOps.length} opération${inProgressOps.length > 1 ? "s" : ""} Action Pulse en cours`, inProgressOps.slice(0, 2).map((operation) => operation.label).join(" · ")))
  if (failedOps.length) signals.push(signal("SYS-008", observedAt, `${failedOps.length} opération${failedOps.length > 1 ? "s" : ""} Action Pulse en échec`, failedOps[0].error_message || failedOps[0].label, { severity: "critical" }))
  signals.push(signal("SYS-009", observedAt, "Snapshot Social Command capturé", "Aucune actualisation continue n’est exécutée : nouvelle capture au chargement, navigation, refresh ou mutation."))

  const performance = mz2?.performance
  if (performance?.truthState === "live") signals.push(signal("INT-001", observedAt, "Social Intelligence dispose d’un état de vérité LIVE", performance.observedAt ? `Observé ${new Date(performance.observedAt).toLocaleString("fr-FR")}` : "Observation fournisseur disponible."))
  else if (performance?.truthState === "insufficient_data") signals.push(signal("INT-002", observedAt, "Social Intelligence : données insuffisantes", "Aucune recommandation de performance ne sera inventée."))
  else if (performance?.truthState === "stale") signals.push(signal("INT-003", observedAt, "Social Intelligence : données périmées", performance.observedAt ? `Dernière observation ${new Date(performance.observedAt).toLocaleString("fr-FR")}` : "Date inconnue."))
  if (performance?.medianFirstResponseMinutes != null) signals.push(signal("INT-005", observedAt, `Réponse médiane : ${Math.round(performance.medianFirstResponseMinutes)} min`, `${performance.openConversations} conversation${performance.openConversations > 1 ? "s" : ""} ouverte${performance.openConversations > 1 ? "s" : ""}.`))
  if (performance?.hotSlots?.some((slot) => slot.state === "live" && slot.score != null)) signals.push(signal("INT-006", observedAt, "Des créneaux temporels disposent maintenant d’un score LIVE", "Utilisez-les comme preuve de planification, pas comme automatisation aveugle."))

  if (unassigned.length) signals.push(signal("WRK-001", observedAt, `${unassigned.length} ownership gap${unassigned.length > 1 ? "s" : ""}`, "Des relations actives n’ont pas de responsable assigné."))
  if (dueRisk.some((conversation) => conversation.due_at && new Date(conversation.due_at).getTime() < now)) signals.push(signal("WRK-004", observedAt, "Une échéance relationnelle est déjà dépassée", "Escalade immédiate de l’ownership recommandée.", { severity: "critical" }))
  if (data.operations.some((operation) => operation.total_items > 1 && ["preparing", "processing", "waiting"].includes(operation.status))) signals.push(signal("WRK-005", observedAt, "Une opération de masse est active", "Utilisez Action Pulse pour suivre son avancement au lieu de la relancer."))
  if (drafts.length > scheduledFuture.length && drafts.length >= 3) signals.push(signal("WRK-007", observedAt, "Le Content Factory accumule davantage de brouillons que de départs futurs", `${drafts.length} brouillons · ${scheduledFuture.length} sorties futures.`))
  if (assets.some((asset) => asset.status === "ready") && !scheduledFuture.length) signals.push(signal("WRK-008", observedAt, "Des médias sont prêts mais aucun départ futur n’est planifié", "Signal de synchronisation entre Media Vault et Publish, sans obligation automatique de publier."))
  if (!failedJobs.length && !dueRisk.length) signals.push(signal("WRK-010", observedAt, "Workflow sans job échoué ni relation en risque SLA", "Le snapshot courant ne détecte aucun blocage de workflow critique."))

  const rank: Record<BroadcastSeverity, number> = { critical: 0, warning: 1, attention: 2, healthy: 3, info: 4 }
  const deduped = Array.from(new Map(signals.map((item) => [item.id, item])).values()).sort((a, b) => rank[a.severity] - rank[b.severity])
  const counts: Record<BroadcastSeverity, number> = { critical: 0, warning: 0, attention: 0, healthy: 0, info: 0 }
  deduped.forEach((item) => counts[item.severity]++)
  const familyCounts = new Map<BroadcastFamily, number>()
  deduped.forEach((item) => familyCounts.set(item.family, (familyCounts.get(item.family) || 0) + 1))

  return {
    observedAt,
    signals: deduped,
    rules: BROADCAST_RULES,
    counts,
    activeFamilies: Array.from(familyCounts.entries()).map(([family, count]) => ({ family, count })).sort((a, b) => b.count - a.count),
  }
}

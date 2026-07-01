export type JsonRecord = Record<string, unknown>

export type TrainingHubApiResult<T> =
  | { ok: true; data: T; meta?: JsonRecord }
  | { ok: false; error: string; code?: string; details?: unknown }

export type TrainingHubAuthUser = {
  id: string
  email?: string | null
  user_metadata?: JsonRecord | null
  app_metadata?: JsonRecord | null
}

export type TrainingHubProfile = {
  id: string
  auth_user_id?: string | null
  full_name: string | null
  email: string | null
  job_title?: string | null
  status: string | null
  preferred_language?: string | null
  metadata?: JsonRecord | null
}

export type TrainingHubOrganization = {
  id: string
  name: string | null
  legal_name?: string | null
  organization_type: string | null
  status: string | null
  country_code?: string | null
  city?: string | null
  currency_code?: string | null
  timezone?: string | null
  preferred_language?: string | null
}

export type TrainingHubMembership = {
  id: string
  organization_id: string
  site_id: string | null
  user_id: string
  membership_type: string | null
  status: string | null
  organization?: TrainingHubOrganization | null
}

export type TrainingHubRole = {
  id: string
  code: string
  name: string | null
  scope: string | null
  organization_id?: string | null
  site_id?: string | null
  assignment_status?: string | null
}

export type TrainingHubEntitlement = {
  id: string
  code: string | null
  name: string | null
  entitlement_type: string | null
  organization_id: string | null
  site_id: string | null
  source_type: string | null
  source_id: string | null
  status: string | null
  valid_from: string | null
  valid_until: string | null
  limit_value?: number | null
  used_value?: number | null
}

export type TrainingHubContext = {
  authUser: TrainingHubAuthUser
  profile: TrainingHubProfile
  memberships: TrainingHubMembership[]
  organizations: TrainingHubOrganization[]
  roles: TrainingHubRole[]
  permissions: string[]
  entitlements: TrainingHubEntitlement[]
  isInternal: boolean
  isSuperAdmin: boolean
  organizationIds: string[]
  siteIds: string[]
}

export type TrainingHubCategory = {
  id: string
  code: string
  name: string
  subtitle?: string | null
  description?: string | null
  owner_promise?: string | null
  market_risk?: string | null
  display_order?: number | null
  status?: string | null
}

export type TrainingHubCourse = {
  id: string
  category_id: string
  ref: string
  title: string
  short_description?: string | null
  commercial_description?: string | null
  owner_alert?: string | null
  positioning_tags?: string[] | null
  onsite_entry_price_minor?: number | null
  refresh_entry_price_minor?: number | null
  currency_code?: string | null
  starter_min_participants?: number | null
  starter_max_participants?: number | null
  min_hours?: number | null
  max_hours?: number | null
  has_refresh_module?: boolean | null
  publication_status?: string | null
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
  metadata?: JsonRecord | null
  category?: TrainingHubCategory | null
}

export type TrainingHubCourseVersion = {
  id: string
  course_id: string
  version_label: string | null
  content_summary?: string | null
  trainer_notes?: string | null
  valid_from?: string | null
  valid_until?: string | null
  is_current?: boolean | null
  status?: string | null
  approved_at?: string | null
  metadata?: JsonRecord | null
}

export type TrainingHubCatalogueSummary = {
  categories: number
  courses: number
  publishedCourses: number
  draftCourses: number
  archivedCourses: number
  refreshModules: number
  resources: number
  kits: number
  publicationChecks: number
  byCategory: Array<TrainingHubCategory & { course_count: number; published_count: number; draft_count: number; archived_count: number }>
}

export type TrainingHubCourseReadinessItem = {
  key: string
  label: string
  passed: boolean
  detail?: string
}

export type TrainingHubCourseReadiness = {
  courseRef: string
  courseId: string
  ready: boolean
  status: 'ready' | 'pending'
  items: TrainingHubCourseReadinessItem[]
}

export type TrainingHubPricingPreviewRequest = {
  course_ref?: string
  courseRef?: string
  course_id?: string
  courseId?: string
  organization_id?: string
  organizationId?: string
  site_id?: string | null
  siteId?: string | null
  participant_count?: number
  participantCount?: number
  requested_hours?: number | null
  requestedHours?: number | null
  city?: string | null
  travel_fee_minor?: number | null
  travelFeeMinor?: number | null
  kit_fee_minor?: number | null
  kitFeeMinor?: number | null
  rush_fee_minor?: number | null
  rushFeeMinor?: number | null
  custom_material_fee_minor?: number | null
  customMaterialFeeMinor?: number | null
  trainer_seniority_fee_minor?: number | null
  trainerSeniorityFeeMinor?: number | null
  commercial_discount_minor?: number | null
  commercialDiscountMinor?: number | null
  discount_reason?: string | null
  discountReason?: string | null
  notes?: string | null
}

export type TrainingHubPricingLine = {
  key: string
  label: string
  amount_minor: number
  direction: 'add' | 'subtract' | 'neutral'
  metadata?: JsonRecord
}

export type TrainingHubPricingPreview = {
  id?: string | null
  course_id: string
  course_ref: string
  course_title: string
  organization_id: string
  site_id: string | null
  participant_count: number
  starter_min_participants: number
  starter_max_participants: number
  billable_participant_count: number
  requested_hours: number
  min_hours: number
  max_hours: number
  city: string | null
  currency_code: string
  base_price_minor: number
  extra_participants_price_minor: number
  extra_hours_price_minor: number
  travel_fee_minor: number
  kit_fee_minor: number
  rush_fee_minor: number
  custom_material_fee_minor: number
  trainer_seniority_fee_minor: number
  discount_minor: number
  final_price_minor: number
  requires_custom_quote: boolean
  custom_quote_reasons: string[]
  warnings: string[]
  lines: TrainingHubPricingLine[]
  calculation_details: JsonRecord
  persisted: boolean
}

export type TrainingHubProposalCreateItem = {
  course_ref?: string
  courseRef?: string
  course_id?: string
  courseId?: string
  item_type?: string
  itemType?: string
  description?: string | null
  participant_count?: number
  participantCount?: number
  requested_hours?: number | null
  requestedHours?: number | null
  estimated_hours?: number | null
  estimatedHours?: number | null
  city?: string | null
  quantity?: number
  travel_fee_minor?: number | null
  travelFeeMinor?: number | null
  kit_fee_minor?: number | null
  kitFeeMinor?: number | null
  rush_fee_minor?: number | null
  rushFeeMinor?: number | null
  custom_material_fee_minor?: number | null
  customMaterialFeeMinor?: number | null
  trainer_seniority_fee_minor?: number | null
  trainerSeniorityFeeMinor?: number | null
  commercial_discount_minor?: number | null
  commercialDiscountMinor?: number | null
  discount_reason?: string | null
  discountReason?: string | null
  notes?: string | null
  metadata?: JsonRecord | null
}

export type TrainingHubProposalCreateRequest = {
  organization_id?: string
  organizationId?: string
  site_id?: string | null
  siteId?: string | null
  title?: string | null
  valid_until?: string | null
  validUntil?: string | null
  currency_code?: string | null
  currencyCode?: string | null
  payment_terms?: string | null
  paymentTerms?: string | null
  internal_notes?: string | null
  internalNotes?: string | null
  partner_notes?: string | null
  partnerNotes?: string | null
  items?: TrainingHubProposalCreateItem[]
  metadata?: JsonRecord | null
}

export type TrainingHubProposalSummary = {
  id: string
  proposal_number: string
  organization_id: string
  site_id: string | null
  status: string | null
  title: string | null
  currency_code: string | null
  subtotal_minor: number | null
  discount_total_minor: number | null
  tax_total_minor: number | null
  grand_total_minor: number | null
  valid_until?: string | null
  sent_at?: string | null
  accepted_at?: string | null
  converted_order_id?: string | null
  created_at?: string | null
  organization?: TrainingHubOrganization | null
}

export type TrainingHubProposalDetail = TrainingHubProposalSummary & {
  payment_terms?: string | null
  internal_notes?: string | null
  partner_notes?: string | null
  items: Array<JsonRecord>
  order?: JsonRecord | null
  invoice?: JsonRecord | null
}

export type TrainingHubSessionCreateRequest = {
  organization_id?: string
  organizationId?: string
  site_id?: string | null
  siteId?: string | null
  course_ref?: string
  courseRef?: string
  course_id?: string
  courseId?: string
  course_version_id?: string | null
  courseVersionId?: string | null
  order_item_id?: string | null
  orderItemId?: string | null
  status?: string | null
  delivery_mode?: string | null
  deliveryMode?: string | null
  city?: string | null
  location_address?: string | null
  locationAddress?: string | null
  planned_participant_count?: number | null
  plannedParticipantCount?: number | null
  planned_hours?: number | null
  plannedHours?: number | null
  hours_distribution_notes?: string | null
  hoursDistributionNotes?: string | null
  trainer_owner_id?: string | null
  trainerOwnerId?: string | null
  academy_owner_id?: string | null
  academyOwnerId?: string | null
  scheduled_start_at?: string | null
  scheduledStartAt?: string | null
  scheduled_end_at?: string | null
  scheduledEndAt?: string | null
  metadata?: JsonRecord | null
}

export type TrainingHubSessionStatusRequest = {
  status?: string
  note?: string | null
  metadata?: JsonRecord | null
}

export type TrainingHubSessionParticipantInput = {
  user_id?: string | null
  userId?: string | null
  full_name?: string | null
  fullName?: string | null
  email?: string | null
  phone?: string | null
  job_title?: string | null
  jobTitle?: string | null
  participant_type?: string | null
  participantType?: string | null
  metadata?: JsonRecord | null
}

export type TrainingHubSessionParticipantsRequest = {
  participants?: TrainingHubSessionParticipantInput[]
  participant?: TrainingHubSessionParticipantInput
}

export type TrainingHubAttendanceInput = {
  participant_id?: string
  participantId?: string
  session_date_id?: string | null
  sessionDateId?: string | null
  attendance_status?: string | null
  attendanceStatus?: string | null
  check_in_at?: string | null
  checkInAt?: string | null
  check_out_at?: string | null
  checkOutAt?: string | null
  signature_url?: string | null
  signatureUrl?: string | null
  metadata?: JsonRecord | null
}

export type TrainingHubAttendanceRequest = {
  records?: TrainingHubAttendanceInput[]
  record?: TrainingHubAttendanceInput
}

export type TrainingHubSessionCompleteRequest = {
  issue_certificates?: boolean
  issueCertificates?: boolean
  unlock_refresh?: boolean
  unlockRefresh?: boolean
  final_status?: string | null
  finalStatus?: string | null
  trainer_notes?: string | null
  trainerNotes?: string | null
  direction_feedback?: string | null
  directionFeedback?: string | null
  action_plan_7_days?: string | null
  actionPlan7Days?: string | null
  metadata?: JsonRecord | null
}

export type TrainingHubSessionSummary = {
  id: string
  organization_id: string
  site_id: string | null
  course_id: string
  course_version_id: string | null
  order_item_id: string | null
  session_code: string
  status: string | null
  delivery_mode: string | null
  city: string | null
  location_address: string | null
  planned_participant_count: number | null
  actual_participant_count: number | null
  planned_hours: number | null
  scheduled_start_at: string | null
  scheduled_end_at: string | null
  delivered_at: string | null
  closed_at: string | null
  created_at: string | null
  course?: TrainingHubCourse | null
  organization?: TrainingHubOrganization | null
}

export type TrainingHubSessionDetail = TrainingHubSessionSummary & {
  dates: JsonRecord[]
  trainers: JsonRecord[]
  participants: JsonRecord[]
  attendance: JsonRecord[]
  quizzes: JsonRecord[]
  checklists: JsonRecord[]
  resources: JsonRecord[]
  certificates: JsonRecord[]
  aftersales_reports: JsonRecord[]
}

import { createTrainingHubUserClient } from './supabase'
import type { JsonRecord } from './types'

export type TrainingHubCountMap = Record<string, number>

type SupabaseLike = Awaited<ReturnType<typeof createTrainingHubUserClient>> & { from: (table: string) => any }

function asArray<T = JsonRecord>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

export function formatTrainingHubMoney(amountMinor?: number | null, currency = 'MAD') {
  const value = Number(amountMinor || 0) / 100
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(value)} ${currency}`
}

async function countRows(client: SupabaseLike, table: string) {
  const { count, error } = await client.from(table).select('id', { count: 'exact', head: true })
  if (error) return 0
  return count || 0
}

async function selectRows<T = JsonRecord>(client: SupabaseLike, table: string, columns: string, options?: { limit?: number; orderBy?: string; ascending?: boolean }) {
  let query = client.from(table).select(columns)
  if (options?.orderBy) query = query.order(options.orderBy, { ascending: options.ascending ?? false })
  if (options?.limit) query = query.limit(options.limit)
  const { data, error } = await query
  if (error) return [] as T[]
  return asArray<T>(data)
}

export async function getTrainingHubDashboardData() {
  const supabase = (await createTrainingHubUserClient()) as SupabaseLike

  const [
    categories,
    courses,
    modules,
    resources,
    proposals,
    orders,
    invoices,
    sessions,
    participants,
    certificates,
    entitlements,
    aftersales,
  ] = await Promise.all([
    countRows(supabase, 'trn_categories'),
    countRows(supabase, 'trn_courses'),
    countRows(supabase, 'learn_modules'),
    countRows(supabase, 'trn_course_resources'),
    countRows(supabase, 'bill_proposals'),
    countRows(supabase, 'bill_orders'),
    countRows(supabase, 'bill_invoices'),
    countRows(supabase, 'trn_sessions'),
    countRows(supabase, 'trn_session_participants'),
    countRows(supabase, 'trn_certificates'),
    countRows(supabase, 'ent_organization_entitlements'),
    countRows(supabase, 'trn_aftersales_reports'),
  ])

  const recentCourses = await selectRows(supabase, 'trn_courses', 'id, ref, title, publication_status, status, onsite_entry_price_minor, refresh_entry_price_minor, currency_code, positioning_tags', {
    limit: 8,
    orderBy: 'ref',
    ascending: true,
  })
  const recentProposals = await selectRows(supabase, 'bill_proposals', 'id, proposal_number, title, status, grand_total_minor, currency_code, created_at', { limit: 6, orderBy: 'created_at' })
  const recentSessions = await selectRows(supabase, 'trn_sessions', 'id, session_code, status, delivery_mode, city, planned_participant_count, planned_hours, scheduled_start_at, created_at', { limit: 6, orderBy: 'created_at' })

  return {
    counts: { categories, courses, modules, resources, proposals, orders, invoices, sessions, participants, certificates, entitlements, aftersales },
    recentCourses,
    recentProposals,
    recentSessions,
  }
}

export async function getTrainingHubCatalogueUiData() {
  const supabase = (await createTrainingHubUserClient()) as SupabaseLike
  const categories = await selectRows(supabase, 'trn_categories', 'id, code, name, owner_promise, market_risk, status, display_order', { limit: 20, orderBy: 'code', ascending: true })
  const courses = await selectRows(supabase, 'trn_courses', 'id, category_id, ref, title, short_description, publication_status, status, onsite_entry_price_minor, refresh_entry_price_minor, currency_code, starter_min_participants, starter_max_participants, min_hours, max_hours, positioning_tags', { limit: 120, orderBy: 'ref', ascending: true })
  return { categories, courses }
}

export async function getTrainingHubCommercialUiData() {
  const supabase = (await createTrainingHubUserClient()) as SupabaseLike
  const proposals = await selectRows(supabase, 'bill_proposals', 'id, proposal_number, title, status, subtotal_minor, discount_total_minor, grand_total_minor, currency_code, valid_until, created_at', { limit: 30, orderBy: 'created_at' })
  const orders = await selectRows(supabase, 'bill_orders', 'id, order_number, status, grand_total_minor, currency_code, confirmed_at, created_at', { limit: 20, orderBy: 'created_at' })
  const invoices = await selectRows(supabase, 'bill_invoices', 'id, invoice_number, status, grand_total_minor, amount_paid_minor, amount_due_minor, currency_code, issue_date, due_date, created_at', { limit: 20, orderBy: 'created_at' })
  return { proposals, orders, invoices }
}

export async function getTrainingHubDeliveryUiData() {
  const supabase = (await createTrainingHubUserClient()) as SupabaseLike
  const sessions = await selectRows(supabase, 'trn_sessions', 'id, session_code, status, delivery_mode, city, location_address, planned_participant_count, actual_participant_count, planned_hours, scheduled_start_at, scheduled_end_at, delivered_at, created_at', { limit: 50, orderBy: 'created_at' })
  const participants = await selectRows(supabase, 'trn_session_participants', 'id, session_id, full_name, email, job_title, attendance_status, certificate_status, refresh_access_status, created_at', { limit: 30, orderBy: 'created_at' })
  return { sessions, participants }
}

export async function getTrainingHubLearningUiData() {
  const supabase = (await createTrainingHubUserClient()) as SupabaseLike
  const modules = await selectRows(supabase, 'learn_modules', 'id, module_code, title, module_type, estimated_minutes, status, created_at', { limit: 40, orderBy: 'module_code', ascending: true })
  const entitlements = await selectRows(supabase, 'learn_entitlements', 'id, organization_id, course_id, module_id, status, unlocked_at, valid_until, access_policy', { limit: 30, orderBy: 'unlocked_at' })
  const certificates = await selectRows(supabase, 'learn_certificates', 'id, certificate_number, status, issued_at, module_id, user_id', { limit: 20, orderBy: 'issued_at' })
  return { modules, entitlements, certificates }
}

export async function getTrainingHubResourcesUiData() {
  const supabase = (await createTrainingHubUserClient()) as SupabaseLike
  const resources = await selectRows(supabase, 'trn_course_resources', 'id, course_id, resource_title, resource_type, visibility_scope, requires_entitlement, status, created_at', { limit: 80, orderBy: 'created_at' })
  const kits = await selectRows(supabase, 'trn_course_kits', 'id, course_id, kit_item_name, kit_item_type, required, included_in_starter, status, display_order', { limit: 80, orderBy: 'display_order', ascending: true })
  return { resources, kits }
}

export async function getTrainingHubAccessUiData() {
  const supabase = (await createTrainingHubUserClient()) as SupabaseLike
  const organizations = await selectRows(supabase, 'core_organizations', 'id, name, organization_type, status, country_code, city, currency_code, created_at', { limit: 50, orderBy: 'created_at' })
  const roles = await selectRows(supabase, 'authz_roles', 'id, code, name, scope, status', { limit: 80, orderBy: 'code', ascending: true })
  const permissions = await selectRows(supabase, 'authz_permissions', 'id, code, module, action, risk_level', { limit: 120, orderBy: 'code', ascending: true })
  return { organizations, roles, permissions }
}

export async function getTrainingHubCommercialWorkspaceUiData() {
  const supabase = (await createTrainingHubUserClient()) as SupabaseLike

  const [organizations, courses, proposals, proposalItems, orders, invoices, pricingRules] = await Promise.all([
    selectRows(supabase, 'core_organizations', 'id, name, legal_name, organization_type, status, city, country_code, currency_code, created_at', { limit: 120, orderBy: 'created_at', ascending: false }),
    selectRows(supabase, 'trn_courses', 'id, category_id, ref, title, short_description, publication_status, status, onsite_entry_price_minor, refresh_entry_price_minor, currency_code, starter_min_participants, starter_max_participants, min_hours, max_hours, positioning_tags', { limit: 120, orderBy: 'ref', ascending: true }),
    selectRows(supabase, 'bill_proposals', 'id, organization_id, site_id, proposal_number, status, title, valid_until, currency_code, subtotal_minor, discount_total_minor, tax_total_minor, grand_total_minor, sent_at, accepted_at, converted_order_id, created_at', { limit: 80, orderBy: 'created_at', ascending: false }),
    selectRows(supabase, 'bill_proposal_items', 'id, proposal_id, course_id, item_type, description, participant_count, estimated_hours, unit_price_minor, quantity, discount_minor, line_total_minor, requires_custom_quote, created_at', { limit: 200, orderBy: 'created_at', ascending: false }),
    selectRows(supabase, 'bill_orders', 'id, organization_id, site_id, order_number, proposal_id, status, currency_code, subtotal_minor, discount_total_minor, tax_total_minor, grand_total_minor, confirmed_at, closed_at, created_at', { limit: 60, orderBy: 'created_at', ascending: false }),
    selectRows(supabase, 'bill_invoices', 'id, organization_id, invoice_number, order_id, status, currency_code, issue_date, due_date, subtotal_minor, discount_total_minor, tax_total_minor, grand_total_minor, amount_paid_minor, amount_due_minor, sent_at, paid_at, created_at', { limit: 60, orderBy: 'created_at', ascending: false }),
    selectRows(supabase, 'trn_pricing_rules', 'id, code, name, rule_type, scope, priority, status, valid_from, valid_until', { limit: 80, orderBy: 'priority', ascending: true }),
  ])

  return { organizations, courses, proposals, proposalItems, orders, invoices, pricingRules }
}

export async function getTrainingHubDeliveryWorkspaceUiData() {
  const supabase = (await createTrainingHubUserClient()) as SupabaseLike

  const [
    organizations,
    courses,
    sessions,
    participants,
    attendance,
    checklists,
    certificates,
    aftersalesReports,
    trainers,
    sessionTrainers,
    allocatedResources,
  ] = await Promise.all([
    selectRows(supabase, 'core_organizations', 'id, name, legal_name, organization_type, status, city, country_code, currency_code, created_at', { limit: 120, orderBy: 'created_at', ascending: false }),
    selectRows(supabase, 'trn_courses', 'id, category_id, ref, title, short_description, onsite_entry_price_minor, refresh_entry_price_minor, currency_code, starter_min_participants, starter_max_participants, min_hours, max_hours, positioning_tags, status, publication_status', { limit: 120, orderBy: 'ref', ascending: true }),
    selectRows(supabase, 'trn_sessions', 'id, organization_id, site_id, course_id, course_version_id, order_item_id, session_code, status, delivery_mode, city, location_address, participant_min, participant_max, planned_participant_count, actual_participant_count, planned_hours, hours_distribution_notes, trainer_owner_id, academy_owner_id, scheduled_start_at, scheduled_end_at, delivered_at, closed_at, created_at, updated_at, metadata', { limit: 160, orderBy: 'created_at', ascending: false }),
    selectRows(supabase, 'trn_session_participants', 'id, session_id, organization_id, site_id, user_id, full_name, email, phone, job_title, participant_type, attendance_status, quiz_pre_score, quiz_post_score, certificate_status, refresh_access_status, created_at', { limit: 500, orderBy: 'created_at', ascending: false }),
    selectRows(supabase, 'trn_attendance_records', 'id, session_id, participant_id, session_date_id, check_in_at, check_out_at, attendance_status, signature_url, validated_by, validated_at, created_at', { limit: 500, orderBy: 'created_at', ascending: false }),
    selectRows(supabase, 'trn_delivery_checklists', 'id, session_id, checklist_type, item_label, required, completed, completed_by, completed_at, evidence_url, created_at', { limit: 600, orderBy: 'checklist_type', ascending: true }),
    selectRows(supabase, 'trn_certificates', 'id, organization_id, session_id, participant_id, course_id, certificate_number, certificate_url, issued_at, issued_by, status, revoked_at, revoked_reason, created_at', { limit: 500, orderBy: 'issued_at', ascending: false }),
    selectRows(supabase, 'trn_aftersales_reports', 'id, organization_id, session_id, report_number, satisfaction_score, trainer_notes, direction_feedback, observed_impact, remaining_blockers, upsell_opportunity, action_plan_7_days, status, completed_by, completed_at, created_at', { limit: 200, orderBy: 'created_at', ascending: false }),
    selectRows(supabase, 'trn_trainers', 'id, user_id, trainer_type, specialties, languages, city, country_code, status, created_at', { limit: 120, orderBy: 'created_at', ascending: false }),
    selectRows(supabase, 'trn_session_trainers', 'id, session_id, trainer_id, role, assigned_at, status, created_at', { limit: 400, orderBy: 'assigned_at', ascending: false }),
    selectRows(supabase, 'trn_session_resources_allocated', 'id, session_id, resource_id, participant_id, allocated_quantity, delivery_status, delivered_at, created_at', { limit: 500, orderBy: 'created_at', ascending: false }),
  ])

  return { organizations, courses, sessions, participants, attendance, checklists, certificates, aftersalesReports, trainers, sessionTrainers, allocatedResources }
}

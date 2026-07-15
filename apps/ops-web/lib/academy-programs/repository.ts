import { createClient } from '@/lib/supabase/server'
import type { AcademyProgramPayload, AcademyProgramRecord, AcademyProgramsDashboard } from './types'

function safeUuid(value: unknown) {
  const text = String(value || '').trim()
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text) ? text : null
}

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function cleanUrl(value: unknown) {
  return String(value || '').trim()
}

function generateReference() {
  const now = new Date()
  return `PRG-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`
}

function normalizePayload(input: AcademyProgramPayload) {
  const durationDays = Math.max(0, toNumber(input.duration_days))
  const hoursPerDay = Math.max(0, toNumber(input.hours_per_day))
  const base = Math.max(0, toNumber(input.base_price_dhs))
  const totalHours = Math.max(0, toNumber(input.total_hours || durationDays * hoursPerDay))
  return {
    reference_number: input.reference_number || generateReference(),
    title: String(input.title || '').trim(),
    program_name: String(input.title || '').trim(),
    category: input.category || null,
    level: input.level || null,
    delivery_format: input.delivery_format || null,
    status: input.status || 'planning',
    target_audience: input.target_audience || null,
    description: input.description || null,
    intake_start: input.intake_start || null,
    intake_end: input.intake_end || null,
    duration_days: durationDays,
    hours_per_day: hoursPerDay,
    total_hours: totalHours,
    base_price_dhs: base,
    currency: input.currency || 'Dhs',
    visibility: input.visibility || 'internal',
    enrollment_cap: Math.max(0, toNumber(input.enrollment_cap)),
    readiness_score: Math.max(0, Math.min(100, toNumber(input.readiness_score, 0))),
    parameters: input.parameters || {},
    outcomes: input.outcomes || {},
  }
}

function normalizeProgram(row: any, related: { trainers: any[]; links: any[]; prices: any[]; addons: any[] }): AcademyProgramRecord {
  return {
    id: row.id,
    reference_number: row.reference_number,
    title: row.title || row.program_name || row.name || '',
    category: row.category,
    level: row.level,
    delivery_format: row.delivery_format,
    status: row.status,
    target_audience: row.target_audience,
    description: row.description,
    intake_start: row.intake_start,
    intake_end: row.intake_end,
    duration_days: toNumber(row.duration_days),
    hours_per_day: toNumber(row.hours_per_day),
    total_hours: toNumber(row.total_hours),
    base_price_dhs: toNumber(row.base_price_dhs),
    currency: row.currency || 'Dhs',
    visibility: row.visibility,
    enrollment_cap: toNumber(row.enrollment_cap),
    readiness_score: toNumber(row.readiness_score),
    parameters: row.parameters || {},
    outcomes: row.outcomes || {},
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by,
    updated_by: row.updated_by,
    trainers: related.trainers.filter((x) => String(x.program_id) === String(row.id)).map((x) => ({ id: x.id, trainer_id: x.trainer_id, trainer_name: x.trainer_name, role: x.role, specialty: x.specialty, sort_order: x.sort_order })),
    library_links: related.links.filter((x) => String(x.program_id) === String(row.id)).map((x) => ({ id: x.id, category: x.category, label: x.label, url: x.url, sort_order: x.sort_order })),
    pricing_rows: related.prices.filter((x) => String(x.program_id) === String(row.id)).map((x) => ({ id: x.id, label: x.label, billing_type: x.billing_type, amount_dhs: toNumber(x.amount_dhs), tax_rate: toNumber(x.tax_rate, 0), applies_to: x.applies_to, sort_order: x.sort_order })),
    addons: related.addons.filter((x) => String(x.program_id) === String(row.id)).map((x) => ({ id: x.id, label: x.label, addon_type: x.addon_type, amount_dhs: toNumber(x.amount_dhs), optional_required: x.optional_required || 'optional', sort_order: x.sort_order })),
  }
}

async function replaceChildren(supabase: any, programId: string | number, input: AcademyProgramPayload) {
  await Promise.all([
    supabase.from('academy_program_trainers').delete().eq('program_id', programId),
    supabase.from('academy_program_library_links').delete().eq('program_id', programId),
    supabase.from('academy_program_pricing_rows').delete().eq('program_id', programId),
    supabase.from('academy_program_addons').delete().eq('program_id', programId),
  ])

  const trainers = (input.trainers || []).filter((x) => x.trainer_name || x.trainer_id).map((x, i) => ({
    program_id: programId,
    trainer_id: x.trainer_id ? String(x.trainer_id) : null,
    trainer_name: x.trainer_name || 'Registered trainer',
    role: x.role || 'Trainer',
    specialty: x.specialty || null,
    sort_order: i,
  }))
  const links = (input.library_links || []).filter((x) => cleanUrl(x.url)).map((x, i) => ({
    program_id: programId,
    category: x.category,
    label: x.label || `Resource ${i + 1}`,
    url: cleanUrl(x.url),
    sort_order: i,
  }))
  const prices = (input.pricing_rows || []).filter((x) => x.label || Number(x.amount_dhs)).map((x, i) => ({
    program_id: programId,
    label: x.label || `Price row ${i + 1}`,
    billing_type: x.billing_type || 'per_seat',
    amount_dhs: toNumber(x.amount_dhs),
    tax_rate: 0,
    applies_to: x.applies_to || 'All participants',
    sort_order: i,
  }))
  const addons = (input.addons || []).filter((x) => x.label || Number(x.amount_dhs)).map((x, i) => ({
    program_id: programId,
    label: x.label || `Add-on ${i + 1}`,
    addon_type: x.addon_type || 'service',
    amount_dhs: toNumber(x.amount_dhs),
    optional_required: x.optional_required || 'optional',
    sort_order: i,
  }))

  const writes = []
  if (trainers.length) writes.push(supabase.from('academy_program_trainers').insert(trainers))
  if (links.length) writes.push(supabase.from('academy_program_library_links').insert(links))
  if (prices.length) writes.push(supabase.from('academy_program_pricing_rows').insert(prices))
  if (addons.length) writes.push(supabase.from('academy_program_addons').insert(addons))
  const results = await Promise.all(writes)
  const error = results.find((x: any) => x.error)?.error
  if (error) throw new Error(error.message)
}

export async function getAcademyProgramsDashboard(): Promise<AcademyProgramsDashboard> {
  const supabase = await createClient()
  const [programs, trainers, children] = await Promise.all([
    supabase.from('academy_programs').select('*').order('updated_at', { ascending: false }).limit(250),
    supabase.from('academy_trainers').select('id,full_name,specialty,status').order('full_name', { ascending: true }).limit(500),
    Promise.all([
      supabase.from('academy_program_trainers').select('*').order('sort_order', { ascending: true }),
      supabase.from('academy_program_library_links').select('*').order('sort_order', { ascending: true }),
      supabase.from('academy_program_pricing_rows').select('*').order('sort_order', { ascending: true }),
      supabase.from('academy_program_addons').select('*').order('sort_order', { ascending: true }),
    ]),
  ])
  if (programs.error) throw new Error(programs.error.message)
  const [trainerRows, linkRows, priceRows, addonRows] = children.map((x: any) => x.data || [])
  const normalized = (programs.data || []).map((row: any) => normalizeProgram(row, { trainers: trainerRows, links: linkRows, prices: priceRows, addons: addonRows }))
  return {
    programs: normalized,
    trainers: trainers.data || [],
    stats: {
      totalPrograms: normalized.length,
      activePrograms: normalized.filter((x) => x.status === 'active').length,
      planningPrograms: normalized.filter((x) => x.status === 'planning').length,
      totalBaseValue: normalized.reduce((sum, x) => sum + toNumber(x.base_price_dhs), 0),
    },
  }
}

export async function getAcademyProgramById(id: string): Promise<AcademyProgramRecord | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('academy_programs').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const [trainers, links, prices, addons] = await Promise.all([
    supabase.from('academy_program_trainers').select('*').eq('program_id', id).order('sort_order', { ascending: true }),
    supabase.from('academy_program_library_links').select('*').eq('program_id', id).order('sort_order', { ascending: true }),
    supabase.from('academy_program_pricing_rows').select('*').eq('program_id', id).order('sort_order', { ascending: true }),
    supabase.from('academy_program_addons').select('*').eq('program_id', id).order('sort_order', { ascending: true }),
  ])
  return normalizeProgram(data, { trainers: trainers.data || [], links: links.data || [], prices: prices.data || [], addons: addons.data || [] })
}

export async function createAcademyProgram(input: AcademyProgramPayload, userId?: string | null) {
  const supabase = await createClient()
  const actorId = safeUuid(userId)
  const payload = { ...normalizePayload(input), created_by: actorId, updated_by: actorId, updated_at: new Date().toISOString() }
  if (!payload.title) throw new Error('Program name is required')
  const { data, error } = await supabase.from('academy_programs').insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  await replaceChildren(supabase, data.id, input)
  return getAcademyProgramById(data.id)
}

export async function updateAcademyProgram(id: string, input: AcademyProgramPayload, userId?: string | null) {
  const supabase = await createClient()
  const payload = { ...normalizePayload(input), updated_by: safeUuid(userId), updated_at: new Date().toISOString() }
  const { error } = await supabase.from('academy_programs').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  await replaceChildren(supabase, id, input)
  return getAcademyProgramById(id)
}

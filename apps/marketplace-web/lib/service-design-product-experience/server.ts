import 'server-only'

import { getCurrentAppUser } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export type ProductExperienceActor = Record<string, unknown>

export async function requireProductExperienceActor() {
  const actor = await getCurrentAppUser()
  if (!actor) throw Object.assign(new Error('Authentification ANGELCARE requise.'), { status: 401 })
  return actor as ProductExperienceActor
}

export async function productExperienceClient(): Promise<SupabaseClient> {
  return createServiceClient()
}

export function actorId(actor: ProductExperienceActor) {
  const value = actor.id || actor.user_id || actor.email
  if (!value) throw Object.assign(new Error('Identité utilisateur introuvable.'), { status: 401 })
  return String(value)
}

export function actorLabel(actor: ProductExperienceActor) {
  return String(actor.full_name || actor.name || actor.email || actorId(actor))
}

export function tenantId(actor: ProductExperienceActor) {
  return String(actor.tenant_id || actor.tenantId || 'angelcare-main')
}

export function apiError(error: unknown) {
  const status = Number((error as { status?: number })?.status || 500)
  return { status, message: error instanceof Error ? error.message : 'Erreur Service Design inattendue.' }
}

export function safeText(value: unknown, max = 400) {
  return String(value ?? '').trim().slice(0, max)
}

export function safeJson(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

export function safeArray(value: unknown): unknown[] { return Array.isArray(value) ? value : [] }

export async function insertRecent(client: SupabaseClient, actor: ProductExperienceActor, input: { entityType: string; entityId: string; label: string; href: string; metadata?: Record<string, unknown> }) {
  const row = { tenant_id: tenantId(actor), user_id: actorId(actor), entity_type: safeText(input.entityType, 80), entity_id: safeText(input.entityId, 180), label: safeText(input.label, 240), href: safeText(input.href, 500), metadata: input.metadata || {}, last_opened_at: new Date().toISOString() }
  const result = await client.from('hsd_px_recent_items').upsert(row, { onConflict: 'tenant_id,user_id,entity_type,entity_id' }).select('*').single()
  if (result.error) throw result.error
  return result.data
}

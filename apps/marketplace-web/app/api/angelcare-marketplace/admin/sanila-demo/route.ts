/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { createServiceClient } from '@/lib/supabase/server'
import { generateDemoPin, hashDemoPin, getMasterDemoConfig, recordDemoEvent } from '@/lib/sanila-demo/authority'
import { pinLookupDigest } from '@/lib/sanila-demo/security'
import { grantIsUsable, nextGrantApprovalStatus, nextGrantRegenerationState, policyExpiry } from '@/lib/sanila-demo/policy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const context = await requireMarketplaceApiContext('marketplace.public.inquiries.manage')
    const config = await getMasterDemoConfig()
    if (!config) return NextResponse.json({ ok: true, config: null, grants: [] })
    const db = await createServiceClient()
    const { data: grants, error } = await db.from('sanila_demo_access_grants').select('id,config_id,public_inquiry_id,requester_name,requester_email,requester_phone,approval_state,policy_type,max_uses,activation_duration_minutes,absolute_expires_at,status,pin_last4,used_count,activated_at,effective_expires_at,last_access_at,notes,created_at,updated_at').eq('config_id', config.id).order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ ok: true, config, grants, actor: context.actor.id })
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Accès refusé.' }, { status: 403 }) }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireMarketplaceApiContext('marketplace.public.inquiries.manage')
    const body = await request.json() as Record<string, any>
    const config = await getMasterDemoConfig()
    if (!config) return NextResponse.json({ ok: false, error: 'Le Master Demo doit être provisionné avant émission.' }, { status: 409 })
    const db = await createServiceClient()
    if (body.action === 'approve' || body.action === 'reject' || body.action === 'needs_info' || body.action === 'under_review') {
      const state = body.action === 'approve' ? 'approved' : body.action
      const current = await db.from('sanila_demo_access_grants').select('*').eq('id', body.grantId).eq('config_id', config.id).maybeSingle()
      if (!current.data) return NextResponse.json({ ok: false, error: 'Grant introuvable.' }, { status: 404 })
      const { data, error } = await db.from('sanila_demo_access_grants').update({ approval_state: state, status: nextGrantApprovalStatus(current.data, state), updated_at: new Date().toISOString() }).eq('id', body.grantId).eq('config_id', config.id).select('*').single()
      if (error) throw error
      await recordDemoEvent({ configId: config.id, grantId: body.grantId, actorUserId: context.actor.id, eventType: 'approval_changed', metadata: { state } })
      return NextResponse.json({ ok: true, grant: data })
    }
    if (body.action === 'create_grant') {
      const inquiryId = String(body.publicInquiryId || '')
      const inquiry = await db.from('angelcare_marketplace_public_inquiries').select('id,full_name,email,phone').eq('id', inquiryId).maybeSingle()
      if (!inquiry.data) return NextResponse.json({ ok: false, error: 'Demande introuvable.' }, { status: 404 })
      const pin = generateDemoPin()
      const policyType = ['single_use','n_uses','unlimited'].includes(body.policyType) ? body.policyType : 'single_use'
      const absoluteExpiry = body.absoluteExpiresAt ? new Date(String(body.absoluteExpiresAt)) : null
      if (absoluteExpiry && (!Number.isFinite(absoluteExpiry.getTime()) || absoluteExpiry <= new Date())) return NextResponse.json({ ok: false, error: 'L’expiration fixe doit être une date future valide.' }, { status: 422 })
      const payload = { config_id: config.id, public_inquiry_id: inquiryId, requester_name: inquiry.data.full_name, requester_email: inquiry.data.email || null, requester_phone: inquiry.data.phone || null, issuer_user_id: context.actor.id, approval_state: 'not_reviewed', policy_type: policyType, max_uses: policyType === 'n_uses' ? Math.min(100, Math.max(1, Number(body.maxUses || 1))) : policyType === 'single_use' ? 1 : null, activation_duration_minutes: body.activationDurationMinutes ? Math.min(43200, Math.max(1, Number(body.activationDurationMinutes))) : null, absolute_expires_at: absoluteExpiry?.toISOString() || null, status: 'draft', pin_hash: await hashDemoPin(pin), pin_lookup_digest: pinLookupDigest(pin), pin_last4: pin.slice(-4), notes: String(body.notes || '').slice(0, 1000) || null }
      const { data, error } = await db.from('sanila_demo_access_grants').insert(payload).select('id,requester_name,requester_email,approval_state,policy_type,max_uses,activation_duration_minutes,absolute_expires_at,status,pin_last4,used_count,created_at').single()
      if (error) throw error
      await recordDemoEvent({ configId: config.id, grantId: data.id, inquiryId, actorUserId: context.actor.id, eventType: 'grant_created', metadata: { policy_type: policyType } })
      return NextResponse.json({ ok: true, grant: data, pin }, { status: 201 })
    }
    const lifecycle: Record<string, string> = { suspend: 'suspended', reactivate: 'ready', revoke: 'revoked' }
    if (body.action === 'regenerate_pin') {
      const current = await db.from('sanila_demo_access_grants').select('*').eq('id', body.grantId).eq('config_id', config.id).neq('status', 'revoked').maybeSingle()
      if (!current.data) return NextResponse.json({ ok: false, error: 'Grant introuvable ou révoqué.' }, { status: 404 })
      const pin = generateDemoPin()
      const { data, error } = await db.from('sanila_demo_access_grants').update({ pin_hash: await hashDemoPin(pin), pin_lookup_digest: pinLookupDigest(pin), pin_last4: pin.slice(-4), failed_attempts: 0, locked_until: null, ...nextGrantRegenerationState(current.data), updated_at: new Date().toISOString() }).eq('id', body.grantId).eq('config_id', config.id).neq('status', 'revoked').select('*').single()
      if (error) throw error
      await db.from('sanila_demo_sessions').update({ revoked_at: new Date().toISOString() }).eq('grant_id', body.grantId).is('revoked_at', null)
      await recordDemoEvent({ configId: config.id, grantId: body.grantId, actorUserId: context.actor.id, eventType: 'grant_pin_regenerated', severity: 'warning' })
      return NextResponse.json({ ok: true, grant: data, pin })
    }
    if (body.action === 'extend') {
      const absoluteExpiresAt = new Date(String(body.absoluteExpiresAt || ''))
      if (!Number.isFinite(absoluteExpiresAt.getTime()) || absoluteExpiresAt <= new Date()) return NextResponse.json({ ok: false, error: 'Une nouvelle échéance future est requise.' }, { status: 422 })
      const current = await db.from('sanila_demo_access_grants').select('*').eq('id', body.grantId).eq('config_id', config.id).neq('status', 'revoked').maybeSingle()
      if (!current.data) return NextResponse.json({ ok: false, error: 'Grant introuvable ou révoqué.' }, { status: 404 })
      const effectiveExpiresAt = current.data.activated_at ? policyExpiry({ ...current.data, absolute_expires_at: absoluteExpiresAt.toISOString() })?.toISOString() : null
      const { data, error } = await db.from('sanila_demo_access_grants').update({ absolute_expires_at: absoluteExpiresAt.toISOString(), effective_expires_at: effectiveExpiresAt, updated_at: new Date().toISOString() }).eq('id', current.data.id).select('*').single()
      if (error) throw error
      await recordDemoEvent({ configId: config.id, grantId: data.id, inquiryId: data.public_inquiry_id, actorUserId: context.actor.id, eventType: 'grant_extended', severity: 'notice', metadata: { absolute_expires_at: absoluteExpiresAt.toISOString(), effective_expires_at: effectiveExpiresAt } })
      return NextResponse.json({ ok: true, grant: data })
    }
    const nextStatus = lifecycle[String(body.action || '')]
    if (!nextStatus) return NextResponse.json({ ok: false, error: 'Action de grant inconnue.' }, { status: 400 })
    const current = await db.from('sanila_demo_access_grants').select('*').eq('id', body.grantId).eq('config_id', config.id).maybeSingle()
    if (!current.data) return NextResponse.json({ ok: false, error: 'Grant introuvable.' }, { status: 404 })
    if (body.action === 'reactivate' && (!grantIsUsable({ ...current.data, status: 'ready', suspended_at: null }) || current.data.approval_state !== 'approved')) return NextResponse.json({ ok: false, error: 'Ce grant est expiré, épuisé, révoqué ou non approuvé.' }, { status: 409 })
    const patch = { status: nextStatus, suspended_at: nextStatus === 'suspended' ? new Date().toISOString() : null, revoked_at: nextStatus === 'revoked' ? new Date().toISOString() : null, updated_at: new Date().toISOString() }
    const { data, error } = await db.from('sanila_demo_access_grants').update(patch).eq('id', body.grantId).eq('config_id', config.id).select('*').single()
    if (error) throw error
    if (nextStatus === 'revoked') await db.from('sanila_demo_sessions').update({ revoked_at: new Date().toISOString() }).eq('grant_id', body.grantId).is('revoked_at', null)
    await recordDemoEvent({ configId: config.id, grantId: body.grantId, actorUserId: context.actor.id, eventType: `grant_${nextStatus}`, severity: nextStatus === 'revoked' ? 'warning' : 'notice' })
    return NextResponse.json({ ok: true, grant: data })
  } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Action impossible.' }, { status: 400 }) }
}

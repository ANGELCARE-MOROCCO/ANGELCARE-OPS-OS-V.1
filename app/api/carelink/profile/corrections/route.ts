import { NextResponse } from 'next/server'
import { createNotification } from '@/lib/carelink/mobile-persistence'
import { carelinkMobileErrorResponse, requireCareLinkMobileAgent } from '@/lib/carelink/mobile-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await requireCareLinkMobileAgent('can_view_missions', request)
    const { data, error } = await session.supabase
      .from('carelink_agent_profile_requests')
      .select('*')
      .eq('caregiver_id', session.caregiverId)
      .order('created_at', { ascending: false })
      .limit(80)
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Unable to load CareLink profile correction requests')
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireCareLinkMobileAgent('can_view_missions', request)
    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const message = String(body.message || body.note || '').trim()
    if (!message) return NextResponse.json({ ok: false, error: 'Correction request message is required.' }, { status: 400 })

    const payload = {
      caregiver_id: session.caregiverId,
      auth_user_id: String(session.user.id || ''),
      request_type: String(body.requestType || body.request_type || 'profile_correction'),
      message,
      requested_changes: body.requestedChanges && typeof body.requestedChanges === 'object' ? body.requestedChanges : {},
      status: 'pending_ops_review',
      source: 'carelink_mobile',
      metadata: { source: body.source || 'carelink_mobile_enterprise_profile' },
    }

    const { data, error } = await session.supabase
      .from('carelink_agent_profile_requests')
      .insert([payload])
      .select('*')
      .maybeSingle()
    if (error) throw new Error(error.message)

    await createNotification({
      type: 'agent_profile_correction_request',
      title: 'Correction profil agent demandée',
      body: message,
      priority: 'high',
      caregiverId: session.caregiverId,
      linkedEntityType: 'caregiver',
      linkedEntityId: String(session.caregiverId),
      metadata: { request_id: data?.id || null, request_type: payload.request_type },
    }).catch(() => null)

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'CareLink profile correction request failed')
  }
}

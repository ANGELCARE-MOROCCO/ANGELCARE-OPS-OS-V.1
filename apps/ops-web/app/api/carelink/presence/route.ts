import { NextResponse } from 'next/server'
import { carelinkMobileErrorResponse, requireCareLinkMobileAgent } from '@/lib/carelink/mobile-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await requireCareLinkMobileAgent('can_view_missions', request)
    const { data, error } = await session.supabase
      .from('carelink_agent_presence_events')
      .select('*')
      .eq('caregiver_id', session.caregiverId)
      .order('created_at', { ascending: false })
      .limit(80)
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Unable to load CareLink presence events')
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireCareLinkMobileAgent('can_view_missions', request)
    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const eventType = String(body.eventType || body.event_type || 'presence_update').trim()
    const payload = {
      caregiver_id: session.caregiverId,
      auth_user_id: String(session.user.id || ''),
      event_type: eventType,
      mission_id: body.missionId ? Number(body.missionId) : null,
      note: String(body.note || ''),
      device_fingerprint: session.deviceContext?.deviceFingerprint || null,
      source: 'carelink_mobile',
      metadata: { source: body.source || 'carelink_mobile_presence', device: session.deviceContext || null },
    }

    const { data, error } = await session.supabase
      .from('carelink_agent_presence_events')
      .insert([payload])
      .select('*')
      .maybeSingle()
    if (error) throw new Error(error.message)

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'CareLink presence update failed')
  }
}

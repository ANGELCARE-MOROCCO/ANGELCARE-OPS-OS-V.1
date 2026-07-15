import { NextResponse } from 'next/server'
import { carelinkMobileErrorResponse, requireCareLinkMobileAgent } from '@/lib/carelink/mobile-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await requireCareLinkMobileAgent('can_view_missions', request)
    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const policyKey = String(body.policyKey || body.policy_key || '').trim()
    if (!policyKey) return NextResponse.json({ ok: false, error: 'Policy key is required.' }, { status: 400 })

    const payload = {
      caregiver_id: session.caregiverId,
      auth_user_id: String(session.user.id || ''),
      policy_key: policyKey,
      policy_version: String(body.version || body.policyVersion || '2026.06'),
      acknowledged_at: new Date().toISOString(),
      status: 'acknowledged',
      metadata: { source: body.source || 'carelink_mobile_policy_center' },
    }

    const { data, error } = await session.supabase
      .from('carelink_agent_policy_acknowledgements')
      .upsert([payload], { onConflict: 'caregiver_id,policy_key,policy_version' })
      .select('*')
      .maybeSingle()
    if (error) throw new Error(error.message)

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'CareLink policy acknowledgement failed')
  }
}

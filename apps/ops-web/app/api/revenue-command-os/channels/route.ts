import { NextResponse } from 'next/server'
import { hasRevenueOsPermission, resolveRevenueOsActor } from '@/lib/revenue-command-os/access'
import { loadRevenueOsChannelPolicies, updateRevenueOsWhatsappPolicy } from '@/lib/revenue-command-os/execution-autopilot/channel-policy'
import { normalizeRevenueOsError } from '@/lib/revenue-command-os/errors'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function errorResponse(error: unknown) {
  const normalized = normalizeRevenueOsError(error)
  return NextResponse.json({ ok: false, error: { code: normalized.code, message: normalized.message } }, { status: normalized.status })
}

export async function GET() {
  try {
    const actor = await resolveRevenueOsActor('revenue_os.view', { aliases: ['revenue.view'] })
    const channels = await loadRevenueOsChannelPolicies(actor.tenantId)
    return NextResponse.json({ ok: true, data: channels }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const actor = await resolveRevenueOsActor('revenue_os.view', { aliases: ['revenue.view'] })
    if (!hasRevenueOsPermission(actor, 'revenue_os.channels.manage', ['revenue_os.manage'])) {
      return NextResponse.json({ ok: false, error: { code: 'FORBIDDEN', message: 'Autorité de gestion des canaux Revenue OS requise.' } }, { status: 403 })
    }
    const body = await request.json().catch(() => ({}))
    if (body?.channel !== 'whatsapp' || typeof body?.enabled !== 'boolean') {
      return NextResponse.json({ ok: false, error: { code: 'INVALID_INPUT', message: 'Seul le canal WhatsApp peut être activé ou désactivé depuis cette surface.' } }, { status: 400 })
    }
    const channels = await updateRevenueOsWhatsappPolicy({
      tenantId: actor.tenantId,
      enabled: body.enabled,
      actorId: actor.id,
      actorLabel: actor.displayName,
    })
    return NextResponse.json({ ok: true, data: channels })
  } catch (error) {
    return errorResponse(error)
  }
}

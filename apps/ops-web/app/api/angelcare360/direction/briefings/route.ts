import { NextRequest, NextResponse } from 'next/server'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import { generateDirectionBriefing } from '@/lib/angelcare360/server/direction-command'
import type { DirectionBriefing } from '@/types/angelcare360/direction-command'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      briefingType?: DirectionBriefing['briefingType']
      siteId?: string | null
      idempotencyKey?: string | null
    }
    return NextResponse.json(await generateDirectionBriefing({
      briefingType: body.briefingType || 'morning',
      siteId: body.siteId || null,
      idempotencyKey: body.idempotencyKey || null,
    }))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Échec de génération du briefing.'
    const status = error instanceof Angelcare360AccessError ? error.status : 400
    return NextResponse.json({ ok: false, message }, { status })
  }
}

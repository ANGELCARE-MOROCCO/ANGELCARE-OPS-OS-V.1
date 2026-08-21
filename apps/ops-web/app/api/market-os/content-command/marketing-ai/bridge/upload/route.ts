import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { storeMarketingAiBridgeBytes } from '@/lib/market-os/marketing-ai/bridge'

async function POST__angelcareGovernedImpl(request: Request) {
  try {
    const actor = await requireMarketingAiUser('manage')
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return NextResponse.json({ ok: false, error: 'FILE_REQUIRED' }, { status: 400 })
    const classificationText = String(form.get('classification') || '{}')
    let classification: Record<string, unknown> = {}
    try { classification = JSON.parse(classificationText) as Record<string, unknown> } catch { return NextResponse.json({ ok: false, error: 'INVALID_CLASSIFICATION_JSON' }, { status: 400 }) }
    const object = await storeMarketingAiBridgeBytes({
      actorId: actor.id,
      entityType: String(form.get('entityType') || 'marketing_ai_asset'),
      contentId: String(form.get('contentId') || '') || null,
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      bytes: new Uint8Array(await file.arrayBuffer()),
      classification,
    })
    return NextResponse.json({ ok: true, object })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export const POST = governRoute(
  {
    workloadClass: 'ai',
    operation: 'POST:/api/market-os/content-command/marketing-ai/bridge/upload',
  },
  POST__angelcareGovernedImpl,
)

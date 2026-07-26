import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { updateMarketingAiCommand } from '@/lib/market-os/marketing-ai/repository'
import { commandPatchSchema } from '@/lib/market-os/marketing-ai/schemas'

export async function PATCH(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const actor = await requireMarketingAiUser('manage')
    const { code } = await context.params
    const body = commandPatchSchema.parse(await request.json())
    const command = await updateMarketingAiCommand(decodeURIComponent(code), body, actor.id)
    return NextResponse.json({ ok: true, command })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

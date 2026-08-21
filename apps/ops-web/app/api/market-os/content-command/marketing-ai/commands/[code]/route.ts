import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { updateMarketingAiCommand } from '@/lib/market-os/marketing-ai/repository'
import { commandPatchSchema } from '@/lib/market-os/marketing-ai/schemas'

async function PATCH__angelcareGovernedImpl(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const raw = await request.json()
    const body = commandPatchSchema.parse(raw)
    const materialGovernance = ['authorityMode', 'riskLevel', 'instruction', 'status', 'deployed'].some((key) => Object.prototype.hasOwnProperty.call(body, key))
    const actor = await requireMarketingAiUser(materialGovernance ? 'govern' : 'manage')
    const { code } = await context.params
    const command = await updateMarketingAiCommand(decodeURIComponent(code), body, actor.id)
    return NextResponse.json({ ok: true, command })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export const PATCH = governRoute(
  {
    workloadClass: 'ai',
    operation: 'PATCH:/api/market-os/content-command/marketing-ai/commands/[code]',
  },
  PATCH__angelcareGovernedImpl,
)

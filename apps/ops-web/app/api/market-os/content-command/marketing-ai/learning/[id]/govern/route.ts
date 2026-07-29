import { z } from 'zod'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { governLearningEvent } from '@/lib/market-os/marketing-ai/repository'

const schema = z.object({
  status: z.enum(['under_review','accepted','accepted_with_limitations','rejected','retired','superseded']),
  reason: z.string().trim().min(8).max(3000),
})

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireMarketingAiUser('govern')
    const { id } = await context.params
    const body = schema.parse(await request.json())
    const event = await governLearningEvent({ id, ...body, actorId: actor.id, actorName: actor.name })
    return Response.json({ ok: true, event, doctrinePromoted: false })
  } catch (error) { return apiErrorResponse(error) }
}

import { carelinkJson, recordMissionAction } from '@/lib/carelink/server'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> | { id: string } }

export async function POST(request: Request, context: Ctx) {
  const { id } = await context.params
  const body = await request.json().catch(() => ({}))
  const result = await recordMissionAction(id, 'decline', body && typeof body === 'object' ? body : {})
  return carelinkJson({ ok: true, missionId: id, action: 'decline', ...result, timestamp: new Date().toISOString() })
}

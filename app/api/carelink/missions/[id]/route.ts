import { carelinkJson, loadCarelinkMission } from '@/lib/carelink/server'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> | { id: string } }

export async function GET(_request: Request, context: Ctx) {
  const { id } = await context.params
  const { source, data } = await loadCarelinkMission(id)
  if (!data) return carelinkJson({ ok: false, error: 'Mission not found' }, { status: 404 })
  return carelinkJson({ ok: true, source, mission: data })
}

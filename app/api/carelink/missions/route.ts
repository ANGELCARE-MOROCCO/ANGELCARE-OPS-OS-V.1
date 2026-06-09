import { carelinkJson, loadCarelinkMissions } from '@/lib/carelink/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { source, data } = await loadCarelinkMissions()
  return carelinkJson({ ok: true, source, missions: data })
}

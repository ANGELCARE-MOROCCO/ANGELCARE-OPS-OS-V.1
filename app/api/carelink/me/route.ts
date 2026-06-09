import { carelinkJson, loadCarelinkDashboard } from '@/lib/carelink/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { source, data } = await loadCarelinkDashboard()
  return carelinkJson({ ok: true, source, agent: data.agent })
}

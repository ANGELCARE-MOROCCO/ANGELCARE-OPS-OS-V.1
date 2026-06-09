import { carelinkJson } from '@/lib/carelink/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return carelinkJson({
    ok: true,
    service: 'AngelCare CareLink',
    module: 'mobile-field-agent-portal',
    routes: ['/carelink', '/carelink/missions', '/carelink/schedule', '/carelink/messages', '/carelink/profile'],
    timestamp: new Date().toISOString(),
  })
}

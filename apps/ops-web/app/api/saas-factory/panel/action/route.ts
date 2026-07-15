import { executeDeepPanelCommand, jsonError, jsonOk, readJson } from '@/lib/saas-factory/phase8-deep-runtime'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await readJson(request)
    const origin = new URL(request.url).origin
    const result = await executeDeepPanelCommand(origin, String(body.mode || body.command || 'command'), String(body.page || 'overview'), (body.payload || {}) as Record<string, unknown>)
    return jsonOk(result as any)
  } catch (error) {
    return jsonError(error)
  }
}

import { loadCareLinkOpsSnapshot, saveOpsServiceConfig } from '@/lib/carelink/ops-enterprise'
import { opsError, opsJson, readJsonBody } from '../_helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    return opsJson(await loadCareLinkOpsSnapshot())
  } catch (error) {
    return opsError(error, 'Impossible de charger les configurations service Ops')
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request)
    const saved = await saveOpsServiceConfig({
      serviceType: String(body?.serviceType || 'Service AngelCare'),
      serviceFamily: String(body?.serviceFamily || 'general_service'),
      config: typeof body?.config === 'object' && body?.config ? body.config : {},
      status: typeof body?.status === 'string' ? body.status : 'active',
      updatedBy: typeof body?.updatedBy === 'string' ? body.updatedBy : null,
    })
    return opsJson({ ok: true, data: saved })
  } catch (error) {
    return opsError(error, 'Impossible de créer la configuration service Ops')
  }
}

export async function PATCH(request: Request) {
  return POST(request)
}

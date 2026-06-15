import { loadCareLinkOpsSnapshot, saveOpsSetting } from '@/lib/carelink/ops-enterprise'
import { opsError, opsJson, readJsonBody } from '../_helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    return opsJson(await loadCareLinkOpsSnapshot())
  } catch (error) {
    return opsError(error, 'Impossible de charger les réglages Ops')
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await readJsonBody(request)
    const saved = await saveOpsSetting({
      key: String(body?.key || 'ops_setting'),
      label: String(body?.label || 'Ops setting'),
      category: String(body?.category || 'general'),
      value: typeof body?.value === 'object' && body?.value ? body.value : {},
      status: String(body?.status || 'active'),
      updatedBy: typeof body?.updatedBy === 'string' ? body.updatedBy : null,
    })
    return opsJson({ ok: true, data: saved })
  } catch (error) {
    return opsError(error, 'Impossible d’enregistrer le réglage Ops')
  }
}

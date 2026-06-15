import { validateOpsReport } from '@/lib/carelink/ops-enterprise'
import { opsError, opsJson, readJsonBody } from '../../../_helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Context = { params: Promise<{ id: string }> | { id: string } }

async function readId(context: Context) {
  const params = await context.params
  return Number(params.id)
}

export async function POST(request: Request, context: Context) {
  try {
    const missionId = await readId(context)
    const body = await readJsonBody(request)
    const report = await validateOpsReport(missionId, {
      ...body,
      status: 'validated',
      validation_status: 'validated',
    })
    return opsJson({ ok: true, data: report })
  } catch (error) {
    return opsError(error, 'Impossible de valider le rapport Ops')
  }
}

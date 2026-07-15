import { getDeepPanel, jsonError, jsonOk } from '@/lib/saas-factory/phase8-deep-runtime'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ page: string }> | { page: string } }

export async function GET(_request: Request, context: Context) {
  try {
    const params = await Promise.resolve(context.params as any)
    const data = await getDeepPanel(params.page || 'overview')
    return jsonOk(data)
  } catch (error) {
    return jsonError(error)
  }
}

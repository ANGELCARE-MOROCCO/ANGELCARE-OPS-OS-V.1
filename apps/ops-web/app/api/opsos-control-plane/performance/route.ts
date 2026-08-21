import {
  requirePerformanceOperator,
} from '@/lib/runtime/governor/access'
import {
  getAngelCarePerformanceSnapshot,
} from '@/lib/runtime/governor/performance'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export async function GET() {
  const access = await requirePerformanceOperator()

  if (!access.ok) {
    return access.response
  }

  const snapshot =
    await getAngelCarePerformanceSnapshot()

  return Response.json(
    snapshot,
    {
      headers: {
        'cache-control': 'no-store',
      },
    },
  )
}

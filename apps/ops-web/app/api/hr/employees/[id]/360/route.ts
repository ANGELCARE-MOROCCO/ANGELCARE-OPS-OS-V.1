import { NextResponse } from 'next/server'
import { requireEmployee360Actor } from '@/lib/hr-employee-360/permissions'
import { loadEmployee360Aggregate } from '@/lib/hr-employee-360/repository'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireEmployee360Actor('read')
    const { id } = await context.params
    const aggregate = await loadEmployee360Aggregate(id, actor)

    return NextResponse.json(
      { ok: true, aggregate },
      {
        status: 200,
        headers: {
          'cache-control': 'private, no-cache, no-store, max-age=0, must-revalidate',
        },
      },
    )
  } catch (error) {
    const detail = error as Error & { status?: number; code?: string }
    return NextResponse.json(
      {
        ok: false,
        error: detail.message || 'Chargement Employee 360 impossible.',
        code: detail.code || 'EMPLOYEE_360_LOAD_FAILED',
      },
      {
        status: detail.status || 500,
        headers: { 'cache-control': 'no-store' },
      },
    )
  }
}

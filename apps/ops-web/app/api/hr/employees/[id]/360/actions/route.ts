import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { requireEmployee360Actor } from '@/lib/hr-employee-360/permissions'
import { executeEmployee360Mutation } from '@/lib/hr-employee-360/service'
import { validateMutationRequest } from '@/lib/hr-employee-360/validation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function revalidateEmployee360(employeeId: string) {
  ;[
    '/hr',
    '/hr/employees',
    `/hr/employees/${employeeId}`,
    '/hr/staff',
    '/hr/attendance',
    '/hr/leave',
    '/hr/payroll',
    '/hr/work-schedules',
    '/hr/documents',
    '/hr/contracts',
    '/hr/onboarding',
    '/hr/training',
    '/hr/performance-matrix',
    '/hr/approvals',
    '/hr/audit',
  ].forEach((path) => revalidatePath(path))
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireEmployee360Actor('read')
    const { id } = await context.params
    const body = await request.json()
    const mutation = validateMutationRequest(body)
    const result = await executeEmployee360Mutation(id, actor, mutation)

    if (!result.ok) {
      const status = result.code === 'VERSION_CONFLICT' || result.code === 'DOMAIN_VERSION_CONFLICT' ? 409 :
        result.code === 'FORBIDDEN' || result.code?.endsWith('_FORBIDDEN') ? 403 :
        result.code?.includes('NOT_FOUND') ? 404 :
        result.code?.includes('REQUIRED') || result.code?.includes('INVALID') ? 400 : 500

      return NextResponse.json(result, {
        status,
        headers: { 'cache-control': 'no-store' },
      })
    }

    revalidateEmployee360(id)
    return NextResponse.json(result, {
      status: 200,
      headers: { 'cache-control': 'no-store' },
    })
  } catch (error) {
    const detail = error as Error & { status?: number; code?: string }
    return NextResponse.json(
      {
        ok: false,
        error: detail.message || 'Opération Employee 360 impossible.',
        code: detail.code || 'EMPLOYEE_360_ACTION_FAILED',
      },
      {
        status: detail.status || 500,
        headers: { 'cache-control': 'no-store' },
      },
    )
  }
}

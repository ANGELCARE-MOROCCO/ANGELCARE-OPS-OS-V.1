import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/getUser'
import { readApprovalDesk } from '@/lib/revenue-command-os/approvals/repository'
import { RevenueOsError } from '@/lib/revenue-command-os/errors'
import { revenueOsErrorResponse } from '@/lib/revenue-command-os/http'
import { studioRights, tenantOf } from '@/lib/revenue-command-os/strategy-studio/api-access'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return revenueOsErrorResponse(new RevenueOsError('UNAUTHENTICATED', 'Authentification requise.', { status: 401 }))
  if (!studioRights(user).view) return revenueOsErrorResponse(new RevenueOsError('FORBIDDEN', 'Permission de consultation des décisions requise.', { status: 403 }))

  try {
    return NextResponse.json(await readApprovalDesk(tenantOf(user)))
  } catch (error) {
    return revenueOsErrorResponse(error instanceof RevenueOsError ? error : new RevenueOsError('APPROVAL_DESK_LOAD_FAILED', 'Le bureau des décisions ne peut pas être chargé pour le moment.', { status: 500, recoverable: true, cause: error }))
  }
}

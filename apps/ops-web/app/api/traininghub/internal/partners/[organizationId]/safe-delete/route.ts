import { NextRequest, NextResponse } from 'next/server'
import { getTrainingHubContext, trainingHubErrorResponse, TrainingHubHttpError } from '@/lib/traininghub/auth'
import { createTrainingHubPermanentDeleteAdminClient, permanentlyDeleteTrainingHubPartner } from '@/lib/traininghub/production/partner-permanent-delete'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function handle(request: NextRequest, organizationId: string) {
  const context = await getTrainingHubContext()

  if (!context.isInternal && !context.isSuperAdmin) {
    throw new TrainingHubHttpError('Only internal TrainingHub users can delete or archive a partner.', 403, 'TRAININGHUB_INTERNAL_REQUIRED')
  }

  const body = await request.json().catch(() => ({}))
  const supabase = createTrainingHubPermanentDeleteAdminClient()
  const result = await permanentlyDeleteTrainingHubPartner(supabase, {
    organizationId,
    reason: body.reason || 'TrainingHub safe-delete route permanent smoke cleanup',
    confirmText: body.confirmText || body.confirm_text || null,
    mode: body.mode === 'force_confirmed' ? 'force_confirmed' : 'smoke_only',
    actorEmail: context.authUser?.email || null,
    actorProfileId: context.profile?.id || null,
  })

  return NextResponse.json({ ok: result.ok !== false, data: result, message: result.message }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: NextRequest, { params }: { params: { organizationId: string } }) {
  try {
    return await handle(request, params.organizationId)
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { organizationId: string } }) {
  try {
    return await handle(request, params.organizationId)
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}

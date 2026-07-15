import { NextRequest, NextResponse } from 'next/server'
import { getTrainingHubContext, trainingHubErrorResponse, TrainingHubHttpError } from '@/lib/traininghub/auth'
import {
  createPartnerHardDeleteV2AdminClient,
  hardDeleteTrainingHubPartnerV2,
} from '@/lib/traininghub/production/partner-hard-delete-v2'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RouteContext = {
  params: Promise<{ organizationId: string }>
}

async function getOrganizationId(context: RouteContext) {
  const params = await Promise.resolve(context.params as any)
  const organizationId = String(params?.organizationId || '').trim()

  if (!organizationId) {
    throw new TrainingHubHttpError('Missing partner organization id.', 400, 'TRAININGHUB_PARTNER_ID_REQUIRED')
  }

  return organizationId
}

async function requireInternalTrainingHub() {
  const context = await getTrainingHubContext()

  if (!context.isInternal && !context.isSuperAdmin) {
    throw new TrainingHubHttpError('Only internal TrainingHub users can manage partner dossiers.', 403, 'TRAININGHUB_INTERNAL_REQUIRED')
  }

  return context
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireInternalTrainingHub()
    const organizationId = await getOrganizationId(context)
    const supabase = createPartnerHardDeleteV2AdminClient()

    const { data, error } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', organizationId)
      .maybeSingle()

    if (error) {
      throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_PARTNER_READ_FAILED')
    }

    if (!data) {
      throw new TrainingHubHttpError('Partner organization not found.', 404, 'TRAININGHUB_PARTNER_NOT_FOUND')
    }

    return NextResponse.json(
      { ok: true, data },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireInternalTrainingHub()
    const organizationId = await getOrganizationId(context)
    const body = await request.json().catch(() => ({}))
    const supabase = createPartnerHardDeleteV2AdminClient()

    const allowed: Record<string, unknown> = {}
    const keys = [
      'name',
      'legal_name',
      'display_name',
      'status',
      'access_status',
      'city',
      'organization_type',
      'partner_type',
      'metadata',
      'updated_at',
    ]

    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        allowed[key] = body[key]
      }
    }

    allowed.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('core_organizations')
      .update(allowed)
      .eq('id', organizationId)
      .select('*')
      .maybeSingle()

    if (error) {
      throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_PARTNER_UPDATE_FAILED')
    }

    return NextResponse.json(
      { ok: true, data },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const trainingHubContext = await requireInternalTrainingHub()
    const organizationId = await getOrganizationId(context)
    const body = await request.json().catch(() => ({}))
    const supabase = createPartnerHardDeleteV2AdminClient()

    const result = await hardDeleteTrainingHubPartnerV2(supabase, {
      organizationId,
      allowNonSmoke: body.allowNonSmoke === true,
      reason: body.reason || 'TrainingHub partner dossier permanent delete',
      actorProfileId: trainingHubContext.profile?.id || null,
      actorEmail: trainingHubContext.authUser?.email || null,
    })

    return NextResponse.json(
      { ok: result.ok, data: result, error: result.error || null, message: result.message },
      { status: result.ok ? 200 : 409, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}

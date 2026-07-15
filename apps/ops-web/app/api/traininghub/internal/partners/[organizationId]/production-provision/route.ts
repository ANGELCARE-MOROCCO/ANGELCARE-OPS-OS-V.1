import { NextRequest, NextResponse } from 'next/server'
import {
  getTrainingHubContext,
  trainingHubErrorResponse,
  TrainingHubHttpError,
} from '@/lib/traininghub/auth'
import {
  createTrainingHubProvisioningAdminClient,
  ensureTrainingHubPartnerCommercialProvisioning,
} from '@/lib/traininghub/production/partner-commercial-provisioning'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function numberFrom(value: unknown, fallback: number) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function requireInternal(context: Awaited<ReturnType<typeof getTrainingHubContext>>) {
  if (!context.isInternal && !context.isSuperAdmin) {
    throw new TrainingHubHttpError('Only internal TrainingHub users can provision partner production records.', 403, 'TRAININGHUB_INTERNAL_REQUIRED')
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { organizationId: string } },
) {
  try {
    const context = await getTrainingHubContext()
    requireInternal(context)

    const supabase = createTrainingHubProvisioningAdminClient()
    const result = await ensureTrainingHubPartnerCommercialProvisioning(supabase, {
      organizationId: params.organizationId,
      execute: false,
      actorProfileId: context.profile?.id || null,
      source: 'traininghub_internal_readiness_check',
    })

    return NextResponse.json({ ok: true, data: result }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { organizationId: string } },
) {
  try {
    const context = await getTrainingHubContext()
    requireInternal(context)

    const body = await request.json().catch(() => ({}))
    const supabase = createTrainingHubProvisioningAdminClient()

    const result = await ensureTrainingHubPartnerCommercialProvisioning(supabase, {
      organizationId: params.organizationId,
      planName: body.planName || body.plan_name || 'Activation annuelle TrainingHub',
      amountMinor: numberFrom(body.amountMinor || body.amount_minor, 720000),
      credits: numberFrom(body.credits, 10),
      currency: body.currency || 'MAD',
      createSession: body.createSession !== false,
      actorProfileId: context.profile?.id || null,
      source: 'traininghub_internal_partner_activation',
      execute: true,
    })

    return NextResponse.json({ ok: result.ok, data: result }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}

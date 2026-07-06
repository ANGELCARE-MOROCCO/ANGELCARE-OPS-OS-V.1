import { NextRequest, NextResponse } from 'next/server'
import {
  getTrainingHubContext,
  trainingHubErrorResponse,
  TrainingHubHttpError,
} from '@/lib/traininghub/auth'
import { createTrainingHubUserClient } from '@/lib/traininghub/supabase'
import {
  listTrainingHubPartnerRequests,
  resolveTrainingHubPartnerOrganizationScope,
} from '@/lib/traininghub/partner-portal-sync'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function clean(value: unknown) {
  return String(value || '').trim()
}

async function insertPartnerRequest(supabase: any, organizationId: string, profileId: string, body: any) {
  const payload = {
    organization_id: organizationId,
    requester_user_id: profileId || null,
    request_type: clean(body.request_type || 'support_issue'),
    title: clean(body.title || 'Demande partenaire'),
    description: clean(body.description),
    status: 'open',
    priority: clean(body.priority || 'normal'),
    metadata: {
      source: 'partner_portal',
    },
  }

  const { data, error } = await supabase.from('partner_requests').insert(payload).select('*').maybeSingle()
  if (error) return { data: null, error }
  return { data, error: null }
}

async function insertFallbackEvent(supabase: any, organizationId: string, profileId: string, body: any) {
  const payload = {
    organization_id: organizationId,
    event_type: `partner_request.${clean(body.request_type || 'support_issue')}`,
    title: clean(body.title || 'Demande partenaire'),
    status: 'open',
    payload: {
      request_type: clean(body.request_type || 'support_issue'),
      description: clean(body.description),
      priority: clean(body.priority || 'normal'),
      requester_user_id: profileId || null,
      source: 'partner_portal',
    },
  }

  const { data, error } = await supabase.from('auto_events').insert(payload).select('*').maybeSingle()
  if (error) return { data: null, error }

  return {
    data: {
      id: data.id,
      request_type: payload.payload.request_type,
      title: payload.title,
      description: payload.payload.description,
      status: data.status || 'open',
      priority: payload.payload.priority,
      created_at: data.created_at,
    },
    error: null,
  }
}

export async function GET() {
  try {
    const context = await getTrainingHubContext()
    const supabase = await createTrainingHubUserClient()
    const data = await listTrainingHubPartnerRequests(supabase, context)

    return NextResponse.json(
      { ok: true, data },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getTrainingHubContext()
    const supabase = await createTrainingHubUserClient()
    const scope = await resolveTrainingHubPartnerOrganizationScope(supabase, context)
    const organizationId = clean(scope.organizationId)
    const profileId = clean(context.profile?.id)

    if (!organizationId) {
      throw new TrainingHubHttpError('Aucun établissement partenaire rattaché à cette session.', 403, 'TRAININGHUB_PARTNER_SCOPE_MISSING')
    }

    const body = await request.json()
    const title = clean(body.title)

    if (!title) {
      throw new TrainingHubHttpError('Objet de demande requis.', 400, 'TRAININGHUB_REQUEST_TITLE_REQUIRED')
    }

    const primary = await insertPartnerRequest(supabase, organizationId, profileId, body)

    if (!primary.error) {
      return NextResponse.json({ ok: true, data: primary.data })
    }

    const fallback = await insertFallbackEvent(supabase, organizationId, profileId, body)
    if (fallback.error) {
      throw new TrainingHubHttpError(fallback.error.message || primary.error.message, 500, 'TRAININGHUB_REQUEST_CREATE_FAILED')
    }

    return NextResponse.json({ ok: true, data: fallback.data, fallback: true })
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}

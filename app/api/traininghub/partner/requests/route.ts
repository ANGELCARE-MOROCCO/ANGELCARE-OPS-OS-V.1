import { NextRequest, NextResponse } from 'next/server'
import {
  getTrainingHubContext,
  trainingHubErrorResponse,
  TrainingHubHttpError,
} from '@/lib/traininghub/auth'
import { createTrainingHubUserClient } from '@/lib/traininghub/supabase'

export const dynamic = 'force-dynamic'

function clean(value: unknown) {
  return String(value || '').trim()
}

function organizationIdFrom(context: any) {
  return clean(context.organization?.id) || clean(context.organization_id) || clean(context.membership?.organization_id) || clean(context.profile?.organization_id)
}

async function listFromPartnerRequests(supabase: any, organizationId: string) {
  const { data, error } = await supabase
    .from('partner_requests')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) return { rows: [], error }
  return { rows: Array.isArray(data) ? data : [], error: null }
}

async function listFromAutoEvents(supabase: any, organizationId: string) {
  const { data, error } = await supabase
    .from('auto_events')
    .select('*')
    .eq('organization_id', organizationId)
    .ilike('event_type', 'partner_request%')
    .order('created_at', { ascending: false })

  if (error) return { rows: [], error }
  return {
    rows: (Array.isArray(data) ? data : []).map((row: any) => ({
      id: row.id,
      request_type: row.payload?.request_type || row.event_type || 'support_issue',
      title: row.title || row.payload?.title || 'Demande partenaire',
      description: row.payload?.description || row.description || '',
      status: row.status || 'open',
      priority: row.payload?.priority || 'normal',
      created_at: row.created_at,
      updated_at: row.updated_at,
    })),
    error: null,
  }
}

export async function GET() {
  try {
    const context = (await getTrainingHubContext()) as any
    const organizationId = organizationIdFrom(context)

    if (!organizationId) {
      throw new TrainingHubHttpError('Aucun établissement partenaire rattaché à cette session.', 403, 'TRAININGHUB_PARTNER_SCOPE_MISSING')
    }

    const supabase = await createTrainingHubUserClient()
    const primary = await listFromPartnerRequests(supabase, organizationId)

    if (!primary.error) {
      return NextResponse.json({ ok: true, data: primary.rows })
    }

    const fallback = await listFromAutoEvents(supabase, organizationId)
    return NextResponse.json({ ok: true, data: fallback.rows, fallback: true })
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
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

export async function POST(request: NextRequest) {
  try {
    const context = (await getTrainingHubContext()) as any
    const organizationId = organizationIdFrom(context)
    const profileId = clean(context.profile?.id)

    if (!organizationId) {
      throw new TrainingHubHttpError('Aucun établissement partenaire rattaché à cette session.', 403, 'TRAININGHUB_PARTNER_SCOPE_MISSING')
    }

    const body = await request.json()
    const title = clean(body.title)

    if (!title) {
      throw new TrainingHubHttpError('Objet de demande requis.', 400, 'TRAININGHUB_REQUEST_TITLE_REQUIRED')
    }

    const supabase = await createTrainingHubUserClient()
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

export async function PATCH(request: NextRequest) {
  try {
    const context = (await getTrainingHubContext()) as any
    const organizationId = organizationIdFrom(context)

    if (!organizationId) {
      throw new TrainingHubHttpError('Aucun établissement partenaire rattaché à cette session.', 403, 'TRAININGHUB_PARTNER_SCOPE_MISSING')
    }

    const body = await request.json()
    const id = clean(body.id)
    const status = clean(body.status || 'closed')

    if (!id) {
      throw new TrainingHubHttpError('Demande requise.', 400, 'TRAININGHUB_REQUEST_ID_REQUIRED')
    }

    const supabase = await createTrainingHubUserClient()
    const { data, error } = await supabase
      .from('partner_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select('*')
      .maybeSingle()

    if (error) {
      throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_REQUEST_UPDATE_FAILED')
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}

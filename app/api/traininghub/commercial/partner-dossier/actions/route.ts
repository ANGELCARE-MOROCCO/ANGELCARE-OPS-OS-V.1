import { NextRequest, NextResponse } from 'next/server'
import {
  getTrainingHubContext,
  requireTrainingHubPermission,
  trainingHubErrorResponse,
  TrainingHubHttpError,
} from '@/lib/traininghub/auth'
import { createTrainingHubUserClient } from '@/lib/traininghub/supabase'

export const dynamic = 'force-dynamic'

function clean(value: unknown) {
  return String(value || '').trim()
}

export async function POST(request: NextRequest) {
  try {
    const context = await getTrainingHubContext()
    if (!context.isInternal && !context.isSuperAdmin) {
      throw new TrainingHubHttpError('Accès direction requis.', 403, 'TRAININGHUB_PARTNER_DOSSIER_INTERNAL_ONLY')
    }
    requireTrainingHubPermission(context, ['training.proposal.create', 'training.proposal.send', 'training.access.manage'])

    const body = await request.json()
    const action = clean(body.action)
    const organizationId = clean(body.organization_id)
    if (!organizationId) throw new TrainingHubHttpError('Partenaire requis.', 400, 'TRAININGHUB_PARTNER_DOSSIER_ORG_REQUIRED')

    const supabase = await createTrainingHubUserClient()

    if (action === 'ensure_account') {
      const { data: existing } = await supabase
        .from('bill_accounts')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle()

      if (existing?.id) {
        const { data, error } = await supabase
          .from('bill_accounts')
          .update({ status: 'active' })
          .eq('id', existing.id)
          .select('*')
          .maybeSingle()

        if (error) throw new TrainingHubHttpError(error.message, 500, 'TRAININGHUB_ACCOUNT_REACTIVATE_FAILED')
        return NextResponse.json({ ok: true, data })
      }

      const { data, error } = await supabase
        .from('bill_accounts')
        .insert({
          organization_id: organizationId,
          status: 'active',
          currency_code: 'MAD',
          metadata: {
            source: 'partner_mega_dossier',
            created_by: context.profile.id,
          },
        })
        .select('*')
        .maybeSingle()

      if (error || !data) throw new TrainingHubHttpError(error?.message || 'Compte partenaire non créé.', 500, 'TRAININGHUB_ACCOUNT_CREATE_FAILED')
      return NextResponse.json({ ok: true, data })
    }

    if (action === 'open_followup' || action === 'upgrade_review') {
      const eventType = action === 'open_followup' ? 'partner_followup_required' : 'partner_upgrade_review'
      const message = action === 'open_followup' ? 'Relance commerciale à planifier' : 'Revue de montée en gamme à préparer'

      const attempts = [
        () =>
          supabase.from('auto_events').insert({
            organization_id: organizationId,
            event_type: eventType,
            title: message,
            status: 'open',
            payload: {
              source: 'partner_mega_dossier',
              created_by: context.profile.id,
            },
          }).select('*').maybeSingle(),
        () =>
          supabase.from('auto_events').insert({
            organization_id: organizationId,
            event_type: eventType,
            status: 'open',
            payload: {
              title: message,
              source: 'partner_mega_dossier',
              created_by: context.profile.id,
            },
          }).select('*').maybeSingle(),
      ]

      let lastError: any = null
      for (const attempt of attempts) {
        const { data, error } = await attempt()
        if (!error && data) return NextResponse.json({ ok: true, data })
        lastError = error
      }

      throw new TrainingHubHttpError(lastError?.message || 'Action dossier non enregistrée.', 500, 'TRAININGHUB_DOSSIER_EVENT_FAILED')
    }

    throw new TrainingHubHttpError('Action dossier inconnue.', 400, 'TRAININGHUB_DOSSIER_ACTION_UNKNOWN')
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}

import { NextResponse } from 'next/server'
import {
  getTrainingHubContext,
  trainingHubErrorResponse,
  TrainingHubHttpError,
} from '@/lib/traininghub/auth'
import { createTrainingHubUserClient } from '@/lib/traininghub/supabase'

export const dynamic = 'force-dynamic'

type CountResult = {
  table: string
  label: string
  visible: number
  own: number
  leaked: boolean
  error: string | null
}

function clean(value: unknown) {
  return String(value || '').trim()
}

function bool(value: unknown) {
  return value === true || value === 'true'
}

async function countRows(supabase: any, table: string, field?: string, value?: string) {
  try {
    let query = supabase.from(table).select('id', { count: 'exact', head: true })
    if (field && value) query = query.eq(field, value)
    const { count, error } = await query
    return { count: count || 0, error: error?.message || null }
  } catch (error) {
    return { count: 0, error: error instanceof Error ? error.message : String(error || 'Erreur inconnue') }
  }
}

async function checkTable(supabase: any, table: string, label: string, organizationId: string, internal: boolean): Promise<CountResult> {
  const visible = await countRows(supabase, table)
  const own = await countRows(supabase, table, table === 'core_organizations' ? 'id' : 'organization_id', organizationId)

  const visibleCount = visible.count || 0
  const ownCount = own.count || 0
  const leaked = !internal && visibleCount > ownCount

  return {
    table,
    label,
    visible: visibleCount,
    own: ownCount,
    leaked,
    error: visible.error || own.error,
  }
}

export async function GET() {
  try {
    const context = (await getTrainingHubContext()) as any
    const supabase = await createTrainingHubUserClient()

    const isInternal = bool(context.isInternal) || bool(context.isSuperAdmin)
    const organizationId =
      clean(context.organization?.id) ||
      clean(context.organization_id) ||
      clean(context.membership?.organization_id) ||
      clean(context.profile?.organization_id)

    if (!organizationId && !isInternal) {
      throw new TrainingHubHttpError('Aucun périmètre partenaire trouvé pour cette session.', 403, 'TRAININGHUB_PARTNER_SCOPE_MISSING')
    }

    const scopedOrganizationId = organizationId || clean(context.organization?.id)

    const checks = scopedOrganizationId
      ? await Promise.all([
          checkTable(supabase, 'core_organizations', 'Dossier partenaire', scopedOrganizationId, isInternal),
          checkTable(supabase, 'core_memberships', 'Utilisateurs rattachés', scopedOrganizationId, isInternal),
          checkTable(supabase, 'authz_user_role_assignments', 'Rôles rattachés', scopedOrganizationId, isInternal),
          checkTable(supabase, 'bill_accounts', 'Compte partenaire', scopedOrganizationId, isInternal),
          checkTable(supabase, 'bill_subscriptions', 'Plan / abonnement', scopedOrganizationId, isInternal),
          checkTable(supabase, 'bill_proposals', 'Propositions', scopedOrganizationId, isInternal),
          checkTable(supabase, 'bill_orders', 'Commandes', scopedOrganizationId, isInternal),
          checkTable(supabase, 'bill_invoices', 'Factures', scopedOrganizationId, isInternal),
          checkTable(supabase, 'bill_training_credits', 'Crédits formation', scopedOrganizationId, isInternal),
          checkTable(supabase, 'trn_sessions', 'Sessions formation', scopedOrganizationId, isInternal),
          checkTable(supabase, 'trn_session_participants', 'Participants', scopedOrganizationId, isInternal),
          checkTable(supabase, 'trn_certificates', 'Certificats', scopedOrganizationId, isInternal),
        ])
      : []

    const leakCount = checks.filter((check) => check.leaked).length
    const errorCount = checks.filter((check) => check.error).length
    const ownSignal = checks.reduce((total, check) => total + (check.own > 0 ? 1 : 0), 0)

    const score = isInternal
      ? 100
      : Math.max(0, Math.min(100, Math.round(100 - leakCount * 20 - errorCount * 5 + Math.min(ownSignal, 6))))

    return NextResponse.json({
      ok: true,
      data: {
        mode: isInternal ? 'internal_admin' : 'partner_scoped',
        organization_id: scopedOrganizationId || null,
        organization_name: context.organization?.name || context.organization?.legal_name || null,
        profile_id: context.profile?.id || null,
        profile_email: context.profile?.email || null,
        score,
        leak_count: leakCount,
        error_count: errorCount,
        checks,
        verdict: isInternal
          ? 'Session interne AngelCare: visibilité portefeuille autorisée.'
          : leakCount
            ? 'Attention: des données hors périmètre semblent visibles.'
            : 'Périmètre partenaire cohérent: aucune fuite évidente détectée.',
      },
    })
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}

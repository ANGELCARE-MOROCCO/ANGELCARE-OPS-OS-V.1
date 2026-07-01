import { NextResponse } from 'next/server'
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

async function safeRows(supabase: any, table: string, select = '*', organizationId?: string) {
  try {
    let query = supabase.from(table).select(select)
    if (organizationId) {
      query = table === 'core_organizations' ? query.eq('id', organizationId) : query.eq('organization_id', organizationId)
    }
    const { data, error } = await query
    return {
      rows: Array.isArray(data) ? data : [],
      error: error?.message || null,
    }
  } catch (error) {
    return {
      rows: [],
      error: error instanceof Error ? error.message : String(error || 'Erreur inconnue'),
    }
  }
}

function amount(row: any) {
  return Number(row.grand_total_minor || row.amount_due_minor || row.balance_due_minor || row.subtotal_minor || 0) || 0
}

function normalize(value: unknown) {
  return clean(value).toLowerCase()
}

function stage(data: any) {
  if (data.certificates.length) return 'certifié'
  if (data.sessions.length) return 'formation'
  if (data.credits.length) return 'crédits activés'
  if (data.invoices.length) return 'facturation'
  if (data.orders.length) return 'commande'
  if (data.proposals.length) return 'offre'
  return 'activation'
}

function nextAction(currentStage: string) {
  if (currentStage === 'activation') return 'Finaliser votre première offre avec AngelCare'
  if (currentStage === 'offre') return 'Valider la proposition et préparer la commande'
  if (currentStage === 'commande') return 'Suivre la facturation et activer les crédits formation'
  if (currentStage === 'facturation') return 'Planifier la session de formation'
  if (currentStage === 'crédits activés') return 'Confirmer les participants et la date'
  if (currentStage === 'formation') return 'Suivre les présences et les certificats'
  return 'Préparer le renouvellement ou la montée en gamme'
}

export async function GET() {
  try {
    const context = (await getTrainingHubContext()) as any
    const supabase = await createTrainingHubUserClient()

    const organizationId =
      clean(context.organization?.id) ||
      clean(context.organization_id) ||
      clean(context.membership?.organization_id) ||
      clean(context.profile?.organization_id)

    if (!organizationId) {
      throw new TrainingHubHttpError('Aucun établissement partenaire n’est rattaché à cette session.', 403, 'TRAININGHUB_PARTNER_SCOPE_MISSING')
    }

    const [
      organizations,
      memberships,
      accounts,
      subscriptions,
      proposals,
      orders,
      invoices,
      credits,
      sessions,
      participants,
      certificates,
    ] = await Promise.all([
      safeRows(supabase, 'core_organizations', '*', organizationId),
      safeRows(supabase, 'core_memberships', '*', organizationId),
      safeRows(supabase, 'bill_accounts', '*', organizationId),
      safeRows(supabase, 'bill_subscriptions', '*', organizationId),
      safeRows(supabase, 'bill_proposals', '*', organizationId),
      safeRows(supabase, 'bill_orders', '*', organizationId),
      safeRows(supabase, 'bill_invoices', '*', organizationId),
      safeRows(supabase, 'bill_training_credits', '*', organizationId),
      safeRows(supabase, 'trn_sessions', '*', organizationId),
      safeRows(supabase, 'trn_session_participants', '*', organizationId),
      safeRows(supabase, 'trn_certificates', '*', organizationId),
    ])

    const data = {
      organization: organizations.rows[0] || context.organization || null,
      memberships: memberships.rows,
      accounts: accounts.rows,
      subscriptions: subscriptions.rows,
      proposals: proposals.rows,
      orders: orders.rows,
      invoices: invoices.rows,
      credits: credits.rows,
      sessions: sessions.rows,
      participants: participants.rows,
      certificates: certificates.rows,
    }

    const currentStage = stage(data)
    const openInvoiceMinor = data.invoices
      .filter((invoice: any) => !['paid', 'settled', 'closed', 'cancelled'].includes(normalize(invoice.status)))
      .reduce((total: number, invoice: any) => total + amount(invoice), 0)

    const maturity = Math.min(
      100,
      Math.round(
        (data.proposals.length ? 15 : 0) +
          (data.orders.length ? 15 : 0) +
          (data.invoices.length ? 15 : 0) +
          (data.credits.length ? 15 : 0) +
          (data.sessions.length ? 15 : 0) +
          (data.participants.length ? 12 : 0) +
          (data.certificates.length ? 13 : 0),
      ),
    )

    const warnings = [
      organizations.error,
      memberships.error,
      accounts.error,
      subscriptions.error,
      proposals.error,
      orders.error,
      invoices.error,
      credits.error,
      sessions.error,
      participants.error,
      certificates.error,
    ].filter(Boolean)

    return NextResponse.json({
      ok: true,
      data: {
        ...data,
        organization_id: organizationId,
        stage: currentStage,
        next_action: nextAction(currentStage),
        maturity,
        open_invoice_minor: openInvoiceMinor,
        warnings,
      },
    })
  } catch (error) {
    return trainingHubErrorResponse(error)
  }
}

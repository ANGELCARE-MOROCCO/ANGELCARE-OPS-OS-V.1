import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AnyRecord = Record<string, any>

const TABLES = {
  investors: 'capital_investors',
  opportunities: 'capital_opportunities',
  commitments: 'capital_commitments',
  payments: 'capital_payments',
  diligence: 'capital_diligence_tasks',
  documents: 'capital_documents',
  notes: 'capital_notes',
  trainings: 'capital_training_pages',
} as const

function arr<T = AnyRecord>(value: any): T[] {
  return Array.isArray(value) ? value : []
}

async function safeRows(supabase: any, table: string, order = 'updated_at') {
  try {
    const { data, error } = await supabase.from(table).select('*').eq('archived', false).order(order, { ascending: false }).limit(500)
    if (error) return []
    return arr(data)
  } catch {
    return []
  }
}

function money(value: any) {
  const n = Number(value || 0)
  return Number.isFinite(n) ? n : 0
}

function daysUntil(value: any) {
  if (!value) return null
  const target = new Date(String(value))
  if (Number.isNaN(target.getTime())) return null
  return Math.ceil((target.getTime() - Date.now()) / 86400000)
}

export async function GET() {
  try {
    const supabase = await createClient()
    const [investors, opportunities, commitments, payments, diligence, documents, notes, trainings] = await Promise.all([
      safeRows(supabase, TABLES.investors),
      safeRows(supabase, TABLES.opportunities),
      safeRows(supabase, TABLES.commitments),
      safeRows(supabase, TABLES.payments),
      safeRows(supabase, TABLES.diligence),
      safeRows(supabase, TABLES.documents),
      safeRows(supabase, TABLES.notes),
      safeRows(supabase, TABLES.trainings),
    ])

    const stats = {
      investors: investors.length,
      opportunities: opportunities.length,
      activeOpportunities: opportunities.filter((x) => ['active', 'screening', 'diligence', 'negotiation'].includes(String(x.status || x.stage))).length,
      targetAmount: opportunities.reduce((s, x) => s + money(x.target_amount), 0),
      committedAmount: commitments.reduce((s, x) => s + money(x.committed_amount), 0),
      receivedAmount: payments.filter((x) => String(x.status) === 'paid').reduce((s, x) => s + money(x.amount), 0),
      pendingAmount: payments.filter((x) => String(x.status) === 'pending').reduce((s, x) => s + money(x.amount), 0),
      overduePayments: payments.filter((x) => String(x.status) === 'pending' && daysUntil(x.due_date) !== null && Number(daysUntil(x.due_date)) < 0).length,
      diligenceOpen: diligence.filter((x) => !['completed', 'closed'].includes(String(x.status))).length,
      dataRoomDocs: documents.length,
      trainingPages: trainings.length,
      nextCloseDays: opportunities.map((x) => daysUntil(x.closing_date)).filter((x) => x !== null).sort((a: any, b: any) => a - b)[0] ?? null,
    }

    return NextResponse.json({ ok: true, data: { investors, opportunities, commitments, payments, diligence, trainings, documents, notes, stats } })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to load Capital Command Center' }, { status: 500 })
  }
}

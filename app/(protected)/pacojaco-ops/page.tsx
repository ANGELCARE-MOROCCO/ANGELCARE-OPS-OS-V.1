import { existsSync } from 'fs'
import path from 'path'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { calculatePacojacoStats } from '@/lib/pacojaco-ops/calculations'
import { hasPacojacoOpsAccess } from '@/lib/pacojaco-ops/security'
import type { PacojacoDocumentRow } from '@/lib/pacojaco-ops/types'
import PacoJacoOpsWorkspace from '@/components/pacojaco-ops/PacoJacoOpsWorkspace'

export const dynamic = 'force-dynamic'

const emptyStats = {
  totalDocuments: 0,
  totalInvoices: 0,
  totalQuotes: 0,
  totalClients: 0,
  documentsLinkedToClients: 0,
  draftDocuments: 0,
  issuedDocuments: 0,
  sentDocuments: 0,
  acceptedDocuments: 0,
  rejectedDocuments: 0,
  paidDocuments: 0,
  partiallyPaidDocuments: 0,
  cancelledDocuments: 0,
  totalBilledMad: 0,
  totalRemainingMad: 0,
  thisMonthBilledMad: 0,
}

function displayName(user: any) {
  return (
    String(user?.full_name || '').trim() ||
    String(user?.name || '').trim() ||
    String(user?.display_name || '').trim() ||
    String(user?.username || '').trim() ||
    String(user?.email || '').trim() ||
    'Current user'
  )
}

function isMissingColumnError(error: any) {
  return String(error?.code || '') === '42703' || /column .* does not exist/i.test(String(error?.message || ''))
}

async function loadInitialStatsRows(supabase: Awaited<ReturnType<typeof createClient>>) {
  const withClientId = await supabase
    .from('pacojaco_documents')
    .select('document_type,status,total_ttc,remaining_amount,issue_date,client_id')
    .order('updated_at', { ascending: false })

  if (!withClientId.error) {
    return (withClientId.data || []) as PacojacoDocumentRow[]
  }

  if (isMissingColumnError(withClientId.error)) {
    const fallback = await supabase
      .from('pacojaco_documents')
      .select('document_type,status,total_ttc,remaining_amount,issue_date')
      .order('updated_at', { ascending: false })
    if (fallback.error) return []
    return (fallback.data || []) as PacojacoDocumentRow[]
  }

  return []
}

function deniedCard() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f5f7fb_100%)] px-4 py-8">
      <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
        <section className="w-full rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500">PACOJACO OPS</div>
          <h1 className="mt-3 text-3xl font-black text-slate-900">Access not available</h1>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
            Your account is authenticated, but it does not currently have PACOJACO OPS permissions. Ask a CEO, admin, commercial, or finance user to grant access.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100">
              Back to workspace
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}

export default async function PacoJacoOpsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (!hasPacojacoOpsAccess(user)) {
    return deniedCard()
  }

  const supabase = await createClient()
  const [documentsRes, statsRows, clientStatsRes] = await Promise.all([
    supabase.from('pacojaco_documents').select('*').order('updated_at', { ascending: false }).limit(200),
    loadInitialStatsRows(supabase),
    supabase.from('pacojaco_clients').select('id', { count: 'exact', head: true }),
  ])

  const initialDocuments = !documentsRes.error ? (((documentsRes.data || []) as PacojacoDocumentRow[]) || []) : []
  const clientStats =
    clientStatsRes && !clientStatsRes.error
      ? {
          totalClients: clientStatsRes.count || 0,
          documentsLinkedToClients: 0,
        }
      : { totalClients: 0, documentsLinkedToClients: 0 }
  const initialStats = statsRows.length ? { ...calculatePacojacoStats(statsRows), ...clientStats } : { ...emptyStats, ...clientStats }
  const hasLogo = existsSync(path.join(process.cwd(), 'public/pacojaco/logo.png'))

  return (
    <PacoJacoOpsWorkspace
      initialDocuments={initialDocuments}
      initialStats={initialStats}
      hasLogo={hasLogo}
      currentUserName={displayName(user)}
    />
  )
}

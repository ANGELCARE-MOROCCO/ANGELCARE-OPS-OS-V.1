import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import Billing360ActivationWorkspace from '../_components/Billing360ActivationWorkspace'

export default async function BillingActivationPage({ searchParams }: { searchParams?: Promise<{ status?: string }> }) {
  await requireRole(['ceo', 'manager'])
  const filters = await searchParams
  const status = filters?.status || 'all'
  const supabase = await createClient()

  const [invoicesRes, contractsRes, eventsRes] = await Promise.all([
    supabase.from('billing_invoices').select('*').order('created_at', { ascending: false }).limit(80),
    supabase.from('contracts').select('*, families:family_id (family_name, parent_name, city, phone)').order('created_at', { ascending: false }).limit(80),
    supabase.from('contract_finance_events').select('*').order('created_at', { ascending: false }).limit(40),
  ])

  const warnings = [
    invoicesRes.error ? `Les factures ne sont pas disponibles : ${invoicesRes.error.message}.` : '',
    contractsRes.error ? `Les contrats ne sont pas disponibles : ${contractsRes.error.message}.` : '',
    eventsRes.error ? `Les événements financiers ne sont pas disponibles : ${eventsRes.error.message}.` : '',
  ].filter(Boolean)

  return (
    <AppShell
      title="Billing 360 — Collections & Activation"
      subtitle="Files de facturation, échéances, retards et accès direct au studio financier du contrat."
      breadcrumbs={[{ label: 'Billing', href: '/billing' }, { label: 'Activation' }]}
      actions={<><PageAction href="/billing" variant="light">Command Center</PageAction><PageAction href="/billing/overview" variant="light">Vue financière</PageAction><PageAction href="/contracts" variant="light">Contrats</PageAction></>}
    >
      <Billing360ActivationWorkspace invoices={invoicesRes.data || []} contracts={contractsRes.data || []} events={eventsRes.data || []} initialStatus={status} dataWarnings={warnings} />
    </AppShell>
  )
}

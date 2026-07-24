import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import Billing360ExecutiveOverview from '../_components/Billing360ExecutiveOverview'

export default async function BillingOverviewPage() {
  const supabase = await createClient()
  const [contractsRes, invoicesRes, eventsRes] = await Promise.all([
    supabase.from('contracts').select('*, families:family_id (family_name, parent_name, city, phone)').eq('is_archived', false).order('created_at', { ascending: false }),
    supabase.from('billing_invoices').select('*').eq('is_archived', false).order('created_at', { ascending: false }),
    supabase.from('contract_finance_events').select('*').order('created_at', { ascending: false }).limit(40),
  ])
  const warnings = [
    contractsRes.error ? `Les contrats ne sont pas disponibles : ${contractsRes.error.message}.` : '',
    invoicesRes.error ? `Les factures ne sont pas disponibles : ${invoicesRes.error.message}.` : '',
    eventsRes.error ? `Les événements financiers ne sont pas disponibles : ${eventsRes.error.message}.` : '',
  ].filter(Boolean)

  return (
    <AppShell
      title="Billing 360 — Vue financière exécutive"
      subtitle="Brief direction sur la valeur contractuelle, la facturation, l’encaissement et l’exposition."
      breadcrumbs={[{ label: 'Billing', href: '/billing' }, { label: 'Vue financière' }]}
      actions={<><PageAction href="/billing" variant="light">Command Center</PageAction><PageAction href="/billing/activation" variant="light">Activation</PageAction><PageAction href="/contracts" variant="light">Contrats</PageAction></>}
    >
      <Billing360ExecutiveOverview contracts={contractsRes.data || []} invoices={invoicesRes.data || []} events={eventsRes.data || []} dataWarnings={warnings} />
    </AppShell>
  )
}

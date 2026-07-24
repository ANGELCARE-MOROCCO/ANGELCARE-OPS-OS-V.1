import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import Billing360CommandCenter from './_components/Billing360CommandCenter'

export default async function BillingPage() {
  const supabase = await createClient()
  const [contractsRes, invoicesRes, eventsRes] = await Promise.all([
    supabase.from('contracts').select('*, families:family_id (family_name, parent_name, city, phone)').eq('is_archived', false).order('created_at', { ascending: false }),
    supabase.from('billing_invoices').select('*').eq('is_archived', false).order('created_at', { ascending: false }),
    supabase.from('contract_finance_events').select('*').order('created_at', { ascending: false }).limit(80),
  ])

  const warnings = [
    contractsRes.error ? `Les contrats ne sont pas disponibles : ${contractsRes.error.message}.` : '',
    invoicesRes.error ? `Les factures ne sont pas disponibles : ${invoicesRes.error.message}.` : '',
    eventsRes.error ? `Les événements financiers ne sont pas disponibles : ${eventsRes.error.message}.` : '',
  ].filter(Boolean)

  return (
    <AppShell
      title="Billing 360 Command Center"
      subtitle="Pilotage contractuel, facturation, encaissements et exposition de recouvrement."
      breadcrumbs={[{ label: 'Contrats & Billing' }, { label: 'Billing 360' }]}
      actions={<><PageAction href="/billing/overview" variant="light">Vue financière</PageAction><PageAction href="/billing/activation" variant="light">Centre d’activation</PageAction><PageAction href="/contracts" variant="light">Contrats</PageAction></>}
    >
      <Billing360CommandCenter contracts={contractsRes.data || []} invoices={invoicesRes.data || []} events={eventsRes.data || []} dataWarnings={warnings} />
    </AppShell>
  )
}

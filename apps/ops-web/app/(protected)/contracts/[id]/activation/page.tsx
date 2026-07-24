import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import ContractFinanceStudio from './_components/ContractFinanceStudio'

async function createInvoice(formData: FormData) {
  'use server'
  await requireRole(['ceo', 'manager'])
  const supabase = await createClient()
  const contractId = Number(formData.get('contract_id'))
  const amount = Number(formData.get('amount') || 0)
  const label = String(formData.get('invoice_label') || 'Facture contrat')
  const dueDate = String(formData.get('due_date') || '') || null
  const notes = String(formData.get('notes') || '') || null

  const { error } = await supabase.from('billing_invoices').insert([{ contract_id: contractId, amount, invoice_label: label, due_date: dueDate, notes, status: 'pending', invoice_reference: `AC-${Date.now()}` }])
  if (error) throw new Error(error.message)

  await supabase.from('contract_finance_events').insert([{ contract_id: contractId, event_type: 'invoice_created', amount, note: label }])
  redirect(`/contracts/${contractId}/activation`)
}

async function markInvoicePaid(formData: FormData) {
  'use server'
  await requireRole(['ceo', 'manager'])
  const supabase = await createClient()
  const contractId = Number(formData.get('contract_id'))
  const invoiceId = Number(formData.get('invoice_id'))
  const amountPaid = Number(formData.get('amount_paid') || 0)

  const { error } = await supabase.from('billing_invoices').update({ status: 'paid', amount_paid: amountPaid, paid_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', invoiceId)
  if (error) throw new Error(error.message)

  await supabase.from('contract_finance_events').insert([{ contract_id: contractId, event_type: 'payment_received', amount: amountPaid, note: `Invoice #${invoiceId} marked paid` }])
  redirect(`/contracts/${contractId}/activation`)
}

async function logConsumption(formData: FormData) {
  'use server'
  await requireRole(['ceo', 'manager'])
  const supabase = await createClient()
  const contractId = Number(formData.get('contract_id'))
  const amountValue = Number(formData.get('amount_value') || 0)
  const unitsUsed = Number(formData.get('units_used') || 1)
  const notes = String(formData.get('notes') || '') || null

  const { error } = await supabase.from('contract_consumption_logs').insert([{ contract_id: contractId, amount_value: amountValue, units_used: unitsUsed, notes }])
  if (error) throw new Error(error.message)

  await supabase.from('contract_finance_events').insert([{ contract_id: contractId, event_type: 'contract_consumption', amount: amountValue, note: notes || 'Manual consumption log' }])
  redirect(`/contracts/${contractId}/activation`)
}

export default async function ContractActivationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ceo', 'manager'])
  const { id } = await params
  const supabase = await createClient()

  const contractRes = await supabase.from('contracts').select('*, families:family_id (family_name, parent_name, city, phone)').eq('id', id).maybeSingle()
  const contract = contractRes.data
  if (!contract) notFound()

  const [invoicesRes, eventsRes, consumptionRes, missionsRes] = await Promise.all([
    supabase.from('billing_invoices').select('*').eq('contract_id', id).order('created_at', { ascending: false }),
    supabase.from('contract_finance_events').select('*').eq('contract_id', id).order('created_at', { ascending: false }).limit(40),
    supabase.from('contract_consumption_logs').select('*').eq('contract_id', id).order('created_at', { ascending: false }).limit(40),
    supabase.from('missions').select('id, mission_code, status, service_type, mission_date, created_at').eq('contract_id', id).eq('is_archived', false).order('created_at', { ascending: false }).limit(20),
  ])

  const warnings = [
    contractRes.error ? `Le contexte du contrat est partiel : ${contractRes.error.message}.` : '',
    invoicesRes.error ? `Les factures ne sont pas disponibles : ${invoicesRes.error.message}.` : '',
    eventsRes.error ? `Les événements financiers ne sont pas disponibles : ${eventsRes.error.message}.` : '',
    consumptionRes.error ? `La consommation n’est pas disponible : ${consumptionRes.error.message}.` : '',
    missionsRes.error ? `Les missions liées ne sont pas disponibles : ${missionsRes.error.message}.` : '',
  ].filter(Boolean)

  const reference = contract.contract_reference || contract.package_label || `Contrat #${contract.id}`

  return (
    <AppShell
      title="Billing 360 — Studio financier du contrat"
      subtitle={`${reference} · facturation, règlement, consommation et preuves financières.`}
      breadcrumbs={[{ label: 'Contrats', href: '/contracts' }, { label: reference, href: `/contracts/${contract.id}` }, { label: 'Activation finance' }]}
      actions={<><PageAction href={`/contracts/${contract.id}`} variant="light">Dossier contrat</PageAction><PageAction href="/billing/activation" variant="light">Control Tower</PageAction><PageAction href="/billing" variant="light">Billing 360</PageAction></>}
    >
      <ContractFinanceStudio
        contract={contract}
        invoices={invoicesRes.data || []}
        events={eventsRes.data || []}
        consumption={consumptionRes.data || []}
        missions={missionsRes.data || []}
        createInvoiceAction={createInvoice}
        markInvoicePaidAction={markInvoicePaid}
        logConsumptionAction={logConsumption}
        dataWarnings={warnings}
      />
    </AppShell>
  )
}

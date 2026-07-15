import { NextResponse } from 'next/server'
import { getInterventionsState } from '@/lib/interventions/repository'
import { formatMad } from '@/lib/interventions/format'

function csvEscape(value: unknown) {
  const text = String(value ?? '')
  return `"${text.replaceAll('"', '""')}"`
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const kind = url.searchParams.get('kind') || 'daily-operations'
  const state = await getInterventionsState()
  const rows = state.orders.map((order) => ({
    reference: order.reference,
    patient: order.patientName,
    ville: order.city,
    zone: order.zone,
    categorie: order.category,
    statut: order.status,
    risque: order.riskLevel,
    montant_mad: formatMad(order.amountMad),
    facturation: order.billingStatus,
    staff: order.assignedStaffIds.length,
  }))
  const header = ['reference','patient','ville','zone','categorie','statut','risque','montant_mad','facturation','staff']
  const csv = [header.join(','), ...rows.map(row => header.map(key => csvEscape((row as any)[key])).join(','))].join('\n')
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="angelcare-interventions-${kind}.csv"`,
      'X-AngelCare-Export-Kind': kind,
    },
  })
}

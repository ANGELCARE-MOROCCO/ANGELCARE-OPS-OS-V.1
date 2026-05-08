import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase7Data } from '@/lib/hr-unified/max-phase7-data'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric } from '../_components/HRMaxUI'

export default async function HRRiskCenterPage() {
  const data = await getHRPhase7Data()
  const docRisks = data.docs.filter((doc: any) => String(doc.verification_status || 'pending') !== 'verified')
  const rows = [
    ...data.conflicts.map((x: any) => ({ ...x, title: x.conflict_type || 'Roster conflict', meta: `${x.severity || 'medium'} • staff ${x.staff_id || '—'}` })),
    ...data.corrections.map((x: any) => ({ ...x, title: x.correction_type || 'Attendance correction', meta: x.reason || 'Attendance correction request' })),
    ...docRisks.map((x: any) => ({ ...x, title: x.title || x.document_type || 'Document risk', meta: `${x.verification_status || 'pending'} • expiry ${x.expiry_date || 'none'}` })),
  ]

  return (
    <AppShell title="HR Risk Center" subtitle="Operational HR risk queue." breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Risk Center' }]} actions={<PageAction href="/hr/operations-console" variant="light">Console</PageAction>}>
      <HRHero title="HR Risk Center" subtitle="Central risk view for roster conflicts, attendance corrections and document verification gaps." />
      <HRGrid min={210}>{data.metrics.slice(2, 6).map((m: any) => <HRMetric key={m.label} {...m} />)}</HRGrid>
      <div style={{ height: 22 }} />
      <HRPanel title="Risk queue" subtitle="Open risks and compliance gaps.">
        {rows.slice(0, 90).map((item: any) => (
          <HRRow key={`${item.id}-${item.title}`} title={item.title} meta={item.meta} status={item.status || item.stage || item.verification_status || 'review'} />
        ))}
      </HRPanel>
    </AppShell>
  )
}

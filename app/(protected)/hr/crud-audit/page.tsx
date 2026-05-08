import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase10Data } from '@/lib/hr-unified/max-phase10-data'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric } from '../_components/HRMaxUI'

export default async function HRCrudAuditPage() {
  const data = await getHRPhase10Data()

  return (
    <AppShell
      title="HR CRUD Audit"
      subtitle="Traceability and mutation audit visibility."
      breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'CRUD Audit' }]}
      actions={<PageAction href="/hr/audit" variant="light">Full Audit</PageAction>}
    >
      <HRHero
        title="HR CRUD Audit"
        subtitle="Mutation visibility for create, update, link and status workflows across the HR module."
      />
      <HRGrid min={210}>{data.metrics.slice(1, 5).map((m: any) => <HRMetric key={m.label} {...m} />)}</HRGrid>
      <div style={{ height: 22 }} />
      <HRPanel title="Recent audit records" subtitle="Latest HR audit log entries.">
        {data.audit.map((item: any) => (
          <HRRow
            key={item.id}
            title={item.action || 'Audit event'}
            meta={`${item.entity_type || 'hr'} • ${item.entity_id || 'no entity'} • ${item.created_at || ''}`}
            status={item.status || 'ok'}
          />
        ))}
      </HRPanel>
    </AppShell>
  )
}

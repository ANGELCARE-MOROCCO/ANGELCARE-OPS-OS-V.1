import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase10Data } from '@/lib/hr-unified/max-phase10-data'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric } from '../_components/HRMaxUI'

export default async function HRLinkedRecordsPage() {
  const data = await getHRPhase10Data()

  return (
    <AppShell
      title="HR Linked Records"
      subtitle="Cross-module HR relationship registry."
      breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Linked Records' }]}
      actions={<PageAction href="/hr/sync-center" variant="light">Sync Center</PageAction>}
    >
      <HRHero
        title="Linked Records Registry"
        subtitle="A relationship layer between staff, candidates, openings, documents, onboarding, tasks and approvals."
      />
      <HRGrid min={210}>{data.metrics.slice(0, 4).map((m: any) => <HRMetric key={m.label} {...m} />)}</HRGrid>
      <div style={{ height: 22 }} />
      <HRPanel title="Relationship records" subtitle="Explicit synchronization links.">
        {data.links.map((link: any) => (
          <HRRow
            key={link.id}
            title={`${link.source_table} → ${link.target_table}`}
            meta={`${link.link_type || 'related'} • source ${link.source_id || '—'} • target ${link.target_id || '—'}`}
            status={link.status || 'active'}
          />
        ))}
      </HRPanel>
    </AppShell>
  )
}

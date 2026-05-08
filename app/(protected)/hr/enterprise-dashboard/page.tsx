import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase11Data } from '@/lib/hr-unified/max-phase11-data'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric, HRButton } from '../_components/HRMaxUI'

export default async function HREnterpriseDashboardPage() {
  const data = await getHRPhase11Data()
  const stream = [...data.timeline.slice(0, 8), ...data.kpis.slice(0, 8), ...data.savedViews.slice(0, 8)]

  return (
    <AppShell
      title="HR Enterprise Dashboard"
      subtitle="Enterprise UX depth and executive operating view."
      breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Enterprise Dashboard' }]}
      actions={<PageAction href="/hr/boardroom" variant="light">Boardroom</PageAction>}
    >
      <HRHero
        title="HR Enterprise Dashboard"
        subtitle="Premium enterprise dashboard for board-level visibility, operating views, KPI drilldowns, activity timeline and action-heavy HR control."
        actions={<><HRButton href="/hr/kpi-drilldowns" variant="blue">KPI Drilldowns</HRButton><HRButton href="/hr/activity-timeline" variant="light">Timeline</HRButton><HRButton href="/hr/saved-views" variant="light">Saved Views</HRButton></>}
      />
      <HRGrid min={210}>{data.metrics.map((m: any) => <HRMetric key={m.label} {...m} />)}</HRGrid>
      <div style={{ height: 22 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 420px', gap: 20 }}>
        <HRPanel title="Enterprise activity stream" subtitle="Timeline events, KPI drilldowns and saved operating views.">
          {stream.map((item: any) => (
            <HRRow
              key={`${item.id}-${item.title}`}
              title={item.title || 'Enterprise item'}
              meta={`${item.event_type || item.metric_area || item.view_type || 'HR'} • ${item.route || item.metric_key || item.entity_type || ''}`}
              status={item.status || item.severity || 'active'}
            />
          ))}
        </HRPanel>
        <HRPanel title="Executive shortcuts" subtitle="Dense corporate control surfaces.">
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              ['/hr/boardroom', 'Boardroom View'],
              ['/hr/kpi-drilldowns', 'KPI Drilldowns'],
              ['/hr/activity-timeline', 'Activity Timeline'],
              ['/hr/saved-views', 'Saved Views'],
              ['/hr/sync-center', 'Sync Center'],
              ['/hr/data-quality', 'Data Quality'],
            ].map(([href, label]) => (
              <a key={href} href={href} style={{ display: 'block', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 14, color: '#0f172a', textDecoration: 'none', fontWeight: 900 }}>{label}</a>
            ))}
          </div>
        </HRPanel>
      </div>
    </AppShell>
  )
}

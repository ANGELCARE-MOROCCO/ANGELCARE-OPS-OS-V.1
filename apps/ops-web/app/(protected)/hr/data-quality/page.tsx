import AppShell from '@/app/components/erp/AppShell'
import { getHRDashboardData } from '@/lib/hr-production/repository'
import { scanHRDataQuality } from '@/lib/hr-production/data-quality'
import { HRCard, HRSection, HRStatusPill, HRTable } from '../_components/HRProductionUI'

export default async function Page() {
  const data = await getHRDashboardData()
  const findings = scanHRDataQuality(data)
  return <AppShell title="HR Data Quality" subtitle="Production checks for missing fields, document risk, attendance validation and roster conflicts." breadcrumbs={[{label:'HR',href:'/hr'},{label:'Data quality'}]}>
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4"><HRCard title="Findings" value={findings.length} /><HRCard title="High" value={findings.filter(f=>f.severity==='high').length} /><HRCard title="Medium" value={findings.filter(f=>f.severity==='medium').length} /><HRCard title="Low" value={findings.filter(f=>f.severity==='low').length} /></div>
      <HRSection title="Quality findings" subtitle="Resolve these before relying on HR for payroll, mission planning or permissions.">
        <HRTable headers={['Issue','Source','Severity','Recommendation']} rows={findings.map((f)=>[f.title, `${f.source_table}${f.source_record_id ? ` • ${f.source_record_id.slice(0,8)}` : ''}`, <HRStatusPill value={f.severity} />, f.recommendation])} />
      </HRSection>
    </div>
  </AppShell>
}

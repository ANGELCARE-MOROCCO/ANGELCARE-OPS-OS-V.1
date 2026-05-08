import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase10Data } from '@/lib/hr-unified/max-phase10-data'
import { createHRDataQualityCheckPhase10, updateHRDataQualityStatusPhase10 } from '@/lib/hr-unified/max-phase10-actions'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric, HRInput, HRSelect, HRTextarea, HRSubmit } from '../_components/HRMaxUI'

export default async function HRDataQualityPage() {
  const data = await getHRPhase10Data()

  return (
    <AppShell
      title="HR Data Quality"
      subtitle="Strict HR data quality and integrity control."
      breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Data Quality' }]}
      actions={<PageAction href="/hr/sync-center" variant="light">Sync Center</PageAction>}
    >
      <HRHero
        title="HR Data Quality Control"
        subtitle="Create and resolve data quality checks for HR records: missing links, incomplete fields, duplicate records and broken operational relationships."
      />
      <HRGrid min={210}>{data.metrics.map((m: any) => <HRMetric key={m.label} {...m} />)}</HRGrid>
      <div style={{ height: 22 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 430px', gap: 20 }}>
        <HRPanel title="Quality check queue" subtitle="Update status directly.">
          {data.qualityChecks.map((check: any) => (
            <div key={check.id} style={{ borderBottom: '1px solid #f1f5f9', padding: '12px 0' }}>
              <HRRow title={check.title || 'Quality check'} meta={`${check.check_type || 'data_integrity'} • ${check.entity_table || 'hr'} • ${check.severity || 'medium'}`} status={check.status || 'open'} />
              <form action={updateHRDataQualityStatusPhase10} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input type="hidden" name="id" value={check.id} />
                <select name="status" defaultValue={check.status || 'open'} style={{ height: 34, borderRadius: 10, border: '1px solid #cbd5e1', fontWeight: 800 }}>
                  {['open', 'in_progress', 'resolved', 'ignored'].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <HRSubmit>Update</HRSubmit>
              </form>
            </div>
          ))}
        </HRPanel>

        <HRPanel title="Create quality check" subtitle="Register a data issue for resolution.">
          <form action={createHRDataQualityCheckPhase10} style={{ display: 'grid', gap: 12 }}>
            <HRInput name="title" label="Check title" required />
            <HRSelect name="check_type" label="Check type" options={['data_integrity', 'missing_link', 'duplicate_record', 'missing_required_field', 'stale_status', 'orphan_record']} />
            <HRSelect name="entity_table" label="Entity table" options={['hr_staff', 'hr_recruitment_candidates', 'hr_job_openings', 'hr_execution_tasks', 'hr_approval_requests', 'hr_staff_documents']} />
            <HRInput name="entity_id" label="Entity ID optional" />
            <HRSelect name="severity" label="Severity" options={['low', 'medium', 'high', 'critical']} />
            <HRTextarea name="finding" label="Finding" />
            <HRTextarea name="recommended_fix" label="Recommended fix" />
            <HRTextarea name="notes" label="Notes" />
            <HRSubmit>Create quality check</HRSubmit>
          </form>
        </HRPanel>
      </div>
    </AppShell>
  )
}

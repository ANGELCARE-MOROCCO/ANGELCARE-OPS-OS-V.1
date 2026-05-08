import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getHRPhase10Data } from '@/lib/hr-unified/max-phase10-data'
import { createHRRecordLinkPhase10, createLinkedHRTaskPhase10 } from '@/lib/hr-unified/max-phase10-actions'
import { HRHero, HRPanel, HRRow, HRGrid, HRMetric, HRInput, HRSelect, HRTextarea, HRSubmit, HRButton } from '../_components/HRMaxUI'

export default async function HRSyncCenterPage() {
  const data = await getHRPhase10Data()
  const stream = [...data.links.slice(0, 10), ...data.syncEvents.slice(0, 10), ...data.qualityChecks.slice(0, 10)]

  return (
    <AppShell
      title="HR Sync Center"
      subtitle="Cross-module synchronization and relationship control."
      breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Sync Center' }]}
      actions={<PageAction href="/hr/linked-records" variant="light">Linked Records</PageAction>}
    >
      <HRHero
        title="HR Synchronization Center"
        subtitle="Phase 10 hardens real synchronization: link candidates, staff, openings, documents, tasks and approvals with audit-safe relationship records."
        actions={<><HRButton href="/hr/linked-records" variant="blue">Linked Records</HRButton><HRButton href="/hr/data-quality" variant="light">Data Quality</HRButton></>}
      />

      <HRGrid min={210}>{data.metrics.map((m: any) => <HRMetric key={m.label} {...m} />)}</HRGrid>

      <div style={{ height: 22 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 430px', gap: 20 }}>
        <HRPanel title="Synchronization stream" subtitle="Recent links, sync events and quality checks.">
          {stream.map((item: any) => (
            <HRRow
              key={`${item.id}-${item.title || item.event_type || item.link_type}`}
              title={item.title || item.summary || item.link_type || 'Sync record'}
              meta={`${item.source_table || item.event_type || item.check_type || 'sync'} • ${item.target_table || item.entity_table || item.created_at || ''}`}
              status={item.status || 'active'}
            />
          ))}
        </HRPanel>

        <HRPanel title="Create record link" subtitle="Create an explicit relationship between two HR records.">
          <form action={createHRRecordLinkPhase10} style={{ display: 'grid', gap: 12 }}>
            <HRSelect name="source_table" label="Source table" options={['hr_staff', 'hr_recruitment_candidates', 'hr_job_openings', 'hr_staff_documents', 'hr_onboarding_steps', 'hr_execution_tasks', 'hr_approval_requests']} />
            <HRInput name="source_id" label="Source ID" />
            <HRSelect name="target_table" label="Target table" options={['hr_execution_tasks', 'hr_approval_requests', 'hr_staff_documents', 'hr_onboarding_steps', 'hr_rosters', 'hr_attendance_corrections']} />
            <HRInput name="target_id" label="Target ID" />
            <HRSelect name="link_type" label="Link type" options={['related', 'followup_task', 'approval_required', 'document_required', 'onboarding_required', 'risk_related']} />
            <HRTextarea name="notes" label="Notes" />
            <HRSubmit>Create link</HRSubmit>
          </form>
        </HRPanel>
      </div>

      <div style={{ height: 22 }} />

      <HRPanel title="Create linked HR task" subtitle="Create a task and optionally link it to an existing HR record.">
        <form action={createLinkedHRTaskPhase10} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
          <HRInput name="title" label="Task title" required />
          <HRSelect name="task_type" label="Task type" options={['linked_followup', 'data_repair', 'approval_followup', 'document_followup', 'onboarding_followup', 'candidate_followup']} />
          <HRSelect name="priority" label="Priority" options={['low', 'medium', 'high', 'urgent']} />
          <HRSelect name="source_table" label="Link source table" options={['hr_staff', 'hr_recruitment_candidates', 'hr_job_openings', 'hr_staff_documents', 'hr_onboarding_steps']} />
          <HRInput name="source_id" label="Link source ID" />
          <HRInput name="related_staff_id" label="Related staff ID" />
          <HRInput name="related_candidate_id" label="Related candidate ID" />
          <HRInput name="related_opening_id" label="Related opening ID" />
          <HRTextarea name="description" label="Description" />
          <HRSubmit>Create linked task</HRSubmit>
        </form>
      </HRPanel>
    </AppShell>
  )
}

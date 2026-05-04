import HrV2CommandWorkspace from '../../../components/hr-v2/HrV2CommandWorkspace'

export default function Page() {
  return (
    <HrV2CommandWorkspace
      title='Manual Workflow Center'
      subtitle='Control step-by-step HR workflows, handoffs, approvals, replacement triggers, and confirmations.'
      module='Workflow Center'
      kpis={[
        { label: 'Open items', value: '24', note: 'Requires operator review' },
        { label: 'Ready', value: '86%', note: 'Operational readiness' },
        { label: 'Alerts', value: '7', note: 'Priority signals' },
        { label: 'Synced', value: 'Live', note: 'Fallback-safe mode' },
      ]}
      primaryActions={[
        { label: 'Create', href: '#', tone: 'primary' },
        { label: 'Bulk Actions', href: '/hr/bulk-actions' },
        { label: 'Export', href: '#' },
        { label: 'Audit', href: '/hr/audit-center' },
      ]}
      rows={[
        { staff: 'Care Operations team', status: 'Active', owner: 'Operations Manager', priority: 'High', target: 'Daily coverage' },
        { staff: 'Core Office Staff', status: 'Pending review', owner: 'HR Manager', priority: 'Medium', target: 'Profiles and documents' },
        { staff: 'Academy / Training', status: 'Controlled', owner: 'Training Manager', priority: 'Medium', target: 'Certification readiness' },
        { staff: 'Revenue / Sales', status: 'Needs follow-up', owner: 'Sales Manager', priority: 'High', target: 'Staff task visibility' },
      ]}
    />
  )
}

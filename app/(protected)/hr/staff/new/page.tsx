import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createStaffRestore } from '@/lib/hr-unified/route-restore-actions'
import { HRHero, HRPanel, HRInput, HRSelect, HRTextarea, HRSubmit, formGrid } from '../../_components/HRMaxUI'

export default function NewStaffPage() {
  return (
    <AppShell
      title="New Staff Profile"
      subtitle="Create staff/caregiver HR profile."
      breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Staff', href: '/hr/staff' }, { label: 'New' }]}
      actions={<PageAction href="/hr/staff" variant="light">Back</PageAction>}
    >
      <HRHero
        title="Create Staff 360 Profile"
        subtitle="Add a staff profile connected to documents, attendance, rosters, performance and tasks."
      />

      <HRPanel title="Staff identity" subtitle="Creates a record in hr_staff.">
        <form action={createStaffRestore} style={{ display: 'grid', gap: 14 }}>
          <div style={formGrid}>
            <HRInput name="full_name" label="Full name" required />
            <HRInput name="phone" label="Phone" />
            <HRInput name="email" label="Email" />
            <HRInput name="department" label="Department" />
            <HRInput name="position" label="Position" />
            <HRInput name="city" label="City" />
            <HRSelect name="status" label="Status" options={['active', 'pending', 'inactive', 'suspended']} />
          </div>

          <HRTextarea name="notes" label="Notes" />
          <HRSubmit>Create staff profile</HRSubmit>
        </form>
      </HRPanel>
    </AppShell>
  )
}

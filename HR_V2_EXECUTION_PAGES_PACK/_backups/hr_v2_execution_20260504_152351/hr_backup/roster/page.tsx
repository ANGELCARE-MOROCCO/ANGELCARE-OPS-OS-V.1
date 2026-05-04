import HRExecutionPage from '../_components/HRExecutionPage'

export default function Page() {
  return <HRExecutionPage kind="roster" title="Monthly Roster" subtitle="Plan and audit all staff duties, shifts, locations and coverage across the month." primaryAction="Create Shift" primaryHref="/hr/roster/new" />
}

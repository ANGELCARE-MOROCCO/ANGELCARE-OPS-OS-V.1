import HRExecutionPage from '../_components/HRExecutionPage'

export default function Page() {
  return <HRExecutionPage kind="positions" title="Position Catalog" subtitle="Manage AngelCare positions, role families, default shifts, missions, KPI expectations and staffing logic." primaryAction="Create Position" primaryHref="/hr/positions/new" />
}

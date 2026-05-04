import HRExecutionPage from '../_components/HRExecutionPage'

export default function Page() {
  return <HRExecutionPage kind="payroll" title="Payroll Preparation" subtitle="Prepare salary inputs, attendance impact, deductions, bonuses, roster hours and payroll readiness." primaryAction="Prepare Payroll" primaryHref="/hr/payroll-prep/new" />
}

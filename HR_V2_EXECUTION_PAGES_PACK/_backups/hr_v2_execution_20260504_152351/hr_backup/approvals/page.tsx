import HRExecutionPage from '../_components/HRExecutionPage'

export default function Page() {
  return <HRExecutionPage kind="approvals" title="HR Approvals" subtitle="Approve leave, role changes, documents, disciplinary closures and HR operational requests." primaryAction="New Approval" primaryHref="/hr/approvals/new" />
}

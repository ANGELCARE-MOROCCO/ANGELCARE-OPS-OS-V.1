import HRExecutionPage from '../_components/HRExecutionPage'

export default function Page() {
  return <HRExecutionPage kind="incidents" title="HR Incidents" subtitle="Review worker incidents, disciplinary actions, severity, closure status and learning loops." primaryAction="Create Incident" primaryHref="/hr/incidents/new" />
}

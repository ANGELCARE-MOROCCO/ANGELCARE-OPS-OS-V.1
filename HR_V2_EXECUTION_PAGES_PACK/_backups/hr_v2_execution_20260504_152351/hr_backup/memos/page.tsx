import HRExecutionPage from '../_components/HRExecutionPage'

export default function Page() {
  return <HRExecutionPage kind="memos" title="Management Memos" subtitle="Create and monitor staff notifications, urgent reminders, management announcements and memo status." primaryAction="Create Memo" primaryHref="/hr/memos/new" />
}

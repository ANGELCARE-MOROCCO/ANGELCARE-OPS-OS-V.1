
import ExecutiveCommandCenter from "./ExecutiveCommandCenter"
import MailboxHealthDashboard from "./MailboxHealthDashboard"
import NotificationCommandCenter from "./NotificationCommandCenter"
import SLAEscalationBoard from "./SLAEscalationBoard"
import AuditTimelineWorkspace from "./AuditTimelineWorkspace"
import QueueRetryOperations from "./QueueRetryOperations"

export default function EnterpriseEmailOSDashboard() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <ExecutiveCommandCenter />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <MailboxHealthDashboard />
          <NotificationCommandCenter />
          <SLAEscalationBoard />
          <QueueRetryOperations />
        </div>
        <AuditTimelineWorkspace />
      </div>
    </main>
  )
}

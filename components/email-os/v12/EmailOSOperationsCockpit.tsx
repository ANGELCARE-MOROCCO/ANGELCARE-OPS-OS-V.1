
import ApprovalWorkflowCenter from "./ApprovalWorkflowCenter"
import RealtimeActivityStream from "./RealtimeActivityStream"
import TeamAssignmentBoard from "./TeamAssignmentBoard"
import QueueRetryOperations from "./QueueRetryOperations"

export default function EmailOSOperationsCockpit() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border bg-white p-6">
          <h1 className="text-2xl font-bold">Email-OS Operations Cockpit</h1>
          <p className="mt-1 text-sm text-slate-500">
            Daily command workspace for approvals, queues, team assignment and live operations.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <ApprovalWorkflowCenter />
          <QueueRetryOperations />
          <TeamAssignmentBoard />
          <RealtimeActivityStream />
        </div>
      </div>
    </main>
  )
}

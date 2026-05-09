"use client"

import ActionToast from "@/components/email-os/click-actions/ActionToast"
import { useEmailOSActionRunner } from "@/lib/email-os/click-actions/use-action-runner"
import MailboxesExecutionWorkspace from "./MailboxesExecutionWorkspace"
import ConfigurationExecutionWorkspace from "./ConfigurationExecutionWorkspace"
import TemplatesExecutionWorkspace from "./TemplatesExecutionWorkspace"
import AutomationExecutionWorkspace from "./AutomationExecutionWorkspace"
import ApprovalsExecutionWorkspace from "./ApprovalsExecutionWorkspace"
import OutboxExecutionWorkspace from "./OutboxExecutionWorkspace"
import AuditExecutionWorkspace from "./AuditExecutionWorkspace"
import AnalyticsExecutionWorkspace from "./AnalyticsExecutionWorkspace"
import RuntimeExecutionWorkspace from "./RuntimeExecutionWorkspace"

export type SubmoduleKind =
  | "mailboxes"
  | "configuration"
  | "templates"
  | "automation"
  | "approvals"
  | "outbox"
  | "audit"
  | "analytics"
  | "runtime"

export default function SubmodulePageShell({ kind }: { kind: SubmoduleKind }) {
  const { run, toast, clearToast } = useEmailOSActionRunner()

  const page =
    kind === "mailboxes" ? <MailboxesExecutionWorkspace run={run} /> :
    kind === "configuration" ? <ConfigurationExecutionWorkspace run={run} /> :
    kind === "templates" ? <TemplatesExecutionWorkspace run={run} /> :
    kind === "automation" ? <AutomationExecutionWorkspace run={run} /> :
    kind === "approvals" ? <ApprovalsExecutionWorkspace run={run} /> :
    kind === "outbox" ? <OutboxExecutionWorkspace run={run} /> :
    kind === "audit" ? <AuditExecutionWorkspace run={run} /> :
    kind === "analytics" ? <AnalyticsExecutionWorkspace run={run} /> :
    <RuntimeExecutionWorkspace run={run} />

  return (
    <div className="min-h-screen bg-slate-50">
      {page}
      <ActionToast toast={toast} onClose={clearToast} />
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button, Icons, MetricCard, Panel, PanelHeader, RowActionMenu, RunAction, StatusPill } from "./SubmoduleKit"

const initialMailboxes = [
  { id: "mbx-ops", name: "Operations Inbox", address: "operations@angelcare.ma", provider: "SMTP/IMAP", status: "Active", unread: 42 },
  { id: "mbx-hr", name: "HR Inbox", address: "hr@angelcare.ma", provider: "SMTP/IMAP", status: "Active", unread: 18 },
  { id: "mbx-finance", name: "Finance Inbox", address: "finance@angelcare.ma", provider: "SMTP/IMAP", status: "Review", unread: 7 },
  { id: "mbx-academy", name: "Academy Sales", address: "academy@angelcare.ma", provider: "SMTP/IMAP", status: "Active", unread: 25 }
]

export default function MailboxesExecutionWorkspace({ run }: { run: RunAction }) {
  const [mailboxes, setMailboxes] = useState(initialMailboxes)

  async function createMailbox() {
    const newBox = {
      id: `mbx-${Date.now()}`,
      name: "New Operational Mailbox",
      address: "new-mailbox@example.com",
      provider: "SMTP/IMAP",
      status: "Active",
      unread: 0
    }
    setMailboxes([newBox, ...mailboxes])
    await run("mailbox.create", { mailboxId: newBox.id, mailboxName: newBox.name, address: newBox.address })
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Mailboxes" value={String(mailboxes.length)} icon={<Icons.Folder className="h-4 w-4" />} />
          <MetricCard label="Unread" value={String(mailboxes.reduce((a, b) => a + b.unread, 0))} icon={<Icons.MailCheck className="h-4 w-4" />} />
          <MetricCard label="Providers" value="SMTP/IMAP" icon={<Icons.Database className="h-4 w-4" />} />
          <MetricCard label="Health" value="Stable" icon={<Icons.CheckCircle2 className="h-4 w-4" />} />
        </div>

        <Panel>
          <PanelHeader
            icon={<Icons.Folder className="h-5 w-5" />}
            title="Mailbox Administration"
            subtitle="Create, sync, pause, delete and govern operational mailboxes."
            action={<Button variant="primary" onClick={createMailbox}><Icons.Plus className="h-4 w-4" /> Create mailbox</Button>}
          />

          <div className="divide-y divide-slate-100">
            {mailboxes.map((mailbox) => (
              <div key={mailbox.id} className="grid grid-cols-[minmax(0,1fr)_180px_120px_260px] items-center gap-4 p-5">
                <div>
                  <div className="font-bold text-slate-950">{mailbox.name}</div>
                  <div className="text-sm text-slate-500">{mailbox.address}</div>
                </div>
                <div className="text-sm text-slate-600">{mailbox.provider}</div>
                <div><StatusPill label={mailbox.status} tone={mailbox.status === "Active" ? "green" : "amber"} /></div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => run("sync.mailbox", { mailboxId: mailbox.id })}><Icons.RefreshCw className="h-4 w-4" /> Sync</Button>
                  <Button variant="secondary" onClick={() => run("mailbox.update", { mailboxId: mailbox.id, data: { status: "paused" } })}>Pause</Button>
                  <Button variant="danger" onClick={() => {
                    setMailboxes(mailboxes.filter((item) => item.id !== mailbox.id))
                    run("mailbox.delete", { mailboxId: mailbox.id })
                  }}><Icons.Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

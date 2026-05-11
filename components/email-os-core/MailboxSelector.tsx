"use client"

type Props = {
  mailboxes: any[]
  selectedMailboxId: string
  onChange: (value: string) => void
}

export function MailboxSelector({
  mailboxes,
  selectedMailboxId,
  onChange
}: Props) {
  return (
    <select
      value={selectedMailboxId}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-slate-300 px-3 py-2"
    >
      {mailboxes.map((mailbox) => (
        <option key={mailbox.id} value={mailbox.id}>
          {mailbox.name} — {mailbox.email_address}
        </option>
      ))}
    </select>
  )
}

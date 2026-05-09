"use client"

import EmailOSV12Shell from "./EmailOSV12Shell"
import LiveStatusStrip from "@/components/email-os/live/LiveStatusStrip"
import { useLiveEmailThreads } from "@/lib/email-os/live/use-live-threads"

type EmailOSPage =
  | "inbox"
  | "threads"
  | "compose"
  | "templates"
  | "automation"
  | "approvals"
  | "outbox"
  | "audit"
  | "configuration"
  | "mailboxes"
  | "analytics"
  | "runtime"
  | "enterprise"

export default function EmailOSV12LiveShell({ initialPage = "inbox" }: { initialPage?: EmailOSPage }) {
  const { loading, error, lastLoadedAt, reload } = useLiveEmailThreads("")

  return (
    <div className="flex h-screen flex-col bg-white">
      <LiveStatusStrip
        loading={loading}
        error={error}
        lastLoadedAt={lastLoadedAt}
        onReload={reload}
      />
      <div className="min-h-0 flex-1">
        <EmailOSV12Shell initialPage={initialPage} />
      </div>
    </div>
  )
}

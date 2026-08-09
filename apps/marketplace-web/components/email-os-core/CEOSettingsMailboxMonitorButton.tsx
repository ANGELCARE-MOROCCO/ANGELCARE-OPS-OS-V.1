"use client"

import Link from "next/link"
import { Activity } from "lucide-react"

function normalize(value: any) { return String(value || "").trim().toLowerCase() }

export function isCeoLikeUser(user: any) {
  const role = normalize(user?.role || user?.profile?.role || user?.app_role || user?.metadata?.role)
  const title = normalize(user?.title || user?.profile?.title || user?.metadata?.title)
  const email = normalize(user?.email || user?.profile?.email)
  if (["ceo", "owner", "founder", "super_admin", "superadmin", "admin_ceo"].includes(role)) return true
  if (title.includes("ceo")) return true
  const publicCeoEmails = String(process.env.NEXT_PUBLIC_EMAIL_OS_CEO_EMAILS || "").split(",").map((item) => normalize(item)).filter(Boolean)
  return Boolean(email && publicCeoEmails.includes(email))
}

export default function CEOSettingsMailboxMonitorButton({ user }: { user?: any }) {
  if (!isCeoLikeUser(user)) return null
  return (
    <Link href="/email-os/mailbox-liveness" className="flex h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-bold text-slate-600 transition hover:bg-violet-50 hover:text-violet-700">
      <Activity className="h-4 w-4 text-violet-600" />
      CEO Mailbox Liveness
    </Link>
  )
}

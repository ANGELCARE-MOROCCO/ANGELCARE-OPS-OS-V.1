"use client"

import { useState } from "react"
import { MailPlus } from "lucide-react"

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } })
  return res.json()
}

export default function MailboxOnboardingPanel() {
  const [form, setForm] = useState({ name: "", emailAddress: "", username: "", passwordRef: "", owner: "operations" })
  const [status, setStatus] = useState("Ready")

  async function submit() {
    const result = await api("/api/email-os/mailbox-onboarding", {
      method: "POST",
      body: JSON.stringify({ ...form, username: form.username || form.emailAddress })
    })
    setStatus(result.ok ? "Mailbox onboarded" : result.error || "Onboarding failed")
    if (result.ok) setForm({ name: "", emailAddress: "", username: "", passwordRef: "", owner: "operations" })
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700"><MailPlus className="h-5 w-5" /></div>
        <div><h2 className="text-lg font-black text-slate-950">Mailbox Onboarding</h2><p className="text-sm text-slate-500">{status}</p></div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {[
          ["name", "Mailbox name"],
          ["emailAddress", "email@angelcare.ma"],
          ["username", "Username, optional"],
          ["passwordRef", "Password reference or temporary password"],
          ["owner", "Owner"]
        ].map(([key, placeholder]) => (
          <input key={key} value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none" />
        ))}
      </div>
      <button onClick={submit} className="mt-5 inline-flex h-10 cursor-pointer items-center rounded-xl bg-slate-950 px-4 text-sm font-bold text-white">Onboard mailbox</button>
    </section>
  )
}

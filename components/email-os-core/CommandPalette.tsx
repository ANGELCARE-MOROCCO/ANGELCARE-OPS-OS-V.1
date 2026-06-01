"use client"

import { useEffect, useState } from "react"
import { Command, Search } from "lucide-react"

type CommandItem = {
  label: string
  hint: string
  action: () => void
}

export default function CommandPalette({ onNavigate }: { onNavigate?: (target: string) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const commands: CommandItem[] = [
    { label: "Open inbox", hint: "Threads workspace", action: () => onNavigate?.("threads") },
    { label: "Compose message", hint: "Send or queue", action: () => onNavigate?.("compose") },
    { label: "Open mailboxes", hint: "Provider sync", action: () => onNavigate?.("mailboxes") },
    { label: "Open outbox", hint: "Queue control", action: () => onNavigate?.("queue") },
    { label: "Open audit", hint: "Operational log", action: () => onNavigate?.("audit") },
    { label: "Open health", hint: "Environment readiness", action: () => onNavigate?.("health") }
  ]

  const filtered = commands.filter((item) =>
    `${item.label} ${item.hint}`.toLowerCase().includes(query.toLowerCase())
  )

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
      >
        <Command className="h-4 w-4" />
        Command
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-slate-950/30 p-6">
      <div className="mt-20 w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search commands..."
            className="h-14 flex-1 bg-transparent text-sm outline-none"
          />
          <button
            onClick={() => setOpen(false)}
            className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500"
          >
            Esc
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {filtered.map((item, index) => (
            <button
              key={`${item.label}-${index}`}
              onClick={() => {
                item.action()
                setOpen(false)
              }}
              className="block w-full cursor-pointer rounded-2xl p-4 text-left hover:bg-slate-50"
            >
              <div className="text-sm font-black text-slate-950">{item.label}</div>
              <div className="mt-1 text-xs text-slate-500">{item.hint}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

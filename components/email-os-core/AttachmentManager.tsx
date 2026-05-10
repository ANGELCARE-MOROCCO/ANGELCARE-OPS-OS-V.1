"use client"

import { useEffect, useState } from "react"
import { Paperclip, Plus } from "lucide-react"

export default function AttachmentManager({ threadId, draftId }: { threadId?: string; draftId?: string }) {
  const [rows, setRows] = useState<any[]>([])
  const [fileName, setFileName] = useState("")

  async function load() {
    const qs = new URLSearchParams()
    if (threadId) qs.set("threadId", threadId)
    if (draftId) qs.set("draftId", draftId)
    const res = await fetch(`/api/email-os/attachments?${qs.toString()}`)
    const json = await res.json()
    setRows(json.data || [])
  }

  async function create() {
    if (!fileName.trim()) return

    await fetch("/api/email-os/attachments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId, draftId, fileName, mimeType: "application/octet-stream" })
    })

    setFileName("")
    await load()
  }

  useEffect(() => { load() }, [threadId, draftId])

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <Paperclip className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-950">Attachment Manager</h2>
          <p className="text-sm text-slate-500">Metadata registry for thread/draft files.</p>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <input
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          placeholder="file-name.pdf"
          className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none"
        />
        <button onClick={create} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-bold text-white">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      <div className="mt-5 space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
            {row.file_name}
          </div>
        ))}
      </div>
    </section>
  )
}

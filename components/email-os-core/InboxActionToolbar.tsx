"use client"

import { Archive, ChevronLeft, Clock3, Folder, MailOpen, MailX, MoreHorizontal, RotateCcw, Star, Tag, Trash2 } from "lucide-react"
import { useState } from "react"

type Props = { selectedId?: string | null; busy?: boolean; trashMode?: boolean; onAction: (action: string) => void }

export default function InboxActionToolbar({ selectedId, busy, trashMode = false, onAction }: Props) {
  const disabled = !selectedId || busy
  const [moreOpen, setMoreOpen] = useState(false)

  const run = (action: string) => {
    setMoreOpen(false)
    onAction(action)
  }

  return (
    <div className="flex items-center gap-4 text-slate-500">
      <button type="button" onClick={() => run("back")} className="rounded-xl p-2 hover:bg-slate-50" title="Back to list"><ChevronLeft className="h-5 w-5" /></button>
      <button type="button" disabled={disabled} onClick={() => run("archive")} className="rounded-xl p-2 hover:bg-slate-50 disabled:opacity-40" title="Archive"><Archive className="h-5 w-5" /></button>
      <button type="button" disabled={disabled} onClick={() => run("delete")} className="rounded-xl p-2 hover:bg-rose-50 disabled:opacity-40" title={trashMode ? "Delete forever" : "Move to Trash"}><Trash2 className="h-5 w-5" /></button>
      <button type="button" disabled={disabled} onClick={() => run("move_folder")} className="rounded-xl p-2 hover:bg-slate-50 disabled:opacity-40" title="Move to folder"><Folder className="h-5 w-5" /></button>
      <button type="button" disabled={disabled} onClick={() => run("tag")} className="rounded-xl p-2 hover:bg-slate-50 disabled:opacity-40" title="Label"><Tag className="h-5 w-5" /></button>
      <button type="button" disabled={disabled} onClick={() => run("mark_read")} className="rounded-xl p-2 hover:bg-slate-50 disabled:opacity-40" title="Mark read"><MailOpen className="h-5 w-5" /></button>
      <button type="button" disabled={disabled} onClick={() => run("star")} className="rounded-xl p-2 hover:bg-amber-50 disabled:opacity-40" title="Star"><Star className="h-5 w-5" /></button>
      <button type="button" disabled={disabled} onClick={() => run("schedule")} className="rounded-xl p-2 hover:bg-slate-50 disabled:opacity-40" title="Schedule follow-up"><Clock3 className="h-5 w-5" /></button>
      <div className="relative">
        <button type="button" disabled={disabled} onClick={() => setMoreOpen((value) => !value)} className="rounded-xl p-2 hover:bg-slate-50 disabled:opacity-40" title="More actions"><MoreHorizontal className="h-5 w-5" /></button>
        {moreOpen ? (
          <div className="absolute right-0 top-10 z-50 w-56 rounded-2xl border border-violet-100 bg-white p-2 text-sm font-black text-slate-700 shadow-2xl">
            <button type="button" onClick={() => run("mark_unread")} className="flex h-10 w-full items-center gap-3 rounded-xl px-3 hover:bg-violet-50"><MailX className="h-4 w-4" />Mark unread</button>
            <button type="button" onClick={() => run("unstar")} className="flex h-10 w-full items-center gap-3 rounded-xl px-3 hover:bg-violet-50"><Star className="h-4 w-4" />Remove star</button>
            <button type="button" onClick={() => run("restore")} className="flex h-10 w-full items-center gap-3 rounded-xl px-3 hover:bg-violet-50"><RotateCcw className="h-4 w-4" />Restore</button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

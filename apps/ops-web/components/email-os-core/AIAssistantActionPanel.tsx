"use client"

import { Calendar, CheckCircle2, Send, Sparkles, Users } from "lucide-react"

type Props = {
  selected?: any
  onReply: () => void
  onMeeting: () => void
  onTask: () => void
  onCrm: () => void
}

export default function AIAssistantActionPanel({ selected, onReply, onMeeting, onTask, onCrm }: Props) {
  const sender = selected?.from_email || "selected contact"
  return (
    <div className="rounded-3xl border border-violet-100 bg-white shadow-sm">
      <div className="flex items-center justify-between rounded-t-3xl bg-violet-100/70 p-5">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-violet-700" />
          <h2 className="font-black text-slate-950">AI Assistant</h2>
        </div>
        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-violet-700">Beta</span>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <div className="mb-3 text-sm font-black text-slate-800">Email Summary</div>
          <p className="text-sm font-semibold leading-6 text-slate-600">
            {sender} sent an operational message requiring AngelCare follow-up and coordination.
          </p>
        </div>

        <div>
          <div className="mb-3 text-sm font-black text-slate-800">Suggested Actions</div>
          <button type="button" onClick={onReply} className="mb-2 flex h-11 w-full items-center gap-3 rounded-xl border border-violet-100 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-violet-50">
            <Send className="h-4 w-4 text-violet-600" />
            Reply with proposal confirmation
          </button>
          <button type="button" onClick={onMeeting} className="mb-2 flex h-11 w-full items-center gap-3 rounded-xl border border-violet-100 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-violet-50">
            <Calendar className="h-4 w-4 text-violet-600" />
            Schedule a meeting
          </button>
          <button type="button" onClick={onTask} className="mb-2 flex h-11 w-full items-center gap-3 rounded-xl border border-violet-100 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-violet-50">
            <CheckCircle2 className="h-4 w-4 text-violet-600" />
            Create a follow-up task
          </button>
          <button type="button" onClick={onCrm} className="mb-2 flex h-11 w-full items-center gap-3 rounded-xl border border-violet-100 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-violet-50">
            <Users className="h-4 w-4 text-violet-600" />
            Add to CRM
          </button>
        </div>
      </div>
    </div>
  )
}

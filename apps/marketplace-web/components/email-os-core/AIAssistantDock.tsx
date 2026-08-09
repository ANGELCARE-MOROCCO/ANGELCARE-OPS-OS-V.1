"use client"

import { useState } from "react"
import { Sparkles, Wand2 } from "lucide-react"

export default function AIAssistantDock() {
  const [subject, setSubject] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)

    const res = await fetch("/api/email-os/ai-assist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        subject,
        tone: "professional"
      })
    })

    const json = await res.json()
    setResult(json.data || null)
    setLoading(false)
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-950">AI Assistant Dock</h2>
          <p className="text-sm text-slate-500">Operational drafting assistance.</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject..."
          className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none"
        />

        <button
          onClick={generate}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white"
        >
          <Wand2 className="h-4 w-4" />
          {loading ? "Generating..." : "Generate suggestion"}
        </button>

        {result ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-black text-slate-950">{result.suggestedSubject}</div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {result.suggestedReply}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}

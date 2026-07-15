"use client"

import { useEffect, useState } from "react"
import { BookmarkPlus, RefreshCw, Search, Sparkles } from "lucide-react"

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } })
  return res.json()
}

export default function SearchOperationsPanel() {
  const [query, setQuery] = useState("")
  const [entity, setEntity] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [saved, setSaved] = useState<any[]>([])
  const [status, setStatus] = useState("Ready")

  async function loadSaved() {
    const result = await api("/api/email-os/saved-searches")
    setSaved(result.data || [])
  }

  async function indexNow() {
    const result = await api("/api/email-os/search/index", { method: "POST" })
    setStatus(result.ok ? `Indexed ${result.data?.indexed || 0} records` : result.error || "Index failed")
  }

  async function runSearch(searchQuery = query) {
    const qs = new URLSearchParams()
    if (searchQuery) qs.set("q", searchQuery)
    if (entity) qs.set("entity", entity)
    const result = await api(`/api/email-os/search?${qs.toString()}`)
    setResults(result.data || [])
    setStatus(result.ok ? `${result.data?.length || 0} results` : result.error || "Search failed")
  }

  async function saveSearch() {
    if (!query.trim()) {
      setStatus("Search query required")
      return
    }

    const result = await api("/api/email-os/saved-searches", {
      method: "POST",
      body: JSON.stringify({
        name: `Search: ${query}`,
        query,
        filters: { entity }
      })
    })

    setStatus(result.ok ? "Search saved" : result.error || "Save failed")
    await loadSaved()
  }

  useEffect(() => { loadSaved() }, [])

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-700">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">Search Intelligence</h2>
              <p className="text-sm text-slate-500">{status}</p>
            </div>
          </div>
          <button onClick={indexNow} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
            <Sparkles className="h-4 w-4" /> Re-index
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search threads, drafts, subjects..."
            className="h-11 min-w-[280px] flex-1 rounded-2xl border border-slate-200 px-3 text-sm outline-none"
          />
          <select value={entity} onChange={(e) => setEntity(e.target.value)} className="h-11 rounded-2xl border border-slate-200 px-3 text-sm font-bold">
            <option value="">All</option>
            <option value="thread">Threads</option>
            <option value="draft">Drafts</option>
          </select>
          <button onClick={() => runSearch()} className="inline-flex h-11 cursor-pointer items-center rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white">Search</button>
          <button onClick={saveSearch} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-bold hover:bg-slate-50">
            <BookmarkPlus className="h-4 w-4" /> Save
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Results</h3>
          <div className="mt-4 space-y-3">
            {results.length === 0 ? <div className="text-sm font-bold text-slate-500">No results yet. Run search or re-index.</div> : null}
            {results.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-black text-slate-950">{item.title || item.entity_id}</div>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-black text-slate-500">{item.entity}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{item.body || "No body"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Saved Searches</h3>
          <div className="mt-4 space-y-3">
            {saved.length === 0 ? <div className="text-sm font-bold text-slate-500">No saved searches.</div> : null}
            {saved.map((item) => (
              <button key={item.id} onClick={() => { setQuery(item.query); runSearch(item.query) }} className="block w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-slate-100">
                <div className="font-black text-slate-950">{item.name}</div>
                <div className="text-sm text-slate-500">{item.query}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

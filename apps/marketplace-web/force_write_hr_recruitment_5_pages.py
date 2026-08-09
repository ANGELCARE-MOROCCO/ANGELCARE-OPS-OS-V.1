from pathlib import Path

ROOT = Path.cwd()

pages = {
    "jobs": ("Jobs Control", "angelcare.recruitment.jobs", "jobs", "Jobs workspace for openings, approvals, publishing readiness and candidate demand.", "Job record", "Hiring Team"),
    "interviews": ("Interview Center", "angelcare.recruitment.interviews", "interviews", "Interview workspace for schedules, evaluators, scoring, feedback and decisions.", "Interview record", "Interview Team"),
    "offers": ("Offers Management", "angelcare.recruitment.offers", "offers", "Offer workspace for approvals, acceptance, compensation packages and onboarding handoff.", "Offer record", "Offer Team"),
    "onboarding-handoff": ("Onboarding Handoff", "angelcare.recruitment.onboarding", "onboarding-handoff", "Onboarding handoff workspace for approved hires, documents, training and operational readiness.", "Onboarding record", "Onboarding Team"),
    "configuration": ("Recruitment Configuration", "angelcare.recruitment.configuration", "configuration", "Configuration workspace for stages, owners, rules, SLAs, scoring and approvals.", "Configuration rule", "Recruitment Admin"),
}

template = '''"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type ItemStatus = "draft" | "active" | "blocked" | "approved" | "completed" | "archived"
type Priority = "critical" | "high" | "normal" | "low"

type RecruitmentItem = {
  id: string
  title: string
  owner: string
  status: ItemStatus
  priority: Priority
  stage: string
  description: string
  score: number
  due: string
  audit: string[]
}

const nav = [
  { label: "Command", href: "/hr/recruitment" },
  { label: "Pipeline", href: "/hr/recruitment/pipeline" },
  { label: "Jobs", href: "/hr/recruitment/jobs" },
  { label: "Candidates", href: "/hr/recruitment/candidates" },
  { label: "Interviews", href: "/hr/recruitment/interviews" },
  { label: "Offers", href: "/hr/recruitment/offers" },
  { label: "Onboarding", href: "/hr/recruitment/onboarding-handoff" },
  { label: "Configuration", href: "/hr/recruitment/configuration" },
]

const initialItems: RecruitmentItem[] = [
  { id: "__AREA__-001", title: "__RECORD__ 1", owner: "__OWNER__ 1", status: "active", priority: "high", stage: "Stage 1", description: "__HERO__", score: 72, due: "This week", audit: ["Created", "Assigned owner"] },
  { id: "__AREA__-002", title: "__RECORD__ 2", owner: "__OWNER__ 2", status: "blocked", priority: "normal", stage: "Stage 2", description: "__HERO__", score: 58, due: "This week", audit: ["Created", "Needs evidence"] },
  { id: "__AREA__-003", title: "__RECORD__ 3", owner: "__OWNER__ 3", status: "approved", priority: "high", stage: "Stage 3", description: "__HERO__", score: 81, due: "Tomorrow", audit: ["Created", "Approved"] },
  { id: "__AREA__-004", title: "__RECORD__ 4", owner: "__OWNER__ 4", status: "active", priority: "critical", stage: "Fast Track", description: "__HERO__", score: 89, due: "Today", audit: ["Created", "Escalated"] },
]

const styles: Record<string, React.CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: 22, padding: 24, background: "#f8fafc", color: "#0f172a", minHeight: "100vh" },
  hero: { display: "grid", gridTemplateColumns: "1fr auto", gap: 18, padding: 30, borderRadius: 32, color: "white", background: "linear-gradient(135deg,#0f172a,#4338ca 60%,#0284c7)", boxShadow: "0 28px 80px rgba(15,23,42,.25)" },
  eyebrow: { width: "fit-content", borderRadius: 999, padding: "8px 12px", background: "rgba(255,255,255,.14)", fontSize: 12, fontWeight: 900 },
  title: { fontSize: 40, margin: "12px 0 8px", lineHeight: 1.05 },
  subtitle: { maxWidth: 900, lineHeight: 1.75, opacity: .92 },
  heroActions: { display: "flex", gap: 10, alignItems: "center" },
  heroButton: { textDecoration: "none", color: "#0f172a", background: "white", borderRadius: 16, padding: "12px 15px", fontWeight: 900 },
  nav: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10 },
  navItem: { textDecoration: "none", color: "#172554", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 16, padding: "12px", fontWeight: 900, textAlign: "center" },
  kpis: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 },
  kpi: { background: "white", border: "1px solid #e2e8f0", borderRadius: 20, padding: 18, boxShadow: "0 12px 30px rgba(15,23,42,.06)", display: "flex", flexDirection: "column", gap: 7 },
  grid: { display: "grid", gridTemplateColumns: "300px 1fr 320px", gap: 16, alignItems: "start" },
  rail: { background: "white", border: "1px solid #e2e8f0", borderRadius: 26, padding: 18, display: "flex", flexDirection: "column", gap: 12, position: "sticky", top: 16 },
  workspace: { background: "white", border: "1px solid #e2e8f0", borderRadius: 26, padding: 18, display: "flex", flexDirection: "column", gap: 14 },
  detail: { background: "white", border: "1px solid #e2e8f0", borderRadius: 26, padding: 18, display: "flex", flexDirection: "column", gap: 12, position: "sticky", top: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 900 },
  input: { border: "1px solid #cbd5e1", borderRadius: 14, padding: "12px 13px", color: "#0f172a", background: "white" },
  primary: { border: 0, borderRadius: 14, padding: "12px 14px", background: "#2563eb", color: "white", fontWeight: 900 },
  action: { border: 0, borderRadius: 14, padding: "12px 14px", background: "#111827", color: "white", fontWeight: 900 },
  filters: { display: "grid", gridTemplateColumns: "1fr 190px", gap: 10 },
  cards: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 },
  card: { border: "1px solid #e2e8f0", borderRadius: 20, padding: 15, background: "#f8fafc", display: "flex", flexDirection: "column", gap: 8, cursor: "pointer" },
  cardTop: { display: "flex", gap: 8, alignItems: "center" },
  progress: { height: 9, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" },
  cardActions: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 },
  detailActions: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  audit: { padding: 9, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" },
  log: { display: "flex", flexDirection: "column", gap: 7, maxHeight: 220, overflow: "auto", fontSize: 12 },
}

export default function RecruitmentSubpage() {
  const [items, setItems] = useState<RecruitmentItem[]>(initialItems)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<ItemStatus | "all">("all")
  const [selected, setSelected] = useState<string[]>([])
  const [active, setActive] = useState(initialItems[0]?.id || "")
  const [log, setLog] = useState<string[]>(["__TITLE__ workspace initialized", "Execution controls ready"])
  const [title, setTitle] = useState("New __RECORD__")
  const [owner, setOwner] = useState("__OWNER__")

  const activeItem = items.find((item) => item.id === active) || items[0]

  useEffect(() => {
    const saved = window.localStorage.getItem("__STORAGE__")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setItems(parsed)
      } catch {}
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem("__STORAGE__", JSON.stringify(items))
  }, [items])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return items.filter((item) => {
      const okStatus = status === "all" || item.status === status
      const body = `${item.title} ${item.owner} ${item.priority} ${item.stage} ${item.description}`.toLowerCase()
      return okStatus && (!q || body.includes(q))
    })
  }, [items, query, status])

  function push(message: string) {
    setLog((prev) => [`${new Date().toLocaleTimeString()} - ${message}`, ...prev].slice(0, 18))
  }

  async function exec(action: string, payload: Record<string, unknown>) {
    push(`Executing ${action}`)
    try {
      await fetch("/api/hr/recruitment/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area: "__AREA__", action, payload }),
      })
    } catch {
      push(`API fallback: ${action} handled locally`)
    }
  }

  function createItem() {
    const item: RecruitmentItem = {
      id: `__AREA__-${Date.now()}`,
      title,
      owner,
      status: "active",
      priority: "high",
      stage: "New",
      description: "Created from __TITLE__ workspace",
      score: 60,
      due: "This week",
      audit: ["Created locally"],
    }
    setItems((prev) => [item, ...prev])
    setActive(item.id)
    exec("create", item)
    push(`Created ${item.title}`)
  }

  function updateStatus(id: string, next: ItemStatus) {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, status: next, audit: [`Status changed to ${next}`, ...item.audit] } : item))
    exec("status", { id, next })
  }

  function updateScore(id: string, delta: number) {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, score: Math.max(0, Math.min(100, item.score + delta)), audit: [`Score adjusted by ${delta}`, ...item.audit] } : item))
    exec("score", { id, delta })
  }

  function bulkAction(next: ItemStatus) {
    setItems((prev) => prev.map((item) => selected.includes(item.id) ? { ...item, status: next, audit: [`Bulk moved to ${next}`, ...item.audit] } : item))
    exec("bulk", { selected, next })
    push(`${selected.length} records moved to ${next}`)
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <div style={styles.eyebrow}>Recruitment - __TITLE__</div>
          <h1 style={styles.title}>__TITLE__</h1>
          <p style={styles.subtitle}>__HERO__</p>
        </div>
        <div style={styles.heroActions}>
          <Link href="/hr/recruitment" style={styles.heroButton}>Recruitment command</Link>
          <Link href="/hr/recruitment/configuration" style={styles.heroButton}>Configuration</Link>
        </div>
      </section>

      <section style={styles.nav}>
        {nav.map((item) => (
          <Link href={item.href} key={item.href} style={styles.navItem}>{item.label}</Link>
        ))}
      </section>

      <section style={styles.kpis}>
        <Kpi label="Records" value={items.length} />
        <Kpi label="Active" value={items.filter((i) => i.status === "active").length} />
        <Kpi label="Blocked" value={items.filter((i) => i.status === "blocked").length} />
        <Kpi label="Completed" value={items.filter((i) => i.status === "completed").length} />
        <Kpi label="Selected" value={selected.length} />
      </section>

      <section style={styles.grid}>
        <aside style={styles.rail}>
          <h2>Create __TITLE__ item</h2>
          <div style={styles.field}>
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input} />
          </div>
          <div style={styles.field}>
            <label>Owner</label>
            <input value={owner} onChange={(e) => setOwner(e.target.value)} style={styles.input} />
          </div>
          <button type="button" onClick={createItem} style={styles.primary}>Create record</button>
          <h2>Bulk controls</h2>
          <button type="button" onClick={() => bulkAction("approved")} style={styles.action}>Approve selected</button>
          <button type="button" onClick={() => bulkAction("completed")} style={styles.action}>Complete selected</button>
          <button type="button" onClick={() => bulkAction("archived")} style={styles.action}>Archive selected</button>
        </aside>

        <section style={styles.workspace}>
          <div style={styles.filters}>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search records..." style={styles.input} />
            <select value={status} onChange={(e) => setStatus(e.target.value as ItemStatus | "all")} style={styles.input}>
              {["all", "draft", "active", "blocked", "approved", "completed", "archived"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div style={styles.cards}>
            {filtered.map((item) => (
              <article key={item.id} style={styles.card} onClick={() => setActive(item.id)}>
                <div style={styles.cardTop}>
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={(e) => {
                      e.stopPropagation()
                      setSelected((prev) => prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id])
                    }}
                  />
                  <b>{item.title}</b>
                </div>
                <p>{item.description}</p>
                <span>{item.owner} - {item.priority} - {item.status}</span>
                <div style={styles.progress}>
                  <div style={{ height: "100%", width: `${item.score}%`, background: "#2563eb" }} />
                </div>
                <div style={styles.cardActions}>
                  <button type="button" onClick={(e) => { e.stopPropagation(); updateScore(item.id, 5) }}>Improve</button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); updateStatus(item.id, "approved") }}>Approve</button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); updateStatus(item.id, "completed") }}>Complete</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside style={styles.detail}>
          {activeItem && (
            <>
              <h2>{activeItem.title}</h2>
              <p>{activeItem.description}</p>
              <b>{activeItem.status} - {activeItem.priority}</b>
              <div style={styles.detailActions}>
                <button onClick={() => updateStatus(activeItem.id, "active")}>Activate</button>
                <button onClick={() => updateStatus(activeItem.id, "blocked")}>Block</button>
                <button onClick={() => updateStatus(activeItem.id, "completed")}>Complete</button>
                <button onClick={() => updateScore(activeItem.id, 10)}>Boost score</button>
              </div>
              <h3>Audit</h3>
              {activeItem.audit.map((a, i) => <span key={`${a}-${i}`} style={styles.audit}>{a}</span>)}
            </>
          )}
          <h3>Execution log</h3>
          <div style={styles.log}>
            {log.map((entry, index) => <span key={`${entry}-${index}`}>{entry}</span>)}
          </div>
        </aside>
      </section>
    </main>
  )
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <article style={styles.kpi}>
      <b style={{ fontSize: 28 }}>{value}</b>
      <span>{label}</span>
    </article>
  )
}
'''

for slug, (title, storage, area, hero, record, owner) in pages.items():
    content = template
    for key, value in {
        "__TITLE__": title,
        "__STORAGE__": storage,
        "__AREA__": area,
        "__HERO__": hero,
        "__RECORD__": record,
        "__OWNER__": owner,
    }.items():
        content = content.replace(key, value)
    path = ROOT / f"app/(protected)/hr/recruitment/{slug}/page.tsx"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)
    print("wrote", path)

print("DONE")

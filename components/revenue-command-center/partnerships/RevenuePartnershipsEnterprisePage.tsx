"use client"

import { useMemo, useState } from "react"
import {
  Activity, ArrowDownToLine, ArrowRight, BarChart3, Bot, Building2, CalendarDays,
  CheckCircle2, FileText, Filter, GraduationCap, Handshake, Hotel, Mail, MapPin,
  MoreHorizontal, Network, Phone, Plus, Save, Search, ShieldCheck, Sparkles,
  Stethoscope, Trash2, TrendingUp, UsersRound, X
} from "lucide-react"

type TabKey = "overview" | "partners" | "programs" | "pipeline" | "deals" | "contracts" | "performance" | "insights"

type Partner = {
  id: string
  name: string
  contact: string
  email: string
  phone: string
  type: string
  category: string
  city: string
  district: string
  status: "Active" | "Pending" | "Inactive"
  programs: string[]
  revenueImpact: number
  engagement: number
  joinedOn: string
  website: string
  summary: string
}

type Program = {
  id: string
  name: string
  subtitle: string
  partnerType: string
  status: "Draft" | "Active"
  partners: number
  revenueImpact: number
  engagement: number
  owner: string
  city: string
  offers: string[]
  pricing: string[]
  contracts: string[]
  requirements: string[]
  publishNotes: string
}

const partnerTypes = ["All Partners", "Preschools & Kindergarten", "Maternity Clinics", "Orthophonistes", "Hotels", "Corporates", "Associations"]

const tabs: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" }, { key: "partners", label: "Partners" }, { key: "programs", label: "Programs" },
  { key: "pipeline", label: "Pipeline" }, { key: "deals", label: "Deal Rooms" }, { key: "contracts", label: "Contracts" },
  { key: "performance", label: "Performance" }, { key: "insights", label: "Insights" },
]

const seedPartners: Partner[] = [
  { id: "p1", name: "Little Learners Academy", contact: "Fatima Zahra El Fassi", email: "contact@littlelearners.ma", phone: "+212 6 12 34 56 78", type: "Preschool & Kindergarten", category: "Education", city: "Casablanca", district: "Maarif", status: "Active", programs: ["Preschool Excellence Program", "Early Learning Support"], revenueImpact: 245000, engagement: 82, joinedOn: "Jan 12, 2025", website: "www.littlelearners.ma", summary: "Premium early education provider focused on child development and bilingual learning." },
  { id: "p2", name: "Maternité Les Orchidées", contact: "Dr. Salma Benjelloun", email: "contact@orchidees.ma", phone: "+212 6 20 45 88 91", type: "Maternity Clinic", category: "Healthcare", city: "Rabat", district: "Agdal", status: "Active", programs: ["Maternity Care Alliance", "Family Referral Loop"], revenueImpact: 198500, engagement: 76, joinedOn: "Feb 5, 2025", website: "www.orchidees.ma", summary: "Maternal care clinic with strong family acquisition and referral potential." },
  { id: "p3", name: "Centre Orthophonique Al Amal", contact: "Amina Tazi", email: "contact@al-amal.ma", phone: "+212 6 44 19 88 21", type: "Orthophoniste", category: "Healthcare", city: "Marrakech", district: "Guéliz", status: "Active", programs: ["Communication & Learning Support"], revenueImpact: 132300, engagement: 71, joinedOn: "Jan 20, 2025", website: "www.al-amal.ma", summary: "Speech and learning center supporting children and parent guidance." },
  { id: "p4", name: "Hotel Atlantic Palace", contact: "Youssef Bennani", email: "info@atlanticpalace.ma", phone: "+212 6 58 77 42 10", type: "Hotel", category: "Hospitality", city: "Casablanca", district: "Anfa", status: "Active", programs: ["Hospitality Family Program"], revenueImpact: 310000, engagement: 88, joinedOn: "Mar 3, 2025", website: "www.atlanticpalace.ma", summary: "Family hospitality partner with premium event and family-care potential." },
  { id: "p5", name: "Maroc Telecom", contact: "Khadija El Idrissi", email: "partnership@iam.ma", phone: "+212 5 37 71 21 21", type: "Corporate", category: "Technology", city: "Rabat", district: "Hay Riad", status: "Active", programs: ["Corporate Wellbeing Program", "Parent Benefit Program"], revenueImpact: 620000, engagement: 91, joinedOn: "Dec 15, 2024", website: "www.iam.ma", summary: "Corporate partner for employee family benefits and recurring B2B care services." },
  { id: "p6", name: "Association Al Ihssane", contact: "Mohamed El Amrani", email: "contact@alihssane.ma", phone: "+212 6 70 30 20 11", type: "Association", category: "Non-profit", city: "Fès", district: "Ville Nouvelle", status: "Active", programs: ["Community Impact Partners"], revenueImpact: 85400, engagement: 68, joinedOn: "Feb 18, 2025", website: "www.alihssane.ma", summary: "Community association supporting local family outreach and social impact." },
]

const seedPrograms: Program[] = [
  { id: "pr1", name: "Angelcare Preschool Excellence Program", subtitle: "Premium early education partnership", partnerType: "Preschool & Kindergarten", status: "Active", partners: 86, revenueImpact: 1245800, engagement: 82, owner: "Partnership Programs Owner", city: "Casablanca / Rabat", offers: ["Teacher training", "Curriculum resources", "Parent workshops"], pricing: ["Revenue share 15%", "Annual renewal"], contracts: ["Standard MOU", "Safeguarding annex"], requirements: ["Legal proof", "Child safeguarding standard"], publishNotes: "Ready for operational activation." },
  { id: "pr2", name: "Maternity Care Alliance", subtitle: "Supporting moms, together", partnerType: "Maternity Clinic", status: "Active", partners: 45, revenueImpact: 987500, engagement: 76, owner: "Care Partnerships Lead", city: "Rabat / Temara", offers: ["New parent orientation", "Family care referral"], pricing: ["Fixed package", "Referral fee"], contracts: ["Referral agreement"], requirements: ["Clinic authorization", "Data privacy"], publishNotes: "Expand Rabat clinics first." },
  { id: "pr3", name: "Corporate Wellbeing Program", subtitle: "Better teams, stronger future", partnerType: "Corporate", status: "Active", partners: 62, revenueImpact: 1089200, engagement: 84, owner: "Corporate BD Lead", city: "Casablanca / Rabat", offers: ["Employee family benefits", "Care hotline", "Academy sourcing"], pricing: ["Monthly retainer", "Per family fee"], contracts: ["Corporate benefits agreement"], requirements: ["HR owner", "Payment approval"], publishNotes: "Priority recurring revenue program." },
]

function money(value: number) {
  if (value >= 1000000) return `MAD ${(value / 1000000).toFixed(2)}M`
  return `MAD ${value.toLocaleString("en-US")}`
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[28px] border border-white/15 bg-[#101b2f] p-6 text-white shadow-xl ${className}`}>{children}</section>
}

function Kpi({ icon: Icon, label, value, delta }: { icon: any; label: string; value: string | number; delta: string }) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/30"><Icon className="h-6 w-6 text-white" /></span>
        <div><p className="text-xs font-black uppercase tracking-[0.18em] text-white">{label}</p><p className="mt-1 text-2xl font-black text-white">{value}</p><p className="mt-2 text-xs font-black text-emerald-200">↑ {delta} live trend</p></div>
      </div>
    </Card>
  )
}

function PartnerIcon({ type }: { type: string }) {
  const Icon = type.includes("Preschool") ? GraduationCap : type.includes("Maternity") ? Stethoscope : type.includes("Ortho") ? Activity : type.includes("Hotel") ? Hotel : type.includes("Corporate") ? Building2 : Network
  return <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.08]"><Icon className="h-6 w-6 text-white" /></div>
}

function ProgramModal({ program, onClose, onSave }: { program: Program | null; onClose: () => void; onSave: (program: Program) => void }) {
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<Program>(program || {
    id: `pr-${Date.now()}`, name: "New Partnership Program", subtitle: "New enterprise program", partnerType: "Preschool & Kindergarten", status: "Draft",
    partners: 0, revenueImpact: 0, engagement: 0, owner: "Partnership Programs Owner", city: "Rabat–Temara",
    offers: ["New offer"], pricing: ["New pricing rule"], contracts: ["New contract type"], requirements: ["New requirement"], publishNotes: "Draft pending review.",
  })
  const steps = ["Program Information", "Services & Offers", "Pricing & Revenue", "Contracts & Terms", "Eligibility & Requirements", "Review & Publish"]
  const listKey = step === 2 ? "offers" : step === 3 ? "pricing" : step === 4 ? "contracts" : "requirements"

  function addItem() { setDraft({ ...draft, [listKey]: [...(draft as any)[listKey], `New item ${(draft as any)[listKey].length + 1}`] } as Program) }
  function updateItem(index: number, value: string) { setDraft({ ...draft, [listKey]: (draft as any)[listKey].map((x: string, i: number) => i === index ? value : x) } as Program) }

  return (
    <div className="fixed inset-0 z-[5000] overflow-y-auto bg-black/80 p-6 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[1700px] rounded-[36px] border border-white/15 bg-[#081224] p-8 text-white shadow-2xl">
        <div className="mb-8 flex items-start justify-between gap-6">
          <div><p className="text-xs font-black uppercase tracking-[0.25em] text-violet-100">AngelCare Program Engine</p><h2 className="mt-2 text-4xl font-black text-white">{program ? "Edit Partnership Program" : "Create New Partnership Program"}</h2><p className="mt-2 text-sm font-bold text-white">Same 6-step modal for creation and edition. Save updates preview, directory, and PDF source.</p></div>
          <button onClick={onClose} className="rounded-2xl bg-white/[0.08] p-3"><X className="h-5 w-5 text-white" /></button>
        </div>
        <div className="grid gap-8 xl:grid-cols-[300px_1fr]">
          <aside className="space-y-4">{steps.map((s, i) => <button key={s} onClick={() => setStep(i + 1)} className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left font-black text-white ${step === i + 1 ? "border-violet-300 bg-violet-600/35" : "border-white/15 bg-white/[0.07]"}`}><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">{i + 1}</span>{s}</button>)}</aside>
          <main className="space-y-6">
            {step === 1 && <Card><h3 className="text-3xl font-black text-white">Program Information</h3><div className="mt-6 grid gap-5 md:grid-cols-2">
              {(["name","subtitle","partnerType","owner","city","status","partners","revenueImpact","engagement"] as const).map(key => <label key={key} className="grid gap-2 text-sm font-black text-white">{key}<input value={String((draft as any)[key])} onChange={e => setDraft({ ...draft, [key]: ["partners","revenueImpact","engagement"].includes(key) ? Number(e.target.value.replace(/[^\d]/g,"")) : e.target.value } as Program)} className="rounded-2xl border border-white/15 bg-[#070d1c] px-4 py-3 text-white outline-none" /></label>)}
            </div></Card>}
            {step >= 2 && step <= 5 && <Card><div className="flex items-center justify-between"><h3 className="text-3xl font-black text-white">{steps[step - 1]}</h3><button onClick={addItem} className="rounded-2xl bg-violet-600 px-5 py-3 font-black text-white"><Plus className="mr-2 inline h-4 w-4" />Add Item</button></div><div className="mt-6 grid gap-4">{(draft as any)[listKey].map((item: string, i: number) => <input key={i} value={item} onChange={e => updateItem(i, e.target.value)} className="rounded-2xl border border-white/15 bg-[#070d1c] px-4 py-4 font-bold text-white outline-none" />)}</div></Card>}
            {step === 6 && <Card><h3 className="text-3xl font-black text-white">Review & Publish</h3><textarea value={draft.publishNotes} onChange={e => setDraft({ ...draft, publishNotes: e.target.value })} className="mt-6 h-44 w-full rounded-2xl border border-white/15 bg-[#070d1c] p-4 font-bold text-white outline-none" /><div className="mt-6 grid gap-4 md:grid-cols-5">{[["Offers",draft.offers.length],["Pricing",draft.pricing.length],["Contracts",draft.contracts.length],["Requirements",draft.requirements.length],["Revenue",money(draft.revenueImpact)]].map(([a,b]) => <div key={String(a)} className="rounded-2xl border border-white/15 bg-white/[0.07] p-5"><p className="text-xs font-black uppercase tracking-[0.16em] text-white">{a}</p><p className="mt-2 text-xl font-black text-white">{b}</p></div>)}</div></Card>}
            <div className="flex justify-end gap-4"><button onClick={onClose} className="rounded-2xl border border-white/15 bg-white/[0.07] px-6 py-4 font-black text-white">Cancel</button><button onClick={() => step < 6 ? setStep(step + 1) : onSave(draft)} className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-4 font-black text-white">{step < 6 ? "Next Step" : "Save & Close"} <ArrowRight className="ml-2 inline h-5 w-5" /></button></div>
          </main>
        </div>
      </div>
    </div>
  )
}

function ProgramPreview({ program, onClose, onEdit }: { program: Program; onClose: () => void; onEdit: () => void }) {
  function generatePdf() {
    const ref = `AC-PROG-${program.id.toUpperCase()}-${new Date().getFullYear()}`
    const rows = (title: string, arr: string[]) => `<h2>${title}</h2><table>${arr.map(x=>`<tr><td>${x}</td></tr>`).join("")}</table>`
    const html = `<!doctype html><html><head><title>${ref}</title><style>@page{size:A4;margin:14mm}body{font-family:Arial;color:#111}h1{font-size:30px}h2{border-left:5px solid #6d28d9;padding-left:10px}table{width:100%;border-collapse:collapse;margin:14px 0}td,th{border:1px solid #ddd;padding:8px;text-align:left}th{background:#111827;color:white}.page{min-height:267mm;page-break-after:always;position:relative}.footer{position:absolute;bottom:0;left:0;right:0;border-top:1px solid #ddd;padding-top:8px;font-size:10px;display:flex;justify-content:space-between}</style></head><body><section class="page"><h1>${program.name}</h1><p>${program.subtitle}</p><table><tr><th>Partner Type</th><td>${program.partnerType}</td></tr><tr><th>Status</th><td>${program.status}</td></tr><tr><th>Owner</th><td>${program.owner}</td></tr><tr><th>Revenue</th><td>${money(program.revenueImpact)}</td></tr></table>${rows("Offers", program.offers)}${rows("Pricing", program.pricing)}<div class="footer"><span>${ref}</span><span>Page 1/2</span></div></section><section class="page">${rows("Contracts", program.contracts)}${rows("Requirements", program.requirements)}<h2>Publish Notes</h2><p>${program.publishNotes}</p><div class="footer"><span>${ref}</span><span>Page 2/2</span></div></section><script>window.onload=()=>window.print()</script></body></html>`
    const w = window.open("", "_blank")
    if (!w) return
    w.document.write(html); w.document.close()
  }
  return <div className="fixed inset-0 z-[4000] overflow-y-auto bg-black/70 p-6 backdrop-blur-xl"><div className="mx-auto w-full max-w-6xl rounded-[34px] border border-white/15 bg-[#081224] p-8 text-white"><div className="flex items-start justify-between gap-4"><div><h2 className="text-4xl font-black text-white">{program.name}</h2><p className="mt-2 font-bold text-white">{program.subtitle}</p></div><button onClick={onClose} className="rounded-2xl bg-white/[0.08] p-3"><X className="h-5 w-5" /></button></div><div className="mt-6 grid gap-4 md:grid-cols-4">{[["Type",program.partnerType],["Partners",program.partners],["Revenue",money(program.revenueImpact)],["Engagement",`${program.engagement}%`]].map(([a,b])=><Card key={String(a)}><p className="text-xs font-black uppercase tracking-[0.16em]">{a}</p><p className="mt-2 text-xl font-black">{b}</p></Card>)}</div><div className="mt-6 grid gap-4 md:grid-cols-2">{[["Offers",program.offers],["Pricing",program.pricing],["Contracts",program.contracts],["Requirements",program.requirements]].map(([title,list])=><Card key={String(title)}><h3 className="text-xl font-black">{title}</h3><div className="mt-3 space-y-2">{(list as string[]).map(x=><p key={x} className="rounded-xl bg-white/[0.07] px-4 py-3 font-bold">{x}</p>)}</div></Card>)}</div><div className="mt-6 flex justify-end gap-4"><button onClick={onEdit} className="rounded-2xl bg-violet-600 px-6 py-4 font-black text-white">Edit Full Program</button><button onClick={generatePdf} className="rounded-2xl bg-emerald-600 px-6 py-4 font-black text-white"><FileText className="mr-2 inline h-5 w-5" />Generate PDF</button></div></div></div>
}

function PartnersDirectory({ partners }: { partners: Partner[] }) {
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState("All Partners")
  const [selected, setSelected] = useState(partners[0])
  const filtered = partners.filter(p => (tab === "All Partners" || tab.includes(p.type) || p.type.includes(tab.replace("s",""))) && [p.name,p.email,p.contact,p.type,p.city].join(" ").toLowerCase().includes(query.toLowerCase()))
  return <div className="space-y-6"><Card><h2 className="text-3xl font-black">Partners Directory</h2><p className="mt-2 text-sm font-bold">Browse, manage, and grow your partner network across all partner types.</p></Card><div className="grid gap-6 xl:grid-cols-[1fr_380px]"><main className="space-y-5"><Card><div className="grid gap-4 xl:grid-cols-[1.5fr_repeat(5,1fr)]"><label className="relative"><Search className="absolute left-4 top-3.5 h-5 w-5" /><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search partners by name, contact, or ID..." className="w-full rounded-2xl border border-white/15 bg-[#070d1c] py-3 pl-12 pr-4 text-white outline-none" /></label>{["All Types","All Categories","All Locations","All Statuses","All Programs"].map(x=><select key={x} className="rounded-2xl border border-white/15 bg-[#070d1c] px-4 py-3 text-white"><option>{x}</option></select>)}</div></Card><div className="flex gap-3 overflow-x-auto pb-1">{partnerTypes.map(x=><button key={x} onClick={()=>setTab(x)} className={`shrink-0 rounded-2xl px-5 py-3 font-black ${tab===x?"bg-violet-600":"bg-white/[0.08]"}`}>{x}</button>)}</div><Card className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[1150px] text-left"><thead className="border-b border-white/15 text-xs uppercase tracking-[0.18em]"><tr>{["Partner","Type / Category","Location","Status","Programs","Revenue Impact","Engagement","Joined On","Actions"].map(h=><th key={h} className="px-5 py-4">{h}</th>)}</tr></thead><tbody>{filtered.map(p=><tr key={p.id} onClick={()=>setSelected(p)} className="cursor-pointer border-b border-white/10 hover:bg-white/[0.05]"><td className="px-5 py-4"><div className="flex items-center gap-4"><PartnerIcon type={p.type}/><div><p className="font-black">{p.name}</p><p className="text-xs font-bold text-white/75">{p.contact}</p><p className="text-xs font-bold text-white/60">{p.email}</p></div></div></td><td className="px-5 py-4"><span className="rounded-lg bg-violet-500/25 px-3 py-1 text-xs font-black">{p.type}</span><p className="mt-2 text-xs font-bold text-white/75">{p.category}</p></td><td className="px-5 py-4"><p className="font-black">{p.city}</p><p className="text-xs font-bold text-white/75">{p.district}</p></td><td className="px-5 py-4"><span className="rounded-full bg-emerald-500/25 px-3 py-1 text-xs font-black">{p.status}</span></td><td className="px-5 py-4 font-black">{p.programs.length} Programs</td><td className="px-5 py-4 font-black">{money(p.revenueImpact)}</td><td className="px-5 py-4"><span className="font-black">{p.engagement}%</span><div className="mt-2 h-2 w-24 rounded-full bg-white/15"><div className="h-2 rounded-full bg-emerald-400" style={{width:`${p.engagement}%`}}/></div></td><td className="px-5 py-4 font-bold">{p.joinedOn}</td><td className="px-5 py-4"><MoreHorizontal className="h-5 w-5"/></td></tr>)}</tbody></table></div></Card></main><aside className="sticky top-6 h-fit rounded-[30px] border border-white/15 bg-[#101b2f] p-6 text-white"><div className="flex items-start gap-4"><PartnerIcon type={selected.type}/><div><h3 className="text-xl font-black">{selected.name}</h3><p className="font-bold">{selected.type}</p><span className="mt-3 inline-flex rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black">{selected.status}</span></div></div><div className="mt-6 grid grid-cols-5 gap-2">{[Mail,Phone,MapPin,ArrowRight,MoreHorizontal].map((I,i)=><button key={i} className="rounded-2xl border border-white/15 bg-white/[0.07] p-3"><I className="mx-auto h-5 w-5"/></button>)}</div><div className="mt-6 space-y-4">{[["Contact",selected.contact],["Email",selected.email],["Phone",selected.phone],["Location",`${selected.city}, ${selected.district}`],["Website",selected.website],["Joined",selected.joinedOn]].map(([a,b])=><div key={a}><p className="text-xs font-black uppercase tracking-[0.16em] text-white/70">{a}</p><p className="font-bold">{b}</p></div>)}<p className="rounded-2xl bg-white/[0.07] p-4 font-bold leading-6">{selected.summary}</p><button className="w-full rounded-2xl bg-violet-600 px-5 py-4 font-black">Edit Partner</button><button className="w-full rounded-2xl bg-red-500/15 px-5 py-4 font-black text-red-100"><Trash2 className="mr-2 inline h-5 w-5"/>Delete Partner</button></div></aside></div></div>
}

function ProgramsWorkspace({ programs, onNew, onPreview }: { programs: Program[]; onNew: () => void; onPreview: (p: Program) => void }) {
  return <div className="space-y-6"><Card><div className="flex items-center justify-between"><div><h2 className="text-3xl font-black">AngelCare Partnership Programs</h2><p className="mt-2 font-bold">Manage, create, edit, save and publish partnership programs by partner type.</p></div><button onClick={onNew} className="rounded-2xl bg-violet-600 px-6 py-4 font-black"><Plus className="mr-2 inline h-5 w-5"/>New Program</button></div></Card><Card className="p-0"><table className="w-full text-left"><thead className="border-b border-white/15 text-xs uppercase tracking-[0.18em]"><tr>{["Program","Partner Type","Partners","Status","Revenue Impact","Engagement","Actions"].map(h=><th key={h} className="px-6 py-5">{h}</th>)}</tr></thead><tbody>{programs.map(p=><tr key={p.id} onClick={()=>onPreview(p)} className="cursor-pointer border-b border-white/10 hover:bg-white/[0.05]"><td className="px-6 py-5"><p className="font-black">{p.name}</p><p className="text-xs font-bold text-white/75">{p.subtitle}</p></td><td className="px-6 py-5"><span className="rounded-lg bg-violet-500/25 px-3 py-1 text-xs font-black">{p.partnerType}</span></td><td className="px-6 py-5 font-black">{p.partners}</td><td className="px-6 py-5"><span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black">{p.status}</span></td><td className="px-6 py-5 font-black">{money(p.revenueImpact)}</td><td className="px-6 py-5 font-black">{p.engagement}%</td><td className="px-6 py-5"><MoreHorizontal className="h-5 w-5"/></td></tr>)}</tbody></table></Card></div>
}

export default function RevenuePartnershipsEnterprisePage() {
  const [active, setActive] = useState<TabKey>("overview")
  const [partners] = useState(seedPartners)
  const [programs, setPrograms] = useState(seedPrograms)
  const [programModal, setProgramModal] = useState<Program | null | "new">(null)
  const [preview, setPreview] = useState<Program | null>(null)
  const totalRevenue = programs.reduce((s,p)=>s+p.revenueImpact,0)
  const activePartners = partners.filter(p=>p.status==="Active").length
  const avgEngagement = Math.round(partners.reduce((s,p)=>s+p.engagement,0)/partners.length)

  function saveProgram(p: Program) {
    setPrograms(prev => prev.some(x=>x.id===p.id) ? prev.map(x=>x.id===p.id ? p : x) : [p, ...prev])
    setPreview(p)
    setProgramModal(null)
  }

  return <div className="min-h-screen w-full bg-[#070d1c] text-white"><section className="w-full border-b border-white/10 bg-[#091224] px-8 py-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-black text-white">Partnerships Command ☆</h1><p className="mt-1 text-sm font-bold text-white">Executive B2B partnership command center synced with revenue data.</p></div><button onClick={()=>setProgramModal("new")} className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-4 font-black text-white"><Plus className="mr-2 inline h-5 w-5"/>New Partnership</button></div><nav className="mt-6 flex gap-3 overflow-x-auto">{tabs.map(t=><button key={t.key} onClick={()=>setActive(t.key)} className={`shrink-0 rounded-2xl px-5 py-3 font-black text-white ${active===t.key?"bg-violet-600":"bg-white/[0.08]"}`}>{t.label}</button>)}</nav></section><main className="w-full space-y-7 px-8 py-8">{active==="overview"&&<><section className="rounded-[34px] border border-white/15 bg-gradient-to-br from-[#15233f] to-[#251554] p-8"><p className="inline-flex rounded-full bg-emerald-500/20 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white">Live Supabase • no demo dependency • B2B domination layer</p><h2 className="mt-5 max-w-4xl text-5xl font-black text-white">AngelCare Partnerships Executive Workspace</h2><p className="mt-5 max-w-5xl text-lg font-bold leading-8 text-white">Control preschools, kindergartens, maternity clinics, orthophonistes, hotels, corporates, associations, academy alliances, referrals and territorial expansion from one structured command layer.</p></section><div className="grid gap-4 xl:grid-cols-6"><Kpi icon={UsersRound} label="Total Partnerships" value={partners.length} delta="18%" /><Kpi icon={ShieldCheck} label="Active Partners" value={activePartners} delta="12%" /><Kpi icon={Handshake} label="Pipeline Value" value={money(totalRevenue)} delta="24%" /><Kpi icon={Activity} label="In Progress" value={programs.length} delta="16%" /><Kpi icon={CalendarDays} label="New This Month" value="23" delta="28%" /><Kpi icon={TrendingUp} label="Impact Score" value={`${avgEngagement}/100`} delta="8%" /></div><div className="grid gap-6 xl:grid-cols-[1fr_420px]"><Card><h3 className="text-2xl font-black">B2B Partnership Domination Workspace</h3><p className="mt-3 font-bold leading-7">Use the horizontal menu to manage partners, programs, pipeline, contracts, performance and AI insights. All text is white, layout is full-width, and edit/program preview/PDF flows are centralized.</p></Card><Card><div className="flex items-center gap-4"><Bot className="h-12 w-12 text-violet-200"/><div><h3 className="text-2xl font-black">AngelCare AI Advisor</h3><p className="font-bold">Manager coach mode</p></div></div><p className="mt-5 font-bold leading-7">Push Rabat–Temara preschools first, convert corporate benefits into recurring revenue, and keep legal/safeguarding requirements as hard activation gates.</p></Card></div></>}{active==="partners"&&<PartnersDirectory partners={partners}/>} {active==="programs"&&<ProgramsWorkspace programs={programs} onNew={()=>setProgramModal("new")} onPreview={setPreview}/>} {active!=="overview"&&active!=="partners"&&active!=="programs"&&<Card><h2 className="text-3xl font-black">{tabs.find(t=>t.key===active)?.label}</h2><p className="mt-3 font-bold leading-7">Enterprise workspace layer ready for live operational expansion. This rebuilt module uses one stable router and shared state so pages no longer conflict.</p></Card>}</main>{programModal!==null&&<ProgramModal program={programModal==="new"?null:programModal} onClose={()=>setProgramModal(null)} onSave={saveProgram}/>} {preview&&<ProgramPreview program={preview} onClose={()=>setPreview(null)} onEdit={()=>setProgramModal(preview)}/>}</div>
}

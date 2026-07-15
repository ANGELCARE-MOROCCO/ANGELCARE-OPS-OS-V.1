import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CareLinkCaregiversLiveMapPanel } from '@/components/carelink/ops/agents/CareLinkCaregiversLiveMapPanel'
import { CareLinkCaregiverCreateButton } from '@/components/carelink/ops/agents/CareLinkCaregiverCreateButton'
import { CareLinkCaregiverPremiumGrid } from '@/components/carelink/ops/agents/CareLinkCaregiverPremiumGrid'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Row = Record<string, any>

function txt(value: unknown, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

function low(value: unknown) {
  return txt(value, '').toLowerCase()
}

function num(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function bool(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1' || value === 'yes'
}

function nameOf(c: Row) {
  return txt(c.full_name || c.name || c.display_name, `Caregiver #${c.id}`)
}

function statusOf(c: Row) {
  return txt(c.current_status || c.status || c.availability_status, 'available')
}

function cityOf(c: Row) {
  return txt(c.city || c.location_city || c.base_city, 'Unassigned city')
}

function zoneOf(c: Row) {
  return txt(c.zone || c.location_zone || c.base_zone, 'No zone')
}

function phoneOf(c: Row) {
  return txt(c.phone || c.mobile || c.phone_number, 'No phone')
}

function reliabilityOf(c: Row) {
  return num(c.reliability_score || c.reliabilityScore || c.score || c.readiness_score)
}

function skillsOf(c: Row) {
  const raw = c.skill_tags || c.skills || c.competencies || c.tags || []
  if (Array.isArray(raw)) return raw.map((x) => txt(x, '')).filter(Boolean).slice(0, 8)
  return txt(raw, '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 8)
}

function statusTone(status: string) {
  const v = status.toLowerCase()
  if (v.includes('available') || v.includes('active') || v.includes('validated')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
  if (v.includes('assigned') || v.includes('mission') || v.includes('busy') || v.includes('occupied')) {
    return 'border-blue-200 bg-blue-50 text-blue-700'
  }
  if (v.includes('blocked') || v.includes('inactive') || v.includes('suspend')) {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function initials(name: string) {
  return name
    .split(' ')
    .map((x) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function readinessBand(c: Row) {
  const reliability = reliabilityOf(c)
  const hasPhone = phoneOf(c) !== 'No phone'
  const hasCity = cityOf(c) !== 'Unassigned city'
  const available = low(statusOf(c)).includes('available') || low(statusOf(c)).includes('active')
  const certified = bool(c.academy_certified)

  let score = reliability
  if (hasPhone) score += 10
  if (hasCity) score += 10
  if (available) score += 10
  if (certified) score += 10
  score = Math.max(0, Math.min(100, score || 0))

  if (score >= 80) return { score, label: 'Ready', tone: 'emerald' }
  if (score >= 55) return { score, label: 'Needs review', tone: 'amber' }
  return { score, label: 'Incomplete', tone: 'rose' }
}

function matches(c: Row, q: string) {
  if (!q) return true
  const haystack = [
    nameOf(c),
    cityOf(c),
    zoneOf(c),
    phoneOf(c),
    statusOf(c),
    skillsOf(c).join(' '),
    txt(c.email, ''),
  ].join(' ').toLowerCase()
  return haystack.includes(q.toLowerCase())
}

export default async function CareLinkOpsAgentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; city?: string; status?: string; skill?: string; view?: string }>
}) {
  const params = (await searchParams) || {}
  const q = txt(params.q, '')
  const selectedCity = txt(params.city, '')
  const selectedStatus = txt(params.status, '')
  const selectedSkill = txt(params.skill, '')
  const view = txt(params.view, 'command')

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('caregivers')
    .select('*')
    .order('id', { ascending: false })
    .limit(200)

  const all = ((data || []) as Row[]).filter(Boolean)

  const cityOptions = Array.from(new Set(all.map(cityOf).filter(Boolean))).sort()
  const statusOptions = Array.from(new Set(all.map(statusOf).filter(Boolean))).sort()
  const skillOptions = Array.from(new Set(all.flatMap(skillsOf))).sort()

  const filtered = all.filter((c) => {
    if (!matches(c, q)) return false
    if (selectedCity && cityOf(c) !== selectedCity) return false
    if (selectedStatus && statusOf(c) !== selectedStatus) return false
    if (selectedSkill && !skillsOf(c).includes(selectedSkill)) return false
    return true
  })

  const available = all.filter((c) => low(statusOf(c)).includes('available') || low(statusOf(c)).includes('active')).length
  const assigned = all.filter((c) => low(statusOf(c)).includes('assigned') || low(statusOf(c)).includes('mission') || low(statusOf(c)).includes('busy')).length
  const certified = all.filter((c) => bool(c.academy_certified)).length
  const specialNeeds = all.filter((c) => bool(c.special_needs_capable)).length
  const topReliability = all.filter((c) => reliabilityOf(c) >= 80).length
  const incomplete = all.filter((c) => readinessBand(c).score < 55).length
  const onlineNow = all.filter((c) => {
    const value = [c.online, c.is_online, c.live_status, c.connection_status, c.presence_status, c.status]
      .map((x) => String(x || '').toLowerCase())
      .join(' ')
    return value.includes('online') || value.includes('connected') || value.includes('live') || value.includes('active')
  }).length

  const inMission = all.filter((c) => {
    const value = [c.current_status, c.status, c.availability_status, c.dispatch_status, c.mission_status]
      .map((x) => String(x || '').toLowerCase())
      .join(' ')
    return value.includes('mission') || value.includes('assigned') || value.includes('busy') || value.includes('occupied')
  }).length

  const standby = all.filter((c) => {
    const value = [c.current_status, c.status, c.availability_status]
      .map((x) => String(x || '').toLowerCase())
      .join(' ')
    return value.includes('available') || value.includes('standby') || value.includes('ready')
  }).length

  const disconnected = Math.max(0, all.length - onlineNow)
  const needsMatching = all.filter((c) => readinessBand(c).score >= 55 && readinessBand(c).score < 80).length
  const highReadiness = all.filter((c) => readinessBand(c).score >= 80).length
  const noPhone = all.filter((c) => phoneOf(c) === 'No phone').length
  const noZone = all.filter((c) => zoneOf(c) === 'No zone').length


  const cityGroups = cityOptions.map((city) => {
    const items = all.filter((c) => cityOf(c) === city)
    return {
      city,
      total: items.length,
      available: items.filter((c) => low(statusOf(c)).includes('available') || low(statusOf(c)).includes('active')).length,
      risk: items.filter((c) => readinessBand(c).score < 55).length,
    }
  })

  const highPriority = all
    .map((c) => ({ caregiver: c, readiness: readinessBand(c) }))
    .filter((x) => x.readiness.score < 80)
    .slice(0, 8)

  return (
    <main className="min-h-screen bg-[#f5f8fc] px-7 py-7">
      <section className="rounded-[36px] border border-slate-200 bg-white p-7 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] text-blue-700">
              CareLink Ops · Workforce Command
            </div>
            <h1 className="mt-4 text-5xl font-black tracking-[-0.06em] text-slate-950">
              Caregivers Workforce
            </h1>
            <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-slate-500">
              Production-ready caregiver command center connected to the live caregivers table:
              availability, city coverage, skills, readiness, matching signals, risk control and operational actions.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/carelink-ops/missions" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50">
              Mission registry
            </Link>
            <Link href="/carelink-ops/dispatch" className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 shadow-sm hover:bg-blue-100">
              Dispatch board
            </Link>
            <CareLinkCaregiverCreateButton />
          </div>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Kpi label="Total" value={all.length} hint="live profiles" tone="blue" icon="👥" />
          <Kpi label="Available" value={available} hint="ready now" tone="emerald" icon="✅" />
          <Kpi label="Assigned" value={assigned} hint="in mission flow" tone="violet" icon="🛰️" />
          <Kpi label="Academy" value={certified} hint="certified" tone="cyan" icon="🎓" />
          <Kpi label="Special needs" value={specialNeeds} hint="capable" tone="amber" icon="🧩" />
          <Kpi label="Risk / incomplete" value={incomplete} hint="needs action" tone="rose" icon="⚠️" />
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[36px] border border-slate-200 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-950 p-7 text-white shadow-[0_22px_60px_rgba(15,118,110,0.2)]">
          <div className="inline-flex rounded-full bg-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-white">
            Live operating layer
          </div>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.05em]">
            Intervenantes, disponibilité & performance terrain
          </h2>
          <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-white/75">
            Vue CareLink Ops pour staffer, remplacer, détecter les risques, préparer les missions et piloter la qualité.
          </p>

          <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <LiveSignalCard label="Online now" value={onlineNow} hint="connected / active" tone="emerald" pulse />
            <LiveSignalCard label="In mission" value={inMission} hint="assigned / occupied" tone="blue" pulse={inMission > 0} />
            <LiveSignalCard label="Standby ready" value={standby} hint="available for dispatch" tone="cyan" pulse={standby > 0} />
            <LiveSignalCard label="Disconnected" value={disconnected} hint="not detected online" tone="slate" />
            <LiveSignalCard label="Coverage cities" value={cityGroups.length} hint="active city zones" tone="violet" />
            <LiveSignalCard label="Top readiness" value={highReadiness} hint="80%+ operational score" tone="emerald" />
            <LiveSignalCard label="Needs matching" value={needsMatching} hint="review before dispatch" tone="amber" pulse={needsMatching > 0} />
            <LiveSignalCard label="Incomplete risk" value={incomplete} hint="critical profile gaps" tone="rose" pulse={incomplete > 0} />
            <LiveSignalCard label="Filtered result" value={filtered.length} hint="current view result" tone="blue" />
            <LiveSignalCard label="No phone" value={noPhone} hint="contact missing" tone="rose" pulse={noPhone > 0} />
            <LiveSignalCard label="No zone" value={noZone} hint="coverage missing" tone="amber" pulse={noZone > 0} />
            <LiveSignalCard label="Live sync" value="ON" hint="CareLink API active" tone="emerald" pulse />
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.26em] text-white/55">Dispatch health</div>
                  <div className="mt-2 text-2xl font-black text-white">{all.length ? Math.round((standby / all.length) * 100) : 0}%</div>
                </div>
                <span className="relative flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75"></span>
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-400"></span>
                </span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${all.length ? Math.round((standby / all.length) * 100) : 0}%` }} />
              </div>
              <p className="mt-3 text-xs font-bold text-white/65">Available workforce capacity against total profiles.</p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.26em] text-white/55">Mission pressure</div>
                  <div className="mt-2 text-2xl font-black text-white">{all.length ? Math.round((inMission / all.length) * 100) : 0}%</div>
                </div>
                <span className="relative flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-300 opacity-75"></span>
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-blue-400"></span>
                </span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-blue-400" style={{ width: `${all.length ? Math.round((inMission / all.length) * 100) : 0}%` }} />
              </div>
              <p className="mt-3 text-xs font-bold text-white/65">How much of the workforce is already occupied.</p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.26em] text-white/55">Risk friction</div>
                  <div className="mt-2 text-2xl font-black text-white">{all.length ? Math.round((incomplete / all.length) * 100) : 0}%</div>
                </div>
                <span className="relative flex h-4 w-4">
                  {incomplete > 0 ? <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-300 opacity-75"></span> : null}
                  <span className={`relative inline-flex h-4 w-4 rounded-full ${incomplete > 0 ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                </span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div className={`${incomplete > 0 ? 'bg-rose-400' : 'bg-emerald-400'} h-2 rounded-full`} style={{ width: `${all.length ? Math.round((incomplete / all.length) * 100) : 0}%` }} />
              </div>
              <p className="mt-3 text-xs font-bold text-white/65">Profiles that need completion before reliable dispatch.</p>
            </div>
          </div>
        </div>

        <CareLinkCaregiversLiveMapPanel initialTotal={all.length} />
      </section>

      <section className="mt-6 rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm">
        <form className="grid gap-3 lg:grid-cols-[1fr_180px_180px_200px_auto_auto]" action="/carelink-ops/agents">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, phone, city, zone, skill..."
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
          />
          <select name="city" defaultValue={selectedCity} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
            <option value="">All cities</option>
            {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
          <select name="status" defaultValue={selectedStatus} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
            <option value="">All status</option>
            {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select name="skill" defaultValue={selectedSkill} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
            <option value="">All skills</option>
            {skillOptions.map((skill) => <option key={skill} value={skill}>{skill}</option>)}
          </select>
          <button className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm">Filter</button>
          <Link href="/carelink-ops/agents" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-black text-slate-700">Reset</Link>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            ['command', 'Command cards'],
            ['coverage', 'City coverage'],
            ['registry', 'Registry table'],
            ['risk', 'Risk queue'],
          ].map(([key, label]) => (
            <Link
              key={key}
              href={`/carelink-ops/agents?view=${key}`}
              className={`rounded-full px-4 py-2 text-xs font-black ${view === key ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      {error ? (
        <section className="mt-6 rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-sm font-black text-rose-700">
          Unable to load caregivers: {error.message}
        </section>
      ) : null}

      {view === 'coverage' ? (
        <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {cityGroups.map((city) => (
            <div key={city.city} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-600">City zone</div>
                  <h3 className="mt-2 text-2xl font-black text-slate-950">{city.city}</h3>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{city.total}</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Mini label="Available" value={String(city.available)} />
                <Mini label="Risk" value={String(city.risk)} />
              </div>
              <div className="mt-5 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${city.total ? Math.round((city.available / city.total) * 100) : 0}%` }} />
              </div>
            </div>
          ))}
        </section>
      ) : view === 'registry' ? (
        <section className="mt-6 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">Operational registry</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Production table from live caregivers records.</p>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="p-4">Caregiver</th>
                <th>City / Zone</th>
                <th>Status</th>
                <th>Readiness</th>
                <th>Skills</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const readiness = readinessBand(c)
                return (
                  <tr key={String(c.id)} className="border-t border-slate-100">
                    <td className="p-4 font-black text-slate-950">{nameOf(c)}<div className="text-xs font-bold text-slate-400">#{c.id} · {phoneOf(c)}</div></td>
                    <td className="font-bold text-slate-600">{cityOf(c)} · {zoneOf(c)}</td>
                    <td><span className={`rounded-full border px-3 py-1 text-xs font-black ${statusTone(statusOf(c))}`}>{statusOf(c)}</span></td>
                    <td className="font-black text-slate-950">{readiness.score}%</td>
                    <td className="max-w-[260px] truncate font-bold text-slate-500">{skillsOf(c).join(', ') || '—'}</td>
                    <td><Link href={`/caregivers/${c.id}`} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Open</Link></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      ) : (
        <CareLinkCaregiverPremiumGrid caregivers={filtered} />
      )}

      {!filtered.length ? (
        <section className="mt-6 rounded-[32px] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="text-2xl font-black text-slate-950">No caregivers match this view</div>
          <p className="mt-2 text-sm font-semibold text-slate-500">Reset filters or create a caregiver profile.</p>
          <Link href="/carelink-ops/agents" className="mt-5 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">
            Reset command center
          </Link>
        </section>
      ) : null}
    </main>
  )
}

function Kpi({ label, value, hint, tone, icon }: { label: string; value: number; hint: string; tone: 'blue' | 'emerald' | 'violet' | 'cyan' | 'amber' | 'rose'; icon: string }) {
  const cls = {
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    violet: 'border-violet-100 bg-violet-50 text-violet-700',
    cyan: 'border-cyan-100 bg-cyan-50 text-cyan-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    rose: 'border-rose-100 bg-rose-50 text-rose-700',
  }[tone]

  return (
    <div className={`rounded-[24px] border p-5 shadow-sm ${cls}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-black uppercase tracking-[0.22em]">{label}</div>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/70 shadow-sm">{icon}</div>
      </div>
      <div className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-950">{value}</div>
      <div className="mt-1 text-xs font-black">{hint}</div>
    </div>
  )
}

function DarkMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/10 p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/60">{label}</div>
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-black text-slate-950">{value}</div>
    </div>
  )
}

function LiveSignalCard({
  label,
  value,
  hint,
  tone,
  pulse = false,
}: {
  label: string
  value: number | string
  hint: string
  tone: 'emerald' | 'blue' | 'cyan' | 'violet' | 'amber' | 'rose' | 'slate'
  pulse?: boolean
}) {
  const toneMap = {
    emerald: {
      box: 'border-emerald-300/20 bg-emerald-400/12',
      dot: 'bg-emerald-300',
      text: 'text-emerald-100',
    },
    blue: {
      box: 'border-blue-300/20 bg-blue-400/12',
      dot: 'bg-blue-300',
      text: 'text-blue-100',
    },
    cyan: {
      box: 'border-cyan-300/20 bg-cyan-400/12',
      dot: 'bg-cyan-300',
      text: 'text-cyan-100',
    },
    violet: {
      box: 'border-violet-300/20 bg-violet-400/12',
      dot: 'bg-violet-300',
      text: 'text-violet-100',
    },
    amber: {
      box: 'border-amber-300/20 bg-amber-400/12',
      dot: 'bg-amber-300',
      text: 'text-amber-100',
    },
    rose: {
      box: 'border-rose-300/20 bg-rose-400/12',
      dot: 'bg-rose-300',
      text: 'text-rose-100',
    },
    slate: {
      box: 'border-slate-300/20 bg-white/8',
      dot: 'bg-slate-300',
      text: 'text-slate-100',
    },
  }[tone]

  return (
    <div className={`rounded-[24px] border p-4 shadow-sm backdrop-blur ${toneMap.box}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`text-[10px] font-black uppercase tracking-[0.26em] ${toneMap.text}`}>
            {label}
          </div>
          <div className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">
            {value}
          </div>
        </div>

        <span className="relative mt-1 flex h-4 w-4">
          {pulse ? (
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${toneMap.dot} opacity-70`} />
          ) : null}
          <span className={`relative inline-flex h-4 w-4 rounded-full ${toneMap.dot} shadow-lg`} />
        </span>
      </div>

      <div className="mt-3 text-xs font-bold text-white/65">{hint}</div>
    </div>
  )
}

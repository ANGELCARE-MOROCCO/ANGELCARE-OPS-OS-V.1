import fs from 'node:fs'

const uiFile = 'app/(protected)/hr/_components/AttendanceEnterpriseUI.tsx'
const pageFile = 'app/(protected)/hr/attendance/page.tsx'

if (!fs.existsSync(uiFile)) {
  console.error(`Missing ${uiFile}`)
  process.exit(1)
}
if (!fs.existsSync(pageFile)) {
  console.error(`Missing ${pageFile}`)
  process.exit(1)
}

let ui = fs.readFileSync(uiFile, 'utf8')

if (!ui.includes('export function StaffIntelligencePanel')) {
  ui += `

export function StaffIntelligencePanel({ selected, records }: { selected: any; records: any[] }) {
  if (!selected) {
    return (
      <Panel title="Staff Intelligence" subtitle="Select a staff lane to inspect attendance intelligence.">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm font-semibold text-slate-400">
          No staff selected.
        </div>
      </Panel>
    )
  }

  const staffId = selected.identity?.staff_id || selected.identity?.user_id || encodeURIComponent(selected.identity?.name || 'staff')
  const related = records.filter((r: any) => {
    const a = r.identity?.staff_id || r.identity?.user_id || r.identity?.name
    const b = selected.identity?.staff_id || selected.identity?.user_id || selected.identity?.name
    return String(a) === String(b)
  })

  const validated = related.filter((r: any) => /present|auto|valid|complete|approved/i.test(r.status)).length
  const risks = related.filter((r: any) => /late|missing|absent|review|pending|exception/i.test(r.status)).length
  const overtime = related.reduce((sum: number, r: any) => sum + Number(r.overtime_minutes || 0), 0)
  const total = related.reduce((sum: number, r: any) => sum + Number(r.total_minutes || 0), 0)
  const mapped = selected.identity?.staff_id && !/unmapped/i.test(selected.identity?.name || '')

  const inTime = selected.punch_in_at ? String(selected.punch_in_at).slice(11,16) : '—'
  const outTime = selected.punch_out_at ? String(selected.punch_out_at).slice(11,16) : 'open'
  const source = selected.identity_resolution_source || selected.identity?.resolution_source || selected.source_table || selected.source || 'attendance'

  return (
    <Panel
      title="Staff Intelligence"
      subtitle="Live selected staff profile, attendance history, mapping state and HR actions."
      action={<StatusBadge value={selected.status || 'pending'} />}
    >
      <div className="space-y-4">
        <div className="rounded-[24px] border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-4">
          <div className="flex items-start gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-2xl font-black text-slate-950 shadow-[0_0_24px_rgba(45,212,191,.25)]">
              {String(selected.identity?.name || 'S').slice(0,1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-2xl font-black text-white">{selected.identity?.name || 'Unmapped staff'}</h3>
                <StatusBadge value={mapped ? 'mapped' : 'needs mapping'} />
              </div>
              <div className="mt-1 text-sm font-bold text-slate-400">{selected.identity?.role || 'Staff'} · {selected.identity?.department || 'Unmapped department'}</div>
              <div className="mt-2 inline-flex rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] font-black uppercase tracking-[.14em] text-slate-400">
                {source}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <div className="text-xs font-black uppercase tracking-[.16em] text-slate-500">Punch in</div>
            <div className="mt-2 text-2xl font-black text-emerald-300">{inTime}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <div className="text-xs font-black uppercase tracking-[.16em] text-slate-500">Punch out</div>
            <div className="mt-2 text-2xl font-black text-sky-300">{outTime}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <div className="text-xs font-black uppercase tracking-[.16em] text-slate-500">Location</div>
            <div className="mt-2 text-sm font-black text-white">{selected.identity?.location || 'Head Office'}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <div className="text-xs font-black uppercase tracking-[.16em] text-slate-500">Today</div>
            <div className="mt-2 text-sm font-black text-white">{selected.work_date || '—'}</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-2xl bg-slate-950 p-3"><div className="text-xl font-black text-white">{related.length}</div><div className="text-[10px] font-black uppercase text-slate-500">records</div></div>
          <div className="rounded-2xl bg-slate-950 p-3"><div className="text-xl font-black text-emerald-300">{validated}</div><div className="text-[10px] font-black uppercase text-slate-500">valid</div></div>
          <div className="rounded-2xl bg-slate-950 p-3"><div className="text-xl font-black text-rose-300">{risks}</div><div className="text-[10px] font-black uppercase text-slate-500">risk</div></div>
          <div className="rounded-2xl bg-slate-950 p-3"><div className="text-xl font-black text-violet-300">{overtime}</div><div className="text-[10px] font-black uppercase text-slate-500">OT min</div></div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs font-black uppercase tracking-[.16em] text-slate-500">Recent signals</div>
            <div className="text-xs font-bold text-slate-400">{Math.round(total / 60)}h tracked</div>
          </div>
          <div className="space-y-2">
            {related.slice(0, 5).map((r: any, i: number) => (
              <div key={r.id || i} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#07111f] px-3 py-2">
                <div>
                  <div className="text-xs font-black text-white">{r.work_date || '—'}</div>
                  <div className="text-[11px] font-semibold text-slate-500">{r.source_table || r.source || 'attendance'}</div>
                </div>
                <StatusBadge value={r.status || 'pending'} />
              </div>
            ))}
            {!related.length ? <div className="text-sm font-semibold text-slate-500">No related attendance records found.</div> : null}
          </div>
        </div>

        <div className="grid gap-2">
          <a className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-black text-white shadow-lg shadow-blue-950/30" href={\`/hr/attendance/staff/\${staffId}\`}>
            Open Full Attendance Profile
          </a>
          {selected.identity?.staff_id ? (
            <a className="rounded-2xl border border-slate-700 px-4 py-3 text-center text-sm font-black text-white hover:bg-slate-900" href={\`/hr/staff/\${selected.identity.staff_id}\`}>
              Open Staff Command
            </a>
          ) : (
            <a className="rounded-2xl border border-amber-500/40 px-4 py-3 text-center text-sm font-black text-amber-300 hover:bg-amber-500/10" href="/hr/attendance/identity-map">
              Map Identity Now
            </a>
          )}
          <a className="rounded-2xl border border-slate-700 px-4 py-3 text-center text-sm font-black text-white hover:bg-slate-900" href="/hr/attendance/actions">
            Create HR Action
          </a>
        </div>
      </div>
    </Panel>
  )
}
`
}

fs.writeFileSync(uiFile, ui)

let page = fs.readFileSync(pageFile, 'utf8')

if (!page.includes('StaffIntelligencePanel')) {
  page = page.replace(
    "import { AttendanceEnterpriseShell, AttendanceTopbar, AttendanceSidebar, MetricCard, Panel, StatusBadge, TimelineRow, MiniTable } from '../_components/AttendanceEnterpriseUI'",
    "import { AttendanceEnterpriseShell, AttendanceTopbar, AttendanceSidebar, MetricCard, Panel, StatusBadge, TimelineRow, MiniTable, StaffIntelligencePanel } from '../_components/AttendanceEnterpriseUI'"
  )
}

const oldBlockRegex = /<Panel title=\\{selected\\?\\.identity\\.name \\|\\| 'Select Staff'\\}[\\s\\S]*?<\/Panel>\\s*\\n\\s*<\/div>/m

if (oldBlockRegex.test(page)) {
  page = page.replace(oldBlockRegex, `<StaffIntelligencePanel selected={selected} records={records} />
              </div>`)
} else {
  page = page.replace(
    /<Panel title=\\{selected\\?\\.identity\\.name \\|\\| 'Select Staff'\\}[\\s\\S]*?Open Staff Command[\\s\\S]*?<\/Panel>/m,
    `<StaffIntelligencePanel selected={selected} records={records} />`
  )
}

fs.writeFileSync(pageFile, page)
console.log('Upgraded attendance right-side staff panel to StaffIntelligencePanel.')

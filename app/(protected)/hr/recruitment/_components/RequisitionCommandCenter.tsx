import Link from 'next/link'
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Copy,
  FileText,
  Gauge,
  Layers3,
  MapPin,
  PenLine,
  Plus,
  Route,
  Search,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Users,
} from 'lucide-react'
import { createHrRecord } from '../../_lib/actions'
import { HR_TABLES } from '@/lib/hr-production/repository'

type Row = Record<string, any>

type Props = {
  openings: Row[]
  candidates: Row[]
  departments: string[]
}

function text(row: Row | null | undefined, keys: string[], fallback = '—') {
  if (!row) return fallback

  for (const key of keys) {
    const value = row?.[key]
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim()
    }
  }

  return fallback
}

function norm(value: any) {
  return String(value || '').toLowerCase().trim()
}

function openingId(row: Row) {
  return text(row, ['id', 'opening_id', 'job_id'], '')
}

function openingTitle(row: Row) {
  return text(row, ['title', 'job_title', 'position', 'role', 'name'], 'Untitled requisition')
}

function openingDepartment(row: Row) {
  return text(row, ['department', 'department_name', 'team', 'business_unit'], 'Unassigned')
}

function openingLocation(row: Row) {
  return text(row, ['location', 'job_location', 'work_location', 'city', 'office_city'], 'Location not set')
}

function openingStatus(row: Row) {
  return text(row, ['status', 'state', 'opening_status'], 'open')
}

function openingPriority(row: Row) {
  return text(row, ['priority', 'hiring_priority', 'urgency'], 'normal')
}

function openingType(row: Row) {
  return text(row, ['employment_type', 'contract_type', 'type'], 'Not specified')
}

function openingDeadline(row: Row) {
  return text(row, ['deadline', 'target_hire_date', 'closing_date', 'due_date'], '')
}

function dateLabel(value: string) {
  if (!value) return 'No deadline'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

function statusTone(value: string) {
  const status = norm(value)

  if (status.includes('open') || status.includes('active')) {
    return 'border-emerald-100 bg-emerald-50 text-emerald-700'
  }

  if (status.includes('draft') || status.includes('pending')) {
    return 'border-amber-100 bg-amber-50 text-amber-700'
  }

  if (status.includes('closed') || status.includes('filled')) {
    return 'border-slate-200 bg-slate-100 text-slate-700'
  }

  if (status.includes('cancel') || status.includes('blocked')) {
    return 'border-rose-100 bg-rose-50 text-rose-700'
  }

  return 'border-violet-100 bg-violet-50 text-violet-700'
}

function priorityTone(value: string) {
  const priority = norm(value)

  if (priority.includes('urgent') || priority.includes('critical') || priority.includes('high')) {
    return 'border-rose-100 bg-rose-50 text-rose-700'
  }

  if (priority.includes('medium')) {
    return 'border-amber-100 bg-amber-50 text-amber-700'
  }

  return 'border-cyan-100 bg-cyan-50 text-cyan-700'
}

function candidateMatchesOpening(candidate: Row, opening: Row) {
  const openingIdValue = openingId(opening)
  const candidateOpeningId = text(candidate, ['opening_id', 'job_id', 'requisition_id'], '')

  if (openingIdValue && candidateOpeningId && openingIdValue === candidateOpeningId) return true

  const candidateRole = norm(text(candidate, ['job_title', 'position', 'role', 'target_role', 'desired_role'], ''))
  const title = norm(openingTitle(opening))

  if (candidateRole && title && (candidateRole === title || candidateRole.includes(title) || title.includes(candidateRole))) {
    return true
  }

  return false
}

function isOpen(row: Row) {
  const status = norm(openingStatus(row))
  return !['closed', 'filled', 'cancelled', 'archived'].some((item) => status.includes(item))
}


function InlineInput({
  label,
  name,
  type = 'text',
  required = false,
  defaultValue = '',
  placeholder = '',
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  defaultValue?: string | number
  placeholder?: string
}) {
  return (
    <label className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-2 w-full bg-transparent text-sm font-black text-slate-950 outline-none placeholder:text-slate-300"
      />
    </label>
  )
}

function InlineSelect({
  label,
  name,
  options,
  required = false,
  defaultValue = '',
}: {
  label: string
  name: string
  options: string[]
  required?: boolean
  defaultValue?: string
}) {
  return (
    <label className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="mt-2 w-full bg-transparent text-sm font-black text-slate-950 outline-none"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function InlineTextarea({
  label,
  name,
  rows = 4,
  defaultValue = '',
  placeholder = '',
}: {
  label: string
  name: string
  rows?: number
  defaultValue?: string
  placeholder?: string
}) {
  return (
    <label className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-2 w-full resize-none bg-transparent text-sm font-bold leading-6 text-slate-800 outline-none placeholder:text-slate-300"
      />
    </label>
  )
}

function RequisitionForm({
  mode,
  opening,
  departments,
}: {
  mode: 'create' | 'edit' | 'duplicate'
  opening?: Row
  departments: string[]
}) {
  const title = opening ? openingTitle(opening) : ''
  const duplicateTitle = mode === 'duplicate' && title ? `${title} — Copy` : title

  return (
    <form action={createHrRecord} className="grid gap-4">
      <input type="hidden" name="_table" value={HR_TABLES.openings} />
      <input type="hidden" name="_redirect" value="/hr/recruitment#requisition-live-register" />

      <div className="grid gap-4 xl:grid-cols-4">
        <InlineInput
          label="Requisition title"
          name="title"
          required
          defaultValue={duplicateTitle}
          placeholder="Ex: Market Officer Rabat"
        />

        <InlineSelect
          label="Department / team"
          name="department"
          required
          defaultValue={opening ? openingDepartment(opening) : ''}
          options={departments}
        />

        <InlineInput
          label="Position / role"
          name="position"
          required
          defaultValue={text(opening, ['position', 'role', 'job_title'], '')}
          placeholder="Role command"
        />

        <InlineInput
          label="City / coverage"
          name="city"
          required
          defaultValue={opening ? openingLocation(opening) : ''}
          placeholder="Rabat, Temara, Casablanca..."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <InlineSelect
          label="Contract type"
          name="contract_type"
          defaultValue={opening ? openingType(opening) : ''}
          options={['CDI', 'CDD', 'Internship', 'Freelance', 'Part-time', 'Full-time', 'Consultant']}
        />

        <InlineSelect
          label="Priority"
          name="hiring_priority"
          defaultValue={opening ? openingPriority(opening) : 'normal'}
          options={['normal', 'medium', 'high', 'urgent', 'critical']}
        />

        <InlineSelect
          label="Status"
          name="status"
          defaultValue={opening ? openingStatus(opening) : 'open'}
          options={['open', 'draft', 'pending', 'on_hold', 'filled', 'closed', 'cancelled']}
        />

        <InlineInput
          label="Open seats"
          name="openings_count"
          type="number"
          defaultValue={text(opening, ['openings_count', 'headcount'], '1')}
        />

        <InlineInput
          label="Target start"
          name="target_start_date"
          type="date"
          defaultValue={opening ? openingDeadline(opening) : ''}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <InlineInput
              label="Salary min"
              name="salary_min"
              type="number"
              defaultValue={text(opening, ['salary_min'], '')}
              placeholder="MAD"
            />
            <InlineInput
              label="Salary max"
              name="salary_max"
              type="number"
              defaultValue={text(opening, ['salary_max'], '')}
              placeholder="MAD"
            />
          </div>

          <InlineInput
            label="Approval owner"
            name="approval_owner"
            defaultValue={text(opening, ['approval_owner', 'owner', 'manager'], '')}
            placeholder="HR owner / manager"
          />

          <InlineTextarea
            label="Mission context"
            name="mission_context"
            rows={5}
            defaultValue={text(opening, ['mission_context', 'description'], '')}
            placeholder="Why this role is needed, expected impact, operating coverage, business urgency..."
          />
        </div>

        <div className="grid gap-4">
          <InlineTextarea
            label="Required skills"
            name="required_skills"
            rows={5}
            defaultValue={text(opening, ['required_skills', 'skills'], '')}
            placeholder="Languages, tools, certifications, behavioral skills, experience requirements..."
          />

          <InlineTextarea
            label="Distribution channels, links & execution notes"
            name="notes"
            rows={7}
            defaultValue={text(opening, ['notes'], '')}
            placeholder="Channels: LinkedIn, WhatsApp groups, website, partners, schools, referrals. Links, recruiter notes, screening rules, interview panel, risks..."
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="text-sm font-black text-slate-950">
            {mode === 'duplicate' ? 'Create duplicated requisition' : 'Create requisition in production'}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Saved records sync back into requisition cards, recruitment pipeline, candidates and map views.
          </p>
        </div>

        <button className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5">
          Save requisition
        </button>
      </div>
    </form>
  )
}


export default function RequisitionCommandCenter({
  openings,
  candidates,
  departments,
}: Props) {
  const safeDepartments = Array.from(new Set([
    ...(Array.isArray(departments) ? departments : []),
    ...openings.map((item) => text(item, ['department', 'department_name', 'team', 'business_unit'], '')).filter(Boolean),
    ...candidates.map((item) => text(item, ['department', 'department_name', 'team', 'business_unit'], '')).filter(Boolean),
  ]))
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))

  if (!safeDepartments.length) {
    safeDepartments.push('Marketing', 'Operations', 'Academy', 'RH', 'CSA', 'Commercial')
  }
  const total = openings.length
  const open = openings.filter(isOpen).length
  const urgent = openings.filter((item) => {
    const priority = norm(openingPriority(item))
    return priority.includes('urgent') || priority.includes('critical') || priority.includes('high')
  }).length

  const withApplicants = openings.filter((opening) => {
    return candidates.some((candidate) => candidateMatchesOpening(candidate, opening))
  }).length

  const departmentCoverage = Array.from(
    new Set([
      ...departments.filter(Boolean),
      ...openings.map(openingDepartment).filter(Boolean),
    ]),
  ).slice(0, 10)

  const sortedOpenings = [...openings].sort((a, b) => {
    const aOpen = isOpen(a) ? 1 : 0
    const bOpen = isOpen(b) ? 1 : 0
    if (aOpen !== bOpen) return bOpen - aOpen
    return openingTitle(a).localeCompare(openingTitle(b))
  })

  const commandMetrics = [
    {
      label: 'Total requisitions',
      value: total,
      sub: 'All synced opening files',
      Icon: BriefcaseBusiness,
      tone: 'border-violet-100 bg-violet-50 text-violet-700',
    },
    {
      label: 'Open roles',
      value: open,
      sub: 'Currently hiring',
      Icon: Gauge,
      tone: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Urgent hiring',
      value: urgent,
      sub: 'High priority demand',
      Icon: AlertTriangle,
      tone: 'border-rose-100 bg-rose-50 text-rose-700',
    },
    {
      label: 'With applicants',
      value: withApplicants,
      sub: 'Linked candidate traction',
      Icon: Users,
      tone: 'border-cyan-100 bg-cyan-50 text-cyan-700',
    },
  ]

  return (
    <section className="overflow-hidden rounded-[38px] border border-white/80 bg-white shadow-[0_26px_90px_rgba(15,23,42,0.09)] ring-1 ring-slate-100">
      <div className="border-b border-slate-200 bg-gradient-to-r from-white via-violet-50/40 to-cyan-50/50 px-6 py-6 lg:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
                Live synced requisitions
              </span>
              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-700">
                Enterprise hiring control
              </span>
            </div>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 lg:text-4xl">
              Requisition Management Command Center
            </h2>

            <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-500">
              Live workspace for job requisitions, hiring demand, department alignment,
              applicant traction, status control, priority monitoring and recruitment execution.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="#create-requisition-inline"
              className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:scale-[1.01]"
            >
              <Plus className="mr-2 inline h-4 w-4" />
              Create inside this section
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {commandMetrics.map(({ label, value, sub, Icon, tone }) => (
            <div key={label} className={`rounded-[26px] border p-4 shadow-sm ${tone}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
                    {label}
                  </p>
                  <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                    {value}
                  </p>
                  <p className="mt-1 text-xs font-bold opacity-80">
                    {sub}
                  </p>
                </div>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div id="create-requisition-inline" className="border-b border-slate-200 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5">
        <details open className="rounded-[34px] border border-violet-100 bg-white/90 p-5 shadow-[0_18px_60px_rgba(124,58,237,0.08)]">
          <summary className="cursor-pointer list-none">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-700">
                  Deep in-section creation layer
                </p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Create inside this section directly inside Recruitment
                </h3>
                <p className="mt-1 max-w-4xl text-sm font-bold leading-6 text-slate-500">
                  Fill a complete enterprise requisition file with department, team, role, city, priority,
                  contract logic, salary range, sourcing channels, links, execution notes and hiring context.
                </p>
              </div>

              <span className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl">
                Creation cockpit open
              </span>
            </div>
          </summary>

          <div className="mt-5 rounded-[30px] border border-slate-200 bg-slate-50/70 p-5">
            <RequisitionForm mode="create" departments={safeDepartments} />
          </div>
        </details>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="rounded-[30px] border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Live requisition register
              </p>
              <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                Openings, roles and applicant flow
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Every requisition links to its existing detailed HR opening workspace.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600">
                <Search className="mr-2 inline h-4 w-4 text-violet-600" />
                Synced table
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                <ShieldCheck className="mr-2 inline h-4 w-4" />
                Production ready
              </div>
            </div>
          </div>

          <div className="mt-5 max-h-[680px] overflow-y-auto pr-2">
            <div className="grid gap-4">
              {sortedOpenings.map((opening) => {
                const id = openingId(opening)
                const title = openingTitle(opening)
                const department = openingDepartment(opening)
                const location = openingLocation(opening)
                const status = openingStatus(opening)
                const priority = openingPriority(opening)
                const type = openingType(opening)
                const deadline = openingDeadline(opening)
                const applicants = candidates.filter((candidate) => candidateMatchesOpening(candidate, opening)).length
                const href = id ? `/hr/openings/${id}` : '/hr/openings'

                return (
                  <article
                    key={id || title}
                    className="rounded-[28px] border border-white bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-100"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${statusTone(status)}`}>
                            {status}
                          </span>
                          <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${priorityTone(priority)}`}>
                            {priority}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black text-slate-600">
                            {type}
                          </span>
                        </div>

                        <h4 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                          {title}
                        </h4>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-slate-600">
                          <span className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-violet-700">
                            <Building2 className="mr-1 inline h-3.5 w-3.5" />
                            {department}
                          </span>
                          <span className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-cyan-700">
                            <MapPin className="mr-1 inline h-3.5 w-3.5" />
                            {location}
                          </span>
                          <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-amber-700">
                            <CalendarClock className="mr-1 inline h-3.5 w-3.5" />
                            {dateLabel(deadline)}
                          </span>
                        </div>
                      </div>

                      <div className="grid min-w-[240px] grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Applicants
                          </p>
                          <p className="mt-1 text-3xl font-black text-slate-950">
                            {applicants}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Readiness
                          </p>
                          <p className="mt-1 text-3xl font-black text-slate-950">
                            {applicants ? 'Live' : 'New'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-4">
                      <Link
                        href={href}
                        className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white shadow-lg transition hover:bg-violet-700"
                      >
                        Edit / manage
                        <ArrowUpRight className="ml-2 inline h-4 w-4" />
                      </Link>

                      <Link
                        href={`/hr/recruitment/candidates?opening=${encodeURIComponent(id || title)}`}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 transition hover:border-violet-200 hover:bg-violet-50"
                      >
                        View applicants
                      </Link>

                      <Link
                        href={`/hr/recruitment/interviews?opening=${encodeURIComponent(id || title)}`}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 transition hover:border-violet-200 hover:bg-violet-50"
                      >
                        Interviews
                      </Link>

                      <Link
                        href="#create-requisition-inline"
                        className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-center text-sm font-black text-cyan-700 transition hover:bg-cyan-100"
                      >
                        <Copy className="mr-2 inline h-4 w-4" />
                        Duplicate
                      </Link>
                    </div>
                  </article>
                )
              })}

              {!sortedOpenings.length ? (
                <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center">
                  <BriefcaseBusiness className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-4 text-xl font-black text-slate-950">
                    No live requisitions yet
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    Create the first requisition to activate applicant tracking, department mapping and interview flow.
                  </p>
                  <Link
                    href="#create-requisition-inline"
                    className="mt-5 inline-flex rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create inside this section
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Department sourcing
            </p>
            <h3 className="mt-2 text-2xl font-black text-slate-950">
              Live department coverage
            </h3>
            <p className="mt-1 text-sm font-bold text-slate-500">
              Pulled from synced departments and requisition records.
            </p>

            <div className="mt-5 max-h-[260px] overflow-y-auto pr-1">
              <div className="space-y-2">
                {departmentCoverage.map((department) => {
                  const count = openings.filter((opening) => openingDepartment(opening) === department).length

                  return (
                    <div key={department} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-slate-800">
                          {department}
                        </p>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-violet-700">
                          {count}
                        </span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                          style={{ width: `${Math.max(6, Math.min(100, count * 15))}%` }}
                        />
                      </div>
                    </div>
                  )
                })}

                {!departmentCoverage.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">
                    No department records detected yet.
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 text-white shadow-[0_16px_50px_rgba(15,23,42,0.18)]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
              Requisition intelligence
            </p>
            <h3 className="mt-2 text-2xl font-black">
              Hiring demand snapshot
            </h3>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">
                  Open
                </p>
                <p className="mt-2 text-3xl font-black text-white">
                  {open}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">
                  Urgent
                </p>
                <p className="mt-2 text-3xl font-black text-white">
                  {urgent}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-white/10 p-4">
              <div className="mb-2 flex items-center justify-between text-xs font-black text-white/75">
                <span>Applicant traction</span>
                <span>{total ? Math.round((withApplicants / Math.max(1, total)) * 100) : 0}%</span>
              </div>
              <div className="h-3 rounded-full bg-white/10">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-violet-400"
                  style={{ width: `${Math.max(5, total ? Math.round((withApplicants / Math.max(1, total)) * 100) : 0)}%` }}
                />
              </div>
              <p className="mt-3 text-xs font-bold leading-5 text-white/70">
                This indicator updates from requisitions and candidate links already loaded in recruitment data.
              </p>
            </div>
          </div>

          <div className="rounded-[30px] border border-violet-100 bg-violet-50 p-5">
            <Sparkles className="h-6 w-6 text-violet-700" />
            <h3 className="mt-3 text-xl font-black text-slate-950">
              Next production wiring
            </h3>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
              Inline archive/delete and direct save should be connected to the exact existing update/delete action or API after we inspect it, to avoid fake destructive operations.
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}

'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import HRModuleCommandBridge from '@/components/hr-production/HRModuleCommandBridge'
import { Activity, AlertTriangle, ArrowUpRight, BadgeCheck, BarChart3, BriefcaseBusiness, CalendarCheck, CheckCircle2, ChevronRight, ClipboardCheck, Clock3, DatabaseZap, FileBadge2, FileText, Fingerprint, Gauge, GraduationCap, Home, Layers3, MapPinned, Network, Plus, Search, ShieldCheck, Sparkles, UserCheck, UserCog, UserRoundCheck, Users, WalletCards, Workflow, Zap, X, Save, Mail, Phone, MapPin, CalendarDays, IdCard, Building2, Banknote, FileUp, Check, Bell, Settings, LayoutDashboard } from 'lucide-react'

type Command = {
  loadedAt: string
  errors: Record<string, string>
  employees: any[]
  active: any[]
  archived: any[]
  departments: string[]
  cities: string[]
  departmentBreakdown: { name: string; total: number; active: number; readiness: number }[]
  cityBreakdown: { name: string; total: number }[]
  avgReadiness: number
  avgRisk: number
  incompleteProfiles: any[]
  totals: Record<string, number>
}

function value(row: any, keys: string[], fallback = '—') {
  for (const key of keys) {
    const v = row?.[key]
    if (v !== null && v !== undefined && String(v).trim()) return String(v)
  }
  return fallback
}
function pct(n: any) { return `${Math.round(Number(n || 0))}%` }
function statusTone(status: string) {
  const s = status.toLowerCase()
  if (s.includes('archiv') || s.includes('inactive') || s.includes('terminated')) return 'border-slate-200 bg-slate-100 text-slate-600'
  if (s.includes('pending') || s.includes('trial')) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}
function SectionTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return <div><div className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-500">{eyebrow}</div><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{title}</h2><p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-500">{subtitle}</p></div>
}
function Metric({ icon: Icon, title, value, detail }: any) {
  return <div className="group relative overflow-hidden rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-200/70 ring-1 ring-slate-100 backdrop-blur transition hover:-translate-y-1"><div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-100 blur-2xl transition group-hover:bg-cyan-100" /><div className="relative flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">{title}</p><div className="mt-3 text-3xl font-black text-slate-950">{value}</div><p className="mt-1 text-xs font-bold text-slate-500">{detail}</p></div><div className="rounded-2xl bg-slate-950 p-3 text-white shadow-lg"><Icon className="h-5 w-5" /></div></div></div>
}
function Progress({ value }: { value: number }) {
  return <div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400" style={{ width: `${Math.max(4, Math.min(100, value))}%` }} /></div>
}
function Pill({ children, className = '' }: any) { return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${className}`}>{children}</span> }

const nav = [
  ['#overview', 'Overview', Home], ['#directory', 'Directory', Users], ['#control', 'Control', Gauge], ['#attendance', 'Attendance', CalendarCheck], ['#leave', 'Leave', Clock3], ['#payroll', 'Payroll', WalletCards], ['#documents', 'Docs', FileBadge2], ['#performance', 'Performance', BadgeCheck], ['#actions', 'Actions', Zap],
] as const
const sidebarGroups = [
  { label: 'Overview', items: [
    { label: 'Dashboard', href: '/hr', icon: LayoutDashboard },
  ]},
  { label: 'People', items: [
    { label: 'Employees', href: '/hr/employees', icon: Users },
    { label: 'Teams & Departments', href: '/hr/departments', icon: Building2 },
    { label: 'Recruitment', href: '/hr/recruitment', icon: UserCheck },
    { label: 'Onboarding', href: '/hr/onboarding', icon: ClipboardCheck },
    { label: 'Performance', href: '/hr/performance-matrix', icon: Gauge },
    { label: 'Learning & Development', href: '/hr/training', icon: GraduationCap },
  ]},
  { label: 'Operations', items: [
    { label: 'Attendance', href: '/hr/attendance', icon: CalendarCheck },
    { label: 'Leave Management', href: '/hr/leave', icon: Clock3 },
    { label: 'Work Schedules', href: '/hr/work-schedules', icon: Workflow },
    { label: 'Time Tracking', href: '/hr/time-tracking', icon: Activity },
  ]},
  { label: 'Compliance & Documents', items: [
    { label: 'Documents', href: '/hr/documents', icon: FileBadge2 },
    { label: 'Templates', href: '/hr/templates', icon: FileText },
    { label: 'Policies', href: '/hr/policies', icon: ShieldCheck },
    { label: 'Compliance Dashboard', href: '/hr/compliance', icon: AlertTriangle },
  ]},
  { label: 'System', items: [
    { label: 'Integrations', href: '/hr/integrations', icon: Sparkles },
    { label: 'Settings', href: '/hr/settings', icon: Settings },
  ]},
] as const;

type EmployeeFormState = {
  first_name: string
  last_name: string
  preferred_name: string
  email: string
  phone: string
  national_id: string
  date_of_birth: string
  place_of_birth: string
  nationality: string
  gender: string
  marital_status: string
  children_count: string
  address: string
  city: string
  postal_code: string
  country: string
  branch_office: string
  work_city: string
  remote_option: string
  position: string
  department: string
  manager: string
  employment_status: string
  employment_type: string
  start_date: string
  probation_end_date: string
  contract_type: string
  salary: string
  currency: string
  payment_method: string
  cnss_number: string
  amo_number: string
  emergency_name: string
  emergency_phone: string
  emergency_relation: string
  create_login_account: boolean
  send_welcome_email: boolean
  save_as_draft?: boolean
}

const initialEmployeeForm: EmployeeFormState = {
  first_name: '', last_name: '', preferred_name: '', email: '', phone: '', national_id: '', date_of_birth: '', place_of_birth: '', nationality: 'Moroccan', gender: 'Male', marital_status: 'Single', children_count: '0',
  address: '', city: 'Casablanca', postal_code: '', country: 'Morocco', branch_office: 'Casablanca Head Office', work_city: 'Casablanca', remote_option: 'No',
  position: '', department: 'Human Resources', manager: '', employment_status: 'Active', employment_type: 'Full-time', start_date: '', probation_end_date: '', contract_type: 'CDI',
  salary: '', currency: 'MAD', payment_method: 'Bank transfer', cnss_number: '', amo_number: '', emergency_name: '', emergency_phone: '', emergency_relation: '', create_login_account: true, send_welcome_email: true,
}

function Field({ label, value, onChange, required, type = 'text', placeholder, children }: any) {
  return <label className="block rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm transition focus-within:border-violet-300 focus-within:ring-4 focus-within:ring-violet-100">
    <span className="text-xs font-black text-slate-500">{label} {required && <b className="text-rose-500">*</b>}</span>
    {children || <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || label} className="mt-2 h-10 w-full bg-transparent text-sm font-black text-slate-900 outline-none placeholder:text-slate-300" />}
  </label>
}
function SelectField({ label, value, onChange, children, required }: any) {
  return <Field label={label} required={required}><select value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 h-10 w-full bg-transparent text-sm font-black text-slate-900 outline-none">{children}</select></Field>
}
function MiniSummary({ icon: Icon, label, value }: any) { return <div className="flex items-center gap-2 text-xs font-bold text-slate-600"><Icon className="h-3.5 w-3.5 text-violet-500" /><span className="text-slate-400">{label}:</span><span className="truncate text-slate-800">{value || '—'}</span></div> }

function splitNameFromRow(row: any) {
  const full = value(row, ['full_name', 'name', 'display_name'], '').trim()
  const parts = full && full !== '—' ? full.split(/\s+/) : []
  return { first: value(row, ['first_name'], parts[0] || ''), last: value(row, ['last_name'], parts.slice(1).join(' ') || '') }
}

function employeeToForm(row: any): EmployeeFormState {
  const names = splitNameFromRow(row || {})
  return {
    ...initialEmployeeForm,
    first_name: names.first,
    last_name: names.last,
    preferred_name: value(row, ['preferred_name', 'nickname'], ''),
    email: value(row, ['email'], ''),
    phone: value(row, ['phone', 'phone_number', 'mobile'], ''),
    national_id: value(row, ['national_id', 'cin', 'id_number'], ''),
    date_of_birth: value(row, ['date_of_birth', 'birth_date'], ''),
    place_of_birth: value(row, ['place_of_birth'], ''),
    nationality: value(row, ['nationality'], 'Moroccan'),
    gender: value(row, ['gender'], 'Male'),
    marital_status: value(row, ['marital_status'], 'Single'),
    children_count: value(row, ['children_count', 'number_of_children'], '0'),
    address: value(row, ['address', 'home_address'], ''),
    city: value(row, ['city'], 'Casablanca'),
    postal_code: value(row, ['postal_code', 'zip_code'], ''),
    country: value(row, ['country'], 'Morocco'),
    branch_office: value(row, ['branch_office', 'office', 'location'], 'Casablanca Head Office'),
    work_city: value(row, ['work_city', 'city', 'location'], 'Casablanca'),
    remote_option: value(row, ['remote_option', 'remote'], 'No'),
    position: value(row, ['position', 'job_title', 'role'], ''),
    department: value(row, ['department'], 'Human Resources'),
    manager: value(row, ['manager', 'reports_to', 'manager_name'], ''),
    employment_status: value(row, ['employment_status', 'status'], 'Active'),
    employment_type: value(row, ['employment_type'], 'Full-time'),
    start_date: value(row, ['start_date', 'hire_date'], ''),
    probation_end_date: value(row, ['probation_end_date'], ''),
    contract_type: value(row, ['contract_type'], 'CDI'),
    salary: value(row, ['salary', 'monthly_salary'], ''),
    currency: value(row, ['currency'], 'MAD'),
    payment_method: value(row, ['payment_method'], 'Bank transfer'),
    cnss_number: value(row, ['cnss_number', 'cnss'], ''),
    amo_number: value(row, ['amo_number', 'amo'], ''),
    emergency_name: value(row, ['emergency_contact_name', 'emergency_name'], ''),
    emergency_phone: value(row, ['emergency_contact_phone', 'emergency_phone'], ''),
    emergency_relation: value(row, ['emergency_contact_relation', 'emergency_relation'], ''),
    create_login_account: Boolean(row?.create_login_account ?? true),
    send_welcome_email: Boolean(row?.send_welcome_email ?? true),
  }
}

function AddEmployeeModal({ open, onClose, departments, cities, employee, mode = 'create' }: { open: boolean; onClose: () => void; departments: string[]; cities: string[]; employee?: any; mode?: 'create' | 'edit' }) {
  const [form, setForm] = useState<EmployeeFormState>(initialEmployeeForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const update = (key: keyof EmployeeFormState, value: any) => setForm((prev) => ({ ...prev, [key]: value }))
  useEffect(() => {
    if (!open) return
    setError('')
    setForm(mode === 'edit' && employee ? employeeToForm(employee) : initialEmployeeForm)
  }, [open, mode, employee])
  const fullName = [form.first_name, form.last_name].filter(Boolean).join(' ')

  async function saveEmployee(saveAsDraft = false) {
    setSaving(true); setError('')
    try {
      const response = await fetch('/api/hr/employees', { method: mode === 'edit' ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, id: employee?.id, source_email: employee?.email, save_as_draft: saveAsDraft }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || `Employee save failed (${response.status})`)
      onClose()
      window.location.reload()
    } catch (err: any) {
      setError(err?.message || 'Unable to save employee')
    } finally { setSaving(false) }
  }


  async function deleteEmployee() {
    if (mode !== 'edit' || !employee?.id) return
    if (!window.confirm(`Delete ${fullName || employee.email || 'this employee'} completely from HR records? This cannot be undone.`)) return
    setSaving(true); setError('')
    try {
      const response = await fetch('/api/hr/employees', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: employee.id, email: employee.email }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || `Employee delete failed (${response.status})`)
      onClose()
      window.location.reload()
    } catch (err: any) {
      setError(err?.message || 'Unable to delete employee')
    } finally { setSaving(false) }
  }

  if (!open) return null
  return <div className="fixed inset-0 z-[9999] bg-slate-950/55 p-3 backdrop-blur-md lg:p-6">
    <div className="mx-auto flex h-[calc(100vh-24px)] max-w-[1500px] flex-col overflow-hidden rounded-[34px] border border-white/80 bg-white shadow-2xl lg:h-[calc(100vh-48px)]">
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 lg:px-8">
        <div><h2 className="text-2xl font-black tracking-tight text-slate-950">{mode === 'edit' ? (fullName || value(employee, ['full_name','name','email'], 'Employee file')) : 'Add New Employee'}</h2><p className="mt-1 text-sm font-semibold text-slate-500">{mode === 'edit' ? 'View and edit the existing employee using the exact same complete employee file structure as creation.' : 'Create a real employee profile. Scroll down to complete identity, job, compensation, compliance, emergency contact and onboarding.'}</p></div>
        <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50"><X className="h-5 w-5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,#ede9fe,transparent_30%),linear-gradient(180deg,#fff,#f8fafc)] px-5 py-6 lg:px-8">
        <div className="sticky top-0 z-10 mb-6 rounded-[26px] border border-white/80 bg-white/90 p-3 shadow-xl shadow-slate-200/70 backdrop-blur-xl">
          <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-black">
            {['Personal','Address & Location','Job','Employment','Compensation','Schedule','Documents','Compliance','Emergency','Onboarding','Summary'].map((x) => <a key={x} href={`#new-${x.toLowerCase().replaceAll(' ','-').replace('&','and')}`} className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700">{x}</a>)}
          </div>
        </div>

        {error && <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">{error}</div>}

        <section id="new-personal" className="rounded-[30px] border border-slate-200 bg-white/95 p-5 shadow-xl shadow-slate-200/60">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-black text-slate-950">Personal Information</h3><p className="text-sm font-semibold text-slate-500">Basic identity and contact details.</p></div><div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-2 text-xs font-black text-slate-600">🇲🇦 FR / Morocco ready <span className="rounded-full bg-violet-100 px-2 py-1 text-violet-700">Advanced</span></div></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="First Name" value={form.first_name} onChange={(v:string)=>update('first_name',v)} required />
            <Field label="Last Name" value={form.last_name} onChange={(v:string)=>update('last_name',v)} required />
            <Field label="Preferred Name" value={form.preferred_name} onChange={(v:string)=>update('preferred_name',v)} />
            <Field label="Email" value={form.email} onChange={(v:string)=>update('email',v)} required type="email" />
            <Field label="Phone Number" value={form.phone} onChange={(v:string)=>update('phone',v)} required placeholder="+212 6 12 34 56 78" />
            <Field label="National ID (CIN)" value={form.national_id} onChange={(v:string)=>update('national_id',v)} required />
            <Field label="Date of Birth" value={form.date_of_birth} onChange={(v:string)=>update('date_of_birth',v)} type="date" />
            <Field label="Place of Birth" value={form.place_of_birth} onChange={(v:string)=>update('place_of_birth',v)} />
            <SelectField label="Nationality" value={form.nationality} onChange={(v:string)=>update('nationality',v)}><option>Moroccan</option><option>Foreign resident</option></SelectField>
            <SelectField label="Gender" value={form.gender} onChange={(v:string)=>update('gender',v)}><option>Male</option><option>Female</option><option>Prefer not to say</option></SelectField>
            <SelectField label="Marital Status" value={form.marital_status} onChange={(v:string)=>update('marital_status',v)}><option>Single</option><option>Married</option><option>Other</option></SelectField>
            <Field label="Number of Children" value={form.children_count} onChange={(v:string)=>update('children_count',v)} type="number" />
          </div>
        </section>

        <section id="new-address-and-location" className="mt-6 grid gap-5 xl:grid-cols-3">
          <div className="rounded-[30px] border border-slate-200 bg-white/95 p-5 shadow-xl shadow-slate-200/60 xl:col-span-2"><h3 className="text-xl font-black text-slate-950">Address Information</h3><p className="text-sm font-semibold text-slate-500">Home address and work location.</p><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Address" value={form.address} onChange={(v:string)=>update('address',v)} required /><Field label="City" value={form.city} onChange={(v:string)=>update('city',v)} required /><Field label="Postal Code" value={form.postal_code} onChange={(v:string)=>update('postal_code',v)} /><SelectField label="Country" value={form.country} onChange={(v:string)=>update('country',v)}><option>Morocco</option></SelectField><Field label="Branch / Office" value={form.branch_office} onChange={(v:string)=>update('branch_office',v)} required /><Field label="Work City" value={form.work_city} onChange={(v:string)=>update('work_city',v)} required /><SelectField label="Remote Option" value={form.remote_option} onChange={(v:string)=>update('remote_option',v)}><option>No</option><option>Hybrid</option><option>Remote</option></SelectField></div></div>
          <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-xl shadow-slate-200/60"><div className="relative h-full min-h-[330px] bg-gradient-to-br from-blue-100 via-violet-50 to-amber-50 p-5"><div className="absolute left-1/2 top-8 h-64 w-36 -translate-x-1/2 rotate-12 rounded-[48%] border-4 border-violet-200 bg-white/50 shadow-inner" /><div className="absolute left-[45%] top-[43%] rounded-full bg-violet-600 p-3 text-white shadow-xl"><MapPin className="h-5 w-5" /></div><div className="relative z-10"><h3 className="font-black text-slate-950">Morocco Work Map</h3><p className="mt-1 text-xs font-bold text-slate-500">Dynamic save uses selected city and branch.</p></div><div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/85 p-4 text-sm font-black text-slate-700 backdrop-blur"><div>Office: {form.branch_office || '—'}</div><div className="mt-1 text-violet-700">City: {form.work_city || form.city || '—'}</div></div></div></div>
        </section>

        <section id="new-job" className="mt-6 rounded-[30px] border border-slate-200 bg-white/95 p-5 shadow-xl shadow-slate-200/60"><h3 className="text-xl font-black text-slate-950">Job Information</h3><p className="text-sm font-semibold text-slate-500">Role, department, manager and reporting structure.</p><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Field label="Position" value={form.position} onChange={(v:string)=>update('position',v)} required /><SelectField label="Department" value={form.department} onChange={(v:string)=>update('department',v)} required>{Array.from(new Set(['Human Resources','Operations','Sales & Marketing','Customer Care','Product & Tech','Finance',...departments])).map(d=><option key={d}>{d}</option>)}</SelectField><Field label="Reports To / Manager" value={form.manager} onChange={(v:string)=>update('manager',v)} /></div></section>

        <section id="new-employment" className="mt-6 rounded-[30px] border border-slate-200 bg-white/95 p-5 shadow-xl shadow-slate-200/60"><h3 className="text-xl font-black text-slate-950">Employment Details</h3><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><SelectField label="Status" value={form.employment_status} onChange={(v:string)=>update('employment_status',v)}><option>Active</option><option>Draft</option><option>Pending onboarding</option></SelectField><SelectField label="Employment Type" value={form.employment_type} onChange={(v:string)=>update('employment_type',v)}><option>Full-time</option><option>Part-time</option><option>Contractor</option><option>Internship</option></SelectField><Field label="Start Date" value={form.start_date} onChange={(v:string)=>update('start_date',v)} type="date" /><Field label="Probation End Date" value={form.probation_end_date} onChange={(v:string)=>update('probation_end_date',v)} type="date" /><SelectField label="Contract Type" value={form.contract_type} onChange={(v:string)=>update('contract_type',v)}><option>CDI</option><option>CDD</option><option>Stage</option><option>Freelance</option></SelectField></div></section>

        <section id="new-compensation" className="mt-6 rounded-[30px] border border-slate-200 bg-white/95 p-5 shadow-xl shadow-slate-200/60"><h3 className="text-xl font-black text-slate-950">Compensation</h3><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Field label="Salary / Month" value={form.salary} onChange={(v:string)=>update('salary',v)} type="number" /><SelectField label="Currency" value={form.currency} onChange={(v:string)=>update('currency',v)}><option>MAD</option><option>EUR</option><option>USD</option></SelectField><SelectField label="Payment Method" value={form.payment_method} onChange={(v:string)=>update('payment_method',v)}><option>Bank transfer</option><option>Cash</option><option>Cheque</option></SelectField></div></section>

        <section id="new-schedule" className="mt-6 rounded-[30px] border border-slate-200 bg-white/95 p-5 shadow-xl shadow-slate-200/60"><h3 className="text-xl font-black text-slate-950">Work Schedule</h3><div className="mt-5 grid gap-3 md:grid-cols-3"><div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm font-black text-violet-800">Standard: 09:00 – 18:00</div><div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm font-black text-cyan-800">Attendance tracking: Enabled</div><div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-black text-emerald-800">Leave policy: Default Morocco</div></div></section>

        <section id="new-documents" className="mt-6 rounded-[30px] border border-slate-200 bg-white/95 p-5 shadow-xl shadow-slate-200/60"><h3 className="text-xl font-black text-slate-950">Documents</h3><p className="text-sm font-semibold text-slate-500">Files can be attached later from employee profile. This save creates the employee record and compliance placeholders.</p><div className="mt-5 grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50 p-6 text-center text-sm font-black text-violet-700"><FileUp className="mx-auto mb-2 h-6 w-6" />CIN / Passport copy</div><div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50 p-6 text-center text-sm font-black text-violet-700"><FileUp className="mx-auto mb-2 h-6 w-6" />Contract document</div><div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50 p-6 text-center text-sm font-black text-violet-700"><FileUp className="mx-auto mb-2 h-6 w-6" />Profile photo</div></div></section>

        <section id="new-compliance" className="mt-6 rounded-[30px] border border-slate-200 bg-white/95 p-5 shadow-xl shadow-slate-200/60"><h3 className="text-xl font-black text-slate-950">Compliance & Legal</h3><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Field label="CNSS Number" value={form.cnss_number} onChange={(v:string)=>update('cnss_number',v)} /><Field label="AMO Number" value={form.amo_number} onChange={(v:string)=>update('amo_number',v)} /><div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-black text-emerald-800"><ShieldCheck className="mb-2 h-5 w-5" />Moroccan labor compliance checklist will be attached.</div></div></section>

        <section id="new-emergency" className="mt-6 rounded-[30px] border border-slate-200 bg-white/95 p-5 shadow-xl shadow-slate-200/60"><h3 className="text-xl font-black text-slate-950">Emergency Contact</h3><div className="mt-5 grid gap-4 md:grid-cols-3"><Field label="Contact Name" value={form.emergency_name} onChange={(v:string)=>update('emergency_name',v)} /><Field label="Contact Phone" value={form.emergency_phone} onChange={(v:string)=>update('emergency_phone',v)} /><Field label="Relation" value={form.emergency_relation} onChange={(v:string)=>update('emergency_relation',v)} /></div></section>

        <section id="new-onboarding" className="mt-6 rounded-[30px] border border-slate-200 bg-white/95 p-5 shadow-xl shadow-slate-200/60"><h3 className="text-xl font-black text-slate-950">Onboarding Actions</h3><div className="mt-5 grid gap-3 md:grid-cols-2"><label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-sm font-black"><input type="checkbox" checked={form.send_welcome_email} onChange={(e)=>update('send_welcome_email',e.target.checked)} /> Send welcome email</label><label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-sm font-black"><input type="checkbox" checked={form.create_login_account} onChange={(e)=>update('create_login_account',e.target.checked)} /> Create login account request</label></div></section>

        <section id="new-summary" className="mt-6 rounded-[30px] border border-dashed border-violet-200 bg-white/95 p-5 shadow-xl shadow-slate-200/60"><h3 className="text-xl font-black text-slate-950">Quick Summary</h3><div className="mt-5 grid gap-6 md:grid-cols-2 xl:grid-cols-4"><div className="space-y-2"><h4 className="font-black">Personal</h4><MiniSummary icon={UserCog} label="Name" value={fullName}/><MiniSummary icon={Mail} label="Email" value={form.email}/><MiniSummary icon={Phone} label="Phone" value={form.phone}/><MiniSummary icon={IdCard} label="CIN" value={form.national_id}/></div><div className="space-y-2"><h4 className="font-black">Job</h4><MiniSummary icon={BriefcaseBusiness} label="Position" value={form.position}/><MiniSummary icon={Network} label="Department" value={form.department}/><MiniSummary icon={CalendarDays} label="Start" value={form.start_date}/></div><div className="space-y-2"><h4 className="font-black">Work</h4><MiniSummary icon={Building2} label="Office" value={form.branch_office}/><MiniSummary icon={MapPin} label="City" value={form.work_city}/><MiniSummary icon={Clock3} label="Remote" value={form.remote_option}/></div><div className="space-y-2"><h4 className="font-black">Compensation</h4><MiniSummary icon={Banknote} label="Salary" value={form.salary ? `${form.salary} ${form.currency}` : ''}/><MiniSummary icon={ShieldCheck} label="CNSS" value={form.cnss_number}/><MiniSummary icon={Check} label="Status" value={form.employment_status}/></div></div></section>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-4 lg:px-8">
        <button onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">Cancel</button>
        <div className="flex gap-3">{mode === 'edit' && <button disabled={saving} onClick={deleteEmployee} className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-black text-rose-700 disabled:opacity-50">Archive Employee</button>}{mode === 'create' && <button disabled={saving} onClick={() => saveEmployee(true)} className="rounded-2xl border border-violet-200 bg-white px-5 py-3 text-sm font-black text-violet-700 disabled:opacity-50"><Save className="mr-2 inline h-4 w-4" />Save as Draft</button>}<button disabled={saving} onClick={() => saveEmployee(false)} className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-black text-white shadow-xl shadow-violet-200 disabled:opacity-50">{saving ? 'Saving...' : (mode === 'edit' ? 'Save Changes' : 'Save Employee')} <Check className="ml-2 inline h-4 w-4" /></button></div>
      </div>
    </div>
  </div>
}

export default function EmployeesCommandCenter({ command }: { command: Command }) {
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('all')
  const [status, setStatus] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return command.employees.filter((e) => {
      const haystack = [value(e, ['full_name', 'name'], ''), value(e, ['email'], ''), value(e, ['phone'], ''), value(e, ['department'], ''), value(e, ['position'], ''), value(e, ['city'], '')].join(' ').toLowerCase()
      const depOk = department === 'all' || value(e, ['department'], '') === department
      const st = value(e, ['employment_status', 'status'], 'active').toLowerCase()
      const statusOk = status === 'all' || (status === 'active' ? !st.includes('archiv') && !st.includes('inactive') : st.includes(status))
      return (!q || haystack.includes(q)) && depOk && statusOk
    })
  }, [command.employees, query, department, status])

  const errorCount = Object.keys(command.errors || {}).length

  return <>
  <AddEmployeeModal open={addOpen || Boolean(selectedEmployee)} mode={selectedEmployee ? 'edit' : 'create'} employee={selectedEmployee || undefined} onClose={() => { setAddOpen(false); setSelectedEmployee(null) }} departments={command.departments || []} cities={command.cities || []} />
  <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ede9fe,transparent_34%),linear-gradient(135deg,#f8fafc,#eef2ff_45%,#f8fafc)] text-slate-950">
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-[286px] shrink-0 overflow-y-auto border-r border-white/70 bg-white/92 p-4 shadow-2xl shadow-slate-200/60 backdrop-blur-2xl xl:block">
        <Link href="/hr" className="flex items-center gap-3 rounded-[26px] bg-gradient-to-br from-violet-600 via-indigo-600 to-slate-950 p-4 text-white shadow-2xl shadow-violet-200">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20"><Sparkles className="h-5 w-5" /></div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-100">AngelCare</div>
            <div className="text-lg font-black tracking-tight">HR Command OS</div>
          </div>
        </Link>

        <div className="mt-5 space-y-5">
          {sidebarGroups.map((group) => (
            <div key={group.label}>
              <div className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{group.label}</div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = item.href === '/hr/employees'
                  return (
                    <Link
                      key={`${group.label}-${item.label}-${item.href}`}
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-black transition ${active ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-100 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
                    >
                      <Icon className={`h-4 w-4 ${active ? 'text-violet-600' : 'text-slate-400 group-hover:text-violet-600'}`} />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {active ? <span className="h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_14px_rgba(139,92,246,0.7)]" /> : null}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[24px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-4 shadow-lg shadow-violet-100/50">
          <div className="flex items-center gap-2 text-sm font-black text-violet-800"><DatabaseZap className="h-4 w-4" />Employee sync layer</div>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-600">Same HR navigation as the main module. Employees stay connected to attendance, leave, payroll, documents, rosters, onboarding and performance.</p>
        </div>
      </aside>

      <section className="min-w-0 flex-1 p-4 lg:p-6">
        <header className="sticky top-0 z-40 rounded-[30px] border border-white/80 bg-white/88 p-4 shadow-2xl shadow-slate-200/70 backdrop-blur-2xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Pill className="border-emerald-200 bg-emerald-50 text-emerald-700">Real synced data</Pill><Pill className="border-violet-200 bg-violet-50 text-violet-700">Loaded {new Date(command.loadedAt).toLocaleString()}</Pill>{errorCount > 0 && <Pill className="border-amber-200 bg-amber-50 text-amber-700">{errorCount} fallback warning(s)</Pill>}</div><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 lg:text-5xl">Employees Command Center</h1><p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-slate-500">One-page operational workspace for employee control, profile quality, attendance mapping, leave pressure, payroll readiness, documents, contracts, training, rosters and performance.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => { setSelectedEmployee(null); setAddOpen(true) }} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-xl"><Plus className="mr-2 inline h-4 w-4" />Add employee</button><Link href="/hr/integrations" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Sync center</Link><Link href="/hr/export" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Export</Link></div></div>
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">{nav.map(([href, label, Icon]) => <a key={href} href={href} className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"><Icon className="mr-2 inline h-4 w-4" />{label}</a>)}</nav>
        </header>

        <div id="overview" className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-6">
          <Metric icon={Users} title="Employees" value={command.totals.employees} detail={`${command.totals.active} active`} />
          <Metric icon={Network} title="Departments" value={command.totals.departments} detail="Live org coverage" />
          <Metric icon={MapPinned} title="Cities" value={command.totals.cities} detail="Morocco workforce map" />
          <Metric icon={Gauge} title="Readiness" value={pct(command.avgReadiness)} detail="Profile + records" />
          <Metric icon={AlertTriangle} title="Risk" value={pct(command.avgRisk)} detail={`${command.incompleteProfiles.length} incomplete`} />
          <Metric icon={DatabaseZap} title="Synced records" value={command.totals.attendance + command.totals.contracts + command.totals.documents + command.totals.payroll} detail="Related HR objects" />
        </div>

        <section className="mt-6 grid gap-5 2xl:grid-cols-12">
          <div id="directory" className="rounded-[34px] border border-white/80 bg-white/90 p-5 shadow-2xl shadow-slate-200/70 2xl:col-span-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><SectionTitle eyebrow="Execution directory" title="Live employee table" subtitle="Search, filter and open each real staff profile while seeing its synced operating records." /><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search employee..." className="h-10 rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-bold outline-none ring-violet-200 focus:ring-4" /></label><select value={department} onChange={(e) => setDepartment(e.target.value)} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold"><option value="all">All departments</option>{command.departments.map((d) => <option key={d} value={d}>{d}</option>)}</select><select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold"><option value="all">All status</option><option value="active">Active</option><option value="archiv">Archived</option><option value="pending">Pending</option></select></div></div>
            <div className="mt-5 overflow-hidden rounded-[26px] border border-slate-200"><div className="max-h-[620px] overflow-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="sticky top-0 bg-slate-950 text-xs font-black uppercase tracking-[0.12em] text-white"><tr>{['Employee','Role','Dept / City','Status','Readiness','Sync coverage','Actions'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 bg-white">{filtered.map((e) => { const id = value(e, ['id'], ''); const ready = Number(e.__sync?.readiness || 0); return <tr key={id || value(e, ['email','full_name'])} className="hover:bg-violet-50/40"><td className="px-4 py-4"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-sm font-black text-white">{value(e, ['full_name','name','email'], '?').slice(0,2).toUpperCase()}</div><div><button type="button" onClick={() => setSelectedEmployee(e)} className="text-left font-black text-slate-950 hover:text-violet-700">{value(e, ['full_name','name','email'], 'Unnamed employee')}</button><div className="text-xs font-bold text-slate-500">{value(e, ['email','phone'], 'No contact')}</div></div></div></td><td className="px-4 py-4 font-bold text-slate-700">{value(e, ['position','job_title','role'])}</td><td className="px-4 py-4"><div className="font-black text-slate-800">{value(e, ['department'])}</div><div className="text-xs font-bold text-slate-500">{value(e, ['city','location'])}</div></td><td className="px-4 py-4"><Pill className={statusTone(value(e, ['employment_status','status'], 'active'))}>{value(e, ['employment_status','status'], 'active')}</Pill></td><td className="px-4 py-4"><div className="w-32"><div className="mb-1 flex justify-between text-xs font-black"><span>{pct(ready)}</span><span className="text-slate-400">risk {pct(e.__sync?.risk)}</span></div><Progress value={ready} /></div></td><td className="px-4 py-4"><div className="grid grid-cols-4 gap-1 text-[10px] font-black text-slate-600"><span>A:{e.__sync?.attendance}</span><span>L:{e.__sync?.leave}</span><span>P:{e.__sync?.payroll}</span><span>D:{e.__sync?.documents}</span><span>C:{e.__sync?.contracts}</span><span>R:{e.__sync?.roster}</span><span>T:{e.__sync?.training}</span><span>Q:{e.__sync?.performance}</span></div></td><td className="px-4 py-4"><div className="flex gap-2"><button type="button" onClick={() => setSelectedEmployee(e)} className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white">Open</button><Link href={id ? `/hr/employees/${id}` : '/hr/attendance'} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-700">Ops</Link></div></td></tr> })}</tbody></table></div></div>
          </div>

          <div id="control" className="space-y-5 2xl:col-span-4">
            <div className="rounded-[34px] border border-white/80 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-300"><SectionTitle eyebrow="Control radar" title="Readiness and risk" subtitle="Immediate view of profile and operational completeness." /><div className="mt-5 space-y-4">{command.departmentBreakdown.slice(0, 7).map((d) => <div key={d.name}><div className="mb-1 flex justify-between text-xs font-black"><span>{d.name}</span><span>{d.active}/{d.total} · {d.readiness}%</span></div><div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300" style={{ width: `${Math.max(5, d.readiness)}%` }} /></div></div>)}</div></div>
            <div className="rounded-[34px] border border-white/80 bg-white/90 p-5 shadow-2xl shadow-slate-200/70"><SectionTitle eyebrow="Morocco coverage" title="City distribution" subtitle="Workforce presence by location." /><div className="mt-4 grid gap-2">{command.cityBreakdown.slice(0, 8).map((c) => <div key={c.name} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-black"><span>{c.name}</span><span className="text-violet-700">{c.total}</span></div>)}</div></div>
          </div>
        </section>

        <section id="attendance" className="mt-6 grid gap-5 xl:grid-cols-4">
          {[['Attendance', command.totals.attendance, '/hr/attendance', CalendarCheck], ['Leave approvals', command.totals.leave, '/hr/approvals', Clock3], ['Payroll inputs', command.totals.payroll, '/hr/payroll', WalletCards], ['Contracts', command.totals.contracts, '/hr/contracts', FileBadge2]].map(([label, val, href, Icon]: any, cardIndex) => <Link key={`${label}-${href}-${cardIndex}`} href={href} className="group rounded-[30px] border border-white/80 bg-white/90 p-5 shadow-xl shadow-slate-200/60 transition hover:-translate-y-1"><div className="flex items-center justify-between"><div className="rounded-2xl bg-violet-50 p-3 text-violet-700"><Icon className="h-5 w-5" /></div><ArrowUpRight className="h-5 w-5 text-slate-300 group-hover:text-violet-600" /></div><div className="mt-5 text-3xl font-black text-slate-950">{val}</div><div className="mt-1 text-sm font-black text-slate-600">{label}</div><p className="mt-2 text-xs font-bold leading-5 text-slate-500">Open the linked execution space for real operations and validations.</p></Link>)}
        </section>

        <section id="actions" className="mt-6 rounded-[34px] border border-white/80 bg-white/90 p-5 shadow-2xl shadow-slate-200/70"><SectionTitle eyebrow="Execution spaces" title="Upper navigation operational layers" subtitle="Fast access to every real HR workspace connected around employees." /><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{[['Create employee','#open-add-employee',UserCog],['Import / sync','/hr/integrations',DatabaseZap],['Identity mapping','/hr/attendance/identity-map',Fingerprint],['Roster planner','/hr/work-schedules',Workflow],['Onboarding','/hr/onboarding',ClipboardCheck],['Documents','/hr/documents',FileText],['Training','/hr/training',GraduationCap],['Performance','/hr/performance-matrix',UserRoundCheck],['Compliance','/hr/compliance',ShieldCheck],['Audit trail','/hr/audit',Activity],['Bulk actions','/hr/bulk-actions',Layers3]].map(([label, href, Icon]: any, actionIndex) => href === '#open-add-employee' ? <button key={`${label}-${href || 'button'}-${actionIndex}`} onClick={() => setAddOpen(true)} className="text-left rounded-2xl border border-slate-200 bg-white p-4 font-black text-slate-800 transition hover:border-violet-200 hover:bg-violet-50"><Icon className="mb-3 h-5 w-5 text-violet-600" />{label}</button> : <Link key={`${label}-${href}-${actionIndex}`} href={href} className="rounded-2xl border border-slate-200 bg-white p-4 font-black text-slate-800 transition hover:border-violet-200 hover:bg-violet-50"><Icon className="mb-3 h-5 w-5 text-violet-600" />{label}</Link>)}</div></section>
      </section>
    </div>
  </main>
</>
}

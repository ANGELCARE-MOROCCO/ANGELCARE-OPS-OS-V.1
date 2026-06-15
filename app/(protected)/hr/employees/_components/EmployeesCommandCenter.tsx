'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import HRModuleCommandBridge from '@/components/hr-production/HRModuleCommandBridge'
import { Activity, AlertTriangle, ArrowUpRight, BadgeCheck, BarChart3, BriefcaseBusiness, CalendarCheck, CheckCircle2, ChevronRight, ClipboardCheck, Clock3, DatabaseZap, FileBadge2, FileText, Fingerprint, Gauge, GraduationCap, Home, Layers3, MapPinned, Network, Plus, Search, ShieldCheck, Sparkles, UserCheck, UserCog, UserRoundCheck, Users, WalletCards, Workflow, Zap, X, Save, Mail, Phone, MapPin, CalendarDays, IdCard, Building2, Banknote, FileUp, Check, Bell, Settings, LayoutDashboard } from 'lucide-react'
import InteractiveMoroccoHRMap from '@/components/hr-production/InteractiveMoroccoHRMap'
import HREmployeeCommunicationHub from './HREmployeeCommunicationHub'
import Employee360DossierModal from './Employee360DossierModal'

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


function HRManagerAICopilotPanel({ command }: { command: any }) {
  const [lens, setLens] = useState<'briefing' | 'risk' | 'evidence' | 'people' | 'actions'>('briefing')
  const [mission, setMission] = useState('daily')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')

  const employees = Array.isArray(command.employees) ? command.employees : []
  const departments = Array.isArray(command.departmentBreakdown) ? command.departmentBreakdown : []
  const cities = Array.isArray(command.cityBreakdown) ? command.cityBreakdown : []
  const incomplete = Array.isArray(command.incompleteProfiles) ? command.incompleteProfiles : []

  const evidenceKeys = [
    ['attendance', 'Attendance'],
    ['leave', 'Leave'],
    ['payroll', 'Payroll'],
    ['documents', 'Documents'],
    ['contracts', 'Contracts'],
    ['roster', 'Roster'],
    ['training', 'Training'],
    ['performance', 'Performance'],
  ] as const

  const totalEmployees = Number(command.totals?.employees || employees.length || 0)
  const activeEmployees = Number(command.totals?.active || 0)
  const avgReadiness = Math.round(Number(command.avgReadiness || 0))
  const avgRisk = Math.round(Number(command.avgRisk || 0))

  const highRisk = employees.filter((e: any) => Number(e.__sync?.risk || 0) >= 50)
  const lowReadiness = employees.filter((e: any) => Number(e.__sync?.readiness || 0) < 60)
  const strongProfiles = employees.filter((e: any) => Number(e.__sync?.readiness || 0) >= 80 && Number(e.__sync?.risk || 0) <= 25)

  const evidenceStats = evidenceKeys.map(([key, label]) => {
    const covered = employees.filter((e: any) => Number(e.__sync?.[key] || 0) > 0).length
    const missing = Math.max(0, employees.length - covered)
    const coverage = employees.length ? Math.round((covered / employees.length) * 100) : 0
    return { key, label, covered, missing, coverage }
  })

  const weakestEvidence = [...evidenceStats].sort((a, b) => a.coverage - b.coverage)[0]
  const strongestEvidence = [...evidenceStats].sort((a, b) => b.coverage - a.coverage)[0]
  const evidenceCoverage = evidenceStats.length
    ? Math.round(evidenceStats.reduce((sum, item) => sum + item.coverage, 0) / evidenceStats.length)
    : 0

  const syncedRecords =
    Number(command.totals?.attendance || 0) +
    Number(command.totals?.contracts || 0) +
    Number(command.totals?.documents || 0) +
    Number(command.totals?.payroll || 0) +
    Number(command.totals?.leave || 0)

  const topDepartment = departments[0]
  const topCity = cities[0]
  const commandScore = Math.max(0, Math.round((avgReadiness + (100 - avgRisk) + evidenceCoverage) / 3))

  const priority =
    avgRisk >= 55
      ? 'Risk escalation and compliance cleanup'
      : incomplete.length > 0
        ? 'Profile completion and missing evidence'
        : evidenceCoverage < 55
          ? 'Sync coverage improvement'
          : avgReadiness < 75
            ? 'Readiness improvement'
            : 'Maintain HR operating discipline'

  const playbooks = [
    {
      id: 'daily',
      label: 'Daily HR briefing',
      lens: 'briefing',
      title: 'Daily HR operating briefing',
      text: `Today’s HR control picture: ${totalEmployees} employee profile(s), ${activeEmployees} active, ${pct(avgReadiness)} average readiness, ${pct(avgRisk)} average risk and ${pct(evidenceCoverage)} evidence coverage. The main priority is: ${priority}. Start by reviewing ${topDepartment?.name || 'the largest department'} and ${topCity?.name || 'the highest city group'} because they carry the highest operational visibility.`,
      actions: [['Open staff ledger', '/hr/employees'], ['Audit trail', '/hr/audit'], ['Sync center', '/hr/integrations']],
    },
    {
      id: 'risk',
      label: 'Risk scan',
      lens: 'risk',
      title: 'Risk and escalation scan',
      text: `${highRisk.length} employee profile(s) are currently in elevated risk range. ${lowReadiness.length} profile(s) are below readiness threshold. Recommended sequence: review missing documents, validate payroll linkage, check attendance identity mapping, then escalate profiles that remain above 50% risk after evidence cleanup.`,
      actions: [['Compliance', '/hr/compliance'], ['Documents', '/hr/documents'], ['Identity map', '/hr/attendance/identity-map']],
    },
    {
      id: 'evidence',
      label: 'Evidence cleanup',
      lens: 'evidence',
      title: 'Evidence and sync cleanup',
      text: `Evidence coverage is ${pct(evidenceCoverage)} across ${evidenceKeys.length} lanes. Weakest lane: ${weakestEvidence?.label || 'none'} at ${pct(weakestEvidence?.coverage || 0)}. Strongest lane: ${strongestEvidence?.label || 'none'} at ${pct(strongestEvidence?.coverage || 0)}. Immediate cleanup should focus on the weakest lane first, then payroll, contracts and attendance before management reporting.`,
      actions: [['Documents', '/hr/documents'], ['Contracts', '/hr/contracts'], ['Payroll', '/hr/payroll']],
    },
    {
      id: 'people',
      label: 'People focus',
      lens: 'people',
      title: 'People and department focus',
      text: `People view: ${strongProfiles.length} strong profile(s), ${lowReadiness.length} profile(s) needing completion and ${departments.length} department group(s). Highest concentration is ${topDepartment?.name || 'not available'} with ${topDepartment?.total || 0} total profile(s). HR should focus manager follow-up on low-readiness people before creating new operational tasks.`,
      actions: [['Performance', '/hr/performance-matrix'], ['Training', '/hr/training'], ['Work schedules', '/hr/work-schedules']],
    },
    {
      id: 'payroll',
      label: 'Payroll close',
      lens: 'actions',
      title: 'Payroll and month-close readiness',
      text: `Payroll readiness depends on active employee status, contract evidence, attendance coverage and payroll records. Current synced payroll records: ${Number(command.totals?.payroll || 0)}. Before closing payroll, validate active profiles, missing documents, attendance exceptions and employee contract status.`,
      actions: [['Payroll', '/hr/payroll'], ['Attendance', '/hr/attendance'], ['Contracts', '/hr/contracts']],
    },
    {
      id: 'onboarding',
      label: 'Onboarding rescue',
      lens: 'actions',
      title: 'Onboarding rescue plan',
      text: `${incomplete.length} profile(s) are still incomplete. Recommended rescue flow: complete identity, assign department and role, attach contract, upload mandatory documents, map attendance identity, then assign training and manager review.`,
      actions: [['Onboarding', '/hr/onboarding'], ['Add employee', '#open-add-employee'], ['Training', '/hr/training']],
    },
  ] as const

  const selected = playbooks.find((item) => item.id === mission) || playbooks[0]
  const visiblePlaybooks = playbooks.filter((item) => lens === 'briefing' ? true : item.lens === lens || item.id === 'daily')

  function askCopilot(seed?: string) {
    const q = String(seed || question || '').trim()
    const normalized = q.toLowerCase()

    if (!q) {
      setAnswer('Ask a specific HR question, or use one of the compact command buttons above. Example: “What should I fix before payroll?”')
      return
    }

    if (normalized.includes('payroll') || normalized.includes('salary')) {
      setAnswer(`Payroll answer: prioritize active employee validation, contract evidence, attendance exceptions and payroll-linked records. Current payroll-linked records: ${Number(command.totals?.payroll || 0)}. Weakness to check first: ${weakestEvidence?.label || 'evidence coverage'}.`)
      return
    }

    if (normalized.includes('risk') || normalized.includes('urgent') || normalized.includes('critical')) {
      setAnswer(`Risk answer: ${highRisk.length} profile(s) are high-risk and ${lowReadiness.length} profile(s) are below readiness. Start with missing documents and payroll linkage, then review attendance identity mapping. Escalate only profiles that remain above 50% risk after cleanup.`)
      return
    }

    if (normalized.includes('document') || normalized.includes('contract') || normalized.includes('evidence')) {
      setAnswer(`Evidence answer: overall evidence coverage is ${pct(evidenceCoverage)}. Weakest lane is ${weakestEvidence?.label || 'not available'} at ${pct(weakestEvidence?.coverage || 0)}. The user should open the relevant workspace, complete missing files, then re-check profile readiness.`)
      return
    }

    if (normalized.includes('city') || normalized.includes('location')) {
      setAnswer(`Location answer: ${cities.length} city group(s) are detected. Highest city concentration is ${topCity?.name || 'not available'} with ${topCity?.total || 0} profile(s). Validate city fields and attendance mapping before using location data for staffing decisions.`)
      return
    }

    if (normalized.includes('today') || normalized.includes('brief')) {
      setAnswer(`Daily briefing: ${totalEmployees} profiles, ${activeEmployees} active, ${pct(avgReadiness)} readiness, ${pct(avgRisk)} risk, ${pct(evidenceCoverage)} evidence coverage. Today’s priority is ${priority}.`)
      return
    }

    setAnswer(`HR copilot answer: based on the live employee module, the strongest next action is ${priority}. Workforce status: ${totalEmployees} profiles, ${highRisk.length} high-risk, ${lowReadiness.length} low-readiness, ${incomplete.length} incomplete, ${syncedRecords} synced records.`)
  }

  return (
    <div className="overflow-hidden rounded-[34px] border border-white/80 bg-white/95 shadow-[0_26px_80px_rgba(15,23,42,0.10)] ring-1 ring-slate-100">
      <div className="border-b border-slate-100 bg-gradient-to-br from-white via-violet-50/70 to-cyan-50/60 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-700">Interactive HR intelligence</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">HR Copilot Control Console</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
              Compact decision console scanning employees, departments, cities, readiness, risks and synced HR evidence.
            </p>
          </div>
          <div className="rounded-[22px] bg-slate-950 px-4 py-3 text-right text-white shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">Command score</p>
            <p className="mt-1 text-3xl font-black">{pct(commandScore)}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[10px] font-black">
          <div className="rounded-2xl bg-white px-2 py-2 text-slate-500 shadow-sm ring-1 ring-slate-100">Profiles<br /><span className="text-lg text-slate-950">{totalEmployees}</span></div>
          <div className="rounded-2xl bg-white px-2 py-2 text-emerald-700 shadow-sm ring-1 ring-emerald-100">Ready<br /><span className="text-lg text-slate-950">{pct(avgReadiness)}</span></div>
          <div className="rounded-2xl bg-white px-2 py-2 text-rose-700 shadow-sm ring-1 ring-rose-100">Risk<br /><span className="text-lg text-slate-950">{highRisk.length}</span></div>
          <div className="rounded-2xl bg-white px-2 py-2 text-cyan-700 shadow-sm ring-1 ring-cyan-100">Evidence<br /><span className="text-lg text-slate-950">{pct(evidenceCoverage)}</span></div>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4 grid grid-cols-5 gap-1 rounded-2xl bg-slate-50 p-1 text-[10px] font-black">
          {[
            ['briefing', 'Brief'],
            ['risk', 'Risk'],
            ['evidence', 'Evidence'],
            ['people', 'People'],
            ['actions', 'Actions'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setLens(key as any)}
              className={`rounded-xl px-2 py-2 transition ${lens === key ? 'bg-slate-950 text-white shadow-md' : 'bg-white text-slate-500 hover:text-violet-700'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {visiblePlaybooks.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMission(item.id)}
              className={`min-h-[66px] rounded-[18px] border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${
                mission === item.id ? 'border-violet-200 bg-violet-50 shadow-md' : 'border-slate-100 bg-white hover:bg-slate-50'
              }`}
            >
              <p className="text-sm font-black text-slate-950">{item.label}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Run command</p>
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-[24px] border border-violet-100 bg-gradient-to-br from-white to-violet-50 p-4 shadow-sm">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">Copilot output</p>
              <h3 className="mt-1 text-lg font-black text-slate-950">{selected.title}</h3>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-100">Live scan</span>
          </div>

          <div className="max-h-[160px] overflow-auto pr-1 text-sm font-bold leading-6 text-slate-600">
            {selected.text}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {selected.actions.map(([label, href]) => (
              href === '#open-add-employee' ? (
                <button
                  key={label}
                  type="button"
                  onClick={() => document.querySelector<HTMLButtonElement>('[data-open-add-employee]')?.click()}
                  className="rounded-2xl bg-slate-950 px-2 py-2 text-[10px] font-black text-white shadow-sm transition hover:bg-violet-700"
                >
                  {label}
                </button>
              ) : (
                <Link
                  key={`${label}-${href}`}
                  href={href}
                  className="rounded-2xl bg-slate-950 px-2 py-2 text-center text-[10px] font-black text-white shadow-sm transition hover:bg-violet-700"
                >
                  {label}
                </Link>
              )
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Ask compact copilot</p>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about payroll, risk, missing documents, city coverage, onboarding..."
            className="mt-2 min-h-[72px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700 outline-none ring-violet-200 focus:ring-4"
          />

          <div className="mt-2 grid grid-cols-3 gap-2">
            <button type="button" onClick={() => askCopilot()} className="rounded-2xl bg-violet-600 px-2 py-2 text-[10px] font-black text-white">Ask</button>
            <button type="button" onClick={() => askCopilot('urgent risk cleanup')} className="rounded-2xl border border-slate-200 bg-white px-2 py-2 text-[10px] font-black text-slate-700">Risk</button>
            <button type="button" onClick={() => askCopilot('payroll readiness')} className="rounded-2xl border border-slate-200 bg-white px-2 py-2 text-[10px] font-black text-slate-700">Payroll</button>
          </div>

          {answer ? (
            <div className="mt-3 max-h-[120px] overflow-auto rounded-2xl bg-slate-50 p-3 text-sm font-bold leading-6 text-slate-600 ring-1 ring-slate-100">
              {answer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}


function EmployeesLiveMapPanel({ command }: { command: any }) {
  const [mapData, setMapData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState<string>('')
  const [error, setError] = useState('')

  async function loadMapData() {
    try {
      setLoading(true)
      setError('')
      const res = await fetch('/api/hr/map-employees', { cache: 'no-store' })
      const payload = await res.json()
      if (!payload?.ok) throw new Error(payload?.error || 'Map API returned an invalid response')
      setMapData(payload.data)
      setLastSync(new Date().toLocaleTimeString())
    } catch (err: any) {
      setError(err?.message || 'Unable to load live map data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMapData()
    const timer = window.setInterval(loadMapData, 45000)
    return () => window.clearInterval(timer)
  }, [])

  const fallbackMarkers = Array.isArray(command.cityBreakdown)
    ? command.cityBreakdown.map((city: any, index: number) => ({
        city: city.name || `City ${index + 1}`,
        count: Number(city.total || 0),
        active: Number(city.total || 0),
        pending: 0,
        risk: 0,
        lat: 34.0209 + index * 0.08,
        lng: -6.8416 - index * 0.08,
        employees: [],
      }))
    : []

  const markers = Array.isArray(mapData?.cities) ? mapData.cities : fallbackMarkers
  const total = Number(mapData?.total || command.totals?.employees || 0)
  const approvals = markers.reduce((sum: number, city: any) => sum + Number(city.pending || 0), 0)
  const risks = markers.reduce((sum: number, city: any) => sum + Number(city.risk || 0), 0)
  const cityCount = Number(mapData?.city_count || markers.length || 0)

  return (
    <div id="coverage" className="overflow-hidden rounded-[34px] border border-white/80 bg-white/95 shadow-[0_26px_80px_rgba(15,23,42,0.10)] ring-1 ring-slate-100">
      <div className="border-b border-slate-100 bg-gradient-to-br from-white via-cyan-50/70 to-violet-50/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-700">Live workforce geography</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Employee Location Command Map</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
              Interactive OpenStreetMap view synced with real employee city data, city counts, employee markers and risk coverage.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadMapData}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white shadow-lg transition hover:bg-violet-700"
            >
              {loading ? 'Syncing...' : 'Refresh map'}
            </button>
            <span className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700">
              {lastSync ? `Synced ${lastSync}` : 'Live sync ready'}
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-cyan-100 bg-white px-3 py-2 text-xs font-black text-cyan-700 shadow-sm">
            City zones<br /><span className="text-xl text-slate-950">{cityCount}</span>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white px-3 py-2 text-xs font-black text-violet-700 shadow-sm">
            Employees mapped<br /><span className="text-xl text-slate-950">{total}</span>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-white px-3 py-2 text-xs font-black text-amber-700 shadow-sm">
            Pending signals<br /><span className="text-xl text-slate-950">{approvals}</span>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-white px-3 py-2 text-xs font-black text-rose-700 shadow-sm">
            Risk signals<br /><span className="text-xl text-slate-950">{risks}</span>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs font-black text-amber-700">
            {error}
          </div>
        ) : null}
      </div>

      <div className="p-4">
        <InteractiveMoroccoHRMap
          markers={markers}
          total={total}
          approvals={approvals}
          risks={risks}
        />
      </div>
    </div>
  )
}

export default function EmployeesCommandCenter({ command }: { command: Command }) {
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('all')
  const [status, setStatus] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null)
  const [communicationEmployee, setCommunicationEmployee] = useState<any>(null)
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
  <AddEmployeeModal
    open={addOpen}
    mode="create"
    onClose={() => setAddOpen(false)}
    departments={command.departments || []}
    cities={command.cities || []}
  />

  <Employee360DossierModal
    open={Boolean(selectedEmployee)}
    employee={selectedEmployee}
    onClose={() => setSelectedEmployee(null)}
    onSaved={() => window.location.reload()}
  />
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

        <section className="mt-6 grid items-stretch gap-5 2xl:grid-cols-12">
          <div id="directory" className="flex min-h-[calc(100vh-285px)] flex-col rounded-[34px] border border-white/80 bg-white/90 p-5 shadow-2xl shadow-slate-200/70 2xl:col-span-8">
            {(() => {
              const syncKeys = ['attendance', 'leave', 'payroll', 'documents', 'contracts', 'roster', 'training', 'performance'] as const
              const visibleCount = filtered.length
              const activeVisible = filtered.filter((e) => String(value(e, ['employment_status', 'status'], 'active')).toLowerCase().includes('active')).length
              const pendingVisible = filtered.filter((e) => String(value(e, ['employment_status', 'status'], '')).toLowerCase().includes('pending')).length
              const archivedVisible = filtered.filter((e) => String(value(e, ['employment_status', 'status'], '')).toLowerCase().includes('archiv')).length
              const avgReady = visibleCount ? Math.round(filtered.reduce((sum, e) => sum + Number(e.__sync?.readiness || 0), 0) / visibleCount) : 0
              const avgRisk = visibleCount ? Math.round(filtered.reduce((sum, e) => sum + Number(e.__sync?.risk || 0), 0) / visibleCount) : 0
              const highRiskVisible = filtered.filter((e) => Number(e.__sync?.risk || 0) >= 50).length
              const syncedObjects = filtered.reduce((sum, e) => sum + syncKeys.reduce((inner, key) => inner + Number(e.__sync?.[key] || 0), 0), 0)
              const missingDocuments = filtered.filter((e) => Number(e.__sync?.documents || 0) <= 0).length
              const fullSyncProfiles = filtered.filter((e) => syncKeys.filter((key) => Number(e.__sync?.[key] || 0) > 0).length >= 5).length
              const readinessTone = avgReady >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : avgReady >= 55 ? 'text-amber-700 bg-amber-50 border-amber-100' : 'text-rose-700 bg-rose-50 border-rose-100'
              const riskTone = avgRisk <= 20 ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : avgRisk <= 55 ? 'text-amber-700 bg-amber-50 border-amber-100' : 'text-rose-700 bg-rose-50 border-rose-100'

              return (
                <>
                  <div className="rounded-[34px] border border-white/80 bg-white/95 p-5 shadow-[0_28px_90px_rgba(15,23,42,0.08)] ring-1 ring-slate-100">
                    <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
                      <div className="max-w-4xl">
                        <div className="mb-2 inline-flex rounded-full bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-violet-700 ring-1 ring-violet-100">
                          Live People Operations Dashboard
                        </div>
                        <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-950 lg:text-4xl">
                          Employee Control & Sync Intelligence
                        </h2>
                        <p className="mt-2 max-w-4xl text-sm font-bold leading-6 text-slate-500">
                          Real-time employee directory connected to profile readiness, HR risk, operational records, evidence coverage and Employee 360 actions.
                        </p>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-3 2xl:min-w-[660px]">
                        <label className="relative">
                          <Search className="absolute left-3 top-3.5 h-4 w-4 text-violet-400" />
                          <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search employee, email, city, role..."
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-black text-slate-800 outline-none shadow-sm ring-violet-200 transition placeholder:text-slate-400 focus:ring-4"
                          />
                        </label>
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="h-12 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 shadow-sm outline-none ring-violet-200 focus:ring-4"
                        >
                          <option value="all">All departments</option>
                          {command.departments.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="h-12 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 shadow-sm outline-none ring-violet-200 focus:ring-4"
                        >
                          <option value="all">All workforce status</option>
                          <option value="active">Active</option>
                          <option value="archiv">Archived</option>
                          <option value="pending">Pending</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-[26px] border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Visible workforce</p>
                        <div className="mt-2 flex items-end justify-between">
                          <p className="text-4xl font-black tracking-tight text-slate-950">{visibleCount}</p>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase text-emerald-700 ring-1 ring-emerald-100">{activeVisible} active</span>
                        </div>
                        <p className="mt-2 text-xs font-bold text-slate-500">{pendingVisible} pending · {archivedVisible} archived in current view</p>
                      </div>

                      <div className={`rounded-[26px] border p-4 shadow-sm ${readinessTone}`}>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Average readiness</p>
                        <div className="mt-2 flex items-end justify-between">
                          <p className="text-4xl font-black tracking-tight">{pct(avgReady)}</p>
                          <span className="rounded-full bg-white/70 px-3 py-1 text-[10px] font-black uppercase">{fullSyncProfiles} strong profiles</span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-white/70">
                          <div className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${Math.max(4, avgReady)}%` }} />
                        </div>
                      </div>

                      <div className={`rounded-[26px] border p-4 shadow-sm ${riskTone}`}>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Risk control</p>
                        <div className="mt-2 flex items-end justify-between">
                          <p className="text-4xl font-black tracking-tight">{pct(avgRisk)}</p>
                          <span className="rounded-full bg-white/70 px-3 py-1 text-[10px] font-black uppercase">{highRiskVisible} high risk</span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-white/70">
                          <div className="h-2 rounded-full bg-gradient-to-r from-rose-500 to-amber-400" style={{ width: `${Math.max(2, avgRisk)}%` }} />
                        </div>
                      </div>

                      <div className="rounded-[26px] border border-cyan-100 bg-cyan-50 p-4 text-cyan-800 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-700/70">Synced evidence</p>
                        <div className="mt-2 flex items-end justify-between">
                          <p className="text-4xl font-black tracking-tight text-slate-950">{syncedObjects}</p>
                          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase text-cyan-700 ring-1 ring-cyan-100">{missingDocuments} missing docs</span>
                        </div>
                        <p className="mt-2 text-xs font-bold text-slate-500">Total linked HR objects across visible employees</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[34px] border border-violet-100 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.10)]">
                    <div className="border-b border-slate-100 bg-gradient-to-r from-white via-violet-50/50 to-cyan-50/50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-600">Live employee evidence register</p>
                          <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">Operational Workforce Ledger</h3>
                          <p className="mt-1 text-xs font-bold text-slate-500">Every row displays real profile state, readiness score, risk exposure and synced HR evidence lanes.</p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[11px] font-black">
                          <span className="rounded-full bg-slate-950 px-3 py-2 text-white">Open 360 profile</span>
                          <span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-700 ring-1 ring-emerald-100">Synced evidence</span>
                          <span className="rounded-full bg-rose-50 px-3 py-2 text-rose-700 ring-1 ring-rose-100">Risk monitored</span>
                        </div>
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-auto">
                      <table className="w-full min-w-[1260px] border-separate border-spacing-0 text-left text-sm">
                        <thead className="sticky top-0 z-20 bg-slate-950 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-xl">
                          <tr>
                            <th className="px-5 py-4">Employee command profile</th>
                            <th className="px-5 py-4">Role & assignment</th>
                            <th className="px-5 py-4">Org / location</th>
                            <th className="px-5 py-4">HR state</th>
                            <th className="px-5 py-4">Readiness / risk</th>
                            <th className="px-5 py-4">Live evidence lanes</th>
                            <th className="px-5 py-4 text-right">Control actions</th>
                          </tr>
                        </thead>

                        <tbody className="bg-white">
                          {filtered.map((e) => {
                            const id = value(e, ['id'], '')
                            const name = value(e, ['full_name', 'name', 'email'], 'Unnamed employee')
                            const email = value(e, ['email', 'phone'], 'No contact')
                            const role = value(e, ['position', 'job_title', 'role'], 'Role not defined')
                            const dept = value(e, ['department'], 'Unassigned')
                            const city = value(e, ['city', 'location'], 'No city')
                            const currentStatus = value(e, ['employment_status', 'status'], 'active')
                            const ready = Number(e.__sync?.readiness || 0)
                            const risk = Number(e.__sync?.risk || 0)
                            const rowReadyTone = ready >= 80 ? 'text-emerald-700 bg-emerald-50 ring-emerald-100' : ready >= 50 ? 'text-amber-700 bg-amber-50 ring-amber-100' : 'text-rose-700 bg-rose-50 ring-rose-100'
                            const rowRiskTone = risk <= 20 ? 'text-emerald-700 bg-emerald-50 ring-emerald-100' : risk <= 55 ? 'text-amber-700 bg-amber-50 ring-amber-100' : 'text-rose-700 bg-rose-50 ring-rose-100'
                            const syncItems = [
                              ['A', 'Attendance', e.__sync?.attendance],
                              ['L', 'Leave', e.__sync?.leave],
                              ['P', 'Payroll', e.__sync?.payroll],
                              ['D', 'Documents', e.__sync?.documents],
                              ['C', 'Contracts', e.__sync?.contracts],
                              ['R', 'Roster', e.__sync?.roster],
                              ['T', 'Training', e.__sync?.training],
                              ['Q', 'Performance', e.__sync?.performance],
                            ]
                            const syncedCount = syncItems.filter(([, , count]) => Number(count || 0) > 0).length
                            const evidenceScore = Math.round((syncedCount / syncItems.length) * 100)

                            return (
                              <tr
                                key={id || value(e, ['email', 'full_name'])}
                                className="group border-b border-slate-100 transition hover:bg-gradient-to-r hover:from-violet-50/60 hover:to-cyan-50/40"
                              >
                                <td className="border-b border-slate-100 px-5 py-4">
                                  <div className="flex items-center gap-4">
                                    <div className="relative">
                                      <div className="grid h-16 w-16 place-items-center rounded-[24px] bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400 text-base font-black text-white shadow-xl shadow-violet-200">
                                        {name.slice(0, 2).toUpperCase()}
                                      </div>
                                      <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white shadow-sm ${String(currentStatus).toLowerCase().includes('active') ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                    </div>
                                    <div className="min-w-0">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedEmployee(e)}
                                        className="block truncate text-left text-base font-black tracking-tight text-slate-950 transition group-hover:text-violet-700"
                                      >
                                        {name}
                                      </button>
                                      <div className="mt-1 truncate text-xs font-black uppercase text-violet-600">{email}</div>
                                      <div className="mt-2 flex flex-wrap gap-1.5">
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
                                          ID {id ? String(id).slice(0, 8) : 'pending'}
                                        </span>
                                        <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-cyan-700">
                                          Evidence {evidenceScore}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="border-b border-slate-100 px-5 py-4">
                                  <div className="rounded-[22px] border border-slate-100 bg-gradient-to-br from-white to-slate-50 px-4 py-3 shadow-sm">
                                    <p className="text-sm font-black text-slate-900">{role}</p>
                                    <p className="mt-1 text-[11px] font-bold text-slate-400">Current operational assignment</p>
                                  </div>
                                </td>

                                <td className="border-b border-slate-100 px-5 py-4">
                                  <div className="flex flex-col gap-2">
                                    <span className="inline-flex w-fit items-center rounded-full bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-violet-700 ring-1 ring-violet-100">
                                      {dept}
                                    </span>
                                    <span className="inline-flex w-fit items-center rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-cyan-700 ring-1 ring-cyan-100">
                                      ● {city}
                                    </span>
                                  </div>
                                </td>

                                <td className="border-b border-slate-100 px-5 py-4">
                                  <Pill className={statusTone(currentStatus)}>{currentStatus}</Pill>
                                  <p className="mt-2 text-[11px] font-bold text-slate-400">Live employee state</p>
                                </td>

                                <td className="border-b border-slate-100 px-5 py-4">
                                  <div className="w-56 rounded-[22px] border border-slate-100 bg-white p-3 shadow-sm">
                                    <div className="mb-2 grid grid-cols-2 gap-2 text-xs font-black">
                                      <span className={`rounded-full px-2 py-1 text-center ring-1 ${rowReadyTone}`}>Ready {pct(ready)}</span>
                                      <span className={`rounded-full px-2 py-1 text-center ring-1 ${rowRiskTone}`}>Risk {pct(risk)}</span>
                                    </div>
                                    <div className="rounded-full bg-slate-100 p-1">
                                      <Progress value={ready} />
                                    </div>
                                    <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                                      <div
                                        className="h-1.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-400"
                                        style={{ width: `${Math.max(0, Math.min(risk, 100))}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>

                                <td className="border-b border-slate-100 px-5 py-4">
                                  <div>
                                    <div className="mb-2 flex items-center justify-between text-[11px] font-black text-slate-500">
                                      <span>Evidence lanes</span>
                                      <span className={evidenceScore >= 60 ? 'text-emerald-700' : evidenceScore >= 30 ? 'text-amber-700' : 'text-rose-700'}>{syncedCount}/8 synced</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-1.5">
                                      {syncItems.map(([code, label, count]) => {
                                        const numeric = Number(count || 0)
                                        return (
                                          <span
                                            key={String(code)}
                                            title={`${label}: ${numeric} linked record(s)`}
                                            className={`rounded-xl px-2 py-1.5 text-center text-[10px] font-black ${
                                              numeric > 0
                                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                                                : 'bg-slate-50 text-slate-400 ring-1 ring-slate-100'
                                            }`}
                                          >
                                            {code}:{numeric}
                                          </span>
                                        )
                                      })}
                                    </div>
                                  </div>
                                </td>

                                <td className="border-b border-slate-100 px-5 py-4">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedEmployee(e)}
                                      className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-violet-700"
                                    >
                                      Open 360
                                    </button>
                                    <Link
                                      href={id ? `/hr/employees/${id}` : '/hr/attendance'}
                                      className="rounded-full border border-violet-100 bg-white px-4 py-2 text-xs font-black text-violet-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-50"
                                    >
                                      Ops layer
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}

                          {!filtered.length ? (
                            <tr>
                              <td colSpan={7} className="px-5 py-12 text-center">
                                <div className="mx-auto max-w-md rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8">
                                  <p className="text-lg font-black text-slate-900">No employee profiles match this command view</p>
                                  <p className="mt-2 text-sm font-bold text-slate-500">
                                    Adjust search, department or workforce status filters to recover profiles.
                                  </p>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>

          <div id="control" className="space-y-5 2xl:col-span-4">
            <HRManagerAICopilotPanel command={command} />
            <EmployeesLiveMapPanel command={command} />
          </div>
        </section>

        <HREmployeeCommunicationHub
          employees={filtered.length ? filtered : command.employees}
          selectedEmployee={communicationEmployee}
          onSelectEmployee={setCommunicationEmployee}
        />

        
      </section>
    </div>
  </main>
</>
}

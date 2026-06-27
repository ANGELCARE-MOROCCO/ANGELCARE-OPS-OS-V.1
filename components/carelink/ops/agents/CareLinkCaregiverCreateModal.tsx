'use client'

import { type ReactNode, useEffect, useMemo, useState } from 'react'

type TabKey = 'identity' | 'access' | 'roster' | 'finance' | 'history' | 'training'
type AnyRecord = Record<string, any>

type PaymentEditorDraft = {
  id?: number | null
  label: string
  missionId: string
  amount: string
  currency: string
  status: string
  periodStart: string
  periodEnd: string
  notes: string
}

function emptyPaymentEditorDraft(): PaymentEditorDraft {
  return {
    id: null,
    label: '',
    missionId: '',
    amount: '',
    currency: 'MAD',
    status: 'draft',
    periodStart: '',
    periodEnd: '',
    notes: '',
  }
}


const TAB_META: { key: TabKey; label: string; kicker: string; detail: string; icon: string }[] = [
  { key: 'identity', label: 'Identity & eligibility', kicker: 'Core agent file', detail: 'Profile, skills, languages, mission categories and readiness.', icon: 'ID' },
  { key: 'access', label: 'App access & permissions', kicker: 'CareLink mobile', detail: 'Username, password, access status, app permissions and device policy.', icon: 'APP' },
  { key: 'roster', label: 'Roster conditions', kicker: 'Planning rules', detail: 'Days, time windows, zones, workload limits, emergency replacement.', icon: 'CAL' },
  { key: 'finance', label: 'Honoraires & payment control', kicker: 'Finance sync', detail: 'Rates, allowances, payout mode, bank/wallet and payment validations.', icon: 'MAD' },
  { key: 'history', label: 'Live mission history', kicker: 'Synced missions', detail: 'Assigned missions, statuses, completed services and action links.', icon: 'OPS' },
  { key: 'training', label: 'Training & compliance', kicker: 'Academy readiness', detail: 'Learning path, certifications, onboarding and compliance statuses.', icon: 'EDU' },
]

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const SKILLS = ['First Aid', 'Hygiene Protocol', 'Positive Discipline', 'Newborn Care', 'Post-Partum Support', 'Special Needs', 'School Support', 'Animation', 'Meal Routine', 'Night Support', 'Route Reporting', 'Emergency Escalation']
const MISSIONS = ['Childcare at Home', 'Baby Post-Partum Support', 'Special Child at Home', 'Special Child at School', 'Hybrid Support', 'Animation', 'Excursion', 'Academy Support', 'Flashcards']
const LANGUAGES = ['French', 'Arabic', 'English', 'Spanish']

function text(value: unknown, fallback = '') { return value === null || value === undefined || value === '' ? fallback : String(value) }
function number(value: unknown) { const n = Number(value); return Number.isFinite(n) ? n : 0 }

function Field({ label, value, setValue, placeholder = '', type = 'text' }: { label: string; value: string; setValue: (v: string) => void; placeholder?: string; type?: string }) {
  return <label className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</span><input type={type} value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="mt-3 w-full bg-transparent text-sm font-black text-slate-950 outline-none placeholder:text-slate-300" /></label>
}

function Area({ label, value, setValue, placeholder = '', rows = 4 }: { label: string; value: string; setValue: (v: string) => void; placeholder?: string; rows?: number }) {
  return <label className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</span><textarea rows={rows} value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="mt-3 w-full resize-none bg-transparent text-sm font-bold leading-6 text-slate-700 outline-none placeholder:text-slate-300" /></label>
}

function Select({ label, value, setValue, options }: { label: string; value: string; setValue: (v: string) => void; options: string[] }) {
  return <label className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</span><select value={value} onChange={(e) => setValue(e.target.value)} className="mt-3 w-full bg-transparent text-sm font-black text-slate-950 outline-none">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
}

function Check({ label, checked, setChecked, detail }: { label: string; checked: boolean; setChecked: (v: boolean) => void; detail?: string }) {
  return <button type="button" onClick={() => setChecked(!checked)} className={`rounded-2xl border p-4 text-left shadow-sm transition ${checked ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}><div className="flex items-center justify-between gap-3"><span className="text-sm font-black text-slate-950">{label}</span><span className={`h-4 w-4 rounded-full ${checked ? 'bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,.13)]' : 'bg-slate-300'}`} /></div>{detail ? <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{detail}</p> : null}</button>
}

function ChipGrid({ label, options, selected, setSelected }: { label: string; options: string[]; selected: string[]; setSelected: (v: string[]) => void }) {
  return <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"><div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</div><div className="mt-3 flex flex-wrap gap-2">{options.map((option) => { const active = selected.includes(option); return <button key={option} type="button" onClick={() => setSelected(active ? selected.filter((x) => x !== option) : [...selected, option])} className={`rounded-full px-3 py-2 text-xs font-black ${active ? 'bg-blue-600 text-white shadow-sm' : 'border border-slate-200 bg-slate-50 text-slate-600'}`}>{option}</button> })}</div></div>
}

function Panel({ title, subtitle, children, action }: { title: string; subtitle: string; children: ReactNode; action?: ReactNode }) {
  return <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600">Workspace</div><h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">{title}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p></div>{action}</div>{children}</section>
}

function Stat({ label, value, tone = 'slate' }: { label: string; value: string | number; tone?: 'slate' | 'emerald' | 'blue' | 'amber' | 'rose' }) {
  const cls = { slate: 'bg-slate-50 text-slate-700 border-slate-200', emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200', blue: 'bg-blue-50 text-blue-700 border-blue-200', amber: 'bg-amber-50 text-amber-700 border-amber-200', rose: 'bg-rose-50 text-rose-700 border-rose-200' }[tone]
  return <div className={`rounded-2xl border p-4 ${cls}`}><div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{label}</div><div className="mt-2 text-2xl font-black text-slate-950">{value}</div></div>
}

export function CareLinkCaregiverCreateModal({
  open,
  onClose,
  initialCaregiver = null,
  mode = 'create',
  onSaved,
}: {
  open: boolean
  onClose: () => void
  initialCaregiver?: AnyRecord | null
  mode?: 'create' | 'edit'
  onSaved?: () => void
}) {
  const [tab, setTab] = useState<TabKey>('identity')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [error, setError] = useState('')
  const [createdId, setCreatedId] = useState<number | null>(null)
  const [command, setCommand] = useState<AnyRecord | null>(null)
  const [agentFullCommand, setAgentFullCommand] = useState<AnyRecord | null>(null)
  const [agentCommandLoading, setAgentCommandLoading] = useState(false)
  const [agentCommandNotice, setAgentCommandNotice] = useState('')

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('Rabat')
  const [zone, setZone] = useState('')
  const [status, setStatus] = useState('available')
  const [role, setRole] = useState('Caregiver')
  const [skills, setSkills] = useState<string[]>([])
  const [missionTypes, setMissionTypes] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>(['French', 'Arabic'])
  const [academyCertified, setAcademyCertified] = useState(false)
  const [specialNeeds, setSpecialNeeds] = useState(false)

  const [loginEmail, setLoginEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accessLevel, setAccessLevel] = useState('carelink_mobile_agent')
  const [mobileEnabled, setMobileEnabled] = useState(true)
  const [canViewMissions, setCanViewMissions] = useState(true)
  const [canAcceptMissions, setCanAcceptMissions] = useState(true)
  const [canSubmitReports, setCanSubmitReports] = useState(true)
  const [canViewPayments, setCanViewPayments] = useState(false)
  const [accessStatus, setAccessStatus] = useState('active')
  const [shutdownReason, setShutdownReason] = useState('')
  const [shutdownUntil, setShutdownUntil] = useState('')
  const [securityNotes, setSecurityNotes] = useState('')
  const [sessionLimit, setSessionLimit] = useState('1')
  const [geoFenceRequired, setGeoFenceRequired] = useState(false)
  const [pinResetRequired, setPinResetRequired] = useState(false)
  const [emergencyAccessAllowed, setEmergencyAccessAllowed] = useState(false)

  const [devicePolicy, setDevicePolicy] = useState('Personal phone authorized with secure session.')

  const [preferredDays, setPreferredDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('18:00')
  const [maxDailyHours, setMaxDailyHours] = useState('8')
  const [maxWeeklyHours, setMaxWeeklyHours] = useState('40')
  const [preferredZones, setPreferredZones] = useState('')
  const [excludedZones, setExcludedZones] = useState('')
  const [acceptWeekends, setAcceptWeekends] = useState(false)
  const [acceptNight, setAcceptNight] = useState(false)
  const [acceptEmergency, setAcceptEmergency] = useState(true)
  const [transportRequired, setTransportRequired] = useState(false)
  const [rosterNotes, setRosterNotes] = useState('')

  const [hourlyRate, setHourlyRate] = useState('')
  const [dailyRate, setDailyRate] = useState('')
  const [missionRate, setMissionRate] = useState('')
  const [overtimeRate, setOvertimeRate] = useState('')
  const [transportAllowance, setTransportAllowance] = useState('')
  const [paymentMode, setPaymentMode] = useState('monthly')
  const [paymentCycle, setPaymentCycle] = useState('monthly')
  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [walletPhone, setWalletPhone] = useState('')
  const [financeNotes, setFinanceNotes] = useState('')
  const [validationAmount, setValidationAmount] = useState('')
  const [validationMissionId, setValidationMissionId] = useState('')
  const [validationNotes, setValidationNotes] = useState('')
  const [paymentDraft, setPaymentDraft] = useState<PaymentEditorDraft>(() => emptyPaymentEditorDraft())
  const [paymentEditorMode, setPaymentEditorMode] = useState<'create' | 'edit'>('create')

  const [trainingPath, setTrainingPath] = useState('CareLink mobile onboarding + hygiene + mission reporting')
  const [onboardingStatus, setOnboardingStatus] = useState('pending')
  const [hygieneStatus, setHygieneStatus] = useState('pending')
  const [reportingStatus, setReportingStatus] = useState('pending')
  const [emergencyStatus, setEmergencyStatus] = useState('pending')
  const [specialNeedsStatus, setSpecialNeedsStatus] = useState('not_required')
  const [certificationStatus, setCertificationStatus] = useState('pending')
  const [nextTrainingDate, setNextTrainingDate] = useState('')
  const [trainerName, setTrainerName] = useState('')
  const [learningNotes, setLearningNotes] = useState('')

  const readiness = useMemo(() => {
    let score = 0
    if (fullName.trim()) score += 12
    if (phone.trim()) score += 10
    if (email.trim()) score += 8
    if (city.trim()) score += 8
    if (zone.trim()) score += 7
    if (skills.length) score += 12
    if (missionTypes.length) score += 12
    if (languages.length) score += 8
    if (mobileEnabled && loginEmail.trim()) score += 10
    if (preferredDays.length && startTime && endTime) score += 8
    if (hourlyRate || dailyRate || missionRate) score += 5
    return Math.min(100, score)
  }, [fullName, phone, email, city, zone, skills, missionTypes, languages, mobileEnabled, loginEmail, preferredDays, startTime, endTime, hourlyRate, dailyRate, missionRate])

  function splitList(value: string) { return value.split(',').map((x) => x.trim()).filter(Boolean) }
  function generatePassword() { setPassword(`AC-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Math.floor(1000 + Math.random() * 8999)}`) }

  async function api(path: string, body: AnyRecord) {
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) })
    const json = await res.json()
    if (!json?.ok) throw new Error(json?.error || `Request failed: ${path}`)
    return json
  }

  
  
  async function deleteExistingCaregiverPermanently() {
    const id = Number(createdId || initialCaregiver?.id)

    if (!isEditMode || !Number.isFinite(id) || !id) {
      setError('Permanent delete is available only for an existing caregiver profile.')
      return
    }

    if (deleteConfirmText.trim() !== 'DELETE') {
      setError('Type DELETE to confirm permanent caregiver deletion.')
      return
    }

    setBusy(true)
    setError('')
    setNotice('')

    try {
      const res = await fetch(`/api/carelink/ops/agents/${id}/profile`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          confirm: 'DELETE',
          caregiver_name: fullName,
        }),
      })

      const json = await res.json()

      if (!json?.ok) {
        throw new Error(json?.error || 'Unable to delete caregiver permanently.')
      }

      setNotice('Caregiver deleted permanently.')
      onSaved?.()
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to delete caregiver permanently.')
    } finally {
      setBusy(false)
    }
  }

async function saveProfileChanges() {
    const id = Number(createdId || initialCaregiver?.id)

    if (!Number.isFinite(id) || !id) {
      await createProfile()
      return
    }

    if (!fullName.trim()) {
      setError('Full name is required before saving profile changes.')
      setTab('identity')
      return
    }

    setBusy(true)
    setError('')
    setNotice('')

    try {
      const res = await fetch(`/api/carelink/ops/agents/${id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          email,
          city,
          zone,
          status,
          role,
          skills,
          languages,
          mission_types: missionTypes,
          academy_certified: academyCertified,
          special_needs_capable: specialNeeds,
          readiness_score: readiness,
          reliability_score: readiness,
          summary: `Updated from CareLink Agent Command Console on ${new Date().toLocaleString()}`,
          notes: `Updated from CareLink Agent Command Console on ${new Date().toLocaleString()}`,
        }),
      })

      const json = await res.json()

      if (!json?.ok) {
        throw new Error(json?.error || 'Unable to update caregiver profile.')
      }

      setNotice('Caregiver profile changes saved.')
      await refreshCommand()
      onSaved?.()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to update caregiver profile.')
    } finally {
      setBusy(false)
    }
  }

async function createProfile() {
    setBusy(true); setError(''); setNotice('')
    try {
      const json = await api('/api/carelink/ops/agents/create', {
        full_name: fullName, phone, email, city, zone, status, role, skills, mission_types: missionTypes, languages, academy_certified: academyCertified, special_needs_capable: specialNeeds, readiness_score: readiness, reliability_score: readiness, roster_notes: rosterNotes, payment_mode: paymentMode, hourly_rate: hourlyRate,
      })
      const id = Number(json.caregiver?.id)
      if (Number.isFinite(id)) setCreatedId(id)
      setNotice(`Caregiver profile created #${id || ''}`)
      return id
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create profile.'); return null }
    finally { setBusy(false) }
  }

  async function ensureProfile() {
    if (createdId) return createdId
    return createProfile()
  }

  async function refreshCommand(id = createdId) {
    if (!id) return
    try {
      const res = await fetch(`/api/carelink/ops/agents/${id}/command`, { cache: 'no-store' })
      const json = await res.json()
      if (json?.ok) setCommand(json)
    } catch {}
  }

  useEffect(() => { if (tab === 'history' || tab === 'finance' || tab === 'access') refreshCommand() }, [tab, createdId])

  async function saveMobileAccess(action: 'save' | 'shutdown' | 'restore' = 'save') {
    const id = await ensureProfile()
    if (!id) return

    if (action === 'shutdown' && !shutdownReason.trim()) {
      setError('Shutdown reason is required before temporarily disabling mobile access.')
      setTab('access')
      return
    }

    setBusy(true)
    setError('')
    setNotice('')

    const targetStatus =
      action === 'shutdown'
        ? 'temporarily_suspended'
        : action === 'restore'
          ? 'active'
          : accessStatus

    const targetMobileEnabled =
      action === 'shutdown'
        ? false
        : action === 'restore'
          ? true
          : mobileEnabled

    try {
      const res = await fetch(`/api/carelink/ops/agents/${id}/mobile-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          action,
          email: loginEmail || email,
          password,
          access_level: accessLevel,
          access_status: targetStatus,
          mobile_enabled: targetMobileEnabled,
          can_view_missions: canViewMissions,
          can_accept_missions: canAcceptMissions,
          can_submit_reports: canSubmitReports,
          can_view_payments: canViewPayments,
          device_policy: devicePolicy,
          session_limit: sessionLimit,
          geo_fence_required: geoFenceRequired,
          pin_reset_required: pinResetRequired,
          emergency_access_allowed: emergencyAccessAllowed,
          suspension_reason: shutdownReason,
          shutdown_until: shutdownUntil || null,
          security_notes: securityNotes,
          notes: securityNotes,
          admin_name: 'CareLink Ops Admin',
        }),
      })

      const json = await res.json()

      if (!json?.ok) {
        throw new Error(json?.error || 'Unable to save mobile access.')
      }

      setAccessStatus(targetStatus)
      setMobileEnabled(targetMobileEnabled)

      if (action === 'shutdown') {
        setNotice('CareLink Mobile access temporarily suspended.')
      } else if (action === 'restore') {
        setNotice('CareLink Mobile access restored.')
      } else {
        setNotice(json.authWarning ? `Mobile access saved. Auth warning: ${json.authWarning}` : 'Mobile access saved.')
      }

      await refreshCommand()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to save mobile access.')
    } finally {
      setBusy(false)
    }
  }

  function shutdownMobileAccess() {
    void saveMobileAccess('shutdown')
  }

  function restoreMobileAccess() {
    void saveMobileAccess('restore')
  }


  async function saveRoster() {
    const id = await ensureProfile(); if (!id) return
    setBusy(true); setError(''); setNotice('')
    try {
      await api(`/api/carelink/ops/agents/${id}/roster`, { preferred_days: preferredDays, preferred_start_time: startTime, preferred_end_time: endTime, max_daily_hours: maxDailyHours, max_weekly_hours: maxWeeklyHours, preferred_zones: splitList(preferredZones), excluded_zones: splitList(excludedZones), accepts_weekends: acceptWeekends, accepts_night: acceptNight, accepts_emergency_replacement: acceptEmergency, transport_required: transportRequired, roster_notes: rosterNotes })
      setNotice('Roster conditions saved and synced.')
      refreshCommand(id)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save roster.') }
    finally { setBusy(false) }
  }

  async function savePayments() {
    const id = await ensureProfile(); if (!id) return
    setBusy(true); setError(''); setNotice('')
    try {
      await api(`/api/carelink/ops/agents/${id}/payments`, { hourly_rate: hourlyRate, daily_rate: dailyRate, mission_rate: missionRate, overtime_rate: overtimeRate, transport_allowance: transportAllowance, payment_mode: paymentMode, payment_cycle: paymentCycle, bank_name: bankName, bank_account: bankAccount, wallet_phone: walletPhone, finance_notes: financeNotes })
      setNotice('Honoraires and finance configuration saved.')
      refreshCommand(id)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save payments.') }
    finally { setBusy(false) }
  }

  function loadPaymentForEdit(row: AnyRecord) {
    setPaymentEditorMode('edit')
    setPaymentDraft({
      id: number(row.id),
      label: text(row.label || row.validation_type || 'Payment record'),
      missionId: text(row.mission_id),
      amount: text(row.amount),
      currency: text(row.currency, 'MAD'),
      status: text(row.status, 'draft'),
      periodStart: text(row.period_start).slice(0, 10),
      periodEnd: text(row.period_end).slice(0, 10),
      notes: text(row.notes),
    })
    setValidationMissionId(text(row.mission_id))
    setValidationAmount(text(row.amount))
    setValidationNotes(text(row.notes))
  }

  function resetPaymentEditor() {
    setPaymentEditorMode('create')
    setPaymentDraft(emptyPaymentEditorDraft())
    setValidationMissionId('')
    setValidationAmount('')
    setValidationNotes('')
  }

  async function savePaymentRecord(nextStatus?: string) {
    const id = await ensureProfile(); if (!id) return
    const amount = number(paymentDraft.amount || validationAmount)
    if (!amount || amount <= 0) {
      setError('Payment amount is required.')
      return
    }
    setBusy(true); setError(''); setNotice('')
    try {
      const payload = {
        id: paymentDraft.id,
        label: paymentDraft.label || 'Payment record',
        mission_id: paymentDraft.missionId || validationMissionId || null,
        amount,
        currency: paymentDraft.currency || 'MAD',
        status: nextStatus || paymentDraft.status || 'draft',
        period_start: paymentDraft.periodStart || null,
        period_end: paymentDraft.periodEnd || null,
        notes: paymentDraft.notes || validationNotes,
        validation_type: 'manual',
      }
      const res = await fetch(`/api/carelink/ops/agents/${id}/payments`, {
        method: paymentEditorMode === 'edit' && paymentDraft.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || 'Unable to save payment record.')
      setNotice(paymentEditorMode === 'edit' ? 'Payment record updated.' : 'Payment record captured.')
      resetPaymentEditor()
      refreshCommand(id)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save payment record.') }
    finally { setBusy(false) }
  }

  async function validatePaymentRecord(row: AnyRecord) {
    const id = await ensureProfile(); if (!id) return
    setBusy(true); setError(''); setNotice('')
    try {
      const res = await fetch(`/api/carelink/ops/agents/${id}/payments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: row.id, status: 'validated', validated_by: 'CareLink Ops Admin' }),
      })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || 'Unable to validate payment record.')
      setNotice('Payment record validated.')
      refreshCommand(id)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to validate payment record.') }
    finally { setBusy(false) }
  }

  async function deletePaymentRecord(row: AnyRecord) {
    const id = await ensureProfile(); if (!id) return
    if (!window.confirm('Delete this payment record permanently?')) return
    setBusy(true); setError(''); setNotice('')
    try {
      const res = await fetch(`/api/carelink/ops/agents/${id}/payments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: row.id }),
      })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || 'Unable to delete payment record.')
      setNotice('Payment record permanently deleted.')
      refreshCommand(id)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to delete payment record.') }
    finally { setBusy(false) }
  }

  async function validatePayment() {
    await savePaymentRecord('validated')
  }

  async function saveTraining() {
    const id = await ensureProfile(); if (!id) return
    setBusy(true); setError(''); setNotice('')
    try {
      await api(`/api/carelink/ops/agents/${id}/training`, { training_path: trainingPath, onboarding_status: onboardingStatus, hygiene_status: hygieneStatus, reporting_status: reportingStatus, emergency_status: emergencyStatus, special_needs_status: specialNeedsStatus, certification_status: certificationStatus, next_training_date: nextTrainingDate, trainer_name: trainerName, learning_notes: learningNotes })
      setNotice('Training plan saved and synced.')
      refreshCommand(id)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save training.') }
    finally { setBusy(false) }
  }

  
  // Existing caregiver edit prefill
  const isEditMode = mode === 'edit' || Boolean(initialCaregiver?.id)

  function modalList(value: unknown) {
    if (Array.isArray(value)) return value.map((x) => text(x, '')).filter(Boolean)
    return text(value, '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
  }

  useEffect(() => {
    if (!open || !initialCaregiver) return

    const row = initialCaregiver

    setCreatedId(Number(row.id) || null)
    setFullName(text(row.full_name || row.name || row.display_name, ''))
    setPhone(text(row.phone || row.mobile || row.phone_number, ''))
    setEmail(text(row.email, ''))
    setLoginEmail(text(row.email || row.login_email, ''))
    setCity(text(row.city || row.location_city || row.base_city, 'Rabat'))
    setZone(text(row.zone || row.location_zone || row.base_zone, ''))
    setStatus(text(row.current_status || row.status || row.availability_status, 'available'))
    setRole(text(row.role || row.function || row.position, 'Caregiver'))
    setAcademyCertified(Boolean(row.academy_certified))
    setSpecialNeeds(Boolean(row.special_needs_capable))

    const incomingSkills = modalList(row.skill_tags || row.skills || row.competencies || row.tags)
    if (incomingSkills.length) setSkills(incomingSkills)

    const incomingLanguages = modalList(row.languages)
    if (incomingLanguages.length) setLanguages(incomingLanguages)

    const incomingMissionTypes = modalList(row.mission_types || row.missionTypes)
    if (incomingMissionTypes.length) setMissionTypes(incomingMissionTypes)

    setNotice('')
    setError('')
    setTab('identity')
  }, [open, initialCaregiver])

  useEffect(() => {
    if (!open || !isEditMode || !createdId) return
    void refreshCommand()
  }, [open, isEditMode, createdId])


  async function loadExistingAgentFullCommand(targetId?: number | null) {
    const id = Number(targetId || createdId || initialCaregiver?.id)
    if (!Number.isFinite(id) || !id) return

    setAgentCommandLoading(true)
    setAgentCommandNotice('')

    try {
      const res = await fetch(`/api/carelink/ops/agents/${id}/command`, { cache: 'no-store', headers: { Accept: 'application/json' } })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || 'Unable to load full caregiver command.')

      const command = json.command || {}
      const caregiver = command.caregiver || {}
      const access = command.access || {}

      setAgentFullCommand(command)
      if (caregiver) setFullName(String(caregiver.full_name || caregiver.name || caregiver.display_name || ''))
      if (caregiver) setPhone(String(caregiver.phone || caregiver.mobile || caregiver.phone_number || ''))
      if (caregiver) setEmail(String(caregiver.email || ''))
      if (caregiver) setLoginEmail(String(access.email || caregiver.email || ''))
      if (caregiver) setCity(String(caregiver.city || caregiver.location_city || caregiver.base_city || 'Rabat'))
      if (caregiver) setZone(String(caregiver.zone || caregiver.location_zone || caregiver.base_zone || ''))
      if (caregiver) setStatus(String(caregiver.current_status || caregiver.status || caregiver.availability_status || 'available'))
      if (caregiver) setRole(String(caregiver.role || caregiver.function || caregiver.position || 'Caregiver'))
      if (caregiver) setAcademyCertified(Boolean(caregiver.academy_certified))
      if (caregiver) setSpecialNeeds(Boolean(caregiver.special_needs_capable))
      if (access) setMobileEnabled(Boolean(access.mobile_enabled))
      if (access) setCanViewMissions(Boolean(access.can_view_missions))
      if (access) setCanAcceptMissions(Boolean(access.can_accept_missions))
      if (access) setCanSubmitReports(Boolean(access.can_submit_reports))
      if (access) setCanViewPayments(Boolean(access.can_view_payments))
      if (access) setGeoFenceRequired(Boolean(access.geo_fence_required))
      if (access) setPinResetRequired(Boolean(access.pin_reset_required))
      if (access) setEmergencyAccessAllowed(Boolean(access.emergency_access_allowed))
      if (caregiver && Array.isArray(caregiver.skill_tags || caregiver.skills || caregiver.competencies || [])) setSkills(caregiver.skill_tags || caregiver.skills || caregiver.competencies || [])
      if (caregiver && Array.isArray(caregiver.languages || [])) setLanguages(caregiver.languages || [])
      if (caregiver && Array.isArray(caregiver.mission_types || caregiver.missionTypes || [])) setMissionTypes(caregiver.mission_types || caregiver.missionTypes || [])
      if (access) setAccessStatus(String(access.access_status || 'active'))
      if (access) setAccessLevel(String(access.access_level || 'carelink_mobile_agent'))
      if (access) setDevicePolicy(String(access.device_policy || ''))
      if (access) setSessionLimit(String(access.session_limit || '1'))
      if (access) setSecurityNotes(String(access.security_notes || access.notes || ''))
      if (access) setShutdownReason(String(access.suspension_reason || ''))
      if (access) setShutdownUntil(access.shutdown_until ? String(access.shutdown_until).slice(0,16) : '')
      setAgentCommandNotice('Full caregiver modules preloaded and synced.')
    } catch (error) {
      setAgentCommandNotice(error instanceof Error ? error.message : 'Unable to load full caregiver command.')
    } finally {
      setAgentCommandLoading(false)
    }
  }

  async function syncAgentCommandModule(action: string, moduleType: string, payload: AnyRecord = {}) {
    const id = Number(createdId || initialCaregiver?.id)
    if (!Number.isFinite(id) || !id) {
      setAgentCommandNotice('Create or open a caregiver profile before syncing modules.')
      return null
    }

    setAgentCommandLoading(true)
    setAgentCommandNotice('')

    try {
      const res = await fetch(`/api/carelink/ops/agents/${id}/command`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ action, module_type: moduleType, caregiver_name: fullName, full_name: fullName, created_by: 'CareLink Ops', ...payload }),
      })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || 'Unable to sync caregiver module.')
      setAgentFullCommand(json.command || null)
      setAgentCommandNotice(`Synced: ${moduleType}`)
      return json
    } catch (error) {
      setAgentCommandNotice(error instanceof Error ? error.message : 'Unable to sync caregiver module.')
      return null
    } finally {
      setAgentCommandLoading(false)
    }
  }


  // Full existing caregiver modules loader
  useEffect(() => {
    if (!open || !initialCaregiver?.id) return
    void loadExistingAgentFullCommand(Number(initialCaregiver.id))
  }, [open, initialCaregiver?.id])

if (!open) return null

  const missions = Array.isArray(command?.missions) ? command.missions : []
  const validations = Array.isArray(command?.paymentValidations) ? command.paymentValidations : []
  const paymentSummary = validations.reduce(
    (acc: { total: number; validated: number; draft: number; rejected: number }, row: AnyRecord) => {
      const amount = number(row.amount)
      const status = String(row.status || 'draft').toLowerCase()
      acc.total += amount
      if (status === 'validated') acc.validated += amount
      if (status === 'draft') acc.draft += amount
      if (status === 'rejected') acc.rejected += amount
      return acc
    },
    { total: 0, validated: 0, draft: 0, rejected: 0 },
  )

  return <div className="fixed inset-0 z-[6000] bg-slate-950/55 p-4 backdrop-blur-md"><div className="mx-auto flex h-[calc(100vh-32px)] max-w-[1700px] flex-col overflow-hidden rounded-[34px] border border-white/70 bg-slate-50 shadow-[0_40px_100px_rgba(2,6,23,.45)]"><header className="border-b border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[.3em] text-blue-700">CareLink Ops · Agent Command Console</div><h2 className="mt-3 select-none text-4xl font-black tracking-[-.06em] text-slate-950" style={{ color: "#020617", WebkitTextFillColor: "#020617", userSelect: "none" }}>{isEditMode ? 'Existing caregiver operational dossier' : 'New caregiver operational setup'}</h2><p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-500">This is a low-load operational cockpit: create profile, assign CareLink Mobile login, set roster conditions, configure honoraires, validate payments, review live mission history and training readiness.</p></div><div className="flex items-center gap-3"><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-[10px] font-black uppercase tracking-[.22em] text-slate-400">Profile ID</div><div className="mt-1 text-2xl font-black text-slate-950">{createdId || 'Draft'}</div></div><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-[10px] font-black uppercase tracking-[.22em] text-slate-400">Readiness</div><div className="mt-1 text-2xl font-black text-slate-950">{readiness}%</div><div className="mt-2 h-2 w-36 rounded-full bg-slate-100"><div className={`${readiness >= 80 ? 'bg-emerald-500' : readiness >= 55 ? 'bg-amber-500' : 'bg-rose-500'} h-2 rounded-full`} style={{ width: `${readiness}%` }} /></div></div><button onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50">Close</button></div></div>{error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">{error}</div> : null}{notice ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">{notice}</div> : null}</header><div className="grid min-h-0 flex-1 grid-cols-[340px_1fr_360px]"><aside className="overflow-y-auto border-r border-slate-200 bg-white p-5"><div className="space-y-3">{TAB_META.map((item, index) => <button key={item.key} onClick={() => setTab(item.key)} className={`w-full rounded-[24px] border p-4 text-left transition ${tab === item.key ? 'border-blue-200 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}><div className="flex gap-3"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-xs font-black ${tab === item.key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{index + 1}</div><div><div className="text-xs font-black uppercase tracking-[.18em] text-blue-700">{item.kicker}</div><div className="mt-1 text-sm font-black text-slate-950">{item.label}</div><div className="mt-1 text-xs font-bold leading-5 text-slate-500">{item.detail}</div></div></div></button>)}</div></aside><main className="overflow-y-auto p-6">{tab === 'identity' ? <div className="space-y-5">
  <Panel
    title="Enterprise core agent file"
    subtitle="Create and control the live caregiver profile used by dispatch, matching, CareLink Mobile, mission assignment, compliance and readiness." 
    action={<div className="flex flex-wrap gap-2"><button onClick={isEditMode ? saveProfileChanges : createProfile} disabled={busy} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{busy ? 'Saving...' : createdId ? 'Update profile base' : 'Create profile now'}</button><button type="button" onClick={() => setTab('roster')} className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700">Next: roster rules</button></div>}
  >
    <div className="grid gap-4 md:grid-cols-4">
      <Stat label="Profile status" value={createdId ? `Live #${createdId}` : 'Draft'} tone={createdId ? 'emerald' : 'amber'} />
      <Stat label="Identity" value={fullName && phone ? 'Ready' : 'Missing'} tone={fullName && phone ? 'emerald' : 'rose'} />
      <Stat label="Service skills" value={skills.length} tone={skills.length ? 'blue' : 'amber'} />
      <Stat label="Mission categories" value={missionTypes.length} tone={missionTypes.length ? 'blue' : 'amber'} />
    </div>

    <div className="mt-5 grid gap-4 lg:grid-cols-3">
      <Field label="Full name" value={fullName} setValue={setFullName} placeholder="Agent full name" />
      <Field label="Phone" value={phone} setValue={setPhone} placeholder="0600000000" />
      <Field label="Email" value={email} setValue={setEmail} placeholder="agent@email.com" />
      <Field label="City" value={city} setValue={setCity} />
      <Field label="Zone" value={zone} setValue={setZone} placeholder="RBA1, CAS-5..." />
      <Select label="Operational status" value={status} setValue={setStatus} options={['available', 'assigned', 'training', 'inactive', 'blocked']} />
      <Field label="Role / field function" value={role} setValue={setRole} />
    </div>

    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <Check label="Academy certified" checked={academyCertified} setChecked={setAcademyCertified} detail="Marks this caregiver as Academy-certified and eligible for higher-confidence mission matching." />
      <Check label="Special needs capable" checked={specialNeeds} setChecked={setSpecialNeeds} detail="Allows sensitive special-support and school-support mission routing when conditions are met." />
    </div>
  </Panel>

  <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
    <div className="space-y-5">
      <ChipGrid label="Skills and operational competencies" options={SKILLS} selected={skills} setSelected={setSkills} />
      <ChipGrid label="Languages and family communication capacity" options={LANGUAGES} selected={languages} setSelected={setLanguages} />
      <ChipGrid label="Mission types this agent can serve" options={MISSIONS} selected={missionTypes} setSelected={setMissionTypes} />
    </div>

    <Panel title="Operational eligibility cockpit" subtitle="Live readiness interpretation before the agent is released to dispatch." action={<button type="button" onClick={() => setTab('access')} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Prepare mobile access</button>}>
      <div className="grid gap-3">
        <div className={`rounded-2xl border p-4 ${fullName ? 'border-emerald-100 bg-emerald-50' : 'border-rose-100 bg-rose-50'}`}><div className="text-xs font-black uppercase tracking-[.2em] text-slate-500">Identity control</div><div className="mt-2 text-lg font-black text-slate-950">{fullName ? 'Identity captured' : 'Full name required'}</div></div>
        <div className={`rounded-2xl border p-4 ${phone || email ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`}><div className="text-xs font-black uppercase tracking-[.2em] text-slate-500">Contactability</div><div className="mt-2 text-lg font-black text-slate-950">{phone || email ? 'Contact channel available' : 'Phone/email missing'}</div></div>
        <div className={`rounded-2xl border p-4 ${city && zone ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`}><div className="text-xs font-black uppercase tracking-[.2em] text-slate-500">Coverage location</div><div className="mt-2 text-lg font-black text-slate-950">{city && zone ? `${city} · ${zone}` : 'City/zone incomplete'}</div></div>
        <div className={`rounded-2xl border p-4 ${skills.length && missionTypes.length ? 'border-blue-100 bg-blue-50' : 'border-amber-100 bg-amber-50'}`}><div className="text-xs font-black uppercase tracking-[.2em] text-slate-500">Dispatch eligibility</div><div className="mt-2 text-lg font-black text-slate-950">{skills.length && missionTypes.length ? 'Ready for matching review' : 'Skills and mission types needed'}</div></div>
      </div>
    </Panel>
  </div>
</div> : null}{tab === 'access' ? <div className="space-y-5">
  <Panel
    title="CareLink Mobile access command"
    subtitle="Enterprise control center for mobile login, permissions, shutdown, restore, device policy and security governance."
    action={<div className="flex flex-wrap gap-2">
      <button onClick={() => saveMobileAccess('save')} disabled={busy} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-50">Save access</button>
      <button onClick={shutdownMobileAccess} disabled={busy} className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">Suspend mobile</button>
      <button onClick={restoreMobileAccess} disabled={busy} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">Restore access</button>
    </div>}
  >
    <div className="grid gap-4 md:grid-cols-4">
      <Stat label="Access status" value={text(command?.access?.access_status || accessStatus, 'draft')} tone={String(command?.access?.access_status || accessStatus).includes('suspended') ? 'rose' : 'emerald'} />
      <Stat label="Mobile enabled" value={(command?.access?.mobile_enabled ?? mobileEnabled) ? 'Enabled' : 'Disabled'} tone={(command?.access?.mobile_enabled ?? mobileEnabled) ? 'emerald' : 'rose'} />
      <Stat label="Auth user" value={command?.access?.auth_user_id ? 'Linked' : 'Pending'} tone={command?.access?.auth_user_id ? 'blue' : 'amber'} />
      <Stat label="Session limit" value={sessionLimit} tone="blue" />
    </div>

    <div className="mt-5 grid gap-4 lg:grid-cols-3">
      <Field label="Login email / username" value={loginEmail} setValue={setLoginEmail} placeholder={email || 'agent@email.com'} />
      <Field label="Temporary password" value={password} setValue={setPassword} placeholder="Generate or type password" />
      <Select label="Access level" value={accessLevel} setValue={setAccessLevel} options={['carelink_mobile_agent', 'carelink_mobile_supervisor', 'restricted_agent']} />
      <Select label="Access status" value={accessStatus} setValue={setAccessStatus} options={['active', 'pending_invitation', 'temporarily_suspended', 'revoked']} />
      <Field label="Session limit" value={sessionLimit} setValue={setSessionLimit} type="number" />
      <Field label="Shutdown until" value={shutdownUntil} setValue={setShutdownUntil} type="datetime-local" />
    </div>

    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <Area label="Device policy" value={devicePolicy} setValue={setDevicePolicy} rows={3} placeholder="Personal phone authorized, secure session required..." />
      <Area label="Shutdown reason / security notes" value={shutdownReason} setValue={setShutdownReason} rows={3} placeholder="Required if suspending access temporarily..." />
      <Area label="Internal security notes" value={securityNotes} setValue={setSecurityNotes} rows={3} placeholder="Admin notes, risks, device handoff, login restrictions..." />
      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Lifecycle actions</div>
        <div className="mt-4 grid gap-3">
          <button onClick={generatePassword} className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">Generate secure temporary password</button>
          <button onClick={() => saveMobileAccess('save')} disabled={busy} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-50">Save / activate mobile access</button>
          <button onClick={shutdownMobileAccess} disabled={busy} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50">Temporarily shut down mobile version</button>
          <button onClick={restoreMobileAccess} disabled={busy} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50">Restore mobile access</button>
        </div>
      </div>
    </div>
  </Panel>

  <Panel title="Mobile app permissions matrix" subtitle="Define exactly what this caregiver can do in the mobile app. Suspension overrides all permissions until restored.">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Check label="Mobile enabled" checked={mobileEnabled} setChecked={setMobileEnabled} detail="Agent can log into CareLink Mobile." />
      <Check label="View missions" checked={canViewMissions} setChecked={setCanViewMissions} detail="Can see assigned mission briefs." />
      <Check label="Accept missions" checked={canAcceptMissions} setChecked={setCanAcceptMissions} detail="Can confirm or accept assigned missions." />
      <Check label="Submit reports" checked={canSubmitReports} setChecked={setCanSubmitReports} detail="Can submit field reports and closure notes." />
      <Check label="View payments" checked={canViewPayments} setChecked={setCanViewPayments} detail="Can see payment/honoraires area in mobile." />
      <Check label="PIN reset required" checked={pinResetRequired} setChecked={setPinResetRequired} detail="Force caregiver to reset PIN/password on next access." />
      <Check label="Geo-fence required" checked={geoFenceRequired} setChecked={setGeoFenceRequired} detail="Mobile actions should be restricted to approved mission/geographic zones." />
      <Check label="Emergency access allowed" checked={emergencyAccessAllowed} setChecked={setEmergencyAccessAllowed} detail="Allow limited emergency workflow even when normal access is restricted." />
    </div>
  </Panel>

  <Panel title="Current app access record" subtitle="Loaded after profile creation and access save. This is the live synced database record.">
    <pre className="max-h-[260px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs font-bold text-white">{JSON.stringify(command?.access || {}, null, 2)}</pre>
  </Panel>
</div> : null}{tab === 'roster' ? <div className="space-y-5">
  <Panel
    title="Enterprise roster rules and schedule conditions"
    subtitle="Configure the real planning constraints used by dispatch: work days, time windows, workload ceilings, zones, replacement rules and transport conditions."
    action={<div className="flex flex-wrap gap-2"><button onClick={saveRoster} disabled={busy} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">Save roster rules</button><button type="button" onClick={() => setTab('history')} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">Review missions</button></div>}
  >
    <div className="grid gap-4 md:grid-cols-4">
      <Stat label="Working days" value={preferredDays.length} tone={preferredDays.length ? 'blue' : 'amber'} />
      <Stat label="Time window" value={`${startTime || '--'} → ${endTime || '--'}`} tone="blue" />
      <Stat label="Max daily" value={`${maxDailyHours || 0}h`} tone="emerald" />
      <Stat label="Emergency backup" value={acceptEmergency ? 'Allowed' : 'No'} tone={acceptEmergency ? 'emerald' : 'amber'} />
    </div>

    <div className="mt-5">
      <ChipGrid label="Preferred working days" options={DAYS} selected={preferredDays} setSelected={setPreferredDays} />
    </div>

    <div className="mt-5 grid gap-4 lg:grid-cols-4">
      <Field label="Start time" value={startTime} setValue={setStartTime} type="time" />
      <Field label="End time" value={endTime} setValue={setEndTime} type="time" />
      <Field label="Max daily hours" value={maxDailyHours} setValue={setMaxDailyHours} type="number" />
      <Field label="Max weekly hours" value={maxWeeklyHours} setValue={setMaxWeeklyHours} type="number" />
    </div>

    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <Area label="Preferred zones" value={preferredZones} setValue={setPreferredZones} placeholder="Rabat Agdal, Hay Riad, Temara..." />
      <Area label="Excluded zones / restricted areas" value={excludedZones} setValue={setExcludedZones} placeholder="Zones to avoid or requiring manager approval..." />
    </div>

    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Check label="Accept weekends" checked={acceptWeekends} setChecked={setAcceptWeekends} detail="Can be planned for Saturday/Sunday missions." />
      <Check label="Accept night missions" checked={acceptNight} setChecked={setAcceptNight} detail="Allows late-night or overnight service conditions." />
      <Check label="Emergency replacement" checked={acceptEmergency} setChecked={setAcceptEmergency} detail="Can be proposed as urgent backup when another agent is unavailable." />
      <Check label="Transport required" checked={transportRequired} setChecked={setTransportRequired} detail="Dispatch must account for transport support or allowance." />
    </div>
  </Panel>

  <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
    <Panel title="Roster validation matrix" subtitle="Operational interpretation of the schedule before it is released to live dispatch.">
      <div className="grid gap-3">
        <div className={`rounded-2xl border p-4 ${preferredDays.length ? 'border-emerald-100 bg-emerald-50' : 'border-rose-100 bg-rose-50'}`}><div className="text-xs font-black uppercase tracking-[.2em] text-slate-500">Days coverage</div><div className="mt-2 text-lg font-black text-slate-950">{preferredDays.length ? `${preferredDays.length} working day(s) selected` : 'No working day selected'}</div></div>
        <div className={`rounded-2xl border p-4 ${startTime && endTime ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`}><div className="text-xs font-black uppercase tracking-[.2em] text-slate-500">Time control</div><div className="mt-2 text-lg font-black text-slate-950">{startTime && endTime ? `${startTime} → ${endTime}` : 'Time window incomplete'}</div></div>
        <div className={`rounded-2xl border p-4 ${preferredZones ? 'border-blue-100 bg-blue-50' : 'border-amber-100 bg-amber-50'}`}><div className="text-xs font-black uppercase tracking-[.2em] text-slate-500">Zone strategy</div><div className="mt-2 text-lg font-black text-slate-950">{preferredZones ? 'Preferred zones configured' : 'No preferred zone yet'}</div></div>
      </div>
    </Panel>

    <Panel title="Replacement and planning notes" subtitle="Manager notes used by dispatch when suggesting or excluding this caregiver from missions.">
      <Area label="Roster notes and operational restrictions" value={rosterNotes} setValue={setRosterNotes} rows={8} placeholder="Example: avoid long-distance travel after 18:00, available for Hay Riad only, backup for school support..." />
    </Panel>
  </div>
</div> : null}{tab === 'finance' ? <div className="space-y-5"><Panel title="Honoraires, rates and payment configuration" subtitle="Save actual payment settings for finance and mission payout calculations." action={<button onClick={savePayments} disabled={busy} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">Save payment config</button>}><div className="grid gap-4 lg:grid-cols-5"><Field label="Hourly MAD" value={hourlyRate} setValue={setHourlyRate} type="number" /><Field label="Daily MAD" value={dailyRate} setValue={setDailyRate} type="number" /><Field label="Mission MAD" value={missionRate} setValue={setMissionRate} type="number" /><Field label="Overtime MAD" value={overtimeRate} setValue={setOvertimeRate} type="number" /><Field label="Transport allowance" value={transportAllowance} setValue={setTransportAllowance} type="number" /></div><div className="mt-4 grid gap-4 lg:grid-cols-3"><Select label="Payment mode" value={paymentMode} setValue={setPaymentMode} options={['monthly', 'weekly', 'per_mission', 'manual_review']} /><Select label="Payment cycle" value={paymentCycle} setValue={setPaymentCycle} options={['monthly', 'biweekly', 'weekly', 'mission_close']} /><Field label="Wallet phone" value={walletPhone} setValue={setWalletPhone} /></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><Field label="Bank name" value={bankName} setValue={setBankName} /><Field label="Bank account / RIB" value={bankAccount} setValue={setBankAccount} /></div><div className="mt-4"><Area label="Finance notes" value={financeNotes} setValue={setFinanceNotes} /></div></Panel><Panel
            title="Payment records capture & validation"
            subtitle="Capture one or multiple payment rows. Each record appears as a modern card and can be validated, edited or permanently deleted."
            action={<div className="flex flex-wrap gap-2"><button onClick={() => savePaymentRecord()} disabled={busy} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{paymentEditorMode === 'edit' ? 'Update row' : '+ Add row'}</button><button onClick={() => savePaymentRecord('validated')} disabled={busy} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">Add + validate</button></div>}
          >
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-[1fr_150px_130px_130px]">
                  <Field label="Payment label" value={paymentDraft.label} setValue={(value) => setPaymentDraft((row) => ({ ...row, label: value }))} placeholder="Mission honoraires, transport, advance..." />
                  <Field label="Amount MAD" value={paymentDraft.amount || validationAmount} setValue={(value) => { setPaymentDraft((row) => ({ ...row, amount: value })); setValidationAmount(value) }} type="number" />
                  <Field label="Period start" value={paymentDraft.periodStart} setValue={(value) => setPaymentDraft((row) => ({ ...row, periodStart: value }))} type="date" />
                  <Field label="Period end" value={paymentDraft.periodEnd} setValue={(value) => setPaymentDraft((row) => ({ ...row, periodEnd: value }))} type="date" />
                </div>
                <div className="grid gap-4 lg:grid-cols-[160px_160px_1fr]">
                  <Field label="Mission ID optional" value={paymentDraft.missionId || validationMissionId} setValue={(value) => { setPaymentDraft((row) => ({ ...row, missionId: value })); setValidationMissionId(value) }} type="number" />
                  <Select label="Status" value={paymentDraft.status} setValue={(value) => setPaymentDraft((row) => ({ ...row, status: value }))} options={['draft', 'validated', 'rejected']} />
                  <Field label="Finance note" value={paymentDraft.notes || validationNotes} setValue={(value) => { setPaymentDraft((row) => ({ ...row, notes: value })); setValidationNotes(value) }} />
                </div>
                {paymentEditorMode === 'edit' ? <button onClick={resetPaymentEditor} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Cancel edit mode</button> : null}
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                <Stat label="Records" value={validations.length} tone="blue" />
                <Stat label="Total MAD" value={paymentSummary.total.toFixed(2)} tone="slate" />
                <Stat label="Validated MAD" value={paymentSummary.validated.toFixed(2)} tone="emerald" />
                <Stat label="Draft MAD" value={paymentSummary.draft.toFixed(2)} tone="amber" />
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {validations.length ? validations.map((v: AnyRecord) => (
                <div key={String(v.id)} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Payment record #{v.id}</div>
                      <div className="mt-1 text-lg font-black text-slate-950">{text(v.label || v.validation_type, 'Payment record')}</div>
                      <div className="mt-1 text-xs font-bold text-slate-500">Mission {v.mission_id || '—'} · {text(v.period_start).slice(0, 10) || 'No start'} → {text(v.period_end).slice(0, 10) || 'No end'} · {text(v.notes, 'No notes')}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-slate-950">{number(v.amount).toFixed(2)} {text(v.currency, 'MAD')}</div>
                      <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${String(v.status).toLowerCase() === 'validated' ? 'bg-emerald-50 text-emerald-700' : String(v.status).toLowerCase() === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{text(v.status, 'draft')}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => validatePaymentRecord(v)} disabled={busy} className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50">Validate</button>
                    <button onClick={() => loadPaymentForEdit(v)} disabled={busy} className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 disabled:opacity-50">Edit</button>
                    <button onClick={() => deletePaymentRecord(v)} disabled={busy} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black text-rose-700 disabled:opacity-50">Delete permanently</button>
                  </div>
                </div>
              )) : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-black text-slate-500">No payment record yet. Add one or multiple rows above.</div>}
            </div>
          </Panel></div> : null}{tab === 'history' ? <div className="space-y-5">
  <Panel title="Live synced mission history command" subtitle="Loaded from live mission repositories by caregiver_id. Create the profile first, then refresh the live feed." action={<div className="flex flex-wrap gap-2"><button onClick={() => refreshCommand()} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Refresh live history</button><a href={createdId ? `/carelink-ops/missions?caregiver_id=${createdId}` : '/carelink-ops/missions'} className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">Open missions board</a></div>}>
    <div className="grid gap-4 md:grid-cols-5">
      <Stat label="Total missions" value={missions.length} tone="blue" />
      <Stat label="Completed" value={missions.filter((m: AnyRecord) => String(m.status || '').toLowerCase().includes('completed')).length} tone="emerald" />
      <Stat label="Active / assigned" value={missions.filter((m: AnyRecord) => { const st = String(m.status || '').toLowerCase(); return st.includes('active') || st.includes('assigned') || st.includes('progress') }).length} tone="amber" />
      <Stat label="Risk signals" value={missions.filter((m: AnyRecord) => String(m.risk_level || m.risk || m.status || '').toLowerCase().includes('risk')).length} tone="rose" />
      <Stat label="Reports" value={missions.filter((m: AnyRecord) => String(m.report_status || m.report || '').length > 0).length} tone="blue" />
    </div>
  </Panel>

  <Panel title="Mission action feed" subtitle="Clickable live cards for the caregiver mission history and operational follow-up.">
    <div className="grid gap-3">
      {missions.length ? missions.map((m: AnyRecord) => {
        const statusText = String(m.status || 'draft')
        const statusLower = statusText.toLowerCase()
        const tone = statusLower.includes('completed') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : statusLower.includes('risk') || statusLower.includes('cancel') ? 'bg-rose-50 text-rose-700 border-rose-100' : statusLower.includes('active') || statusLower.includes('progress') || statusLower.includes('assigned') ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-700 border-slate-200'
        return <div key={String(m.id)} className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-200 hover:bg-blue-50/40">
          <div className="grid gap-4 lg:grid-cols-[1fr_160px_160px_130px] lg:items-center">
            <div><div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Mission record</div><div className="mt-1 text-lg font-black text-slate-950">Mission #{text(m.id, '—')} · {text(m.service_type || m.serviceType || m.title, 'CareLink mission')}</div><div className="mt-1 text-xs font-bold text-slate-500">Family {text(m.family_id || m.familyId, '—')} · {text(m.city || m.location || m.zone, '—')}</div></div>
            <div className={`rounded-2xl border px-4 py-3 text-center text-xs font-black ${tone}`}>{statusText}</div>
            <div className="text-sm font-black text-slate-700">{text(m.scheduled_start_at || m.start_at || m.created_at, 'No date').slice(0, 16)}</div>
            <a href={`/carelink-ops/missions?mission=${m.id}`} className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-xs font-black text-white">Open action</a>
          </div>
        </div>
      }) : <div className="rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center"><div className="text-lg font-black text-slate-950">No live missions loaded for this caregiver yet</div><p className="mt-2 text-sm font-semibold text-slate-500">Create the profile, assign missions, then refresh this live mission history feed.</p></div>}
    </div>
  </Panel>

  <Panel title="History intelligence" subtitle="How this history will be used by dispatch, quality and future agent performance scoring.">
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><div className="text-xs font-black uppercase tracking-[.2em] text-blue-700">Dispatch use</div><p className="mt-2 text-sm font-bold text-slate-600">Mission history informs matching, replacement choice and workload safety.</p></div>
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><div className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Quality use</div><p className="mt-2 text-sm font-bold text-slate-600">Completed services and reports feed readiness and compliance review.</p></div>
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4"><div className="text-xs font-black uppercase tracking-[.2em] text-amber-700">Risk use</div><p className="mt-2 text-sm font-bold text-slate-600">Incidents, cancellations and missing reports become operational friction signals.</p></div>
    </div>
  </Panel>
</div> : null}{tab === 'training' ? <div className="space-y-5">
  <Panel title="Academy readiness and compliance command" subtitle="Save training plan, onboarding stages, certification status and next learning action for the caregiver." action={<button onClick={saveTraining} disabled={busy} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">Save training readiness</button>}>
    <div className="grid gap-4 md:grid-cols-6">
      <Stat label="Onboarding" value={onboardingStatus} tone={onboardingStatus === 'completed' ? 'emerald' : onboardingStatus === 'blocked' ? 'rose' : 'amber'} />
      <Stat label="Hygiene" value={hygieneStatus} tone={hygieneStatus === 'completed' ? 'emerald' : hygieneStatus === 'expired' ? 'rose' : 'amber'} />
      <Stat label="Reporting" value={reportingStatus} tone={reportingStatus === 'completed' ? 'emerald' : 'amber'} />
      <Stat label="Emergency" value={emergencyStatus} tone={emergencyStatus === 'completed' ? 'emerald' : 'amber'} />
      <Stat label="Special needs" value={specialNeedsStatus} tone={specialNeedsStatus === 'completed' ? 'emerald' : specialNeedsStatus === 'not_required' ? 'blue' : 'amber'} />
      <Stat label="Certification" value={certificationStatus} tone={certificationStatus === 'certified' ? 'emerald' : certificationStatus === 'expired' || certificationStatus === 'blocked' ? 'rose' : 'amber'} />
    </div>

    <div className="mt-5 grid gap-4 lg:grid-cols-3">
      <Select label="Onboarding" value={onboardingStatus} setValue={setOnboardingStatus} options={['pending', 'in_progress', 'completed', 'blocked']} />
      <Select label="Hygiene protocol" value={hygieneStatus} setValue={setHygieneStatus} options={['pending', 'in_progress', 'completed', 'expired']} />
      <Select label="Mission reporting" value={reportingStatus} setValue={setReportingStatus} options={['pending', 'in_progress', 'completed']} />
      <Select label="Emergency escalation" value={emergencyStatus} setValue={setEmergencyStatus} options={['pending', 'in_progress', 'completed']} />
      <Select label="Special needs track" value={specialNeedsStatus} setValue={setSpecialNeedsStatus} options={['not_required', 'pending', 'in_progress', 'completed']} />
      <Select label="Certification" value={certificationStatus} setValue={setCertificationStatus} options={['pending', 'certified', 'expired', 'blocked']} />
      <Field label="Next training date" value={nextTrainingDate} setValue={setNextTrainingDate} type="date" />
      <Field label="Trainer / evaluator" value={trainerName} setValue={setTrainerName} />
    </div>

    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <Area label="Training path" value={trainingPath} setValue={setTrainingPath} rows={6} placeholder="CareLink mobile onboarding, hygiene, reporting, positive discipline..." />
      <Area label="Learning notes and compliance gaps" value={learningNotes} setValue={setLearningNotes} rows={6} placeholder="Certificates missing, evaluations, retraining, manager comments..." />
    </div>
  </Panel>

  <Panel title="Training decision matrix" subtitle="Enterprise readiness interpretation before advanced mission eligibility.">
    <div className="grid gap-3 md:grid-cols-3">
      <div className={`rounded-2xl border p-4 ${onboardingStatus === 'completed' ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`}><div className="text-xs font-black uppercase tracking-[.2em] text-slate-500">Mobile onboarding</div><div className="mt-2 text-lg font-black text-slate-950">{onboardingStatus === 'completed' ? 'Ready for mobile execution' : 'Onboarding still required'}</div></div>
      <div className={`rounded-2xl border p-4 ${certificationStatus === 'certified' ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`}><div className="text-xs font-black uppercase tracking-[.2em] text-slate-500">Certification</div><div className="mt-2 text-lg font-black text-slate-950">{certificationStatus === 'certified' ? 'Certified for premium matching' : 'Not fully certified'}</div></div>
      <div className={`rounded-2xl border p-4 ${nextTrainingDate ? 'border-blue-100 bg-blue-50' : 'border-amber-100 bg-amber-50'}`}><div className="text-xs font-black uppercase tracking-[.2em] text-slate-500">Next action</div><div className="mt-2 text-lg font-black text-slate-950">{nextTrainingDate ? `Training planned ${nextTrainingDate}` : 'No training date planned'}</div></div>
    </div>
  </Panel>
</div> : null}</main><aside className="overflow-y-auto border-l border-slate-200 bg-white p-5"><div className="rounded-[28px] bg-slate-950 p-5 text-white shadow-xl"><div className="text-[10px] font-black uppercase tracking-[.28em] text-white/50">Command status</div><div className="mt-4 text-2xl font-black">{fullName || 'New caregiver'}</div><div className="mt-2 text-sm font-bold text-white/60">{city || 'City'} · {zone || 'Zone'}</div><div className="mt-5 h-2 rounded-full bg-white/10"><div className={`${readiness >= 80 ? 'bg-emerald-400' : readiness >= 55 ? 'bg-amber-400' : 'bg-rose-400'} h-2 rounded-full`} style={{ width: `${readiness}%` }} /></div><div className="mt-3 text-xs font-black text-white/70">Readiness {readiness}%</div></div><div className="mt-4 grid gap-3"><Stat label="Profile" value={createdId ? `#${createdId}` : 'Draft'} tone={createdId ? 'emerald' : 'amber'} /><Stat label="Mobile login" value={loginEmail || email || 'Missing'} tone={(loginEmail || email) ? 'blue' : 'rose'} /><Stat label="Skills" value={skills.length} tone={skills.length ? 'emerald' : 'rose'} /><Stat label="Mission types" value={missionTypes.length} tone={missionTypes.length ? 'emerald' : 'rose'} /><Stat label="Preferred days" value={preferredDays.length} tone="blue" /><Stat label="Payment config" value={hourlyRate || dailyRate || missionRate ? 'Ready' : 'Missing'} tone={hourlyRate || dailyRate || missionRate ? 'emerald' : 'amber'} /></div>
            {isEditMode ? (
              <div className="mt-4 rounded-[26px] border border-rose-200 bg-rose-50 p-4 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-700">
                  Danger zone
                </div>
                <div className="mt-2 text-lg font-black text-slate-950">
                  Permanent delete caregiver profile
                </div>
                <p className="mt-2 text-xs font-bold leading-5 text-rose-700">
                  This will permanently delete this caregiver and linked CareLink agent records. This action cannot be undone.
                </p>

                {!deleteConfirmOpen ? (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="mt-4 w-full rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-rose-700"
                  >
                    Delete permanently
                  </button>
                ) : (
                  <div className="mt-4 space-y-3">
                    <label className="block rounded-2xl border border-rose-200 bg-white p-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-700">
                        Type DELETE to confirm
                      </span>
                      <input
                        value={deleteConfirmText}
                        onChange={(event) => setDeleteConfirmText(event.target.value)}
                        placeholder="DELETE"
                        className="mt-2 w-full bg-transparent text-sm font-black text-slate-950 outline-none placeholder:text-slate-300"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteConfirmOpen(false)
                          setDeleteConfirmText('')
                        }}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={deleteExistingCaregiverPermanently}
                        disabled={busy || deleteConfirmText.trim() !== 'DELETE'}
                        className="rounded-2xl bg-rose-600 px-4 py-3 text-xs font-black text-white disabled:opacity-40"
                      >
                        Confirm delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}


            {isEditMode ? (
              <div className="mt-4 rounded-[26px] border border-blue-200 bg-blue-50 p-4 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-700">Full modules sync status</div>
                <div className="mt-2 text-lg font-black text-slate-950">
                  {agentCommandLoading ? 'Syncing modules...' : `${agentFullCommand?.readiness?.total || 0}% command readiness`}
                </div>
                <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
                  Profile, mobile access, roster, finance, training, mission history, notifications and action logs are loaded from the canonical agent command API.
                </p>
                {agentCommandNotice ? <div className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-black text-blue-700">{agentCommandNotice}</div> : null}
                <button type="button" onClick={() => loadExistingAgentFullCommand(Number(createdId || initialCaregiver?.id))} className="mt-3 w-full rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black text-white">
                  Reload full synced modules
                </button>
              </div>
            ) : null}

<button disabled={busy} onClick={async () => { const id = await ensureProfile(); if (id) { await saveRoster(); await savePayments(); await saveTraining(); if (loginEmail || email) await saveMobileAccess(); setNotice('Full caregiver operational setup synced.') } }} className="mt-5 w-full rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg disabled:opacity-50">{busy ? 'Syncing...' : 'Create + sync all configured modules'}</button><p className="mt-3 text-xs font-bold leading-5 text-slate-500">Mission history and payment validations become fully live after the caregiver profile exists.</p></aside></div></div></div>
}

export default CareLinkCaregiverCreateModal

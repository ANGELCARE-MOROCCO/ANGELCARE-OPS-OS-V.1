'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useMemo, useState } from 'react'
import SmartPermissionsPanel from '@/app/(protected)/users/_components/SmartPermissionsPanel'
import { ROLE_PERMISSION_TEMPLATES } from '@/lib/auth/permissions'

type RoleOption = { value: string; label: string; department: string; defaultHome?: string }
type ManagerOption = { id: string; name: string; role?: string | null; department?: string | null }
type Props = {
  action: (formData: FormData) => void | Promise<void>
  roles: RoleOption[]
  departments: string[]
  positions: string[]
  managers: ManagerOption[]
  permissionStats: Array<{ key: string; label: string; count: number; icon: string }>
  systemAccess: Array<{ label: string; permission: string; icon: string }>
}

const employmentTypes = ['CDI', 'CDD', 'Stage', 'Freelance', 'Part-time', 'Consultant']
const locations = ['Rabat', 'Temara', 'Casablanca', 'Remote', 'Field Operations', 'Academy Center']
const employeeTypes = ['Internal Staff', 'Field Staff', 'Manager', 'Back Office', 'Trainer', 'Partner']
const languages = ['fr', 'en', 'ar']
const timezones = ['(GMT+01:00) Casablanca', '(GMT+00:00) UTC', '(GMT+01:00) Paris']

function titleCase(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function passwordSeed() {
  return `AC@${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

function initials(name: string, fallback = 'U') {
  const cleaned = name.trim()
  if (!cleaned) return fallback
  return cleaned.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || fallback
}

export default function UserCreateCommandCenter({ action, roles, departments, positions, managers, permissionStats, systemAccess }: Props) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('R@ndOm!2025')
  const [role, setRole] = useState(roles[0]?.value || 'staff')
  const [department, setDepartment] = useState(roles[0]?.department || departments[0] || '')
  const [position, setPosition] = useState(positions[0] || '')
  const [manager, setManager] = useState('')
  const [employmentType, setEmploymentType] = useState('CDI')
  const [location, setLocation] = useState('Rabat')
  const [employeeType, setEmployeeType] = useState('Internal Staff')
  const [language, setLanguage] = useState('fr')
  const [timezone, setTimezone] = useState('(GMT+01:00) Casablanca')
  const [active, setActive] = useState(true)
  const [sendWelcome, setSendWelcome] = useState(true)
  const [mustChange, setMustChange] = useState(true)
  const [twoFactor, setTwoFactor] = useState(false)
  const [onboarding, setOnboarding] = useState(true)

  const selectedRole = useMemo(() => roles.find((item) => item.value === role), [roles, role])
  const roleLabel = selectedRole?.label || titleCase(role)
  const selectedManager = managers.find((item) => item.id === manager)

  const accessRows = systemAccess.map((item) => ({ ...item, synced: true }))

  function generateUsername() {
    const base = fullName || email.split('@')[0] || 'user'
    setUsername(base.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '').slice(0, 32))
  }

  function generatePassword() {
    setPassword(passwordSeed())
  }

  return (
    <form action={action} style={shellStyle}>
      <input type="hidden" name="status" value={active ? 'active' : 'inactive'} />
      <input type="hidden" name="must_change_password" value={mustChange ? 'true' : 'false'} />
      <input type="hidden" name="send_welcome_email" value={sendWelcome ? 'true' : 'false'} />
      <input type="hidden" name="two_factor_required" value={twoFactor ? 'true' : 'false'} />
      <input type="hidden" name="add_to_onboarding" value={onboarding ? 'true' : 'false'} />
      <input type="hidden" name="timezone" value={timezone} />
      <input type="hidden" name="manager_user_id" value={manager} />
      <input type="hidden" name="employment_type" value={employmentType} />
      <input type="hidden" name="work_location" value={location} />
      <input type="hidden" name="employee_type" value={employeeType} />

      <div style={topBarStyle}>
        <Stepper />
        <div style={topActionsStyle}>
          <a href="/users" style={cancelStyle}>Cancel</a>
          <button type="submit" style={createStyle}>Create User</button>
        </div>
      </div>

      <div style={layoutStyle}>
        <main style={mainStyle}>
          <div style={twoColumnStyle}>
            <Section title="Personal Information" icon="♙">
              <Field label="Full Name" required value={fullName} onChange={setFullName} name="full_name" placeholder="Enter full name" />
              <Field label="Email Address" required value={email} onChange={setEmail} name="email" placeholder="name@angelcare.ma" badge="Available" />
              <Field label="Phone Number" required value={phone} onChange={setPhone} name="phone" placeholder="+212 6 12 34 56 78" />
              <Field label="ID Number (Optional)" name="id_number" placeholder="Enter ID or Employee Number" />
              <div style={inlineGridStyle}>
                <Field label="Date of Birth" name="date_of_birth" placeholder="DD/MM/YYYY" />
                <SelectLike label="Gender" name="gender" options={['Select gender', 'Female', 'Male', 'Prefer not to say']} />
              </div>
            </Section>

            <Section title="Account Information" icon="♙">
              <Field label="Username" required value={username} onChange={setUsername} name="username" placeholder="username" badge="Available" />
              <label style={fieldStyle}>
                <span style={labelStyle}>Temporary Password <b>*</b></span>
                <div style={passwordRowStyle}>
                  <input name="password" value={password} onChange={(event) => setPassword(event.target.value)} style={inputStyle} />
                  <button type="button" onClick={generatePassword} style={smallButtonStyle}>Generate</button>
                  <button type="button" onClick={generateUsername} style={iconButtonStyle}>↻</button>
                </div>
                <div style={strengthStyle}><span>Strong</span><i /><i /><i /><i /></div>
              </label>
              <div style={inlineGridStyle}>
                <SelectControlled label="Language" name="language" value={language} setValue={setLanguage} options={languages} />
                <SelectControlled label="Timezone" name="timezone_display" value={timezone} setValue={setTimezone} options={timezones} />
              </div>
              <Toggle label="Account Status" checked={active} setChecked={setActive} caption={active ? 'Active' : 'Inactive'} />
              <div style={noticeStyle}>ⓘ User will receive an email with login instructions and temporary password.</div>
            </Section>
          </div>

          <Section title="Organization Details" icon="▣">
            <div style={orgGridStyle}>
              <SelectControlled label="Department" required name="department" value={department} setValue={setDepartment} options={departments.length ? departments : roles.map((r) => r.department)} />
              <SelectControlled label="Position" required name="job_title" value={position} setValue={setPosition} options={positions.length ? positions : ['Manager', 'Officer', 'Agent', 'Staff']} />
              <SelectControlled label="Employment Type" required name="employment_type_display" value={employmentType} setValue={setEmploymentType} options={employmentTypes} />
              <SelectControlled label="Work Location" required name="work_location_display" value={location} setValue={setLocation} options={locations} />
              <SelectControlled label="Reports To (Manager)" name="manager_display" value={manager} setValue={setManager} options={[{ value: '', label: 'Search and select manager' }, ...managers.map((m) => ({ value: m.id, label: `${m.name} · ${m.role || 'manager'}` }))]} />
              <SelectLike label="Team" name="team" options={['Select team', 'HR Core', 'Operations', 'Academy', 'Market OS', 'Revenue', 'Finance']} />
              <SelectLike label="Cost Center (Optional)" name="cost_center" options={['Select cost center', 'HR', 'OPS', 'MKT', 'REV', 'FIN', 'ACADEMY']} />
              <SelectControlled label="Employee Type" name="employee_type_display" value={employeeType} setValue={setEmployeeType} options={employeeTypes} />
            </div>
          </Section>

          <Section title="Role & Permissions" icon="⌘">
            <div style={roleGridStyle}>
              <SelectControlled label="Assign Role" required name="role" value={role} setValue={(next) => {
                setRole(next)
                const roleNext = roles.find((item) => item.value === next)
                if (roleNext?.department) setDepartment(roleNext.department)
              }} options={roles.map((item) => ({ value: item.value, label: `${item.label} · ${item.department}` }))} />
            </div>
            <div style={permissionPreviewStyle}>
              {permissionStats.map((item) => (
                <div key={item.key} style={permissionCardStyle}>
                  <span style={permissionIconStyle}>{item.icon}</span>
                  <strong>{item.label}</strong>
                  <small>{item.count} permissions available</small>
                </div>
              ))}
            </div>
            <SmartPermissionsPanel defaultPermissions={[]} roleTemplates={ROLE_PERMISSION_TEMPLATES} />
          </Section>
        </main>

        <aside style={asideStyle}>
          <Panel title="User Summary">
            <div style={avatarBoxStyle}>
              <div style={bigAvatarStyle}>{initials(fullName)}</div>
              <span style={cameraStyle}>◉</span>
            </div>
            <Summary label="Full Name" value={fullName} />
            <Summary label="Email" value={email} />
            <Summary label="Username" value={username} />
            <Summary label="Role" value={roleLabel} />
            <Summary label="Department" value={department} />
            <Summary label="Position" value={position} />
            <Summary label="Location" value={location} />
            <Summary label="Status" value={active ? 'Active' : 'Inactive'} status />
            <Summary label="Start Date" value={new Date().toLocaleDateString('en-GB')} />
            <Summary label="Reporting To" value={selectedManager?.name || ''} />
          </Panel>

          <Panel title="System Access">
            <div style={accessListStyle}>
              {accessRows.map((item) => (
                <div key={item.permission} style={accessRowStyle}>
                  <span style={accessIconStyle}>{item.icon}</span>
                  <strong>{item.label}</strong>
                  <em>✓ Synced</em>
                </div>
              ))}
            </div>
            <div style={syncFooterStyle}><span>Last Sync<br /><b>{new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</b></span><strong>● Live</strong></div>
          </Panel>

          <Panel title="Additional Options">
            <SwitchRow label="Send welcome email" checked={sendWelcome} setChecked={setSendWelcome} />
            <SwitchRow label="Require password change on first login" checked={mustChange} setChecked={setMustChange} />
            <SwitchRow label="Two-factor authentication required" checked={twoFactor} setChecked={setTwoFactor} />
            <SwitchRow label="Add to onboarding workflow" checked={onboarding} setChecked={setOnboarding} />
          </Panel>
        </aside>
      </div>
    </form>
  )
}

function Stepper() {
  const steps = [
    ['1', 'Basic Information', 'User details'],
    ['2', 'Organization', 'Department & Position'],
    ['3', 'Role & Permissions', 'Access & Privileges'],
    ['4', 'Assignments', 'Teams & Reporting'],
    ['5', 'Review & Confirm', 'Verify & Create'],
  ]
  return <div style={stepperStyle}>{steps.map((s, index) => <div key={s[0]} style={stepStyle}><span style={index === 0 ? stepActiveStyle : stepBubbleStyle}>{s[0]}</span><div><strong>{s[1]}</strong><small>{s[2]}</small></div>{index < steps.length - 1 ? <i /> : null}</div>)}</div>
}

function Section({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return <section style={sectionStyle}><h2 style={sectionTitleStyle}><span>{icon}</span>{title}</h2>{children}</section>
}
function Panel({ title, children }: { title: string; children: ReactNode }) { return <section style={panelStyle}><h3>{title}</h3>{children}</section> }
function Summary({ label, value, status }: { label: string; value?: string; status?: boolean }) { return <div style={summaryRowStyle}><span>{label}</span><strong style={status && value ? activeBadgeStyle : undefined}>{value || '—'}</strong></div> }
function Field({ label, name, required, placeholder, badge, value, onChange }: { label: string; name: string; required?: boolean; placeholder?: string; badge?: string; value?: string; onChange?: (value: string) => void }) { return <label style={fieldStyle}><span style={labelStyle}>{label} {required ? <b>*</b> : null}</span><div style={inputWrapStyle}><input name={name} value={value} onChange={onChange ? (e) => onChange(e.target.value) : undefined} placeholder={placeholder} required={required} style={inputStyle} />{badge ? <em>{badge}</em> : null}</div></label> }
function SelectControlled({ label, name, value, setValue, options, required }: { label: string; name: string; value: string; setValue: (value: string) => void; options: Array<string | { value: string; label: string }>; required?: boolean }) { return <label style={fieldStyle}><span style={labelStyle}>{label} {required ? <b>*</b> : null}</span><select name={name} value={value} onChange={(e) => setValue(e.target.value)} required={required} style={inputStyle}>{options.map((option) => { const v = typeof option === 'string' ? option : option.value; const l = typeof option === 'string' ? option : option.label; return <option key={v} value={v}>{l}</option> })}</select></label> }
function SelectLike({ label, name, options }: { label: string; name: string; options: string[] }) { return <label style={fieldStyle}><span style={labelStyle}>{label}</span><select name={name} style={inputStyle}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></label> }
function Toggle({ label, checked, setChecked, caption, muted }: { label: string; checked: boolean; setChecked: (v: boolean) => void; caption?: string; muted?: boolean }) { return <div style={toggleBlockStyle}><span style={labelStyle}>{label}</span><button type="button" onClick={() => setChecked(!checked)} style={checked ? switchOnStyle : switchOffStyle}><i /></button><small>{caption}</small>{muted ? <p>Fine-tune specific access rights</p> : null}</div> }
function SwitchRow({ label, checked, setChecked }: { label: string; checked: boolean; setChecked: (v: boolean) => void }) { return <div style={switchRowStyle}><span>{label}</span><button type="button" onClick={() => setChecked(!checked)} style={checked ? miniSwitchOnStyle : miniSwitchOffStyle}><i /></button></div> }

const shellStyle: CSSProperties = { display: 'grid', gap: 22 }
const topBarStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 18, alignItems: 'start' }
const stepperStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, padding: 22, borderRadius: 20, background: '#fff', border: '1px solid #e7eaf3', boxShadow: '0 14px 40px rgba(15,23,42,.04)' }
const stepStyle: CSSProperties = { position: 'relative', display: 'flex', alignItems: 'center', gap: 12, color: '#111827' }
const stepBubbleStyle: CSSProperties = { width: 38, height: 38, borderRadius: 999, display: 'grid', placeItems: 'center', background: '#f3efff', border: '1px solid #ddd6fe', color: '#6d5dfc', fontWeight: 950, boxShadow: 'inset 0 0 0 4px rgba(255,255,255,.72)' }
const stepActiveStyle: CSSProperties = { ...stepBubbleStyle, background: 'linear-gradient(135deg,#7c3aed,#5b35f5)', color: '#fff', boxShadow: '0 12px 24px rgba(124,58,237,.28)' }
const topActionsStyle: CSSProperties = { display: 'flex', gap: 12 }
const cancelStyle: CSSProperties = { textDecoration: 'none', padding: '14px 22px', borderRadius: 10, color: '#111827', border: '1px solid #e5e7eb', fontWeight: 900, background: '#fff' }
const createStyle: CSSProperties = { padding: '14px 22px', borderRadius: 10, border: 'none', color: '#fff', fontWeight: 950, cursor: 'pointer', background: 'linear-gradient(135deg,#7c3aed,#5b35f5)', boxShadow: '0 16px 28px rgba(124,58,237,.25)' }
const layoutStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 22, alignItems: 'start' }
const mainStyle: CSSProperties = { display: 'grid', gap: 18 }
const twoColumnStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }
const sectionStyle: CSSProperties = { padding: 24, borderRadius: 18, background: '#fff', border: '1px solid #e7eaf3', boxShadow: '0 14px 42px rgba(15,23,42,.045)' }
const sectionTitleStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 22px', color: '#111827', fontSize: 18, fontWeight: 950 }
const fieldStyle: CSSProperties = { display: 'grid', gap: 9, marginBottom: 16 }
const labelStyle: CSSProperties = { color: '#334155', fontWeight: 900, fontSize: 13 }
const inputWrapStyle: CSSProperties = { position: 'relative', display: 'flex', alignItems: 'center' }
const inputStyle: CSSProperties = { width: '100%', height: 46, borderRadius: 10, border: '1px solid #dfe5f0', background: '#fff', color: '#0f172a', padding: '0 14px', fontWeight: 800, outline: 'none', boxSizing: 'border-box' }
const inlineGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }
const passwordRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8 }
const smallButtonStyle: CSSProperties = { height: 46, padding: '0 16px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#6d28d9', fontWeight: 950, cursor: 'pointer' }
const iconButtonStyle: CSSProperties = { ...smallButtonStyle, width: 46, padding: 0, color: '#64748b' }
const strengthStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'auto repeat(4,1fr)', gap: 6, alignItems: 'center', color: '#059669', fontSize: 12, fontWeight: 950 }
const noticeStyle: CSSProperties = { padding: 14, borderRadius: 10, background: '#eff6ff', border: '1px solid #dbeafe', color: '#2563eb', fontWeight: 850 }
const orgGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }
const roleGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1.25fr 1fr', gap: 16, alignItems: 'start' }
const permissionPreviewStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 12, marginTop: 18 }
const permissionCardStyle: CSSProperties = { minHeight: 74, borderRadius: 12, border: '1px solid #e7eaf3', background: '#fff', padding: 12, display: 'grid', gap: 4, cursor: 'pointer', boxShadow: '0 10px 24px rgba(15,23,42,.035)' }
const permissionIconStyle: CSSProperties = { width: 24, height: 24, display: 'grid', placeItems: 'center', borderRadius: 8, background: '#f3efff', color: '#6d28d9' }
const asideStyle: CSSProperties = { display: 'grid', gap: 14, position: 'sticky', top: 104 }
const panelStyle: CSSProperties = { padding: 22, borderRadius: 16, background: '#fff', border: '1px solid #e7eaf3', boxShadow: '0 14px 42px rgba(15,23,42,.045)' }
const avatarBoxStyle: CSSProperties = { display: 'grid', placeItems: 'center', margin: '10px 0 18px', position: 'relative' }
const bigAvatarStyle: CSSProperties = { width: 72, height: 72, borderRadius: 999, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 950, fontSize: 30, background: 'linear-gradient(135deg,#7c3aed,#6366f1)' }
const cameraStyle: CSSProperties = { position: 'absolute', bottom: 4, right: '37%', width: 22, height: 22, borderRadius: 999, display: 'grid', placeItems: 'center', background: '#fff', border: '1px solid #e5e7eb', fontSize: 10 }
const summaryRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, padding: '7px 0', color: '#475569', fontSize: 13, fontWeight: 850 }
const activeBadgeStyle: CSSProperties = { padding: '4px 8px', borderRadius: 8, color: '#059669', background: '#d1fae5' }
const accessListStyle: CSSProperties = { display: 'grid', gap: 11 }
const accessRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '24px 1fr auto', gap: 10, alignItems: 'center', fontSize: 13, color: '#334155' }
const accessIconStyle: CSSProperties = { width: 24, height: 24, display: 'grid', placeItems: 'center', borderRadius: 8, background: '#eff6ff' }
const syncFooterStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginTop: 18, color: '#64748b', fontSize: 12 }
const switchRowStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', color: '#334155', fontSize: 13, fontWeight: 850 }
const toggleBlockStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'auto auto 1fr', alignItems: 'center', gap: 10, marginTop: 8 }
const switchOnStyle: CSSProperties = { width: 42, height: 24, borderRadius: 999, border: 'none', background: '#6d28d9', cursor: 'pointer' }
const switchOffStyle: CSSProperties = { ...switchOnStyle, background: '#cbd5e1' }
const miniSwitchOnStyle: CSSProperties = { ...switchOnStyle, width: 36, height: 20 }
const miniSwitchOffStyle: CSSProperties = { ...miniSwitchOnStyle, background: '#cbd5e1' }

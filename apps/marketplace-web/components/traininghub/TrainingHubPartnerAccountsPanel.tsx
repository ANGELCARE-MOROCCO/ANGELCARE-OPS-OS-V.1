'use client'

import type { CSSProperties, FormEvent } from 'react'
import { useMemo, useState } from 'react'

type Props = {
  organizations: any[]
  profiles: any[]
  memberships: any[]
  roleAssignments: any[]
  roles: any[]
}

type CreationMode = 'new_partner' | 'existing_partner'

const roleOptions = [
  ['partner_owner', 'Direction partenaire'],
  ['partner_manager', 'Responsable formation'],
  ['trainer', 'Trainer externe'],
  ['learner', 'Participant / staff'],
]

const accountTypeOptions = [
  ['partner_school', 'Crèche / école partenaire'],
  ['premium_partner', 'Partenaire premium'],
  ['pilot_partner', 'Partenaire pilote'],
  ['training_client', 'Client formation'],
]

function clean(value: unknown, fallback = 'Non défini') {
  const text = String(value || '').trim()
  return text || fallback
}

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function isPartner(org: any) {
  const type = normalize(org.organization_type)
  return (
    type.includes('partner') ||
    type.includes('school') ||
    type.includes('creche') ||
    type.includes('crèche') ||
    type.includes('training_client') ||
    type.includes('premium_partner') ||
    type !== 'angelcare_internal'
  )
}

function orgName(org?: any) {
  return clean(org?.name || org?.legal_name || org?.display_name, 'Partenaire non renseigné')
}

function statusTone(status?: string | null) {
  const value = normalize(status)
  if (value === 'active') return { bg: '#ecfdf5', fg: '#047857', border: '#bbf7d0' }
  if (value === 'suspended' || value === 'inactive' || value === 'disabled') return { bg: '#fef2f2', fg: '#b91c1c', border: '#fecaca' }
  return { bg: '#fff7ed', fg: '#c2410c', border: '#fed7aa' }
}

function statusLabel(status?: string | null) {
  const value = normalize(status)
  if (value === 'active') return 'Actif'
  if (value === 'suspended') return 'Suspendu'
  if (value === 'inactive' || value === 'disabled') return 'Désactivé'
  return 'En activation'
}

function initials(value?: string | null) {
  const cleanValue = clean(value, 'AC')
  return cleanValue.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'AC'
}

function randomPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$!'
  let value = 'AC-'
  for (let i = 0; i < 14; i += 1) value += alphabet[Math.floor(Math.random() * alphabet.length)]
  return value
}

function todayPlusDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function TrainingHubPartnerAccountsPanel({ organizations, profiles, memberships, roleAssignments, roles }: Props) {
  const partnerOrganizations = useMemo(() => organizations.filter(isPartner), [organizations])
  const orgById = useMemo(() => new Map(organizations.map((org) => [org.id, org])), [organizations])
  const profileById = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile])), [profiles])
  const roleById = useMemo(() => new Map(roles.map((role) => [role.id, role])), [roles])

  const [search, setSearch] = useState('')
  const [organizationId, setOrganizationId] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [mode, setMode] = useState<CreationMode>(partnerOrganizations.length ? 'existing_partner' : 'new_partner')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<{ email: string; password: string; partner: string } | null>(null)
  const [form, setForm] = useState({
    organization_id: partnerOrganizations[0]?.id || '',
    partner_name: '',
    partner_city: '',
    partner_type: 'partner_school',
    partner_phone: '',
    partner_notes: '',
    plan_name: 'Compte partenaire TrainingHub',
    plan_status: 'active',
    valid_until: todayPlusDays(365),
    full_name: '',
    email: '',
    job_title: 'Direction pédagogique',
    role_code: 'partner_owner',
    temporary_password: '',
  })

  const partnerRows = useMemo(() => {
    return memberships
      .filter((membership) => partnerOrganizations.some((org) => org.id === membership.organization_id))
      .map((membership) => {
        const profile = profileById.get(membership.user_id)
        const org = orgById.get(membership.organization_id)
        const assignments = roleAssignments.filter((assignment) => assignment.user_id === membership.user_id && assignment.organization_id === membership.organization_id)
        const roleLabels = assignments
          .map((assignment) => roleById.get(assignment.role_id))
          .filter(Boolean)
          .map((role: any) => role.code || role.name)
        return {
          membership,
          profile,
          org,
          roles: roleLabels,
          status: profile?.status || membership.status || 'pending',
        }
      })
      .filter((row) => row.profile?.id)
  }, [memberships, partnerOrganizations, profileById, orgById, roleAssignments, roleById])

  const filteredRows = useMemo(() => {
    const q = normalize(search)
    return partnerRows.filter((row) => {
      const roleText = row.roles.join(' ')
      const matchesSearch = !q || normalize(`${row.profile.full_name} ${row.profile.email} ${row.profile.job_title} ${orgName(row.org)} ${roleText}`).includes(q)
      const matchesOrg = organizationId === 'all' || row.membership.organization_id === organizationId
      const matchesRole = roleFilter === 'all' || row.roles.includes(roleFilter)
      const matchesStatus = statusFilter === 'all' || normalize(row.status) === statusFilter
      return matchesSearch && matchesOrg && matchesRole && matchesStatus
    })
  }, [partnerRows, search, organizationId, roleFilter, statusFilter])

  const activeUsers = partnerRows.filter((row) => normalize(row.status) === 'active').length
  const suspendedUsers = partnerRows.filter((row) => ['suspended', 'inactive', 'disabled'].includes(normalize(row.status))).length
  const ownerUsers = partnerRows.filter((row) => row.roles.includes('partner_owner')).length

  function updateForm(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function openCreate() {
    const nextMode: CreationMode = partnerOrganizations.length ? 'existing_partner' : 'new_partner'
    setMode(nextMode)
    setCredentials(null)
    setMessage(null)
    setForm((current) => ({
      ...current,
      organization_id: current.organization_id || partnerOrganizations[0]?.id || '',
      temporary_password: randomPassword(),
      valid_until: current.valid_until || todayPlusDays(365),
    }))
    setModalOpen(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage(null)
    setCredentials(null)

    try {
      const payload =
        mode === 'new_partner'
          ? {
              action: 'create',
              create_partner: true,
              partner_name: form.partner_name,
              partner_city: form.partner_city,
              partner_type: form.partner_type,
              partner_phone: form.partner_phone,
              partner_notes: form.partner_notes,
              plan_name: form.plan_name,
              plan_status: form.plan_status,
              valid_until: form.valid_until,
              full_name: form.full_name,
              email: form.email,
              job_title: form.job_title,
              role_code: form.role_code,
              temporary_password: form.temporary_password,
            }
          : {
              action: 'create',
              create_partner: false,
              organization_id: form.organization_id,
              full_name: form.full_name,
              email: form.email,
              job_title: form.job_title,
              role_code: form.role_code,
              temporary_password: form.temporary_password,
            }

      const response = await fetch('/api/traininghub/commercial/partner-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || result?.ok === false) {
        setMessage(result?.error?.message || result?.message || 'Accès partenaire non créé.')
        return
      }

      setCredentials({
        email: result.data.email,
        password: result.data.temporary_password || form.temporary_password,
        partner: result.data.organization?.name || form.partner_name || orgName(partnerOrganizations.find((org) => org.id === form.organization_id)),
      })
      setMessage('Compte partenaire et accès utilisateur créés avec succès.')
    } finally {
      setBusy(false)
    }
  }

  async function changeStatus(profileId: string, action: 'suspend' | 'reactivate') {
    setBusy(true)
    setMessage(null)
    try {
      const response = await fetch('/api/traininghub/commercial/partner-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, profile_id: profileId }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || result?.ok === false) {
        setMessage(result?.error?.message || result?.message || 'Action utilisateur non finalisée.')
        return
      }
      window.location.reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>COMPTES UTILISATEURS PARTENAIRES</div>
          <h2 style={titleStyle}>Création complète partenaire + accès</h2>
          <p style={textStyle}>
            Créez soit un utilisateur pour un partenaire existant, soit un nouveau dossier partenaire complet avec son premier accès direction.
          </p>
        </div>
        <button type="button" onClick={openCreate} style={primaryButtonStyle}>+ Nouveau partenaire / utilisateur</button>
      </div>

      <div style={statsGridStyle}>
        <Stat label="Utilisateurs partenaires" value={partnerRows.length} />
        <Stat label="Partenaires disponibles" value={partnerOrganizations.length} />
        <Stat label="Directions" value={ownerUsers} />
        <Stat label="Suspendus" value={suspendedUsers} />
      </div>

      <div style={filterBarStyle}>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher nom, email, partenaire ou rôle…" style={inputStyle} />
        <select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} style={selectStyle}>
          <option value="all">Tous les partenaires</option>
          {partnerOrganizations.map((org) => <option key={org.id} value={org.id}>{orgName(org)}</option>)}
        </select>
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} style={selectStyle}>
          <option value="all">Tous les rôles</option>
          {roleOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={selectStyle}>
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="suspended">Suspendus</option>
        </select>
      </div>

      <div style={userGridStyle}>
        {filteredRows.length ? filteredRows.slice(0, 80).map((row) => {
          const tone = statusTone(row.status)
          const active = normalize(row.status) === 'active'
          return (
            <article key={`${row.membership.id}-${row.profile.id}`} style={userCardStyle}>
              <div style={userTopStyle}>
                <div style={avatarStyle}>{initials(row.profile.full_name || row.profile.email)}</div>
                <div>
                  <strong>{row.profile.full_name || row.profile.email}</strong>
                  <span>{row.profile.email}</span>
                </div>
                <em style={{ ...badgeStyle, background: tone.bg, color: tone.fg, borderColor: tone.border }}>{statusLabel(row.status)}</em>
              </div>
              <div style={userMetaStyle}>
                <span>{orgName(row.org)}</span>
                <span>{row.profile.job_title || 'Fonction non renseignée'}</span>
                <span>{row.roles.join(' / ') || 'Rôle à confirmer'}</span>
              </div>
              <div style={cardActionsStyle}>
                <button type="button" disabled={busy || !active} onClick={() => changeStatus(row.profile.id, 'suspend')} style={dangerButtonStyle}>Suspendre</button>
                <button type="button" disabled={busy || active} onClick={() => changeStatus(row.profile.id, 'reactivate')} style={softButtonStyle}>Réactiver</button>
              </div>
            </article>
          )
        }) : <div style={emptyStyle}>Aucun utilisateur partenaire encore affiché. Créez un nouveau partenaire ou rattachez un accès à un partenaire existant.</div>}
      </div>

      {message ? <div style={messageStyle}>{message}</div> : null}

      {modalOpen ? (
        <div style={modalBackdropStyle}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <div style={eyebrowStyle}>NOUVEAU DOSSIER / ACCÈS PARTENAIRE</div>
                <h3 style={modalTitleStyle}>Créer un partenaire ou ajouter un utilisateur</h3>
                <p style={textStyle}>Le workflow crée le dossier école, le compte partenaire, puis le premier accès TrainingHub si nécessaire.</p>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} style={closeButtonStyle}>×</button>
            </div>

            <div style={modeSwitchStyle}>
              <button
                type="button"
                onClick={() => setMode('new_partner')}
                style={mode === 'new_partner' ? modeActiveStyle : modeButtonStyle}
              >
                Créer nouveau partenaire + accès
              </button>
              <button
                type="button"
                onClick={() => setMode('existing_partner')}
                disabled={!partnerOrganizations.length}
                style={mode === 'existing_partner' ? modeActiveStyle : modeButtonStyle}
              >
                Ajouter à partenaire existant
              </button>
            </div>

            <form onSubmit={submit} style={formStyle}>
              {mode === 'new_partner' ? (
                <section style={subPanelStyle}>
                  <div style={subHeaderStyle}>
                    <strong>1. Dossier partenaire</strong>
                    <span>Crèche / école / établissement client à créer</span>
                  </div>
                  <div style={formGridStyle}>
                    <label style={fieldStyle}>
                      <span>Nom établissement partenaire</span>
                      <input value={form.partner_name} onChange={(event) => updateForm('partner_name', event.target.value)} style={inputStyle} required />
                    </label>
                    <label style={fieldStyle}>
                      <span>Ville</span>
                      <input value={form.partner_city} onChange={(event) => updateForm('partner_city', event.target.value)} style={inputStyle} placeholder="Rabat, Temara, Casablanca…" />
                    </label>
                  </div>
                  <div style={formGridStyle}>
                    <label style={fieldStyle}>
                      <span>Type de compte</span>
                      <select value={form.partner_type} onChange={(event) => updateForm('partner_type', event.target.value)} style={inputStyle}>
                        {accountTypeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                    <label style={fieldStyle}>
                      <span>Téléphone / WhatsApp</span>
                      <input value={form.partner_phone} onChange={(event) => updateForm('partner_phone', event.target.value)} style={inputStyle} />
                    </label>
                  </div>
                  <div style={formGridStyle}>
                    <label style={fieldStyle}>
                      <span>Nom du plan / compte</span>
                      <input value={form.plan_name} onChange={(event) => updateForm('plan_name', event.target.value)} style={inputStyle} />
                    </label>
                    <label style={fieldStyle}>
                      <span>Validité commerciale</span>
                      <input type="date" value={form.valid_until} onChange={(event) => updateForm('valid_until', event.target.value)} style={inputStyle} />
                    </label>
                  </div>
                </section>
              ) : (
                <section style={subPanelStyle}>
                  <div style={subHeaderStyle}>
                    <strong>1. Partenaire existant</strong>
                    <span>Choisir le dossier école à enrichir</span>
                  </div>
                  {partnerOrganizations.length ? (
                    <label style={fieldStyle}>
                      <span>Établissement partenaire</span>
                      <select value={form.organization_id} onChange={(event) => updateForm('organization_id', event.target.value)} style={inputStyle} required>
                        {partnerOrganizations.map((org) => <option key={org.id} value={org.id}>{orgName(org)}</option>)}
                      </select>
                    </label>
                  ) : (
                    <div style={emptyStyle}>Aucun partenaire existant. Utilisez le mode “Créer nouveau partenaire + accès”.</div>
                  )}
                </section>
              )}

              <section style={subPanelStyle}>
                <div style={subHeaderStyle}>
                  <strong>2. Premier accès utilisateur</strong>
                  <span>Direction, responsable formation, trainer ou participant</span>
                </div>
                <div style={formGridStyle}>
                  <label style={fieldStyle}>
                    <span>Nom complet</span>
                    <input value={form.full_name} onChange={(event) => updateForm('full_name', event.target.value)} style={inputStyle} required />
                  </label>
                  <label style={fieldStyle}>
                    <span>Email professionnel</span>
                    <input type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} style={inputStyle} required />
                  </label>
                </div>

                <div style={formGridStyle}>
                  <label style={fieldStyle}>
                    <span>Fonction</span>
                    <input value={form.job_title} onChange={(event) => updateForm('job_title', event.target.value)} style={inputStyle} />
                  </label>
                  <label style={fieldStyle}>
                    <span>Rôle TrainingHub</span>
                    <select value={form.role_code} onChange={(event) => updateForm('role_code', event.target.value)} style={inputStyle}>
                      {roleOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                </div>

                <label style={fieldStyle}>
                  <span>Mot de passe temporaire</span>
                  <input value={form.temporary_password} onChange={(event) => updateForm('temporary_password', event.target.value)} style={inputStyle} required />
                </label>
              </section>

              {credentials ? (
                <div style={credentialsStyle}>
                  <strong>Accès créé — à transmettre au partenaire</strong>
                  <span>Partenaire : {credentials.partner}</span>
                  <span>Email : {credentials.email}</span>
                  <span>Mot de passe temporaire : {credentials.password}</span>
                </div>
              ) : null}

              <div style={modalActionsStyle}>
                <button type="button" onClick={() => setModalOpen(false)} style={cancelButtonStyle}>Fermer</button>
                <button type="submit" disabled={busy || (mode === 'existing_partner' && !partnerOrganizations.length)} style={saveButtonStyle}>
                  {busy ? 'Création…' : mode === 'new_partner' ? 'Créer partenaire + accès' : 'Créer l’accès utilisateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={statCardStyle}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

const panelStyle: CSSProperties = {
  borderRadius: 32,
  padding: 22,
  background: '#fff',
  border: '1px solid #e2e8f0',
  boxShadow: '0 18px 48px rgba(15,23,42,.06)',
}
const headerStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16 }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }
const titleStyle: CSSProperties = { margin: 0, fontSize: 25, lineHeight: 1.08, letterSpacing: '-.04em', fontWeight: 950 }
const textStyle: CSSProperties = { margin: '7px 0 0', color: '#64748b', lineHeight: 1.55, fontSize: 13, fontWeight: 700, maxWidth: 820 }
const primaryButtonStyle: CSSProperties = { border: 0, borderRadius: 17, padding: '13px 16px', background: 'linear-gradient(135deg,#0f2a52,#2563eb)', color: '#fff', fontWeight: 950, cursor: 'pointer', whiteSpace: 'nowrap' }
const statsGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12, marginBottom: 16 }
const statCardStyle: CSSProperties = { display: 'grid', gap: 4, borderRadius: 20, padding: 16, background: '#f8fbff', border: '1px solid #dbeafe' }
const filterBarStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) repeat(3,minmax(0,1fr))', gap: 10, marginBottom: 16 }
const inputStyle: CSSProperties = { border: '1px solid #e2e8f0', background: '#fff', borderRadius: 16, padding: '12px 13px', color: '#0f172a', fontWeight: 850, outline: 'none' }
const selectStyle: CSSProperties = inputStyle
const userGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const userCardStyle: CSSProperties = { borderRadius: 24, padding: 16, background: 'linear-gradient(180deg,#ffffff,#f8fbff)', border: '1px solid #dbeafe', boxShadow: '0 12px 32px rgba(15,23,42,.05)', display: 'grid', gap: 12 }
const userTopStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '44px minmax(0,1fr) auto', gap: 10, alignItems: 'center' }
const avatarStyle: CSSProperties = { width: 44, height: 44, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#eff6ff', color: '#1d4ed8', fontWeight: 950 }
const badgeStyle: CSSProperties = { border: '1px solid', borderRadius: 999, padding: '7px 10px', fontSize: 11, fontWeight: 950, whiteSpace: 'nowrap', fontStyle: 'normal' }
const userMetaStyle: CSSProperties = { display: 'grid', gap: 4, color: '#64748b', fontSize: 12, fontWeight: 750 }
const cardActionsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }
const softButtonStyle: CSSProperties = { border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', borderRadius: 14, padding: '10px 12px', fontWeight: 950, cursor: 'pointer' }
const dangerButtonStyle: CSSProperties = { ...softButtonStyle, borderColor: '#fed7aa', background: '#fff7ed', color: '#c2410c' }
const messageStyle: CSSProperties = { marginTop: 14, borderRadius: 18, padding: 14, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857', fontWeight: 850 }
const emptyStyle: CSSProperties = { padding: 14, borderRadius: 16, background: '#f8fafc', color: '#64748b', fontWeight: 800, border: '1px dashed #cbd5e1' }
const modalBackdropStyle: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.42)', display: 'grid', placeItems: 'center', padding: 20, zIndex: 80 }
const modalStyle: CSSProperties = { width: 'min(1040px, 100%)', maxHeight: '90vh', overflow: 'auto', borderRadius: 34, padding: 26, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 30px 100px rgba(15,23,42,.30)' }
const modalHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16 }
const modalTitleStyle: CSSProperties = { margin: 0, fontSize: 32, letterSpacing: '-.055em', fontWeight: 950 }
const closeButtonStyle: CSSProperties = { border: '1px solid #e2e8f0', background: '#fff', borderRadius: 14, width: 42, height: 42, fontSize: 24, cursor: 'pointer' }
const modeSwitchStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: 8, borderRadius: 20, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 16 }
const modeButtonStyle: CSSProperties = { border: 0, borderRadius: 14, background: 'transparent', color: '#475569', padding: '12px 14px', fontWeight: 950, cursor: 'pointer' }
const modeActiveStyle: CSSProperties = { ...modeButtonStyle, background: '#0f2a52', color: '#fff', boxShadow: '0 12px 26px rgba(15,42,82,.16)' }
const formStyle: CSSProperties = { display: 'grid', gap: 14 }
const subPanelStyle: CSSProperties = { display: 'grid', gap: 13, borderRadius: 24, padding: 16, background: '#f8fbff', border: '1px solid #dbeafe' }
const subHeaderStyle: CSSProperties = { display: 'grid', gap: 4, color: '#0f172a' }
const formGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }
const fieldStyle: CSSProperties = { display: 'grid', gap: 6, color: '#334155', fontSize: 12, fontWeight: 950 }
const credentialsStyle: CSSProperties = { display: 'grid', gap: 6, borderRadius: 18, padding: 14, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857', fontWeight: 850 }
const modalActionsStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, flexWrap: 'wrap' }
const cancelButtonStyle: CSSProperties = { border: '1px solid #e2e8f0', background: '#fff', color: '#475569', borderRadius: 15, padding: '12px 14px', fontWeight: 950, cursor: 'pointer' }
const saveButtonStyle: CSSProperties = { border: 0, background: 'linear-gradient(135deg,#0f2a52,#2563eb)', color: '#fff', borderRadius: 15, padding: '12px 14px', fontWeight: 950, cursor: 'pointer' }

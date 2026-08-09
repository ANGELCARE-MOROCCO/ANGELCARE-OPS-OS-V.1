'use client'

import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'

type Props = { organizations: any[]; profiles?: any[]; memberships?: any[]; roleAssignments?: any[] }
const clean = (v: unknown, fallback = '') => String(v || '').trim() || fallback
const normalize = (v: unknown) => String(v || '').trim().toLowerCase()
const isPartner = (org: any) => !normalize(org.organization_type || org.type).includes('internal') && !normalize(org.name || org.legal_name || org.display_name).includes('smoke')
const orgName = (org: any) => clean(org?.name || org?.legal_name || org?.display_name, 'Établissement partenaire')
const generatePassword = () => `AC-Team-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}!`
const statusLabel = (v: unknown) => ({ active: 'actif', inactive: 'inactif', suspended: 'suspendu' } as any)[normalize(v)] || clean(v, 'à suivre').replace(/_/g, ' ')

export default function TrainingHubPartnerTeamAccessPanel({ organizations, profiles = [], memberships = [], roleAssignments = [] }: Props) {
  const partners = useMemo(() => organizations.filter(isPartner), [organizations])
  const [organizationId, setOrganizationId] = useState(partners[0]?.id || '')
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [result, setResult] = useState<any | null>(null)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', job_title: 'Équipe partenaire', role_key: 'traininghub_partner_member', temporary_password: generatePassword() })

  const selectedPartner = partners.find((partner) => partner.id === organizationId)
  const selectedMemberships = memberships.filter((membership) => membership.organization_id === organizationId)
  const selectedUserIds = new Set(selectedMemberships.map((membership) => membership.user_id).filter(Boolean))
  const selectedProfiles = profiles.filter((profile) => selectedUserIds.has(profile.id) || selectedUserIds.has(profile.auth_user_id))
  const rows = selectedProfiles.map((profile) => ({ profile, membership: selectedMemberships.find((item) => item.user_id === profile.id || item.user_id === profile.auth_user_id), role: roleAssignments.find((item) => item.organization_id === organizationId && (item.user_id === profile.id || item.user_id === profile.auth_user_id)) }))

  function update(field: keyof typeof form, value: string) { setForm((current) => ({ ...current, [field]: value })) }

  async function post(action: string, body: Record<string, any>, success: string) {
    setBusy(action); setMessage(null); setResult(null)
    try {
      const response = await fetch('/api/traininghub/commercial/partner-team-access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, organization_id: organizationId, ...body }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload?.ok === false) { setMessage(payload?.error?.message || payload?.message || 'Action accès non finalisée.'); return }
      setResult(payload.data); setMessage(success); window.setTimeout(() => window.location.reload(), 900)
    } finally { setBusy(null) }
  }

  return (
    <section style={panelStyle}>
      <div style={topStyle}>
        <div>
          <div style={eyebrowStyle}>ACCÈS ÉQUIPE PARTENAIRE</div>
          <h2 style={titleStyle}>Gérer les utilisateurs du portail partenaire</h2>
          <p style={textStyle}>Ajoutez un directeur, une coordinatrice, une responsable pédagogique ou un membre d’équipe rattaché à un établissement partenaire.</p>
        </div>
        <div style={scoreCardStyle}><span>Accès actifs</span><strong>{rows.filter((row) => normalize(row.profile.status) === 'active').length}/{rows.length}</strong><small>{orgName(selectedPartner)}</small></div>
      </div>

      <div style={selectorGridStyle}>
        <label style={fieldStyle}><span>Établissement</span><select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} style={inputStyle}>{partners.map((partner) => <option key={partner.id} value={partner.id}>{orgName(partner)}</option>)}</select></label>
        <button type="button" onClick={() => setOpen((value) => !value)} style={primaryButtonStyle}>{open ? 'Fermer' : 'Ajouter un utilisateur'}</button>
      </div>

      {open ? <div style={formBoxStyle}>
        <div style={formGridStyle}>
          <label style={fieldStyle}><span>Nom complet</span><input value={form.full_name} onChange={(event) => update('full_name', event.target.value)} style={inputStyle} /></label>
          <label style={fieldStyle}><span>Email</span><input value={form.email} onChange={(event) => update('email', event.target.value)} style={inputStyle} /></label>
          <label style={fieldStyle}><span>Téléphone</span><input value={form.phone} onChange={(event) => update('phone', event.target.value)} style={inputStyle} /></label>
          <label style={fieldStyle}><span>Fonction</span><input value={form.job_title} onChange={(event) => update('job_title', event.target.value)} style={inputStyle} /></label>
          <label style={fieldStyle}><span>Rôle portail</span><select value={form.role_key} onChange={(event) => update('role_key', event.target.value)} style={inputStyle}><option value="traininghub_partner_member">Membre partenaire</option><option value="traininghub_partner_admin">Administrateur partenaire</option></select></label>
          <label style={fieldStyle}><span>Mot de passe temporaire</span><input value={form.temporary_password} onChange={(event) => update('temporary_password', event.target.value)} style={inputStyle} /></label>
        </div>
        <div style={formActionsStyle}><button type="button" onClick={() => update('temporary_password', generatePassword())} style={softButtonStyle}>Générer mot de passe</button><button type="button" disabled={Boolean(busy)} onClick={() => post('create_user', form, 'Utilisateur partenaire créé avec succès.')} style={primaryButtonStyle}>{busy === 'create_user' ? 'Création…' : 'Créer l’accès'}</button></div>
      </div> : null}

      <div style={teamGridStyle}>{rows.map(({ profile, membership, role }) => <article key={profile.id} style={userCardStyle}>
        <div style={userTopStyle}><div><strong>{clean(profile.full_name || profile.display_name, 'Utilisateur partenaire')}</strong><span>{clean(profile.email, 'Email non renseigné')}</span></div><em>{statusLabel(profile.status || membership?.status)}</em></div>
        <div style={miniStyle}><span>{clean(profile.job_title || membership?.metadata?.job_title, 'Équipe partenaire')}</span><span>{clean(role?.role_key || membership?.role_key, 'traininghub_partner_member').replace(/_/g, ' ')}</span></div>
        <div style={actionsStyle}><button type="button" disabled={Boolean(busy)} onClick={() => post('reset_password', { profile_id: profile.id, temporary_password: generatePassword() }, 'Mot de passe temporaire généré.')} style={softButtonStyle}>Réinitialiser</button>{normalize(profile.status) === 'active' ? <button type="button" disabled={Boolean(busy)} onClick={() => post('disable_user', { profile_id: profile.id }, 'Accès désactivé.')} style={dangerButtonStyle}>Désactiver</button> : <button type="button" disabled={Boolean(busy)} onClick={() => post('reactivate_user', { profile_id: profile.id }, 'Accès réactivé.')} style={primaryButtonStyle}>Réactiver</button>}</div>
      </article>)}{!rows.length ? <div style={emptyStyle}>Aucun utilisateur rattaché à ce partenaire pour le moment.</div> : null}</div>

      {message ? <div style={messageStyle}>{message}</div> : null}
      {result?.login ? <div style={resultStyle}><div><strong>{clean(result.login.email)}</strong><span>{clean(result.login.portal_url, '/traininghub/partner')}</span></div><code>{clean(result.login.temporary_password)}</code></div> : null}
    </section>
  )
}

const panelStyle: CSSProperties = { borderRadius: 34, padding: 24, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 18px 48px rgba(15,23,42,.06)' }
const topStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 230px', gap: 16, alignItems: 'start', marginBottom: 16 }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.13em', textTransform: 'uppercase', marginBottom: 7 }
const titleStyle: CSSProperties = { margin: 0, fontSize: 28, lineHeight: 1.06, letterSpacing: '-.05em', fontWeight: 950, color: '#0f172a' }
const textStyle: CSSProperties = { margin: '8px 0 0', color: '#64748b', lineHeight: 1.6, fontSize: 14, fontWeight: 750, maxWidth: 900 }
const scoreCardStyle: CSSProperties = { display: 'grid', gap: 5, borderRadius: 24, padding: 18, color: '#fff', background: 'linear-gradient(135deg,#0b2348,#2557d6)' }
const selectorGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'end', marginBottom: 14 }
const fieldStyle: CSSProperties = { display: 'grid', gap: 6, color: '#334155', fontSize: 12, fontWeight: 950 }
const inputStyle: CSSProperties = { border: '1px solid #e2e8f0', background: '#fff', borderRadius: 16, padding: '12px 13px', color: '#0f172a', fontWeight: 850, outline: 'none' }
const primaryButtonStyle: CSSProperties = { border: 0, borderRadius: 16, padding: '12px 14px', background: 'linear-gradient(135deg,#0f2a52,#2563eb)', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const softButtonStyle: CSSProperties = { border: '1px solid #bfdbfe', borderRadius: 16, padding: '12px 14px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 950, cursor: 'pointer' }
const dangerButtonStyle: CSSProperties = { border: 0, borderRadius: 16, padding: '12px 14px', background: 'linear-gradient(135deg,#7c2d12,#ea580c)', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const formBoxStyle: CSSProperties = { borderRadius: 24, padding: 16, background: '#f8fbff', border: '1px solid #dbeafe', marginBottom: 14 }
const formGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }
const formActionsStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }
const teamGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const userCardStyle: CSSProperties = { display: 'grid', gap: 11, borderRadius: 22, padding: 16, background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 12px 32px rgba(15,23,42,.04)' }
const userTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }
const miniStyle: CSSProperties = { display: 'grid', gap: 4, color: '#64748b', fontSize: 12, fontWeight: 850 }
const actionsStyle: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' }
const emptyStyle: CSSProperties = { gridColumn: '1/-1', borderRadius: 18, padding: 16, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 850 }
const messageStyle: CSSProperties = { marginTop: 14, borderRadius: 18, padding: 14, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#047857', fontWeight: 850 }
const resultStyle: CSSProperties = { marginTop: 14, display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', borderRadius: 18, padding: 14, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontWeight: 850 }

'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, ArrowRight, BadgeCheck, Building2, CheckCircle2, ClipboardCopy, Clock3, Eye,
  Fingerprint, KeyRound, Laptop2, LockKeyhole, MailCheck, MoreHorizontal, Plus, RefreshCcw,
  Search, ShieldAlert, ShieldCheck, Smartphone, UserCog, UserRoundCheck, UsersRound, X,
} from 'lucide-react'
import OperatorOverlayPortal from '../OperatorOverlayPortal'
import type {
  TenantAccessAccountRecord,
  TenantAccessSnapshot,
  TenantRoleTemplateRecord,
} from '@/types/angelcare360/operator/tenant-access'
import styles from './TenantIdentityAccessCommand.module.css'

type View = 'administrators' | 'invitations' | 'security' | 'support' | 'audit'
type Portal =
  | { kind: 'account'; record?: TenantAccessAccountRecord }
  | { kind: 'detail'; record: TenantAccessAccountRecord }
  | { kind: 'status'; record: TenantAccessAccountRecord; status: string }
  | { kind: 'transfer'; record: TenantAccessAccountRecord }
  | { kind: 'support' }
  | null

type Props = {
  clientId?: string
  tenantId?: string
  compact?: boolean
  title?: string
}

const EMPTY: TenantAccessSnapshot = {
  accounts: [], invitations: [], scopes: [], events: [], roleTemplates: [], permissionCatalog: [], supportSessions: [], ownerTransfers: [], clients: [], tenants: [], schools: [], campuses: [], sessions: [], entitlementSnapshots: [], entitlementItems: [], activeSessionCounts: {},
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon', invitation_pending: 'Invitation à préparer', invited: 'Invité', activation_pending: 'Activation en attente', active: 'Actif', locked: 'Verrouillé', suspended: 'Suspendu', expired: 'Expiré', revoked: 'Révoqué',
}

export default function TenantIdentityAccessCommand({ clientId, tenantId, compact = false, title = 'Tenant Identity & Access Command' }: Props) {
  const [snapshot, setSnapshot] = useState<TenantAccessSnapshot>(EMPTY)
  const [view, setView] = useState<View>('administrators')
  const [portal, setPortal] = useState<Portal>(null)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)

  async function refresh() {
    const params = new URLSearchParams()
    if (clientId) params.set('clientId', clientId)
    if (tenantId) params.set('tenantId', tenantId)
    const response = await fetch(`/api/angelcare360/operator/tenant-access?${params.toString()}`, { cache: 'no-store' })
    const result = await response.json()
    if (!response.ok || !result.ok) throw new Error(result.error || 'Impossible de charger les administrateurs tenant.')
    setSnapshot(result.snapshot)
  }

  useEffect(() => { refresh().catch((error) => setMessage(error instanceof Error ? error.message : 'Chargement impossible.')) }, [clientId, tenantId])

  async function execute(operation: string, payload: Record<string, unknown>, close = true) {
    setBusy(true); setMessage(null); setGeneratedLink(null)
    try {
      const response = await fetch('/api/angelcare360/operator/tenant-access', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ operation, payload: { ...payload, origin: window.location.origin } }),
      })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || 'La commande d’accès a échoué.')
      if (result.activationUrl || result.resetUrl) setGeneratedLink(result.activationUrl || result.resetUrl)
      await refresh()
      setMessage(operation === 'invitation.send' && result.email?.ok === false ? 'Lien sécurisé généré. Email-OS indisponible : copiez le lien manuellement.' : 'Commande exécutée, auditée et synchronisée.')
      if (close && !result.activationUrl && !result.resetUrl) setPortal(null)
      return result
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Erreur Tenant Access.'
      setMessage(text)
      throw error
    } finally { setBusy(false) }
  }

  const accounts = useMemo(() => snapshot.accounts.filter((account) => {
    const tenant = snapshot.tenants.find((row) => String(row.id) === account.tenant_id)
    const client = snapshot.clients.find((row) => String(row.id) === account.client_id)
    return `${account.full_name} ${account.email} ${account.role_template} ${tenant?.tenant_slug || ''} ${client?.display_name || ''}`.toLowerCase().includes(query.toLowerCase())
  }), [snapshot.accounts, snapshot.tenants, snapshot.clients, query])

  const active = snapshot.accounts.filter((row) => row.status === 'active').length
  const pending = snapshot.accounts.filter((row) => ['draft','invited','activation_pending','invitation_pending'].includes(row.status)).length
  const exposed = snapshot.accounts.filter((row) => ['locked','suspended','expired'].includes(row.status)).length
  const withoutOwner = snapshot.tenants.filter((tenant) => !snapshot.accounts.some((account) => account.tenant_id === String(tenant.id) && account.is_primary_owner && account.status === 'active')).length
  const mfaRequired = snapshot.accounts.filter((row) => Boolean(row.security_policy?.require_mfa)).length
  const activeSessions = Object.values(snapshot.activeSessionCounts).reduce((sum, count) => sum + count, 0)
  const risks = buildRisks(snapshot)

  return <section className={`${styles.command} ${compact ? styles.compact : ''}`}>
    <header className={styles.header}>
      <div><span>AngelCare 360 · Identity, Administrator Access & Security Governance</span><h2>{title}</h2><p>Inviter, activer, gouverner, sécuriser et révoquer les administrateurs clients sans jamais connaître leur mot de passe. L’accès effectif combine rôle, périmètre, entitlements produit, état tenant et politique de sécurité.</p></div>
      <div className={styles.headerActions}><button type="button" onClick={() => refresh()} disabled={busy}><RefreshCcw size={16}/>Actualiser</button><button type="button" data-primary onClick={() => setPortal({ kind: 'account' })}><Plus size={17}/>Créer un administrateur</button></div>
    </header>

    {message ? <div className={/erreur|échoué|impossible|introuvable/i.test(message) ? styles.error : styles.success}>{message}</div> : null}
    {generatedLink ? <div className={styles.activationLink}><KeyRound size={17}/><span>{generatedLink}</span><button type="button" onClick={() => navigator.clipboard.writeText(generatedLink)}><ClipboardCopy size={15}/>Copier</button></div> : null}

    <div className={styles.signals}>
      <Signal label="Administrateurs actifs" value={String(active)} detail={`${snapshot.accounts.length} comptes gouvernés`} tone="good"/>
      <Signal label="Activation en attente" value={String(pending)} detail="invitations et brouillons" tone={pending ? 'warning' : 'good'}/>
      <Signal label="Tenants sans owner" value={String(withoutOwner)} detail="responsabilité obligatoire" tone={withoutOwner ? 'critical' : 'good'}/>
      <Signal label="Accès restreints" value={String(exposed)} detail="lock, suspension, expiration" tone={exposed ? 'warning' : 'good'}/>
      <Signal label="MFA obligatoire" value={String(mfaRequired)} detail="politiques renforcées" tone="neutral"/>
      <Signal label="Sessions actives" value={String(activeSessions)} detail="identités customer" tone="neutral"/>
    </div>

    <div className={styles.toolbar}>
      <nav className={styles.tabs} aria-label="Modes Tenant Access">
        {([['administrators','Administrateurs'],['invitations','Invitations'],['security','Sécurité & sessions'],['support','Support access'],['audit','Audit']] as Array<[View,string]>).map(([key,label]) => <button key={key} type="button" data-active={view === key} onClick={() => setView(key)}>{label}</button>)}
      </nav>
      <label className={styles.search}><Search size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, email, rôle ou tenant…"/></label>
    </div>

    <div className={styles.canvas}>
      <main className={styles.mainSurface}>
        {view === 'administrators' || view === 'security' ? <AdministratorRoster accounts={accounts} snapshot={snapshot} securityMode={view === 'security'} onOpen={(record) => setPortal({ kind: 'detail', record })} onEdit={(record) => setPortal({ kind: 'account', record })} onInvite={(record) => execute('invitation.send', { accessAccountId: record.id }, false)} busy={busy}/> : null}
        {view === 'invitations' ? <InvitationList snapshot={snapshot} onCancel={(id) => execute('invitation.cancel', { invitationId: id })}/> : null}
        {view === 'support' ? <SupportAccessList snapshot={snapshot} onCreate={() => setPortal({ kind: 'support' })} onApprove={(id) => execute('support-access.approve', { id }, false)} onLaunch={async (id) => { const result = await execute('support-access.launch', { id }, false) as { supportUrl?: string }; if (result.supportUrl) window.open(result.supportUrl, '_blank', 'noopener,noreferrer') }} onEnd={(id) => execute('support-access.end', { id })}/> : null}
        {view === 'audit' ? <AuditList snapshot={snapshot}/> : null}
      </main>
      <aside className={styles.rail}>
        <h3>Security intelligence</h3>
        <div className={styles.riskList}>{risks.slice(0, 5).map((risk) => <div key={risk} className={styles.riskItem}><AlertTriangle size={15}/><span>{risk}</span></div>)}{!risks.length ? <div className={styles.railCard}><CheckCircle2 size={18}/><strong>Couverture saine</strong><p>Aucune lacune prioritaire détectée dans la vue actuelle.</p></div> : null}</div>
        <div className={styles.railCard}><span>Doctrine mot de passe</span><strong>Privé par conception</strong><p>AngelCare déclenche invitation et reset. Le client définit son secret dans une page à usage unique; aucune colonne Operator ne stocke le mot de passe.</p></div>
        <div className={styles.railCard}><span>Effective access</span><strong>Rôle + scope + entitlement</strong><p>Un rôle ne peut jamais rendre accessible un module absent du package et de l’entitlement compilé.</p></div>
        <div className={styles.eventList}>{snapshot.events.slice(0, 8).map((event) => <div key={event.id} className={styles.event}><strong>{event.summary}</strong><small>{dateLabel(event.created_at)} · {human(event.event_type)}</small></div>)}</div>
      </aside>
    </div>

    {portal ? <TenantAccessPortal portal={portal} snapshot={snapshot} busy={busy} generatedLink={generatedLink} onClose={() => { setPortal(null); setGeneratedLink(null) }} onExecute={execute} onPortal={setPortal}/> : null}
  </section>
}

function AdministratorRoster({ accounts, snapshot, securityMode, onOpen, onEdit, onInvite, busy }: { accounts: TenantAccessAccountRecord[]; snapshot: TenantAccessSnapshot; securityMode: boolean; onOpen: (record: TenantAccessAccountRecord) => void; onEdit: (record: TenantAccessAccountRecord) => void; onInvite: (record: TenantAccessAccountRecord) => void; busy: boolean }) {
  return <><div className={styles.tableHead}><span>Identité</span><span>Tenant / client</span><span>Rôle & scope</span><span>État</span><span>Sécurité</span><span>Commandes</span></div>{accounts.map((account) => {
    const tenant = snapshot.tenants.find((row) => String(row.id) === account.tenant_id)
    const client = snapshot.clients.find((row) => String(row.id) === account.client_id)
    const sessions = account.app_user_id ? snapshot.activeSessionCounts[account.app_user_id] || 0 : 0
    return <article key={account.id} className={styles.row}>
      <div className={styles.identity}><span className={styles.avatar}>{initials(account.full_name)}</span><div><strong>{account.full_name}</strong><small>{account.email}{account.is_primary_owner ? ' · Tenant Owner' : ''}</small></div></div>
      <div className={styles.tenantCell}><strong>{String(tenant?.tenant_slug || 'Tenant non résolu')}</strong><small>{String(client?.display_name || client?.legal_name || 'Client')}</small></div>
      <div className={styles.tenantCell}><strong>{roleLabel(account.role_template, snapshot.roleTemplates)}</strong><small>{account.scope_mode} · {account.module_keys.length ? `${account.module_keys.length} module(s)` : 'modules selon entitlement'}</small></div>
      <span className={styles.status} data-status={account.status}>{STATUS_LABELS[account.status] || human(account.status)}</span>
      <div className={styles.securityFlags}><span>{Boolean(account.security_policy?.require_mfa) ? 'MFA requis' : 'MFA standard'}</span><span>{sessions} session(s)</span></div>
      <div className={styles.actions}><button type="button" title="Inspecter" onClick={() => onOpen(account)}><Eye size={15}/></button><button type="button" title="Modifier" onClick={() => onEdit(account)}><UserCog size={15}/></button>{!securityMode && !account.app_user_id ? <button type="button" title="Inviter" disabled={busy} onClick={() => onInvite(account)}><MailCheck size={15}/></button> : null}<button type="button" title="Plus" onClick={() => onOpen(account)}><MoreHorizontal size={15}/></button></div>
    </article>
  })}{!accounts.length ? <Empty title="Aucun administrateur" detail="Créez le premier Tenant Owner ou ajustez la recherche."/> : null}</>
}

function InvitationList({ snapshot, onCancel }: { snapshot: TenantAccessSnapshot; onCancel: (id: string) => void }) {
  const visible = snapshot.invitations.filter((invite) => snapshot.accounts.some((account) => account.id === invite.access_account_id))
  return <>{visible.map((invite) => { const account = snapshot.accounts.find((row) => row.id === invite.access_account_id); return <article key={invite.id} className={styles.row} style={{ gridTemplateColumns: '1.3fr 1fr 1fr 1fr .8fr' }}><div className={styles.identity}><span className={styles.avatar}><MailCheck size={17}/></span><div><strong>{account?.full_name || invite.email}</strong><small>{invite.email}</small></div></div><div className={styles.tenantCell}><strong>{human(invite.status)}</strong><small>{human(invite.delivery_status)}</small></div><div className={styles.tenantCell}><strong>Expire</strong><small>{dateLabel(invite.expires_at)}</small></div><span className={styles.status} data-status={invite.status}>{human(invite.status)}</span><div className={styles.actions}>{['invited','opened'].includes(invite.status) ? <button type="button" data-danger onClick={() => onCancel(invite.id)}>Annuler</button> : null}</div></article> })}{!visible.length ? <Empty title="Aucune invitation" detail="Les invitations actives et leur état de livraison apparaîtront ici."/> : null}</>
}

function SupportAccessList({ snapshot, onCreate, onApprove, onLaunch, onEnd }: { snapshot: TenantAccessSnapshot; onCreate: () => void; onApprove: (id: string) => void; onLaunch: (id: string) => void; onEnd: (id: string) => void }) {
  return <><div style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><span className={styles.eyebrow}>Controlled support access</span><h3 style={{ margin: '5px 0 0' }}>View as tenant sans mot de passe client</h3></div><button type="button" data-primary onClick={onCreate}><ShieldCheck size={16}/>Demander un accès support</button></div>{snapshot.supportSessions.map((session) => { const tenant = snapshot.tenants.find((row) => String(row.id) === session.tenant_id); return <article key={session.id} className={styles.row} style={{ gridTemplateColumns: '1.2fr .8fr .8fr .8fr 1fr' }}><div className={styles.tenantCell}><strong>{String(tenant?.tenant_slug || 'Tenant')}</strong><small>{session.reason}</small></div><span>{human(session.access_mode)}</span><span className={styles.status} data-status={session.status}>{human(session.status)}</span><span>{dateLabel(session.expires_at)}</span><div className={styles.actions}>{session.status === 'requested' ? <button type="button" onClick={() => onApprove(session.id)}><ShieldCheck size={14}/>Approuver</button> : null}{session.status === 'active' && new Date(session.expires_at).getTime() > Date.now() ? <button type="button" data-primary onClick={() => onLaunch(session.id)}><Eye size={14}/>Ouvrir</button> : null}{['active','approved','requested'].includes(session.status) ? <button type="button" data-danger onClick={() => onEnd(session.id)}>Terminer</button> : null}</div></article>})}{!snapshot.supportSessions.length ? <Empty title="Aucun accès support" detail="Les accès temporaires, leur justification et leur expiration seront tracés ici."/> : null}</>
}

function AuditList({ snapshot }: { snapshot: TenantAccessSnapshot }) {
  return <>{snapshot.events.map((event) => { const account = snapshot.accounts.find((row) => row.id === event.access_account_id); return <article key={event.id} className={styles.row} style={{ gridTemplateColumns: '1.2fr .8fr .8fr 1.2fr' }}><div className={styles.identity}><span className={styles.avatar}><Fingerprint size={17}/></span><div><strong>{event.summary}</strong><small>{account?.full_name || 'Événement tenant'}</small></div></div><span>{human(event.event_type)}</span><span className={styles.status}>{event.severity}</span><span>{dateLabel(event.created_at)}</span></article>})}{!snapshot.events.length ? <Empty title="Audit vide" detail="Toute invitation, activation, révocation, reset et session support sera historisée."/> : null}</>
}

function TenantAccessPortal({ portal, snapshot, busy, generatedLink, onClose, onExecute, onPortal }: { portal: NonNullable<Portal>; snapshot: TenantAccessSnapshot; busy: boolean; generatedLink: string | null; onClose: () => void; onExecute: (operation: string, payload: Record<string, unknown>, close?: boolean) => Promise<unknown>; onPortal: (portal: Portal) => void }) {
  return <OperatorOverlayPortal><div className={styles.portalBackdrop} role="dialog" aria-modal="true"><section className={styles.portal}>
    {portal.kind === 'account' ? <AccountEditor record={portal.record} snapshot={snapshot} busy={busy} onClose={onClose} onExecute={onExecute}/> : null}
    {portal.kind === 'detail' ? <AccountDetail record={portal.record} snapshot={snapshot} busy={busy} generatedLink={generatedLink} onClose={onClose} onExecute={onExecute} onPortal={onPortal}/> : null}
    {portal.kind === 'status' ? <StatusChamber record={portal.record} status={portal.status} busy={busy} onClose={onClose} onExecute={onExecute}/> : null}
    {portal.kind === 'transfer' ? <OwnerTransfer record={portal.record} snapshot={snapshot} busy={busy} onClose={onClose} onExecute={onExecute}/> : null}
    {portal.kind === 'support' ? <SupportAccessPortal snapshot={snapshot} busy={busy} onClose={onClose} onExecute={onExecute}/> : null}
  </section></div></OperatorOverlayPortal>
}

function PortalHeader({ eyebrow, title, detail, onClose }: { eyebrow: string; title: string; detail: string; onClose: () => void }) { return <header className={styles.portalHeader}><div><span>{eyebrow}</span><h2>{title}</h2><p>{detail}</p></div><button type="button" onClick={onClose}><X size={18}/></button></header> }

function AccountEditor({ record, snapshot, busy, onClose, onExecute }: { record?: TenantAccessAccountRecord; snapshot: TenantAccessSnapshot; busy: boolean; onClose: () => void; onExecute: (operation: string, payload: Record<string, unknown>) => Promise<unknown> }) {
  const firstTenant = snapshot.tenants[0]
  const [clientId, setClientId] = useState(record?.client_id || String(firstTenant?.client_id || snapshot.clients[0]?.id || ''))
  const tenantChoices = snapshot.tenants.filter((row) => !clientId || String(row.client_id) === clientId)
  const [tenantId, setTenantId] = useState(record?.tenant_id || String(tenantChoices[0]?.id || ''))
  const [fullName, setFullName] = useState(record?.full_name || '')
  const [email, setEmail] = useState(record?.email || '')
  const [phone, setPhone] = useState(record?.phone || '')
  const [jobTitle, setJobTitle] = useState(record?.job_title || '')
  const initialRoleKey = record?.role_template || 'school_admin'
  const initialRole = snapshot.roleTemplates.find((row) => row.role_key === initialRoleKey)
  const [roleTemplate, setRoleTemplate] = useState(initialRoleKey)
  const [scopeMode, setScopeMode] = useState(record?.scope_mode || 'tenant')
  const selectedTenant = snapshot.tenants.find((row) => String(row.id) === tenantId)
  const schoolId = record?.school_id || String(selectedTenant?.school_id || '')
  const campusChoices = snapshot.campuses.filter((row) => !schoolId || String(row.school_id) === schoolId)
  const [campusId, setCampusId] = useState(record?.campus_id || '')
  const [isPrimaryOwner, setPrimaryOwner] = useState(Boolean(record?.is_primary_owner))
  const [requireMfa, setRequireMfa] = useState(record ? Boolean(record.security_policy?.require_mfa) : Boolean(initialRole?.require_mfa))
  const [forcePasswordChange, setForcePasswordChange] = useState(record ? Boolean(record.security_policy?.force_password_change) : true)
  const [sessionDurationHours, setSessionDuration] = useState(String(record?.security_policy?.session_duration_hours || 12))
  const [allowedEmailDomains, setAllowedEmailDomains] = useState<string>((Array.isArray(record?.security_policy?.allowed_email_domains) ? record?.security_policy?.allowed_email_domains : []).join(', '))
  const [accessStartsAt, setAccessStartsAt] = useState(record?.access_starts_at?.slice(0, 16) || '')
  const [accessExpiresAt, setAccessExpiresAt] = useState(record?.access_expires_at?.slice(0, 16) || '')
  const [moduleKeys, setModuleKeys] = useState<string[]>(record ? record.module_keys || [] : initialRole?.module_keys || [])
  const [explicitPermissions, setExplicitPermissions] = useState<string[]>(record ? record.explicit_permissions || [] : initialRole?.permissions || [])
  const [deniedPermissions, setDeniedPermissions] = useState<string[]>(record ? record.denied_permissions || [] : initialRole?.denied_permissions || [])
  const moduleOptions = [...new Set(snapshot.entitlementItems.map((row) => String(row.module_key || '')).filter(Boolean))].sort()
  const role = snapshot.roleTemplates.find((row) => row.role_key === roleTemplate)
  const toggle = (key: string) => setModuleKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])
  const togglePermission = (key: string, denied = false) => { const setter = denied ? setDeniedPermissions : setExplicitPermissions; setter((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]) }
  const applyRoleTemplate = (key: string) => { const template = snapshot.roleTemplates.find((item) => item.role_key === key); setRoleTemplate(key); setExplicitPermissions(template?.permissions || []); setDeniedPermissions(template?.denied_permissions || []); if (template?.module_keys?.length) setModuleKeys(template.module_keys); if (template?.require_mfa) setRequireMfa(true) }
  return <><PortalHeader eyebrow="Administrator Provisioning Studio" title={record ? `Modifier ${record.full_name}` : 'Créer un administrateur tenant'} detail="Définir identité, rôle, périmètre, modules et politique de sécurité avant invitation." onClose={onClose}/><div className={styles.portalBody}>
    <section className={styles.section}><header><UserRoundCheck size={19}/><div><h3>Identité professionnelle</h3><span>Aucun mot de passe n’est demandé ou visible.</span></div></header><div className={styles.formGrid}><label><span>Client *</span><select value={clientId} onChange={(event) => { setClientId(event.target.value); const tenant = snapshot.tenants.find((row) => String(row.client_id) === event.target.value); setTenantId(String(tenant?.id || '')) }} disabled={Boolean(record)}><option value="">Sélectionner…</option>{snapshot.clients.map((client) => <option key={String(client.id)} value={String(client.id)}>{String(client.display_name || client.legal_name || 'Client')}</option>)}</select></label><label><span>Tenant *</span><select value={tenantId} onChange={(event) => setTenantId(event.target.value)} disabled={Boolean(record)}><option value="">Sélectionner…</option>{tenantChoices.map((tenant) => <option key={String(tenant.id)} value={String(tenant.id)}>{String(tenant.tenant_slug || 'Tenant')}</option>)}</select></label><label><span>Nom complet *</span><input value={fullName} onChange={(event) => setFullName(event.target.value)}/></label><label><span>Email professionnel *</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)}/></label><label><span>Téléphone</span><input value={phone || ''} onChange={(event) => setPhone(event.target.value)}/></label><label><span>Fonction</span><input value={jobTitle || ''} onChange={(event) => setJobTitle(event.target.value)}/></label></div></section>
    <section className={styles.section}><header><UsersRound size={19}/><div><h3>Rôle et autorité</h3><span>Le rôle donne les permissions; le package limite les modules réellement accessibles.</span></div></header><div className={styles.formGrid}><label><span>Modèle de rôle *</span><select value={roleTemplate} onChange={(event) => applyRoleTemplate(event.target.value)}>{snapshot.roleTemplates.map((item) => <option key={item.id} value={item.role_key}>{item.name}</option>)}</select></label><label><span>Périmètre</span><select value={scopeMode} onChange={(event) => setScopeMode(event.target.value)}><option value="tenant">Tenant complet</option><option value="institution">Institution sélectionnée</option><option value="campus">Campus sélectionné</option><option value="customer_group">Groupe client</option><option value="custom">Personnalisé</option></select></label>{scopeMode === 'institution' ? <label><span>Institution</span><select value={schoolId} disabled><option value={schoolId}>{String(snapshot.schools.find((row) => String(row.id) === schoolId)?.name || selectedTenant?.tenant_slug || 'Institution liée au tenant')}</option></select></label> : null}{scopeMode === 'campus' ? <label><span>Campus *</span><select value={campusId || ''} onChange={(event) => setCampusId(event.target.value)}><option value="">Sélectionner…</option>{campusChoices.map((campus) => <option key={String(campus.id)} value={String(campus.id)}>{String(campus.name || campus.campus_code)}</option>)}</select></label> : null}</div><div className={styles.notice}>{role?.description || 'Rôle personnalisé'} · {role?.permissions.length || 0} permission(s) standard.</div><div className={styles.choiceGrid}><label className={styles.choice}><input type="checkbox" checked={isPrimaryOwner} onChange={(event) => setPrimaryOwner(event.target.checked)}/><span><strong>Tenant Owner principal</strong><small>Responsabilité, gouvernance et continuité du tenant.</small></span></label></div></section>
    <section className={styles.section}><header><BadgeCheck size={19}/><div><h3>Modules autorisés</h3><span>Laissez vide pour suivre automatiquement l’entitlement du tenant.</span></div></header><div className={styles.choiceGrid}>{moduleOptions.map((key) => <label key={key} className={styles.choice}><input type="checkbox" checked={moduleKeys.includes(key)} onChange={() => toggle(key)}/><span><strong>{human(key)}</strong><small>Disponible seulement si contracté et compilé.</small></span></label>)}{!moduleOptions.length ? <div className={styles.notice}>Aucun module compilé détecté. L’accès suivra l’entitlement après compilation.</div> : null}</div></section>
    {roleTemplate === 'custom' ? <section className={styles.section}><header><Fingerprint size={19}/><div><h3>Permission Engineering</h3><span>Composer un rôle spécifique à partir du catalogue autorisé, sans saisir de clés techniques.</span></div></header><div className={styles.permissionMatrix}>{snapshot.permissionCatalog.map((permission) => <label key={permission.permission_key} className={styles.permissionChoice} data-denied={deniedPermissions.includes(permission.permission_key)}><input type="checkbox" checked={explicitPermissions.includes(permission.permission_key)} onChange={() => togglePermission(permission.permission_key)}/><span><strong>{permission.label}</strong><small>{human(permission.domain_key)} · {human(permission.action_key)}{permission.risk_level ? ` · ${human(permission.risk_level)}` : ''}</small></span><button type="button" onClick={(event) => { event.preventDefault(); togglePermission(permission.permission_key, true) }}>{deniedPermissions.includes(permission.permission_key) ? 'Exclu' : 'Exclure'}</button></label>)}</div></section> : null}
    <section className={styles.section}><header><ShieldCheck size={19}/><div><h3>Politique de sécurité</h3><span>Contrôles applicables dès l’activation.</span></div></header><div className={styles.choiceGrid}><label className={styles.choice}><input type="checkbox" checked={requireMfa} onChange={(event) => setRequireMfa(event.target.checked)}/><span><strong>Exiger MFA</strong><small>Renforce l’accès à ce compte.</small></span></label><label className={styles.choice}><input type="checkbox" checked={forcePasswordChange} onChange={(event) => setForcePasswordChange(event.target.checked)}/><span><strong>Secret privé initial</strong><small>L’utilisateur définit son mot de passe via invitation.</small></span></label></div><div className={styles.formGrid}><label><span>Durée session (heures)</span><input type="number" min="1" max="168" value={sessionDurationHours} onChange={(event) => setSessionDuration(event.target.value)}/></label><label><span>Domaines email autorisés</span><input value={allowedEmailDomains} onChange={(event) => setAllowedEmailDomains(event.target.value)} placeholder="ecole.ma, groupe.ma"/></label><label><span>Début d’accès</span><input type="datetime-local" value={accessStartsAt} onChange={(event) => setAccessStartsAt(event.target.value)}/></label><label><span>Expiration d’accès</span><input type="datetime-local" value={accessExpiresAt} onChange={(event) => setAccessExpiresAt(event.target.value)}/></label></div></section>
    <section className={styles.section}><header><Eye size={19}/><div><h3>Prévisualisation effective</h3><span>Ce que cette personne pourra réellement faire.</span></div></header><div className={styles.impact}><div><span>Rôle</span><strong>{role?.name || human(roleTemplate)}</strong></div><div><span>Scope</span><strong>{human(scopeMode)}</strong></div><div><span>Modules</span><strong>{moduleKeys.length ? `${moduleKeys.length} sélectionné(s)` : 'Selon entitlement'}</strong></div></div></section>
  </div><footer className={styles.portalFooter}><button type="button" onClick={onClose}>Annuler</button><button type="button" data-primary disabled={busy || !clientId || !tenantId || !fullName || !email} onClick={() => onExecute('account.upsert', { id: record?.id, clientId, tenantId, fullName, email, phone, jobTitle, roleTemplate, scopeMode, campusId: campusId || undefined, scopes: scopeMode === 'campus' && campusId ? [{ scopeType: 'campus', scopeId: campusId, scopeLabel: String(campusChoices.find((row) => String(row.id) === campusId)?.name || 'Campus'), accessLevel: roleTemplate === 'auditor' ? 'view' : 'manage' }] : scopeMode === 'institution' && schoolId ? [{ scopeType: 'institution', scopeId: schoolId, scopeLabel: String(snapshot.schools.find((row) => String(row.id) === schoolId)?.name || 'Institution'), accessLevel: roleTemplate === 'auditor' ? 'view' : 'manage' }] : undefined, isPrimaryOwner, requireMfa, forcePasswordChange, sessionDurationHours, allowedEmailDomains: allowedEmailDomains.split(',').map((value) => value.trim()).filter(Boolean), accessStartsAt: accessStartsAt || undefined, accessExpiresAt: accessExpiresAt || undefined, moduleKeys, explicitPermissions, deniedPermissions })}>{busy ? 'Enregistrement…' : 'Enregistrer la gouvernance'}</button></footer></>
}

function AccountDetail({ record, snapshot, busy, generatedLink, onClose, onExecute, onPortal }: { record: TenantAccessAccountRecord; snapshot: TenantAccessSnapshot; busy: boolean; generatedLink: string | null; onClose: () => void; onExecute: (operation: string, payload: Record<string, unknown>, close?: boolean) => Promise<unknown>; onPortal: (portal: Portal) => void }) {
  const tenant = snapshot.tenants.find((row) => String(row.id) === record.tenant_id)
  const client = snapshot.clients.find((row) => String(row.id) === record.client_id)
  const sessions = record.app_user_id ? snapshot.activeSessionCounts[record.app_user_id] || 0 : 0
  const events = snapshot.events.filter((row) => row.access_account_id === record.id).slice(0, 12)
  return <><PortalHeader eyebrow="Tenant Administrator Command" title={record.full_name} detail={`${record.email} · ${String(client?.display_name || 'Client')} · ${String(tenant?.tenant_slug || 'Tenant')}`} onClose={onClose}/><div className={styles.portalBody}>
    {generatedLink ? <div className={styles.activationLink}><KeyRound size={17}/><span>{generatedLink}</span><button type="button" onClick={() => navigator.clipboard.writeText(generatedLink)}><ClipboardCopy size={15}/>Copier</button></div> : null}
    <section className={styles.section}><header><Fingerprint size={19}/><div><h3>Identité et accès effectif</h3><span>État réel du compte, périmètre et sécurité.</span></div></header><div className={styles.detailGrid}><div><span>Statut</span><strong>{STATUS_LABELS[record.status] || human(record.status)}</strong></div><div><span>Rôle</span><strong>{roleLabel(record.role_template, snapshot.roleTemplates)}</strong></div><div><span>Tenant Owner</span><strong>{record.is_primary_owner ? 'Oui' : 'Non'}</strong></div><div><span>Sessions actives</span><strong>{sessions}</strong></div><div><span>MFA</span><strong>{Boolean(record.security_policy?.require_mfa) ? record.mfa_enrolled_at ? 'Enrôlé & obligatoire' : 'Enrôlement requis' : 'Standard'}</strong></div><div><span>Activation</span><strong>{record.activated_at ? dateLabel(record.activated_at) : 'En attente'}</strong></div></div></section>
    <section className={styles.section}><header><LockKeyhole size={19}/><div><h3>Commandes sécurité</h3><span>Aucune commande ne révèle ou ne remplace silencieusement le mot de passe.</span></div></header><div className={styles.detailActions}><button type="button" onClick={() => onPortal({ kind: 'account', record })}><UserCog size={15}/>Modifier rôle & scope</button>{!record.app_user_id || (Boolean(record.security_policy?.require_mfa) && !record.mfa_enrolled_at) ? <button type="button" data-primary disabled={busy} onClick={() => onExecute('invitation.send', { accessAccountId: record.id }, false)}><MailCheck size={15}/>{record.app_user_id ? 'Configurer MFA' : 'Envoyer invitation'}</button> : <><button type="button" disabled={busy} onClick={() => onExecute('password.reset', { accessAccountId: record.id }, false)}><KeyRound size={15}/>Reset sécurisé</button><button type="button" disabled={busy || !sessions} onClick={() => onExecute('sessions.revoke', { accessAccountId: record.id, reason: 'Révocation opérateur depuis Tenant Access Command' }, false)}><Laptop2 size={15}/>Révoquer sessions</button></>}{record.status === 'active' ? <><button type="button" onClick={() => onPortal({ kind: 'status', record, status: 'locked' })}><LockKeyhole size={15}/>Verrouiller</button><button type="button" onClick={() => onPortal({ kind: 'status', record, status: 'suspended' })}><ShieldAlert size={15}/>Suspendre</button></> : <button type="button" onClick={() => onPortal({ kind: 'status', record, status: 'active' })}><UserRoundCheck size={15}/>Restaurer</button>}{record.is_primary_owner ? <button type="button" onClick={() => onPortal({ kind: 'transfer', record })}><ArrowRight size={15}/>Transférer ownership</button> : null}<button type="button" data-danger onClick={() => onPortal({ kind: 'status', record, status: 'revoked' })}>Révoquer définitivement</button></div></section>
    <section className={styles.section}><header><Laptop2 size={19}/><div><h3>Appareils et sessions actives</h3><span>Vue sécurité sans exposer le jeton de session.</span></div></header><div className={styles.sessionList}>{snapshot.sessions.filter((session) => session.user_id === record.app_user_id).map((session, index) => <div key={`${session.user_id}-${session.created_at || index}`}><Laptop2 size={16}/><span><strong>{session.device_label || (session.user_agent ? String(session.user_agent).slice(0, 54) : 'Appareil non identifié')}</strong><small>{session.ip_address || 'IP non enregistrée'} · dernière activité {dateLabel(session.last_seen_at || session.created_at)}</small></span><em>{session.mfa_verified_at ? 'MFA vérifié' : 'Session standard'}</em></div>)}{!snapshot.sessions.some((session) => session.user_id === record.app_user_id) ? <div className={styles.notice}>Aucune session active.</div> : null}</div></section>
    <section className={styles.section}><header><Clock3 size={19}/><div><h3>Chronologie sécurité</h3><span>Invitation, activation, sessions, rôle, reset et restrictions.</span></div></header><div className={styles.eventList}>{events.map((event) => <div key={event.id} className={styles.event}><strong>{event.summary}</strong><small>{dateLabel(event.created_at)} · {human(event.event_type)}</small></div>)}{!events.length ? <div className={styles.notice}>Aucun événement enregistré.</div> : null}</div></section>
  </div><footer className={styles.portalFooter}><button type="button" onClick={onClose}>Fermer</button></footer></>
}

function StatusChamber({ record, status, busy, onClose, onExecute }: { record: TenantAccessAccountRecord; status: string; busy: boolean; onClose: () => void; onExecute: (operation: string, payload: Record<string, unknown>) => Promise<unknown> }) {
  const [reason, setReason] = useState('')
  return <><PortalHeader eyebrow="Security Decision Chamber" title={`${human(status)} · ${record.full_name}`} detail="Cette action est auditée et peut révoquer immédiatement les sessions actives." onClose={onClose}/><div className={styles.portalBody}><section className={styles.section}><div className={styles.impact}><div><span>État actuel</span><strong>{human(record.status)}</strong></div><div><span>État demandé</span><strong>{human(status)}</strong></div><div><span>Sessions</span><strong>{['locked','suspended','expired','revoked'].includes(status) ? 'Révoquées' : 'Autorisation restaurée'}</strong></div></div></section><section className={styles.section}><div className={styles.formGrid}><label data-wide="true"><span>Justification obligatoire</span><textarea rows={6} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motif, impact client, décision et suivi requis…"/></label></div></section></div><footer className={styles.portalFooter}><button type="button" onClick={onClose}>Annuler</button><button type="button" data-danger={status !== 'active'} data-primary={status === 'active'} disabled={busy || !reason.trim()} onClick={() => onExecute('account.status', { id: record.id, status, reason })}>{busy ? 'Exécution…' : `Confirmer ${human(status)}`}</button></footer></>
}

function OwnerTransfer({ record, snapshot, busy, onClose, onExecute }: { record: TenantAccessAccountRecord; snapshot: TenantAccessSnapshot; busy: boolean; onClose: () => void; onExecute: (operation: string, payload: Record<string, unknown>) => Promise<unknown> }) {
  const candidates = snapshot.accounts.filter((row) => row.tenant_id === record.tenant_id && row.id !== record.id && row.status === 'active')
  const [target, setTarget] = useState(candidates[0]?.id || '')
  const [reason, setReason] = useState('')
  return <><PortalHeader eyebrow="Tenant Ownership Continuity" title="Transférer la responsabilité Tenant Owner" detail="Le nouveau owner devient l’autorité principale avant toute révocation de l’owner actuel." onClose={onClose}/><div className={styles.portalBody}><section className={styles.section}><div className={styles.formGrid}><label><span>Owner actuel</span><input value={record.full_name} disabled/></label><label><span>Nouveau Tenant Owner *</span><select value={target} onChange={(event) => setTarget(event.target.value)}><option value="">Sélectionner…</option>{candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.full_name} · {candidate.email}</option>)}</select></label><label data-wide="true"><span>Motif et consignes de handover *</span><textarea rows={6} value={reason} onChange={(event) => setReason(event.target.value)}/></label></div></section>{!candidates.length ? <div className={styles.error}>Créez et activez d’abord un administrateur remplaçant dans ce tenant.</div> : null}</div><footer className={styles.portalFooter}><button type="button" onClick={onClose}>Annuler</button><button type="button" data-primary disabled={busy || !target || !reason} onClick={() => onExecute('ownership.transfer', { tenantId: record.tenant_id, fromAccessAccountId: record.id, toAccessAccountId: target, reason })}>Transférer avec audit</button></footer></>
}

function SupportAccessPortal({ snapshot, busy, onClose, onExecute }: { snapshot: TenantAccessSnapshot; busy: boolean; onClose: () => void; onExecute: (operation: string, payload: Record<string, unknown>) => Promise<unknown> }) {
  const [clientId, setClientId] = useState(String(snapshot.clients[0]?.id || ''))
  const tenants = snapshot.tenants.filter((row) => !clientId || String(row.client_id) === clientId)
  const [tenantId, setTenantId] = useState(String(tenants[0]?.id || ''))
  const [accessMode, setAccessMode] = useState('read_only')
  const [durationHours, setDuration] = useState('1')
  const [reason, setReason] = useState('')
  return <><PortalHeader eyebrow="Controlled Support Access" title="View as tenant sans usurper le mot de passe" detail="Accès temporaire, visible, limité, motivé et automatiquement expiré." onClose={onClose}/><div className={styles.portalBody}><section className={styles.section}><div className={styles.formGrid}><label><span>Client *</span><select value={clientId} onChange={(event) => { setClientId(event.target.value); const tenant = snapshot.tenants.find((row) => String(row.client_id) === event.target.value); setTenantId(String(tenant?.id || '')) }}>{snapshot.clients.map((client) => <option key={String(client.id)} value={String(client.id)}>{String(client.display_name || client.legal_name)}</option>)}</select></label><label><span>Tenant *</span><select value={tenantId} onChange={(event) => setTenantId(event.target.value)}>{tenants.map((tenant) => <option key={String(tenant.id)} value={String(tenant.id)}>{String(tenant.tenant_slug)}</option>)}</select></label><label><span>Mode</span><select value={accessMode} onChange={(event) => setAccessMode(event.target.value)}><option value="read_only">Lecture seule immédiate</option><option value="guided_support">Support guidé — approbation</option><option value="authorized_operate">Opération autorisée — approbation forte</option></select></label><label><span>Durée</span><select value={durationHours} onChange={(event) => setDuration(event.target.value)}><option value="1">1 heure</option><option value="4">4 heures</option><option value="8">8 heures</option><option value="24">24 heures maximum</option></select></label><label data-wide="true"><span>Justification *</span><textarea rows={6} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ticket, incident, objectif, données consultées et résultat attendu…"/></label></div></section><div className={styles.notice}>Le support n’utilise jamais le compte ni le mot de passe du client. Une bannière d’accès support et un audit complet doivent accompagner la session côté customer runtime.</div></div><footer className={styles.portalFooter}><button type="button" onClick={onClose}>Annuler</button><button type="button" data-primary disabled={busy || !clientId || !tenantId || !reason} onClick={() => onExecute('support-access.request', { clientId, tenantId, accessMode, durationHours, reason })}>Créer la session gouvernée</button></footer></>
}

function Signal({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) { return <div className={styles.signal} data-tone={tone}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div> }
function Empty({ title, detail }: { title: string; detail: string }) { return <div className={styles.empty}><UsersRound size={22}/><strong>{title}</strong><span>{detail}</span></div> }
function roleLabel(key: string, roles: TenantRoleTemplateRecord[]) { return roles.find((role) => role.role_key === key)?.name || human(key) }
function dateLabel(value: unknown) { if (!value) return '—'; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('fr-FR') }
function human(value: string) { return String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }
function initials(value: string) { return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'AC' }
function buildRisks(snapshot: TenantAccessSnapshot) {
  const risks: string[] = []
  for (const tenant of snapshot.tenants) {
    const tenantId = String(tenant.id)
    const accounts = snapshot.accounts.filter((row) => row.tenant_id === tenantId)
    if (!accounts.some((row) => row.is_primary_owner && row.status === 'active')) risks.push(`${String(tenant.tenant_slug || 'Tenant')} n’a aucun Tenant Owner actif.`)
    if (!accounts.length) risks.push(`${String(tenant.tenant_slug || 'Tenant')} ne possède aucun administrateur provisionné.`)
  }
  for (const account of snapshot.accounts) {
    if (account.status === 'active' && !account.app_user_id) risks.push(`${account.full_name} est marqué actif sans identité applicative liée.`)
    if (account.access_expires_at && new Date(account.access_expires_at).getTime() < Date.now() && account.status === 'active') risks.push(`${account.full_name} a dépassé sa date d’expiration.`)
    if (Boolean(account.security_policy?.require_mfa) && !account.mfa_enrolled_at && account.status === 'active') risks.push(`${account.full_name} est actif alors que MFA n’est pas enrôlé.`)
    if (account.role_template === 'tenant_owner' && !Boolean(account.security_policy?.require_mfa)) risks.push(`${account.full_name}, Tenant Owner, n’a pas MFA obligatoire.`)
  }
  return [...new Set(risks)]
}

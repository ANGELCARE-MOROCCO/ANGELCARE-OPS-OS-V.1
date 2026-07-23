'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useFormStatus } from 'react-dom'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  ExternalLink,
  Fingerprint,
  Gauge,
  History,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  Mail,
  Phone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react'
import SmartPermissionsPanel, {
  type PermissionSelectionSummary,
} from '@/app/(protected)/users/_components/SmartPermissionsPanel'
import UserProfilePhotoField, {
  type UserProfilePhotoState,
} from '@/app/(protected)/users/_components/UserProfilePhotoField'
import styles from '@/app/(protected)/users/_components/UserIdentityStudio.module.css'

type RoleOption = { value: string; label: string; department: string }

type EditableUser = {
  id: string
  full_name: string | null
  username: string | null
  email: string | null
  phone: string | null
  department: string | null
  job_title: string | null
  role: string | null
  status: string | null
  language: string | null
  updated_at: string | null
}

type Props = {
  action: (formData: FormData) => void | Promise<void>
  user: EditableUser
  roles: RoleOption[]
  departments: string[]
  positions: string[]
  defaultPermissions: string[]
  roleTemplates: Record<string, string[]>
  existingPhotoUrl: string | null
}

type Stage = 1 | 2 | 3 | 4 | 5

type FormErrors = Partial<Record<'fullName' | 'email' | 'phone' | 'username' | 'department' | 'jobTitle' | 'role' | 'catalog' | 'photo', string>>

const stages: Array<{ id: Stage; title: string; subtitle: string }> = [
  { id: 1, title: 'Identité', subtitle: 'Profil & organisation' },
  { id: 2, title: 'Compte', subtitle: 'Statut & rôle' },
  { id: 3, title: 'Permissions', subtitle: 'Accès & dashboard' },
  { id: 4, title: 'Opérations', subtitle: 'Dossiers liés' },
  { id: 5, title: 'Validation', subtitle: 'Contrôle des changements' },
]

const emptyAccessSummary: PermissionSelectionSummary = {
  catalogState: 'loading', selectedCount: 0, selectedKeys: [], selectedModules: 0,
  selectedRoutes: 0, selectedLegacy: 0, selectedRisk: 0, catalogModules: 0, catalogPermissions: 0,
}

const emptyPhotoState: UserProfilePhotoState = {
  hasPhoto: false, changed: false, removed: false, fileName: null, error: null, previewUrl: null,
}

function initials(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'AC'
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={styles.primaryButton} disabled={disabled || pending}>
      {pending ? <RefreshCw size={17} className="spin" /> : <ShieldCheck size={17} />}
      {pending ? 'Application en cours…' : 'Valider et appliquer les changements'}
    </button>
  )
}

export default function UserEditGovernanceStudio({ action, user, roles, departments, positions, defaultPermissions, roleTemplates, existingPhotoUrl }: Props) {
  const formRef = useRef<HTMLFormElement | null>(null)
  const [activeStage, setActiveStage] = useState<Stage>(1)
  const [fullName, setFullName] = useState(user.full_name || '')
  const [username, setUsername] = useState(user.username || '')
  const [email, setEmail] = useState(user.email || '')
  const [phone, setPhone] = useState(user.phone || '')
  const [department, setDepartment] = useState(user.department || '')
  const [jobTitle, setJobTitle] = useState(user.job_title || '')
  const [role, setRole] = useState(String(user.role || 'staff').toLowerCase())
  const [status, setStatus] = useState(user.status || 'active')
  const [language, setLanguage] = useState(user.language || 'fr')
  const [accessSummary, setAccessSummary] = useState<PermissionSelectionSummary>(() => ({
    ...emptyAccessSummary,
    selectedCount: defaultPermissions.length,
    selectedKeys: [...defaultPermissions],
  }))
  const [photoState, setPhotoState] = useState<UserProfilePhotoState>(emptyPhotoState)
  const [errors, setErrors] = useState<FormErrors>({})

  const originalPermissions = useMemo(() => [...new Set(defaultPermissions)].sort((a, b) => a.localeCompare(b)), [defaultPermissions])
  const originalPermissionSet = useMemo(() => new Set(originalPermissions), [originalPermissions])
  const currentPermissionSet = useMemo(() => new Set(accessSummary.selectedKeys), [accessSummary.selectedKeys])
  const addedPermissions = useMemo(() => accessSummary.selectedKeys.filter((permission) => !originalPermissionSet.has(permission)), [accessSummary.selectedKeys, originalPermissionSet])
  const removedPermissions = useMemo(() => originalPermissions.filter((permission) => !currentPermissionSet.has(permission)), [currentPermissionSet, originalPermissions])

  const fieldChanges = useMemo(() => [
    ['Nom complet', user.full_name || '', fullName],
    ['Nom utilisateur', user.username || '', username],
    ['Email', user.email || '', email],
    ['Téléphone', user.phone || '', phone],
    ['Département', user.department || '', department],
    ['Poste', user.job_title || '', jobTitle],
    ['Rôle', String(user.role || 'staff').toLowerCase(), role],
    ['Statut', user.status || 'active', status],
    ['Langue', user.language || 'fr', language],
  ].filter(([, before, after]) => before !== after), [department, email, fullName, jobTitle, language, phone, role, status, user, username])

  const selectedRole = useMemo(() => roles.find((item) => item.value === role), [role, roles])
  const totalChanges = fieldChanges.length + addedPermissions.length + removedPermissions.length + (photoState.changed ? 1 : 0)
  const hasPermissionChanges = addedPermissions.length > 0 || removedPermissions.length > 0
  const statusChanged = status !== (user.status || 'active')
  const roleChanged = role !== String(user.role || 'staff').toLowerCase()
  const dirty = totalChanges > 0

  const validationItems = useMemo(() => [
    { label: 'Nom complet', valid: Boolean(fullName.trim()) },
    { label: 'Email valide', valid: isEmail(email) },
    { label: 'Téléphone', valid: Boolean(phone.trim()) },
    { label: 'Nom d’utilisateur', valid: Boolean(username.trim()) },
    { label: 'Département', valid: Boolean(department.trim()) },
    { label: 'Poste', valid: Boolean(jobTitle.trim()) },
    { label: 'Rôle', valid: Boolean(role.trim()) },
    { label: 'Catalogue des accès prêt', valid: accessSummary.catalogState === 'ready' },
    { label: 'Photo conforme si modifiée', valid: !photoState.error },
  ], [accessSummary.catalogState, department, email, fullName, jobTitle, phone, photoState.error, role, username])

  const readiness = Math.round((validationItems.filter((item) => item.valid).length / validationItems.length) * 100)
  const allValid = validationItems.every((item) => item.valid)
  const stageValid: Record<Stage, boolean> = {
    1: validationItems.slice(0, 6).every((item) => item.valid),
    2: Boolean(role.trim()),
    3: accessSummary.catalogState === 'ready',
    4: true,
    5: allValid,
  }

  const handleAccessSummary = useCallback((summary: PermissionSelectionSummary) => setAccessSummary(summary), [])
  const handlePhotoState = useCallback((state: UserProfilePhotoState) => setPhotoState(state), [])

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function validateStage(stage: Stage) {
    const next: FormErrors = {}
    if (stage === 1 || stage === 5) {
      if (!fullName.trim()) next.fullName = 'Le nom complet est obligatoire.'
      if (!isEmail(email)) next.email = 'Saisissez une adresse email valide.'
      if (!phone.trim()) next.phone = 'Le numéro de téléphone est obligatoire.'
      if (!username.trim()) next.username = 'Le nom d’utilisateur est obligatoire.'
      if (!department.trim()) next.department = 'Le département est obligatoire.'
      if (!jobTitle.trim()) next.jobTitle = 'Le poste est obligatoire.'
      if (photoState.error) next.photo = photoState.error
    }
    if (stage === 2 || stage === 5) {
      if (!role.trim()) next.role = 'Le rôle est obligatoire.'
    }
    if (stage === 3 || stage === 5) {
      if (accessSummary.catalogState !== 'ready') next.catalog = 'Le catalogue d’accès doit être prêt.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function nextStage() {
    if (!validateStage(activeStage)) return
    setActiveStage((current) => Math.min(5, current + 1) as Stage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function previousStage() {
    setErrors({})
    setActiveStage((current) => Math.max(1, current - 1) as Stage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (validateStage(5)) return
    event.preventDefault()
    const nextStage: Stage = !stageValid[1] ? 1 : !stageValid[2] ? 2 : 3
    setActiveStage(nextStage)
    window.setTimeout(() => formRef.current?.querySelector<HTMLElement>('[data-invalid="true"]')?.focus(), 50)
  }

  function confirmNavigation(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!dirty) return
    if (!window.confirm('Des modifications non enregistrées seront perdues. Continuer ?')) event.preventDefault()
  }

  return (
    <div className={styles.studio}>
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <div className={styles.brandLockup}>
            <div className={styles.logoTile}><img src="/logo.png" alt="AngelCare" /></div>
            <div className={styles.brandCopy}><strong>ANGELCARE SANILA OS</strong><span>Identity Governance & Change Control</span></div>
          </div>
          <div className={status === 'active' ? styles.clearanceBadge : styles.liveBadge}>
            {status === 'active' ? <BadgeCheck size={16} /> : <ShieldAlert size={16} />}
            {status === 'active' ? 'Identity active' : `Account ${status}`}
          </div>
        </div>

        <div className={styles.heroBody}>
          <div>
            <div className={styles.heroKicker}><Fingerprint size={16} /> SANILA Identity Governance</div>
            <h1 className={styles.heroTitle}>Gouverner une identité opérationnelle en toute maîtrise.</h1>
            <p className={styles.heroSubtitle}>Toute modification peut transformer le dashboard, les données visibles et les responsabilités de {fullName || 'ce membre'}. Le changement est donc présenté, comparé et validé avant application.</p>
          </div>
          <div className={styles.heroMetrics}>
            <HeroMetric value={totalChanges} label="Pending changes" />
            <HeroMetric value={`${addedPermissions.length > 0 ? '+' : ''}${addedPermissions.length}/${removedPermissions.length}`} label="Access add / remove" />
            <HeroMetric value={accessSummary.selectedModules} label="Visible modules" />
            <HeroMetric value={`${readiness}%`} label="Governance readiness" />
          </div>
        </div>
      </section>

      <nav className={styles.stageNav} aria-label="Espaces de gouvernance utilisateur">
        {stages.map((stage) => (
          <button key={stage.id} type="button" className={styles.stageButton} data-active={activeStage === stage.id} data-complete={stageValid[stage.id]} onClick={() => { setErrors({}); setActiveStage(stage.id) }}>
            <span className={styles.stageNumber}>{stageValid[stage.id] ? <Check size={15} /> : stage.id}</span>
            <span className={styles.stageCopy}><strong>{stage.title}</strong><small>{stage.subtitle}</small></span>
          </button>
        ))}
      </nav>

      <form ref={formRef} action={action} onSubmit={handleSubmit} encType="multipart/form-data" className={styles.formLayout}>
        <main className={styles.mainColumn}>
          <section className={styles.stage} hidden={activeStage !== 1}>
            <StudioPanel icon={<UserRound size={24} />} eyebrow="01 · Identity & Organization" title="Identité officielle et positionnement" text="Modifiez uniquement les données réellement persistées par le dossier utilisateur. La photo est délivrée par la route privée existante et conserve la limite stricte de 1 Mo.">
              <UserProfilePhotoField displayName={fullName} existingImageUrl={existingPhotoUrl} allowRemove onStateChange={handlePhotoState} />
              {errors.photo ? <div className={styles.dangerBanner}><CircleAlert size={17} />{errors.photo}</div> : null}
              <div className={styles.fieldGrid3} style={{ marginTop: 20 }}>
                <TextField label="Nom complet" name="full_name" value={fullName} onChange={setFullName} error={errors.fullName} />
                <TextField label="Nom utilisateur" name="username" value={username} onChange={setUsername} error={errors.username} />
                <TextField label="Email" name="email" type="email" value={email} onChange={setEmail} error={errors.email} />
                <TextField label="Téléphone" name="phone" value={phone} onChange={setPhone} error={errors.phone} />
                <SelectField label="Département" name="department" value={department} onChange={setDepartment} options={departments} placeholder="Sélectionner" error={errors.department} />
                <SelectField label="Poste" name="job_title" value={jobTitle} onChange={setJobTitle} options={positions} placeholder="Sélectionner" error={errors.jobTitle} />
              </div>
            </StudioPanel>
          </section>

          <section className={styles.stage} hidden={activeStage !== 2}>
            <StudioPanel icon={<KeyRound size={24} />} eyebrow="02 · Account & Security" title="Statut, rôle et posture de sécurité" text="Le rôle donne un contexte organisationnel, tandis que le statut détermine si le compte peut opérer. Les permissions restent gouvernées séparément.">
              <div className={styles.fieldGrid3}>
                <SelectField label="Rôle SANILA" name="role" value={role} onChange={setRole} options={roles.map((item) => ({ value: item.value, label: `${item.label} · ${item.department}` }))} error={errors.role} />
                <SelectField label="Statut du compte" name="status" value={status} onChange={setStatus} options={[{ value: 'active', label: 'Actif · accès autorisé' }, { value: 'inactive', label: 'Inactif · accès suspendu' }]} />
                <SelectField label="Langue" name="language" value={language} onChange={setLanguage} options={[{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }, { value: 'ar', label: 'العربية' }]} />
              </div>

              {statusChanged && status !== 'active' ? <div className={styles.dangerBanner} style={{ marginTop: 17 }}><ShieldAlert size={18} />La désactivation suspendra l’accès de ce membre après validation. Ses permissions resteront enregistrées mais son compte ne sera plus actif.</div> : null}
              {roleChanged ? <div className={styles.warningBanner} style={{ marginTop: 12 }}><CircleAlert size={18} />Le rôle passera de <strong>{String(user.role || 'staff')}</strong> à <strong>{selectedRole?.label || role}</strong>. Aucun droit n’est ajouté automatiquement.</div> : null}
              {!statusChanged && !roleChanged ? <div className={styles.infoBanner} style={{ marginTop: 17 }}><ShieldCheck size={18} />Aucun changement de rôle ou de statut n’est actuellement en attente.</div> : null}
            </StudioPanel>
          </section>

          <section className={styles.stage} hidden={activeStage !== 3}>
            <div className={styles.panelSoft}>
              <div className={styles.sectionHeader}>
                <div><div className={styles.eyebrow}>03 · Permission & Workspace Visibility</div><h2 className={styles.sectionTitle}>Contrôler l’impact sur le dashboard et les pages visibles</h2><p className={styles.sectionText}>Les droits existants sont présélectionnés. Les permissions legacy restent identifiables et protégées jusqu’à leur retrait volontaire.</p></div>
                <div className={styles.sectionIcon}><ShieldCheck size={24} /></div>
              </div>
              {errors.catalog ? <div className={styles.dangerBanner}><CircleAlert size={17} />{errors.catalog}</div> : null}
              <div className={styles.changeGrid} style={{ marginBottom: 16 }}>
                <ChangeCard value={`+${addedPermissions.length}`} label="Permissions ajoutées" tone="positive" />
                <ChangeCard value={`-${removedPermissions.length}`} label="Permissions retirées" tone={removedPermissions.length ? 'danger' : 'neutral'} />
                <ChangeCard value={accessSummary.selectedCount} label="Droits après validation" tone="neutral" />
              </div>
              <SmartPermissionsPanel defaultPermissions={defaultPermissions} roleTemplates={roleTemplates} mode="edit" onSummaryChange={handleAccessSummary} />
            </div>
          </section>

          <section className={styles.stage} hidden={activeStage !== 4}>
            <StudioPanel icon={<BriefcaseBusiness size={24} />} eyebrow="04 · Operational Links" title="Accéder aux espaces opérationnels liés" text="Ces raccourcis ouvrent les systèmes déjà attachés au membre. Ils ne prétendent pas modifier des données non gérées par cette page.">
              <div className={styles.quickLinks}>
                <OperationalLink href={`/users/${user.id}`} icon={<UserRound size={18} />} title="Dossier complet du collaborateur" text="Identité, activité, sessions et informations consolidées" />
                <OperationalLink href={`/users/${user.id}/attendance`} icon={<ClipboardCheck size={18} />} title="Présence & ponctualité" text="Historique, pointages, anomalies et impression mensuelle" />
                <OperationalLink href={`/users/${user.id}/tasks`} icon={<ListChecks size={18} />} title="Tâches et exécution" text="Charge opérationnelle et missions affectées" />
                <OperationalLink href={`/users/${user.id}/lead-portfolio`} icon={<UsersRound size={18} />} title="Portefeuille commercial" text="Leads, responsabilités et suivi commercial du membre" />
              </div>
              <div className={styles.infoBanner} style={{ marginTop: 16 }}><Activity size={18} />Les changements de cette page concernent exclusivement l’identité `app_users`, son statut, son rôle, sa photo et ses permissions.</div>
            </StudioPanel>
          </section>

          <section className={styles.stage} hidden={activeStage !== 5}>
            <StudioPanel icon={<History size={24} />} eyebrow="05 · Change Control" title="Examiner le registre des modifications" text="Aucune modification n’est appliquée avant votre validation finale. Le résumé ci-dessous compare l’état actuel et l’état proposé.">
              {!dirty ? <div className={styles.infoBanner}><BadgeCheck size={18} />Aucun changement n’est actuellement en attente. Vous pouvez quitter la page sans enregistrer.</div> : allValid ? <div className={styles.successBanner}><CheckCircle2 size={18} />{totalChanges} changement(s) sont prêts à être appliqués et audités.</div> : <div className={styles.warningBanner}><CircleAlert size={18} />Certaines informations doivent être corrigées avant l’enregistrement.</div>}

              <div className={styles.changeGrid} style={{ marginTop: 16 }}>
                <ChangeCard value={fieldChanges.length} label="Champs modifiés" tone={fieldChanges.length ? 'warning' : 'neutral'} />
                <ChangeCard value={addedPermissions.length} label="Accès ajoutés" tone={addedPermissions.length ? 'positive' : 'neutral'} />
                <ChangeCard value={removedPermissions.length} label="Accès retirés" tone={removedPermissions.length ? 'danger' : 'neutral'} />
              </div>

              <div className={styles.reviewGrid} style={{ marginTop: 15 }}>
                <div className={styles.reviewCard}>
                  <h3>Changements d’identité et de compte</h3>
                  <div className={styles.reviewRows}>
                    {fieldChanges.map(([label, before, after]) => <div key={label} className={styles.reviewRow}><span>{label}</span><strong>{before || '—'} → {after || '—'}</strong></div>)}
                    {!fieldChanges.length ? <p className={styles.help}>Aucun champ d’identité ou de compte modifié.</p> : null}
                    {photoState.changed ? <div className={styles.reviewRow}><span>Photo</span><strong>{photoState.removed ? 'Suppression demandée' : 'Nouveau portrait sélectionné'}</strong></div> : null}
                  </div>
                </div>
                <div className={styles.reviewCard}>
                  <h3>Impact dashboard après validation</h3>
                  <div className={styles.reviewRows}>
                    <ReviewRow label="Permissions" value={accessSummary.selectedCount} />
                    <ReviewRow label="Modules visibles" value={accessSummary.selectedModules} />
                    <ReviewRow label="Routes visibles" value={accessSummary.selectedRoutes} />
                    <ReviewRow label="Legacy préservées" value={accessSummary.selectedLegacy} />
                    <ReviewRow label="Accès sensibles" value={accessSummary.selectedRisk} />
                  </div>
                </div>
                <div className={`${styles.reviewCard} ${styles.reviewCardFull}`}>
                  <h3>Détail des permissions modifiées</h3>
                  <div className={styles.pillWrap}>
                    {addedPermissions.map((permission) => <span key={`add-${permission}`} className={`${styles.pill} ${styles.pillPositive}`}>+ {permission}</span>)}
                    {removedPermissions.map((permission) => <span key={`remove-${permission}`} className={`${styles.pill} ${styles.pillDanger}`}>− {permission}</span>)}
                    {!hasPermissionChanges ? <span className={`${styles.pill} ${styles.pillNeutral}`}>Aucun changement de permission</span> : null}
                  </div>
                </div>
              </div>
            </StudioPanel>
          </section>

          <div className={styles.navigationRow}>
            <button type="button" className={styles.secondaryButton} onClick={previousStage} disabled={activeStage === 1}><ArrowLeft size={16} />Espace précédent</button>
            {activeStage < 5 ? <button type="button" className={styles.primaryButton} onClick={nextStage}>Continuer vers {stages[activeStage]?.title}<ArrowRight size={16} /></button> : <SubmitButton disabled={!allValid || !dirty} />}
          </div>
        </main>

        <aside className={styles.rail}>
          <div className={styles.railDark}>
            <p className={styles.railEyebrow}>Authenticated member passport</p>
            <div className={styles.passport}>
              <div className={styles.passportAvatar}>{!photoState.removed && (photoState.previewUrl || existingPhotoUrl) ? <img src={photoState.previewUrl || existingPhotoUrl || ''} alt={fullName} /> : initials(fullName)}</div>
              <div className={styles.passportCopy}><strong>{fullName || 'Collaborateur'}</strong><span>{jobTitle || 'Poste non défini'}</span><span>{email || 'Email non défini'}</span></div>
            </div>
            <div className={styles.progressWrap}>
              <div className={styles.progressRing} style={{ '--progress': `${readiness * 3.6}deg` } as React.CSSProperties}><strong>{readiness}%</strong></div>
              <div className={styles.progressCopy}><strong>Governance readiness</strong><span>{totalChanges} changement(s) en attente · catalogue {accessSummary.catalogState}</span></div>
            </div>
          </div>

          <RailCard title="Change ledger" icon={<History size={18} />}>
            <div className={styles.summaryList}>
              <SummaryRow label="Champs modifiés" value={fieldChanges.length} />
              <SummaryRow label="Permissions ajoutées" value={addedPermissions.length} />
              <SummaryRow label="Permissions retirées" value={removedPermissions.length} />
              <SummaryRow label="Photo" value={photoState.changed ? (photoState.removed ? 'Suppression' : 'Remplacement') : 'Inchangée'} />
              <SummaryRow label="Dernière mise à jour" value={user.updated_at ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(user.updated_at)) : 'Non disponible'} />
            </div>
          </RailCard>

          <RailCard title="Centre de validation" icon={<ShieldCheck size={18} />}>
            <div className={styles.validationList}>{validationItems.map((item) => <div key={item.label} className={styles.validationItem} data-valid={item.valid}><span className={styles.validationIcon}>{item.valid ? <Check size={14} /> : <CircleAlert size={14} />}</span><span>{item.label}</span></div>)}</div>
          </RailCard>

          <div className={styles.railActions}>
            {activeStage === 5 ? <SubmitButton disabled={!allValid || !dirty} /> : <button type="button" className={styles.primaryButton} onClick={nextStage}>Continuer<ChevronRight size={16} /></button>}
            <Link href={`/users/${user.id}`} className={styles.secondaryButton} onClick={confirmNavigation}>Retour au dossier membre</Link>
          </div>
        </aside>

        <div className={styles.mobileActionBar}>
          <button type="button" className={styles.secondaryButton} onClick={previousStage} disabled={activeStage === 1}><ArrowLeft size={16} />Retour</button>
          {activeStage === 5 ? <SubmitButton disabled={!allValid || !dirty} /> : <button type="button" className={styles.primaryButton} onClick={nextStage}>Continuer<ArrowRight size={16} /></button>}
        </div>
      </form>

      <style jsx global>{`.spin{animation:ac-spin .9s linear infinite}@keyframes ac-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function HeroMetric({ value, label }: { value: string | number; label: string }) {
  return <div className={styles.heroMetric}><strong>{value}</strong><span>{label}</span></div>
}

function StudioPanel({ icon, eyebrow, title, text, children }: { icon: React.ReactNode; eyebrow: string; title: string; text: string; children: React.ReactNode }) {
  return <div className={styles.panel}><div className={styles.sectionHeader}><div><div className={styles.eyebrow}>{eyebrow}</div><h2 className={styles.sectionTitle}>{title}</h2><p className={styles.sectionText}>{text}</p></div><div className={styles.sectionIcon}>{icon}</div></div>{children}</div>
}

function TextField({ label, name, value, onChange, type = 'text', error }: { label: string; name: string; value: string; onChange: (value: string) => void; type?: string; error?: string }) {
  return <label className={styles.field}><span className={styles.label}>{label} <b className={styles.required}>*</b></span><input name={name} type={type} value={value} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)} className={styles.input} data-invalid={Boolean(error)} />{error ? <p className={styles.errorText}>{error}</p> : null}</label>
}

function SelectField({ label, name, value, onChange, options, placeholder, error }: { label: string; name: string; value: string; onChange: (value: string) => void; options: Array<string | { value: string; label: string }>; placeholder?: string; error?: string }) {
  return <label className={styles.field}><span className={styles.label}>{label} <b className={styles.required}>*</b></span><select name={name} value={value} onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)} className={styles.select} data-invalid={Boolean(error)}>{placeholder ? <option value="">{placeholder}</option> : null}{options.map((option) => { const optionValue = typeof option === 'string' ? option : option.value; const optionLabel = typeof option === 'string' ? option : option.label; return <option key={optionValue} value={optionValue}>{optionLabel}</option> })}</select>{error ? <p className={styles.errorText}>{error}</p> : null}</label>
}

function ChangeCard({ value, label, tone }: { value: string | number; label: string; tone: 'positive' | 'warning' | 'danger' | 'neutral' }) {
  return <div className={styles.changeCard} data-tone={tone === 'neutral' ? undefined : tone}><strong>{value}</strong><span>{label}</span></div>
}

function OperationalLink({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) {
  return <Link href={href} className={styles.linkCard}><span className={styles.linkIcon}>{icon}</span><span className={styles.linkCopy}><strong>{title}</strong><span>{text}</span></span><ExternalLink size={15} color="#64748b" /></Link>
}

function RailCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className={styles.railCard}><div className={styles.railTitleRow}><h3 className={styles.railTitle}>{title}</h3><span style={{ color: '#2563eb' }}>{icon}</span></div>{children}</section>
}

function SummaryRow({ label, value }: { label: string; value: string | number }) {
  return <div className={styles.summaryRow}><span>{label}</span><strong>{value}</strong></div>
}

function ReviewRow({ label, value }: { label: string; value: string | number }) {
  return <div className={styles.reviewRow}><span>{label}</span><strong>{value}</strong></div>
}

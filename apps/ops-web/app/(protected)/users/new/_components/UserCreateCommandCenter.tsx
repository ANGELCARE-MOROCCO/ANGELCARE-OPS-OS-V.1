'use client'

import Link from 'next/link'
import { useCallback, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useFormStatus } from 'react-dom'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Eye,
  EyeOff,
  Fingerprint,
  Gauge,
  KeyRound,
  Languages,
  LockKeyhole,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import SmartPermissionsPanel, {
  type PermissionSelectionSummary,
} from '@/app/(protected)/users/_components/SmartPermissionsPanel'
import UserProfilePhotoField, {
  type UserProfilePhotoState,
} from '@/app/(protected)/users/_components/UserProfilePhotoField'
import styles from '@/app/(protected)/users/_components/UserIdentityStudio.module.css'

type RoleOption = {
  value: string
  label: string
  department: string
  defaultHome?: string | null
}

type Props = {
  action: (formData: FormData) => void | Promise<void>
  roles: RoleOption[]
  departments: string[]
  positions: string[]
  roleTemplates: Record<string, string[]>
}

type Stage = 1 | 2 | 3 | 4 | 5

type FormErrors = Partial<Record<'fullName' | 'email' | 'phone' | 'username' | 'department' | 'jobTitle' | 'role' | 'password' | 'catalog' | 'photo', string>>

const stages: Array<{ id: Stage; title: string; subtitle: string }> = [
  { id: 1, title: 'Identité', subtitle: 'Profil officiel' },
  { id: 2, title: 'Organisation', subtitle: 'Fonction & rattachement' },
  { id: 3, title: 'Compte', subtitle: 'Sécurité initiale' },
  { id: 4, title: 'Accès', subtitle: 'Modules & routes' },
  { id: 5, title: 'Validation', subtitle: 'Contrôle final' },
]

const emptyAccessSummary: PermissionSelectionSummary = {
  catalogState: 'loading',
  selectedCount: 0,
  selectedKeys: [],
  selectedModules: 0,
  selectedRoutes: 0,
  selectedLegacy: 0,
  selectedRisk: 0,
  catalogModules: 0,
  catalogPermissions: 0,
}

const emptyPhotoState: UserProfilePhotoState = {
  hasPhoto: false,
  changed: false,
  removed: false,
  fileName: null,
  error: null,
  previewUrl: null,
}

function initials(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'AC'
}

function createUsername(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 32)
}

function createPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const numbers = '23456789'
  const symbols = '!@#$%&*?'
  const all = upper + lower + numbers + symbols
  const randomIndex = (max: number) => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const value = new Uint32Array(1)
      crypto.getRandomValues(value)
      return value[0] % max
    }
    return Math.floor(Math.random() * max)
  }
  const pick = (source: string) => source[randomIndex(source.length)]
  const seed = [pick(upper), pick(lower), pick(numbers), pick(symbols)]
  while (seed.length < 14) seed.push(pick(all))
  for (let index = seed.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1)
    ;[seed[index], seed[swapIndex]] = [seed[swapIndex], seed[index]]
  }
  return seed.join('')
}

function passwordStrength(password: string) {
  let score = 0
  if (password.length >= 6) score += 1
  if (password.length >= 10) score += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1
  return score
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" id="create-user-submit" className={styles.primaryButton} disabled={disabled || pending}>
      {pending ? <RefreshCw size={17} className="spin" /> : <ShieldCheck size={17} />}
      {pending ? 'Provisionnement en cours…' : 'Provisionner l’identité SANILA'}
    </button>
  )
}

export default function UserCreateCommandCenter({ action, roles, departments, positions, roleTemplates }: Props) {
  const formRef = useRef<HTMLFormElement | null>(null)
  const [activeStage, setActiveStage] = useState<Stage>(1)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [language, setLanguage] = useState('fr')
  const [department, setDepartment] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [role, setRole] = useState('staff')
  const [status, setStatus] = useState('active')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [mustChangePassword, setMustChangePassword] = useState(true)
  const [accessSummary, setAccessSummary] = useState<PermissionSelectionSummary>(emptyAccessSummary)
  const [photoState, setPhotoState] = useState<UserProfilePhotoState>(emptyPhotoState)
  const [errors, setErrors] = useState<FormErrors>({})

  const selectedRole = useMemo(() => roles.find((item) => item.value === role), [role, roles])
  const strength = passwordStrength(password)

  const stageValid = useMemo(() => ({
    1: Boolean(fullName.trim() && isEmail(email) && phone.trim() && username.trim() && !photoState.error),
    2: Boolean(department.trim() && jobTitle.trim() && role.trim()),
    3: password.length >= 6,
    4: accessSummary.catalogState === 'ready',
    5: false,
  }), [accessSummary.catalogState, department, email, fullName, jobTitle, password.length, phone, photoState.error, role, username])

  const completionItems = useMemo(() => [
    { label: 'Nom complet', valid: Boolean(fullName.trim()) },
    { label: 'Email professionnel valide', valid: isEmail(email) },
    { label: 'Téléphone', valid: Boolean(phone.trim()) },
    { label: 'Nom d’utilisateur', valid: Boolean(username.trim()) },
    { label: 'Département', valid: Boolean(department.trim()) },
    { label: 'Poste', valid: Boolean(jobTitle.trim()) },
    { label: 'Rôle', valid: Boolean(role.trim()) },
    { label: 'Mot de passe temporaire', valid: password.length >= 6 },
    { label: 'Catalogue des accès prêt', valid: accessSummary.catalogState === 'ready' },
    { label: 'Photo conforme si renseignée', valid: !photoState.error },
  ], [accessSummary.catalogState, department, email, fullName, jobTitle, password.length, phone, photoState.error, role, username])

  const readiness = Math.round((completionItems.filter((item) => item.valid).length / completionItems.length) * 100)
  const allValid = completionItems.every((item) => item.valid)

  const handleAccessSummary = useCallback((summary: PermissionSelectionSummary) => setAccessSummary(summary), [])
  const handlePhotoState = useCallback((state: UserProfilePhotoState) => setPhotoState(state), [])

  function validateStage(stage: Stage) {
    const next: FormErrors = {}
    if (stage === 1 || stage === 5) {
      if (!fullName.trim()) next.fullName = 'Le nom complet est obligatoire.'
      if (!isEmail(email)) next.email = 'Saisissez une adresse email valide.'
      if (!phone.trim()) next.phone = 'Le numéro de téléphone est obligatoire.'
      if (!username.trim()) next.username = 'Le nom d’utilisateur est obligatoire.'
      if (photoState.error) next.photo = photoState.error
    }
    if (stage === 2 || stage === 5) {
      if (!department.trim()) next.department = 'Sélectionnez un département.'
      if (!jobTitle.trim()) next.jobTitle = 'Sélectionnez un poste.'
      if (!role.trim()) next.role = 'Sélectionnez un rôle.'
    }
    if (stage === 3 || stage === 5) {
      if (password.length < 6) next.password = 'Le mot de passe doit contenir au moins 6 caractères.'
    }
    if (stage === 4 || stage === 5) {
      if (accessSummary.catalogState !== 'ready') next.catalog = 'Le catalogue d’accès doit être prêt avant la création.'
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
    const nextStage: Stage = !stageValid[1] ? 1 : !stageValid[2] ? 2 : !stageValid[3] ? 3 : 4
    setActiveStage(nextStage)
    window.setTimeout(() => {
      const target = formRef.current?.querySelector<HTMLElement>('[data-invalid="true"]')
      target?.focus()
    }, 50)
  }

  function generateUsername() {
    setUsername(createUsername(fullName || email.split('@')[0] || ''))
    setErrors((current) => ({ ...current, username: undefined }))
  }

  function chooseRole(nextRole: string) {
    setRole(nextRole)
    const option = roles.find((item) => item.value === nextRole)
    if (!department && option?.department) setDepartment(option.department)
  }

  return (
    <div className={styles.studio}>
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <div className={styles.brandLockup}>
            <div className={styles.logoTile}><img src="/logo.png" alt="AngelCare" /></div>
            <div className={styles.brandCopy}>
              <strong>ANGELCARE SANILA OS</strong>
              <span>People, Identity & Access Command</span>
            </div>
          </div>
          <div className={styles.clearanceBadge}><BadgeCheck size={16} /> New member clearance</div>
        </div>

        <div className={styles.heroBody}>
          <div>
            <div className={styles.heroKicker}><Fingerprint size={16} /> SANILA Identity Provisioning</div>
            <h1 className={styles.heroTitle}>Émettre une identité officielle, prête à opérer.</h1>
            <p className={styles.heroSubtitle}>
              Créez un membre AngelCare, sécurisez son premier accès et gouvernez précisément les modules, familles et routes qui composeront son environnement SANILA.
            </p>
          </div>
          <div className={styles.heroMetrics}>
            <HeroMetric value={`${readiness}%`} label="Identity readiness" />
            <HeroMetric value={accessSummary.selectedCount} label="Permissions selected" />
            <HeroMetric value={accessSummary.selectedModules} label="Modules unlocked" />
            <HeroMetric value={accessSummary.catalogState === 'ready' ? 'LIVE' : accessSummary.catalogState.toUpperCase()} label="Access registry" />
          </div>
        </div>
      </section>

      <nav className={styles.stageNav} aria-label="Étapes de création utilisateur">
        {stages.map((stage) => (
          <button
            key={stage.id}
            type="button"
            className={styles.stageButton}
            data-active={activeStage === stage.id}
            data-complete={stageValid[stage.id]}
            onClick={() => { setErrors({}); setActiveStage(stage.id) }}
          >
            <span className={styles.stageNumber}>{stageValid[stage.id] ? <Check size={15} /> : stage.id}</span>
            <span className={styles.stageCopy}><strong>{stage.title}</strong><small>{stage.subtitle}</small></span>
          </button>
        ))}
      </nav>

      <form ref={formRef} action={action} onSubmit={handleSubmit} encType="multipart/form-data" className={styles.formLayout}>
        <main className={styles.mainColumn}>
          <section className={styles.stage} hidden={activeStage !== 1}>
            <StudioPanel icon={<UserRound size={24} />} eyebrow="01 · Identité officielle" title="Créer le profil membre" text="Les informations ci-dessous alimentent l’identité affichée dans SANILA, les recherches administratives et le passeport du dashboard.">
              <UserProfilePhotoField displayName={fullName || 'Nouveau collaborateur AngelCare'} onStateChange={handlePhotoState} />
              {errors.photo ? <div className={styles.dangerBanner}><CircleAlert size={17} />{errors.photo}</div> : null}
              <div className={styles.fieldGrid2} style={{ marginTop: 20 }}>
                <TextField label="Nom complet" name="full_name" value={fullName} onChange={setFullName} placeholder="Nom et prénom du collaborateur" error={errors.fullName} icon={<UserRound size={15} />} />
                <TextField label="Email professionnel" name="email" type="email" value={email} onChange={setEmail} placeholder="nom@angelcare.ma" error={errors.email} icon={<Mail size={15} />} />
                <TextField label="Téléphone" name="phone" value={phone} onChange={setPhone} placeholder="+212 6 00 00 00 00" error={errors.phone} icon={<Phone size={15} />} />
                <TextField label="Nom d’utilisateur" name="username" value={username} onChange={setUsername} placeholder="prenom.nom" error={errors.username} actionLabel="Générer" onAction={generateUsername} />
              </div>
              <div className={styles.infoBanner} style={{ marginTop: 16 }}><BadgeCheck size={18} />La photo reste facultative. Lorsqu’elle est ajoutée, elle doit être en JPG, PNG ou WebP et ne jamais dépasser 1 Mo.</div>
            </StudioPanel>
          </section>

          <section className={styles.stage} hidden={activeStage !== 2}>
            <StudioPanel icon={<Building2 size={24} />} eyebrow="02 · Structure AngelCare" title="Positionner le membre dans l’organisation" text="Le département, le poste et le rôle donnent le contexte de travail. Les autorisations réelles restent exclusivement déterminées à l’étape Accès.">
              <div className={styles.fieldGrid2}>
                <SelectField label="Département" name="department" value={department} onChange={setDepartment} options={departments} placeholder="Sélectionner le département" error={errors.department} />
                <SelectField label="Poste / fonction" name="job_title" value={jobTitle} onChange={setJobTitle} options={positions} placeholder="Sélectionner le poste" error={errors.jobTitle} />
                <SelectField label="Rôle SANILA" name="role" value={role} onChange={chooseRole} options={roles.map((item) => ({ value: item.value, label: `${item.label} · ${item.department}` }))} error={errors.role} />
                <SelectField label="Langue de l’interface" name="language" value={language} onChange={setLanguage} options={[{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }, { value: 'ar', label: 'العربية' }]} />
              </div>

              <div className={styles.roleCards}>
                <div className={styles.roleCard}><strong>Contexte sélectionné</strong><span>{selectedRole?.label || role} · {department || selectedRole?.department || 'Département à définir'} · {jobTitle || 'Poste à définir'}</span></div>
                <div className={styles.roleCard}><strong>Rôle ≠ permission automatique</strong><span>Le rôle structure l’identité. Chaque droit d’accès sera choisi explicitement dans le catalogue live.</span></div>
                <div className={styles.roleCard}><strong>Dashboard personnalisé</strong><span>Les modules affichés après connexion découleront uniquement des permissions effectivement sélectionnées.</span></div>
              </div>
            </StudioPanel>
          </section>

          <section className={styles.stage} hidden={activeStage !== 3}>
            <StudioPanel icon={<LockKeyhole size={24} />} eyebrow="03 · Compte & sécurité" title="Sécuriser le premier accès" text="Définissez l’état initial du compte et un mot de passe temporaire suffisamment robuste. Le collaborateur pourra être obligé de le remplacer lors de sa première connexion.">
              <div className={styles.fieldGrid2}>
                <label className={styles.field}>
                  <span className={styles.labelRow}><span className={styles.label}>Mot de passe temporaire <b className={styles.required}>*</b></span><span className={styles.optional}>Minimum 6 caractères</span></span>
                  <span className={styles.inputWrap}>
                    <input name="password" type={passwordVisible ? 'text' : 'password'} value={password} onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)} className={`${styles.input} ${styles.inputWithButton}`} data-invalid={Boolean(errors.password)} placeholder="Générer ou saisir un mot de passe" />
                    <button type="button" className={styles.inlineAction} onClick={() => setPasswordVisible((value) => !value)} aria-label={passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{passwordVisible ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  </span>
                  <div className={styles.passwordMeter}>
                    <div className={styles.passwordBars}>{[1,2,3,4].map((level) => <i key={level} data-on={strength >= level} />)}</div>
                    <span>{strength <= 1 ? 'Faible' : strength === 2 ? 'Acceptable' : strength === 3 ? 'Fort' : 'Très fort'}</span>
                  </div>
                  {errors.password ? <p className={styles.errorText}>{errors.password}</p> : null}
                </label>

                <div className={styles.field}>
                  <span className={styles.labelRow}><span className={styles.label}>Génération sécurisée</span><span className={styles.optional}>Recommandé</span></span>
                  <button type="button" className={styles.secondaryButton} onClick={() => setPassword(createPassword())}><KeyRound size={16} />Générer un mot de passe fort</button>
                  <p className={styles.help}>La valeur générée est temporaire. Transmettez-la uniquement par un canal interne sécurisé.</p>
                </div>

                <SelectField label="Statut initial du compte" name="status" value={status} onChange={setStatus} options={[{ value: 'active', label: 'Actif · accès autorisé' }, { value: 'inactive', label: 'Inactif · accès suspendu' }, { value: 'pending', label: 'En attente · préparation' }]} />
                <div className={styles.field}>
                  <span className={styles.label}>Langue de connexion</span>
                  <div className={styles.infoBanner}><Languages size={17} />{language === 'fr' ? 'Français' : language === 'en' ? 'English' : 'العربية'} sera utilisée comme préférence d’interface.</div>
                </div>
              </div>

              <div className={styles.toggleGrid}>
                <ToggleCard title="Changement obligatoire" text="Exiger un nouveau mot de passe dès la première connexion." value={mustChangePassword} onChange={setMustChangePassword} />
                <div className={styles.toggleCard}>
                  <div className={styles.toggleCopy}><strong>Message de bienvenue</strong><span>Aucune promesse d’envoi automatique n’est affichée : le workflow de création actuel n’exécute pas d’email.</span></div>
                  <ShieldCheck size={22} color="#1d4ed8" />
                </div>
              </div>
              <input type="hidden" name="must_change_password" value={mustChangePassword ? 'on' : 'off'} />
            </StudioPanel>
          </section>

          <section className={styles.stage} hidden={activeStage !== 4}>
            <div className={styles.panelSoft}>
              <div className={styles.sectionHeader}>
                <div><div className={styles.eyebrow}>04 · Access Governance Studio</div><h2 className={styles.sectionTitle}>Composer l’environnement opérationnel du membre</h2><p className={styles.sectionText}>Sélectionnez uniquement les modules, routes et actions nécessaires. Le catalogue live demeure bloquant tant qu’il n’est pas prêt.</p></div>
                <div className={styles.sectionIcon}><ShieldCheck size={24} /></div>
              </div>
              {errors.catalog ? <div className={styles.dangerBanner}><CircleAlert size={17} />{errors.catalog}</div> : null}
              <SmartPermissionsPanel defaultPermissions={[]} roleTemplates={roleTemplates} mode="create" onSummaryChange={handleAccessSummary} />
            </div>
          </section>

          <section className={styles.stage} hidden={activeStage !== 5}>
            <StudioPanel icon={<CheckCircle2 size={24} />} eyebrow="05 · Contrôle final" title="Valider l’émission de l’identité" text="Relisez les éléments qui seront réellement enregistrés. Aucun champ décoratif ou non persistant n’est présenté comme sauvegardé.">
              {allValid ? <div className={styles.successBanner}><CheckCircle2 size={18} />Le dossier est prêt. L’identité peut être provisionnée avec les accès sélectionnés.</div> : <div className={styles.warningBanner}><CircleAlert size={18} />Le dossier contient encore des éléments obligatoires à compléter. Utilisez la liste de contrôle à droite pour les localiser.</div>}
              <div className={styles.reviewGrid} style={{ marginTop: 16 }}>
                <ReviewCard title="Identité" rows={[['Nom complet', fullName], ['Email', email], ['Téléphone', phone], ['Nom utilisateur', username], ['Photo', photoState.hasPhoto ? 'Portrait professionnel attaché' : 'Initiales utilisées']]} />
                <ReviewCard title="Organisation" rows={[['Département', department], ['Poste', jobTitle], ['Rôle', selectedRole?.label || role], ['Langue', language.toUpperCase()]]} />
                <ReviewCard title="Compte & sécurité" rows={[['Statut', status], ['Mot de passe', `${password.length} caractères · ${strength >= 3 ? 'fort' : 'à renforcer'}`], ['Changement obligatoire', mustChangePassword ? 'Oui' : 'Non']]} />
                <ReviewCard title="Impact accès" rows={[['Permissions', String(accessSummary.selectedCount)], ['Modules', String(accessSummary.selectedModules)], ['Routes', String(accessSummary.selectedRoutes)], ['Accès sensibles', String(accessSummary.selectedRisk)], ['Legacy préservées', String(accessSummary.selectedLegacy)]]} />
                <div className={`${styles.reviewCard} ${styles.reviewCardFull}`}>
                  <h3>Ce que le membre verra après connexion</h3>
                  <p className={styles.sectionText}>Son dashboard SANILA sera composé à partir de {accessSummary.selectedCount} permissions explicitement sélectionnées, couvrant {accessSummary.selectedModules} modules et {accessSummary.selectedRoutes} routes reconnues par le catalogue live.</p>
                  <div className={styles.pillWrap} style={{ marginTop: 13 }}>
                    {accessSummary.selectedKeys.slice(0, 12).map((permission) => <span key={permission} className={styles.pill}>{permission}</span>)}
                    {accessSummary.selectedKeys.length > 12 ? <span className={`${styles.pill} ${styles.pillNeutral}`}>+{accessSummary.selectedKeys.length - 12} autres</span> : null}
                    {!accessSummary.selectedKeys.length ? <span className={`${styles.pill} ${styles.pillNeutral}`}>Aucune permission sélectionnée</span> : null}
                  </div>
                </div>
              </div>
            </StudioPanel>
          </section>

          <div className={styles.navigationRow}>
            <button type="button" className={styles.secondaryButton} onClick={previousStage} disabled={activeStage === 1}><ArrowLeft size={16} />Étape précédente</button>
            {activeStage < 5 ? <button type="button" className={styles.primaryButton} onClick={nextStage}>Continuer vers {stages[activeStage]?.title}<ArrowRight size={16} /></button> : <SubmitButton disabled={!allValid} />}
          </div>
        </main>

        <aside className={styles.rail}>
          <div className={styles.railDark}>
            <p className={styles.railEyebrow}>SANILA Access Passport</p>
            <div className={styles.passport}>
              <div className={styles.passportAvatar}>{photoState.previewUrl ? <img src={photoState.previewUrl} alt="Aperçu collaborateur" /> : initials(fullName)}</div>
              <div className={styles.passportCopy}><strong>{fullName || 'Nouveau membre'}</strong><span>{jobTitle || 'Poste à définir'}</span><span>{email || 'email@angelcare.ma'}</span></div>
            </div>
            <div className={styles.progressWrap}>
              <div className={styles.progressRing} style={{ '--progress': `${readiness * 3.6}deg` } as React.CSSProperties}><strong>{readiness}%</strong></div>
              <div className={styles.progressCopy}><strong>Identity readiness</strong><span>{completionItems.filter((item) => item.valid).length}/{completionItems.length} contrôles validés</span></div>
            </div>
          </div>

          <RailCard title="Impact d’accès" icon={<Gauge size={18} />}>
            <div className={styles.summaryList}>
              <SummaryRow label="Permissions" value={accessSummary.selectedCount} />
              <SummaryRow label="Modules" value={accessSummary.selectedModules} />
              <SummaryRow label="Routes" value={accessSummary.selectedRoutes} />
              <SummaryRow label="Legacy" value={accessSummary.selectedLegacy} />
              <SummaryRow label="Accès sensibles" value={accessSummary.selectedRisk} />
              <SummaryRow label="Catalogue" value={accessSummary.catalogState === 'ready' ? 'Prêt' : accessSummary.catalogState} />
            </div>
          </RailCard>

          <RailCard title="Centre de validation" icon={<ShieldCheck size={18} />}>
            <div className={styles.validationList}>{completionItems.map((item) => <div key={item.label} className={styles.validationItem} data-valid={item.valid}><span className={styles.validationIcon}>{item.valid ? <Check size={14} /> : <CircleAlert size={14} />}</span><span>{item.label}</span></div>)}</div>
          </RailCard>

          <div className={styles.railActions}>
            {activeStage === 5 ? <SubmitButton disabled={!allValid} /> : <button type="button" className={styles.primaryButton} onClick={nextStage}>Continuer<ChevronRight size={16} /></button>}
            <Link href="/users" className={styles.secondaryButton}>Annuler et revenir aux utilisateurs</Link>
          </div>
        </aside>

        <div className={styles.mobileActionBar}>
          <button type="button" className={styles.secondaryButton} onClick={previousStage} disabled={activeStage === 1}><ArrowLeft size={16} />Retour</button>
          {activeStage === 5 ? <SubmitButton disabled={!allValid} /> : <button type="button" className={styles.primaryButton} onClick={nextStage}>Continuer<ArrowRight size={16} /></button>}
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

function TextField({ label, name, value, onChange, placeholder, type = 'text', error, actionLabel, onAction, icon }: { label: string; name: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; error?: string; actionLabel?: string; onAction?: () => void; icon?: React.ReactNode }) {
  return <label className={styles.field}><span className={styles.labelRow}><span className={styles.label}>{label} <b className={styles.required}>*</b></span>{icon ? <span style={{ color: '#64748b' }}>{icon}</span> : null}</span><span className={styles.inputWrap}><input name={name} type={type} value={value} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)} placeholder={placeholder} className={`${styles.input} ${onAction ? styles.inputWithButton : ''}`} data-invalid={Boolean(error)} />{onAction ? <button type="button" className={styles.inlineAction} onClick={onAction}><Sparkles size={14} />{actionLabel}</button> : null}</span>{error ? <p className={styles.errorText}>{error}</p> : null}</label>
}

function SelectField({ label, name, value, onChange, options, placeholder, error }: { label: string; name: string; value: string; onChange: (value: string) => void; options: Array<string | { value: string; label: string }>; placeholder?: string; error?: string }) {
  return <label className={styles.field}><span className={styles.label}>{label} <b className={styles.required}>*</b></span><select name={name} value={value} onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)} className={styles.select} data-invalid={Boolean(error)}>{placeholder ? <option value="">{placeholder}</option> : null}{options.map((option) => { const optionValue = typeof option === 'string' ? option : option.value; const optionLabel = typeof option === 'string' ? option : option.label; return <option key={optionValue} value={optionValue}>{optionLabel}</option> })}</select>{error ? <p className={styles.errorText}>{error}</p> : null}</label>
}

function ToggleCard({ title, text, value, onChange }: { title: string; text: string; value: boolean; onChange: (value: boolean) => void }) {
  return <div className={styles.toggleCard}><div className={styles.toggleCopy}><strong>{title}</strong><span>{text}</span></div><button type="button" className={styles.switch} data-on={value} onClick={() => onChange(!value)} aria-pressed={value}><span /></button></div>
}

function ReviewCard({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return <div className={styles.reviewCard}><h3>{title}</h3><div className={styles.reviewRows}>{rows.map(([label, value]) => <div key={label} className={styles.reviewRow}><span>{label}</span><strong>{value || 'À compléter'}</strong></div>)}</div></div>
}

function RailCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className={styles.railCard}><div className={styles.railTitleRow}><h3 className={styles.railTitle}>{title}</h3><span style={{ color: '#2563eb' }}>{icon}</span></div>{children}</section>
}

function SummaryRow({ label, value }: { label: string; value: string | number }) {
  return <div className={styles.summaryRow}><span>{label}</span><strong>{value}</strong></div>
}

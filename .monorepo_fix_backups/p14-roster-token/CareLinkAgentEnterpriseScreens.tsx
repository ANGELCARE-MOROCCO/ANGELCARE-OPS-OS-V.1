'use client'

import Link from 'next/link'
import { useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  Award,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Cloud,
  CreditCard,
  FileCheck2,
  FileText,
  Fingerprint,
  GraduationCap,
  HeartPulse,
  Languages,
  LifeBuoy,
  LockKeyhole,
  MapPin,
  Navigation,
  PhoneCall,
  RefreshCcw,
  Route,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  UploadCloud,
  UserRound,
  WalletCards,
  Wifi,
  WifiOff,
} from 'lucide-react'
import type { CareLinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'
import type { MissionControlRecord } from '@/lib/missions/types'

type RunCareLinkAction = (endpoint: string, payload: Record<string, unknown>) => Promise<unknown>

type EnterpriseScreenProps = {
  workspace: CareLinkMobileWorkspace | null
  records: MissionControlRecord[]
  runCareLinkAction: RunCareLinkAction
}

type OfflineScreenProps = EnterpriseScreenProps & {
  pendingCount: number
  syncing: boolean
  online: boolean
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function safeArray<T = Record<string, unknown>>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

function valueText(value: unknown, fallback = '—') {
  if (Array.isArray(value)) return value.filter(Boolean).join(' · ') || fallback
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  if (value == null) return fallback
  const clean = String(value).trim()
  return clean || fallback
}

function currencyDh(value: unknown) {
  const amount = Number(value || 0)
  return `${amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} DH`
}

function dateLabel(value: unknown) {
  if (!value) return '—'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}

function recordStatus(record: MissionControlRecord) {
  return String(record.status || record.lifecycleStage || 'assigned').replaceAll('_', ' ')
}

function getEnterpriseRows(workspace: CareLinkMobileWorkspace | null, key: string) {
  return safeArray<Record<string, unknown>>((workspace as any)?.[key])
}

function dossier(workspace: CareLinkMobileWorkspace | null) {
  return ((workspace as any)?.enterpriseDossier || {}) as Record<string, any>
}

function statusPillClass(status: unknown) {
  const normalized = String(status || '').toLowerCase()
  if (['approved', 'validated', 'ready', 'active', 'completed', 'paid', 'acknowledged'].some((token) => normalized.includes(token))) return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
  if (['blocked', 'expired', 'rejected', 'critical', 'incident', 'revoked', 'suspended'].some((token) => normalized.includes(token))) return 'bg-rose-50 text-rose-700 ring-rose-100'
  if (['pending', 'review', 'warning', 'requested', 'submitted'].some((token) => normalized.includes(token))) return 'bg-amber-50 text-amber-800 ring-amber-100'
  return 'bg-sky-50 text-sky-700 ring-sky-100'
}

function PageShell({ eyebrow, title, description, icon, tone = 'blue', children }: { eyebrow: string; title: string; description: string; icon: ReactNode; tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate'; children: ReactNode }) {
  const heroClass = tone === 'emerald'
    ? 'from-emerald-500 via-teal-500 to-sky-600 shadow-emerald-100'
    : tone === 'amber'
      ? 'from-amber-400 via-orange-500 to-rose-500 shadow-amber-100'
      : tone === 'rose'
        ? 'from-rose-500 via-fuchsia-500 to-violet-600 shadow-rose-100'
        : tone === 'slate'
          ? 'from-slate-950 via-slate-800 to-blue-950 shadow-slate-200'
          : 'from-blue-700 via-sky-600 to-cyan-500 shadow-blue-100'

  return (
    <section className="pb-28">
      <div className="px-5 pt-5">
        <div className={cx('relative overflow-hidden rounded-[2.2rem] bg-gradient-to-br p-5 text-white shadow-2xl', heroClass)}>
          <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -bottom-14 left-6 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.34em] text-white/75">{eyebrow}</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">{title}</h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/82">{description}</p>
            </div>
            <div className="rounded-3xl bg-white/18 p-3 text-white ring-1 ring-white/20 backdrop-blur">{icon}</div>
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-4 px-5">{children}</div>
    </section>
  )
}

function GlassStat({ label, value, icon, tone = 'blue' }: { label: string; value: string | number; icon: ReactNode; tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' }) {
  const toneClass = tone === 'emerald'
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
    : tone === 'amber'
      ? 'bg-amber-50 text-amber-800 ring-amber-100'
      : tone === 'rose'
        ? 'bg-rose-50 text-rose-700 ring-rose-100'
        : tone === 'slate'
          ? 'bg-slate-100 text-slate-700 ring-slate-200'
          : 'bg-blue-50 text-blue-700 ring-blue-100'
  return (
    <div className={cx('rounded-[1.6rem] p-4 shadow-sm ring-1', toneClass)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">{label}</p>
          <p className="mt-1 text-2xl font-black tracking-tight">{value}</p>
        </div>
        <div className="rounded-2xl bg-white/75 p-2">{icon}</div>
      </div>
    </div>
  )
}

function EnterpriseCard({ title, subtitle, icon, children, action }: { title: string; subtitle?: string; icon?: ReactNode; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.07)]">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-br from-white to-slate-50 px-4 py-4">
        <div className="flex items-start gap-3">
          {icon ? <div className="rounded-2xl bg-sky-50 p-2 text-sky-700 ring-1 ring-sky-100">{icon}</div> : null}
          <div>
            <h2 className="text-base font-black tracking-tight text-slate-950">{title}</h2>
            {subtitle ? <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function InfoLine({ label, value, icon }: { label: string; value: unknown; icon?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 py-3 last:border-0">
      {icon ? <div className="mt-0.5 text-sky-600">{icon}</div> : null}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-bold leading-6 text-slate-950">{valueText(value)}</p>
      </div>
    </div>
  )
}

function ProgressBar({ value, tone = 'blue' }: { value: number; tone?: 'blue' | 'emerald' | 'amber' | 'rose' }) {
  const color = tone === 'emerald' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : tone === 'rose' ? 'bg-rose-500' : 'bg-blue-600'
  return <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={cx('h-full rounded-full transition-all', color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
}

function StatusPill({ children, status }: { children: ReactNode; status?: unknown }) {
  return <span className={cx('rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] ring-1', statusPillClass(status ?? children))}>{children}</span>
}

function EmptyMicro({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
      <p className="text-sm font-black text-slate-950">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{body}</p>
    </div>
  )
}

function ActionButton({ children, onClick, tone = 'blue', disabled = false }: { children: ReactNode; onClick: () => void | Promise<void>; tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate'; disabled?: boolean }) {
  const toneClass = tone === 'emerald'
    ? 'bg-emerald-600 text-white shadow-emerald-100'
    : tone === 'amber'
      ? 'bg-amber-500 text-white shadow-amber-100'
      : tone === 'rose'
        ? 'bg-rose-600 text-white shadow-rose-100'
        : tone === 'slate'
          ? 'bg-slate-950 text-white shadow-slate-200'
          : 'bg-blue-600 text-white shadow-blue-100'
  return <button disabled={disabled} onClick={onClick} className={cx('rounded-2xl px-4 py-3 text-xs font-black shadow-lg transition active:scale-[0.98] disabled:opacity-50', toneClass)}>{children}</button>
}

function RowLink({ href, title, body, icon }: { href: string; title: string; body: string; icon: ReactNode }) {
  return (
    <Link href={href} className="group flex items-center justify-between gap-3 rounded-[1.35rem] border border-slate-200 bg-slate-50 p-3 transition active:scale-[0.99]">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-white p-2 text-sky-700 shadow-sm">{icon}</div>
        <div>
          <p className="text-sm font-black text-slate-950">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{body}</p>
        </div>
      </div>
      <ChevronRight size={18} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-sky-500" />
    </Link>
  )
}

export function EnterpriseAgentProfileScreen({ workspace, records, runCareLinkAction }: EnterpriseScreenProps) {
  const [requestText, setRequestText] = useState('')
  const [requestKind, setRequestKind] = useState('identity')
  const [sending, setSending] = useState(false)

  const agent = workspace?.agent || {}
  const data = dossier(workspace)
  const identity = ((data as any)?.identity || {}) as Record<string, any>
  const access = ((data as any)?.access || {}) as Record<string, any>
  const security = ((data as any)?.security || {}) as Record<string, any>

  const profileRequests = getEnterpriseRows(workspace, 'profileRequests')
  const policyAcknowledgements = getEnterpriseRows(workspace, 'policyAcknowledgements')
  const deviceSessions = getEnterpriseRows(workspace, 'deviceSessions')
  const documents = safeArray<Record<string, unknown>>(workspace?.documents)
  const availabilityUpdates = getEnterpriseRows(workspace, 'availabilityUpdates')
  const securityEvents = getEnterpriseRows(workspace, 'securityEvents')

  function listFrom(value: unknown) {
    if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean)
    if (typeof value === 'string' && value.trim()) return value.split(/[;,|]/).map((item) => item.trim()).filter(Boolean)
    return []
  }

  const serviceTypes = Array.from(new Set(records.map((record) => String(record.serviceType || '').trim()).filter(Boolean))).slice(0, 8)
  const zones = Array.from(new Set(records.map((record) => String(record.zone || record.city || '').trim()).filter(Boolean))).slice(0, 8)
  const activeMissions = records.filter((record) => !['completed', 'closed', 'cancelled', 'canceled'].includes(String(record.status || '').toLowerCase())).length
  const completedMissions = records.filter((record) => ['completed', 'closed', 'done'].includes(String(record.status || '').toLowerCase())).length

  const agentName = valueText(
    identity.name ||
      identity.full_name ||
      (agent as any).full_name ||
      (agent as any).name ||
      (agent as any).display_name,
    'Agent CareLink',
  )

  const agentRole = valueText(
    identity.role ||
      (agent as any).role ||
      (agent as any).agent_role ||
      (agent as any).caregiver_type,
    'Caregiver terrain',
  )

  const agentStatus = valueText(
    (agent as any).status ||
      access.mobileStatus ||
      (agent as any).readiness_status ||
      workspace?.readiness?.status,
    'active',
  )

  const phone = identity.phone || (agent as any).phone || (agent as any).mobile_phone
  const email = identity.email || (agent as any).email || (agent as any).work_email
  const city = identity.city || (agent as any).city
  const zone = identity.zone || (agent as any).zone || (agent as any).preferred_zone
  const languages = listFrom(identity.languages || (agent as any).languages || (agent as any).language_skills || (agent as any).spoken_languages)
  const skills = listFrom(identity.skills || (agent as any).skills || (agent as any).skill_tags || (agent as any).competencies)

  const profileScore = Number(identity.profileScore ?? workspace?.readiness?.score ?? 0)
  const documentScore = documents.length ? Math.min(100, documents.length * 25) : 0
  const policyScore = Math.round((policyAcknowledgements.length / 4) * 100)
  const readinessTone = profileScore >= 80 ? 'emerald' : profileScore >= 55 ? 'amber' : 'rose'
  const openCorrections = profileRequests.filter((item) => !['closed', 'resolved', 'approved'].includes(String(item.status || '').toLowerCase())).length

  async function sendCorrectionRequest() {
    if (!requestText.trim()) return
    setSending(true)
    try {
      await runCareLinkAction('/api/carelink/profile/corrections', {
        requestType: requestKind,
        message: requestText.trim(),
        requestedChanges: { raw_request: requestText.trim() },
        source: 'carelink_mobile_enterprise_profile',
      })
      setRequestText('')
    } finally {
      setSending(false)
    }
  }

  return (
    <PageShell
      eyebrow="Dossier Agent ANGELCARE"
      title="Profil professionnel"
      description="Carte agent, identité, accès mobile, zones, compétences, conformité, sécurité et demandes synchronisées avec CARELINK-OPS Agents."
      icon={<UserRound size={24} />}
      tone="blue"
    >
      <section className="relative overflow-hidden rounded-[2.3rem] border border-blue-100 bg-white p-5 shadow-[0_28px_75px_rgba(29,78,216,0.13)]">
        <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-blue-100 blur-3xl" />
        <div className="absolute -bottom-16 left-0 h-44 w-44 rounded-full bg-emerald-100 blur-3xl" />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.34em] text-blue-600">Carte agent synchronisée</p>
              <h1 className="mt-3 text-[2rem] font-black leading-[0.98] tracking-tight text-slate-950">{agentName}</h1>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{agentRole}</p>
            </div>

            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.4rem] bg-gradient-to-br from-slate-950 to-blue-700 text-white shadow-xl shadow-blue-100">
              <UserRound size={30} />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <StatusPill status={agentStatus}>{agentStatus}</StatusPill>
            <StatusPill status={workspace?.readiness?.status || 'ready'}>{valueText(workspace?.readiness?.status, 'readiness')}</StatusPill>
            <StatusPill status="blue">{records.length} mission(s)</StatusPill>
          </div>

          <div className="mt-5 rounded-[1.5rem] bg-slate-950 p-4 text-white shadow-xl shadow-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-200">Score profil opérationnel</p>
                <p className="mt-2 text-3xl font-black">{profileScore}%</p>
              </div>
              <div className="rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                {profileScore >= 80 ? 'Premium ready' : profileScore >= 55 ? 'À renforcer' : 'À compléter'}
              </div>
            </div>
            <div className="mt-4"><ProgressBar value={profileScore} tone={readinessTone} /></div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <GlassStat label="Profil" value={`${profileScore}%`} icon={<BadgeCheck size={18} />} tone={readinessTone} />
        <GlassStat label="Actives" value={activeMissions} icon={<ClipboardCheck size={18} />} tone="blue" />
        <GlassStat label="Documents" value={documents.length} icon={<FileCheck2 size={18} />} tone={documents.length ? 'emerald' : 'slate'} />
        <GlassStat label="Demandes" value={openCorrections} icon={<RefreshCcw size={18} />} tone={openCorrections ? 'amber' : 'slate'} />
      </div>

      <EnterpriseCard title="Identité professionnelle" subtitle="Informations directes du profil caregiver lié au compte mobile." icon={<Fingerprint size={18} />}>
        <div className="grid gap-2">
          <InfoLine label="Téléphone" value={phone} icon={<PhoneCall size={16} />} />
          <InfoLine label="Email mobile" value={email} icon={<LockKeyhole size={16} />} />
          <InfoLine label="Ville / zone" value={`${valueText(city, 'Ville non définie')} · ${valueText(zone, 'Zone non définie')}`} icon={<MapPin size={16} />} />
          <InfoLine label="Langues" value={languages.length ? languages.join(' · ') : 'Non renseignées'} icon={<Languages size={16} />} />
        </div>

        <div className="mt-4 rounded-[1.5rem] bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Compétences visibles OPS</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.length ? skills.slice(0, 10).map((item) => <StatusPill key={item} status="ready">{item}</StatusPill>) : <span className="text-sm font-semibold text-slate-500">Aucune compétence publiée.</span>}
          </div>
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="Éligibilité opérationnelle" subtitle="Synthèse des zones, services et conditions utilisées pour l’affectation terrain." icon={<ShieldCheck size={18} />}>
        <div className="grid grid-cols-2 gap-3">
          <GlassStat label="Services" value={serviceTypes.length || '—'} icon={<Sparkles size={17} />} tone="emerald" />
          <GlassStat label="Zones" value={zones.length || '—'} icon={<MapPin size={17} />} tone="blue" />
        </div>

        <div className="mt-4 grid gap-3">
          <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-emerald-900">Services autorisés / visibles</p>
              <Sparkles size={18} className="text-emerald-700" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {serviceTypes.length ? serviceTypes.map((item) => <StatusPill key={item} status="ready">{item}</StatusPill>) : <span className="text-sm font-semibold text-emerald-700">Aucun service publié.</span>}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-blue-900">Zones opérationnelles</p>
              <MapPin size={18} className="text-blue-700" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {zones.length ? zones.map((item) => <StatusPill key={item} status="blue">{item}</StatusPill>) : <span className="text-sm font-semibold text-blue-700">Aucune zone publiée.</span>}
            </div>
          </div>
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="Conformité & readiness" subtitle="Vue qualité des conditions nécessaires pour travailler sans blocage opérationnel." icon={<Award size={18} />}>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-slate-950">Profil identité</p>
              <span className="text-sm font-black text-slate-500">{profileScore}%</span>
            </div>
            <div className="mt-2"><ProgressBar value={profileScore} tone={readinessTone} /></div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-slate-950">Documents</p>
              <span className="text-sm font-black text-slate-500">{documentScore}%</span>
            </div>
            <div className="mt-2"><ProgressBar value={documentScore} tone={documentScore >= 80 ? 'emerald' : documentScore >= 40 ? 'amber' : 'rose'} /></div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-slate-950">Politiques acceptées</p>
              <span className="text-sm font-black text-slate-500">{Math.min(100, policyScore)}%</span>
            </div>
            <div className="mt-2"><ProgressBar value={Math.min(100, policyScore)} tone={policyScore >= 100 ? 'emerald' : 'amber'} /></div>
          </div>
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="Accès mobile & sécurité" subtitle="Contrôle synchronisé avec User / Mobile Access dans CARELINK-OPS Agents." icon={<LockKeyhole size={18} />}>
        <div className="grid grid-cols-2 gap-3">
          <GlassStat label="Sessions" value={deviceSessions.length || '1'} icon={<Wifi size={17} />} tone="blue" />
          <GlassStat label="Sécurité" value={securityEvents.length || 'OK'} icon={<ShieldAlert size={17} />} tone={securityEvents.length ? 'amber' : 'emerald'} />
        </div>

        <div className="mt-4 grid gap-2">
          <InfoLine label="Session active" value={deviceSessions.length ? `${deviceSessions.length} session(s) connue(s)` : 'Session mobile gouvernée'} icon={<Wifi size={16} />} />
          <InfoLine label="PIN / reset" value={(security.pinResetRequired || (agent as any).pin_reset_required) ? 'Réinitialisation requise' : 'Aucune réinitialisation requise'} icon={<Fingerprint size={16} />} />
          <InfoLine label="Dernier contrôle" value={dateLabel(workspace?.generatedAt)} icon={<ShieldCheck size={16} />} />
        </div>

        <div className="mt-4 grid gap-2">
          <RowLink href="/carelink/offline" title="Centre offline & synchronisation" body="Voir files locales, état réseau, sessions et garanties anti-doublon." icon={<Cloud size={17} />} />
          <RowLink href="/carelink/safety" title="Sécurité et SOS" body="Signaler urgence, risque terrain, téléphone perdu ou besoin de rappel superviseur." icon={<ShieldAlert size={17} />} />
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="Disponibilité & affectation" subtitle="Miroir mobile des disponibilités et contraintes terrain utilisées par OPS." icon={<CalendarClock size={18} />}>
        <div className="grid grid-cols-2 gap-3">
          <GlassStat label="Disponibilités" value={availabilityUpdates.length || '—'} icon={<CalendarClock size={17} />} tone="emerald" />
          <GlassStat label="Missions finies" value={completedMissions} icon={<CheckCircle2 size={17} />} tone="blue" />
        </div>
        <div className="mt-4">
          <RowLink href="/carelink/schedule" title="Voir planning & disponibilité" body="Mettre à jour disponibilité, blackout dates et fenêtres terrain." icon={<CalendarClock size={17} />} />
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="Demande de correction profil" subtitle="L’agent ne modifie pas directement les champs sensibles: il demande une revue OPS." icon={<RefreshCcw size={18} />}>
        <div className="flex flex-wrap gap-2">
          {[['identity', 'Identité'], ['contact', 'Contact'], ['zone', 'Zone'], ['skills', 'Compétences'], ['documents', 'Documents']].map(([key, label]) => (
            <button key={key} type="button" onClick={() => setRequestKind(key)} className={cx('rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ring-1 transition', requestKind === key ? 'bg-slate-950 text-white ring-slate-950' : 'bg-white text-slate-600 ring-slate-200')}>
              {label}
            </button>
          ))}
        </div>

        <textarea
          value={requestText}
          onChange={(event) => setRequestText(event.target.value)}
          placeholder="Décrivez clairement la correction demandée à OPS..."
          className="mt-3 min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-sky-400"
        />

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold leading-5 text-slate-500">La demande sera enregistrée, auditée et visible côté opérations.</p>
          <ActionButton disabled={sending || !requestText.trim()} onClick={sendCorrectionRequest} tone="slate">Envoyer</ActionButton>
        </div>

        <div className="mt-4 space-y-2">
          {profileRequests.slice(0, 4).map((item) => (
            <div key={String(item.id)} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-slate-950">{valueText(item.request_type || item.requestType, 'Correction')}</p>
                <StatusPill status={item.status}>{valueText(item.status, 'pending')}</StatusPill>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">{valueText(item.message || item.notes, 'Demande enregistrée')}</p>
            </div>
          ))}
          {!profileRequests.length ? <EmptyMicro title="Aucune correction ouverte" body="Les demandes envoyées depuis le mobile apparaîtront ici." /> : null}
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="Politiques acceptées" subtitle="Preuve d’acceptation mobile des règles terrain, confidentialité, urgence et sécurité." icon={<FileCheck2 size={18} />}>
        <div className="grid gap-2">
          {['mission_execution', 'confidentiality', 'emergency_protocol', 'mobile_security'].map((key) => {
            const acknowledged = policyAcknowledgements.some((item) => String(item.policy_key || item.policyKey) === key)
            return <PolicyAction key={key} policyKey={key} acknowledged={acknowledged} runCareLinkAction={runCareLinkAction} />
          })}
        </div>
      </EnterpriseCard>
    </PageShell>
  )
}


function PolicyAction({ policyKey, acknowledged, runCareLinkAction }: { policyKey: string; acknowledged: boolean; runCareLinkAction: RunCareLinkAction }) {
  const [busy, setBusy] = useState(false)
  const labels: Record<string, string> = {
    mission_execution: 'Politique exécution mission',
    confidentiality: 'Confidentialité familles & enfants',
    emergency_protocol: 'Procédure urgence terrain',
    mobile_security: 'Sécurité mobile & session',
  }
  return (
    <div className="flex items-center justify-between gap-3 rounded-[1.4rem] bg-slate-50 p-3">
      <div>
        <p className="text-sm font-black text-slate-950">{labels[policyKey] || policyKey}</p>
        <p className="mt-1 text-xs text-slate-500">Version active synchronisée OPS.</p>
      </div>
      {acknowledged ? <StatusPill status="acknowledged">Acceptée</StatusPill> : <ActionButton disabled={busy} onClick={async () => { setBusy(true); try { await runCareLinkAction('/api/carelink/policies/acknowledge', { policyKey, version: '2026.06', source: 'carelink_mobile_enterprise_profile' }) } finally { setBusy(false) } }} tone="emerald">Accepter</ActionButton>}
    </div>
  )
}

export function EnterpriseReadinessScreen({ workspace, records, runCareLinkAction }: EnterpriseScreenProps) {
  const readiness = workspace?.readiness
  const documents = safeArray<Record<string, unknown>>(workspace?.documents)
  const documentSubmissions = getEnterpriseRows(workspace, 'documentSubmissions')
  const policyAcknowledgements = getEnterpriseRows(workspace, 'policyAcknowledgements')
  const training = safeArray<Record<string, unknown>>((dossier(workspace)?.academy || {}).training)
  const blockers = readiness?.blockers || []
  const warnings = readiness?.warnings || []
  const score = Number(readiness?.score || 0)
  const [documentType, setDocumentType] = useState('cin')
  const [documentNote, setDocumentNote] = useState('')
  const [busy, setBusy] = useState(false)

  const expiredDocuments = documents.filter((document) => {
    const expiresAt = document.expiresAt || document.expires_at
    return String(document.status || document.reviewStatus || '').toLowerCase().includes('expired') || (expiresAt ? new Date(String(expiresAt)).getTime() < Date.now() : false)
  })
  const pendingDocuments = documents.filter((document) => ['pending', 'review_requested', 'in_review'].includes(String(document.reviewStatus || document.status || '').toLowerCase()))
  const missionServices = Array.from(new Set(records.map((record) => record.serviceType).filter(Boolean)))

  async function submitDocument() {
    setBusy(true)
    try {
      await runCareLinkAction('/api/carelink/documents/submit', {
        documentType,
        note: documentNote || `Soumission ${documentType}`,
        metadata: { source: 'carelink_mobile_readiness' },
      })
      setDocumentNote('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell eyebrow="Readiness & Compliance" title="Préparation entreprise" description="Documents, politiques, Academy, blocages, éligibilités et demandes de revue avant exécution terrain." icon={<ShieldCheck size={24} />} tone={score >= 80 ? 'emerald' : score >= 50 ? 'amber' : 'rose'}>
      <EnterpriseCard title="Score readiness" subtitle={readiness?.nextAction || 'Évaluation opérationnelle en temps réel.'} icon={<Award size={18} />}>
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-6xl font-black tracking-tight text-slate-950">{score}%</p><p className="mt-1 text-sm font-bold text-slate-500">{valueText(readiness?.status, 'pending')}</p></div>
          <StatusPill status={readiness?.status}>{readiness?.status || 'pending'}</StatusPill>
        </div>
        <div className="mt-4"><ProgressBar value={score} tone={score >= 80 ? 'emerald' : score >= 50 ? 'amber' : 'rose'} /></div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <GlassStat label="Blocages" value={blockers.length} icon={<AlertTriangle size={17} />} tone={blockers.length ? 'rose' : 'emerald'} />
          <GlassStat label="Vigilances" value={warnings.length} icon={<ShieldAlert size={17} />} tone={warnings.length ? 'amber' : 'emerald'} />
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="Documents & conformité" subtitle="Vault mobile connecté au dossier OPS Agent." icon={<FileText size={18} />}>
        <div className="grid grid-cols-3 gap-2">
          <GlassStat label="Docs" value={documents.length} icon={<FileCheck2 size={16} />} tone="blue" />
          <GlassStat label="Expirés" value={expiredDocuments.length} icon={<AlertTriangle size={16} />} tone={expiredDocuments.length ? 'rose' : 'emerald'} />
          <GlassStat label="Revue" value={pendingDocuments.length} icon={<RefreshCcw size={16} />} tone={pendingDocuments.length ? 'amber' : 'emerald'} />
        </div>
        <div className="mt-4 space-y-2">
          {documents.slice(0, 5).map((document) => (
            <div key={String(document.id)} className="rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3"><p className="text-sm font-black text-slate-950">{valueText(document.documentType || document.document_type, 'Document')}</p><StatusPill status={document.reviewStatus || document.status}>{valueText(document.reviewStatus || document.status, 'pending')}</StatusPill></div>
              <p className="mt-1 text-xs text-slate-500">Expiration: {dateLabel(document.expiresAt || document.expires_at)}</p>
            </div>
          ))}
          {!documents.length ? <EmptyMicro title="Aucun document chargé" body="Les documents créés/revus dans OPS apparaîtront ici." /> : null}
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="Soumettre un document" subtitle="La soumission crée une ligne de revue OPS sans modifier directement le dossier sensible." icon={<UploadCloud size={18} />}>
        <div className="flex flex-wrap gap-2">
          {['cin', 'diploma', 'first_aid', 'medical', 'reference', 'other'].map((type) => <button key={type} onClick={() => setDocumentType(type)} className={cx('rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ring-1', documentType === type ? 'bg-slate-950 text-white ring-slate-950' : 'bg-white text-slate-600 ring-slate-200')}>{type}</button>)}
        </div>
        <textarea value={documentNote} onChange={(event) => setDocumentNote(event.target.value)} placeholder="Note, lien fichier ou précision pour OPS..." className="mt-3 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400" />
        <div className="mt-3 flex items-center justify-between gap-3"><p className="text-xs leading-5 text-slate-500">Le fichier réel peut être lié via URL/metadata selon votre storage Supabase.</p><ActionButton disabled={busy} onClick={submitDocument} tone="blue">Soumettre</ActionButton></div>
        <div className="mt-4 space-y-2">
          {documentSubmissions.slice(0, 3).map((item) => <div key={String(item.id)} className="rounded-2xl bg-slate-50 p-3"><div className="flex items-center justify-between"><p className="text-sm font-black text-slate-950">{valueText(item.document_type || item.documentType)}</p><StatusPill status={item.status}>{valueText(item.status, 'submitted')}</StatusPill></div><p className="mt-1 text-xs text-slate-500">{dateLabel(item.created_at || item.createdAt)}</p></div>)}
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="Academy & services autorisés" subtitle="Les formations et services publiés déterminent l’éligibilité mission." icon={<GraduationCap size={18} />}>
        <div className="space-y-2">
          {training.length ? training.slice(0, 4).map((item, index) => <div key={String(item.id || index)} className="rounded-2xl bg-slate-50 p-3"><div className="flex justify-between gap-3"><p className="text-sm font-black text-slate-950">{valueText(item.title || item.module || item.name, 'Formation')}</p><StatusPill status={item.status}>{valueText(item.status, 'pending')}</StatusPill></div></div>) : <EmptyMicro title="Aucune formation visible" body="Les tracks Academy affectés côté OPS apparaîtront ici." />}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">{missionServices.map((item) => <StatusPill key={item} status="ready">{item}</StatusPill>)}</div>
      </EnterpriseCard>
    </PageShell>
  )
}

function splitRosterInput(value: string) {
  return value.split(/[;,|]/).map((item) => item.trim()).filter(Boolean)
}

function latestAvailabilityLabel(row: Record<string, unknown> | undefined) {
  if (!row) return 'Non déclaré'
  const status = valueText(row.availability_status || row.availabilityStatus, 'available')
  const type = valueText(row.availability_type || row.availabilityType, 'status')
  return `${status} · ${type}`
}

function missionConflicts(records: MissionControlRecord[], availability: string, blackoutDate: string) {
  const isBlocking = ['unavailable', 'day_off', 'blackout'].includes(availability)
  if (!isBlocking && !blackoutDate) return []
  return records.filter((mission) => {
    if (!blackoutDate) return isBlocking && ['assigned', 'agent_notified', 'confirmed', 'en_route', 'arrival_confirmed', 'mission_started'].includes(String(mission.status || ''))
    const raw = String((mission as any).startAt || (mission as any).scheduledStartAt || (mission as any).date || '')
    return raw.startsWith(blackoutDate)
  })
}

export function EnterpriseScheduleScreen({ workspace, records, runCareLinkAction }: EnterpriseScreenProps) {
  const roster = ((dossier(workspace)?.roster || {}) as Record<string, any>)
  const availabilityRows = getEnterpriseRows(workspace, 'availabilityUpdates')
  const latestAvailability = availabilityRows[0]

  const [availability, setAvailability] = useState(String((latestAvailability as any)?.availability_status || roster.availabilityStatus || 'available'))
  const [availabilityType, setAvailabilityType] = useState('status_update')
  const [note, setNote] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [effectiveUntil, setEffectiveUntil] = useState('')
  const [blackoutDate, setBlackoutDate] = useState('')
  const [dayPart, setDayPart] = useState('full_day')
  const [preferredZones, setPreferredZones] = useState(valueText(roster.preferredZones, ''))
  const [excludedZones, setExcludedZones] = useState(valueText(roster.excludedZones, ''))
  const [weeklyWindows, setWeeklyWindows] = useState(valueText(roster.weeklyWindows || roster.weekly_windows, 'Lundi-Vendredi 10:00-18:00'))
  const [workloadLimit, setWorkloadLimit] = useState(String(roster.workloadLimit || roster.maxWeeklyMissions || ''))
  const [preferredShift, setPreferredShift] = useState(String(roster.preferredShift || 'day'))
  const [replacementMode, setReplacementMode] = useState(String(roster.replacementMode || 'normal'))
  const [weekendAvailable, setWeekendAvailable] = useState(Boolean(roster.weekendAcceptance || roster.weekendAvailable))
  const [nightAvailable, setNightAvailable] = useState(Boolean(roster.nightAcceptance || roster.nightAvailable))
  const [emergencyAvailable, setEmergencyAvailable] = useState(Boolean(roster.emergencyReplacement || roster.emergencyAvailable))
  const [transportReady, setTransportReady] = useState(Boolean(roster.transportReady ?? !roster.transportRequired))
  const [busy, setBusy] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [localRows, setLocalRows] = useState<Record<string, unknown>[]>([])

  const visibleRows = localRows.length ? localRows : availabilityRows
  const currentRow = visibleRows[0] || latestAvailability
  const openMissions = records.filter((record) => !['completed', 'closed', 'cancelled', 'canceled'].includes(String(record.status || '').toLowerCase()))
  const todayMissions = records.filter((record) => record.dateLabel && record.dateLabel !== 'Non planifiée')
  const preferredZonesList = splitRosterInput(preferredZones)
  const excludedZonesList = splitRosterInput(excludedZones)

  const conflicts = records.filter((record) => {
    const status = String(record.status || '').toLowerCase()
    if (['completed', 'closed', 'cancelled', 'canceled'].includes(status)) return false
    if (['unavailable', 'day_off', 'blackout'].includes(availability)) return true
    if (!blackoutDate) return false
    const missionDate = String((record as any).date || (record as any).startAt || (record as any).scheduledAt || record.dateLabel || '')
    return missionDate.includes(blackoutDate)
  })

  const conflictLevel = conflicts.length ? 'availability_conflict' : null

  const rosterCompleteness = Math.min(100, Math.round(
    (availability ? 18 : 0) +
    (effectiveFrom || effectiveUntil ? 12 : 0) +
    (preferredZonesList.length ? 15 : 0) +
    (weeklyWindows ? 15 : 0) +
    (transportReady ? 10 : 0) +
    (weekendAvailable ? 8 : 0) +
    (nightAvailable ? 8 : 0) +
    (emergencyAvailable ? 8 : 0) +
    (note ? 6 : 0),
  ))

  async function saveRosterUpdate(nextType = availabilityType, nextStatus = availability, extra: Record<string, unknown> = {}) {
    setBusy(true)
    setSavedMessage('')

    try {
      const payload = {
        availability: nextStatus,
        availabilityStatus: nextStatus,
        availabilityType: nextType,
        note: note || `Roster ${nextType} · ${nextStatus}`,
        effectiveFrom: effectiveFrom || null,
        effectiveUntil: effectiveUntil || null,
        blackoutDate: blackoutDate || null,
        dayPart,
        preferredZones: preferredZonesList,
        excludedZones: excludedZonesList,
        weekendAvailable,
        nightAvailable,
        emergencyAvailable,
        transportReady,
        conflictLevel,
        metadata: {
          source: 'carelink_mobile_schedule_enterprise_recovered',
          section: extra.section || nextType,
          weekly_windows: weeklyWindows,
          workload_limit: workloadLimit || null,
          preferred_shift: preferredShift,
          replacement_mode: replacementMode,
          preferred_zones: preferredZonesList,
          excluded_zones: excludedZonesList,
          weekend_available: weekendAvailable,
          night_available: nightAvailable,
          emergency_available: emergencyAvailable,
          transport_ready: transportReady,
          conflicts: conflicts.map((mission) => ({
            id: mission.id,
            code: mission.code,
            status: mission.status,
            date: mission.dateLabel,
          })),
          ...extra,
        },
      }

      const response = (await runCareLinkAction('/api/carelink/availability', payload)) as any
      const saved = (response?.data?.data || response?.data || {
        id: `local-roster-${Date.now()}`,
        availability_status: nextStatus,
        availability_type: nextType,
        note: payload.note,
        conflict_level: conflictLevel || 'recorded',
        created_at: new Date().toISOString(),
        metadata: payload.metadata,
      }) as Record<string, unknown>

      setAvailability(nextStatus)
      setAvailabilityType(nextType)
      setLocalRows((current) => [saved, ...current].slice(0, 12))
      setSavedMessage(`Synchronisé: ${nextType.replaceAll('_', ' ')} · ${nextStatus}`)
      setNote('')
    } finally {
      setBusy(false)
    }
  }

  const statusOptions = [
    ['available', 'Disponible'],
    ['limited', 'Limitée'],
    ['unavailable', 'Indisponible'],
    ['emergency_backup', 'Backup urgence'],
    ['day_off', 'Jour off'],
    ['blackout', 'Blackout'],
    ['transport_limited', 'Transport limité'],
  ]

  const requestTypes = [
    ['status_update', 'Statut'],
    ['day_off_request', 'Jour off'],
    ['blackout_date', 'Blackout'],
    ['emergency_availability', 'Urgence'],
    ['weekend_availability', 'Weekend'],
    ['night_availability', 'Nuit'],
    ['transport_readiness', 'Transport'],
    ['zone_preference', 'Zones'],
  ]

  return (
    <PageShell
      eyebrow="Roster & Availability"
      title="Disponibilité terrain"
      description="Cockpit agent complet: statut, dates, blackout, weekend, nuit, transport, zones, charge de travail, conflits et synchronisation OPS."
      icon={<CalendarClock size={24} />}
      tone="blue"
    >
            <style>{`
        body:has([data-carelink-schedule-r4-force="true"]) h1 {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }

        body:has([data-carelink-schedule-r4-force="true"]) [class*="bg-slate-950"],
        body:has([data-carelink-schedule-r4-force="true"]) [class*="bg-slate-950"] *,
        body:has([data-carelink-schedule-r4-force="true"]) [class*="bg-[#000"],
        body:has([data-carelink-schedule-r4-force="true"]) [class*="bg-[#000"] * {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }

        body:has([data-carelink-schedule-r4-force="true"]) span[style],
        body:has([data-carelink-schedule-r4-force="true"]) button span {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }
      `}</style>
      <span data-carelink-schedule-r4-force="true" className="hidden" />
<section className="relative overflow-hidden rounded-[2.3rem] border border-blue-100 bg-white p-5 shadow-[0_28px_75px_rgba(29,78,216,0.13)]">
        <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-blue-100 blur-3xl" />
        <div className="absolute -bottom-16 left-0 h-44 w-44 rounded-full bg-emerald-100 blur-3xl" />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.34em] text-blue-600">Planning synchronisé OPS</p>
              <h1 className="mt-3 text-[2rem] font-black leading-[0.98] tracking-tight text-white">Roster cockpit</h1>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                Chaque action enregistre un vrai signal de disponibilité exploitable côté dispatch.
              </p>
            </div>

            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.4rem] bg-gradient-to-br from-slate-950 to-blue-700 text-white shadow-xl shadow-blue-100">
              <CalendarClock size={30} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <GlassStat label="Roster" value={`${rosterCompleteness}%`} icon={<Wifi size={17} />} tone={rosterCompleteness >= 70 ? 'emerald' : rosterCompleteness >= 40 ? 'amber' : 'rose'} />
            <GlassStat label="Ouvertes" value={openMissions.length} icon={<Route size={17} />} tone="blue" />
            <GlassStat label="Aujourd’hui" value={todayMissions.length} icon={<CalendarClock size={17} />} tone="slate" />
            <GlassStat label="Conflits" value={conflicts.length} icon={<ShieldAlert size={17} />} tone={conflicts.length ? 'rose' : 'emerald'} />
          </div>

          {savedMessage ? (
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
              {savedMessage}
            </div>
          ) : null}

          <div className="mt-4 rounded-[1.5rem] bg-slate-950 p-4 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-200">Dernier signal roster</p>
            <p className="mt-2 text-sm font-black">{latestAvailabilityLabel(currentRow)}</p>
            <p className="mt-1 text-xs font-semibold text-slate-300">{dateLabel((currentRow as any)?.created_at || (currentRow as any)?.createdAt)}</p>
          </div>
        </div>
      </section>

      <EnterpriseCard title="1. Statut immédiat" subtitle="Définissez l’état que le dispatch doit respecter maintenant." icon={<Wifi size={18} />}>
        <div className="grid grid-cols-2 gap-2">
          {statusOptions.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setAvailability(key)}
              className={cx(
                'rounded-2xl px-3 py-4 text-xs font-black uppercase tracking-[0.14em] ring-1 transition active:scale-[0.98]',
                availability === key ? 'bg-slate-950 text-white ring-slate-950 shadow-lg shadow-slate-200' : 'bg-white text-slate-600 ring-slate-200',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <label className="grid gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Début</span>
            <input value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} type="datetime-local" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold outline-none" />
          </label>

          <label className="grid gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Fin</span>
            <input value={effectiveUntil} onChange={(event) => setEffectiveUntil(event.target.value)} type="datetime-local" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold outline-none" />
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <ActionButton disabled={busy} onClick={() => saveRosterUpdate('status_update', availability, { section: 'immediate_status' })} tone="emerald">
            Sauvegarder statut
          </ActionButton>
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="2. Type de demande" subtitle="Choisissez la nature exacte de la mise à jour roster." icon={<RefreshCcw size={18} />}>
        <div className="grid grid-cols-2 gap-2">
          {requestTypes.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setAvailabilityType(key)}
              className={cx(
                'rounded-2xl px-3 py-3 text-[10px] font-black uppercase tracking-[0.16em] ring-1 transition active:scale-[0.98]',
                availabilityType === key ? 'bg-blue-600 text-white ring-blue-600 shadow-lg shadow-blue-100' : 'bg-blue-50 text-blue-700 ring-blue-100',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-2">
          <ScheduleSaveActionCard title="Publier statut général" body="Met à jour le signal principal utilisé par OPS Dispatch." disabled={busy} onClick={() => saveRosterUpdate('status_update', availability, { section: 'general_status' })} />
          <ScheduleSaveActionCard title="Demander jour off" body="Enregistre un jour off contrôlé avec date/période si renseignée." disabled={busy} onClick={() => saveRosterUpdate('day_off_request', 'day_off', { section: 'day_off' })} />
          <ScheduleSaveActionCard title="Bloquer blackout" body="Bloque une date précise pour éviter l’affectation." disabled={busy} onClick={() => saveRosterUpdate('blackout_date', 'blackout', { section: 'blackout' })} />
          <ScheduleSaveActionCard title="Activer backup urgence" body="Signale une disponibilité de remplacement prioritaire." disabled={busy} onClick={() => saveRosterUpdate('emergency_availability', emergencyAvailable ? 'emergency_backup' : 'limited', { section: 'emergency_backup' })} />
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="3. Dates, jour off & blackout" subtitle="Les indisponibilités précises deviennent des signaux traçables côté OPS." icon={<CalendarClock size={18} />}>
        <div className="grid gap-3">
          <label className="grid gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Date blackout / jour off</span>
            <input value={blackoutDate} onChange={(event) => setBlackoutDate(event.target.value)} type="date" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none" />
          </label>

          <div className="grid grid-cols-3 gap-2">
            {[
              ['full_day', 'Journée'],
              ['morning', 'Matin'],
              ['afternoon', 'Après-midi'],
              ['night', 'Nuit'],
              ['weekend', 'Weekend'],
              ['custom', 'Custom'],
            ].map(([key, label]) => (
              <button key={key} type="button" onClick={() => setDayPart(key)} className={cx('rounded-2xl px-3 py-3 text-[10px] font-black uppercase tracking-[0.14em] ring-1', dayPart === key ? 'bg-slate-950 text-white ring-slate-950' : 'bg-white text-slate-600 ring-slate-200')}>
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <ActionButton disabled={busy || !blackoutDate} onClick={() => saveRosterUpdate('day_off_request', 'day_off', { section: 'date_day_off' })} tone="amber">Sauver jour off</ActionButton>
            <ActionButton disabled={busy || !blackoutDate} onClick={() => saveRosterUpdate('blackout_date', 'blackout', { section: 'date_blackout' })} tone="rose">Sauver blackout</ActionButton>
          </div>
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="4. Fenêtres hebdomadaires & charge" subtitle="Décrivez vos règles régulières en format simple exploitable par OPS." icon={<Route size={18} />}>
        <div className="grid gap-3">
          <textarea value={weeklyWindows} onChange={(event) => setWeeklyWindows(event.target.value)} rows={4} placeholder="Ex: Lundi-Vendredi 10:00-18:00; Samedi matin possible" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none" />

          <div className="grid grid-cols-2 gap-2">
            <input value={workloadLimit} onChange={(event) => setWorkloadLimit(event.target.value)} placeholder="Limite charge" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none" />
            <select value={preferredShift} onChange={(event) => setPreferredShift(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none">
              <option value="day">Journée</option>
              <option value="morning">Matin</option>
              <option value="afternoon">Après-midi</option>
              <option value="night">Nuit</option>
              <option value="weekend">Weekend</option>
            </select>
          </div>

          <div className="flex justify-end">
            <ActionButton disabled={busy} onClick={() => saveRosterUpdate('status_update', availability, { section: 'weekly_windows' })} tone="blue">Sauver fenêtres</ActionButton>
          </div>
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="5. Zones, transport & remplacement" subtitle="Les règles de distance et remplacement doivent être claires avant affectation." icon={<MapPin size={18} />}>
        <div className="grid gap-3">
          <input value={preferredZones} onChange={(event) => setPreferredZones(event.target.value)} placeholder="Zones préférées: Rabat, Agdal, Témara..." className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none" />
          <input value={excludedZones} onChange={(event) => setExcludedZones(event.target.value)} placeholder="Zones exclues / contraintes" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none" />

          <div className="grid grid-cols-2 gap-2">
            <ScheduleToggleCard active={weekendAvailable} onClick={() => setWeekendAvailable(!weekendAvailable)} title="Weekend" body={weekendAvailable ? 'Accepté' : 'Non accepté'} />
            <ScheduleToggleCard active={nightAvailable} onClick={() => setNightAvailable(!nightAvailable)} title="Nuit" body={nightAvailable ? 'Acceptée' : 'Non acceptée'} />
            <ScheduleToggleCard active={emergencyAvailable} onClick={() => setEmergencyAvailable(!emergencyAvailable)} title="Urgence" body={emergencyAvailable ? 'Disponible' : 'Non disponible'} />
            <ScheduleToggleCard active={transportReady} onClick={() => setTransportReady(!transportReady)} title="Transport" body={transportReady ? 'Prêt' : 'Limité'} />
          </div>

          <select value={replacementMode} onChange={(event) => setReplacementMode(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none">
            <option value="normal">Normal</option>
            <option value="priority_backup">Backup prioritaire</option>
            <option value="only_nearby">Seulement proximité</option>
            <option value="not_replacement">Pas remplacement</option>
          </select>

          <div className="grid grid-cols-2 gap-2">
            <ActionButton disabled={busy} onClick={() => saveRosterUpdate('zone_preference', transportReady ? 'available' : 'transport_limited', { section: 'zones_transport' })} tone="blue">Sauver zones</ActionButton>
            <ActionButton disabled={busy} onClick={() => saveRosterUpdate('transport_readiness', transportReady ? 'available' : 'transport_limited', { section: 'transport_readiness' })} tone="slate">Sauver transport</ActionButton>
          </div>
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="6. Note OPS & conflits" subtitle="Le contexte saisi ici accompagne chaque sauvegarde." icon={<ShieldAlert size={18} />}>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ex: disponible uniquement Témara matin, éviter missions longues après 17h..." className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-400" />

        <div className="mt-3 space-y-2">
          {conflicts.slice(0, 4).map((mission) => (
            <div key={String(mission.id)} className="rounded-2xl bg-rose-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-rose-900">{mission.familyName || mission.code || `Mission ${mission.id}`}</p>
                <StatusPill status="conflict">Conflit</StatusPill>
              </div>
              <p className="mt-1 text-xs font-semibold text-rose-700">{mission.dateLabel || 'Date non planifiée'} · {valueText(mission.status)}</p>
            </div>
          ))}
          {!conflicts.length ? <EmptyMicro title="Aucun conflit détecté" body="Votre disponibilité actuelle ne bloque pas les missions visibles." /> : null}
        </div>

        <div className="mt-4 flex justify-end">
          <ActionButton disabled={busy} onClick={() => saveRosterUpdate(availabilityType, availability, { section: 'full_roster_sync' })} tone={conflicts.length ? 'amber' : 'emerald'}>Synchroniser roster complet</ActionButton>
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="Historique synchronisé" subtitle="Dernières demandes roster enregistrées côté mobile/OPS." icon={<RefreshCcw size={18} />}>
        <div className="space-y-2">
          {visibleRows.slice(0, 10).map((item) => (
            <div key={String(item.id || `${item.availability_type}-${item.created_at}`)} className="rounded-2xl bg-slate-50 p-3">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">{valueText(item.availability_status || item.availabilityStatus)}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{valueText(item.availability_type || item.availabilityType, 'status_update')} · {dateLabel(item.created_at || item.createdAt)}</p>
                  {item.note ? <p className="mt-1 text-xs leading-5 text-slate-500">{valueText(item.note)}</p> : null}
                </div>
                <StatusPill status={item.conflict_level || item.review_status || 'recorded'}>{valueText(item.conflict_level || item.review_status, 'recorded')}</StatusPill>
              </div>
            </div>
          ))}
          {!visibleRows.length ? <EmptyMicro title="Aucun roster enregistré" body="Sauvegardez un statut, une date ou une zone pour créer le premier enregistrement OPS." /> : null}
        </div>
      </EnterpriseCard>
    </PageShell>
  )
}

function ScheduleSaveActionCard({ title, body, disabled, onClick }: { title: string; body: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="rounded-[1.35rem] border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99] disabled:opacity-50">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-950">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{body}</p>
        </div>
        <span className="rounded-full bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white" style={{ color: "#fff" }}>Save</span>
      </div>
    </button>
  )
}

function ScheduleToggleCard({ active, onClick, title, body }: { active: boolean; onClick: () => void; title: string; body: string }) {
  return (
    <button type="button" onClick={onClick} className={cx('rounded-2xl border p-4 text-left transition active:scale-[0.98]', active ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-600')}>
      <p className="text-sm font-black text-slate-950">{title}</p>
      <p className="mt-1 text-xs font-bold">{body}</p>
    </button>
  )
}


export function EnterprisePaymentsScreen({ workspace, records, runCareLinkAction }: EnterpriseScreenProps) {
  const payments = workspace?.payments
  const disputes = safeArray<Record<string, unknown>>(workspace?.paymentDisputes)
  const [reason, setReason] = useState('')
  const [agentNote, setAgentNote] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [disputeType, setDisputeType] = useState('payment_correction')
  const [selectedLineId, setSelectedLineId] = useState('')
  const [busy, setBusy] = useState(false)
  const lines = payments?.lines || []
  const selectedLine = lines.find((line) => String(line.id) === selectedLineId) || lines[0] || null
  const pendingDisputes = disputes.filter((item) => !['resolved', 'rejected', 'closed'].includes(String(item.status || '').toLowerCase())).length
  const transportLines = lines.filter((line) => String(line.kind || '').toLowerCase().includes('transport'))
  const bonusLines = lines.filter((line) => String(line.kind || '').toLowerCase().includes('bonus') || String(line.label || '').toLowerCase().includes('prime'))

  async function createDispute() {
    if (!reason.trim()) return
    setBusy(true)
    try {
      await runCareLinkAction('/api/carelink/payments/disputes', {
        missionId: selectedLine?.missionId || records[0]?.id || null,
        amountClaimed: Number(selectedLine?.amountMad || 0) || null,
        amountExpected: Number(selectedLine?.amountMad || 0) || null,
        amountPaid: null,
        disputeType,
        targetLineId: selectedLine ? String(selectedLine.id) : null,
        targetLineKind: selectedLine ? String(selectedLine.kind || '') : null,
        evidenceUrl: evidenceUrl || null,
        agentNote: agentNote || null,
        reason: reason.trim(),
        metadata: { source: 'carelink_mobile_p17_payments_honoraires', payment_line: selectedLine || null },
      })
      setReason('')
      setAgentNote('')
      setEvidenceUrl('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell eyebrow="Honoraires & Finance" title="Paiements agent" description="Décompte MAD, transport, primes, validation, paiement et litiges synchronisés avec OPS finance." icon={<WalletCards size={24} />} tone="emerald">
      <div className="grid grid-cols-2 gap-3">
        <GlassStat label="Validé" value={currencyDh(payments?.earned)} icon={<WalletCards size={17} />} tone="emerald" />
        <GlassStat label="En attente" value={currencyDh(payments?.pendingValidation)} icon={<Clock3 size={17} />} tone="amber" />
        <GlassStat label="Transport" value={currencyDh(payments?.transport || transportLines.reduce((sum, line) => sum + Number(line.amountMad || 0), 0))} icon={<Route size={17} />} tone="blue" />
        <GlassStat label="Litiges" value={pendingDisputes} icon={<RefreshCcw size={17} />} tone={pendingDisputes ? 'amber' : 'slate'} />
      </div>

      <EnterpriseCard title="Décompte honoraires" subtitle="Lecture agent des lignes finance: mission, transport, prime, correction, statut et validation." icon={<CreditCard size={18} />}>
        <div className="space-y-2">
          {lines.slice(0, 10).map((line) => (
            <button
              key={String(line.id)}
              type="button"
              onClick={() => setSelectedLineId(String(line.id))}
              className={cx('w-full rounded-2xl border p-3 text-left transition', selectedLine?.id === line.id ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50')}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">{valueText(line.label, 'Ligne honoraires')}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{valueText(line.kind, 'mission')} · {valueText(line.status, 'pending')}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-slate-950">{currencyDh(line.amountMad)}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{dateLabel(line.createdAt)}</p>
                </div>
              </div>
            </button>
          ))}
          {!lines.length ? <EmptyMicro title="Aucune ligne publiée" body="Les honoraires et indemnités apparaîtront après validation OPS finance." /> : null}
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="Analyse rapide" subtitle="Synthèse des catégories qui nécessitent souvent une revue finance." icon={<FileText size={18} />}>
        <div className="grid grid-cols-2 gap-3">
          <GlassStat label="Primes" value={currencyDh(payments?.bonuses || bonusLines.reduce((sum, line) => sum + Number(line.amountMad || 0), 0))} icon={<Award size={17} />} tone="emerald" />
          <GlassStat label="Indemnités" value={currencyDh(payments?.allowances)} icon={<CreditCard size={17} />} tone="blue" />
          <GlassStat label="Payé" value={currencyDh(payments?.paid)} icon={<BadgeCheck size={17} />} tone="emerald" />
          <GlassStat label="Prochain" value={currencyDh(payments?.upcomingPayment)} icon={<CalendarClock size={17} />} tone="slate" />
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="Litige honoraires" subtitle="Demande structurée: ligne concernée, type, montant, preuve et note agent." icon={<RefreshCcw size={18} />}>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['payment_correction', 'Correction'],
            ['transport_allowance', 'Transport'],
            ['bonus', 'Prime'],
            ['deduction', 'Déduction'],
          ].map(([key, label]) => (
            <button key={key} type="button" onClick={() => setDisputeType(key)} className={cx('rounded-2xl px-3 py-3 text-xs font-black ring-1 transition', disputeType === key ? 'bg-slate-950 text-white ring-slate-950' : 'bg-white text-slate-600 ring-slate-200')}>
              {label}
            </button>
          ))}
        </div>
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Expliquez la différence, transport, prime ou correction demandée..." className="mt-3 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400" />
        <textarea value={agentNote} onChange={(event) => setAgentNote(event.target.value)} placeholder="Note complémentaire agent / détails terrain..." className="mt-3 min-h-20 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-400" />
        <input value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} placeholder="Lien preuve si disponible" className="mt-3 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-sky-400" />
        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
          <p className="text-xs font-bold leading-5 text-slate-500">Ligne sélectionnée: <span className="font-black text-slate-900">{selectedLine ? valueText(selectedLine.label, 'Ligne honoraires') : 'Aucune'}</span></p>
          <ActionButton disabled={busy || !reason.trim()} onClick={createDispute} tone="amber">Transmettre</ActionButton>
        </div>
        <div className="mt-4 space-y-2">
          {disputes.slice(0, 5).map((item) => <div key={String(item.id)} className="rounded-2xl bg-slate-50 p-3"><div className="flex justify-between"><p className="text-sm font-black text-slate-950">{valueText(item.reason, 'Litige paiement')}</p><StatusPill status={item.status}>{valueText(item.status, 'pending')}</StatusPill></div><p className="mt-1 text-xs text-slate-500">{valueText(item.disputeType || item.dispute_type, 'correction')} · {dateLabel(item.createdAt || item.created_at)}</p></div>)}
        </div>
      </EnterpriseCard>
    </PageShell>
  )
}

export function EnterpriseSafetyScreen({ workspace, records, runCareLinkAction }: EnterpriseScreenProps) {
  const alerts = safeArray(workspace?.alerts)
  const sosEvents = safeArray<Record<string, unknown>>((workspace as any)?.sosEvents)
  const [note, setNote] = useState('')
  const [severity, setSeverity] = useState('critical')
  const [busy, setBusy] = useState<string | null>(null)
  const critical = alerts.filter((alert: any) => alert.tone === 'red' || String(alert.priority || '').toLowerCase() === 'critical').length
  const next = workspace?.nextMission || records[0] || null
  const openSosEvents = sosEvents.filter((item) => !['resolved', 'closed'].includes(String(item.status || '').toLowerCase()))

  async function sendSafety(type: string) {
    setBusy(type)
    try {
      await runCareLinkAction('/api/carelink/sos', {
        emergencyType: type,
        missionId: next?.id || null,
        severity,
        callbackRequested: type === 'sos' || type === 'callback',
        replacementRequested: type === 'replacement',
        note: note || `Alerte ${type} envoyée depuis CareLink mobile`,
        source: 'carelink_mobile_p18_sos_incident',
        metadata: { selectedMissionCode: next?.code || null },
      })
      setNote('')
    } finally {
      setBusy(null)
    }
  }

  return (
    <PageShell eyebrow="Safety Command" title="Sécurité & SOS" description="Urgence terrain, incident, demande de remplacement, rappel superviseur et preuve de localisation si activée." icon={<HeartPulse size={24} />} tone="rose">
      <div className="grid grid-cols-2 gap-3">
        <GlassStat label="Alertes" value={alerts.length} icon={<ShieldAlert size={17} />} tone={critical ? 'rose' : 'emerald'} />
        <GlassStat label="Critiques" value={critical} icon={<AlertTriangle size={17} />} tone={critical ? 'rose' : 'emerald'} />
        <GlassStat label="SOS ouverts" value={openSosEvents.length} icon={<HeartPulse size={17} />} tone={openSosEvents.length ? 'rose' : 'emerald'} />
        <GlassStat label="Mission" value={next ? next.code : '—'} icon={<ClipboardCheck size={17} />} tone="blue" />
      </div>

      <EnterpriseCard title="Escalade temps réel" subtitle="Crée alerte, notification, message dispatch, audit, SLA et événement SOS mobile." icon={<ShieldAlert size={18} />}>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Contexte urgent, localisation, besoin précis..." className="min-h-24 w-full rounded-2xl border border-rose-100 bg-rose-50/50 px-4 py-3 text-sm outline-none focus:border-rose-400" />
        <div className="mt-3 grid grid-cols-3 gap-2">
          {['normal', 'high', 'critical'].map((item) => (
            <button key={item} type="button" onClick={() => setSeverity(item)} className={cx('rounded-2xl px-3 py-3 text-xs font-black uppercase ring-1 transition', severity === item ? 'bg-rose-600 text-white ring-rose-600' : 'bg-white text-slate-600 ring-slate-200')}>
              {item}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <ActionButton disabled={busy === 'sos'} onClick={() => sendSafety('sos')} tone="rose">SOS</ActionButton>
          <ActionButton disabled={busy === 'incident'} onClick={() => sendSafety('incident')} tone="amber">Incident</ActionButton>
          <ActionButton disabled={busy === 'child_health'} onClick={() => sendSafety('child_health')} tone="rose">Santé enfant</ActionButton>
          <ActionButton disabled={busy === 'family_conflict'} onClick={() => sendSafety('family_conflict')} tone="amber">Famille</ActionButton>
          <ActionButton disabled={busy === 'replacement'} onClick={() => sendSafety('replacement')} tone="amber">Remplacement</ActionButton>
          <ActionButton disabled={busy === 'callback'} onClick={() => sendSafety('callback')} tone="blue">Rappel OPS</ActionButton>
          <ActionButton disabled={busy === 'transport_risk'} onClick={() => sendSafety('transport_risk')} tone="slate">Transport</ActionButton>
          <ActionButton disabled={busy === 'lost_phone'} onClick={() => sendSafety('lost_phone')} tone="slate">Téléphone perdu</ActionButton>
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="Protocole terrain" subtitle="Guidage rapide pour protéger l’enfant, la famille, l’agent et AngelCare." icon={<FileCheck2 size={18} />}>
        <div className="space-y-2">
          <ProtocolStep number="01" title="Sécuriser la situation" body="Éloigner le risque immédiat, rester avec l’enfant si applicable, ne pas quitter sans validation." />
          <ProtocolStep number="02" title="Alerter OPS" body="Utiliser SOS, incident ou message urgent. Ajouter contexte, zone et besoin précis." />
          <ProtocolStep number="03" title="Tracer la preuve" body="Remplir rapport/incident et garder l’historique mobile synchronisé." />
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="Événements SOS" subtitle="Journal mobile P18 des escalades envoyées par l’agent." icon={<HeartPulse size={18} />}>
        <div className="space-y-2">
          {sosEvents.slice(0, 6).map((item) => <div key={String(item.id)} className="rounded-2xl bg-slate-50 p-3"><div className="flex justify-between gap-3"><p className="text-sm font-black text-slate-950">{valueText(item.emergencyType || item.emergency_type, 'SOS')}</p><StatusPill status={item.severity}>{valueText(item.status, 'open')}</StatusPill></div><p className="mt-1 text-xs leading-5 text-slate-500">{valueText(item.note, 'Alerte envoyée')} · {dateLabel(item.createdAt || item.created_at)}</p></div>)}
          {!sosEvents.length ? <EmptyMicro title="Aucun SOS mobile" body="Les événements SOS et incidents envoyés depuis le mobile apparaîtront ici." /> : null}
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="Alertes ouvertes" subtitle="Flux sécurité lié aux missions assignées." icon={<AlertTriangle size={18} />}>
        <div className="space-y-2">
          {alerts.slice(0, 6).map((alert: any) => <div key={String(alert.id)} className="rounded-2xl bg-slate-50 p-3"><div className="flex justify-between gap-3"><p className="text-sm font-black text-slate-950">{valueText(alert.title, 'Alerte')}</p><StatusPill status={alert.tone || alert.priority}>{valueText(alert.tone || alert.priority, 'alert')}</StatusPill></div><p className="mt-1 text-xs leading-5 text-slate-500">{valueText(alert.body)}</p></div>)}
          {!alerts.length ? <EmptyMicro title="Aucune alerte ouverte" body="Les alertes OPS ou mobile apparaîtront ici." /> : null}
        </div>
      </EnterpriseCard>
    </PageShell>
  )
}

function ProtocolStep({ number, title, body }: { number: string; title: string; body: string }) {
  return <div className="flex gap-3 rounded-[1.4rem] bg-slate-50 p-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-slate-950 text-xs font-black text-white">{number}</div><div><p className="text-sm font-black text-slate-950">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{body}</p></div></div>
}

export function EnterpriseOfflineScreen({ workspace, records, runCareLinkAction, pendingCount, syncing, online }: OfflineScreenProps) {
  const securityEvents = getEnterpriseRows(workspace, 'securityEvents')
  const deviceSessions = getEnterpriseRows(workspace, 'deviceSessions')
  const [busy, setBusy] = useState(false)
  const syncScore = online && pendingCount === 0 ? 100 : online ? 70 : 35

  async function sendSyncProbe() {
    setBusy(true)
    try {
      await runCareLinkAction('/api/carelink/presence', {
        eventType: 'sync_probe',
        note: 'Contrôle synchronisation mobile déclenché par agent.',
        source: 'carelink_mobile_offline_center',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell eyebrow="Offline & Device Control" title="Centre synchronisation" description="État réseau, file offline, sessions appareil, sécurité mobile et garantie anti-doublon." icon={online ? <Wifi size={24} /> : <WifiOff size={24} />} tone={online ? 'blue' : 'amber'}>
      <EnterpriseCard title="État synchronisation" subtitle="Contrôle terrain avant action critique." icon={<Cloud size={18} />}>
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-6xl font-black tracking-tight text-slate-950">{syncScore}%</p><p className="mt-1 text-sm font-bold text-slate-500">{online ? 'Réseau disponible' : 'Mode offline'} · {syncing ? 'sync en cours' : 'stable'}</p></div>
          <StatusPill status={online ? 'active' : 'pending'}>{online ? 'online' : 'offline'}</StatusPill>
        </div>
        <div className="mt-4"><ProgressBar value={syncScore} tone={syncScore > 80 ? 'emerald' : syncScore > 50 ? 'amber' : 'rose'} /></div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <GlassStat label="En attente" value={pendingCount} icon={<RefreshCcw size={17} />} tone={pendingCount ? 'amber' : 'emerald'} />
          <GlassStat label="Missions" value={records.length} icon={<ClipboardCheck size={17} />} tone="blue" />
        </div>
        <div className="mt-4 flex justify-end"><ActionButton disabled={busy} onClick={sendSyncProbe} tone="slate">Tester sync</ActionButton></div>
      </EnterpriseCard>

      <EnterpriseCard title="Sessions appareil" subtitle="Fondation P4: sessions, empreinte, révocation et limite de sessions." icon={<Fingerprint size={18} />}>
        <div className="space-y-2">
          {deviceSessions.slice(0, 5).map((item) => <div key={String(item.id || item.device_fingerprint)} className="rounded-2xl bg-slate-50 p-3"><div className="flex justify-between"><p className="text-sm font-black text-slate-950">{valueText(item.device_label || item.device_fingerprint, 'Appareil mobile')}</p><StatusPill status={item.status}>{valueText(item.status, 'active')}</StatusPill></div><p className="mt-1 text-xs text-slate-500">Dernière activité: {dateLabel(item.last_seen_at || item.updated_at || item.created_at)}</p></div>)}
          {!deviceSessions.length ? <EmptyMicro title="Session gouvernée" body="Aucune session détaillée visible, mais les gardes P4 restent actifs côté serveur." /> : null}
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="Événements sécurité" subtitle="Audit mobile: sessions, blocages, accès, révocations et garde appareil." icon={<ShieldCheck size={18} />}>
        <div className="space-y-2">
          {securityEvents.slice(0, 6).map((item) => <div key={String(item.id)} className="rounded-2xl bg-slate-50 p-3"><div className="flex justify-between gap-3"><p className="text-sm font-black text-slate-950">{valueText(item.event_type || item.eventType, 'Security event')}</p><p className="text-xs font-bold text-slate-500">{dateLabel(item.created_at || item.createdAt)}</p></div><p className="mt-1 text-xs leading-5 text-slate-500">{valueText(item.reason || item.message || item.status, 'Audit enregistré')}</p></div>)}
          {!securityEvents.length ? <EmptyMicro title="Aucun événement visible" body="Les événements de sécurité P4 apparaîtront ici après activité mobile." /> : null}
        </div>
      </EnterpriseCard>
    </PageShell>
  )
}

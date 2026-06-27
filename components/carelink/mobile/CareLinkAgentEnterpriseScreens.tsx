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
  const profileRequests = getEnterpriseRows(workspace, 'profileRequests')
  const policyAcknowledgements = getEnterpriseRows(workspace, 'policyAcknowledgements')
  const deviceSessions = getEnterpriseRows(workspace, 'deviceSessions')
  const documents = safeArray<Record<string, unknown>>(workspace?.documents)
  const serviceTypes = Array.from(new Set(records.map((record) => record.serviceType).filter(Boolean))).slice(0, 8)
  const zones = Array.from(new Set(records.map((record) => record.zone).filter(Boolean))).slice(0, 8)
  const profileScore = Number(data?.identity?.profileScore ?? workspace?.readiness?.score ?? 0)

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
    <PageShell eyebrow="Agent Enterprise Dossier" title="Mon dossier professionnel" description="Identité, accès mobile, zones, compétences, conformité, sécurité et demandes de correction synchronisées avec CARELINK-OPS Agents." icon={<UserRound size={24} />} tone="blue">
      <div className="grid grid-cols-2 gap-3">
        <GlassStat label="Profil" value={`${profileScore}%`} icon={<BadgeCheck size={18} />} tone={profileScore >= 80 ? 'emerald' : profileScore >= 55 ? 'amber' : 'rose'} />
        <GlassStat label="Missions" value={records.length} icon={<ClipboardCheck size={18} />} />
        <GlassStat label="Documents" value={documents.length} icon={<FileCheck2 size={18} />} tone="slate" />
        <GlassStat label="Demandes" value={profileRequests.length} icon={<RefreshCcw size={18} />} tone="amber" />
      </div>

      <EnterpriseCard title="Carte agent" subtitle="Lecture directe du profil caregiver lié au compte mobile." icon={<Fingerprint size={18} />}>
        <div className="mb-4 rounded-[1.5rem] bg-gradient-to-br from-slate-950 to-blue-950 p-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-200">AngelCare Field Agent</p>
              <h2 className="mt-2 text-2xl font-black">{valueText((agent as any).full_name || (agent as any).name || (agent as any).display_name, 'Agent CareLink')}</h2>
              <p className="mt-1 text-sm font-semibold text-white/70">{valueText((agent as any).role || (agent as any).agent_role || (agent as any).caregiver_type, 'Caregiver terrain')}</p>
            </div>
            <StatusPill status={(agent as any).status || (agent as any).readiness_status}>{valueText((agent as any).status || (agent as any).readiness_status, 'active')}</StatusPill>
          </div>
          <div className="mt-4"><ProgressBar value={profileScore} tone={profileScore >= 80 ? 'emerald' : profileScore >= 55 ? 'amber' : 'rose'} /></div>
        </div>
        <InfoLine label="Téléphone" value={(agent as any).phone || (agent as any).mobile_phone} icon={<PhoneCall size={16} />} />
        <InfoLine label="Email mobile" value={(agent as any).email || (agent as any).work_email} icon={<LockKeyhole size={16} />} />
        <InfoLine label="Ville / zone" value={`${valueText((agent as any).city, 'Ville non définie')} · ${valueText((agent as any).zone || (agent as any).preferred_zone, 'Zone non définie')}`} icon={<MapPin size={16} />} />
        <InfoLine label="Langues" value={(agent as any).languages || (agent as any).language_skills || data?.identity?.languages} icon={<Languages size={16} />} />
      </EnterpriseCard>

      <EnterpriseCard title="Éligibilité opérationnelle" subtitle="Miroir mobile des zones, services et compétences utilisées par OPS pour assigner les missions." icon={<ShieldCheck size={18} />}>
        <div className="grid grid-cols-2 gap-3">
          <GlassStat label="Services" value={serviceTypes.length || '—'} icon={<Sparkles size={17} />} tone="emerald" />
          <GlassStat label="Zones" value={zones.length || '—'} icon={<MapPin size={17} />} tone="blue" />
        </div>
        <div className="mt-4 space-y-3">
          <div className="rounded-[1.4rem] bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Services visibles</p>
            <div className="mt-2 flex flex-wrap gap-2">{serviceTypes.length ? serviceTypes.map((item) => <StatusPill key={item} status="ready">{item}</StatusPill>) : <span className="text-sm text-slate-500">Aucun service publié.</span>}</div>
          </div>
          <div className="rounded-[1.4rem] bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Zones visibles</p>
            <div className="mt-2 flex flex-wrap gap-2">{zones.length ? zones.map((item) => <StatusPill key={item} status="blue">{item}</StatusPill>) : <span className="text-sm text-slate-500">Aucune zone publiée.</span>}</div>
          </div>
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="Accès mobile & sécurité" subtitle="Contrôle synchronisé avec User / Mobile Access dans OPS Agents." icon={<LockKeyhole size={18} />}>
        <InfoLine label="Session active" value={deviceSessions.length ? `${deviceSessions.length} session(s) connue(s)` : 'Session mobile gouvernée'} icon={<Wifi size={16} />} />
        <InfoLine label="PIN / reset" value={(data?.security?.pinResetRequired || (agent as any).pin_reset_required) ? 'Réinitialisation requise' : 'Aucune réinitialisation requise'} icon={<Fingerprint size={16} />} />
        <InfoLine label="Dernier contrôle" value={dateLabel(workspace?.generatedAt)} icon={<ShieldCheck size={16} />} />
        <div className="mt-3 grid gap-2">
          <RowLink href="/carelink/offline" title="Centre offline & synchronisation" body="Voir les files locales, l’état réseau et les garanties anti-doublon." icon={<Cloud size={17} />} />
          <RowLink href="/carelink/safety" title="Sécurité et SOS" body="Signaler urgence, risque terrain, téléphone perdu ou besoin de rappel superviseur." icon={<ShieldAlert size={17} />} />
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="Demande de correction profil" subtitle="L’agent ne modifie pas directement les champs sensibles: il demande une revue OPS." icon={<RefreshCcw size={18} />}>
        <div className="flex flex-wrap gap-2">
          {[['identity', 'Identité'], ['contact', 'Contact'], ['zone', 'Zone'], ['skills', 'Compétences'], ['documents', 'Documents']].map(([key, label]) => (
            <button key={key} type="button" onClick={() => setRequestKind(key)} className={cx('rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ring-1', requestKind === key ? 'bg-slate-950 text-white ring-slate-950' : 'bg-white text-slate-600 ring-slate-200')}>{label}</button>
          ))}
        </div>
        <textarea value={requestText} onChange={(event) => setRequestText(event.target.value)} placeholder="Décrivez la correction demandée à OPS..." className="mt-3 min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400" />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold leading-5 text-slate-500">La demande sera enregistrée, auditée et visible côté opérations.</p>
          <ActionButton disabled={sending || !requestText.trim()} onClick={sendCorrectionRequest} tone="slate">Envoyer</ActionButton>
        </div>
        <div className="mt-4 space-y-2">
          {profileRequests.slice(0, 3).map((item) => (
            <div key={String(item.id)} className="rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3"><p className="text-sm font-black text-slate-950">{valueText(item.request_type, 'Correction')}</p><StatusPill status={item.status}>{valueText(item.status, 'pending')}</StatusPill></div>
              <p className="mt-1 text-xs leading-5 text-slate-500">{valueText(item.message || item.notes, 'Demande enregistrée')}</p>
            </div>
          ))}
          {!profileRequests.length ? <EmptyMicro title="Aucune correction ouverte" body="Les demandes envoyées depuis le mobile apparaîtront ici." /> : null}
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="Politiques acceptées" subtitle="Preuve d’acceptation mobile des règles terrain, confidentialité, urgence et géolocalisation." icon={<FileCheck2 size={18} />}>
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

export function EnterpriseScheduleScreen({ workspace, records, runCareLinkAction }: EnterpriseScreenProps) {
  const availabilityRows = getEnterpriseRows(workspace, 'availabilityUpdates')
  const presenceEvents = getEnterpriseRows(workspace, 'presenceEvents')
  const days = Array.from(new Set(records.map((item) => item.dateLabel || 'Non planifiée')))
  const [availability, setAvailability] = useState('available')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  async function saveAvailability() {
    setBusy(true)
    try {
      await runCareLinkAction('/api/carelink/availability', {
        availability,
        note: note || `Statut ${availability}`,
        source: 'carelink_mobile_schedule_enterprise',
      })
      setNote('')
    } finally {
      setBusy(false)
    }
  }

  async function markPresence(eventType: string) {
    await runCareLinkAction('/api/carelink/presence', {
      eventType,
      note: `Présence mobile: ${eventType}`,
      source: 'carelink_mobile_schedule_enterprise',
    })
  }

  return (
    <PageShell eyebrow="Roster & Availability" title="Planning entreprise" description="Disponibilités, blocages, présence terrain, trajets et missions publiées par la liaison opérationnelle." icon={<CalendarClock size={24} />} tone="blue">
      <div className="grid grid-cols-2 gap-3">
        <GlassStat label="Jours" value={days.length} icon={<CalendarClock size={17} />} />
        <GlassStat label="Missions" value={records.length} icon={<ClipboardCheck size={17} />} tone="emerald" />
        <GlassStat label="Disponibilités" value={availabilityRows.length} icon={<CheckCircle2 size={17} />} tone="amber" />
        <GlassStat label="Présence" value={presenceEvents.length} icon={<Clock3 size={17} />} tone="slate" />
      </div>

      <EnterpriseCard title="Contrôle disponibilité" subtitle="Statut terrain envoyé à OPS / dispatch avant assignation ou remplacement." icon={<BadgeCheck size={18} />}>
        <div className="flex flex-wrap gap-2">
          {[['available', 'Disponible'], ['limited', 'Disponible sous condition'], ['unavailable', 'Indisponible'], ['emergency_backup', 'Remplacement urgence']].map(([key, label]) => <button key={key} onClick={() => setAvailability(key)} className={cx('rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ring-1', availability === key ? 'bg-slate-950 text-white ring-slate-950' : 'bg-white text-slate-600 ring-slate-200')}>{label}</button>)}
        </div>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Note disponibilité, contrainte transport, zone, horaire..." className="mt-3 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400" />
        <div className="mt-3 flex justify-end"><ActionButton disabled={busy} onClick={saveAvailability} tone="emerald">Synchroniser</ActionButton></div>
      </EnterpriseCard>

      <EnterpriseCard title="Présence terrain" subtitle="Preuve mobile de shift, pause, retour et fin de journée." icon={<Clock3 size={18} />}>
        <div className="grid grid-cols-2 gap-2">
          <ActionButton onClick={() => markPresence('shift_start')} tone="emerald">Start shift</ActionButton>
          <ActionButton onClick={() => markPresence('pause_start')} tone="amber">Pause</ActionButton>
          <ActionButton onClick={() => markPresence('pause_end')} tone="blue">Retour</ActionButton>
          <ActionButton onClick={() => markPresence('shift_end')} tone="slate">End shift</ActionButton>
        </div>
        <div className="mt-4 space-y-2">
          {presenceEvents.slice(0, 4).map((item) => <div key={String(item.id)} className="rounded-2xl bg-slate-50 p-3"><div className="flex justify-between"><p className="text-sm font-black text-slate-950">{valueText(item.event_type || item.eventType)}</p><p className="text-xs font-bold text-slate-500">{dateLabel(item.created_at || item.createdAt)}</p></div></div>)}
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="Timeline missions" subtitle="Vue terrain claire, sans pagination, alignée avec dispatch." icon={<Route size={18} />}>
        <div className="space-y-4">
          {days.map((day) => (
            <div key={day}>
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.26em] text-sky-600">{day}</p>
              <div className="space-y-3">
                {records.filter((item) => (item.dateLabel || 'Non planifiée') === day).map((mission) => (
                  <Link key={mission.id} href={`/carelink/missions/${mission.id}`} className="block rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3 transition active:scale-[0.99]">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-950">{mission.familyName || 'Client'} · {mission.serviceType}</p><p className="mt-1 text-xs font-semibold text-slate-500">{mission.timeLabel || 'Horaire'} · {mission.zone || mission.city}</p></div><StatusPill status={mission.status}>{recordStatus(mission)}</StatusPill></div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {!records.length ? <EmptyMicro title="Aucune mission publiée" body="Les missions assignées apparaîtront ici dès publication OPS." /> : null}
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="Route & transport" subtitle="Synthèse agent des trajets, zones et risques de déplacement." icon={<Navigation size={18} />}>
        <div className="space-y-2">
          {records.slice(0, 4).map((mission) => <RowLink key={mission.id} href={`/carelink/missions/${mission.id}`} title={`${mission.city || 'Ville'} · ${mission.zone || 'Zone'}`} body={`${mission.serviceType} · ${mission.timeLabel || 'Horaire à confirmer'} · ${mission.riskLevel || 'normal'}`} icon={<MapPin size={17} />} />)}
          {!records.length ? <EmptyMicro title="Aucun trajet visible" body="Les trajets et consignes transport seront visibles après assignation." /> : null}
        </div>
      </EnterpriseCard>
    </PageShell>
  )
}

export function EnterprisePaymentsScreen({ workspace, records, runCareLinkAction }: EnterpriseScreenProps) {
  const payments = workspace?.payments
  const disputes = safeArray<Record<string, unknown>>(workspace?.paymentDisputes)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const lines = payments?.lines || []

  async function createDispute() {
    if (!reason.trim()) return
    setBusy(true)
    try {
      await runCareLinkAction('/api/carelink/payments/disputes', {
        missionId: records[0]?.id || null,
        amountClaimed: Number(lines[0]?.amountMad || 0) || null,
        reason: reason.trim(),
        metadata: { source: 'carelink_mobile_payments_enterprise' },
      })
      setReason('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageShell eyebrow="Honoraires & Finance" title="Paiements agent" description="Décompte MAD, transport, primes, validation, paiement et litiges synchronisés avec OPS finance." icon={<WalletCards size={24} />} tone="emerald">
      <div className="grid grid-cols-2 gap-3">
        <GlassStat label="Validé" value={currencyDh(payments?.earned)} icon={<CreditCard size={17} />} tone="emerald" />
        <GlassStat label="En attente" value={currencyDh(payments?.pendingValidation)} icon={<Clock3 size={17} />} tone="amber" />
        <GlassStat label="Transport" value={currencyDh(payments?.transport)} icon={<Route size={17} />} tone="blue" />
        <GlassStat label="Litiges" value={disputes.length} icon={<RefreshCcw size={17} />} tone={disputes.length ? 'rose' : 'slate'} />
      </div>

      <EnterpriseCard title="Décomposition honoraires" subtitle="Lignes de mission, allocations, primes et corrections." icon={<CreditCard size={18} />}>
        <div className="space-y-2">
          {lines.slice(0, 8).map((line) => <div key={line.id} className="rounded-2xl bg-slate-50 p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-black text-slate-950">{line.label}</p><p className="mt-1 text-xs text-slate-500">{line.kind} · {dateLabel(line.createdAt)}</p></div><div className="text-right"><p className="text-sm font-black text-slate-950">{currencyDh(line.amountMad)}</p><StatusPill status={line.status}>{line.status}</StatusPill></div></div></div>)}
          {!lines.length ? <EmptyMicro title="Aucune ligne financière" body="Les honoraires générés par mission apparaîtront ici." /> : null}
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="Cycle de paiement" subtitle="Vision agent claire pour éviter les incompréhensions terrain." icon={<CalendarClock size={18} />}>
        <div className="grid grid-cols-2 gap-3">
          <GlassStat label="Payé" value={currencyDh(payments?.paid)} icon={<CheckCircle2 size={16} />} tone="emerald" />
          <GlassStat label="Prochain" value={currencyDh(payments?.upcomingPayment)} icon={<WalletCards size={16} />} tone="blue" />
          <GlassStat label="Primes" value={currencyDh(payments?.bonuses)} icon={<Star size={16} />} tone="amber" />
          <GlassStat label="Allocations" value={currencyDh(payments?.allowances)} icon={<FileText size={16} />} tone="slate" />
        </div>
      </EnterpriseCard>

      <EnterpriseCard title="Demande de correction / litige" subtitle="Le litige est enregistré et peut être traité par OPS finance." icon={<RefreshCcw size={18} />}>
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Expliquez la différence, transport, prime ou correction demandée..." className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400" />
        <div className="mt-3 flex justify-end"><ActionButton disabled={busy || !reason.trim()} onClick={createDispute} tone="amber">Créer litige</ActionButton></div>
        <div className="mt-4 space-y-2">
          {disputes.slice(0, 4).map((item) => <div key={String(item.id)} className="rounded-2xl bg-slate-50 p-3"><div className="flex justify-between"><p className="text-sm font-black text-slate-950">{valueText(item.reason, 'Litige paiement')}</p><StatusPill status={item.status}>{valueText(item.status, 'pending')}</StatusPill></div><p className="mt-1 text-xs text-slate-500">{dateLabel(item.createdAt || item.created_at)}</p></div>)}
        </div>
      </EnterpriseCard>
    </PageShell>
  )
}

export function EnterpriseSafetyScreen({ workspace, records, runCareLinkAction }: EnterpriseScreenProps) {
  const alerts = safeArray(workspace?.alerts)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const critical = alerts.filter((alert: any) => alert.tone === 'red' || String(alert.priority || '').toLowerCase() === 'critical').length
  const next = workspace?.nextMission || records[0] || null

  async function sendSafety(type: string) {
    setBusy(type)
    try {
      await runCareLinkAction('/api/carelink/sos', {
        emergencyType: type,
        missionId: next?.id || null,
        note: note || `Alerte ${type} envoyée depuis CareLink mobile`,
        source: 'carelink_mobile_safety_enterprise',
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
        <GlassStat label="Mission" value={next ? next.code : '—'} icon={<ClipboardCheck size={17} />} tone="blue" />
        <GlassStat label="Zone" value={next?.zone || '—'} icon={<MapPin size={17} />} tone="slate" />
      </div>

      <EnterpriseCard title="Boutons d’urgence" subtitle="Ces actions créent alertes, notifications, audit et escalade dispatch." icon={<ShieldAlert size={18} />}>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Contexte urgent, localisation, besoin précis..." className="min-h-24 w-full rounded-2xl border border-rose-100 bg-rose-50/50 px-4 py-3 text-sm outline-none focus:border-rose-400" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <ActionButton disabled={busy === 'sos'} onClick={() => sendSafety('sos')} tone="rose">SOS</ActionButton>
          <ActionButton disabled={busy === 'callback'} onClick={() => sendSafety('callback')} tone="blue">Rappel OPS</ActionButton>
          <ActionButton disabled={busy === 'replacement'} onClick={() => sendSafety('replacement')} tone="amber">Remplacement</ActionButton>
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

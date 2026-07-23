'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Crown,
  Headphones,
  LogOut,
  Mail,
  MessageSquareText,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'
import ActionProgressPanel from '@/components/shared/ActionProgressPanel'
import { useActionProgress } from '@/hooks/useActionProgress'
import type { AuthorizedWorkspaceHubData } from '@/lib/workspace-hub/authorized-modules'

type AccountMemo = {
  id: string
  title: string
  message: string
  memo_type: string
  priority: string
  created_at: string
  acknowledgedAt?: string | null
  comment?: string
  commentedAt?: string | null
}

type AccountSpaceData = {
  user: {
    id: string
    fullName: string
    username: string
    email: string
    role: string
    status: string
    department: string
    phone: string
    jobTitle: string
    language: string
    permissions: string[]
  }
  memos: AccountMemo[]
}

const EMAIL_TARGET = 'backoffice@angelcarehub.com'
const HQ_PHONE = '+212 5 37 58 14 62'

const EMAIL_TEMPLATES = [
  {
    key: 'access',
    label: 'Problème d’accès',
    subject: 'Demande d’assistance — Problème d’accès',
    body: 'Bonjour ANGELCARE,\n\nJe rencontre un problème d’accès à mon espace ou à un module autorisé.\n\nMerci de vérifier ma situation et de me confirmer la marche à suivre.\n\nCordialement,',
  },
  {
    key: 'technical',
    label: 'Incident technique',
    subject: 'Signalement — Incident technique',
    body: 'Bonjour ANGELCARE,\n\nJe souhaite signaler un incident technique rencontré sur la plateforme.\n\nDescription de l’incident :\nModule concerné :\nDate et heure :\nImpact observé :\n\nMerci pour votre assistance.\n\nCordialement,',
  },
  {
    key: 'hr',
    label: 'Demande RH',
    subject: 'Demande RH — Assistance collaborateur',
    body: 'Bonjour Service RH,\n\nJe souhaite formuler une demande relative à ma situation administrative ou RH.\n\nObjet de la demande :\nDétail :\n\nMerci pour votre retour.\n\nCordialement,',
  },
  {
    key: 'admin',
    label: 'Demande administrative',
    subject: 'Demande administrative — ANGELCARE',
    body: 'Bonjour Service Administratif,\n\nJe souhaite adresser une demande administrative nécessitant votre assistance.\n\nObjet :\nDétail :\n\nMerci par avance.\n\nCordialement,',
  },
  {
    key: 'schedule',
    label: 'Planning / disponibilité',
    subject: 'Information — Planning et disponibilité',
    body: 'Bonjour ANGELCARE,\n\nJe souhaite vous informer d’un élément concernant mon planning ou ma disponibilité.\n\nDate concernée :\nDétail :\n\nMerci de bien vouloir en tenir compte.\n\nCordialement,',
  },
  {
    key: 'mission',
    label: 'Mission / intervention',
    subject: 'Demande — Mission ou intervention',
    body: 'Bonjour ANGELCARE,\n\nJe souhaite partager une demande ou une remarque concernant une mission/intervention.\n\nMission concernée :\nDate :\nDétail :\n\nMerci pour votre retour.\n\nCordialement,',
  },
  {
    key: 'document',
    label: 'Document / attestation',
    subject: 'Demande de document / attestation',
    body: 'Bonjour ANGELCARE,\n\nJe souhaite demander un document ou une attestation.\n\nDocument demandé :\nMotif :\n\nMerci par avance.\n\nCordialement,',
  },
  {
    key: 'payment',
    label: 'Paiement / compensation',
    subject: 'Demande — Paiement ou compensation',
    body: 'Bonjour ANGELCARE,\n\nJe souhaite adresser une demande concernant un paiement, une compensation ou un suivi financier.\n\nPériode concernée :\nDétail :\n\nMerci de vérifier et de me répondre.\n\nCordialement,',
  },
  {
    key: 'feedback',
    label: 'Suggestion / amélioration',
    subject: 'Suggestion d’amélioration — Plateforme ANGELCARE',
    body: 'Bonjour ANGELCARE,\n\nJe souhaite partager une suggestion d’amélioration concernant la plateforme ou l’organisation interne.\n\nSuggestion :\nBénéfice attendu :\n\nMerci pour votre écoute.\n\nCordialement,',
  },
  {
    key: 'urgent',
    label: 'Demande urgente',
    subject: 'Demande urgente — Assistance nécessaire',
    body: 'Bonjour ANGELCARE,\n\nJe vous contacte pour une demande urgente nécessitant une attention rapide.\n\nSujet :\nDétail :\nImpact :\n\nMerci de me répondre dès que possible.\n\nCordialement,',
  },
]

function encodeMailto(subject: string, body: string) {
  return `mailto:${EMAIL_TARGET}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 px-3 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-md">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
          {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</span>
      </div>
      <span className="min-w-0 truncate text-right text-sm font-black text-slate-900">{value || '—'}</span>
    </div>
  )
}

export default function PersonalAccountSpace({ hubUser }: { hubUser: AuthorizedWorkspaceHubData['user'] }) {
  const [data, setData] = useState<AccountSpaceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [emailOpen, setEmailOpen] = useState(false)
  const [phoneOpen, setPhoneOpen] = useState(false)
  const [memoOpen, setMemoOpen] = useState<string | null>(null)
  const [templateKey, setTemplateKey] = useState(EMAIL_TEMPLATES[0].key)
  const [customMessage, setCustomMessage] = useState('')
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const progress = useActionProgress()

  const selectedTemplate = useMemo(() => {
    return EMAIL_TEMPLATES.find((item) => item.key === templateKey) || EMAIL_TEMPLATES[0]
  }, [templateKey])

  async function loadAccountSpace(showProgress = false) {
    if (showProgress) {
      progress.startAction({
        title: 'Refresh Personal Space',
        subtitle: 'Reloading account details and broadcast messages.',
        steps: [
          { id: 'profile', label: 'Load profile', percent: 35 },
          { id: 'memos', label: 'Load memos', percent: 75 },
          { id: 'complete', label: 'Personal space ready', percent: 100 },
        ],
      })
      progress.setStep('profile', 'running', 'Loading synced account profile…', 35)
    }

    try {
      setLoading(true)
      const response = await fetch('/api/workspace-hub/account-space', { cache: 'no-store' })
      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Unable to load personal account space.')
      }

      setData(payload.data)
      if (showProgress) {
        progress.setStep('memos', 'done', 'Broadcast messages loaded.', 80)
        progress.completeAction('Personal space refreshed successfully.', {
          memos: payload.data?.memos?.length || 0,
        })
      }
    } catch (error) {
      if (showProgress) progress.failAction(error instanceof Error ? error.message : 'Unable to refresh personal space.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAccountSpace(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function acknowledgeMemo(memoId: string) {
    progress.startAction({
      title: 'Acknowledge Memo',
      subtitle: 'Confirming receipt of internal broadcast.',
      steps: [
        { id: 'send', label: 'Send acknowledgement', percent: 60 },
        { id: 'refresh', label: 'Refresh member suite', percent: 90 },
        { id: 'complete', label: 'Acknowledgement saved', percent: 100 },
      ],
    })

    try {
      progress.setStep('send', 'running', 'Saving acknowledgement…', 60)
      const response = await fetch(`/api/workspace-hub/memos/${memoId}/ack`, { method: 'POST' })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'Acknowledgement failed.')

      progress.setStep('refresh', 'running', 'Refreshing memo board…', 90)
      await loadAccountSpace(false)
      progress.completeAction('Memo receipt acknowledged successfully.')
    } catch (error) {
      progress.failAction(error instanceof Error ? error.message : 'Unable to acknowledge memo.')
    }
  }

  async function submitComment(memoId: string) {
    const comment = String(commentDrafts[memoId] || '').trim()
    if (!comment) return

    progress.startAction({
      title: 'Send Memo Comment',
      subtitle: 'Saving your reply to the broadcast memo.',
      steps: [
        { id: 'validate', label: 'Validate comment', percent: 20 },
        { id: 'send', label: 'Save comment', percent: 70 },
        { id: 'refresh', label: 'Refresh member suite', percent: 95 },
        { id: 'complete', label: 'Comment saved', percent: 100 },
      ],
    })

    try {
      progress.setStep('validate', 'done', 'Comment ready.', 20)
      progress.setStep('send', 'running', 'Saving comment…', 70)
      const response = await fetch(`/api/workspace-hub/memos/${memoId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'Comment failed.')

      setCommentDrafts((current) => ({ ...current, [memoId]: '' }))
      progress.setStep('refresh', 'running', 'Refreshing memo board…', 95)
      await loadAccountSpace(false)
      progress.completeAction('Your comment was saved successfully.')
    } catch (error) {
      progress.failAction(error instanceof Error ? error.message : 'Unable to save comment.')
    }
  }

  function openEmailClient() {
    const user = data?.user
    const signature = `\n\n---\nNom: ${user?.fullName || hubUser.name}\nUtilisateur: ${user?.username || hubUser.username}\nRôle: ${user?.role || hubUser.role}\nEmail: ${user?.email || hubUser.email}`
    const body = `${selectedTemplate.body}\n\n${customMessage ? `Message complémentaire:\n${customMessage}\n` : ''}${signature}`
    window.location.href = encodeMailto(selectedTemplate.subject, body)
  }

  function disconnect() {
    progress.startAction({
      title: 'Disconnect from System',
      subtitle: 'Ending current session.',
      steps: [
        { id: 'logout', label: 'Request logout', percent: 60 },
        { id: 'redirect', label: 'Redirect to login', percent: 100 },
      ],
    })

    progress.setStep('logout', 'running', 'Disconnecting user session…', 60)

    fetch('/api/auth/logout', { method: 'POST' })
      .catch(() => null)
      .finally(() => {
        progress.setStep('redirect', 'done', 'Redirecting…', 100)
        progress.completeAction('You are being redirected to login.')
        window.setTimeout(() => {
          window.location.href = '/login'
        }, 450)
      })
  }

  const account = data?.user
  const memos = data?.memos || []
  const unreadMemos = memos.filter((memo) => !memo.acknowledgedAt).length

  return (
    <section className="relative mt-4 overflow-hidden rounded-[38px] border border-white/90 bg-white/90 p-[1px] shadow-[0_30px_100px_rgba(15,23,42,0.09)] ring-1 ring-slate-200/70 backdrop-blur-xl">
      <ActionProgressPanel progress={progress.progress} onClose={progress.closeProgress} />

      <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#e11d48_0%,#e11d48_12%,#1d4ed8_12%,#1d4ed8_68%,#0ea5e9_68%,#0ea5e9_86%,#16a34a_86%)]" />
      <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-200/45 blur-3xl" />
      <div className="absolute -right-20 top-8 h-64 w-64 rounded-full bg-cyan-100/55 blur-3xl" />

      <div className="relative rounded-[37px] bg-gradient-to-br from-white via-white to-blue-50/45 p-5 lg:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-700 shadow-sm">
              <Crown className="h-4 w-4" />
              SANILA Member Space
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.06em] text-slate-950">Your identity, messages & direct support</h2>
            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">
              Your trusted member suite for internal memos, verified identity, direct headquarters assistance and secure session control.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadAccountSpace(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              <Clock3 className="h-4 w-4" />
              Refresh member suite
            </button>
            <button
              type="button"
              onClick={disconnect}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0b2f78] to-blue-700 px-4 py-3 text-sm font-black text-white shadow-[0_18px_42px_rgba(29,78,216,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(29,78,216,0.30)]"
            >
              <LogOut className="h-4 w-4" />
              Disconnect
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_.9fr_.9fr]">
          <div className="relative overflow-hidden rounded-[30px] border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 shadow-[0_18px_50px_rgba(30,64,175,0.08)]">
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-200/60 blur-3xl" />
            <div className="relative flex items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-blue-700">
                  <MessageSquareText className="h-4 w-4" />
                  Personal command messages
                </div>
                <div className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950">{unreadMemos} pending</div>
                <p className="mt-1 text-xs font-semibold text-slate-600">Live internal communications entrusted to your profile and requiring acknowledgement or response.</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_18px_42px_rgba(37,99,235,0.26)]">
                {unreadMemos ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
              </div>
            </div>

            <div className="relative mt-4 space-y-3">
              {loading ? (
                <div className="rounded-2xl border border-blue-100 bg-white p-4 text-sm font-semibold text-slate-500">Loading broadcast board…</div>
              ) : memos.length ? (
                memos.slice(0, 3).map((memo) => (
                  <div key={memo.id} className="rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
                            {memo.memo_type}
                          </span>
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                            memo.acknowledgedAt
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-amber-200 bg-amber-50 text-amber-700'
                          }`}>
                            {memo.acknowledgedAt ? 'Acknowledged' : 'Pending'}
                          </span>
                        </div>
                        <div className="mt-2 text-sm font-black text-slate-950">{memo.title}</div>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{memo.message}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMemoOpen(memoOpen === memo.id ? null : memo.id)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
                      >
                        <ChevronDown className={`h-4 w-4 transition ${memoOpen === memo.id ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {memoOpen === memo.id ? (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <p className="text-sm leading-6 text-slate-700">{memo.message}</p>

                        {!memo.acknowledgedAt ? (
                          <button
                            type="button"
                            onClick={() => void acknowledgeMemo(memo.id)}
                            className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Acknowledge receipt
                          </button>
                        ) : null}

                        <textarea
                          value={commentDrafts[memo.id] ?? memo.comment ?? ''}
                          onChange={(event) => setCommentDrafts((current) => ({ ...current, [memo.id]: event.target.value }))}
                          placeholder="Leave a comment or reply…"
                          className="mt-3 min-h-[90px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                        />

                        <button
                          type="button"
                          onClick={() => void submitComment(memo.id)}
                          className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white"
                        >
                          <Send className="h-4 w-4" />
                          Save comment
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-blue-100 bg-white p-4 text-sm font-semibold text-slate-500">No active broadcast memo.</div>
              )}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-5 shadow-[0_18px_50px_rgba(49,46,129,0.08)]">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-200/60 blur-3xl" />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-indigo-700">
                  <UserRound className="h-4 w-4" />
                  Verified identity
                </div>
                <div className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950">{account?.fullName || hubUser.name}</div>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0b2f78] to-indigo-600 text-white shadow-[0_18px_42px_rgba(49,46,129,0.24)]">
                <BadgeCheck className="h-6 w-6" />
              </div>
            </div>

            <div className="relative mt-4 grid gap-2">
              <InfoRow icon={<UserRound className="h-4 w-4" />} label="Username" value={account?.username || hubUser.username || '—'} />
              <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={account?.email || hubUser.email || '—'} />
              <InfoRow icon={<ShieldCheck className="h-4 w-4" />} label="Role" value={account?.role || hubUser.role || '—'} />
              <InfoRow icon={<Building2 className="h-4 w-4" />} label="Department" value={account?.department || hubUser.department || '—'} />
              <InfoRow icon={<Sparkles className="h-4 w-4" />} label="Permissions" value={`${account?.permissions?.length ?? hubUser.permissionCount} keys`} />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-5 shadow-[0_18px_50px_rgba(5,150,105,0.08)]">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-200/60 blur-3xl" />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                  <Headphones className="h-4 w-4" />
                  Priority headquarters access
                </div>
                <div className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950">Direct support channel</div>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-[0_18px_42px_rgba(5,150,105,0.24)]">
                <Building2 className="h-6 w-6" />
              </div>
            </div>

            <div className="relative mt-4 grid gap-3">
              <button
                type="button"
                onClick={() => setEmailOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-[0_16px_36px_rgba(37,99,235,0.22)] transition hover:bg-blue-700"
              >
                <Mail className="h-4 w-4" />
                Write to Headquarters
              </button>

              <button
                type="button"
                onClick={() => setPhoneOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-[0_16px_36px_rgba(5,150,105,0.20)] transition hover:bg-emerald-700"
              >
                <Phone className="h-4 w-4" />
                Call HR / Admin services
              </button>

              <div className="rounded-2xl border border-emerald-100 bg-white/85 p-3 text-xs font-semibold leading-5 text-slate-600">
                Professional request templates are ready for <strong>{EMAIL_TARGET}</strong> and automatically include your verified profile signature.
              </div>
            </div>
          </div>
        </div>
      </div>

      {emailOpen ? (
        <div className="fixed inset-0 z-[9998] bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-[32px] bg-white shadow-[0_30px_100px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white p-5">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">Email template</div>
                <h3 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950">Contact AngelCare Headquarters</h3>
              </div>
              <button onClick={() => setEmailOpen(false)} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 p-5">
              <select
                value={templateKey}
                onChange={(event) => setTemplateKey(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              >
                {EMAIL_TEMPLATES.map((template) => (
                  <option key={template.key} value={template.key}>{template.label}</option>
                ))}
              </select>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Subject</div>
                <div className="mt-1 text-sm font-black text-slate-950">{selectedTemplate.subject}</div>
                <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700">
                  {selectedTemplate.body}
                </div>
              </div>

              <textarea
                value={customMessage}
                onChange={(event) => setCustomMessage(event.target.value)}
                placeholder="Optional additional message…"
                className="min-h-[120px] rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />

              <button
                type="button"
                onClick={openEmailClient}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
              >
                <Mail className="h-4 w-4" />
                Open secure email composer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {phoneOpen ? (
        <div className="fixed inset-0 z-[9998] bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="mx-auto mt-24 max-w-md rounded-[32px] bg-white p-6 text-center shadow-[0_30px_100px_rgba(15,23,42,0.35)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Phone className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-2xl font-black tracking-[-0.05em] text-slate-950">HR / Admin Services</h3>
            <p className="mt-2 text-sm text-slate-600">Call ANGELCARE headquarters:</p>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-2xl font-black text-slate-950">
              {HQ_PHONE}
            </div>
            <div className="mt-5 flex gap-2">
              <a href="tel:+212537581462" className="flex-1 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
                Call now
              </a>
              <button onClick={() => setPhoneOpen(false)} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700">
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

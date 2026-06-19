'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Filter,
  Megaphone,
  MessageSquareReply,
  RadioTower,
  Search,
  Send,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import ActionProgressPanel from '@/components/shared/ActionProgressPanel'
import { useActionProgress } from '@/hooks/useActionProgress'
import { BROADCAST_SITUATIONS, BROADCAST_TEMPLATES_BY_SITUATION } from '@/lib/users/broadcast-templates'

type BroadcastUser = {
  id: string
  full_name?: string | null
  username?: string | null
  email?: string | null
  role?: string | null
  status?: string | null
  department?: string | null
  job_title?: string | null
}

type BroadcastReceipt = {
  id: string
  memo_id: string
  user_id: string
  acknowledged_at?: string | null
  comment?: string | null
  commented_at?: string | null
  admin_response?: string | null
  admin_responded_at?: string | null
  followup_status?: string | null
  user?: BroadcastUser | null
}

type BroadcastMemo = {
  id: string
  title: string
  message: string
  memo_type: string
  priority: string
  status: string
  admin_status: string
  situation_key?: string | null
  situation_label?: string | null
  template_key?: string | null
  template_label?: string | null
  created_at: string
  reminder_count?: number
  last_reminder_at?: string | null
  targetUsers: BroadcastUser[]
  receipts: BroadcastReceipt[]
  stats: {
    targetCount: number
    acknowledgedCount: number
    pendingCount: number
    commentCount: number
    openCommentCount: number
    delayed: boolean
    reminderCount: number
  }
}

type BroadcastData = {
  users: BroadcastUser[]
  usersLoadError?: string | null
  memos: BroadcastMemo[]
}

const SITUATIONS = BROADCAST_SITUATIONS
const TEMPLATES_BY_SITUATION = BROADCAST_TEMPLATES_BY_SITUATION

function userLabel(user: BroadcastUser) {
  return user.full_name || user.username || user.email || 'Utilisateur'
}

export default function BroadcastControlTower() {
  const [data, setData] = useState<BroadcastData>({ users: [], memos: [] })
  const [loading, setLoading] = useState(true)
  const [composerOpen, setComposerOpen] = useState(false)
  const [expandedMemo, setExpandedMemo] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('open')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [userQuery, setUserQuery] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [situationKey, setSituationKey] = useState(SITUATIONS[0].key)
  const [templateKey, setTemplateKey] = useState(TEMPLATES_BY_SITUATION[SITUATIONS[0].key][0].key)
  const [title, setTitle] = useState(TEMPLATES_BY_SITUATION[SITUATIONS[0].key][0].title)
  const [message, setMessage] = useState(TEMPLATES_BY_SITUATION[SITUATIONS[0].key][0].message)
  const [priority, setPriority] = useState('normal')
  const [responses, setResponses] = useState<Record<string, string>>({})
  const progress = useActionProgress()

  const currentSituation = SITUATIONS.find((item) => item.key === situationKey) || SITUATIONS[0]
  const currentTemplates = TEMPLATES_BY_SITUATION[situationKey] || TEMPLATES_BY_SITUATION[SITUATIONS[0].key]
  const currentTemplate = currentTemplates.find((item) => item.key === templateKey) || currentTemplates[0]

  useEffect(() => {
    void refresh(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function applyTemplate(nextSituationKey: string, nextTemplateKey: string) {
    const situation = SITUATIONS.find((item) => item.key === nextSituationKey) || SITUATIONS[0]
    const templates = TEMPLATES_BY_SITUATION[nextSituationKey] || TEMPLATES_BY_SITUATION[SITUATIONS[0].key]
    const template = templates.find((item) => item.key === nextTemplateKey) || templates[0]

    setSituationKey(situation.key)
    setTemplateKey(template.key)
    setTitle(template.title)
    setMessage(template.message)
  }

  async function refresh(showProgress = true) {
    if (showProgress) {
      progress.startAction({
        title: 'Refresh Broadcast Control',
        subtitle: 'Loading users, broadcasts and live receipt statistics.',
        steps: [
          { id: 'users', label: 'Load users', percent: 30 },
          { id: 'memos', label: 'Load broadcast rows', percent: 65 },
          { id: 'stats', label: 'Calculate live stats', percent: 90 },
          { id: 'complete', label: 'Control tower ready', percent: 100 },
        ],
      })
    }

    try {
      setLoading(true)
      if (showProgress) progress.setStep('users', 'running', 'Loading user targets…', 30)
      const response = await fetch('/api/users/broadcast-control', { cache: 'no-store' })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'Unable to load broadcast control.')
      setData(payload.data)
      if (showProgress) {
        progress.setStep('stats', 'done', 'Live broadcast stats calculated.', 95)
        progress.completeAction('Broadcast Control Tower refreshed.', {
          users: payload.data?.users?.length || 0,
          memos: payload.data?.memos?.length || 0,
        })
      }
    } catch (error) {
      if (showProgress) progress.failAction(error instanceof Error ? error.message : 'Unable to refresh broadcast control.')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase()
    return data.users.filter((user) => {
      const haystack = `${user.full_name || ''} ${user.username || ''} ${user.email || ''} ${user.role || ''} ${user.department || ''}`.toLowerCase()
      return !q || haystack.includes(q)
    })
  }, [data.users, userQuery])

  const filteredMemos = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.memos.filter((memo) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'open' && memo.status === 'active') ||
        (statusFilter === 'closed' && memo.status === 'closed') ||
        (statusFilter === 'comments' && memo.stats.openCommentCount > 0) ||
        (statusFilter === 'delayed' && memo.stats.delayed)

      const matchesPriority = priorityFilter === 'all' || memo.priority === priorityFilter
      const haystack = `${memo.title} ${memo.message} ${memo.situation_label || ''} ${memo.template_label || ''}`.toLowerCase()
      return matchesStatus && matchesPriority && (!q || haystack.includes(q))
    })
  }, [data.memos, priorityFilter, query, statusFilter])

  function toggleUser(userId: string) {
    setSelectedUserIds((current) => current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId])
  }

  function selectAllFilteredUsers() {
    setSelectedUserIds((current) => Array.from(new Set([...current, ...filteredUsers.map((user) => String(user.id))])))
  }

  function clearUsers() {
    setSelectedUserIds([])
  }

  async function broadcast() {
    progress.startAction({
      title: 'Broadcast Memo',
      subtitle: 'Preparing and publishing internal memo to selected users.',
      steps: [
        { id: 'validate', label: 'Validate broadcast', percent: 20 },
        { id: 'targets', label: 'Confirm target users', percent: 40 },
        { id: 'publish', label: 'Publish memo', percent: 75 },
        { id: 'refresh', label: 'Refresh live rows', percent: 95 },
        { id: 'complete', label: 'Broadcast complete', percent: 100 },
      ],
    })

    try {
      if (!selectedUserIds.length) throw new Error('Select at least one user target.')
      progress.setStep('validate', 'done', 'Broadcast content is ready.', 20)
      progress.setStep('targets', 'done', `${selectedUserIds.length} user target(s) selected.`, 40)
      progress.setStep('publish', 'running', 'Publishing broadcast memo…', 75)

      const response = await fetch('/api/users/broadcast-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          priority,
          situationKey,
          situationLabel: currentSituation.label,
          templateKey,
          templateLabel: currentTemplate.label,
          targetUserIds: selectedUserIds,
          targetRoles: [],
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'Broadcast failed.')

      setComposerOpen(false)
      setSelectedUserIds([])
      progress.setStep('refresh', 'running', 'Refreshing broadcast rows…', 95)
      await refresh(false)
      progress.completeAction('Broadcast memo published successfully.', { targets: selectedUserIds.length })
    } catch (error) {
      progress.failAction(error instanceof Error ? error.message : 'Unable to broadcast memo.')
    }
  }

  async function memoAction(memoId: string, action: 'reminder' | 'close') {
    progress.startAction({
      title: action === 'reminder' ? 'Push Reminder' : 'Close Broadcast',
      subtitle: action === 'reminder' ? 'Updating reminder indicator.' : 'Closing broadcast from admin and user systems.',
      steps: [
        { id: 'execute', label: 'Execute action', percent: 70 },
        { id: 'refresh', label: 'Refresh rows', percent: 95 },
        { id: 'complete', label: 'Action complete', percent: 100 },
      ],
    })

    try {
      progress.setStep('execute', 'running', action === 'reminder' ? 'Pushing reminder marker…' : 'Closing broadcast…', 70)
      const response = await fetch(`/api/users/broadcast-control/memos/${memoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'Action failed.')
      progress.setStep('refresh', 'running', 'Refreshing broadcast control rows…', 95)
      await refresh(false)
      if (action === 'close') setExpandedMemo(null)
      progress.completeAction(action === 'reminder' ? 'Reminder indicator updated.' : 'Broadcast closed successfully.')
    } catch (error) {
      progress.failAction(error instanceof Error ? error.message : 'Unable to update broadcast.')
    }
  }

  async function receiptAction(receiptId: string, action: 'respond' | 'close') {
    progress.startAction({
      title: action === 'respond' ? 'Respond to Comment' : 'Close Comment Follow-up',
      subtitle: 'Updating memo follow-up status.',
      steps: [
        { id: 'save', label: 'Save follow-up', percent: 75 },
        { id: 'refresh', label: 'Refresh card', percent: 95 },
        { id: 'complete', label: 'Follow-up complete', percent: 100 },
      ],
    })

    try {
      const adminResponse = responses[receiptId] || ''
      progress.setStep('save', 'running', 'Saving admin follow-up…', 75)
      const response = await fetch(`/api/users/broadcast-control/receipts/${receiptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminResponse }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || 'Follow-up failed.')
      setResponses((current) => ({ ...current, [receiptId]: '' }))
      progress.setStep('refresh', 'running', 'Refreshing comment indicators…', 95)
      await refresh(false)
      if (action === 'close') setExpandedMemo(null)
      progress.completeAction('Follow-up updated successfully.')
    } catch (error) {
      progress.failAction(error instanceof Error ? error.message : 'Unable to update comment follow-up.')
    }
  }

  const totals = useMemo(() => {
    return data.memos.reduce(
      (acc, memo) => {
        acc.targets += memo.stats.targetCount
        acc.ack += memo.stats.acknowledgedCount
        acc.pending += memo.stats.pendingCount
        acc.comments += memo.stats.openCommentCount
        acc.delayed += memo.stats.delayed ? 1 : 0
        return acc
      },
      { targets: 0, ack: 0, pending: 0, comments: 0, delayed: 0 },
    )
  }, [data.memos])

  return (
    <section className="mt-6 rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <ActionProgressPanel progress={progress.progress} onClose={progress.closeProgress} />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-orange-700">
            <RadioTower className="h-4 w-4" />
            Broadcast Control Tower
          </div>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.06em] text-slate-950">User messages, receipts and follow-up</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">
            Broadcast targeted French memos to one or multiple users, track acknowledgements, push reminders and close completed follow-ups.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-4 py-3 text-sm font-black text-white shadow-[0_16px_36px_rgba(234,88,12,0.22)] transition hover:bg-orange-700"
          >
            <Megaphone className="h-4 w-4" />
            Broadcast message
          </button>

          <button
            type="button"
            onClick={() => void refresh(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            <Clock3 className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['Targets', totals.targets],
          ['Acknowledged', totals.ack],
          ['Pending', totals.pending],
          ['Open comments', totals.comments],
          ['Delayed', totals.delayed],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-2xl font-black text-slate-950">{value}</div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[26px] border border-slate-200 bg-slate-50 p-3">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_190px_190px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search broadcasts, situations or templates…"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
          >
            <option value="open">Open broadcasts</option>
            <option value="comments">Open comments</option>
            <option value="delayed">Delayed</option>
            <option value="closed">Closed</option>
            <option value="all">All</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
          >
            <option value="all">All priorities</option>
            <option value="normal">Normal</option>
            <option value="important">Important</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
            Loading broadcast control…
          </div>
        ) : expandedMemo ? (
          (() => {
            const memo = data.memos.find((item) => item.id === expandedMemo)

            if (!memo) {
              return (
                <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-sm">
                  <div className="text-lg font-black text-slate-950">Broadcast not found.</div>
                  <button
                    type="button"
                    onClick={() => setExpandedMemo(null)}
                    className="mt-4 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
                  >
                    Back to cards
                  </button>
                </div>
              )
            }

            const needsFollowUp = memo.stats.openCommentCount > 0

            return (
              <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
                <div className={`relative overflow-hidden p-5 ${
                  needsFollowUp
                    ? 'bg-gradient-to-br from-orange-50 via-white to-amber-50'
                    : 'bg-gradient-to-br from-white via-white to-slate-50'
                }`}>
                  <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange-100/70 blur-3xl" />
                  <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
                          {memo.situation_label || memo.memo_type}
                        </span>
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                          memo.stats.pendingCount === 0
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                        }`}>
                          {memo.stats.acknowledgedCount}/{memo.stats.targetCount} read
                        </span>
                        {needsFollowUp ? (
                          <span className="rounded-full border border-orange-300 bg-orange-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-orange-800">
                            Comment follow-up
                          </span>
                        ) : null}
                        {memo.stats.delayed ? (
                          <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-rose-700">
                            Delayed
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-3 text-3xl font-black tracking-[-0.06em] text-slate-950">
                        {memo.title}
                      </h3>

                      <p className="mt-3 max-w-5xl whitespace-pre-line text-sm leading-7 text-slate-700">
                        {memo.message}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedMemo(null)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50"
                      >
                        Back to cards
                      </button>

                      <button
                        type="button"
                        onClick={() => void memoAction(memo.id, 'reminder')}
                        className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-black text-blue-700"
                      >
                        <BellRing className="h-4 w-4" />
                        Push reminder
                      </button>

                      <button
                        type="button"
                        onClick={() => void memoAction(memo.id, 'close')}
                        className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Mark done / close
                      </button>
                    </div>
                  </div>

                  <div className="relative mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                      <div className="text-2xl font-black text-slate-950">{memo.stats.targetCount}</div>
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Targets</div>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                      <div className="text-2xl font-black text-emerald-700">{memo.stats.acknowledgedCount}</div>
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Read</div>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                      <div className="text-2xl font-black text-amber-700">{memo.stats.pendingCount}</div>
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Pending</div>
                    </div>
                    <div className={`rounded-2xl border p-4 shadow-sm ${
                      memo.stats.openCommentCount > 0
                        ? 'border-orange-300 bg-orange-100'
                        : 'border-slate-200 bg-white/90'
                    }`}>
                      <div className="text-2xl font-black text-orange-700">{memo.stats.openCommentCount}</div>
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">Open comments</div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-slate-50 p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Target users and follow-up</div>
                      <div className="mt-1 text-sm font-semibold text-slate-600">
                        Review read status, comments, admin responses and completion state.
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                    {memo.targetUsers.map((target) => {
                      const receipt = memo.receipts.find((item) => String(item.user_id) === String(target.id))
                      const receiptId = receipt?.id
                      const hasComment = Boolean(String(receipt?.comment || '').trim())
                      const openComment = hasComment && receipt?.followup_status !== 'closed'

                      return (
                        <div key={target.id} className={`rounded-[24px] border bg-white p-4 shadow-sm ${
                          openComment ? 'border-orange-300 ring-4 ring-orange-100' : 'border-slate-200'
                        }`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate font-black text-slate-950">{userLabel(target)}</div>
                              <div className="truncate text-xs font-semibold text-slate-500">{target.email || target.username}</div>
                              <div className="mt-1 truncate text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                {target.role || 'user'} · {target.department || 'department'}
                              </div>
                            </div>
                            <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${
                              receipt?.acknowledged_at
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-amber-200 bg-amber-50 text-amber-700'
                            }`}>
                              {receipt?.acknowledged_at ? 'Read' : 'Pending'}
                            </span>
                          </div>

                          {hasComment ? (
                            <div className="mt-3 rounded-2xl border border-orange-200 bg-orange-50 p-3">
                              <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">
                                User comment
                              </div>
                              <p className="mt-2 text-sm leading-6 text-slate-700">{receipt?.comment}</p>

                              {receipt?.admin_response ? (
                                <div className="mt-3 rounded-xl bg-white p-3 text-sm font-semibold text-slate-700">
                                  <strong>Admin response:</strong> {receipt.admin_response}
                                </div>
                              ) : null}

                              {receiptId && receipt?.followup_status !== 'closed' ? (
                                <div className="mt-3 grid gap-2">
                                  <textarea
                                    value={responses[receiptId] || ''}
                                    onChange={(event) => setResponses((current) => ({ ...current, [receiptId]: event.target.value }))}
                                    placeholder="Respond to this user comment…"
                                    className="min-h-[80px] rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                                  />
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => void receiptAction(receiptId, 'respond')}
                                      className="rounded-xl bg-orange-600 px-3 py-2 text-xs font-black text-white"
                                    >
                                      Respond
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void receiptAction(receiptId, 'close')}
                                      className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white"
                                    >
                                      Mark complete
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-500">
                              No comment submitted by this user.
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>
            )
          })()
        ) : filteredMemos.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {filteredMemos.map((memo) => {
              const needsFollowUp = memo.stats.openCommentCount > 0
              const fullyRead = memo.stats.pendingCount === 0

              return (
                <button
                  key={memo.id}
                  type="button"
                  onClick={() => setExpandedMemo(memo.id)}
                  className={`group relative aspect-square overflow-hidden rounded-[28px] border bg-white p-4 text-left shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.13)] ${
                    needsFollowUp
                      ? 'border-orange-300 ring-orange-100 animate-pulse'
                      : fullyRead
                        ? 'border-emerald-200 ring-emerald-100'
                        : memo.stats.delayed
                          ? 'border-rose-200 ring-rose-100'
                          : 'border-slate-200 ring-slate-100'
                  }`}
                >
                  <div className={`absolute inset-x-0 top-0 h-1.5 ${
                    needsFollowUp
                      ? 'bg-orange-500'
                      : fullyRead
                        ? 'bg-emerald-500'
                        : memo.stats.delayed
                          ? 'bg-rose-500'
                          : 'bg-slate-950'
                  }`} />

                  <div className="flex items-start justify-between gap-2 pt-1">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)] ${
                      needsFollowUp
                        ? 'bg-orange-600'
                        : fullyRead
                          ? 'bg-emerald-600'
                          : memo.stats.delayed
                            ? 'bg-rose-600'
                            : 'bg-slate-950'
                    }`}>
                      {needsFollowUp ? <AlertTriangle className="h-5 w-5" /> : fullyRead ? <CheckCircle2 className="h-5 w-5" /> : <BellRing className="h-5 w-5" />}
                    </div>

                    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${
                      fullyRead
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}>
                      {memo.stats.acknowledgedCount}/{memo.stats.targetCount}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="line-clamp-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">
                      {memo.situation_label || memo.memo_type}
                    </div>
                    <h3 className="mt-2 line-clamp-3 min-h-[66px] text-sm font-black leading-[1.25] tracking-[-0.035em] text-slate-950">
                      {memo.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">
                      {memo.message}
                    </p>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="rounded-xl bg-slate-50 px-2 py-1.5 text-center">
                        <div className="text-sm font-black text-slate-950">{memo.stats.targetCount}</div>
                        <div className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">Targets</div>
                      </div>
                      <div className="rounded-xl bg-emerald-50 px-2 py-1.5 text-center">
                        <div className="text-sm font-black text-emerald-700">{memo.stats.acknowledgedCount}</div>
                        <div className="text-[8px] font-black uppercase tracking-[0.12em] text-emerald-700">Read</div>
                      </div>
                      <div className={`rounded-xl px-2 py-1.5 text-center ${
                        needsFollowUp ? 'bg-orange-100' : 'bg-slate-50'
                      }`}>
                        <div className={`text-sm font-black ${needsFollowUp ? 'text-orange-700' : 'text-slate-950'}`}>
                          {memo.stats.openCommentCount}
                        </div>
                        <div className={`text-[8px] font-black uppercase tracking-[0.12em] ${needsFollowUp ? 'text-orange-700' : 'text-slate-500'}`}>
                          Follow
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 rounded-2xl bg-slate-950 px-3 py-2 text-center text-[11px] font-black text-white transition group-hover:bg-slate-800">
                      Open control card
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
            No broadcast card matches the current filters.
          </div>
        )}
      </div>

      {composerOpen ? (
        <div className="mt-5 rounded-[28px] border border-orange-200 bg-orange-50/60 p-4 shadow-inner">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.22em] text-orange-700">Broadcast composer</div>
              <h3 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950">Create targeted internal message</h3>
            </div>
            <button
              type="button"
              onClick={() => setComposerOpen(false)}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                <Users className="h-4 w-4" />
                Target users · {data.users.length} loaded
              </div>

              {data.usersLoadError ? (
                <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold leading-5 text-rose-800">
                  Users could not be loaded: {data.usersLoadError}
                </div>
              ) : null}

              {!data.usersLoadError && !data.users.length ? (
                <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800">
                  No users loaded yet. Click Refresh or verify app_users access.
                </div>
              ) : null}

              <input
                value={userQuery}
                onChange={(event) => setUserQuery(event.target.value)}
                placeholder="Search users…"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={selectAllFilteredUsers} disabled={!filteredUsers.length} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50">Select filtered</button>
                <button type="button" onClick={clearUsers} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Clear</button>
                <button type="button" onClick={() => void refresh(true)} className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-black text-orange-700">Reload users</button>
              </div>

              <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {filteredUsers.length ? filteredUsers.map((user) => (
                  <label key={user.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(String(user.id))}
                      onChange={() => toggleUser(String(user.id))}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-slate-950">{userLabel(user)}</span>
                      <span className="block truncate text-xs font-semibold text-slate-500">{user.email || user.role || user.username}</span>
                    </span>
                  </label>
                )) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-xs font-bold text-slate-500">
                    No target user matches the current search.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="grid gap-3 md:grid-cols-3">
                <select
                  value={situationKey}
                  onChange={(event) => {
                    const nextSituation = event.target.value
                    const firstTemplate = TEMPLATES_BY_SITUATION[nextSituation][0]
                    applyTemplate(nextSituation, firstTemplate.key)
                  }}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black outline-none"
                >
                  {SITUATIONS.map((item) => (
                    <option key={item.key} value={item.key}>{item.label}</option>
                  ))}
                </select>

                <select
                  value={templateKey}
                  onChange={(event) => applyTemplate(situationKey, event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black outline-none"
                >
                  {currentTemplates.map((item) => (
                    <option key={item.key} value={item.key}>{item.label}</option>
                  ))}
                </select>

                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black outline-none"
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Broadcast title"
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black outline-none"
              />

              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Broadcast message"
                className="mt-3 min-h-[240px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 outline-none"
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-700">
                  <Filter className="h-4 w-4" />
                  {selectedUserIds.length} selected target{selectedUserIds.length === 1 ? '' : 's'}
                </div>

                <button
                  type="button"
                  onClick={() => void broadcast()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white shadow-[0_16px_36px_rgba(234,88,12,0.22)]"
                >
                  <Send className="h-4 w-4" />
                  Broadcast now
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

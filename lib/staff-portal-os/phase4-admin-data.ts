import { createClient } from '@/lib/supabase/server'

export type StaffAdminRequest = {
  id: string
  user_id: string
  title: string
  request_type: string
  priority: string
  status: string
  description: string | null
  response: string | null
  created_at: string
  updated_at: string
}

export type StaffAdminMemo = {
  id: string
  title: string
  body: string
  memo_type: string
  severity: string
  source: string
  status: string
  target_role: string | null
  target_department: string | null
  created_at: string
  acknowledgements: number
}

function rows(res: any): any[] {
  return Array.isArray(res?.data) ? res.data : []
}

function s(value: unknown, fallback = ''): string {
  const out = String(value ?? '').trim()
  return out || fallback
}

export async function getStaffPortalAdminPhase4Data() {
  const supabase = await createClient()

  const [requestsRes, memosRes, ackRes] = await Promise.all([
    supabase.from('staff_service_requests').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('staff_control_memos').select('*').order('created_at', { ascending: false }).limit(300),
    supabase.from('staff_memo_acknowledgements').select('*').limit(2000),
  ])

  const acknowledgements = rows(ackRes)
  const ackCountByMemo = new Map<string, number>()
  acknowledgements.forEach((ack: any) => {
    const memoId = String(ack.memo_id || '')
    if (memoId) ackCountByMemo.set(memoId, (ackCountByMemo.get(memoId) || 0) + 1)
  })

  const requests: StaffAdminRequest[] = rows(requestsRes).map((item: any) => ({
    id: String(item.id),
    user_id: String(item.user_id || ''),
    title: s(item.title, 'Service request'),
    request_type: s(item.request_type, 'general'),
    priority: s(item.priority, 'medium'),
    status: s(item.status, 'open'),
    description: item.description || null,
    response: item.response || null,
    created_at: s(item.created_at, new Date().toISOString()),
    updated_at: s(item.updated_at, new Date().toISOString()),
  }))

  const memos: StaffAdminMemo[] = rows(memosRes).map((memo: any) => ({
    id: String(memo.id),
    title: s(memo.title, 'Control memo'),
    body: s(memo.body, ''),
    memo_type: s(memo.memo_type, 'briefing'),
    severity: s(memo.severity, 'info'),
    source: s(memo.source, 'AngelCare Control Tower'),
    status: s(memo.status, 'active'),
    target_role: memo.target_role || null,
    target_department: memo.target_department || null,
    created_at: s(memo.created_at, new Date().toISOString()),
    acknowledgements: ackCountByMemo.get(String(memo.id)) || 0,
  }))

  const openRequests = requests.filter((item) => !['closed', 'completed', 'resolved', 'cancelled'].includes(item.status.toLowerCase()))
  const urgentRequests = requests.filter((item) => ['high', 'critical', 'urgent'].includes(item.priority.toLowerCase()) && !['closed', 'completed', 'resolved', 'cancelled'].includes(item.status.toLowerCase()))
  const activeMemos = memos.filter((memo) => ['active', 'urgent'].includes(memo.status.toLowerCase()))

  return {
    requests,
    memos,
    openRequests,
    urgentRequests,
    activeMemos,
    metrics: [
      { label: 'Open requests', value: openRequests.length, detail: 'Staff services still open', tone: '#2563eb' },
      { label: 'Urgent services', value: urgentRequests.length, detail: 'High / critical requests', tone: urgentRequests.length ? '#dc2626' : '#059669' },
      { label: 'Active memos', value: activeMemos.length, detail: 'Currently pushed briefings', tone: '#16a34a' },
      { label: 'Acknowledgements', value: acknowledgements.length, detail: 'Total memo receipts', tone: '#7c3aed' },
    ],
  }
}

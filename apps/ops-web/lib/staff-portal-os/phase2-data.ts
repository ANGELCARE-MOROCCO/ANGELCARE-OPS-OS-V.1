import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'

export type StaffServiceRequest = {
  id: string
  title: string
  request_type: string
  status: string
  priority: string
  description: string | null
  response: string | null
  created_at: string
  updated_at: string
}

export type StaffMemoRecord = {
  id: string
  title: string
  body: string
  memo_type: string
  severity: 'info' | 'warning' | 'critical' | 'success'
  source: string
  status: string
  created_at: string
  acknowledged_at: string | null
}

function rows(res: any): any[] {
  return Array.isArray(res?.data) ? res.data : []
}

function s(value: unknown, fallback = ''): string {
  const out = String(value ?? '').trim()
  return out || fallback
}

export async function getStaffServicesPhase2() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const [requestsRes, memosRes, ackRes] = await Promise.all([
    supabase
      .from('staff_service_requests')
      .select('*')
      .eq('user_id', user?.id || '')
      .order('created_at', { ascending: false })
      .limit(120),
    supabase
      .from('staff_control_memos')
      .select('*')
      .in('status', ['active', 'urgent'])
      .order('created_at', { ascending: false })
      .limit(80),
    supabase
      .from('staff_memo_acknowledgements')
      .select('*')
      .eq('user_id', user?.id || '')
      .limit(300),
  ])

  const acknowledgements = rows(ackRes)
  const acknowledgedByMemo = new Map<string, string>()
  acknowledgements.forEach((ack: any) => {
    if (ack.memo_id) acknowledgedByMemo.set(String(ack.memo_id), s(ack.acknowledged_at))
  })

  const memos: StaffMemoRecord[] = rows(memosRes).map((memo: any) => ({
    id: String(memo.id),
    title: s(memo.title, 'Control memo'),
    body: s(memo.body, 'No memo body provided.'),
    memo_type: s(memo.memo_type, 'briefing'),
    severity: ['info', 'warning', 'critical', 'success'].includes(s(memo.severity)) ? s(memo.severity) as StaffMemoRecord['severity'] : 'info',
    source: s(memo.source, 'AngelCare Control Tower'),
    status: s(memo.status, 'active'),
    created_at: s(memo.created_at, new Date().toISOString()),
    acknowledged_at: acknowledgedByMemo.get(String(memo.id)) || null,
  }))

  const requests: StaffServiceRequest[] = rows(requestsRes).map((item: any) => ({
    id: String(item.id),
    title: s(item.title, 'Service request'),
    request_type: s(item.request_type, 'general'),
    status: s(item.status, 'open'),
    priority: s(item.priority, 'medium'),
    description: item.description || null,
    response: item.response || null,
    created_at: s(item.created_at, new Date().toISOString()),
    updated_at: s(item.updated_at, new Date().toISOString()),
  }))

  const openRequests = requests.filter((item) => !['closed', 'completed', 'cancelled', 'resolved'].includes(item.status.toLowerCase()))
  const unacknowledgedMemos = memos.filter((memo) => !memo.acknowledged_at)

  return {
    user,
    requests,
    memos,
    openRequests,
    unacknowledgedMemos,
    metrics: [
      { label: 'Open services', value: openRequests.length, detail: 'Staff requests still open', tone: '#2563eb' },
      { label: 'Control memos', value: memos.length, detail: 'Active messages and briefings', tone: '#16a34a' },
      { label: 'Unacknowledged', value: unacknowledgedMemos.length, detail: 'Requires receipt acknowledgement', tone: unacknowledgedMemos.length ? '#dc2626' : '#059669' },
      { label: 'Resolved services', value: requests.length - openRequests.length, detail: 'Completed staff requests', tone: '#7c3aed' },
    ],
  }
}

#!/usr/bin/env bash
set -euo pipefail

CWD="$(pwd)"

if [ -f "$CWD/package.json" ]; then
  APP_ROOT="$CWD"
else
  echo "ERROR: Run from app root."
  exit 1
fi

echo "Detected app root: $APP_ROOT"

mkdir -p \
  "app/(protected)/staff-services/admin" \
  "app/(protected)/staff-memos" \
  "app/(protected)/staff-memos/new" \
  "lib/staff-portal-os" \
  "lib/supabase/migrations"

cat > "lib/staff-portal-os/phase4-admin-data.ts" <<'TS'
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
TS

cat > "lib/staff-portal-os/phase4-admin-actions.ts" <<'TS'
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'

function s(formData: FormData, key: string, fallback = ''): string {
  const out = String(formData.get(key) || '').trim()
  return out || fallback
}

export async function updateStaffServiceRequestPhase4(formData: FormData) {
  const supabase = await createClient()
  const requestId = s(formData, 'request_id')
  const status = s(formData, 'status', 'in_progress')
  const response = s(formData, 'response')

  if (!requestId) throw new Error('Missing request id.')

  const { error } = await supabase
    .from('staff_service_requests')
    .update({
      status,
      response,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (error) throw new Error(error.message)

  revalidatePath('/staff-services/admin')
  revalidatePath('/staff-services')
}

export async function createStaffControlMemoPhase4(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const payload = {
    title: s(formData, 'title'),
    body: s(formData, 'body'),
    memo_type: s(formData, 'memo_type', 'briefing'),
    severity: s(formData, 'severity', 'info'),
    source: s(formData, 'source', 'AngelCare Control Tower'),
    status: s(formData, 'status', 'active'),
    target_role: s(formData, 'target_role') || null,
    target_department: s(formData, 'target_department') || null,
    created_by: user?.id || null,
  }

  const { error } = await supabase.from('staff_control_memos').insert([payload])
  if (error) throw new Error(error.message)

  revalidatePath('/staff-memos')
  revalidatePath('/staff-services')
  revalidatePath('/staff-home')
}

export async function updateStaffMemoStatusPhase4(formData: FormData) {
  const supabase = await createClient()
  const memoId = s(formData, 'memo_id')
  const status = s(formData, 'status', 'active')

  if (!memoId) throw new Error('Missing memo id.')

  const { error } = await supabase
    .from('staff_control_memos')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', memoId)

  if (error) throw new Error(error.message)

  revalidatePath('/staff-memos')
  revalidatePath('/staff-home')
}
TS

cat > "app/(protected)/staff-services/admin/page.tsx" <<'TSX'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getStaffPortalAdminPhase4Data } from '@/lib/staff-portal-os/phase4-admin-data'
import { updateStaffServiceRequestPhase4 } from '@/lib/staff-portal-os/phase4-admin-actions'

function Metric({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: string }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 24, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)' }}>
      <div style={{ color: '#64748b', fontSize: 12, fontWeight: 950, textTransform: 'uppercase', letterSpacing: .8 }}>{label}</div>
      <div style={{ color: tone, fontSize: 34, fontWeight: 950, marginTop: 8 }}>{value}</div>
      <div style={{ color: '#475569', fontWeight: 750 }}>{detail}</div>
    </div>
  )
}

export default async function StaffServicesAdminPage() {
  const data = await getStaffPortalAdminPhase4Data()

  return (
    <AppShell
      title="Staff Services Admin"
      subtitle="Admin command desk for staff requests"
      breadcrumbs={[{ label: 'Staff Portal', href: '/staff-home' }, { label: 'Staff Services', href: '/staff-services' }, { label: 'Admin' }]}
      actions={<PageAction href="/staff-memos/new" variant="light">Push Memo</PageAction>}
    >
      <section style={{ background: 'linear-gradient(135deg,#020617,#1e3a8a,#0f766e)', color: 'white', borderRadius: 30, padding: 28, boxShadow: '0 28px 80px rgba(2,6,23,.25)', marginBottom: 22 }}>
        <div style={{ color: '#93c5fd', textTransform: 'uppercase', fontWeight: 950, letterSpacing: 1.3, fontSize: 12 }}>Staff Portal OS Phase 4</div>
        <h1 style={{ margin: '8px 0', fontSize: 38 }}>Admin Services Command</h1>
        <p style={{ color: '#dbeafe', fontWeight: 760, lineHeight: 1.6, margin: 0, maxWidth: 900 }}>
          Central control for staff service requests: triage, response, status update and operational follow-up.
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14, marginBottom: 22 }}>
        {data.metrics.map((metric) => <Metric key={metric.label} {...metric} />)}
      </div>

      <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 26, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)' }}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>Staff Request Queue</h2>
        <p style={{ color: '#64748b', fontWeight: 750 }}>Update status and write response visible in staff services.</p>

        {data.requests.map((item) => (
          <div key={item.id} style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
              <div>
                <strong style={{ color: '#0f172a', fontSize: 17 }}>{item.title}</strong>
                <div style={{ color: '#64748b', fontWeight: 720, marginTop: 4 }}>{item.request_type} · {item.priority} · {item.user_id.slice(0, 8)}</div>
              </div>
              <span style={{ border: '1px solid #cbd5e1', borderRadius: 999, padding: '5px 9px', fontSize: 12, fontWeight: 950 }}>{item.status}</span>
            </div>

            {item.description ? <p style={{ color: '#475569', fontWeight: 700 }}>{item.description}</p> : null}

            <form action={updateStaffServiceRequestPhase4} style={{ display: 'grid', gridTemplateColumns: '170px minmax(0,1fr) auto', gap: 10, alignItems: 'end', marginTop: 10 }}>
              <input type="hidden" name="request_id" value={item.id} />
              <label style={{ display: 'grid', gap: 5, fontWeight: 900, color: '#334155', fontSize: 13 }}>
                Status
                <select name="status" defaultValue={item.status} style={{ height: 38, borderRadius: 12, border: '1px solid #cbd5e1', fontWeight: 750 }}>
                  {['open', 'in_progress', 'waiting_user', 'resolved', 'closed', 'cancelled'].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 5, fontWeight: 900, color: '#334155', fontSize: 13 }}>
                Response
                <input name="response" defaultValue={item.response || ''} style={{ height: 38, borderRadius: 12, border: '1px solid #cbd5e1', padding: '0 10px', fontWeight: 750 }} />
              </label>
              <button type="submit" style={{ height: 38, borderRadius: 999, border: '1px solid #1d4ed8', background: '#2563eb', color: 'white', fontWeight: 950, padding: '0 13px', cursor: 'pointer' }}>
                Update
              </button>
            </form>
          </div>
        ))}
      </section>
    </AppShell>
  )
}
TSX

cat > "app/(protected)/staff-memos/page.tsx" <<'TSX'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getStaffPortalAdminPhase4Data } from '@/lib/staff-portal-os/phase4-admin-data'
import { updateStaffMemoStatusPhase4 } from '@/lib/staff-portal-os/phase4-admin-actions'

export default async function StaffMemosPage() {
  const data = await getStaffPortalAdminPhase4Data()

  return (
    <AppShell
      title="Staff Memo Broadcasts"
      subtitle="Control tower pushed memos and acknowledgement monitoring"
      breadcrumbs={[{ label: 'Staff Portal', href: '/staff-home' }, { label: 'Memos' }]}
      actions={<PageAction href="/staff-memos/new" variant="light">New Memo</PageAction>}
    >
      <section style={{ background: 'linear-gradient(135deg,#020617,#14532d,#0f766e)', color: 'white', borderRadius: 30, padding: 28, boxShadow: '0 28px 80px rgba(2,6,23,.25)', marginBottom: 22 }}>
        <div style={{ color: '#bbf7d0', textTransform: 'uppercase', fontWeight: 950, letterSpacing: 1.3, fontSize: 12 }}>ATC Control Broadcast</div>
        <h1 style={{ margin: '8px 0', fontSize: 38 }}>Memo Broadcast Center</h1>
        <p style={{ color: '#dcfce7', fontWeight: 760, lineHeight: 1.6, margin: 0, maxWidth: 900 }}>
          Create and monitor staff control memos, warnings, daily briefings and operational updates.
        </p>
      </section>

      <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 26, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)' }}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>Broadcast Queue</h2>
        <p style={{ color: '#64748b', fontWeight: 750 }}>Change memo status and monitor acknowledgement volume.</p>

        {data.memos.map((memo) => (
          <div key={memo.id} style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <strong style={{ color: '#0f172a', fontSize: 17 }}>{memo.title}</strong>
                <div style={{ color: '#64748b', fontWeight: 720, marginTop: 4 }}>
                  {memo.memo_type} · {memo.severity} · {memo.source} · {memo.acknowledgements} ACK
                </div>
              </div>
              <span style={{ border: '1px solid #cbd5e1', borderRadius: 999, padding: '5px 9px', fontSize: 12, fontWeight: 950 }}>{memo.status}</span>
            </div>
            <p style={{ color: '#475569', fontWeight: 700 }}>{memo.body}</p>
            <form action={updateStaffMemoStatusPhase4} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="hidden" name="memo_id" value={memo.id} />
              <select name="status" defaultValue={memo.status} style={{ height: 38, borderRadius: 12, border: '1px solid #cbd5e1', fontWeight: 750 }}>
                {['active', 'urgent', 'paused', 'archived'].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <button type="submit" style={{ height: 38, borderRadius: 999, border: '1px solid #14532d', background: '#16a34a', color: 'white', fontWeight: 950, padding: '0 13px', cursor: 'pointer' }}>
                Update status
              </button>
            </form>
          </div>
        ))}
      </section>
    </AppShell>
  )
}
TSX

cat > "app/(protected)/staff-memos/new/page.tsx" <<'TSX'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createStaffControlMemoPhase4 } from '@/lib/staff-portal-os/phase4-admin-actions'

const inputStyle: React.CSSProperties = {
  minHeight: 42,
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '0 12px',
  fontWeight: 750,
  color: '#0f172a',
}

const labelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 7,
  color: '#334155',
  fontWeight: 900,
}

export default function NewStaffMemoPage() {
  return (
    <AppShell
      title="New Staff Memo"
      subtitle="Push an ATC control memo to staff portal"
      breadcrumbs={[{ label: 'Staff Portal', href: '/staff-home' }, { label: 'Memos', href: '/staff-memos' }, { label: 'New' }]}
      actions={<PageAction href="/staff-memos" variant="light">Back to memos</PageAction>}
    >
      <section style={{ background: 'linear-gradient(135deg,#020617,#14532d,#0f766e)', color: 'white', borderRadius: 30, padding: 28, boxShadow: '0 28px 80px rgba(2,6,23,.25)', marginBottom: 22 }}>
        <div style={{ color: '#bbf7d0', textTransform: 'uppercase', fontWeight: 950, letterSpacing: 1.3, fontSize: 12 }}>ATC Control Broadcast</div>
        <h1 style={{ margin: '8px 0', fontSize: 36 }}>Create Staff Memo</h1>
        <p style={{ color: '#dcfce7', fontWeight: 760, lineHeight: 1.6, margin: 0 }}>Push daily briefings, warnings, urgent memos, protocol updates and operational messages.</p>
      </section>

      <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 26, padding: 20, boxShadow: '0 18px 55px rgba(15,23,42,.07)', maxWidth: 900 }}>
        <form action={createStaffControlMemoPhase4} style={{ display: 'grid', gap: 14 }}>
          <label style={labelStyle}>Title<input name="title" required style={inputStyle} /></label>
          <label style={labelStyle}>Source<input name="source" defaultValue="AngelCare Control Tower" style={inputStyle} /></label>
          <label style={labelStyle}>
            Memo type
            <select name="memo_type" defaultValue="briefing" style={inputStyle}>
              {['briefing', 'warning', 'protocol', 'update', 'urgent', 'training', 'operations'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label style={labelStyle}>
            Severity
            <select name="severity" defaultValue="info" style={inputStyle}>
              {['info', 'success', 'warning', 'critical'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label style={labelStyle}>Target role optional<input name="target_role" style={inputStyle} /></label>
          <label style={labelStyle}>Target department optional<input name="target_department" style={inputStyle} /></label>
          <label style={labelStyle}>
            Body
            <textarea name="body" required rows={8} style={{ ...inputStyle, padding: 12, resize: 'vertical' }} />
          </label>
          <button type="submit" style={{ border: '1px solid #14532d', background: '#16a34a', color: 'white', borderRadius: 999, padding: '11px 16px', fontWeight: 950, justifySelf: 'start', cursor: 'pointer' }}>
            Push memo
          </button>
        </form>
      </section>
    </AppShell>
  )
}
TSX

cat > "lib/supabase/migrations/118_staff_portal_os_phase4_admin_command.sql" <<'SQL'
create extension if not exists pgcrypto;

alter table staff_control_memos add column if not exists target_role text;
alter table staff_control_memos add column if not exists target_department text;
alter table staff_control_memos add column if not exists created_by uuid;
alter table staff_control_memos add column if not exists updated_at timestamptz not null default now();

alter table staff_service_requests add column if not exists assigned_to uuid;
alter table staff_service_requests add column if not exists response text;
alter table staff_service_requests add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_staff_control_memos_target_role_phase4 on staff_control_memos(target_role);
create index if not exists idx_staff_control_memos_target_department_phase4 on staff_control_memos(target_department);
create index if not exists idx_staff_service_requests_priority_phase4 on staff_service_requests(priority);

select 'Staff Portal OS Phase 4 admin command installed' as result;
SQL

echo "Staff Portal OS Phase 4 installed:"
for f in \
  "app/(protected)/staff-services/admin/page.tsx" \
  "app/(protected)/staff-memos/page.tsx" \
  "app/(protected)/staff-memos/new/page.tsx" \
  "lib/staff-portal-os/phase4-admin-data.ts" \
  "lib/staff-portal-os/phase4-admin-actions.ts" \
  "lib/supabase/migrations/118_staff_portal_os_phase4_admin_command.sql"
do
  if [ -f "$APP_ROOT/$f" ]; then echo "OK  $f"; else echo "MISS $f"; fi
done

echo ""
echo "Run SQL:"
echo "lib/supabase/migrations/118_staff_portal_os_phase4_admin_command.sql"
echo ""
echo "Then:"
echo "rm -rf .next"
echo "npm run build"

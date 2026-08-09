#!/usr/bin/env bash
set -euo pipefail

CWD="$(pwd)"
if [ -f "$CWD/package.json" ]; then
  APP_ROOT="$CWD"
else
  echo "ERROR: Run this from app root."
  exit 1
fi

echo "Detected app root: $APP_ROOT"

mkdir -p \
  "app/(protected)/staff-portal-final-qa" \
  "app/(protected)/staff-portal-access-check" \
  "lib/staff-portal-os"

cat > "lib/staff-portal-os/phase6-final-qa.ts" <<'TS'
import { STAFF_PORTAL_ROUTES } from './phase5-routes'

export type StaffPortalQACheck = {
  key: string
  label: string
  status: 'ok' | 'review' | 'missing'
  detail: string
}

export function getStaffPortalFinalChecks(): StaffPortalQACheck[] {
  const duplicates = STAFF_PORTAL_ROUTES
    .map((route) => route.href)
    .filter((href, index, all) => all.indexOf(href) !== index)

  return [
    {
      key: 'route_manifest',
      label: 'Route manifest',
      status: STAFF_PORTAL_ROUTES.length >= 8 ? 'ok' : 'review',
      detail: `${STAFF_PORTAL_ROUTES.length} Staff Portal OS routes registered.`,
    },
    {
      key: 'duplicate_routes',
      label: 'Duplicate route check',
      status: duplicates.length === 0 ? 'ok' : 'review',
      detail: duplicates.length === 0 ? 'No duplicate routes detected.' : `${duplicates.length} duplicate route entries detected.`,
    },
    {
      key: 'core_landing',
      label: 'Staff landing route',
      status: STAFF_PORTAL_ROUTES.some((route) => route.href === '/staff-home') ? 'ok' : 'missing',
      detail: '/staff-home must exist as the post-login master staff portal.',
    },
    {
      key: 'services',
      label: 'Staff services',
      status: STAFF_PORTAL_ROUTES.some((route) => route.href === '/staff-services') ? 'ok' : 'missing',
      detail: 'Staff services must exist for admin/service requests.',
    },
    {
      key: 'memos',
      label: 'Memo broadcast control',
      status: STAFF_PORTAL_ROUTES.some((route) => route.href === '/staff-memos') ? 'ok' : 'missing',
      detail: 'Staff memos must exist for ATC control broadcasts.',
    },
    {
      key: 'manager_variant',
      label: 'Manager team command',
      status: STAFF_PORTAL_ROUTES.some((route) => route.href === '/team-command') ? 'ok' : 'missing',
      detail: 'Manager/team command route must exist for leadership variants.',
    },
  ]
}
TS

cat > "app/(protected)/staff-portal-final-qa/page.tsx" <<'TSX'
import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getStaffPortalFinalChecks } from '@/lib/staff-portal-os/phase6-final-qa'
import { STAFF_PORTAL_AREAS, STAFF_PORTAL_ROUTES } from '@/lib/staff-portal-os/phase5-routes'

function statusStyle(status: string): React.CSSProperties {
  if (status === 'ok') return { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }
  if (status === 'missing') return { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }
  return { background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }
}

export default function StaffPortalFinalQAPage() {
  const checks = getStaffPortalFinalChecks()
  const ok = checks.filter((check) => check.status === 'ok').length
  const review = checks.filter((check) => check.status === 'review').length
  const missing = checks.filter((check) => check.status === 'missing').length

  return (
    <AppShell
      title="Staff Portal Final QA"
      subtitle="Final production readiness check"
      breadcrumbs={[{ label: 'Staff Portal', href: '/staff-home' }, { label: 'Final QA' }]}
      actions={<PageAction href="/staff-portal-navigation" variant="light">Navigation</PageAction>}
    >
      <section style={{ background: 'linear-gradient(135deg,#020617,#1e3a8a,#0f766e)', color: 'white', borderRadius: 30, padding: 28, boxShadow: '0 28px 80px rgba(2,6,23,.25)', marginBottom: 22 }}>
        <div style={{ color: '#93c5fd', textTransform: 'uppercase', fontWeight: 950, letterSpacing: 1.3, fontSize: 12 }}>Staff Portal OS Phase 6</div>
        <h1 style={{ margin: '8px 0', fontSize: 38 }}>Final QA & Production Readiness</h1>
        <p style={{ color: '#dbeafe', fontWeight: 760, lineHeight: 1.6, margin: 0, maxWidth: 900 }}>
          Route manifest, permission mapping, staff services, memo broadcasts, manager variants and deployment QA in one final control surface.
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Routes', value: STAFF_PORTAL_ROUTES.length, detail: 'Staff portal routes', tone: '#2563eb' },
          { label: 'Areas', value: STAFF_PORTAL_AREAS.length, detail: 'Operating zones', tone: '#16a34a' },
          { label: 'OK checks', value: ok, detail: 'Passing QA checks', tone: '#059669' },
          { label: 'Review/Missing', value: review + missing, detail: 'Needs attention', tone: review + missing ? '#dc2626' : '#059669' },
        ].map((metric) => (
          <div key={metric.label} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 24, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)' }}>
            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 950, textTransform: 'uppercase', letterSpacing: .8 }}>{metric.label}</div>
            <div style={{ color: metric.tone, fontSize: 34, fontWeight: 950, marginTop: 8 }}>{metric.value}</div>
            <div style={{ color: '#475569', fontWeight: 750 }}>{metric.detail}</div>
          </div>
        ))}
      </div>

      <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 26, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)', marginBottom: 22 }}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>Final QA checks</h2>
        <p style={{ color: '#64748b', fontWeight: 750 }}>All checks should be OK before pushing to production.</p>
        {checks.map((check) => (
          <div key={check.key} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, borderBottom: '1px solid #f1f5f9', padding: '13px 0', alignItems: 'center' }}>
            <div>
              <strong style={{ color: '#0f172a' }}>{check.label}</strong>
              <div style={{ color: '#64748b', fontWeight: 720, marginTop: 4 }}>{check.detail}</div>
            </div>
            <span style={{ ...statusStyle(check.status), borderRadius: 999, padding: '5px 9px', fontSize: 12, fontWeight: 950 }}>{check.status}</span>
          </div>
        ))}
      </section>

      <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 26, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)' }}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>Smoke-test routes</h2>
        <p style={{ color: '#64748b', fontWeight: 750 }}>Open these after deployment.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>
          {STAFF_PORTAL_ROUTES.map((route) => (
            <Link key={route.href} href={route.href} style={{ display: 'block', textDecoration: 'none', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 18, padding: 14, background: '#f8fafc', fontWeight: 900 }}>
              {route.label}
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{route.href}</div>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  )
}
TSX

cat > "app/(protected)/staff-portal-access-check/page.tsx" <<'TSX'
import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { getCurrentUser } from '@/lib/getUser'
import { getAllowedAppRoutes, groupRoutesByModule } from '@/lib/auth/page-access'
import { STAFF_PORTAL_ROUTES } from '@/lib/staff-portal-os/phase5-routes'

export default async function StaffPortalAccessCheckPage() {
  const user = await getCurrentUser()
  const allowedRoutes = getAllowedAppRoutes(user)
  const groups = groupRoutesByModule(allowedRoutes)
  const allowedHrefs = new Set(allowedRoutes.map((route) => route.href))

  return (
    <AppShell
      title="Staff Portal Access Check"
      subtitle="Permission-driven visibility diagnostics"
      breadcrumbs={[{ label: 'Staff Portal', href: '/staff-home' }, { label: 'Access Check' }]}
      actions={<PageAction href="/staff-portal-final-qa" variant="light">Final QA</PageAction>}
    >
      <section style={{ background: 'linear-gradient(135deg,#020617,#1e3a8a,#0f766e)', color: 'white', borderRadius: 30, padding: 28, boxShadow: '0 28px 80px rgba(2,6,23,.25)', marginBottom: 22 }}>
        <div style={{ color: '#93c5fd', textTransform: 'uppercase', fontWeight: 950, letterSpacing: 1.3, fontSize: 12 }}>Staff Portal OS Phase 6</div>
        <h1 style={{ margin: '8px 0', fontSize: 38 }}>Access Visibility Check</h1>
        <p style={{ color: '#dbeafe', fontWeight: 760, lineHeight: 1.6, margin: 0, maxWidth: 900 }}>
          See what the signed-in user can access based on user management permissions and page access logic.
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Allowed routes', value: allowedRoutes.length, detail: 'From permission engine', tone: '#2563eb' },
          { label: 'Allowed modules', value: Object.keys(groups).length, detail: 'Grouped module access', tone: '#16a34a' },
          { label: 'Staff portal routes', value: STAFF_PORTAL_ROUTES.length, detail: 'Expected portal manifest', tone: '#7c3aed' },
          { label: 'Visible portal routes', value: STAFF_PORTAL_ROUTES.filter((route) => allowedHrefs.has(route.href)).length, detail: 'Directly visible by route', tone: '#ea580c' },
        ].map((metric) => (
          <div key={metric.label} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 24, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)' }}>
            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 950, textTransform: 'uppercase', letterSpacing: .8 }}>{metric.label}</div>
            <div style={{ color: metric.tone, fontSize: 34, fontWeight: 950, marginTop: 8 }}>{metric.value}</div>
            <div style={{ color: '#475569', fontWeight: 750 }}>{metric.detail}</div>
          </div>
        ))}
      </div>

      <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 26, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)' }}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>Staff Portal route visibility</h2>
        <p style={{ color: '#64748b', fontWeight: 750 }}>Use this to verify user management permissions after creating/editing users.</p>
        {STAFF_PORTAL_ROUTES.map((route) => {
          const visible = allowedHrefs.has(route.href) || allowedHrefs.has('/staff-home')
          return (
            <div key={route.href} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', gap: 12, borderBottom: '1px solid #f1f5f9', padding: '13px 0', alignItems: 'center' }}>
              <div>
                <strong style={{ color: '#0f172a' }}>{route.label}</strong>
                <div style={{ color: '#64748b', fontWeight: 720, marginTop: 4 }}>{route.href} · {route.permission}</div>
              </div>
              <span style={{ border: '1px solid #cbd5e1', borderRadius: 999, padding: '5px 9px', fontSize: 12, fontWeight: 950 }}>{visible ? 'visible' : 'not visible'}</span>
              <Link href={route.href} style={{ border: '1px solid #1d4ed8', background: '#2563eb', color: 'white', borderRadius: 999, padding: '7px 10px', textDecoration: 'none', fontSize: 12, fontWeight: 950 }}>Open</Link>
            </div>
          )
        })}
      </section>
    </AppShell>
  )
}
TSX

# Patch permissions one more time with final QA links if available.
if [ -f "lib/auth/permissions.ts" ]; then
  cp "lib/auth/permissions.ts" "lib/auth/permissions.ts.backup_staff_portal_phase6_$(date +%Y%m%d_%H%M%S)"
  python3 - <<'PY'
from pathlib import Path

p = Path("lib/auth/permissions.ts")
text = p.read_text()

links = """  { label: 'Staff Portal Final QA', href: '/staff-portal-final-qa', permission: 'staff_portal.admin' },
  { label: 'Staff Portal Access Check', href: '/staff-portal-access-check', permission: 'staff_portal.admin' },
"""

if "Staff Portal Final QA" not in text and "MODULE_ACCESS_LINKS" in text:
    text = text.replace("] as const\n\nexport type ModuleKey", links + "] as const\n\nexport type ModuleKey")
    print("OK added Phase 6 staff portal links to MODULE_ACCESS_LINKS")
else:
    print("OK Phase 6 links already exist or MODULE_ACCESS_LINKS not found")

if "'staff_portal.admin'" not in text and "  staff_portal: [" in text:
    text = text.replace("    'staff_portal.view',", "    'staff_portal.view',\n    'staff_portal.admin',")
    print("OK added staff_portal.admin permission")
else:
    print("OK staff_portal.admin already exists or staff_portal namespace not found")

p.write_text(text)
PY
else
  echo "WARN lib/auth/permissions.ts not found, skipping permission patch."
fi

echo "Staff Portal OS Phase 6 installed:"
for f in \
  "lib/staff-portal-os/phase6-final-qa.ts" \
  "app/(protected)/staff-portal-final-qa/page.tsx" \
  "app/(protected)/staff-portal-access-check/page.tsx"
do
  if [ -f "$APP_ROOT/$f" ]; then echo "OK  $f"; else echo "MISS $f"; fi
done

echo ""
echo "No SQL required."
echo "Now run:"
echo "rm -rf .next"
echo "npm run build"

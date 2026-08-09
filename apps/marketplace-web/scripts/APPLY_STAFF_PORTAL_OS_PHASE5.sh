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
  "app/(protected)/staff-portal-navigation" \
  "app/(protected)/staff-portal-route-audit" \
  "lib/staff-portal-os"

cat > "lib/staff-portal-os/phase5-routes.ts" <<'TS'
export type StaffPortalRoute = {
  href: string
  label: string
  area: string
  permission: string
  description: string
  criticality: 'core' | 'high' | 'medium' | 'support'
}

export const STAFF_PORTAL_ROUTES: StaffPortalRoute[] = [
  {
    href: '/staff-home',
    label: 'Staff Portal Home',
    area: 'Core',
    permission: 'staff_portal.view',
    description: 'Personalized master staff landing page after sign-in.',
    criticality: 'core',
  },
  {
    href: '/staff-services',
    label: 'Staff Services',
    area: 'Services',
    permission: 'staff_services.view',
    description: 'Personal staff requests, services and persistent memos.',
    criticality: 'high',
  },
  {
    href: '/staff-services/new',
    label: 'New Staff Service Request',
    area: 'Services',
    permission: 'staff_services.create',
    description: 'Create HR, admin, roster, document, IT or training request.',
    criticality: 'medium',
  },
  {
    href: '/staff-services/admin',
    label: 'Staff Services Admin',
    area: 'Admin',
    permission: 'staff_services.admin',
    description: 'Admin command desk for staff service requests.',
    criticality: 'high',
  },
  {
    href: '/staff-memos',
    label: 'Staff Memos',
    area: 'Memos',
    permission: 'staff_memos.admin',
    description: 'Control tower memo broadcast center and acknowledgements.',
    criticality: 'high',
  },
  {
    href: '/staff-memos/new',
    label: 'New Staff Memo',
    area: 'Memos',
    permission: 'staff_memos.admin',
    description: 'Push ATC-style memos, warnings and daily briefings.',
    criticality: 'medium',
  },
  {
    href: '/staff-portal-intelligence',
    label: 'Staff Portal Intelligence',
    area: 'Intelligence',
    permission: 'staff_portal.intelligence',
    description: 'Department and position personalization overview.',
    criticality: 'medium',
  },
  {
    href: '/team-command',
    label: 'Team Command',
    area: 'Manager',
    permission: 'staff_portal.manager',
    description: 'Manager-oriented staff portal variant and team signals.',
    criticality: 'medium',
  },
  {
    href: '/staff-portal-navigation',
    label: 'Staff Portal Navigation',
    area: 'Support',
    permission: 'staff_portal.view',
    description: 'Navigation hub for all Staff Portal OS routes.',
    criticality: 'support',
  },
  {
    href: '/staff-portal-route-audit',
    label: 'Staff Portal Route Audit',
    area: 'Support',
    permission: 'staff_portal.admin',
    description: 'Final route manifest and access audit surface.',
    criticality: 'support',
  },
]

export const STAFF_PORTAL_AREAS = Array.from(new Set(STAFF_PORTAL_ROUTES.map((route) => route.area)))
TS

cat > "app/(protected)/staff-portal-navigation/page.tsx" <<'TSX'
import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { STAFF_PORTAL_AREAS, STAFF_PORTAL_ROUTES } from '@/lib/staff-portal-os/phase5-routes'

function priorityStyle(priority: string): React.CSSProperties {
  if (priority === 'core') return { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }
  if (priority === 'high') return { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd' }
  if (priority === 'medium') return { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }
  return { background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1' }
}

export default function StaffPortalNavigationPage() {
  return (
    <AppShell
      title="Staff Portal Navigation"
      subtitle="Staff Portal OS route hub"
      breadcrumbs={[{ label: 'Staff Portal', href: '/staff-home' }, { label: 'Navigation' }]}
      actions={<PageAction href="/staff-portal-route-audit" variant="light">Route Audit</PageAction>}
    >
      <section style={{ background: 'linear-gradient(135deg,#020617,#1e3a8a,#0f766e)', color: 'white', borderRadius: 30, padding: 28, boxShadow: '0 28px 80px rgba(2,6,23,.25)', marginBottom: 22 }}>
        <div style={{ color: '#93c5fd', textTransform: 'uppercase', fontWeight: 950, letterSpacing: 1.3, fontSize: 12 }}>Staff Portal OS Phase 5</div>
        <h1 style={{ margin: '8px 0', fontSize: 38 }}>Staff Portal Navigation Hub</h1>
        <p style={{ color: '#dbeafe', fontWeight: 760, lineHeight: 1.6, margin: 0, maxWidth: 900 }}>
          A clean route hub for personalized staff landing, services, memos, manager command and portal intelligence.
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Routes', value: STAFF_PORTAL_ROUTES.length, detail: 'Staff Portal route inventory', tone: '#2563eb' },
          { label: 'Areas', value: STAFF_PORTAL_AREAS.length, detail: 'Portal operating zones', tone: '#16a34a' },
          { label: 'Core', value: STAFF_PORTAL_ROUTES.filter((r) => r.criticality === 'core').length, detail: 'Mission critical routes', tone: '#7c3aed' },
          { label: 'Admin', value: STAFF_PORTAL_ROUTES.filter((r) => r.area === 'Admin' || r.area === 'Memos').length, detail: 'Admin/control surfaces', tone: '#dc2626' },
        ].map((metric) => (
          <div key={metric.label} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 24, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)' }}>
            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 950, textTransform: 'uppercase', letterSpacing: .8 }}>{metric.label}</div>
            <div style={{ color: metric.tone, fontSize: 34, fontWeight: 950, marginTop: 8 }}>{metric.value}</div>
            <div style={{ color: '#475569', fontWeight: 750 }}>{metric.detail}</div>
          </div>
        ))}
      </div>

      {STAFF_PORTAL_AREAS.map((area) => (
        <section key={area} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 26, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)', marginBottom: 18 }}>
          <h2 style={{ margin: 0, color: '#0f172a' }}>{area}</h2>
          <p style={{ color: '#64748b', fontWeight: 750 }}>Staff Portal OS routes in this operating area.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
            {STAFF_PORTAL_ROUTES.filter((route) => route.area === area).map((route) => (
              <Link key={route.href} href={route.href} style={{ display: 'block', textDecoration: 'none', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 18, padding: 14, background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <strong>{route.label}</strong>
                  <span style={{ ...priorityStyle(route.criticality), borderRadius: 999, padding: '4px 8px', fontSize: 11, fontWeight: 950 }}>{route.criticality}</span>
                </div>
                <p style={{ color: '#64748b', fontWeight: 720, lineHeight: 1.45 }}>{route.description}</p>
                <div style={{ color: '#2563eb', fontWeight: 900, fontSize: 12 }}>{route.href}</div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </AppShell>
  )
}
TSX

cat > "app/(protected)/staff-portal-route-audit/page.tsx" <<'TSX'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { STAFF_PORTAL_ROUTES } from '@/lib/staff-portal-os/phase5-routes'

export default function StaffPortalRouteAuditPage() {
  const duplicateMap = new Map<string, number>()
  STAFF_PORTAL_ROUTES.forEach((route) => duplicateMap.set(route.href, (duplicateMap.get(route.href) || 0) + 1))
  const duplicates = Array.from(duplicateMap.entries()).filter((entry) => entry[1] > 1)

  return (
    <AppShell
      title="Staff Portal Route Audit"
      subtitle="Route manifest and permission mapping"
      breadcrumbs={[{ label: 'Staff Portal', href: '/staff-home' }, { label: 'Route Audit' }]}
      actions={<PageAction href="/staff-portal-navigation" variant="light">Navigation</PageAction>}
    >
      <section style={{ background: 'linear-gradient(135deg,#020617,#1e3a8a,#0f766e)', color: 'white', borderRadius: 30, padding: 28, boxShadow: '0 28px 80px rgba(2,6,23,.25)', marginBottom: 22 }}>
        <div style={{ color: '#93c5fd', textTransform: 'uppercase', fontWeight: 950, letterSpacing: 1.3, fontSize: 12 }}>Staff Portal OS Phase 5</div>
        <h1 style={{ margin: '8px 0', fontSize: 38 }}>Route Audit & Permissions Map</h1>
        <p style={{ color: '#dbeafe', fontWeight: 760, lineHeight: 1.6, margin: 0, maxWidth: 900 }}>
          Staff Portal route inventory mapped to permission keys for user management and deployment QA.
        </p>
      </section>

      <section style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 26, padding: 18, boxShadow: '0 18px 55px rgba(15,23,42,.07)' }}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>Route manifest</h2>
        <p style={{ color: '#64748b', fontWeight: 750 }}>
          {STAFF_PORTAL_ROUTES.length} routes registered. Duplicates: {duplicates.length}.
        </p>
        {STAFF_PORTAL_ROUTES.map((route) => (
          <div key={route.href} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(180px,.3fr) minmax(180px,.3fr)', gap: 12, borderBottom: '1px solid #f1f5f9', padding: '13px 0', alignItems: 'center' }}>
            <div>
              <strong style={{ color: '#0f172a' }}>{route.label}</strong>
              <div style={{ color: '#64748b', fontWeight: 720, marginTop: 4 }}>{route.href}</div>
            </div>
            <span style={{ color: '#2563eb', fontWeight: 900 }}>{route.permission}</span>
            <span style={{ color: '#475569', fontWeight: 900 }}>{route.area} · {route.criticality}</span>
          </div>
        ))}
      </section>
    </AppShell>
  )
}
TSX

# Patch permissions if file exists
if [ -f "lib/auth/permissions.ts" ]; then
  cp "lib/auth/permissions.ts" "lib/auth/permissions.ts.backup_staff_portal_phase5_$(date +%Y%m%d_%H%M%S)"
  python3 - <<'PY'
from pathlib import Path

p = Path("lib/auth/permissions.ts")
text = p.read_text()

staff_module = """  staff_portal: [
    'staff_portal.view',
    'staff_portal.manager',
    'staff_portal.intelligence',
    'staff_portal.admin',
    'staff_services.view',
    'staff_services.create',
    'staff_services.admin',
    'staff_memos.admin',
  ],
"""

if "  staff_portal: [" not in text and "MODULE_PERMISSIONS" in text:
    text = text.replace("} as const\n\nexport const MODULE_ACCESS_LINKS", staff_module + "} as const\n\nexport const MODULE_ACCESS_LINKS")
    print("OK added staff_portal namespace to MODULE_PERMISSIONS")
else:
    print("OK staff_portal namespace already exists or MODULE_PERMISSIONS not found")

links = """  { label: 'Staff Portal', href: '/staff-home', permission: 'staff_portal.view' },
  { label: 'Staff Services', href: '/staff-services', permission: 'staff_services.view' },
  { label: 'Staff Services Admin', href: '/staff-services/admin', permission: 'staff_services.admin' },
  { label: 'Staff Memos', href: '/staff-memos', permission: 'staff_memos.admin' },
  { label: 'Team Command', href: '/team-command', permission: 'staff_portal.manager' },
  { label: 'Staff Portal Intelligence', href: '/staff-portal-intelligence', permission: 'staff_portal.intelligence' },
"""

if "{ label: 'Staff Portal', href: '/staff-home', permission: 'staff_portal.view' }" not in text and "MODULE_ACCESS_LINKS" in text:
    text = text.replace("] as const\n\nexport type ModuleKey", links + "] as const\n\nexport type ModuleKey")
    print("OK added Staff Portal entries to MODULE_ACCESS_LINKS")
else:
    print("OK Staff Portal links already exist or MODULE_ACCESS_LINKS not found")

access = """  {
    key: "staff_portal.view",
    href: "/staff-home",
  },
  {
    key: "staff_services.view",
    href: "/staff-services",
  },
  {
    key: "staff_portal.manager",
    href: "/team-command",
  },
  {
    key: "staff_memos.admin",
    href: "/staff-memos",
  },
"""

if 'key: "staff_portal.view"' not in text and "export const MODULE_ACCESS" in text:
    text = text.replace("] as const;\n\nexport function hasPermission", access + "] as const;\n\nexport function hasPermission")
    print("OK added Staff Portal entries to MODULE_ACCESS")
else:
    print("OK Staff Portal MODULE_ACCESS entries already exist or MODULE_ACCESS not found")

p.write_text(text)
PY
else
  echo "WARN lib/auth/permissions.ts not found, skipping permission registry patch."
fi

echo "Staff Portal OS Phase 5 installed:"
for f in \
  "lib/staff-portal-os/phase5-routes.ts" \
  "app/(protected)/staff-portal-navigation/page.tsx" \
  "app/(protected)/staff-portal-route-audit/page.tsx"
do
  if [ -f "$APP_ROOT/$f" ]; then echo "OK  $f"; else echo "MISS $f"; fi
done

echo ""
echo "No SQL required."
echo "Now run:"
echo "rm -rf .next"
echo "npm run build"

#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"
cd "$ROOT"

python3 - <<'PY'
from pathlib import Path
import re

nav = """const CARELINK_OPS_SIDE_NAV = [
  { label: 'Overview', href: '/carelink-ops' },
  { label: 'Dispatch', href: '/carelink-ops/dispatch' },
  { label: 'Missions', href: '/carelink-ops/missions' },
  { label: 'Agents', href: '/carelink-ops/agents' },
  { label: 'Schedule', href: '/carelink-ops/schedule' },
  { label: 'Incidents', href: '/carelink-ops/incidents' },
  { label: 'Reports', href: '/carelink-ops/reports' },
  { label: 'Compliance', href: '/carelink-ops/compliance' },
  { label: 'Settings', href: '/carelink-ops/settings' },
] as const
"""

def ensure_nav_constant(s: str) -> str:
    if "CARELINK_OPS_SIDE_NAV" in s:
        return s
    marker = "const NAV = ["
    idx = s.find(marker)
    if idx != -1:
        return s[:idx] + nav + "\n" + s[idx:]
    # fallback after imports
    lines = s.splitlines()
    insert_at = 0
    for i, line in enumerate(lines):
        if line.startswith("import "):
            insert_at = i + 1
    lines.insert(insert_at, "")
    lines.insert(insert_at + 1, nav.rstrip())
    return "\n".join(lines) + "\n"

def patch_control(path: Path):
    if not path.exists():
        return False
    s = path.read_text()
    if "import Link from 'next/link'" not in s:
        s = s.replace("'use client'\n", "'use client'\n\nimport Link from 'next/link'\n", 1)
    s = ensure_nav_constant(s)
    start = s.find("function CareLinkOpsSidebar()")
    if start == -1:
        return False
    end = s.find("\n\nfunction ActionButton", start)
    if end == -1:
        return False
    replacement = """function CareLinkOpsSidebar() {
  return (
    <aside className=\"sticky top-0 h-screen border-r border-slate-200 bg-white px-4 py-5\">
      <div className=\"mb-8 flex items-center gap-3\">
        <div className=\"grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-black text-white shadow-lg shadow-blue-100\">AC</div>
        <div><p className=\"text-lg font-black\">AngelCare</p><p className=\"text-xs font-bold text-slate-500\">CareLink Ops</p></div>
      </div>
      <nav className=\"space-y-1\">
        {CARELINK_OPS_SIDE_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-black transition ${item.href === '/carelink-ops/dispatch' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <span>{item.label}</span>
            {item.label === 'Incidents' ? <span className=\"rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white\">!</span> : null}
          </Link>
        ))}
      </nav>
      <div className=\"absolute bottom-5 left-4 right-4 space-y-3\">
        <div className=\"rounded-3xl border border-slate-200 bg-white p-4 shadow-sm\"><p className=\"text-xs font-black uppercase tracking-[.2em] text-slate-500\">Live System Status</p><p className=\"mt-3 text-sm font-bold text-emerald-700\">● Dispatch shell ready</p><p className=\"mt-1 text-xs font-semibold text-slate-500\">No demo data loaded.</p></div>
      </div>
    </aside>
  )
}"""
    s = s[:start] + replacement + s[end:]
    path.write_text(s)
    return True

def patch_workspace(path: Path):
    if not path.exists():
        return False
    s = path.read_text()
    if "import Link from 'next/link'" not in s:
        s = s.replace("'use client'\n", "'use client'\n\nimport Link from 'next/link'\n", 1)
    s = ensure_nav_constant(s)
    start = s.find("function CareLinkOpsSidebar()")
    if start == -1:
        return False
    end = s.find("\n\nfunction StatusBanner", start)
    if end == -1:
        return False
    replacement = """function CareLinkOpsSidebar() {
  return (
    <aside className=\"sticky top-0 h-screen border-r border-slate-200 bg-white p-5\">
      <div className=\"mb-8 flex items-center gap-3\">
        <div className=\"grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 font-black text-white\">AC</div>
        <div><p className=\"font-black\">AngelCare</p><p className=\"text-xs font-bold text-slate-500\">CareLink Ops</p></div>
      </div>
      <nav className=\"space-y-1\">
        {CARELINK_OPS_SIDE_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cx('flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-black transition', item.href === '/carelink-ops/dispatch' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50')}
          >
            <span>{item.label}</span>
            {item.label === 'Incidents' ? <span className=\"rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white\">!</span> : null}
          </Link>
        ))}
      </nav>
      <div className=\"absolute bottom-5 left-5 right-5 rounded-3xl border border-slate-200 bg-slate-50 p-4\"><p className=\"text-xs font-black uppercase tracking-widest text-slate-500\">Live System</p><p className=\"mt-2 text-sm font-bold text-slate-700\">Production data only</p><p className=\"mt-1 text-xs text-slate-500\">No demo, seed, or static operational records.</p></div>
    </aside>
  )
}"""
    s = s[:start] + replacement + s[end:]
    path.write_text(s)
    return True

changed = []
if patch_control(Path('components/carelink/ops/dispatch/CareLinkDispatchControlCenter.tsx')):
    changed.append('CareLinkDispatchControlCenter.tsx')
if patch_workspace(Path('components/carelink/ops/dispatch/CareLinkDispatchWorkspacePage.tsx')):
    changed.append('CareLinkDispatchWorkspacePage.tsx')
if not changed:
    raise SystemExit('No sidebar functions found to patch. Check component file paths.')
print('Patched sidebar navigation in:', ', '.join(changed))
PY

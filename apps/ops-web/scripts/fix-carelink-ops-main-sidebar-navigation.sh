#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"

TARGET="components/carelink/ops/CareLinkOpsProductionDashboard.tsx"
if [ ! -f "$TARGET" ]; then
  echo "ERROR: $TARGET not found" >&2
  exit 1
fi

cp "$TARGET" "$TARGET.sidebar-nav-backup.$(date +%Y%m%d%H%M%S)"

python3 - <<'PY'
from pathlib import Path
import re

p = Path('components/carelink/ops/CareLinkOpsProductionDashboard.tsx')
s = p.read_text()

# Ensure useEffect is imported from React.
if "from 'react'" in s:
    def fix_import(m):
        imports = [x.strip() for x in m.group(1).split(',') if x.strip()]
        if 'useEffect' not in imports:
            imports.insert(0, 'useEffect')
        order = ['useEffect', 'useMemo', 'useRef', 'useState', 'useCallback']
        ordered = [x for x in order if x in imports] + [x for x in imports if x not in order]
        # de-dupe preserving order
        seen = []
        for item in ordered:
            if item not in seen:
                seen.append(item)
        return "import { " + ', '.join(seen) + " } from 'react'"
    s = re.sub(r"import\s+\{([^}]+)\}\s+from\s+'react'", fix_import, s, count=1)
else:
    s = "import { useEffect } from 'react'\n" + s

marker = 'CARELINK_OPS_MAIN_SIDEBAR_NAV_FIX'
if marker not in s:
    snippet = f'''\n  // {marker}: make the left CareLink Ops sidebar real navigation on the overview page.\n  useEffect(() => {{\n    const routes: Record<string, string> = {{\n      overview: '/carelink-ops',\n      dispatch: '/carelink-ops/dispatch',\n      missions: '/carelink-ops/missions',\n      agents: '/carelink-ops/agents',\n      schedule: '/carelink-ops/schedule',\n      incidents: '/carelink-ops/incidents',\n      reports: '/carelink-ops/reports',\n      compliance: '/carelink-ops/compliance',\n      settings: '/carelink-ops/settings',\n    }}\n\n    const normalize = (value: string) =>\n      value.toLowerCase().replace(/[^a-z]/g, ' ').replace(/\\s+/g, ' ').trim()\n\n    const handleSidebarClick = (event: MouseEvent) => {{\n      const target = event.target as HTMLElement | null\n      const clickable = target?.closest('a, button, [role="button"]') as HTMLElement | null\n      if (!clickable) return\n\n      const sidebar = clickable.closest('aside')\n      if (!sidebar) return\n\n      const label = normalize(clickable.textContent || '')\n      const match = Object.entries(routes).find(([key]) => label === key || label.includes(key))\n      if (!match) return\n\n      const [, href] = match\n      if (window.location.pathname === href) return\n\n      event.preventDefault()\n      event.stopPropagation()\n      window.location.assign(href)\n    }}\n\n    document.addEventListener('click', handleSidebarClick, true)\n    return () => document.removeEventListener('click', handleSidebarClick, true)\n  }}, [])\n'''

    # Insert after the opening brace of the exported/default dashboard function.
    patterns = [
        r"(export\s+function\s+CareLinkOpsProductionDashboard\s*\([^)]*\)\s*\{)",
        r"(function\s+CareLinkOpsProductionDashboard\s*\([^)]*\)\s*\{)",
        r"(const\s+CareLinkOpsProductionDashboard\s*=\s*\([^)]*\)\s*=>\s*\{)",
    ]
    for pat in patterns:
        m = re.search(pat, s)
        if m:
            insert_at = m.end()
            s = s[:insert_at] + snippet + s[insert_at:]
            break
    else:
        raise SystemExit('Could not find CareLinkOpsProductionDashboard function opening to insert nav fix')

p.write_text(s)
print('Patched CareLinkOpsProductionDashboard sidebar navigation.')
PY

echo "Done. Now run: rm -rf .next && npm run build && npm run dev"

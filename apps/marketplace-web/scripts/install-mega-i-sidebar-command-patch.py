from pathlib import Path
import re

shell = Path('components/b2b-partnerships/B2BPartnershipsModuleShell.tsx')
if shell.exists():
    s = shell.read_text()
    if 'Campaigns & Sequences' not in s or 'Import Hub' not in s or 'Automation & Scoring' not in s:
        start = s.find('const navItems = [')
        if start != -1:
            bracket_start = s.find('[', start)
            depth = 0
            end = None
            for i in range(bracket_start, len(s)):
                if s[i] == '[':
                    depth += 1
                elif s[i] == ']':
                    depth -= 1
                    if depth == 0:
                        end = i + 1
                        break
            if end:
                nav = """const navItems = [
  { label: 'Command Center', href: '/b2b-partnerships', icon: '📊', description: 'Executive cockpit' },
  { label: 'Prospect Directory', href: '/b2b-partnerships/prospects', icon: '🏢', description: 'Hotels, clinics, decision makers' },
  { label: 'Pipeline Board', href: '/b2b-partnerships/pipeline', icon: '🎯', description: 'Deal stages and priorities' },
  { label: 'Outreach Cockpit', href: '/b2b-partnerships/outreach', icon: '📨', description: 'Calls, emails, WhatsApp, scripts' },
  { label: 'Templates & Scripts', href: '/b2b-partnerships/templates', icon: '✍️', description: 'French email, WhatsApp and call library' },
  { label: 'Campaigns & Sequences', href: '/b2b-partnerships/campaigns', icon: '🚀', description: 'Multi-step B2B outreach campaigns' },
  { label: 'Import Hub', href: '/b2b-partnerships/imports', icon: '📥', description: 'CSV intake, validation and promotion' },
  { label: 'Automation & Scoring', href: '/b2b-partnerships/automation', icon: '⚙️', description: 'Rules, scores, follow-ups and triggers' },
  { label: 'Meetings & Follow-ups', href: '/b2b-partnerships/meetings', icon: '📅', description: 'Discovery and next steps' },
  { label: 'Tasks & Assignments', href: '/b2b-partnerships/tasks', icon: '✅', description: 'Daily execution board' },
  { label: 'Intern Execution OS', href: '/b2b-partnerships/execution', icon: '⚡', description: 'Targets, cadence, discipline' },
  { label: 'Partnership Proposals', href: '/b2b-partnerships/proposals', icon: '📄', description: 'Deal desk and offers' },
  { label: 'Partner Programs', href: '/b2b-partnerships/programs', icon: '🤝', description: 'Hotel and clinic B2B offers' },
  { label: 'Reports & KPIs', href: '/b2b-partnerships/reports', icon: '📈', description: 'Weekly reporting suite' },
  { label: 'Executive KPIs', href: '/b2b-partnerships/kpis', icon: '🏆', description: 'Leadership performance view' },
  { label: 'Settings & Controls', href: '/b2b-partnerships/settings', icon: '🛠️', description: 'Configuration and governance' },
]"""
                shell.write_text(s[:start] + nav + s[end:])
                print('Sidebar navItems refreshed with MEGA I workspaces.')
        else:
            print('Could not find navItems in shell file; no sidebar patch applied.')
    else:
        print('Sidebar already contains MEGA I navigation items.')
else:
    print('B2BPartnershipsModuleShell.tsx not found; copy MEGA E/H shell first.')

cmd = Path('components/b2b-partnerships/B2BEnterpriseCommandCenter.tsx')
if cmd.exists():
    s = cmd.read_text()
    replacements = {
        "/b2b-partnerships/imports')}>Importer prospects": "/b2b-partnerships/imports')}>Import Hub",
        "/b2b-partnerships/campaigns')}>Créer campagne": "/b2b-partnerships/campaigns')}>Créer campagne",
    }
    for old, new in replacements.items():
        s = s.replace(old, new)
    if 'Automation & scoring' not in s and 'Créer proposition' in s:
        s = s.replace(
            "onClick={() => openWorkspace('/b2b-partnerships/proposals')}>Créer proposition",
            "onClick={() => openWorkspace('/b2b-partnerships/automation')}>Automation & scoring</button>\n          <button type=\"button\" className={styles.secondaryButton} onClick={() => openWorkspace('/b2b-partnerships/proposals')}>Créer proposition"
        )
    cmd.write_text(s)
    print('Command center quick actions patched where possible.')

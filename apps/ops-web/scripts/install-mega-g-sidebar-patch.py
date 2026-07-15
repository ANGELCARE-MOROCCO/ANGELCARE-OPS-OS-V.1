from pathlib import Path

path = Path('components/b2b-partnerships/B2BPartnershipsModuleShell.tsx')
if not path.exists():
    raise SystemExit('B2BPartnershipsModuleShell.tsx not found. Install MEGA E sidebar first.')
text = path.read_text()
items = [
"""  {
    label: 'Campaigns & Sequences',
    href: '/b2b-partnerships/campaigns',
    icon: '🚀',
    description: 'Multi-touch campaigns and cadence',
  },""",
"""  {
    label: 'Import Hub',
    href: '/b2b-partnerships/imports',
    icon: '📥',
    description: 'CSV staging and data quality',
  },""",
"""  {
    label: 'Automation & Scoring',
    href: '/b2b-partnerships/automation',
    icon: '⚙️',
    description: 'Rules, scoring, assignments',
  },""",
]
insert_after = """  {
    label: 'Templates & Scripts',
    href: '/b2b-partnerships/templates',
    icon: '🧠',
    description: 'French outreach library',
  },"""
if "Campaigns & Sequences" in text:
    print('MEGA G sidebar items already installed.')
    raise SystemExit
if insert_after in text:
    text = text.replace(insert_after, insert_after + '\n' + '\n'.join(items))
else:
    marker = "const navItems = ["
    text = text.replace(marker, marker + '\n' + '\n'.join(items))
path.write_text(text)
print('Installed MEGA G sidebar entries: Campaigns, Imports, Automation.')

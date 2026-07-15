from pathlib import Path

p = Path('components/b2b-partnerships/B2BPartnershipsModuleShell.tsx')
if not p.exists():
    print('B2BPartnershipsModuleShell.tsx not found. Add Templates nav item manually from README.')
    raise SystemExit(0)

s = p.read_text()
if "href: '/b2b-partnerships/templates'" in s:
    print('Templates nav item already exists.')
    raise SystemExit(0)

needle = """  {
    label: 'Meetings & Follow-ups',"""
insert = """  {
    label: 'Templates & Scripts',
    href: '/b2b-partnerships/templates',
    icon: '✉️',
    description: 'Emails, WhatsApp, calls and scripts',
  },
"""
if needle not in s:
    print('Could not find Meetings nav anchor. Add Templates nav item manually from README.')
    raise SystemExit(0)

p.write_text(s.replace(needle, insert + needle))
print('Templates & Scripts nav item inserted into B2B sidebar.')

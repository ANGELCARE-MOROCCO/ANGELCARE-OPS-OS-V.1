from pathlib import Path

p = Path('components/b2b-partnerships/B2BPartnershipsModuleShell.tsx')
if not p.exists():
    raise SystemExit('B2BPartnershipsModuleShell.tsx not found')
s = p.read_text()
if "href: '/b2b-partnerships/integration'" in s:
    print('MEGA H sidebar entry already present')
    raise SystemExit
needle = """  {
    label: 'Outreach Cockpit',
    href: '/b2b-partnerships/outreach',
    icon: '📨',
    description: 'Calls, emails, WhatsApp, scripts',
  },"""
insert = needle + """
  {
    label: 'Integration Hub',
    href: '/b2b-partnerships/integration',
    icon: '🧭',
    description: 'Direct actions, timeline and configurable execution',
  },"""
if needle in s:
    s = s.replace(needle, insert)
else:
    start = s.find('const navItems = [')
    if start == -1:
        raise SystemExit('Could not find navItems array')
    bracket = s.find('[', start)
    s = s[:bracket+1] + """
  {
    label: 'Integration Hub',
    href: '/b2b-partnerships/integration',
    icon: '🧭',
    description: 'Direct actions, timeline and configurable execution',
  },""" + s[bracket+1:]
p.write_text(s)
print('MEGA H sidebar entry installed: Integration Hub')

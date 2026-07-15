from pathlib import Path
p=Path('components/b2b-partnerships/B2BPartnershipsModuleShell.tsx')
s=p.read_text()
if "href: '/b2b-partnerships/intelligence'" in s:
    print('MEGA J sidebar items already installed')
    raise SystemExit
insert="""
  {
    label: 'Executive Intelligence',
    href: '/b2b-partnerships/intelligence',
    icon: '🧠',
    description: 'Leadership control tower and risks',
  },
  {
    label: 'Quality Center',
    href: '/b2b-partnerships/quality',
    icon: '🛡️',
    description: 'System health and QA checks',
  },
"""
marker="  {\n    label: 'Settings & Controls',"
if marker in s:
    s=s.replace(marker, insert+marker)
else:
    # fallback: insert before closing nav array bracket
    idx=s.find(']\n\nfunction isActive')
    if idx==-1: raise SystemExit('Could not locate navItems array end')
    s=s[:idx]+insert+s[idx:]
p.write_text(s)
print('MEGA J sidebar patch installed')

from pathlib import Path
p = Path('components/b2b-partnerships/B2BEnterpriseCommandCenter.tsx')
if not p.exists():
    print('B2BEnterpriseCommandCenter.tsx not found; skipping')
    raise SystemExit
s = p.read_text()
if "openWorkspace('/b2b-partnerships/integration')" in s:
    print('Command center already links Integration Hub')
    raise SystemExit
# Put Integration Hub beside templates if there is an action bar.
s = s.replace(
    "onClick={() => openWorkspace('/b2b-partnerships/templates')}>Templates & scripts",
    "onClick={() => openWorkspace('/b2b-partnerships/templates')}>Templates & scripts</button>\n          <button type=\"button\" className={styles.secondaryButton} onClick={() => openWorkspace('/b2b-partnerships/integration')}>Actions directes"
)
p.write_text(s)
print('Command center action button installed: Actions directes')

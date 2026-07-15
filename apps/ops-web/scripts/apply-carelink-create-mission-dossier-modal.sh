#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
TARGET="components/carelink/ops/missions/CareLinkMissionControlCenter.tsx"
COMPONENT="components/carelink/ops/missions/CareLinkCreateMissionDossierModal.tsx"

if [ ! -f "$TARGET" ]; then
  echo "Missing $TARGET. Inject Mega 03 CareLink Ops Mission Control UI first."
  exit 1
fi

if [ ! -f "$COMPONENT" ]; then
  echo "Missing $COMPONENT. Make sure the zip was extracted at the project root."
  exit 1
fi

cp "$TARGET" "$TARGET.before-create-mission-dossier-modal.$(date +%Y%m%d%H%M%S).bak"

python3 - <<'PY'
from pathlib import Path
p = Path('components/carelink/ops/missions/CareLinkMissionControlCenter.tsx')
s = p.read_text()
import_line = "import { CareLinkCreateMissionDossierModal } from './CareLinkCreateMissionDossierModal'\n"
if import_line not in s:
    marker = "import type { MissionControlRecord, MissionDossier } from '@/lib/missions/types'\n"
    if marker in s:
        s = s.replace(marker, marker + import_line, 1)
    else:
        lines = s.splitlines(True)
        insert_at = 0
        for i, line in enumerate(lines):
            if line.startswith('import '):
                insert_at = i + 1
        lines.insert(insert_at, import_line)
        s = ''.join(lines)
old = "{modal.type === 'create' && <CreateDossierModal close={() => setModal({ type: 'none' })} refresh={refresh} />}"
new = "{modal.type === 'create' && <CareLinkCreateMissionDossierModal close={() => setModal({ type: 'none' })} refresh={refresh} />}"
if old in s:
    s = s.replace(old, new, 1)
elif 'CareLinkCreateMissionDossierModal' in s and "modal.type === 'create'" in s:
    pass
else:
    raise SystemExit('Could not find the create modal render line. Search for modal.type === create manually.')
p.write_text(s)
print('Patched CareLink Mission Control Center to use the new wide Create Mission Dossier modal.')
PY

echo "Done. Now run: rm -rf .next && npm run build"

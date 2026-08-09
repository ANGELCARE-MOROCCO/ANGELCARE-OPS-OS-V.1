#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"
python3 - "$ROOT" <<'PY'
import re, sys
from pathlib import Path
root=Path(sys.argv[1])
paths=[]
for p in list((root/'components'/'market-os').glob('*.tsx')) + list((root/'app').glob('**/market-os/**/*.tsx')):
    if not p.exists():
        continue
    text=p.read_text(errors='ignore')
    missing=[]
    for m in re.finditer(r'<button\b([^>]*)>', text, re.S):
        attrs=m.group(1)
        if 'onClick' not in attrs and 'MarketActionButton' not in text[max(0,m.start()-200):m.start()+200]:
            line=text[:m.start()].count('\n')+1
            missing.append(line)
    if missing:
        paths.append((p, missing))
print('MARKET-OS ZERO-DEAD-BUTTON SCAN')
print('================================')
if not paths:
    print('PASS: no plain Market-OS <button> tags without onClick detected.')
else:
    print(f'FAIL: {sum(len(x) for _,x in paths)} static buttons detected')
    for p, lines in paths:
        print(f'- {p.relative_to(root)} -> lines {lines}')
    sys.exit(1)
PY

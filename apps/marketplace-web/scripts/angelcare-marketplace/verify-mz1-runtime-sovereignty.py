from __future__ import annotations
from pathlib import Path
import collections
import re
import sys

ROOT = Path.cwd().resolve()
EXTS = ['.ts','.tsx','.js','.jsx','.mjs','.cjs','.css','.json']
ENTRY_DIRS = [
    ROOT / 'app/angelcare-marketplace',
    ROOT / 'app/api/angelcare-marketplace',
    ROOT / 'app/admin',
]
ENTRY_FILES = [
    'app/layout.tsx','app/globals.css','app/error.tsx','app/global-error.tsx','app/not-found.tsx',
    'middleware.ts','proxy.ts','instrumentation.ts','instrumentation-client.ts','next.config.ts','postcss.config.mjs',
]
PATTERNS = [
    re.compile(r'''(?:import|export)\s+(?:[^'\"]*?\s+from\s+)?['\"]([^'\"]+)['\"]'''),
    re.compile(r'''import\s*\(\s*['\"]([^'\"]+)['\"]\s*\)'''),
    re.compile(r'''require\s*\(\s*['\"]([^'\"]+)['\"]\s*\)'''),
]
CSS_PATTERN = re.compile(r'''@import\s+(?:url\()?['\"]([^'\"]+)['\"]''')
NON_LITERAL = [
    re.compile(r'''import\s*\(\s*([^'\"\s][^)]*)\)'''),
    re.compile(r'''require\s*\(\s*([^'\"\s][^)]*)\)'''),
]


def resolve(spec: str, src: Path):
    if not (spec.startswith('.') or spec.startswith('@/')):
        return None, 'external'
    base = ROOT / spec[2:] if spec.startswith('@/') else src.parent / spec
    base = Path(str(base).split('?')[0].split('#')[0])
    candidates = [base] if base.suffix else [Path(str(base)+e) for e in EXTS] + [base / f'index{e}' for e in EXTS]
    for candidate in candidates:
        if candidate.exists() and candidate.is_file():
            return candidate.resolve(), 'local'
    return base.resolve(), 'unresolved'

entries=[]
for base in ENTRY_DIRS:
    if base.exists():
        entries.extend(p for p in base.rglob('*') if p.is_file() and p.suffix in EXTS)
for rel in ENTRY_FILES:
    p=ROOT/rel
    if p.exists(): entries.append(p)

reachable=set()
unresolved=[]
nonliteral=[]
queue=collections.deque(p.resolve() for p in entries)
while queue:
    rp=queue.popleft()
    if rp in reachable: continue
    reachable.add(rp)
    p=Path(rp)
    try: body=p.read_text(encoding='utf-8',errors='replace')
    except Exception: continue
    specs=[]
    for pattern in PATTERNS: specs.extend(pattern.findall(body))
    if p.suffix == '.css': specs.extend(CSS_PATTERN.findall(body))
    for spec in specs:
        resolved, kind = resolve(spec,p)
        if kind == 'local' and resolved not in reachable: queue.append(resolved)
        elif kind == 'unresolved': unresolved.append((p.relative_to(ROOT).as_posix(),spec))
    if p.suffix in {'.ts','.tsx','.js','.jsx','.mjs','.cjs'}:
        for pattern in NON_LITERAL:
            for match in pattern.finditer(body):
                nonliteral.append((p.relative_to(ROOT).as_posix(),match.group(1).strip()[:160]))

runtime_cross=[]
for rp in reachable:
    rel=Path(rp).relative_to(ROOT).as_posix().lower()
    if any(token in rel for token in ['revenue-command-os','flashcards-os','carelink','email-os','ac-whatsapp','angelcare360','social-command','market-os/']):
        runtime_cross.append(rel)

out = Path(__import__('os').environ.get('MZ1_REACHABLE_REPORT', '/tmp/angelcare-marketplace-mz1-reachable.txt'))
out.write_text('\n'.join(sorted(Path(p).relative_to(ROOT).as_posix() for p in reachable))+'\n',encoding='utf-8')

print(f'Entries: {len(entries)}')
print(f'Reachable source files: {len(reachable)}')
print(f'Unresolved local imports: {len(unresolved)}')
print(f'Non-literal import/require expressions: {len(nonliteral)}')
print(f'Cross-product runtime path hits: {len(runtime_cross)}')
if unresolved:
    for src,spec in unresolved[:50]: print(f'UNRESOLVED {src} -> {spec}')
if nonliteral:
    for src,expr in nonliteral[:50]: print(f'NONLITERAL {src} -> {expr}')
if runtime_cross:
    for rel in sorted(runtime_cross)[:50]: print(f'CROSS_RUNTIME {rel}')
if unresolved or nonliteral or runtime_cross:
    raise SystemExit(1)
print('MZ1 RUNTIME SOVEREIGNTY: PASS')

from pathlib import Path, PurePosixPath
import hashlib, json, os, sys, zipfile
base=Path(__file__).resolve().parent
receipt=json.loads((base/'checkpoint.json').read_text())
root=Path('/private/tmp/jobkix-source-20261020')
sha=lambda b:hashlib.sha256(b).hexdigest()
verify_only='--verify-only' in sys.argv
planned=[]
for item in receipt['archives']:
 archive=base/item['filename']
 if sha(archive.read_bytes())!=item['sha256']:raise RuntimeError('Archive checksum mismatch')
 with zipfile.ZipFile(archive) as z:
  if z.testzip():raise RuntimeError('Archive integrity failure')
  manifest=json.loads(z.read('MANIFEST.json'))
  names=z.namelist()
  if len(names)!=len(set(names)) or set(names)!={r['path'] for r in manifest['files']}|{'MANIFEST.json'}:raise RuntimeError('Archive inventory mismatch')
  for row in manifest['files']:
   name=row['path']; p=PurePosixPath(name)
   if p.is_absolute() or any(x in ('..','.') for x in p.parts) or chr(92) in name:raise RuntimeError('Unsafe archive path')
   data=z.read(name)
   if len(data)!=row['bytes'] or sha(data)!=row['sha256']:raise RuntimeError('Payload checksum mismatch: '+name)
   target=None
   if name.startswith('_recovery/'):target=root/name[len('_recovery/'):]
   elif item['kind']=='verification-tools':target=root/name
   if target is not None:planned.append((target,data,row['sha256']))
print('CHECKPOINT_ARCHIVES_AND_HASHES=PASS')
if not verify_only:
 for target,data,expected in planned:
  for parent in [target,*target.parents]:
   if parent.is_symlink():raise RuntimeError('Unsafe temporary recovery symlink')
  if target.exists() and (not target.is_file() or sha(target.read_bytes())!=expected):raise RuntimeError('Conflicting temporary file; preserved: '+str(target))
 for target,data,expected in planned:
  if target.exists():continue
  target.parent.mkdir(parents=True,exist_ok=True)
  with target.open('xb') as f:f.write(data);f.flush();os.fsync(f.fileno())
 print('TEMPORARY_BACKUPS_AND_TEST_TOOLS=RESTORED_OR_IDENTICAL')
print('WORKSPACE_SOURCE=NOT_MODIFIED')

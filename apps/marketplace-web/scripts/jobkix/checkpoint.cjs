const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const app = path.resolve(__dirname, '../..');
const registryFile = path.join(app, 'docs/jobkix/changed-files.json');
const backupRoot = '/private/tmp/jobkix-source-20261020/baseline';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const requested = process.argv.slice(2);
if (!requested.length) throw Error('Usage: node scripts/jobkix/checkpoint.cjs relative-path ...');
const records = fs.existsSync(registryFile) ? JSON.parse(fs.readFileSync(registryFile, 'utf8')) : [];
for (const relative of requested) {
  if (relative.startsWith('/') || relative.includes('\\') || relative.split('/').some(p => !p || p === '.' || p === '..')) throw Error('Unsafe path');
  const file = path.join(app, relative);
  if (records.some(r => r.path === relative)) continue;
  let before = 'NEW';
  if (fs.existsSync(file)) {
    if (!fs.lstatSync(file).isFile()) throw Error('Expected regular file: ' + relative);
    const bytes = fs.readFileSync(file);
    before = hash(bytes);
    const target = path.join(backupRoot, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (fs.existsSync(target)) {
      if (hash(fs.readFileSync(target)) !== before) throw Error('Checkpoint conflict: ' + relative);
    } else fs.writeFileSync(target, bytes, { flag: 'wx', mode: 0o600 });
  }
  records.push({ path: relative, before, checkpoint: before === 'NEW' ? null : path.join(backupRoot, relative), requirement: 'JOBKIX execution contract; requirement bindings in source and reference registry' });
}
fs.writeFileSync(registryFile, JSON.stringify(records, null, 2) + '\n');
console.log('CHECKPOINTED=' + requested.length);

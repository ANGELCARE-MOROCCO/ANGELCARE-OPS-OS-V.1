import fs from 'fs';
import path from 'path';

const root = process.cwd();
const targets = ['components/market-os/ambassadors', 'app/(protected)/market-os/ambassadors', 'lib/ambassadors'];

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, results);
    else results.push(full);
  }
  return results;
}

const files = targets.flatMap((target) => walk(path.join(root, target)));
const byName = new Map();

for (const file of files) {
  const name = path.basename(file);
  if (!byName.has(name)) byName.set(name, []);
  byName.get(name).push(file);
}

console.log('Potential duplicate filename risks:');
for (const [name, list] of byName.entries()) {
  if (list.length > 1) {
    console.log(`\n${name}`);
    for (const file of list) console.log(`  - ${path.relative(root, file)}`);
  }
}

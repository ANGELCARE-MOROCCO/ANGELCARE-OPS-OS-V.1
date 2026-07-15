#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const target = path.join(process.cwd(), 'components/saas-factory/SaasFactoryCommandCenter.tsx');
if (!fs.existsSync(target)) {
  console.error('Missing components/saas-factory/SaasFactoryCommandCenter.tsx');
  process.exit(1);
}
const source = fs.readFileSync(target, 'utf8');
const required = [
  "key={`${probe.id || probe.name || 'probe'}-${index}`}",
  "key={`${item.key || item.label || 'health'}-${index}`}",
  "key={`${queue.key || queue.label || 'queue'}-${index}`}",
  "key={`${incident.id || incident.title || 'incident'}-${index}`}",
  "key={`${event.id || event.title || 'audit'}-${index}`}",
  "key={`${rec.id || rec.title || 'recommendation'}-${index}`}",
  "key={`${item.action || 'disabled-action'}-${index}`}",
];
const missing = required.filter((snippet) => !source.includes(snippet));
if (missing.length) {
  console.error('Key-fix verification failed. Missing composite key snippets:');
  missing.forEach((m) => console.error(' - ' + m));
  process.exit(1);
}
if (source.includes('probes.slice(0,10).map((probe) => <tr key={probe.id}')) {
  console.error('Old duplicate-prone probe key remains.');
  process.exit(1);
}
console.log('✓ Observatory duplicate React key fix verified.');

const fs = require('fs');
const path = require('path');

const required = [
  'components/saas-factory/SaasFactoryCommandCenter.tsx',
  'components/saas-factory/SaasFactoryCommandCenter.module.css',
  'lib/saas-factory/phase8-deep-runtime.ts',
  'app/api/saas-factory/panel/[page]/route.ts',
  'app/api/saas-factory/panel/action/route.ts',
  'app/api/saas-factory/readiness/full/route.ts',
  'database/20260528_saas_factory_phase8_deep_execution.sql',
];
let failed = false;
console.log('SAAS FACTORY PHASE 8 DEEP EXECUTION VERIFY');
console.log('==========================================');
for (const file of required) {
  const full = path.join(process.cwd(), file);
  if (fs.existsSync(full)) console.log(`✓ ${file}`);
  else { failed = true; console.log(`✗ Missing ${file}`); }
}
const component = fs.readFileSync(path.join(process.cwd(), 'components/saas-factory/SaasFactoryCommandCenter.tsx'), 'utf8');
for (const token of ['LiveExecutionPanel', '/api/saas-factory/panel/${resolvedPage}', 'refreshLivePanel']) {
  if (component.includes(token)) console.log(`✓ component token ${token}`);
  else { failed = true; console.log(`✗ missing component token ${token}`); }
}
if (failed) process.exit(1);
console.log('Ready.');

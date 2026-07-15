const routes = [
  '/market-os/ambassadors/enterprise-dashboard',
  '/market-os/ambassadors/backend-readiness',
  '/market-os/ambassadors/permission-matrix',
  '/market-os/ambassadors/audit-models',
  '/market-os/ambassadors/production-transition',
  '/market-os/ambassadors/final-infrastructure',
  '/market-os/ambassadors/live-execution',
  '/market-os/ambassadors/executive-command',
  '/market-os/ambassadors/market-dominance',
  '/market-os/ambassadors/operating-model',
  '/market-os/ambassadors/final-stabilization'
];

console.log('Ambassador OS route smoke checklist:');
for (const route of routes) {
  console.log(`- ${route}`);
}
console.log('\nOpen these manually after npm run build and npm run dev.');

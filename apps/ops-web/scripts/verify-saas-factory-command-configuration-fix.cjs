const fs = require('fs')
const path = require('path')
const root = process.cwd()
const required = [
  'app/(protected)/saas-factory-command/configuration/page.tsx',
  'components/saas-factory/configuration/SaasFactoryConfigurationCommand.tsx',
  'app/api/saas-factory/configuration/route.ts',
  'app/api/saas-factory/configuration/actions/route.ts',
  'app/api/saas-factory/configuration/validate/route.ts',
  'app/api/saas-factory/configuration/publish/route.ts',
  'app/api/saas-factory/configuration/rollback/route.ts',
  'app/api/saas-factory/configuration/export/route.ts',
]
let failed = false
function check(condition, message) { if (condition) console.log(`✓ ${message}`); else { console.error(`✗ ${message}`); failed = true } }
for (const file of required) check(fs.existsSync(path.join(root, file)), `${file} exists`)
const component = fs.readFileSync(path.join(root, 'components/saas-factory/configuration/SaasFactoryConfigurationCommand.tsx'), 'utf8')
check(component.includes('sidebarLinks') && component.includes('/saas-factory-command/deployment') && component.includes('/saas-factory-command/audit'), 'Configuration page sidebar restored with full SaaS Factory navigation')
check(component.includes('parseJsonResponse') && component.includes('returned HTML instead of JSON'), 'Configuration UI no longer crashes on HTML API responses')
check(component.includes('Configuration Status') && component.includes('statusRing'), 'Configuration sidebar uses production status card, not downgraded minimal menu')
check(component.includes('Publish Preview & Apply') && component.includes('Rollback Baseline Center') && component.includes('Export Builder'), 'Deep configuration workflows still present')
check(!/onClick=\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/.test(component), 'No empty onClick handlers')
check(!/console\.log\(/.test(component), 'No console.log handlers')
check(!/alert\(/.test(component), 'No alert handlers')
const route = fs.readFileSync(path.join(root, 'app/api/saas-factory/configuration/route.ts'), 'utf8')
check(route.includes("await import('@/lib/saas-factory/server')") && route.includes('NextResponse.json'), 'Configuration API is dynamic-import guarded and always returns JSON')
const forbidden = ['phase9','phase10','phase11','phase12','phase13','phase14','mega'].map((name) => `app/(protected)/saas-factory-command/${name}`)
for (const folder of forbidden) check(!fs.existsSync(path.join(root, folder)), `Forbidden route not created: ${folder}`)
if (failed) process.exit(1)
console.log('SAAS FACTORY CONFIGURATION FIX VERIFY PASSED')

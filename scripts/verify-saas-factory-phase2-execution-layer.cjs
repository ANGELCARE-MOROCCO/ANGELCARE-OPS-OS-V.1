const fs = require('fs')
const path = require('path')

const required = [
  'components/saas-factory/SaasFactoryCommandCenter.tsx',
  'components/saas-factory/SaasFactoryCommandCenter.module.css',
  'app/api/saas-factory/command/route.ts',
]

let ok = true
for (const file of required) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) {
    console.error(`✗ Missing ${file}`)
    ok = false
    continue
  }
  console.log(`✓ ${file}`)
}

const component = fs.readFileSync(path.join(process.cwd(), 'components/saas-factory/SaasFactoryCommandCenter.tsx'), 'utf8')
for (const token of ['/api/saas-factory/command', 'executeCommand', 'resolvedPage']) {
  if (!component.includes(token)) {
    console.error(`✗ Component missing ${token}`)
    ok = false
  } else {
    console.log(`✓ Component contains ${token}`)
  }
}

const route = fs.readFileSync(path.join(process.cwd(), 'app/api/saas-factory/command/route.ts'), 'utf8')
for (const token of ['saveFactoryOption', 'saveFactoryModule', 'saveFactoryIncident', 'saveFactoryAction', 'logAudit']) {
  if (!route.includes(token)) {
    console.error(`✗ Command route missing ${token}`)
    ok = false
  } else {
    console.log(`✓ Command route contains ${token}`)
  }
}

if (!ok) process.exit(1)
console.log('SaaS Factory Phase 2 Execution Layer patch installed.')

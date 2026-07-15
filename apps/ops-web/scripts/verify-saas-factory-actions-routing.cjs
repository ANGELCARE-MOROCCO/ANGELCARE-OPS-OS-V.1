const fs = require('fs')
const path = require('path')

const root = process.cwd()
const actionsPage = path.join(root, 'app/(protected)/saas-factory-command/actions/page.tsx')
const generic = path.join(root, 'components/saas-factory/SaasFactoryCommandCenter.tsx')
const dedicated = path.join(root, 'components/saas-factory/actions/SaasFactoryActionsCommandCenter.tsx')

const failures = []

if (!fs.existsSync(actionsPage)) failures.push(`Missing ${path.relative(root, actionsPage)}`)
if (!fs.existsSync(dedicated)) failures.push(`Missing ${path.relative(root, dedicated)}`)

if (fs.existsSync(actionsPage)) {
  const source = fs.readFileSync(actionsPage, 'utf8')
  if (!source.includes("SaasFactoryActionsCommandCenter")) {
    failures.push('Actions page does not use dedicated SaasFactoryActionsCommandCenter.')
  }
  if (source.includes("SaasFactoryCommandCenter") && !source.includes("SaasFactoryActionsCommandCenter")) {
    failures.push('Actions page still appears to use generic SaasFactoryCommandCenter.')
  }
}

if (fs.existsSync(generic)) {
  const source = fs.readFileSync(generic, 'utf8')
  if (source.includes('<ActionsPage')) {
    failures.push('Generic SaasFactoryCommandCenter still contains undefined <ActionsPage> reference.')
  }
  if (source.includes("page === 'actions'") && !source.includes('SaasFactoryActionsCommandCenter')) {
    failures.push("Generic actions branch exists but dedicated Actions component is not imported/used.")
  }
}

if (failures.length) {
  console.error('Actions routing verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Actions routing verification passed.')

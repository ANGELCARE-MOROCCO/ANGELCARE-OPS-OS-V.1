const fs = require('fs')
    const path = require('path')

    const root = process.cwd()
    const actionsPage = path.join(root, 'app/(protected)/saas-factory-command/actions/page.tsx')
    const generic = path.join(root, 'components/saas-factory/SaasFactoryCommandCenter.tsx')
    const dedicated = path.join(root, 'components/saas-factory/actions/SaasFactoryActionsCommandCenter.tsx')

    const failures = []

    if (!fs.existsSync(dedicated)) {
      failures.push(`Missing dedicated Actions component: ${path.relative(root, dedicated)}`)
    }

    fs.mkdirSync(path.dirname(actionsPage), { recursive: true })
    fs.writeFileSync(actionsPage, `import SaasFactoryActionsCommandCenter from '@/components/saas-factory/actions/SaasFactoryActionsCommandCenter'

export const dynamic = 'force-dynamic'

export default function Page() {
  return <SaasFactoryActionsCommandCenter />
}
`)
    console.log(`✅ Rewrote ${path.relative(root, actionsPage)} to use dedicated Actions component.`)

    if (fs.existsSync(generic)) {
      let source = fs.readFileSync(generic, 'utf8')
      const before = source

      if (source.includes("ActionsPage") && !source.includes("SaasFactoryActionsCommandCenter")) {
        const useClient = source.startsWith("'use client'") || source.startsWith('"use client"')
        const lines = source.split('\n')
        let insertIndex = 0

        if (useClient) {
          insertIndex = 1
          if (lines[1] === '') insertIndex = 2
        }

        lines.splice(insertIndex, 0, "import SaasFactoryActionsCommandCenter from '@/components/saas-factory/actions/SaasFactoryActionsCommandCenter'")
        source = lines.join('\n')
      }

      // Replace the undefined ActionsPage reference with the real dedicated component.
      source = source.replaceAll('<ActionsPage onAction={onAction}/>', '<SaasFactoryActionsCommandCenter />')
      source = source.replaceAll('<ActionsPage onAction={onAction} />', '<SaasFactoryActionsCommandCenter />')
      source = source.replaceAll('<ActionsPage />', '<SaasFactoryActionsCommandCenter />')

      if (source !== before) {
        fs.writeFileSync(generic, source)
        console.log(`✅ Patched ${path.relative(root, generic)} undefined ActionsPage reference.`)
      } else {
        console.log('ℹ️ Generic command center did not require patching.')
      }
    } else {
      console.log('ℹ️ Generic command center not found; direct page route was still repaired.')
    }

    if (failures.length) {
      console.error('Actions routing repair failed:')
      for (const failure of failures) console.error(`- ${failure}`)
      process.exit(1)
    }

    const pageSource = fs.readFileSync(actionsPage, 'utf8')
    if (!pageSource.includes('SaasFactoryActionsCommandCenter')) {
      console.error('❌ Actions page still does not import dedicated Actions component.')
      process.exit(1)
    }

    if (fs.existsSync(generic)) {
      const genericSource = fs.readFileSync(generic, 'utf8')
      if (genericSource.includes('<ActionsPage')) {
        console.error('❌ Generic command center still contains undefined <ActionsPage ...> usage.')
        process.exit(1)
      }
    }

    console.log('✅ Actions routing repair passed.')

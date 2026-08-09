import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const required = [
  'app/(protected)/market-os/content-command-center/ai-director/research-control/page.tsx',
  'app/api/market-os/content-command/research-control/snapshot/route.ts',
  'app/api/market-os/content-command/research-control/action/route.ts',
  'app/api/market-os/content-command/research-control/cron/route.ts',
  'components/market-os/content-command/research-control/ContentResearchControlWorkspace.tsx',
  'components/market-os/content-command/research-control/research-control.module.css',
  'lib/market-os/content-research/config.ts',
  'lib/market-os/content-research/orchestrator.ts',
  'lib/market-os/content-research/providers/tavily.ts',
  'lib/market-os/content-research/providers/openrouter.ts',
  'lib/market-os/content-research/repository.ts',
  'supabase/migrations/20260728_2200_content_command_research_runtime_control.sql',
]
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing Research Control file: ${file}`)
}
const nav = fs.readFileSync(path.join(root, 'components/market-os/content-command/content-command-navigation.tsx'), 'utf8')
const aiNav = fs.readFileSync(path.join(root, 'components/market-os/content-command/marketing-ai/MarketingAiDirectorWorkspace.tsx'), 'utf8')
for (const marker of ['ai-research-control', '/ai-director/research-control', 'Contrôle Recherche IA']) {
  if (!nav.includes(marker) && !aiNav.includes(marker)) throw new Error(`Navigation marker missing: ${marker}`)
}
const workspace = fs.readFileSync(path.join(root, required[4]), 'utf8')
for (const marker of ['Tavily Free', 'OpenRouter Free', 'Sources canoniques AC Capital', 'Actions externes toujours bloquées', 'CONTENT COMMAND AGENT FLEET']) {
  if (!workspace.includes(marker)) throw new Error(`Workspace contract marker missing: ${marker}`)
}
console.log('PASS — route, APIs, navigation and premium Research Control workspace are present')

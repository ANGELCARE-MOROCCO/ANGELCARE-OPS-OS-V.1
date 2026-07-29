import fs from 'node:fs'
import path from 'node:path'
const root = process.cwd()
const files = [
  'lib/market-os/content-research/config.ts','lib/market-os/content-research/providers/tavily.ts',
  'lib/market-os/content-research/providers/openrouter.ts','components/market-os/content-command/research-control/ContentResearchControlWorkspace.tsx',
]
const source = files.map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n')
for (const pattern of [/tvly-[A-Za-z0-9_-]{8,}/, /sk-or-v1-[A-Za-z0-9_-]{8,}/, /OPENROUTER_API_KEY\s*=\s*['"][^'"]+/, /TAVILY_API_KEY\s*=\s*['"][^'"]+/]) {
  if (pattern.test(source)) throw new Error(`Potential embedded provider secret detected: ${pattern}`)
}
if (!source.includes('La clé n’est jamais affichée') || !source.includes('process.env.TAVILY_API_KEY') || !source.includes('process.env.OPENROUTER_API_KEY')) throw new Error('Server-only credential boundary markers missing')
console.log('PASS — no Tavily/OpenRouter key is embedded or returned to the client')

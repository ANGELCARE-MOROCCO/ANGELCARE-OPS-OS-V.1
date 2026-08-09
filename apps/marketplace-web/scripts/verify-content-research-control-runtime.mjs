import fs from 'node:fs'
import path from 'node:path'
const root = process.cwd()
const files = [
  'lib/market-os/content-research/config.ts',
  'lib/market-os/content-research/policy.ts',
  'lib/market-os/content-research/providers/tavily.ts',
  'lib/market-os/content-research/providers/openrouter.ts',
  'lib/market-os/content-research/repository.ts',
  'lib/market-os/content-research/orchestrator.ts',
  'lib/market-os/content-command-headquarters/market-scan.ts',
  'app/api/market-os/content-command/research-control/cron/route.ts',
]
const source = files.map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n')
for (const marker of ['TAVILY_API_KEY', 'OPENROUTER_API_KEY', 'openrouter/free', 'ac_capital_public_source_registry', 'runDueContentResearchAgents', 'externalActionsAllowed: false']) {
  if (!source.includes(marker)) throw new Error(`Runtime marker missing: ${marker}`)
}
for (const forbidden of ['GEMINI_API_KEY', 'generateContent', 'googleSearchRetrieval', 'groundingMetadata']) {
  if (source.includes(forbidden)) throw new Error(`Gemini dependency remains in Research Control runtime: ${forbidden}`)
}
const orchestrator = fs.readFileSync(path.join(root, 'lib/market-os/content-research/orchestrator.ts'), 'utf8')
const order = ['search = await searchTavily', 'canonicalSources = await persistCanonicalSources', 'analysis = await analyzeWithOpenRouter', 'const persisted = await persistResearchFindings'].map((marker) => orchestrator.indexOf(marker))
if (order.some((index) => index < 0) || !(order[0] < order[1] && order[1] < order[2] && order[2] < order[3])) {
  throw new Error('Canonical Tavily → AC Capital → OpenRouter → internal materialization order is not preserved')
}
if (!orchestrator.includes('TAVILY_UNAVAILABLE_SEARXNG_NOT_CONFIGURED')) throw new Error('Truthful SearXNG-not-configured fallback state missing')
console.log('PASS — Tavily primary, AC Capital source authority, OpenRouter analysis, scheduling and external-only boundary verified')

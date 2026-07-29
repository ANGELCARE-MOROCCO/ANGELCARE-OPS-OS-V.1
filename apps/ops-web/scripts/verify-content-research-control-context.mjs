import fs from 'node:fs'
import path from 'node:path'
const root = process.cwd()
const workspace = fs.readFileSync(path.join(root, 'components/market-os/content-command/research-control/ContentResearchControlWorkspace.tsx'), 'utf8')
const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20260728_2200_content_command_research_runtime_control.sql'), 'utf8')
const agentCodes = [...sql.matchAll(/\('([A-Z_]+)','Agent /g)].map((match) => match[1])
const expected = ['OBSERVATORY_INTELLIGENCE','STRATEGIC_RESEARCH','BRIEF_ENRICHMENT','EDITORIAL_INTELLIGENCE','BRAND_CLAIMS_RESEARCH','CREATIVE_RESEARCH','SOURCE_INTEGRITY','EVIDENCE_RESEARCH','REVIEW_ASSISTANCE','PUBLICATION_READINESS']
for (const code of expected) if (!agentCodes.includes(code)) throw new Error(`Missing Content Command agent: ${code}`)
if (new Set(agentCodes).size < 10) throw new Error(`Expected at least 10 distinct Content Command agents, found ${new Set(agentCodes).size}`)
for (const marker of ['signaux Observatoire','opportunités de contenu','Fabrique stratégique','Planning éditorial','Evidence Lab','Readiness Publication']) {
  if (!workspace.includes(marker) && !sql.includes(marker)) throw new Error(`Content Command context marker missing: ${marker}`)
}
const commercialRoutes = ['/prospects','/accounts','/pipeline','/investors']
for (const route of commercialRoutes) if (workspace.includes(route)) throw new Error(`Commercial/prospecting route leaked into Content Research Control: ${route}`)
console.log('PASS — exactly scoped Content Command intelligence agents are present; no sales pipeline route was introduced')

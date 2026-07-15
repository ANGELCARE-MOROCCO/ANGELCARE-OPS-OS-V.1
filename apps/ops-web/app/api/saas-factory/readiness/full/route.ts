import { existsSync } from 'fs'
import { readdir, readFile } from 'fs/promises'
import path from 'path'
import { jsonError, jsonOk } from '@/lib/saas-factory/phase8-deep-runtime'
import { audit } from '@/lib/saas-factory/phase7-ops-runtime'

export const dynamic = 'force-dynamic'

const required = [
  'components/saas-factory/SaasFactoryCommandCenter.tsx',
  'components/saas-factory/adapters/FactoryOptionSelect.tsx',
  'components/saas-factory/adapters/ModuleLiveFields.tsx',
  'lib/saas-factory/phase8-deep-runtime.ts',
  'app/api/saas-factory/panel/[page]/route.ts',
  'app/api/saas-factory/ops/probes/run/route.ts',
]

async function countRoutes(dir: string): Promise<number> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    let count = 0
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) count += await countRoutes(full)
      else if (/page\.(tsx|ts|jsx|js)$/.test(entry.name) || /route\.(tsx|ts|jsx|js)$/.test(entry.name)) count += 1
    }
    return count
  } catch { return 0 }
}

export async function GET() {
  try {
    const fileChecks = required.map((file) => ({ file, status: existsSync(path.join(process.cwd(), file)) ? 'passed' : 'failed' }))
    const appRoutes = await countRoutes(path.join(process.cwd(), 'app'))
    const apiRoutes = await countRoutes(path.join(process.cwd(), 'app', 'api'))
    const envChecks = [
      { key:'NEXT_PUBLIC_SUPABASE_URL', status: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL ? 'passed' : 'warning' },
      { key:'SUPABASE_SERVICE_ROLE_KEY_OR_ANON', status: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'passed' : 'warning' },
    ]
    const passed = fileChecks.filter((x)=>x.status==='passed').length
    const score = Math.round((passed / fileChecks.length) * 100)
    await audit('saas_factory.phase8.full_readiness', { action:'full_readiness', score, fileChecks, appRoutes, apiRoutes })
    return jsonOk({ score, rows: [...fileChecks, ...envChecks], appRoutes, apiRoutes, generated_at: new Date().toISOString() })
  } catch (error) { return jsonError(error) }
}

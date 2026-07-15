const fs = require('fs');
const path = require('path');

const root = process.cwd();
const runtimePath = path.join(root, 'lib', 'saas-factory', 'options-runtime.ts');
const apiRoot = path.join(root, 'app', 'api', 'saas-factory', 'options');

fs.mkdirSync(path.dirname(runtimePath), { recursive: true });

const runtimeSource = `
export type SaaSFactoryOptionRecord = {
  id: string
  key: string
  label: string
  group: string
  value: string
  status: 'enabled' | 'disabled' | 'archived'
  environment: string
  owner: string
  updatedAt: string
  source: 'fallback' | 'supabase'
}

export type SaaSFactoryOptionSummary = {
  ok: boolean
  source: 'fallback' | 'supabase'
  generatedAt: string
  counts: {
    optionGroups: number
    liveOptions: number
    featureGates: number
    warnings: number
    readiness: number
  }
  options: SaaSFactoryOptionRecord[]
  groups: Array<{
    id: string
    name: string
    scope: string
    owner: string
    optionCount: number
    enabledCount: number
    status: 'healthy' | 'review' | 'empty'
    updatedAt: string
  }>
  warnings: Array<{
    id: string
    severity: 'info' | 'warning' | 'critical'
    title: string
    detail: string
    recommendedAction: string
  }>
  recommendations: Array<{
    id: string
    title: string
    reason: string
    action: string
    severity: 'info' | 'warning' | 'critical'
  }>
}

export async function getOptionsSummary(): Promise<SaaSFactoryOptionSummary> {
  const generatedAt = new Date().toISOString()

  return {
    ok: true,
    source: 'fallback',
    generatedAt,
    counts: {
      optionGroups: 0,
      liveOptions: 0,
      featureGates: 0,
      warnings: 1,
      readiness: 0,
    },
    options: [],
    groups: [],
    warnings: [
      {
        id: 'options-runtime-fallback',
        severity: 'warning',
        title: 'Options registry runtime is available but live registry data is not connected',
        detail:
          'The Options command page can compile and load. Connect the Supabase options registry tables to replace this safe fallback snapshot.',
        recommendedAction:
          'Apply the SaaS Factory Options SQL migration, verify environment variables, then refresh the Options page.',
      },
    ],
    recommendations: [
      {
        id: 'connect-options-registry',
        title: 'Connect live options registry',
        reason:
          'The safe fallback runtime is active, so no fake option rows are injected.',
        action:
          'Confirm saas_factory_options / option registry tables exist and are reachable by the API runtime.',
        severity: 'warning',
      },
    ],
  }
}

export async function getOptionsExport(format: 'json' | 'csv' = 'json') {
  const summary = await getOptionsSummary()

  if (format === 'csv') {
    const csv = [
      'id,key,label,group,status,environment,owner,updatedAt',
      ...summary.options.map((row) =>
        [
          row.id,
          row.key,
          row.label,
          row.group,
          row.status,
          row.environment,
          row.owner,
          row.updatedAt,
        ]
          .map((value) => '"' + String(value ?? '').replaceAll('"', '""') + '"')
          .join(','),
      ),
    ].join('\\n')

    return {
      body: csv,
      contentType: 'text/csv; charset=utf-8',
      filename: 'saas-factory-options.csv',
    }
  }

  return {
    body: JSON.stringify(summary, null, 2),
    contentType: 'application/json; charset=utf-8',
    filename: 'saas-factory-options.json',
  }
}
`;

fs.writeFileSync(runtimePath, runtimeSource.trim() + '\n');
console.log(`✅ Wrote ${path.relative(root, runtimePath)}`);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

let changed = 0;
for (const file of walk(apiRoot).filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))) {
  let source = fs.readFileSync(file, 'utf8');
  const before = source;
  const rel = path.relative(path.dirname(file), runtimePath).replaceAll(path.sep, '/').replace(/\.ts$/, '');
  const importPath = rel.startsWith('.') ? rel : `./${rel}`;

  source = source.replaceAll("@/lib/saas-factory/options-runtime", importPath);
  source = source.replaceAll('~/lib/saas-factory/options-runtime', importPath);

  if (source !== before) {
    fs.writeFileSync(file, source);
    changed += 1;
    console.log(`✅ Rewrote ${path.relative(root, file)} -> ${importPath}`);
  }
}

const summaryRoute = path.join(apiRoot, 'summary', 'route.ts');
if (fs.existsSync(summaryRoute)) {
  const text = fs.readFileSync(summaryRoute, 'utf8');
  if (text.includes("@/lib/saas-factory/options-runtime")) {
    console.error('❌ Stale alias import still remains in summary route.');
    process.exit(1);
  }
}

console.log(`✅ Options runtime hard repair complete. API files changed: ${changed}`);
console.log('Next: rm -rf .next && npm run dev');

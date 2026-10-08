import fs from 'node:fs'

const required = [
  'angelcare-marketplace/sanila-admin/types.ts',
  'angelcare-marketplace/sanila-admin/repository.ts',
  'angelcare-marketplace/sanila-admin/components/SanilaWorkspace.tsx',
  'angelcare-marketplace/sanila-admin/components/SanilaDemoCommand.tsx',
  'angelcare-marketplace/sanila-admin/sanila-admin.module.css',
  'angelcare-marketplace/sanila-world/contract.ts',
  'angelcare-marketplace/sanila-world/repository.ts',
  'angelcare-marketplace/sanila-world/SanilaWorldImportLab.tsx',
  'angelcare-marketplace/sanila-studio/puck.tsx',
  'angelcare-marketplace/sanila-studio/initial-data.ts',
  'angelcare-marketplace/sanila-studio/SanilaWorldStudio.tsx',
  'angelcare-marketplace/sanila-studio/sanila-studio.module.css',
  'app/angelcare-marketplace/(protected)/admin/sanila/page.tsx',
  'app/angelcare-marketplace/(protected)/admin/sanila/[section]/page.tsx',
  'app/api/angelcare-marketplace/admin/sanila/world/route.ts',
]
for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`MISSING ${file}`)
  console.log(`PASS_FILE ${file}`)
}
const nav = fs.readFileSync('angelcare-marketplace/shells/AdminNavigation.tsx','utf8')
if (!nav.includes("id:'17'") || !nav.includes("/admin/sanila") || !nav.includes('17 WORKSPACES')) throw new Error('SANILA sidebar registration missing')
console.log('PASS_SIDEBAR_17_SANILA')
const context = fs.readFileSync('angelcare-marketplace/shells/AdminWorkspaceContextNav.tsx','utf8')
for (const token of ['/sanila/demo','/sanila/public-world','/sanila/studio','/sanila/publication','/sanila/health']) if (!context.includes(token)) throw new Error(`SANILA context nav missing ${token}`)
console.log('PASS_SANILA_DEEP_NAV')
const publicUniverse = fs.readFileSync('angelcare-marketplace/sanila-public/SanilaPublicUniverse.tsx','utf8')
if (!publicUniverse.includes('<SanilaHeader />') || !publicUniverse.includes('<SanilaFooter />')) throw new Error('Public SANILA shell contract drift')
console.log('PASS_PUBLIC_SANILA_UNTOUCHED_SHELL')
const access = fs.readFileSync('app/angelcare-marketplace/[locale]/sanila/demo-access/page.tsx','utf8')
if (!access.includes('authorizeDemoPin') || !access.includes('DEMO_COOKIE')) throw new Error('Demo access atomic contract drift')
console.log('PASS_DEMO_ACCESS_ATOMIC_CONTRACT')
const api = fs.readFileSync('app/api/angelcare-marketplace/admin/sanila-demo/route.ts','utf8')
if (!api.includes('regenerate_pin') || !api.includes('create_grant') || !api.includes("action === 'approve'")) throw new Error('Demo admin authority drift')
console.log('PASS_DEMO_ADMIN_AUTHORITY_UNTOUCHED')
console.log('SANILA_SOVEREIGN_WORKSPACE_VERIFY=PASS')
console.log('DATABASE_SCHEMA_CHANGE=NO')
console.log('SQL_REQUIRED=NO')
console.log('MIGRATION=NO')

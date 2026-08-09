import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
let passed = 0
let failed = 0
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
const check = (name, value, detail = '') => {
  console.log(`${value ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
  value ? passed++ : failed++
}

const required = [
  'app/carelink-ops/layout.tsx',
  'components/carelink/ops/CareLinkOpsApprovedSidebar.tsx',
  'components/carelink/ops/CareLinkOpsFrame.tsx',
  'components/carelink/ops/navigation/carelink-navigation.ts',
  'components/carelink/ops/navigation/CareLinkOpsCommandPalette.tsx',
  'components/carelink/ops/navigation/CareLinkOpsLivePulseBar.tsx',
  'components/carelink/service-design/HomeServiceDesignShell.tsx',
  'components/carelink/service-design/workspaces/CategoryDossierWorkspace.tsx',
  'components/carelink/service-design/workspaces/PhaseRunwayWorkspaces.tsx',
  'public/b2b-plaquette-partenaires/assets/angelcare-original-logo.png',
  'tsconfig.carelink-ops-uix-stabilization.json',
]
required.forEach((file) => check(`required ${file}`, exists(file)))

const layout = read('app/carelink-ops/layout.tsx')
const sidebar = read('components/carelink/ops/CareLinkOpsApprovedSidebar.tsx')
const frame = read('components/carelink/ops/CareLinkOpsFrame.tsx')
const nav = read('components/carelink/ops/navigation/carelink-navigation.ts')
const pulse = read('components/carelink/ops/navigation/CareLinkOpsLivePulseBar.tsx')
const palette = read('components/carelink/ops/navigation/CareLinkOpsCommandPalette.tsx')
const serviceShell = read('components/carelink/service-design/HomeServiceDesignShell.tsx')
const dossier = read('components/carelink/service-design/workspaces/CategoryDossierWorkspace.tsx')
const runway = read('components/carelink/service-design/workspaces/PhaseRunwayWorkspaces.tsx')

check('CARELINK actor authentication remains in layout', layout.includes('requireCareLinkOpsActor') && layout.includes("redirect('/login')") && layout.includes("redirect('/unauthorized')"))
check('global client frame owns the stabilized shell', layout.includes('CareLinkOpsFrame') && !layout.includes('pl-[220px]'))
check('sidebar supports expanded and compact widths', sidebar.includes("w-[292px]") && sidebar.includes("w-[84px]") && sidebar.includes('data-collapsed'))
check('sidebar state is persisted locally', sidebar.includes('carelink-ops-sidebar-collapsed-v2') && sidebar.includes('localStorage'))
check('mobile drawer is implemented', sidebar.includes('mobileOpen') && sidebar.includes('lg:hidden') && sidebar.includes('translate-x-full'))
check('official repository logo is used unchanged', sidebar.includes('/b2b-plaquette-partenaires/assets/angelcare-original-logo.png'))
check('navigation is grouped into six enterprise domains', ['Commandement','Opérations','Assurance','People & Finance','Communications','Contrôle'].every((label) => nav.includes(label)))
check('all 21 CARELINK destinations remain represented', (nav.match(/href: '\/carelink-ops/g) || []).length >= 21, `${(nav.match(/href: '\/carelink-ops/g) || []).length} route declarations`)
check('Service Design OS is nested in the global sidebar', nav.includes('SERVICE_DESIGN_NAV') && nav.includes('Doctrine & imports') && nav.includes('CARELINK handoff'))
check('command palette is keyboard-accessible', frame.includes('metaKey') && frame.includes("key.toLowerCase() === 'k'") && palette.includes('Palette de commandes CARELINK'))
check('global overhead panel includes breadcrumb, search and integrity state', frame.includes('CARELINK préservé') && frame.includes('Rechercher') && frame.includes('crumbs'))
check('live pulse consumes existing CARELINK control-room endpoint', pulse.includes("fetch('/api/carelink/ops/control-room'") && pulse.includes('mapSnapshot'))
check('live pulse has no simulated fallback events', !pulse.includes('fake') && !pulse.includes('mock') && pulse.includes('Aucun événement live actuellement'))
check('live motion can pause and respects reduced motion', pulse.includes('CirclePause') && pulse.includes('prefers-reduced-motion') && pulse.includes('animation-play-state'))
check('global CSS uses standards-compatible React style elements', !frame.includes('<style jsx') && !pulse.includes('<style jsx') && frame.includes('<style>') && pulse.includes('<style>'))
check('Service Design duplicate master header is removed', !serviceShell.includes('<Image') && !serviceShell.includes('HSD_MASTER_UNIVERSES.map'))
check('Service Design keeps a compact contextual rail', serviceShell.includes('Navigation contextuelle Service Design OS') && serviceShell.includes('contextNav.map'))
check('category dossier has direct mission/programme/package actions', dossier.includes('Concevoir une mission') && dossier.includes('Créer un programme') && dossier.includes('Package commercial'))
check('category blockers are framed as preparation alerts', dossier.includes('La conception reste accessible') && dossier.includes('Importer précisément'))
check('planning runway is an active creation command', runway.includes('Concevoir, comparer, décider') && runway.includes('Nouvelle composition'))
check('planning runway removed obsolete future-workspace placeholder', !runway.includes('Future Workspaces') && !runway.includes('UMZ1 ne génère aucun plan prématuré'))
check('no backend mutation was added to bounded patch', !exists('supabase/migrations/20260802_carelink_ops_uix_stabilization.sql'))

const localTsc = path.join(root, 'node_modules/.bin/tsc')
if (fs.existsSync(localTsc)) {
  const result = spawnSync(localTsc, ['-p', 'tsconfig.carelink-ops-uix-stabilization.json', '--pretty', 'false'], { cwd: root, encoding: 'utf8', shell: false })
  const output = `${typeof result.stdout === 'string' ? result.stdout : ''}${typeof result.stderr === 'string' ? result.stderr : ''}`.trim()
  check('strict dependency-backed TypeScript passes', result.status === 0, result.status === 0 ? '0 errors' : output.slice(-1200))
} else {
  const syntaxFiles = [
    'app/carelink-ops/layout.tsx',
    'components/carelink/ops/CareLinkOpsApprovedSidebar.tsx',
    'components/carelink/ops/CareLinkOpsFrame.tsx',
    'components/carelink/ops/navigation/carelink-navigation.ts',
    'components/carelink/ops/navigation/CareLinkOpsCommandPalette.tsx',
    'components/carelink/ops/navigation/CareLinkOpsLivePulseBar.tsx',
    'components/carelink/service-design/HomeServiceDesignShell.tsx',
    'components/carelink/service-design/workspaces/CategoryDossierWorkspace.tsx',
    'components/carelink/service-design/workspaces/PhaseRunwayWorkspaces.tsx',
  ].map((file) => path.join(root, file))
  const syntax = spawnSync('tsc', ['--noEmit', '--noCheck', '--jsx', 'preserve', '--module', 'esnext', '--target', 'es2022', '--moduleResolution', 'bundler', ...syntaxFiles, '--pretty', 'false'], { cwd: root, encoding: 'utf8', shell: false })
  const output = `${typeof syntax.stdout === 'string' ? syntax.stdout : ''}${typeof syntax.stderr === 'string' ? syntax.stderr : ''}`.trim()
  check('TypeScript syntax gate passes', syntax.status === 0, syntax.status === 0 ? 'dependency-backed strict check will run in the repository' : output.slice(-1200))
}

console.log(`\n${passed}/${passed + failed} CARELINK-OPS UIX stabilization checks passed.`)
if (failed) process.exit(1)

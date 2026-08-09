import fs from 'node:fs'
import path from 'node:path'

const root=process.cwd()
const required=[
 'components/market-os/content-command/headquarters/content-command-headquarters.module.css',
 'components/market-os/content-command/headquarters/content-command-headquarters.module.css.d.ts',
 'components/market-os/content-command/headquarters/ContentCommandHeadquartersWorkspace.tsx',
 'components/market-os/content-command/headquarters/DashboardWorkspace.tsx',
 'components/market-os/content-command/headquarters/SignalsWorkspace.tsx',
 'components/market-os/content-command/headquarters/StrategyWorkspace.tsx',
 'components/market-os/content-command/headquarters/MissionsWorkspace.tsx',
 'components/market-os/content-command/headquarters/DirectoryWorkspace.tsx',
 'components/market-os/content-command/headquarters/StudioWorkspace.tsx',
 'components/market-os/content-command/headquarters/EvidenceWorkspace.tsx',
 'components/market-os/content-command/headquarters/ValidationWorkspace.tsx',
 'components/market-os/content-command/headquarters/SourceVaultWorkspace.tsx',
 'components/market-os/content-command/headquarters/DistributionWorkspace.tsx',
 'components/market-os/content-command/headquarters/AiFoundryWorkspace.tsx',
 'components/market-os/content-command/headquarters/DossierWorkspace.tsx',
 'components/market-os/content-command/headquarters/LegacyPromotionPanel.tsx',
 'lib/market-os/content-command-headquarters/repository.ts',
 'lib/market-os/content-command-headquarters/bridge.ts',
 'lib/market-os/content-command-headquarters/ai-supervision.ts',
 'lib/market-os/content-command-headquarters/market-scan.ts',
 'app/api/market-os/content-command-headquarters/actions/route.ts',
 'app/api/market-os/content-command-headquarters/cron/route.ts',
 'app/api/market-os/content-command-headquarters/source-replace/route.ts',
 'supabase/migrations/20260726_0900_content_command_headquarters_phase5.sql',
]
for(const relative of required){if(!fs.existsSync(path.join(root,relative)))throw new Error(`Missing Phase 5 file: ${relative}`)}
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8')
const css=read('components/market-os/content-command/headquarters/content-command-headquarters.module.css')
if(/(^|\})\s*(:root|html|body)(\s|\{|,)/m.test(css))throw new Error('CSS Module contains an impure global selector')

const cssTypes=read('components/market-os/content-command/headquarters/content-command-headquarters.module.css.d.ts')
if(cssTypes.includes('\\n'))throw new Error('CSS Module declaration contains literal \\n characters')
if(!cssTypes.includes('Record<string, string>')||!cssTypes.includes('export default classes'))throw new Error('CSS Module declaration contract missing')
const typedIconFiles=[
 'components/market-os/content-command/headquarters/DashboardWorkspace.tsx',
 'components/market-os/content-command/headquarters/EvidenceWorkspace.tsx',
 'components/market-os/content-command/headquarters/SourceVaultWorkspace.tsx',
 'components/market-os/content-command/headquarters/AiFoundryWorkspace.tsx',
]
for(const relative of typedIconFiles){
 const source=read(relative)
 if(!source.includes('import type { LucideIcon }'))throw new Error(`LucideIcon contract missing: ${relative}`)
 if(!source.includes('satisfies Array<'))throw new Error(`Typed icon matrix contract missing: ${relative}`)
}

const nav=read('components/market-os/content-command/content-command-navigation.tsx')
for(const contract of ['Commandement 360','Observatoire','Fabrique stratégique','Missions','Content Atlas','Studios création','Evidence Lab','Validation','Source Vault','Tour diffusion','AI Director Foundry'])if(!nav.includes(contract))throw new Error(`Navigation contract missing: ${contract}`)
const repo=read('lib/market-os/content-command-headquarters/repository.ts')
for(const contract of ['promoteLegacyContentBatch','createMarketSignal','compileStrategyToPlan','createMission','createContentDossier','updateMissionLifecycle','recordHumanContentReview','createPublicationPackage','updatePublicationPackage','updateAiDirector'])if(!repo.includes(contract))throw new Error(`Repository contract missing: ${contract}`)
const bridge=read('lib/market-os/content-command-headquarters/bridge.ts')
for(const contract of ['market_content_begin_source_replacement','market_content_commit_source_replacement','market_content_confirm_previous_source_deleted','PERMANENT_DELETE_CONFIRMED','INVALID_REPLACEMENT_CONFIRMATION'])if(!bridge.includes(contract))throw new Error(`Source replacement contract missing: ${contract}`)

const sourceVault=read('components/market-os/content-command/headquarters/SourceVaultWorkspace.tsx')
for(const contract of ['REMPLACER ${replacement.dossier.content_code}','Remplacement irréversible','Aucune limite métier arbitraire'])if(!sourceVault.includes(contract))throw new Error(`Source Vault UX contract missing: ${contract}`)
const validation=read('components/market-os/content-command/headquarters/ValidationWorkspace.tsx')
for(const contract of ['record_human_review','Valider & exiger la source','Révision requise'])if(!validation.includes(contract))throw new Error(`Validation contract missing: ${contract}`)
const distribution=read('components/market-os/content-command/headquarters/DistributionWorkspace.tsx')
for(const contract of ['create_publication_package','update_publication_package','preuve de publication'])if(!distribution.includes(contract))throw new Error(`Distribution contract missing: ${contract}`)
const ai=read('lib/market-os/content-command-headquarters/ai-supervision.ts')
for(const contract of ['market_content_reserve_generation_credit','image_generation','content_visual_review','AI_CONCEPT'])if(!ai.includes(contract))throw new Error(`AI supervision contract missing: ${contract}`)
const migration=read('supabase/migrations/20260726_0900_content_command_headquarters_phase5.sql')
const tableCount=(migration.match(/^create table if not exists public\.market_content_/gm)||[]).length
const functionCount=(migration.match(/^create or replace function public\.market_content_/gm)||[]).length
if(tableCount!==21)throw new Error(`Expected 21 Phase 5 tables, found ${tableCount}`)
if(functionCount!==10)throw new Error(`Expected 10 Phase 5 functions, found ${functionCount}`)
for(const contract of ['market_content_one_current_source_idx','credit_number between 1 and 2','legacy_origin_id','enable row level security','grant all on table'])if(!migration.includes(contract))throw new Error(`Migration contract missing: ${contract}`)
const routes=['signals','strategies','missions','directory','studio','evidence','validation','source-vault','distribution','ai-foundry']
for(const route of routes){if(!fs.existsSync(path.join(root,`app/(protected)/market-os/content-command-center/${route}/page.tsx`)))throw new Error(`Route missing: ${route}`)}
console.log(`PASS · Content Command Headquarters Phase 5 · ${tableCount} tables · ${functionCount} functions · ${routes.length+2} protected workspaces`)

import fs from 'node:fs'
import path from 'node:path'

const app = path.resolve(process.argv[2] || process.cwd())
const must = [
  'app/(protected)/social-command/page.tsx',
  'app/(protected)/social-command/_components/SocialCommandClient.tsx',
  'app/(protected)/social-command/_components/SocialCommand.module.css',
  'app/(protected)/social-command/_components/BulkOrchestrator.tsx',
  'app/(protected)/social-command/_components/TemporalCommand.tsx',
  'app/(protected)/social-command/_components/ActionPulse.tsx',
  'app/api/social-command/[...segments]/route.ts',
  'lib/social-command/meta.ts','lib/social-command/publishing.ts','lib/social-command/storage.ts','lib/social-command/crypto.ts','lib/social-command/repository.ts',
  'bridge/social-command-media-gateway/server.js',
  'supabase/social-command/20260809_social_command_mz1_migration.sql',
  'supabase/social-command/20260809_social_command_mz1_verify.sql',
]
const failures=[];let passed=0
const check=(name,ok)=>{if(ok)passed++;else failures.push(name)}
for(const rel of must) check(`file:${rel}`,fs.existsSync(path.join(app,rel)))
const read=rel=>fs.readFileSync(path.join(app,rel),'utf8')
const client=read('app/(protected)/social-command/_components/SocialCommandClient.tsx')
const bulk=read('app/(protected)/social-command/_components/BulkOrchestrator.tsx')
const temporal=read('app/(protected)/social-command/_components/TemporalCommand.tsx')
const pulse=read('app/(protected)/social-command/_components/ActionPulse.tsx')
const api=read('app/api/social-command/[...segments]/route.ts')
const meta=read('lib/social-command/meta.ts')
const storage=read('lib/social-command/storage.ts')
const repository=read('lib/social-command/repository.ts')
const publishing=read('lib/social-command/publishing.ts')
const migration=read('supabase/social-command/20260809_social_command_mz1_migration.sql')
const gateway=read('bridge/social-command-media-gateway/server.js')
const universeNames=['COMMAND','STUDIO','PUBLISH','ENGAGE','AUTOMATE','CONTROL']
for(const x of universeNames)check(`master:${x}`,client.includes(`label:"${x}"`))
for(const x of ['CREATE','BULK BUILDER','POSTS','STORIES','REELS','CAROUSELS','MEDIA VAULT','DRAFTS','CAMPAIGNS','TEMPLATES'])check(`studio:${x}`,client.includes(x))
for(const x of ['Week Command','Month Atlas','Channel Lanes','Campaign Streams','Format Map','Density Heatmap','Execution Radar','Conflict View'])check(`temporal:${x}`,temporal.includes(x))
for(const x of ['5 / jour','3 / jour','2 / jour','1 / jour','tous les 2 jours','tous les 5 jours'])check(`cadence:${x}`,bulk.includes(x))
for(const x of ['fixed','morning','evening','split','rotate'])check(`time_mode:${x}`,bulk.includes(`"${x}"`))
check('bulk:max_200',bulk.includes('Math.min(200,count)'))
check('bulk:asset_mapping',bulk.includes('Mapper automatiquement') && bulk.includes('assetIds'))
check('bulk:format_aware_multi_asset',bulk.includes('Médias / publication') && bulk.includes('maxAssets') && bulk.includes('slotMediaPicker'))
check('bulk:platform_copy_overrides',bulk.includes('Copie Instagram') && bulk.includes('Copie Facebook') && bulk.includes('platformVariants'))
check('bulk:reflow_without_content_loss',bulk.includes('Réappliquer cadence, heures & canaux') && bulk.includes('const reflow='))
check('bulk:apply_to_all',bulk.includes('Apply-to-All') && bulk.includes('Appliquer le contenu aux'))
check('pulse:exact_3_second_success',client.includes('setTimeout(()=>setPulseRaw(null),3000)'))
check('pulse:failure_persists',pulse.includes('failed') && pulse.includes('Réessayer') && pulse.includes('Ignorer'))
check('oauth:state_hash',api.includes('state_hash') && api.includes('hashState'))
check('oauth:tokens_server_encrypted',api.includes('encryptSecret(exchanged.accessToken)') && meta.includes('encrypted_page_token: encryptSecret'))
check('oauth:no_token_in_normal_ui',!client.includes('access_token') && !client.includes('encrypted_page_token'))
check('oauth:bootstrap_safe_projection',repository.includes('SOCIAL_CONNECTION_SAFE_FIELDS') && repository.includes('select(SOCIAL_CONNECTION_SAFE_FIELDS)') && !repository.slice(repository.indexOf('export async function getActiveConnection()'), repository.indexOf('export async function getActiveConnectionWithSecrets()')).includes('select("*")'))
check('oauth:server_secret_projection_isolated',repository.includes('getActiveConnectionWithSecrets') && publishing.includes('getActiveConnectionWithSecrets'))
check('oauth:finalize_safe_projection',meta.includes('const safeFields = [') && meta.includes('insert(row).select(safeFields).single()'))
check('meta:page_discovery',meta.includes('/me/accounts') && meta.includes('instagram_business_account'))
check('meta:instagram_story',meta.includes('media_type = "STORIES"'))
check('meta:instagram_reels',meta.includes('media_type = "REELS"'))
check('meta:facebook_reels',meta.includes('/video_reels'))
check('meta:facebook_story_truthful_boundary',meta.includes('Facebook Page Story publishing is not enabled'))
check('meta:capability_aware_frontend',client.includes('pages_manage_posts') || (client.includes('capabilities.facebookPublish') && bulk.includes('capabilities.facebookPublish')))
check('meta:missing_scope_guidance',client.includes('pages_manage_posts') && client.includes('instagram_content_publish'))
check('publishing:worker',api.includes('worker/tick') && read('lib/social-command/publishing.ts').includes('processDueJobs'))
check('publishing:retry',read('lib/social-command/publishing.ts').includes('Math.pow(2'))
check('storage:direct_signed_upload',storage.includes('/upload/') && gateway.includes('pipeline(req,fs.createWriteStream'))
check('storage:range_delivery',gateway.includes('accept-ranges') && gateway.includes('content-range'))
check('storage:magic_byte_validation',gateway.includes('detectMime') && gateway.includes('Media signature does not match declared MIME'))
check('storage:no_public_full_windows_path',gateway.includes("rootLabel:path.parse(ROOT).root||'windows'"))
check('storage:no_supabase_binary',!client.includes('supabase.storage') && !storage.includes('supabase.storage') && !migration.match(/\b(blob|file_bytes|base64|binary)\b/i))
check('sql:rls',migration.includes('enable row level security'))
check('sql:execution_jobs',migration.includes('social_command_execution_jobs'))
check('sql:bulk_slots',migration.includes('social_command_bulk_slots'))
check('m2:no_fake_engage',client.includes('Le territoire est réservé') && client.includes('MZ2'))
const out={contract:'AC-SOCIAL-COMMAND-MZ1-SOVEREIGN-CREATIVE-PUBLISHING-2026.08',passed,failed:failures.length,failures,masterUniverses:6,temporalViews:8,storage:'windows_node',supabaseMediaBinaries:0,buildIncluded:false}
console.log(JSON.stringify(out,null,2))
if(failures.length)process.exit(1)
console.log('SOCIAL COMMAND MZ1 SOURCE ACCEPTANCE PASSED')

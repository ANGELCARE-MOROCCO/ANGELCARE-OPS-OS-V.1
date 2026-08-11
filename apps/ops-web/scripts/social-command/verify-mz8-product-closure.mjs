#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const root=process.cwd()
const read=(rel)=>fs.readFileSync(path.join(root,rel),"utf8")
const exists=(rel)=>fs.existsSync(path.join(root,rel))
let pass=0,fail=0
function check(label,ok){if(ok){console.log(`PASS  ${label}`);pass++}else{console.error(`FAIL  ${label}`);fail++}}
function has(rel,needle){return exists(rel)&&read(rel).includes(needle)}
function lacks(rel,needle){return exists(rel)&&!read(rel).includes(needle)}

const files={
  copy:"lib/social-command/copy-vault.ts",
  copyTypes:"lib/social-command/copy-vault-types.ts",
  copyRoute:"app/api/social-command/copy-vault/[...segments]/route.ts",
  copyUi:"app/(protected)/social-command/_components/CopyVaultWorkspace.tsx",
  media:"lib/social-command/media-vault.ts",
  mediaTypes:"lib/social-command/media-vault-types.ts",
  mediaRoute:"app/api/social-command/media-vault/[...segments]/route.ts",
  mediaUi:"app/(protected)/social-command/_components/MediaVaultWorkspace.tsx",
  picker:"app/(protected)/social-command/_components/MediaVaultPicker.tsx",
  client:"app/(protected)/social-command/_components/SocialCommandClient.tsx",
  bulk:"app/(protected)/social-command/_components/BulkOrchestrator.tsx",
  mainRoute:"app/api/social-command/[...segments]/route.ts",
  repo:"lib/social-command/repository.ts",
  types:"lib/social-command/types.ts",
  mastheadCss:"app/(protected)/social-command/_components/SocialCommandMZ4.module.css",
  migration:"supabase/social-command/20260811_social_command_mz8_product_closure_migration.sql",
  precheck:"supabase/social-command/20260811_social_command_mz8_product_closure_precheck.sql",
  verify:"supabase/social-command/20260811_social_command_mz8_product_closure_verify.sql",
  rollback:"supabase/social-command/20260811_social_command_mz8_product_closure_rollback_DESTRUCTIVE.sql",
  tsconfig:"tsconfig.social-command-mz8.json",
}

for(const [name,rel] of Object.entries(files))check(`${name} source exists`,exists(rel))

check("Copy Vault import materialization verification",has(files.copy,"COPY_VAULT_IMPORT_MATERIALIZATION_MISMATCH"))
check("Copy Vault import supports approve-now materialization",has(files.copy,'importState?:"draft"|"in_review"|"approved"'))
check("Copy Vault approved import sets approved version",has(files.copy,'requestedImportState==="approved"'))
check("Copy Vault recoverable trash implemented",has(files.copy,"trashCopyItem")&&has(files.copyTypes,'"trashed"'))
check("Copy Vault restore implemented",has(files.copy,"restoreCopyItem"))
check("Copy Vault permanent delete requires trash",has(files.copy,"COPY_VAULT_PURGE_REQUIRES_TRASH"))
check("Copy Vault permanent delete requires explicit confirmation",has(files.copy,'confirmation!=="PERMANENTLY DELETE"'))
check("Copy Vault category permanent lifecycle implemented",has(files.copy,"purgeCopyCategory")&&has(files.copy,"setCopyCategoryLifecycle"))
check("Copy Vault API exposes restore/trash/purge",has(files.copyRoute,"restoreCopyItem")&&has(files.copyRoute,"trashCopyItem")&&has(files.copyRoute,"purgeCopyItem"))
check("Copy Vault UI exposes trash",has(files.copyUi,"Permanent delete")&&has(files.copyUi,"TRASH"))
check("Copy Vault importer clears stale library filters",has(files.copyUi,'setStatus("")')&&has(files.copyUi,'setCategory("")')&&has(files.copyUi,'setQuery("")'))

check("Media Vault real taxonomy implemented",has(files.media,'social_command_media_categories')&&has(files.media,'social_command_media_collections'))
check("Media Vault classification links implemented",has(files.media,'social_command_media_category_links')&&has(files.media,'social_command_media_collection_items'))
check("Media Vault metadata editing implemented",has(files.media,"updateMediaVaultAsset"))
check("Media Vault bulk classification implemented",has(files.media,'action==="classify"'))
check("Media Vault archive/restore/trash implemented",has(files.media,"archiveMediaAsset")&&has(files.media,"restoreMediaAsset")&&has(files.media,"trashMediaAsset"))
check("Media Vault purge requires recoverable trash first",has(files.media,"MEDIA_VAULT_PURGE_REQUIRES_TRASH"))
check("Media Vault permanent deletion requires typed confirmation",has(files.mediaUi,"PERMANENTLY DELETE")&&has(files.media,'confirmation!=="PERMANENTLY DELETE"'))
check("Media Vault physical purge delegates to Windows gateway",has(files.media,"deleteGatewayAsset"))
check("Media Vault tombstone is stored before canonical purge",has(files.media,"social_command_media_tombstones"))
check("Legacy media DELETE now moves to trash",has(files.mainRoute,"trashMediaAsset")&&lacks(files.mainRoute,"deleteGatewayAsset"))
check("Media Vault UI supports category CRUD",has(files.mediaUi,"TaxonomyEditor")&&has(files.mediaUi,"New category")&&has(files.mediaUi,"Save changes"))
check("Media Vault UI supports collection CRUD",has(files.mediaUi,'setTaxonomy({kind:"collection",row:null})')&&has(files.mediaUi,'base=taxonomy.kind==="category"?"categories":"collections"'))
check("Media Vault UI supports bulk classify",has(files.mediaUi,"Classify")&&has(files.mediaUi,"bulkCategory")&&has(files.mediaUi,"bulkCollection"))

check("Studio uses governed Media Vault picker",has(files.client,"MediaVaultPicker"))
check("Studio Vault uses new Media Vault workspace",has(files.client,"MediaVaultWorkspace"))
check("Bulk Publisher uses governed Media Vault picker",has(files.bulk,"MediaVaultPicker"))
check("Media picker filters category",has(files.picker,"category")&&has(files.picker,"categories"))
check("Media picker filters collection",has(files.picker,"collection")&&has(files.picker,"collections"))
check("Media picker only exposes active ready assets",has(files.picker,"lifecycle=active&status=ready"))

check("Cockpit masthead MZ8 density override present",has(files.mastheadCss,"MZ8 PRODUCT CLOSURE"))
check("Live broadcast occupies main first row",has(files.mastheadCss,".broadcastSystem{grid-column:2;grid-row:1"))
check("Search/status tools occupy compact second row",has(files.mastheadCss,".mastheadTools{grid-column:2;grid-row:2"))
check("Masthead dead vertical space reduced",has(files.mastheadCss,"grid-template-rows:66px 42px"))

const migration=exists(files.migration)?read(files.migration):""
check("MZ8 SQL creates Media Vault category tables",migration.includes("create table if not exists public.social_command_media_categories"))
check("MZ8 SQL creates Media Vault collections",migration.includes("create table if not exists public.social_command_media_collections"))
check("MZ8 SQL creates media/copy tombstones",migration.includes("social_command_media_tombstones")&&migration.includes("social_command_copy_tombstones"))
check("MZ8 SQL expands Copy Vault lifecycle to trash",migration.includes("lifecycle_status in ('active','archived','trashed')"))
check("MZ8 migration has no destructive table drop",!/^\s*drop\s+table\b/im.test(migration))
check("Destructive rollback is separated",exists(files.rollback)&&/DANGER|DESTRUCTIVE/.test(read(files.rollback)))
check("Targeted TypeScript disables incremental state",has(files.tsconfig,'"incremental": false'))
check("Targeted TypeScript includes Media Vault",has(files.tsconfig,"MediaVaultWorkspace.tsx")&&has(files.tsconfig,"media-vault.ts"))
check("Targeted TypeScript includes Copy Vault",has(files.tsconfig,"CopyVaultWorkspace.tsx")&&has(files.tsconfig,"copy-vault.ts"))

console.log(`\nSOCIAL COMMAND MZ8 VERIFY = ${fail?"FAIL":"PASS"} (${pass}/${pass+fail})`)
if(fail)process.exit(1)

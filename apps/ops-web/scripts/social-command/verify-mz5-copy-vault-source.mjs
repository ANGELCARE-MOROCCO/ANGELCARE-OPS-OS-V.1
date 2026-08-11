#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
const app = fs.existsSync(path.join(root,"apps","ops-web")) ? path.join(root,"apps","ops-web") : root
const read = (rel) => fs.readFileSync(path.join(app,rel),"utf8")
const exists = (rel) => fs.existsSync(path.join(app,rel))
const gates = []
const gate = (name, ok, detail="") => gates.push({name,ok:Boolean(ok),detail})

const client = read("app/(protected)/social-command/_components/SocialCommandClient.tsx")
const bulk = read("app/(protected)/social-command/_components/BulkOrchestrator.tsx")
const engage = read("app/(protected)/social-command/_components/EngagementCommand.tsx")
const picker = read("app/(protected)/social-command/_components/CopyVaultPicker.tsx")
const workspace = read("app/(protected)/social-command/_components/CopyVaultWorkspace.tsx")
const repo = read("lib/social-command/copy-vault.ts")
const route = read("app/api/social-command/copy-vault/[...segments]/route.ts")
const types = read("lib/social-command/copy-vault-types.ts")
const sql = read("supabase/social-command/20260810_social_command_mz5_copy_vault_migration.sql")
const rollback = read("supabase/social-command/20260810_social_command_mz5_copy_vault_rollback.sql")
const verifySql = read("supabase/social-command/20260810_social_command_mz5_copy_vault_verify.sql")
const config = read("tsconfig.social-command-mz5-copy-vault.json")

// Product integration
gate("Studio navigation exposes COPY VAULT", client.includes('"copy-vault":"COPY VAULT"') && client.includes('<CopyVaultWorkspace'))
gate("Post/Story/Reel/Carousel composer has Copy Vault selector", client.includes('<CopyVaultPicker surface={`studio_${state.format}`}'))
gate("Manual composer text remains available", client.includes('Écrivez manuellement ou sélectionnez une copie approuvée'))
gate("Composer supports exact/customize source", client.includes('copySelection.mode==="exact"') && picker.includes('choose(item,"exact")') && picker.includes('choose(item,"customize")'))
gate("Composer can save local modifications as Vault variant", client.includes('Save as Vault variant') && client.includes('Save + submit variant'))
gate("Composer records copy usage lineage", client.includes('surface:`studio_${state.format}`') && client.includes('copy-vault/usage'))
gate("Composer can append governed approved blocks", client.includes('ADD APPROVED BLOCK') && client.includes('appendCopyBlock'))
gate("Composer can select governed hashtag packs", client.includes('HASHTAG PACK') && client.includes('useHashtagPack'))
gate("Composer records all composed Vault sources", client.includes('for(const block of blockSelections)') && client.includes('if(hashtagSelection)sources.push'))
gate("Bulk apply-all has Copy Vault", bulk.includes('surface="bulk_apply_all"'))
gate("Bulk per-slot has Copy Vault", bulk.includes('surface="bulk_slot"'))
gate("Bulk records publication lineage", bulk.includes('publicationIds') || (bulk.includes('publicationId') && bulk.includes('bulkPlanId')))
gate("ENGAGE DM uses governed replies", engage.includes('surface="engage_dm"') && engage.includes('dm_reply'))
gate("ENGAGE comments use governed replies", engage.includes('surface="engage_comment"') && engage.includes('comment_reply'))
gate("ENGAGE retains manual reply textareas", (engage.match(/<textarea/g)||[]).length >= 2)

// Library and governance
gate("Picker requests approved-only server library", repo.includes('approvedOnly:true') && picker.includes('/api/social-command/copy-vault/picker'))
gate("Approved picker enforces validity window", repo.includes('approved_version.valid_from') && repo.includes('approved_version.valid_until'))
gate("Free categories and hierarchy implemented", repo.includes('createCopyCategory') && repo.includes('parent_id') && workspace.includes('FREE TAXONOMY'))
gate("Versioning implemented", repo.includes('createCopyRevision') && types.includes('approved_version_no'))
gate("Approval lifecycle implemented", repo.includes('submitCopyVersion') && repo.includes('approveCopyVersion') && repo.includes('rejectCopyVersion'))
gate("Approval policy gate implemented", repo.includes('COPY_VAULT_APPROVAL_POLICY_DENIED') && repo.includes('policyAllows'))
gate("Archive lifecycle implemented", repo.includes('archiveCopyItem'))
gate("Optional Copy Vault RBAC is explicit", repo.includes('SOCIAL_COMMAND_COPY_VAULT_RBAC_ENFORCE') && repo.includes('SOCIAL_COMMAND_COPY_VAULT_GOVERNOR_ROLES'))
gate("Granular Copy Vault abilities are modeled", types.includes('editOwn: boolean') && types.includes('editAll: boolean') && types.includes('submit: boolean') && types.includes('reject: boolean'))
gate("RBAC supports viewer/editor/governor tiers", repo.includes('SOCIAL_COMMAND_COPY_VAULT_VIEWER_ROLES') && repo.includes('SOCIAL_COMMAND_COPY_VAULT_EDITOR_ROLES') && repo.includes('SOCIAL_COMMAND_COPY_VAULT_GOVERNOR_ROLES'))
gate("RBAC accepts explicit permission codes", repo.includes('copy.edit_own') && repo.includes('copy.edit_all') && repo.includes('copy.manage_categories'))
gate("Canonical copy types >= 23", (types.match(/\| \"[a-z_]+\"/g)||[]).length >= 22 && types.includes('brand_signature'))

// CSV
gate("CSV parser supports quoted fields", repo.includes("if(c==='\"'&&text[i+1]==='\"')") && repo.includes('quoted=false'))
gate("CSV mapping and aliases implemented", repo.includes('HEADER_ALIASES') && workspace.includes('MAPPING & VALIDATION'))
gate("CSV preview is non-mutating", route.includes('import/preview') && repo.includes('previewCopyCsv'))
gate("CSV commit has duplicate policy", repo.includes('duplicatePolicy') && workspace.includes('Skip safely') && workspace.includes('Import as separate copy'))
gate("CSV exact duplicate detection uses SHA-256", repo.includes('body_fingerprint') && repo.includes('crypto.createHash("sha256")'))
gate("Similarity detection available", repo.includes('jaccard') && workspace.includes('Check similarity'))
gate("CSV template downloadable in UI", workspace.includes('ANGELCARE_SOCIAL_COMMAND_COPY_VAULT_TEMPLATE.csv'))

// Truth and performance
gate("Usage snapshot captures exact selected text", repo.includes('content_snapshot') && types.includes('content_snapshot'))
gate("Usage rollup exists", sql.includes('social_command_copy_usage_rollup'))
gate("Performance uses provider metric evidence", repo.includes('social_command_metric_snapshots') && workspace.includes('INSUFFICIENT EVIDENCE'))
gate("No fabricated performance score token", !/fake score|synthetic score|mock performance/i.test(repo+workspace))
gate("No polling interval in Copy Vault UI", !/setInterval\s*\(/.test(picker+workspace))

// API/security
gate("API requires Social Command actor", route.includes('requireSocialCommandActor'))
gate("Copy Vault token/secret terms are absent from client payload", !/access_token|app_secret|signing_secret|worker_secret/i.test(picker+workspace+types))
gate("Service-only SQL boundary enabled", (sql.match(/enable row level security/g)||[]).length >= 1 && sql.includes('revoke all on table public.%I from anon, authenticated'))
gate("SQL creates 8 Copy Vault tables", (sql.match(/create table if not exists public\.social_command_copy_/g)||[]).length === 8)
gate("SQL is additive", !/drop table if exists/i.test(sql))
gate("Dedicated destructive rollback is separate", (rollback.match(/drop table if exists public\.social_command_copy_/g)||[]).length === 8)
gate("SQL verification covers all 8 tables", (verifySql.match(/to_regclass\('public\.social_command_copy_/g)||[]).length === 8)

// TypeScript/source packaging
gate("Targeted TypeScript includes next-env", config.includes('"next-env.d.ts"'))
gate("Targeted TypeScript disables incremental state", config.includes('"incremental": false'))
gate("Copy Vault CSS modules exist", exists("app/(protected)/social-command/_components/CopyVaultPicker.module.css") && exists("app/(protected)/social-command/_components/CopyVaultWorkspace.module.css"))
gate("Environment configuration remains server-side and read-only", repo.includes("process.env") && !/process\.env/.test(client+bulk+engage+picker+workspace) && !/(writeFileSync|writeFile|appendFileSync|appendFile)[\s\S]{0,120}\.env/.test(repo+route))

let failed = 0
for (const g of gates) {
  console.log(`${g.ok ? "PASS" : "FAIL"}  ${g.name}${g.detail ? ` — ${g.detail}` : ""}`)
  if (!g.ok) failed++
}
console.log(`\nSOCIAL COMMAND MZ5 COPY VAULT VERIFY = ${failed ? "FAIL" : "PASS"} (${gates.length-failed}/${gates.length})`)
if (failed) process.exit(1)

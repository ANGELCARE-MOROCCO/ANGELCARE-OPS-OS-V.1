import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const root=new URL('../../angelcare-marketplace/live-experience-command/',import.meta.url)
const app=new URL('../../app/api/angelcare-marketplace/admin/live-experience/',import.meta.url)
const migration=new URL('../../supabase/migrations/',import.meta.url)
const file=(path)=>readFileSync(new URL(path,root),'utf8')
const route=(path)=>readFileSync(new URL(path,app),'utf8')
test('LXC360 campaign lifecycle is versioned, audited and exposed',()=>{
 const sql=readFileSync(new URL('20261112230000_live_experience_command_360_lifecycle.sql',migration),'utf8')
 assert.match(sql,/ac_live_campaign_lifecycle_360/)
 assert.match(sql,/ac_live_governance_lifecycle_360/)
 assert.match(sql,/FOR UPDATE/)
 assert.match(sql,/p_expected_version/)
 assert.match(sql,/angelcare_marketplace_live_experience_versions/)
 assert.match(route('campaigns/[campaignId]/route.ts'),/export async function DELETE/)
 assert.match(file('api-handlers.ts'),/handleLiveCampaignDelete/)
 assert.match(file('repository.ts'),/if\(campaign\.deleted_at\)/)
})
test('LXC360 governance lifecycle and source operations enforce authority',()=>{
 assert.match(file('governance-api-handlers.ts'),/liveGovernanceLifecycle/)
 assert.match(file('components/LiveGovernanceCommand.tsx'),/void lifecycle\(row,'trash'\)/)
 assert.match(file('components/LiveProofSources.tsx'),/void lifecycle\(current\.deleted_at\?'restore':'trash'\)/)
 assert.match(route('sources/[sourceId]/route.ts'),/export async function DELETE/)
 assert.match(file('repository.ts'),/\.eq\('row_version',expectedVersion\)/)
})
test('LXC360 reuse of authenticated vault picker preserves asset identity',()=>{
 assert.match(file('components/LiveExperienceCommand.tsx'),/NativeExperienceMediaPicker/)
 assert.match(file('components/NativeExperienceMediaPicker.tsx'),/UI\.Provider/)
 assert.match(file('repository.ts'),/imageReferenceIssue/)
 assert.match(file('repository.ts'),/angelcare_marketplace_media_assets/)
})
test('LXC360 customer safety coordinates impressions across campaigns',()=>{
 assert.match(file('components/LiveExperienceLayer.tsx'),/globalInterruptionEligible/)
 assert.match(file('components/LiveExperienceLayer.tsx'),/engagedPopup/)
 assert.match(file('components/LiveExperienceLayer.tsx'),/consentAnalyticsAllowed\('angelcare'\)/)
 assert.match(file('repository.ts'),/input\.consent!==true/)
 assert.match(file('experience-contract.ts'),/globalInterruptionEligible/)
})
test('LXC360 ten native 2026 popup layouts render from registered theme tokens',()=>{
 const css=file('studio-2030.module.css')
 const composition=file('components/ExperienceComposition.tsx')
 const registry=file('registry.ts')
 for(const key of ['atrium','terrace','botanical','lilac','precision','bento','museum','glass','ledger','cinema']){
  assert.ok(css.includes('[data-variant='+key+']'),'Layout missing '+key)
  assert.ok(new RegExp('"composition"\\s*:\\s*"'+key+'"').test(registry),'Theme token missing '+key)
 }
 assert.match(composition,/item\.tokens\.composition/)
 assert.match(file('creative-360.ts'),/p_version/)
 assert.match(readFileSync(new URL('20261112232000_live_experience_command_360_creative_crud.sql',migration),'utf8'),/ac_live_creative_command_360/)
})

import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {DYNAMIC_SOURCE_DEFINITIONS,CUSTOM_DYNAMIC_SOURCE_AUTHORITIES} from '../../angelcare-marketplace/localization-intelligence/dynamic-sources'
import {parseCsv,toCsv,TRANSLATION_CSV_COLUMNS,validatePlaceholderIntegrity,validateSafeHtml} from '../../angelcare-marketplace/localization-intelligence/csv'
import {buildPublishedDictionaryFromRows,resolveRuntimeText} from '../../angelcare-marketplace/localization-intelligence/runtime-dictionary'
import type {TranslationCsvRow} from '../../angelcare-marketplace/localization-intelligence/types'

const pass=(name:string)=>console.log(`${name}=YES`)
async function main(){
const base=Object.fromEntries(TRANSLATION_CSV_COLUMNS.map(column=>[column,''])) as unknown as TranslationCsvRow
Object.assign(base,{translation_id:'00000000-0000-0000-0000-000000000001',source_key:'marketplace.test',source_type:'static',workspace:'products',surface:'registry',route:'/angelcare-marketplace/fr',source_locale:'fr',source_fr:'Bonjour {name}',translation_en:'Hello {name}',translation_ar:'مرحباً {name}',source_hash:'hash'})
const parsed=parseCsv(toCsv([base]));assert.equal(parsed.length,1);assert.equal(parsed[0].translation_ar,base.translation_ar);assert.deepEqual(Object.keys(parsed[0]),TRANSLATION_CSV_COLUMNS);pass('CSV_24_COLUMN_ROUNDTRIP')
assert.equal(validatePlaceholderIntegrity('Bonjour {name}','Hello').valid,false);assert.equal(validatePlaceholderIntegrity('Bonjour {name}','Hello {name}').valid,true);pass('CSV_PLACEHOLDER_VALIDATION')
assert.equal(validateSafeHtml('<strong>Bonjour</strong>','<script>alert(1)</script>',true).valid,false);assert.equal(validateSafeHtml('<strong>Bonjour</strong>','<strong>Hello</strong>',true).valid,true);pass('CSV_HTML_VALIDATION')
const candidate={translation_key:'marketplace.test',source_text_fr:'Bonjour',source_hash:'current-hash',freshness_state:'current'},dictionary=buildPublishedDictionaryFromRows('en',[
 {translation_text:'DRAFT LEAK',source_hash_at_translation:'current-hash',status:'draft',freshness_state:'current',candidate},
 {translation_text:'STALE LEAK',source_hash_at_translation:'old-hash',status:'published',freshness_state:'current',candidate},
 {translation_text:'Hello',source_hash_at_translation:'current-hash',status:'published',freshness_state:'current',candidate},
]);assert.equal(dictionary.byKey['marketplace.test'],'Hello');assert.equal(Object.values(dictionary.byKey).includes('DRAFT LEAK'),false);assert.equal(Object.values(dictionary.byKey).includes('STALE LEAK'),false);pass('DRAFT_TRANSLATION_LEAKAGE_ZERO');pass('UNAPPROVED_TRANSLATION_LEAKAGE_ZERO')
assert.equal(resolveRuntimeText('Texte français sans traduction',dictionary),'Texte français sans traduction');pass('FR_SAFE_FALLBACK')
const scopedRows=[
 {translation_text:'Public',source_hash_at_translation:'public-hash',status:'published',freshness_state:'current',candidate:{translation_key:'scope.public',source_text_fr:'Texte public',source_hash:'public-hash',freshness_state:'current',audience:'public'}},
 {translation_text:'Admin',source_hash_at_translation:'admin-hash',status:'published',freshness_state:'current',candidate:{translation_key:'scope.admin',source_text_fr:'Texte admin',source_hash:'admin-hash',freshness_state:'current',audience:'admin'}},
 {translation_text:'Privé',source_hash_at_translation:'private-hash',status:'published',freshness_state:'current',candidate:{translation_key:'scope.private',source_text_fr:'Texte privé',source_hash:'private-hash',freshness_state:'current',audience:'private'}},
];const publicDictionary=buildPublishedDictionaryFromRows('en',scopedRows,'public'),adminDictionary=buildPublishedDictionaryFromRows('en',scopedRows,'admin'),privateDictionary=buildPublishedDictionaryFromRows('en',scopedRows,'private');assert.equal(publicDictionary.byKey['scope.public'],'Public');assert.equal(publicDictionary.byKey['scope.admin'],undefined);assert.equal(publicDictionary.byKey['scope.private'],undefined);assert.equal(adminDictionary.byKey['scope.admin'],'Admin');assert.equal(adminDictionary.byKey['scope.private'],undefined);assert.equal(privateDictionary.byKey['scope.private'],'Privé');assert.equal(privateDictionary.byKey['scope.admin'],undefined);pass('RUNTIME_AUDIENCE_ISOLATION')
assert.equal(buildPublishedDictionaryFromRows('ar',[]).direction,'rtl');pass('AR_RUNTIME_DIRECTION')
const templateCandidate={translation_key:'marketplace.test.greeting',source_text_fr:'Bonjour {{name}} · dossier {{reference}}',source_hash:'template-hash',freshness_state:'current'},templateDictionary=buildPublishedDictionaryFromRows('en',[{translation_text:'Hello {{name}} · case {{reference}}',source_hash_at_translation:'template-hash',status:'published',freshness_state:'current',candidate:templateCandidate}]);assert.equal(resolveRuntimeText('Bonjour Sara · dossier AC-42',templateDictionary),'Hello Sara · case AC-42');pass('GENERIC_TEMPLATE_RUNTIME_RESOLUTION')
const tables=DYNAMIC_SOURCE_DEFINITIONS.map(item=>item.table),unique=new Set(tables);assert.equal(tables.length,unique.size);for(const expected of ['angelcare_marketplace_catalog_items','angelcare_marketplace_cms_pages','angelcare_marketplace_cms_menu_items','angelcare_marketplace_footer_links','angelcare_marketplace_live_experience_campaigns','angelcare_marketplace_academy_programs','angelcare_marketplace_partner_plans','angelcare_marketplace_trust_badge_definitions'])assert.ok(unique.has(expected)||CUSTOM_DYNAMIC_SOURCE_AUTHORITIES.includes(expected as never),`Dynamic authority missing: ${expected}`);pass('DYNAMIC_SOURCE_AUTHORITIES_RECONCILED')
const repository=await readFile(path.resolve(process.cwd(),'angelcare-marketplace/localization-intelligence/repository.ts'),'utf8');assert.equal(/source_version\s*:\s*[^,}]*\+\s*1/.test(repository),false);pass('SOURCE_VERSION_DOUBLE_INCREMENT_ZERO')
const runtime=await readFile(path.resolve(process.cwd(),'angelcare-marketplace/localization-intelligence/runtime.ts'),'utf8'),os=await readFile(path.resolve(process.cwd(),'angelcare-marketplace/localization-intelligence/localization-os.ts'),'utf8');assert.match(runtime,/\.range\(from,from\+999\)/);assert.doesNotMatch(runtime,/\.limit\(20000\)/);assert.doesNotMatch(os,/\.limit\(10000\)/);assert.match(os,/for\(let from=0;;from\+=1000\)/);pass('EXHAUSTIVE_RUNTIME_EXPORT_IMPORT_PAGINATION')
}
void main().catch(error=>{console.error(error);process.exitCode=1})

/* Scope: source-owned World 02 editorial topology and contract. No network or SQL. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const root=process.cwd(),prefix='angelcare-marketplace/homepage-living-marketplace/';
function load(relative,mocks={}){const module={exports:{}};const file=path.join(root,relative);const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,require:name=>{if(Object.prototype.hasOwnProperty.call(mocks,name))return mocks[name];throw new Error('Unexpected import: '+name)},console},{filename:file});return module.exports}
const media=load(prefix+'media.ts'),discovery=load(prefix+'discovery.ts',{'./media':media}),types=load('angelcare-marketplace/studio-homepage-pro-max/types.ts'),world=load(prefix+'world.ts');
const recipe=load('angelcare-marketplace/studio-homepage-pro-max/recipe.ts',{'./types':types,'@/angelcare-marketplace/homepage-living-marketplace/world':world});
const contractExports=load('angelcare-marketplace/studio-homepage-pro-max/developer-contract.ts',{'node:crypto':require('node:crypto'),'./recipe':recipe,'@/angelcare-marketplace/homepage-living-marketplace/world':world});
const contract=contractExports.HOMEPAGE_PRO_MAX_DEVELOPER_CONTRACT;
const tests=[];function check(name,run){run();tests.push(name);console.log('PASS '+name)}
const family=fs.readFileSync(path.join(root,'angelcare-marketplace/families-storefront/contract.ts'),'utf8');const anchors=new Set([...family.matchAll(/anchor:'([^']+)'/g)].map(m=>m[1]));
const kinds=['selections','services','products','picks','academy','collections','arrivals'];
check('SEVEN_EMPTY_SHELVES_HAVE_MULTIPLE_JOURNEYS',()=>{for(const kind of kinds)assert.ok(discovery.editorialJourneys(kind).length>=3,kind)});
check('FAMILY_LINKS_MATCH_EXISTING_ATOMIC_CONTRACT',()=>{for(const kind of kinds)for(const card of discovery.editorialJourneys(kind)){if(card.path.startsWith('families#'))assert.ok(anchors.has(card.path.split('#')[1]),card.path)}});
check('EDITORIAL_CARDS_CANNOT_MASQUERADE_AS_OFFERS',()=>{for(const kind of kinds)for(const card of discovery.editorialJourneys(kind)){assert.ok(!/marketplace\/item\//.test(card.path));for(const field of ['price_amount','catalog_item_id','availability_status','stock','rating','discount'])assert.equal(card[field],undefined)}});
check('EVERY_EDITORIAL_CARD_HAS_ALL_THREE_LANGUAGES',()=>{for(const kind of kinds)for(const card of discovery.editorialJourneys(kind))for(const locale of ['fr','en','ar']){assert.ok(discovery.editorialWords(card.title,locale));assert.ok(discovery.editorialWords(card.detail,locale))}});
check('ALL_14_EDITORIAL_ASSETS_EXIST',()=>{assert.equal(Object.keys(media.LIVING_EDITORIAL_MEDIA).length,14);for(const url of Object.values(media.LIVING_EDITORIAL_MEDIA))assert.ok(fs.statSync(path.join(root,'public',url)).size>10000,url)});
const living=contract.worlds.find(w=>w.id===world.LIVING_MARKETPLACE_WORLD_ID);const old=contract.worlds.find(w=>w.id!==world.LIVING_MARKETPLACE_WORLD_ID);
check('WORLD02_CONTRACT_MATCHES_WHOLE_PAGE_ASSIGNMENT',()=>{assert.equal(living.insertion.join(','),'REPLACE_PAGE');assert.equal(living.authoring.rootSectionsEditable,false);assert.equal(living.authoring.sourceOwnedLocked,true)});
check('WORLD01_APPEND_CONTRACT_PRESERVED',()=>assert.ok(old.insertion.includes('INSERT_COMPOSITION')));
check('WORLD02_STABLE_ID_AND_REVISION_PRESERVED',()=>{assert.equal(world.LIVING_MARKETPLACE_WORLD_ID,'ac.homepage.living-marketplace.hyper-commerce.02');assert.equal(world.LIVING_MARKETPLACE_WORLD_REVISION,2)});
check('CONTRACT_TEXT_AND_CSV_EXPORT_WORLD02_ASSIGNMENT',()=>{assert.ok(contractExports.homepageProMaxDeveloperContractTxt().includes('World 02 insertion: REPLACE_PAGE'));assert.ok(contractExports.homepageProMaxDeveloperContractCsv().includes('world02Insertion,REPLACE_PAGE'))});
console.log('WORLD02_VISUAL_R4_CHECKS='+tests.length);console.log('WORLD02_VISUAL_R4=PASS');

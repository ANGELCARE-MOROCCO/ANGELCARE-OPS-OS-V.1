import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const base="apps/marketplace-web/";
const read=(p)=>readFileSync(base+p,"utf8");
test("R6 import page replaces only media body, preserving the original import shell",()=>{
 const page=read("app/angelcare-marketplace/(protected)/admin/imports/[section]/page.tsx");
 assert.match(page,/section==='media'/);
 assert.match(page,/<MediaImport360/);
 assert.match(page,/return <ImportCommandWorkspace section=\{section\}>/);
 assert.doesNotMatch(page,/MediaLibraryStudio/);
});
test("R6 retains the canonical preflight, upload, manifest and mapping engine",()=>{
 const media=read("angelcare-marketplace/commerce-studio/components/MediaLibraryStudio.tsx");
 for(const name of ["sha256File","preflight","uploadOne","executeQueue","assignProducts","parseMediaManifest","REPLACE_EXISTING","USE_EXISTING","UPLOAD_ANYWAY","onQueueChange","command360"]){
   assert.ok(media.includes(name),"Missing preserved engine contract: "+name);
 }
 assert.match(media,/media-r6-preflight/);
 assert.match(media,/media-r6-mapping/);
 assert.match(media,/mode==='command360'\?null:<><section/);
});
test("Canonical vault endpoint requires media-view permission without weakening the DCE picker",()=>{
 const api=read("app/api/angelcare-marketplace/admin/imports/media/vault/route.ts");
 const authority=read("angelcare-marketplace/digital-customer-experience/media-vault-authority.ts");
 assert.match(api,/requireMarketplaceApiContext\("marketplace.media.view"\)/);
 assert.match(api,/vaultFolders\(ctx,input,"media-import"\)/);
 assert.match(api,/vaultMedia\(ctx,input,"media-import"\)/);
 assert.match(authority,/authority === "digital-experience"/);
 assert.match(authority,/marketplace.digital_experience.view/);
 assert.match(authority,/marketplace.media.view/);
});
test("Vault explorer uses server-first filtering, pagination, rights and actual asset operations",()=>{
 const vault=read("angelcare-marketplace/import-command/MediaVault360.tsx");
 for(const contract of ["pageSize","recentMinutes","includeChildren","folderId","rights","processing","orientation","category","collection","language","uploader","used","publishedSafe","20,100,500","bulkMove","archive","replaceAsset","save","get<Usage[]>","get<MediaResult>"]){
  assert.ok(vault.includes(contract),"Missing vault feature: "+contract);
 }
 assert.match(vault,/COMMERCE\+"\/media\/"/);
 assert.match(vault,/operation\(/);
 const body=read("angelcare-marketplace/import-command/MediaImport360.tsx");
 assert.match(body,/<MediaVault360/);
 assert.match(body,/<MediaLibraryStudio/);
 assert.match(body,/onQueueChange=\{onQueue\}/);
});
test("No invented counts or destructive public publication",()=>{
 const body=read("angelcare-marketplace/import-command/MediaImport360.tsx");
 assert.match(body,/inventory\.assets/);
 assert.match(body,/inventory\.folders/);
 assert.match(body,/queue\.failed/);
 assert.match(body,/Aucune publication automatique/);
});

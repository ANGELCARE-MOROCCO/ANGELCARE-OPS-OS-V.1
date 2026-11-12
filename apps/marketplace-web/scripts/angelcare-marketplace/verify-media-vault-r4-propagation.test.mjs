import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const root = new URL("../../angelcare-marketplace/", import.meta.url);
const source = name => readFileSync(new URL(name,root),"utf8");
const ops = name => readFileSync(new URL("../../../ops-web/", import.meta.url).pathname + name, "utf8");
test("R4 retains all six shared existing-image picker integrations",()=>{
 const cases=[
 "marketplace-imagery/Studio.tsx","kidflix/imagery/Studio.tsx","kidflix/HomeStudio.tsx",
 "kidflix/GalleryEditor.tsx","kidflix/documents/DocumentsStudio.tsx",
 "kidflix/storefronts/PublisherMediaEditor.tsx",
 ];
 const shared=source("kidflix/StudioPickers.tsx");
 assert.match(shared,/NativeMediaVaultChooser/);
 for(const file of cases)assert.match(source(file),/NativeImagePicker/,file+" must keep shared picker");
});
test("R4 DCE media uses premium vault and non-media references remain governed",()=>{
 const editor=source("digital-customer-experience/components/Editor.tsx");
 const create=source("digital-customer-experience/components/CreationControls.tsx");
 for(const code of [editor,create]){
  assert.match(code,/NativeMediaVaultChooser/);
  assert.match(code,/\.type === "media"/);
  assert.match(code,/Legacy(?:Creation)?ReferencePicker/);
 }
 assert.match(create,/media_type: asset\.mime/);
 assert.match(editor,/props\.onSelect\(assets\[0\]\.id\)/);
});
test("R4 Universal Studio preserves canonical references and its original fallback",()=>{
 const code=source("studio-picker/components/UniversalSourcePicker.tsx");
 assert.match(code,/NativeMediaVaultChooser/);
 assert.match(code,/sourceId:'media\.assets',entityId:asset\.id/);
 assert.match(code,/onChange\(mode==='single'/);
 assert.match(code,/legacyMediaMode/);
 assert.match(code,/searchPickerSource/);
 assert.match(code,/validatePickerReference/);
});
test("R4 Commerce Product 360 keeps original mutation authority",()=>{
 const code=source("commerce-studio/components/ProductMediaSlots.tsx");
 assert.match(code,/NativeMediaVaultChooser/);
 assert.match(code,/catalog-media/);
 assert.match(code,/catalog_item_id:item\.id/);
 assert.match(code,/media_key:key/);
 assert.match(code,/setVaultAssets/);
 assert.match(code,/onSaved/);
});
test("R4 JobKix enforces native editorial rights with an authorized server read",()=>{
 const ui=source("jobkix/admin/EditorialImagePicker.tsx");
 const db=source("jobkix/server/admin-repository.ts");
 const endpoint=readFileSync(new URL("../../app/api/jobkix/admin/media/route.ts",import.meta.url),"utf8");
 assert.match(ui,/NativeMediaVaultChooser/);
 assert.match(ui,/validate=/);
 assert.match(ui,/readResponse/);
 assert.match(db,/verifyEditorialMediaAsset/);
 assert.match(db,/nativeAdmin\('editorial'\)/);
 assert.match(db,/nativeMediaPermission\(\)/);
 assert.match(db,/rights_expires_at/);
 assert.match(endpoint,/verifyEditorialMediaAsset/);
});
test("R4 Windows Social Command uses its own authority with premium filters and inspector",()=>{
 const picker=ops("app/(protected)/social-command/_components/MediaVaultPicker.tsx");
 const styles=ops("app/(protected)/social-command/_components/MediaVaultPicker.module.css");
 assert.match(picker,/\/api\/social-command\/media-vault\/library/);
 assert.match(picker,/data-media-picker-r4="windows"/);
 assert.match(picker,/2,5,10,15,30,60,120,1440/);
 assert.match(picker,/pageSize/);
 assert.match(picker,/inspector/);
 assert.match(picker,/selectedIds/);
 assert.match(styles,/\.grid\{/);
 assert.match(styles,/\.inspector\{/);
});
test("R4 does not change the Marketplace media source registry or database ownership",()=>{
 const studio=source("studio-source-registry/adapters/index.ts");
 assert.match(studio,/sourceId:'media\.assets'/);
 assert.match(studio,/angelcare_marketplace_media_assets/);
 const vault=source("digital-customer-experience/media-vault-authority.ts");
 assert.match(vault,/angelcare_marketplace_media_folders/);
 assert.match(vault,/vaultPageSize/);
});

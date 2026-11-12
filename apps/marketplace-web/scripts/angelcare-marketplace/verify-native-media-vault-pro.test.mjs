import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeNativeAsset, assetIssue, addUniqueAssets, mediaPassesClientFilters, reorderAsset, publishedSafe } from "../../angelcare-marketplace/kidflix/native-media-vault-contract.ts";
const base = (id, other = {}) => normalizeNativeAsset({
 id, title: "Montessori image " + id, fileName:"image.png", url:"/api/angelcare-marketplace/media/"+id+"/image.png", mime:"image/png",
 status:"active", rights:"approved", expiresAt:null, optimizationStatus:"ready", width:1200, height:1200, alt:"Wooden learning toys",
 ...other,
});
const filters = {orientation:"",ratio:"",category:"",collection:"",language:"",tag:"",uploader:"",used:"",dateRange:"",readyOnly:false,hasAlt:false,publishedSafe:false,unusedOnly:false};
test("normalize native media metadata and eligibility without inventing status",()=>{
 const a=base("123",{metadata:{tags:["montessori"], width:1200,height:1200},usageCount:4});
 assert.equal(a.width,1200);
 assert.deepEqual(a.tags,["montessori"]);
 assert.equal(a.usageCount,4);
 assert.equal(assetIssue(a),"");
 assert.equal(publishedSafe(a),true);
 assert.equal(publishedSafe(base("not-approved",{rights:"unverified"})),false);
 assert.match(assetIssue(base("expired",{expiresAt:"2024-01-01"})),/expired/i);
 assert.match(assetIssue(base("unsafe",{url:"javascript:alert(1)"})),/unsupported/i);
});
test("selection enforces capacity, deduplication and retains selection order",()=>{
 const a=base("one"), b=base("two"), c=base("three");
 assert.deepEqual(addUniqueAssets([a],[a,b,c],2).map(x=>x.id),["one","two"]);
 assert.deepEqual(addUniqueAssets([], [a,b,c],3,["two"]).map(x=>x.id),["one","three"]);
 assert.deepEqual(reorderAsset([a,b,c],0,2).map(x=>x.id),["two","three","one"]);
 assert.deepEqual(reorderAsset([a,b],1,8),[a,b]);
});
test("filters use real metadata and exclude unknown fields from strict toggles",()=>{
 const a=base("a",{category:"Early learning",collection:"School",tags:["Montessori"],language:"fr",usageCount:0});
 assert.equal(mediaPassesClientFilters(a,{...filters,category:"early",tag:"mont"}),true);
 assert.equal(mediaPassesClientFilters(a,{...filters,orientation:"landscape"}),false);
 assert.equal(mediaPassesClientFilters(a,{...filters,ratio:"1:1",unusedOnly:true,readyOnly:true,publishedSafe:true}),true);
 assert.equal(mediaPassesClientFilters(base("no-usage"),{...filters,unusedOnly:true}),false);
});
test("existing consumers and sequence editors retain native picker contracts", async()=>{
 const { readFileSync }=await import("node:fs");
 const { fileURLToPath }=await import("node:url");
 const root=new URL("../../angelcare-marketplace/",import.meta.url);
 const code=p=>readFileSync(fileURLToPath(new URL(p,root)),"utf8");
 const shared=code("kidflix/StudioPickers.tsx");
 assert.match(shared,/export function NativeImagePicker/);
 assert.match(shared,/NativeMediaVaultChooser/);
 for(const p of ["marketplace-imagery/Studio.tsx","kidflix/imagery/Studio.tsx"])
  assert.match(code(p),/onSelectMany=/);
});

test("native media vault advanced inventory, real folder authority and global search are wired",async()=>{
 const { readFileSync }=await import("node:fs");
 const { fileURLToPath }=await import("node:url");
 const root=new URL("../../angelcare-marketplace/",import.meta.url);
 const read=p=>readFileSync(fileURLToPath(new URL(p,root)),"utf8");
 const repo=read("digital-customer-experience/repository.ts");
 const authority=read("digital-customer-experience/media-vault-authority.ts");
 const chooser=read("kidflix/NativeMediaVaultChooser.tsx");
 assert.match(repo,/vaultMedia\(c, input\)/);
 assert.match(repo,/vaultFolders\(c, input\)/);
 assert.match(authority,/angelcare_marketplace_media_folders/);
 assert.match(authority,/angelcare_marketplace_media_assets/);
 assert.match(authority,/total=r\.count \?\? 0/);
 assert.match(authority,/const postFilter=Boolean/);
 assert.match(authority,/const filtered=rows\.filter/);
 assert.match(authority,/filtered\.slice\(\(page-1\)\*pageSize,page\*pageSize\)/);
 assert.match(chooser,/op:"vault_folders"/);
 assert.match(chooser,/vault:"true"/);
 assert.match(chooser,/includeChildren/);
 assert.match(chooser,/setPageSize\(Number\(e\.target\.value\)/);
 for(const x of ["2,5,10,15,30,60","dateFrom","dateTo","folderRows","minSize","minWidth"])
  assert.ok(chooser.includes(x),x+" filter is missing");
});

test("native folder query matches columns present in canonical schema",async()=>{
 const { readFileSync }=await import("node:fs");
 const { fileURLToPath }=await import("node:url");
 const root=new URL("../../angelcare-marketplace/",import.meta.url);
 const read=p=>readFileSync(fileURLToPath(new URL(p,root)),"utf8");
 const schema=read("../supabase/migrations/20260804053000_angelcare_marketplace_complete_commerce_administration_universe.sql");
 const source=read("digital-customer-experience/media-vault-authority.ts");
 const chooser=read("kidflix/NativeMediaVaultChooser.tsx");
 const first=schema.indexOf("create table if not exists public.angelcare_marketplace_media_folders(");
 const next=schema.indexOf("create table if not exists public.angelcare_marketplace_media_assets(",first);
 assert.ok(first>=0 && next>first);
 assert.ok(!schema.slice(first,next).includes("item_count"));
 assert.ok(!source.includes('select("id,name,slug,parent_id,status,item_count"'));
 assert.ok(source.includes('select("id,name,slug,parent_id,status"'));
 for(const status of ["active","archived","processing","paused","failed"])
   assert.ok(chooser.includes('<option value="'+status+'">'),status);
});

test("R4: media-type policies retain image-only safety while allowing DCE PDF/video/audio", () => {
 const pdf=base("dce-pdf",{mime:"application/pdf",url:"/api/angelcare-marketplace/media/dce.pdf"});
 const video=base("dce-video",{mime:"video/mp4",url:"/api/angelcare-marketplace/media/dce.mp4"});
 assert.match(assetIssue(pdf),/does not accept/);
 assert.equal(assetIssue(pdf,Date.now(),[]),"");
 assert.equal(assetIssue(pdf,Date.now(),["application/pdf"]),"");
 assert.match(assetIssue(video,Date.now(),["application/pdf"]),/does not accept/);
 assert.deepEqual(addUniqueAssets([],[pdf,video],4,[],["application/pdf"]).map(x=>x.id),["dce-pdf"]);
});
test("R4: DCE media pickers use the common vault and non-media references remain legacy", () => {
 const editor=readFileSync(new URL("../../angelcare-marketplace/digital-customer-experience/components/Editor.tsx",import.meta.url),"utf8");
 const create=readFileSync(new URL("../../angelcare-marketplace/digital-customer-experience/components/CreationControls.tsx",import.meta.url),"utf8");
 for(const code of [editor,create]){
  assert.match(code,/NativeMediaVaultChooser/);
  assert.match(code,/type === "media"/);
  assert.match(code,/Legacy(?:Creation)?ReferencePicker/);
 }
});

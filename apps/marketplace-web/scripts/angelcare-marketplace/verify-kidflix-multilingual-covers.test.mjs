import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { effectiveCoverAssetId, localizedCoverAssetId, withLocalizedCoverAssetId } from "../../angelcare-marketplace/digital-customer-experience/cover-contract.ts";
const shared = "123e4567-e89b-42d3-a456-426614174000";
const en = "123e4567-e89b-42d3-a456-426614174001";
const fr = "123e4567-e89b-42d3-a456-426614174002";
const ar = "123e4567-e89b-42d3-a456-426614174003";
test("legacy shared cover works for FR, EN and AR without migration", () => {
 const d = { coverAssetId: shared, locales: { en: { title:"A" }, fr:{title:"B"}, ar:{title:"C"} } };
 for (const locale of ["en","fr","ar"]) assert.equal(effectiveCoverAssetId(d,locale),shared);
});
test("three localized covers can exist without a shared image", () => {
 let d = { locales: { en:{title:"Animals"},fr:{title:"Animaux"},ar:{title:"حيوانات"} } };
 d = withLocalizedCoverAssetId(d,"en",en);
 d = withLocalizedCoverAssetId(d,"fr",fr);
 d = withLocalizedCoverAssetId(d,"ar",ar);
 assert.equal(effectiveCoverAssetId(d,"en"),en);
 assert.equal(effectiveCoverAssetId(d,"fr"),fr);
 assert.equal(effectiveCoverAssetId(d,"ar"),ar);
 assert.equal(effectiveCoverAssetId(d,"en")===effectiveCoverAssetId(d,"fr"),false);
});
test("a French-only edit cannot replace the English or Arabic covers", () => {
 const original = { coverAssetId:shared, locales:{en:{coverAssetId:en,title:"Animals"},fr:{coverAssetId:fr,title:"Animaux"},ar:{coverAssetId:ar,title:"حيوانات"}}};
 const before=JSON.stringify(original);
 const next=withLocalizedCoverAssetId(original,"fr","123e4567-e89b-42d3-a456-426614174004");
 assert.equal(effectiveCoverAssetId(next,"en"),en);
 assert.equal(effectiveCoverAssetId(next,"ar"),ar);
 assert.equal(effectiveCoverAssetId(next,"fr"),"123e4567-e89b-42d3-a456-426614174004");
 assert.equal(next.locales.fr.title,"Animaux");
 assert.equal(JSON.stringify(original),before);
});
test("removing a language override reveals the shared fallback, never blanks the edition", () => {
 const d={coverAssetId:shared,locales:{fr:{title:"Animaux",coverAssetId:fr},en:{title:"Animals"}}};
 const cleared=withLocalizedCoverAssetId(d,"fr",null);
 assert.equal(effectiveCoverAssetId(cleared,"fr"),shared);
 assert.equal(Object.hasOwn(cleared.locales.fr,"coverAssetId"),false);
 assert.equal(cleared.locales.fr.title,"Animaux");
 assert.equal(effectiveCoverAssetId(d,"fr"),fr);
});
test("legacy explicitly empty overrides still fall back to shared", () => {
 const d={coverAssetId:shared,locales:{en:{coverAssetId:""},fr:{coverAssetId:null},ar:{}}};
 for(const l of ["en","fr","ar"])assert.equal(effectiveCoverAssetId(d,l),shared);
});
test("without a shared or localized cover the edition remains missing",()=>{
 assert.equal(localizedCoverAssetId({locales:{fr:{title:"Animaux"}}},"fr"),"");
 assert.equal(effectiveCoverAssetId({locales:{fr:{title:"Animaux"}}},"fr"),"");
});
test("actual editor, edition projection, native validator and public manifest paths stay connected",()=>{
 const root = new URL("../../angelcare-marketplace/digital-customer-experience/",import.meta.url);
 const editor=readFileSync(new URL("components/Editor.tsx",root),"utf8");
 const projection=readFileSync(new URL("experience-contract.ts",root),"utf8");
 const validation=readFileSync(new URL("validation.ts",root),"utf8");
 const model=readFileSync(new URL("model.ts",root),"utf8");
 const service=readFileSync(new URL("master-service.ts",root),"utf8");
 assert.match(editor,/<MultilingualCoverStudio/);
 assert.match(editor,/withLocalizedCoverAssetId\(d, which, id\)/);
 assert.match(editor,/type: "media", mime: \["image\/"\]/);
 assert.match(projection,/data.coverAssetId = effectiveCoverAssetId\(source, locale\)/);
 assert.match(validation,/!effectiveCoverAssetId\(d, coverLocale\)/);
 assert.match(validation,/locales\." \+ locale \+ "\.coverAssetId"/);
 assert.match(model,/"coverAssetId"/);
 assert.match(service,/editionProjection\(r, l\)/);
 assert.match(service,/publicManifest\(p, v.bindings\)/);
 const coverRoute=readFileSync(new URL("../../../../app/api/kidflix/cover/route.ts",root),"utf8");
 assert.match(coverRoute,/detail.manifest.definition/);
 assert.match(coverRoute,/COVER_NOT_PUBLISHED/);
});

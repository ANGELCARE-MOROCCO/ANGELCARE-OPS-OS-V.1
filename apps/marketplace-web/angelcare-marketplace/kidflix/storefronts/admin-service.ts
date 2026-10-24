import {loadDocuments}from "../documents/server";
import {bindingURL} from "../gallery-contract";
import { createHash } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import type { MarketplaceRequestContext as Context } from "../../domain/types";
import { MarketplaceError } from "../../server/errors";
import { authorize, native } from "../../digital-customer-experience/repository";
import { isId } from "../../digital-customer-experience/model";
import { stable } from "../../digital-customer-experience/experience-contract";
import {
  isLocale,
  type Locale,
} from "../catalogue";
import { publicHost } from "../server";
import {defaults}from "./themes";
import {normalize as normalizeEdition,familyKey}from "./model";
import {world}from "../catalogue";
import {kidflixRead}from '../admin-service';
import {getStorefront}from './server';
import {emptyCatalogue}from '../catalogue';
import {keyOK}from './model';
const obj = (v: any) =>
  v && typeof v === "object" && !Array.isArray(v) ? v : {};
export const homeHash = (v: unknown) =>
  createHash("sha256").update(stable(v)).digest("hex");
async function current(c: Context, family:string) {
  const db = await createServiceClient();
  let q = db
    .from("ac_dce_records")
    .select("*")
    .eq("kind", "setting")
    .eq("key", familyKey(family));
  q = c.tenantId ? q.eq("tenant_id", c.tenantId) : q.is("tenant_id", null);
  q = c.territoryId
    ? q.eq("territory_id", c.territoryId)
    : q.is("territory_id", null);
  const r = await q.maybeSingle();
  if (r.error)
    throw new MarketplaceError(
      "CONFIGURATION_ERROR",
      "KidFlix settings are unavailable. Entries remain preserved.",
    );
  return r.data;
}
export async function kidflixStorefrontRead(c: Context, family:string) {
  authorize(c, "view");
  if(!world(family))throw new MarketplaceError("VALIDATION_ERROR","Choose a native family.");
  const r = await current(c,family);
  return {
    record: r,
    draftHashes: Object.fromEntries(
      ["en", "fr", "ar"].map((l) => [
        l,
        homeHash(obj(obj(r?.data).draft)[l]?.edition || {}),
      ]),
    ),
    defaults: Object.fromEntries(
      ["en", "fr", "ar"].map((l) => [l, defaults(family,l as Locale)]),
    ),
  };
}
export async function kidflixStorefrontPreview(c:Context,family:string,locale:Locale){
 authorize(c,'view');if(!world(family)||!isLocale(locale))throw new MarketplaceError('VALIDATION_ERROR','Choose a native family and language.');
 const home=await kidflixRead(c),host=home.record?.data?.liveHost;
 if(!host)return {catalogue:{...emptyCatalogue},facets:{},edition:defaults(family,locale),configured:false,curated:[]};
 const value=await getStorefront(host,locale,family);if(family!=='documents')return value;
 const record=await current(c,family),ids=[...new Set<string>((record?.data?.draft?.[locale]?.edition?.documentsTestimonials||[]).map((t:any)=>t.portraitAssetId).filter(Boolean))];
 const resolved=await Promise.allSettled(ids.map(async id=>{const result=await native(c,'media',{id});const a=result.rows?.find((v:any)=>v.id===id);return a?.mime?.startsWith('image/')&&(!a.expiresAt||Date.parse(a.expiresAt)>Date.now())?[id,a.url]as const:null;}));
 const portraits=Object.fromEntries(resolved.flatMap(r=>r.status==='fulfilled'&&r.value?[r.value]:[]));
 return{...value,documents:await loadDocuments(host,locale),documentsPortraits:portraits};
}
export async function kidflixStorefrontSelection(c:Context,family:string,locale:Locale,raw:string){
 authorize(c,'view');const keys=raw?raw.split(','):[];
 if(!world(family)||!isLocale(locale)||keys.length>96||keys.some(k=>!keyOK(k)))throw new MarketplaceError('VALIDATION_ERROR','Choose valid family resources.');
 if(!keys.length)return {rows:[]};
 const db=await createServiceClient();let q=db.from('ac_dce_records').select('id,key,title,family').in('key',keys).eq('family',family).in('kind',['experience','bundle']).neq('lifecycle','archived');
 q=c.tenantId?q.eq('tenant_id',c.tenantId):q.is('tenant_id',null);q=c.territoryId?q.eq('territory_id',c.territoryId):q.is('territory_id',null);
 const records=await q;if(records.error)throw new MarketplaceError('DEPENDENCY_BLOCKED','Selected resources are unavailable.');
 if(!records.data?.length)return{rows:keys.map(key=>({key,title:key,available:false}))};
 const editions=await db.from('ac_dce_editions').select('record_id,active_release_id').eq('locale',locale).in('record_id',records.data.map((r:any)=>r.id));
 if(editions.error)throw new MarketplaceError('DEPENDENCY_BLOCKED','Language editions are unavailable.');
 const ids=editions.data?.map((e:any)=>e.active_release_id).filter(Boolean)||[],releases=ids.length?await db.from('ac_dce_releases').select('id,record_id,state,manifest').in('id',ids):{data:[],error:null};
 if(releases.error)throw new MarketplaceError('DEPENDENCY_BLOCKED','Published selections are unavailable.');
 return{rows:keys.map(key=>{const r=records.data.find((r:any)=>r.key===key),e=editions.data?.find((e:any)=>e.record_id===r?.id),z=releases.data?.find((z:any)=>z.id===e?.active_release_id&&z.record_id===r?.id&&z.state==='published'&&z.manifest?.editionLocale===locale&&(z.manifest?.definition?.visibility||'free')==='free');return{key,title:z?.manifest?.title||r?.title||key,available:!!z};})};
}
export async function kidflixStorefrontCommand(c: Context, cmd: any) {
  authorize(c, "view");
  const family=String(cmd.family||"");if(!world(family))throw new MarketplaceError("VALIDATION_ERROR","Choose a native family.");
  const action = String(cmd.action);
  if (
    !["kidflix_storefront_save", "kidflix_storefront_publish", "kidflix_storefront_unpublish"].includes(action)
  )
    throw new MarketplaceError(
      "VALIDATION_ERROR",
      "Unknown KidFlix operation.",
    );
  authorize(c, action === "kidflix_storefront_save" ? "manage" : "publish");
  if (!isId(cmd.requestId) || !isLocale(cmd.locale))
    throw new MarketplaceError(
      "VALIDATION_ERROR",
      "Choose an edition and command receipt.",
    );
  const receiptDb = await createServiceClient(),
    receipt = await receiptDb
      .from("ac_dce_commands")
      .select("input_hash,response")
      .eq("actor_id", c.actor.id)
      .eq("request_id", cmd.requestId)
      .maybeSingle();
  if (receipt.error)
    throw new MarketplaceError(
      "DEPENDENCY_BLOCKED",
      "Command receipt unavailable; entries retained.",
    );
  if (receipt.data) {
    if (receipt.data.input_hash !== homeHash(cmd))
      throw new MarketplaceError(
        "CONFLICT",
        "This receipt belongs to another command.",
      );
    return {
      ...receipt.data.response,
      draftHash: homeHash(
        obj(obj(receipt.data.response?.record?.data).draft)[cmd.locale]
          ?.edition || {},
      ),
    };
  }
  const prior = await current(c,family);
  if ((prior?.revision || 0) !== Number(cmd.revision))
    throw new MarketplaceError(
      "CONFLICT",
      "The settings changed. Your entries are retained; reload before reconciling.",
    );
  const locale = cmd.locale as Locale,
    data = { ...obj(prior?.data) },
    draft = { ...obj(data.draft) },
    live = { ...obj(data.live) };
  if (action === "kidflix_storefront_save") {
    try {
      draft[locale] = { edition: normalizeEdition(cmd.edition, locale,family) };
    } catch (e) {
      throw new MarketplaceError("VALIDATION_ERROR", (e as Error).message);
    }
  }
  if (action === "kidflix_storefront_publish") {
    if (prior?.lifecycle === "archived")
      throw new MarketplaceError(
        "DEPENDENCY_BLOCKED",
        "Restore the configuration before publication.",
      );
    const selected = obj(draft[locale]);
    if (!selected.edition || cmd.draftHash !== homeHash(selected.edition))
      throw new MarketplaceError(
        "CONFLICT",
        "Save and review this exact language draft before publishing.",
      );
    live[locale] = {
      edition: normalizeEdition(selected.edition, locale,family),
      revision: Number(prior?.revision || 0) + 1,
      publishedAt: new Date().toISOString(),
    };
  }
  if (action === "kidflix_storefront_unpublish") {
    delete live[locale];
  }
  data.draft = draft;
  data.live = live;
  const selectedEditions = [...Object.values(draft), ...Object.values(live)]
      .map((v) => obj(v).edition)
      .filter(Boolean),
    mediaIds = [
      ...new Set(
        selectedEditions.flatMap(
          (v:any) => [...Object.values(obj(obj(v).mediaBindings)),...(Array.isArray(v.documentsTestimonials)?v.documentsTestimonials.map((t:any)=>t.portraitAssetId).filter(Boolean):[])] as string[],
        ),
      ),
    ];
  if (action === "kidflix_storefront_save" || action === "kidflix_storefront_publish") {
    const selected =
      action === "kidflix_storefront_save"
        ? obj(draft[locale]).edition
        : obj(live[locale]).edition;
    for (const [slot, id] of Object.entries(obj(selected.mediaBindings))) {
      const result = await native(c, "media", { id });
      const asset = result.rows?.find((v: any) => v.id === id),
        url =
          slot.startsWith("scene:") ? bindingURL(selected,slot) : selected[slot];
      if (
        !asset ||
        !asset.mime?.startsWith("image/") ||
        asset.url !== url ||
        (asset.expiresAt && Date.parse(asset.expiresAt) <= Date.now())
      )
        throw new MarketplaceError(
          "DEPENDENCY_BLOCKED",
          "A selected native image changed or expired. Choose it again; the current public edition remains intact.",
        );
    }
  }
  if(family==='documents'&&(action==='kidflix_storefront_save'||action==='kidflix_storefront_publish')) {
    const selected=obj(action==='kidflix_storefront_save'?draft[locale]:live[locale]).edition;
    for(const t of selected.documentsTestimonials||[]) if(t.portraitAssetId) {const result=await native(c,'media',{id:t.portraitAssetId});const asset=result.rows?.find((v:any)=>v.id===t.portraitAssetId);if(!asset?.mime?.startsWith('image/')||(asset.expiresAt&&Date.parse(asset.expiresAt)<=Date.now()))throw new MarketplaceError('DEPENDENCY_BLOCKED','Choose a current approved native portrait.');}
  }
  const db = await createServiceClient();
  const keys=[...new Set(selectedEditions.flatMap((e:any)=>[...(e.featured||[]),...(e.collections||[]).flatMap((g:any)=>g.keys||[]),...(e.documentsTestimonials||[]).map((t:any)=>t.resourceKey).filter(Boolean)]))];
  const references:string[]=[];
  if(keys.length){
    let q=db.from('ac_dce_records').select('id,key,family,kind,lifecycle').in('key',keys).eq('family',family).in('kind',['experience','bundle']).neq('lifecycle','archived');
    q=c.tenantId?q.eq('tenant_id',c.tenantId):q.is('tenant_id',null);q=c.territoryId?q.eq('territory_id',c.territoryId):q.is('territory_id',null);
    const found=await q;if(found.error||keys.some(k=>!found.data?.some((r:any)=>r.key===k)))throw new MarketplaceError('DEPENDENCY_BLOCKED','Every selected resource must belong to this native family and scope.');
    references.push(...found.data.map((r:any)=>r.id));
    if(action==='kidflix_storefront_publish'){
      const selected=obj(live[locale]).edition,required=[...new Set([...(selected.featured||[]),...(selected.collections||[]).flatMap((g:any)=>g.keys||[]),...(selected.documentsTestimonials||[]).map((t:any)=>t.resourceKey).filter(Boolean)])];
      const ids=found.data.filter((r:any)=>required.includes(r.key)).map((r:any)=>r.id);
      if(ids.length){const e=await db.from('ac_dce_editions').select('record_id,active_release_id').eq('locale',locale).in('record_id',ids);
      if(e.error||ids.some((id:string)=>!e.data?.some((v:any)=>v.record_id===id&&v.active_release_id)))throw new MarketplaceError('DEPENDENCY_BLOCKED','Publish each curated resource in this language before publishing its storefront.');
      const releases=await db.from('ac_dce_releases').select('id,record_id,state,manifest').in('id',e.data.map((v:any)=>v.active_release_id));
      if(releases.error||e.data.some((v:any)=>!releases.data?.some((z:any)=>z.id===v.active_release_id&&z.record_id===v.record_id&&z.state==='published'&&z.manifest?.editionLocale===locale&&(z.manifest?.definition?.visibility||'free')==='free')))throw new MarketplaceError('DEPENDENCY_BLOCKED','A curated resource is no longer available in this language.');}
    }
  }
  const
    r = await db.rpc("ac_dce_write", {
      p_actor: c.actor.id,
      p_tenant: c.tenantId,
      p_territory: c.territoryId,
      p_request: cmd.requestId,
      p_hash: homeHash(cmd),
      p_action: "save",
      p_id: prior?.id || null,
      p_revision: prior?.revision || 0,
      p_record: {
        kind: "setting",
        key: familyKey(family),
        title: "KidFlix · "+family+" storefront",
        family: null,
        topic: null,
        audience: "parent",
        data,
      },
      p_refs: { record: references, media: mediaIds, offer: [] },
    });
  if (r.error)
    throw new MarketplaceError(
      /CONFLICT|REVISION|duplicate/i.test(r.error.message)
        ? "CONFLICT"
        : "DEPENDENCY_BLOCKED",
      "KidFlix settings were not changed. Reconcile the retained draft and retry.",
    );
  return { ...r.data, draftHash: homeHash(obj(draft[locale]).edition || {}) };
}

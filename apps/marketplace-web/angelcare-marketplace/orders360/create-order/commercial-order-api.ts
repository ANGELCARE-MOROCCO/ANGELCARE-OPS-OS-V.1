
import "server-only";
import {NextResponse} from "next/server";
import {requireMarketplaceApiContext,hasMarketplacePermission} from "../../auth/context";
import {requireCustomerSameOrigin} from "../../customer-commerce/customer-access-api";
import {createServiceClient} from "@/lib/supabase/server";
import {apiFailure,apiSuccess,parseJsonObject,requestId} from "../../server/request";
import {MarketplaceError} from "../../server/errors";

type Row=Record<string,unknown>;
const asRow=(v:unknown):Row=>v&&typeof v==="object"&&!Array.isArray(v)?v as Row:{};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuid=(v:unknown,field:string):string=>{
 if(typeof v!=="string"||!UUID.test(v))throw new MarketplaceError("VALIDATION_ERROR",field+" : identifiant invalide.");
 return v;
};
const str=(v:unknown,min=1,max=160):string=>{
 if(typeof v!=="string"||v.trim().length<min||v.length>max)
  throw new MarketplaceError("VALIDATION_ERROR","Une valeur de requête est invalide.");
 return v.trim();
};
const int=(v:unknown,min=0,max=2147483647)=>{
 const n=Number(v);
 if(!Number.isInteger(n)||n<min||n>max)throw new MarketplaceError("VALIDATION_ERROR","Version ou limite invalide.");
 return n;
};
const fail=(error:{message?:string;code?:string}|null,action:string):never=>{
 const code=error?.code==="PGRST202"||error?.code==="42P01"?"CONFIGURATION_ERROR":
  /STALE|LOCKED|APPROVAL|SCOPE|ALREADY/.test(error?.message||"")?"CONFLICT":"VALIDATION_ERROR";
 throw new MarketplaceError(code,"Commercial Order Studio : "+(error?.message||action),{cause:error});
};
const status=(error:{message?:string;code?:string}|null,action:string,data:unknown)=>{
 if(error)fail(error,action);
 if(data===undefined||data===null)throw new MarketplaceError("DATA_INTEGRITY","Aucun reçu serveur confirmé.");
 return data;
};
const canApprove=(ctx:Awaited<ReturnType<typeof requireMarketplaceApiContext>>)=>
 hasMarketplacePermission(ctx,"marketplace.operations.missions.manage");
const scoped=(q:any,ctx:Awaited<ReturnType<typeof requireMarketplaceApiContext>>)=>{
 if(ctx.tenantId)q=q.eq("tenant_id",ctx.tenantId);
 if(ctx.territoryId)q=q.or("territory_id.is.null,territory_id.eq."+ctx.territoryId);
 return q;
};
const safePayload=(v:unknown):Row=>{
 const body=asRow(v),lines=body.lines;
 if(!Array.isArray(lines)||lines.length>60||JSON.stringify(body).length>250000)
  throw new MarketplaceError("VALIDATION_ERROR","Le panier ne respecte pas les limites de sécurité.");
 const allowedModes=new Set(["quick","expert","quote","subscription","b2b","renewal"]);
 if(!allowedModes.has(String(body.mode)))throw new MarketplaceError("VALIDATION_ERROR","Mode commercial invalide.");
 for(const line of lines){
  const v=asRow(line);
  uuid(v.itemId,"Catalogue");
  const qty=int(v.quantity,1,1000);
  if(qty>1000||v.unitPrice!==null&&v.unitPrice!==undefined&&(!Number.isFinite(Number(v.unitPrice))||Number(v.unitPrice)<0))
   throw new MarketplaceError("VALIDATION_ERROR","Prix ou quantité invalide.");
  if(!Number.isFinite(Number(v.discountAmount??0))||Number(v.discountAmount??0)<0)
   throw new MarketplaceError("VALIDATION_ERROR","Remise invalide.");
 }
 if(body.customerAccountId)uuid(body.customerAccountId,"Client");
 if(body.territoryId)uuid(body.territoryId,"Territoire");
 return body;
};

export async function commercialGet(request:Request){
 const rid=requestId(request);
 try{
  const ctx=await requireMarketplaceApiContext("marketplace.operations.view");
  const db=await createServiceClient();
  const url=new URL(request.url),customerId=url.searchParams.get("customerId");
  if(customerId){
   const id=uuid(customerId,"Client");
   const customer=await scoped(db.from("angelcare_marketplace_customer_accounts")
    .select("id,tenant_id,territory_id,status").eq("id",id),ctx).maybeSingle();
   if(customer.error)fail(customer.error,"Lecture du client");
   if(!customer.data)throw new MarketplaceError("NOT_FOUND","Client introuvable dans votre périmètre.");
   const [journeys,addresses]=await Promise.all([
    db.from("angelcare_marketplace_journeys")
     .select("id,created_at,financial_status").eq("customer_account_id",id)
     .order("created_at",{ascending:false}).limit(100),
    db.from("angelcare_marketplace_customer_addresses")
     .select("id,city,address_line,label,status").eq("customer_account_id",id).eq("status","active")
     .order("is_default",{ascending:false}).limit(30)
   ]);
   if(journeys.error)fail(journeys.error,"Historique commandes");
   if(addresses.error)fail(addresses.error,"Adresses du client");
   const values=(journeys.data||[]).map(x=>asRow(x.financial_status));
   const sum=values.reduce((a,x)=>a+(Number(x.expected_amount)||0),0);
   return apiSuccess({
    orderCount:journeys.data?.length||0,value:Math.round(sum*100)/100,
    lastOrderAt:journeys.data?.[0]?.created_at||null,
    addresses:(addresses.data||[]).map(x=>({
     id:x.id,city:x.city||"",address_line:x.address_line||"",label:x.label||"Adresse"
    }))
   },{requestId:rid});
  }
  const mediaFor=url.searchParams.get("mediaFor");
  if(mediaFor){
   const ids=[...new Set(mediaFor.split(",").filter(Boolean))];
   if(ids.length>40||ids.some(x=>!UUID.test(x)))throw new MarketplaceError("VALIDATION_ERROR","Liste d'images du catalogue invalide.");
   if(!ids.length)return apiSuccess({}, {requestId:rid});
   const published=await scoped(db.from("angelcare_marketplace_catalog_items").select("id")
     .in("id",ids).eq("status","published"),ctx);
   if(published.error)fail(published.error,"Catalogue accessible");
   const allowed=(published.data||[]).map((x:Row)=>String(x.id));
   if(!allowed.length)return apiSuccess({}, {requestId:rid});
   const media=await db.from("angelcare_marketplace_catalog_item_media")
    .select("catalog_item_id,asset_url,media_key,status,sort_order")
    .in("catalog_item_id",allowed).eq("status","active")
    .order("sort_order",{ascending:true}).limit(250);
   if(media.error)fail(media.error,"Vignettes du catalogue");
   const selected:Record<string,string>={};
   for(const row of media.data||[]){
     if(selected[row.catalog_item_id])continue;
     const url=typeof row.asset_url==="string"?row.asset_url:"";
     if(url.startsWith("/")||url.startsWith("https://"))selected[row.catalog_item_id]=url;
   }
   return apiSuccess(selected,{requestId:rid});
  }
  if(url.searchParams.get("drafts")==="1"){
   const rows=await scoped(db.from("angelcare_marketplace_commercial_drafts_r7").select(
    "id,version,status,mode,payload,approval_state,submitted_order_id,created_at,updated_at"
   ).eq("actor_id",ctx.actor.id).order("updated_at",{ascending:false}).limit(60),ctx);
   if(rows.error)fail(rows.error,"Brouillons commerciaux");
   return apiSuccess(rows.data||[],{requestId:rid});
  }
  if(url.searchParams.get("approvals")==="1"){
   if(!canApprove(ctx))throw new MarketplaceError("PERMISSION_DENIED","Approbation non autorisée.");
   const rows=await scoped(db.from("angelcare_marketplace_commercial_drafts_r7").select(
    "id,version,status,mode,payload,approval_state,actor_id,updated_at"
   ).eq("status","draft").eq("approval_state","requested").neq("actor_id",ctx.actor.id)
    .order("updated_at",{ascending:true}).limit(40),ctx);
   if(rows.error)fail(rows.error,"Approbations en attente");
   return apiSuccess(rows.data||[],{requestId:rid});
  }
  throw new MarketplaceError("VALIDATION_ERROR","Requête commerciale non prise en charge.");
 }catch(error){return apiFailure(error,rid)}
}

export async function commercialPost(request:Request){
 const rid=requestId(request);
 try{
  const ctx=await requireMarketplaceApiContext("marketplace.operations.missions.create");
  requireCustomerSameOrigin(request);
  const raw=await parseJsonObject(request);
  if(JSON.stringify(raw).length>270000)throw new MarketplaceError("VALIDATION_ERROR","Requête trop volumineuse.");
  const action=str(raw.action,4,36),input=asRow(raw.input);
  const actor=uuid(ctx.actor.id,"Opérateur");
  const reqKey=str(raw.requestKey,8,160);
  const db=await createServiceClient();
  let data:unknown;
  if(action==="quote"){
   const payload=safePayload(input.payload);
   const customerId=payload.customerAccountId;
   if(customerId){
    const customer=await scoped(db.from("angelcare_marketplace_customer_accounts")
      .select("id").eq("id",customerId),ctx).maybeSingle();
    if(customer.error||!customer.data)throw new MarketplaceError("SCOPE_MISMATCH","Client hors de votre périmètre.");
   }
   const q=await db.rpc("angelcare_marketplace_commercial_r7_quote",{p_payload:payload});
   data=status(q.error,"Calcul commercial",q.data);
  }else if(action==="save"){
   const payload=safePayload(input.payload);
   const id=uuid(input.id,"Brouillon"),expected=int(input.expectedVersion,0,10000000);
   if(payload.customerAccountId){
    const customer=await scoped(db.from("angelcare_marketplace_customer_accounts").select("id").eq("id",payload.customerAccountId),ctx).maybeSingle();
    if(customer.error||!customer.data)throw new MarketplaceError("SCOPE_MISMATCH","Client hors de votre périmètre.");
   }
   const q=await db.rpc("angelcare_marketplace_commercial_r7_save",{
     p_id:id,p_actor:actor,p_tenant:ctx.tenantId||null,p_territory:ctx.territoryId||null,
     p_expected:expected,p_payload:payload,p_request:reqKey
   });
   data=status(q.error,"Sauvegarde du brouillon",q.data);
  }else if(action==="request-approval"||action==="approve"){
   if(action==="approve"&&!canApprove(ctx))throw new MarketplaceError("PERMISSION_DENIED","Droit d'approbation requis.");
   const id=uuid(input.id,"Brouillon");
   const draft=await scoped(db.from("angelcare_marketplace_commercial_drafts_r7")
    .select("id,actor_id,mode,version,status,approval_state").eq("id",id),ctx).maybeSingle();
   if(draft.error||!draft.data)throw new MarketplaceError("NOT_FOUND","Brouillon inaccessible.");
   if(action==="request-approval"&&draft.data.actor_id!==actor)
    throw new MarketplaceError("PERMISSION_DENIED","Seul l'auteur peut demander une approbation.");
   const q=await db.rpc("angelcare_marketplace_commercial_r7_review",{
    p_id:id,p_actor:actor,p_expected:int(input.expectedVersion,1),p_action:action==="approve"?"approve":"request"
   });
   data=status(q.error,"Décision commerciale",q.data);
  }else if(action==="submit"){
   const id=uuid(input.id,"Brouillon"),expected=int(input.expectedVersion,1);
   const draft=await scoped(db.from("angelcare_marketplace_commercial_drafts_r7")
    .select("id,actor_id,status").eq("id",id),ctx).maybeSingle();
   if(draft.error||!draft.data||draft.data.actor_id!==actor)
    throw new MarketplaceError("NOT_FOUND","Brouillon non disponible.");
   const q=await db.rpc("angelcare_marketplace_commercial_r7_submit",{
    p_id:id,p_actor:actor,p_tenant:ctx.tenantId||null,p_territory:ctx.territoryId||null,
    p_expected:expected,p_request:reqKey
   });
   data=status(q.error,"Création canonique",q.data);
  }else{
   throw new MarketplaceError("VALIDATION_ERROR","Commande commerciale non reconnue.");
  }
  return apiSuccess(data,{requestId:rid,status:action==="submit"?201:200});
 }catch(error){return apiFailure(error,rid)}
}

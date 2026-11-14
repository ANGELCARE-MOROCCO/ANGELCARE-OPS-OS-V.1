import "server-only";
import { NextResponse } from "next/server";
import { requireMarketplaceApiContext } from "../auth/context";
import { access, db, rpc } from "./repository";
import { resolveScaleR4 } from "./scale-r4-runtime";
import { record, SeoFault, uuid } from "./model";
import { jsonBody, failure } from "./api";

const id=()=>crypto.randomUUID();
const commandEnabled=()=>process.env.SEO_POWER_COMMAND360_R5_ENABLED==="1";
function nonBlank(value:unknown,min=1,max=160):string{
  const text=typeof value==="string"?value.trim():"";
  if(text.length<min||text.length>max)throw new SeoFault("INVALID_INPUT","Valeur hors limites.",400);
  return text;
}
function integer(value:unknown,min:number,max:number):number{
  const n=Number(value);
  if(!Number.isInteger(n)||n<min||n>max)throw new SeoFault("INVALID_RANGE","Capacité ou durée invalide.",400);
  return n;
}
async function auth(){
  const ctx=await requireMarketplaceApiContext("marketplace.web_presence.view");
  if(!access(ctx).view)throw new SeoFault("VIEW_REQUIRED","Accès global SEO requis.",403);
  return ctx;
}
export async function commandGet(request:Request){
  const rid=id();
  try{
    await auth();
    const u=new URL(request.url),project=u.searchParams.get("project");
    const client=await db();
    const status=await client.rpc("ac_seo_power_r5_dashboard",{p_project:project?uuid(project):null});
    if(status.error){
      return NextResponse.json({data:{ready:false,reason:"Migration Command 360 R5 non disponible.",code:status.error.code||"R5_MIGRATION_REQUIRED",observedAt:new Date().toISOString(),engineFlag:commandEnabled()},requestId:rid},{headers:{"Cache-Control":"no-store"}});
    }
    const data=record(status.data);
    const liveEngine=await (async()=>{
      if(!commandEnabled())return false;
      try{return Boolean(await resolveScaleR4())}catch{return false}
    })();
    return NextResponse.json({data:{...data,ready:true,engineFlag:commandEnabled(),r4Effective:liveEngine},requestId:rid},{headers:{"Cache-Control":"no-store"}});
  }catch(error){return failure(error,rid)}
}
export async function commandPost(request:Request){
  const rid=id();
  try{
    const ctx=await auth();
    if(!access(ctx).manage)throw new SeoFault("MANAGE_REQUIRED","Permission de gestion SEO nécessaire.",403);
    const body=await jsonBody(request,10000);
    const action=nonBlank(body.action,2,50),payload=record(body.input);
    const requestKey=nonBlank(body.requestKey,8,160);
    const actor=uuid(ctx.actor.id);
    if(!commandEnabled())throw new SeoFault("R5_ENV_DISABLED","Activer l'option de déploiement R5 avant d'autoriser des mutations.",409);
    if(action==="activate"){
      if(!access(ctx).publish)throw new SeoFault("PUBLISH_REQUIRED","Activation réservée à un administrateur habilité.",403);
      const scale=await resolveScaleR4();
      if(payload.enabled===true&&!scale)throw new SeoFault("R4_INACTIVE","R4 doit être actif avant Command 360.",409);
      const expected=integer(payload.revision,1,100000000);
      const client=await db();
      const update=await client.from("ac_seo_power_r5_control").update({enabled:payload.enabled===true,revision:expected+1,updated_at:new Date().toISOString()})
        .eq("singleton",true).eq("revision",expected).select("enabled,revision,updated_at").single();
      if(update.error||!update.data)throw new SeoFault("STALE_R5_REVISION","Configuration actualisée ailleurs; recharger le statut.",409);
      return NextResponse.json({data:update.data,requestId:rid});
    }
    const scale=await resolveScaleR4();
    const client=await db();
    const status=await client.from("ac_seo_power_r5_control").select("enabled").eq("singleton",true).single();
    if(status.error||status.data?.enabled!==true)throw new SeoFault("R5_INACTIVE","Activer Command 360 pour lancer des actions.",409);
    if(!scale)throw new SeoFault("R4_INACTIVE","Exécution R4 non active côté serveur.",409);
    let result:unknown;
    if(action==="campaign-start"){
      result=await rpc("ac_seo_power_r5_start",{
        p_project:uuid(payload.projectId),
        p_kind:nonBlank(payload.kind,4,20),
        p_limit:integer(payload.limit,1,1000),
        p_title:nonBlank(payload.title,3,160),
        p_actor:actor,p_request:requestKey,p_source:"manual"
      });
    }else if(action==="campaign-pause"||action==="campaign-resume"||action==="campaign-cancel"){
      result=await rpc("ac_seo_power_r5_campaign_action",{
        p_id:uuid(payload.id),p_action:action.slice("campaign-".length),
        p_actor:actor,p_expected:nonBlank(payload.expected,5,20)
      });
    }else if(action==="schedule-save"){
      result=await rpc("ac_seo_power_r5_schedule_save",{
        p_id:payload.id?uuid(payload.id):null,
        p_project:uuid(payload.projectId),
        p_name:nonBlank(payload.name,3,100),p_kind:nonBlank(payload.kind,4,20),
        p_interval:integer(payload.intervalMinutes,15,10080),
        p_limit:integer(payload.limit,1,1000),p_enabled:payload.enabled===true,
        p_actor:actor,p_request:requestKey,p_version:payload.id?integer(payload.version,1,1000000):null
      });
    }else if(action==="capacity-save"){
      if(!access(ctx).publish)throw new SeoFault("PUBLISH_REQUIRED","Droit renforcé nécessaire.",403);
      const status=await client.from("ac_seo_power_r4_control").select("capacity,updated_at").eq("singleton",true).single();
      if(status.error||!status.data)throw new SeoFault("CAPACITY_UNAVAILABLE","Capacité indisponible.",503);
      const current=record(status.data.capacity);
      const allowed:Record<string,[number,number]>={
        globalConcurrency:[1,64],perProjectConcurrency:[1,32],perOriginConcurrency:[1,32],
        workersPerTick:[1,8],jobsPerWorker:[1,6],requestTimeoutSeconds:[5,45],
        leaseSeconds:[90,600],maxAttempts:[1,12],linkBatchSize:[1,48],
        linksPerPage:[10,1000],maxPagesPerProject:[10000,1000000],
        discoveryBatchSize:[1,500],dailyJobsPerProject:[120,100000],
        queueLimitPerProject:[1000,500000],scheduleBatchSize:[1,1000]
      };
      const proposed=record(payload.capacity),next={...current};
      for(const [key,value] of Object.entries(proposed)){
        const bounds=allowed[key];
        if(!bounds)throw new SeoFault("CAPACITY_FIELD_UNRECOGNIZED","Champ de capacité non autorisé.",400);
        next[key]=integer(value,bounds[0],bounds[1]);
      }
      if(Number(next.perOriginConcurrency)>Number(next.globalConcurrency)||Number(next.perProjectConcurrency)>Number(next.globalConcurrency))
        throw new SeoFault("CAPACITY_INCONSISTENT","La concurrence globale doit couvrir les limites par origine et projet.",400);
      const applied=await client.from("ac_seo_power_r4_control").update({capacity:next})
       .eq("singleton",true).eq("updated_at",nonBlank(payload.expectedUpdatedAt,10,100))
       .select("enabled,capacity,updated_at").single();
      if(applied.error||!applied.data)throw new SeoFault("STALE_CAPACITY","Configuration concurrente; recharger.",409);
      result=applied.data;
    }else if(action==="job-retry"){
      result=await rpc("ac_seo_power_retry",{
        p_id:uuid(payload.id),p_actor:actor,p_request:requestKey,
        p_hash:(await import("./network")).hash({action:"retry-job",jobId:uuid(payload.id),actor,scope:"global"})
      });
    }else if(action==="job-cancel"){
      result=await (await import("./actions")).perform("cancel",{id:uuid(payload.id)},ctx,requestKey);
    }else{
      throw new SeoFault("UNKNOWN_R5_ACTION","Commande non reconnue.",400);
    }
    if(result===null||result===undefined)throw new SeoFault("RESULT_NOT_CONFIRMED","Résultat non confirmé.",503);
    return NextResponse.json({data:result,requestId:rid},{headers:{"Cache-Control":"no-store"}});
  }catch(error){return failure(error,rid)}
}

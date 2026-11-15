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
    const r4Database=record(data.r4).enabled===true;
    // R4 must be reported independently of the R5 flag. The previous code
    // hid an enabled R4 worker whenever R5's environment flag was absent.
    const r4Deployment=process.env.SEO_POWER_ENGINE_R4_ENABLED==="1";
    const r5Deployment=commandEnabled();
    const r5Database=record(data.control).enabled===true;
    const activation={
      r4Deployment,r4Database,r5Deployment,r5Database,
      r4Effective:r4Deployment&&r4Database,
      r5Effective:r4Deployment&&r4Database&&r5Deployment&&r5Database,
    };
    return NextResponse.json({data:{...data,ready:true,engineFlag:r5Deployment,
      r4Effective:activation.r4Effective,activation},requestId:rid},
      {headers:{"Cache-Control":"no-store"}});
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
    // Privileged production handover: one explicit operation, four independent proofs.
    // Never pretend to enable runtime flags: those must be deployed into Coolify first.
    if(action==="activate-full"){
      if(!access(ctx).publish)throw new SeoFault("PUBLISH_REQUIRED","Activation réservée à l'autorité de publication SEO.",403);
      if(process.env.SEO_POWER_ENGINE_R4_ENABLED!=="1"||!commandEnabled())
        throw new SeoFault("SEO_RUNTIME_FLAGS_MISSING",
          "Configurer SEO_POWER_ENGINE_R4_ENABLED=1 et SEO_POWER_COMMAND360_R5_ENABLED=1 dans le service Coolify puis redémarrer l'image existante.",409);
      const client=await db();
      const r4Read=await client.from("ac_seo_power_r4_control")
        .select("enabled,updated_at").eq("singleton",true).single();
      if(r4Read.error||!r4Read.data)
        throw new SeoFault("R4_CONTROL_UNAVAILABLE","Autorité R4 indisponible.",503);
      const r5Read=await client.from("ac_seo_power_r5_control")
        .select("enabled,revision").eq("singleton",true).single();
      if(r5Read.error||!r5Read.data)
        throw new SeoFault("R5_CONTROL_UNAVAILABLE","Autorité R5 indisponible.",503);
      if(r4Read.data.enabled!==true){
        const expected=nonBlank(payload.expectedR4UpdatedAt,10,100);
        if(!Number.isFinite(Date.parse(expected))||
          Date.parse(expected)!==Date.parse(r4Read.data.updated_at))
          throw new SeoFault("R4_CONTROL_CHANGED","La configuration R4 a changé. Actualiser avant activation.",409);
        // No transition while a legacy job still has the running state.
        // This does NOT replace pausing the old scheduler at infrastructure level.
        const leased=await client.from("ac_seo_power_jobs")
          .select("id",{count:"exact",head:true}).eq("state","running");
        if(leased.error)throw new SeoFault("R4_LEASE_CHECK_FAILED","Impossible de contrôler les jobs en cours.",503);
        if((leased.count??0)>0)
          throw new SeoFault("R4_LEASES_PRESENT",
            String(leased.count)+" jobs encore en cours. Laissez finir les baux et suspendez le lancement legacy avant le basculement.",409);
        const switched=await client.from("ac_seo_power_r4_control")
          .update({enabled:true,updated_at:new Date().toISOString()})
          .eq("singleton",true).eq("enabled",false).eq("updated_at",r4Read.data.updated_at)
          .select("enabled").maybeSingle();
        if(switched.error||switched.data?.enabled!==true)
          throw new SeoFault("R4_SWITCH_CONFLICT","Activation R4 non confirmée. Actualiser et recontrôler.",409);
        const logged=await client.from("ac_seo_power_r5_events")
          .insert({category:"governance",event:"r4_activated",detail:{
            actor,requestKey,source:"command360_handover",verifiedRunningJobs:0}});
        if(logged.error)console.error("[seo-power] R4 activation audit insert failed",logged.error.code);
      }
      let activated:unknown={enabled:true,revision:r5Read.data.revision};
      if(r5Read.data.enabled!==true){
        const expectedRevision=integer(payload.expectedRevision,1,100000000);
        if(expectedRevision!==r5Read.data.revision)
          throw new SeoFault("R5_CONTROL_CHANGED","La révision R5 a changé. Actualiser avant activation.",409);
        // R4 source and database are now both enabled. Existing R5 RPC is atomic and audited.
        activated=await rpc("ac_seo_power_r5_activate",{
          p_enabled:true,p_expected:expectedRevision,p_actor:actor
        });
      }
      const proof=await client.rpc("ac_seo_power_r5_dashboard",{p_project:null});
      if(proof.error)throw new SeoFault("ACTIVATION_READBACK_FAILED","État activé mais relecture non confirmée.",503);
      const current=record(proof.data);
      if(record(current.r4).enabled!==true||record(current.control).enabled!==true)
        throw new SeoFault("ACTIVATION_INCOMPLETE","Activation partielle : vérifier les autorités en base.",503);
      return NextResponse.json({data:{
        enabled:true,r4Database:true,r5Database:true,
        r4Server:true,r5Server:true,r5Control:activated,
        observedAt:new Date().toISOString(),queue:record(current.performance).queued
      },requestId:rid},{headers:{"Cache-Control":"no-store"}});
    }
    if(!commandEnabled())throw new SeoFault("R5_ENV_DISABLED","Activer l'option de déploiement R5 avant d'autoriser des mutations.",409);
    if(action==="activate"){
      if(!access(ctx).publish)throw new SeoFault("PUBLISH_REQUIRED","Activation réservée à un administrateur habilité.",403);
      const scale=await resolveScaleR4();
      if(payload.enabled===true&&!scale)throw new SeoFault("R4_INACTIVE","R4 doit être actif avant Command 360.",409);
      const expected=integer(payload.revision,1,100000000);
      const confirmed=await rpc("ac_seo_power_r5_activate",{p_enabled:payload.enabled===true,p_expected:expected,p_actor:actor});
      return NextResponse.json({data:confirmed,requestId:rid});
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
      result=await rpc("ac_seo_power_r5_capacity_save",{
        p_capacity:next,p_expected:nonBlank(payload.expectedUpdatedAt,10,100),p_actor:actor
      });
    }else if(action==="job-retry"){
      result=await rpc("ac_seo_power_r5_retry_job",{
        p_id:uuid(payload.id),p_actor:actor,p_request:requestKey
      });
    }else if(action==="recover-group"){
      result=await rpc("ac_seo_power_r5_recover_group",{
        p_project:payload.projectId?uuid(payload.projectId):null,
        p_code:nonBlank(payload.code,2,150),
        p_limit:integer(payload.limit,1,100),
        p_actor:actor,p_request:requestKey
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

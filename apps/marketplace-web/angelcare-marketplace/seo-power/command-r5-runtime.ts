import "server-only";
import { db } from "./repository";

/** Explicit deployment authorization and database switch; no assumed activation. */
export async function r5Enabled():Promise<boolean>{
 if(process.env.SEO_POWER_COMMAND360_R5_ENABLED!=="1")return false;
 const client=await db();
 const result=await client.from("ac_seo_power_r5_control").select("enabled").eq("singleton",true).maybeSingle();
 return !result.error&&result.data?.enabled===true;
}
/** Stable per-container identity; a record denotes a worker process, not a synthetic job. */
export function r5WorkerId():string{
 const hostname=(process.env.HOSTNAME||"seo-power").replace(/[^a-zA-Z0-9_-]/g,"-").slice(0,75);
 return hostname+"-"+String(process.pid);
}

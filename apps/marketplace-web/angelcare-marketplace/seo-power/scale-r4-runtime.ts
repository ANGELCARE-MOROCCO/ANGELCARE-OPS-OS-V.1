import "server-only";
import { rpc } from "./repository";
import { parseScaleR4, type ScaleR4 } from "./scale-r4";

/** Deployment opt-in AND database opt-in must both be true; SQL installation alone is inert. */
export async function resolveScaleR4():Promise<ScaleR4|null>{
  if(process.env.SEO_POWER_ENGINE_R4_ENABLED!=="1")return null;
  const response=await rpc("ac_seo_power_r4_status",{});
  const config=parseScaleR4(response);
  if(!config.enabled)return null;
  return config;
}

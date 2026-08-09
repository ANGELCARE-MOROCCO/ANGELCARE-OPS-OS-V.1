import { adapterConfigs } from './adapter-catalog'
import type { AdapterCode } from './types'
import type { RevenueExecutionAdapter } from './adapter-contract'
import { InternalModuleAdapter } from './adapters/internal-module-adapter'
import { GmailAdapter } from './adapters/gmail-adapter'
import { WhatsAppAdapter } from './adapters/whatsapp-adapter'
import { CalendarAdapter } from './adapters/calendar-adapter'
const cache=new Map<AdapterCode,RevenueExecutionAdapter>()
export function adapterRegistry(){if(!cache.size){for(const config of adapterConfigs()){let adapter:RevenueExecutionAdapter;if(config.code==='gmail')adapter=new GmailAdapter(config);else if(config.code==='whatsapp')adapter=new WhatsAppAdapter(config);else if(config.code==='calendar')adapter=new CalendarAdapter(config);else adapter=new InternalModuleAdapter(config,String(config.metadata.endpoint||config.endpointEnv||'/api/revenue-os/internal'));cache.set(config.code,adapter)}}return{resolve(code:AdapterCode){const adapter=cache.get(code);if(!adapter)throw new Error(`ADAPTER_NOT_FOUND:${code}`);return adapter},list(){return[...cache.values()]},async health(){return await Promise.all([...cache.values()].map(x=>x.health()))}}}

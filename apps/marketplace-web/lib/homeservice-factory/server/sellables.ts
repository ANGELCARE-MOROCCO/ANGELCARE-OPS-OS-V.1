import 'server-only'
import { factoryDb } from './catalogue'
const TENANT='angelcare-main'
export async function loadFactorySellable(id:string){const db=factoryDb();if(!db)return null;const{data,error}=await db.from('hsd_factory_sellables').select('*').eq('tenant_id',TENANT).eq('id',id).single();if(error)return null;return data}

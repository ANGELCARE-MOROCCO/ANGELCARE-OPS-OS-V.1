import { requireJobkixSession } from '@/angelcare-marketplace/jobkix/server/identity';
import { rpc } from '@/angelcare-marketplace/jobkix/server/repository';
import { failure,PRIVATE_HEADERS } from '@/angelcare-marketplace/jobkix/server/http';
import { PRIVATE_EXPORT_FILENAME,privateExportData } from '@/angelcare-marketplace/jobkix/private-export';
export const dynamic='force-dynamic';
export async function GET(){try{const session=await requireJobkixSession(),result=privateExportData(await rpc('jobkix_self_export',{}),session.userId);return new Response(JSON.stringify(result,null,2),{headers:{...PRIVATE_HEADERS,'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="${PRIVATE_EXPORT_FILENAME}"`,'X-Jobkix-Subject':session.userId}});}catch(error){return failure(error);}}

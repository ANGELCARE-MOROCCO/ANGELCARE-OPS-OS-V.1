import { studioSelection,panelSelection } from '@/angelcare-marketplace/jobkix/server/repository';
import { failure,PRIVATE_HEADERS } from '@/angelcare-marketplace/jobkix/server/http';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const params=new URL(request.url).searchParams;return Response.json({ok:true,result:await (params.get('kind')==='panels'?panelSelection(params):studioSelection(params))},{headers:PRIVATE_HEADERS});}catch(error){return failure(error);}}

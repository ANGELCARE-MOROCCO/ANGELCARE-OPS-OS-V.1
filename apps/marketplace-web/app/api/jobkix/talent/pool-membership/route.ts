import { poolMembership } from '@/angelcare-marketplace/jobkix/server/repository';
import { failure,PRIVATE_HEADERS } from '@/angelcare-marketplace/jobkix/server/http';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{return Response.json({ok:true,result:await poolMembership(new URL(request.url).searchParams)},{headers:PRIVATE_HEADERS});}catch(error){return failure(error);}}

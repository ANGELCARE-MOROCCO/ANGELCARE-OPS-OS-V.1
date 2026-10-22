import { failure,PRIVATE_HEADERS } from '@/angelcare-marketplace/jobkix/server/http';
import { readFilters } from '@/angelcare-marketplace/jobkix/discovery';
import { searchVacancies } from '@/angelcare-marketplace/jobkix/server/repository';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{return Response.json({ok:true,result:await searchVacancies(readFilters(new URL(request.url).searchParams))},{headers:PRIVATE_HEADERS});}catch(error){return failure(error);}}

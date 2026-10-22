import { publicTaxonomy } from '@/angelcare-marketplace/jobkix/server/repository';
import { taxonomyQuery } from '@/angelcare-marketplace/jobkix/taxonomy-query';
import { failure,PRIVATE_HEADERS } from '@/angelcare-marketplace/jobkix/server/http';
export async function GET(request:Request){try{const query=taxonomyQuery(new URL(request.url).searchParams);return Response.json({ok:true,result:await publicTaxonomy(query.kind,query.locale,query.q,'',query.page)},{headers:PRIVATE_HEADERS});}catch(error){return failure(error);}}

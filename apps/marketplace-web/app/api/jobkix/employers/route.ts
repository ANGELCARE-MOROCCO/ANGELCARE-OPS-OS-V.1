import { publicEmployerPage } from '@/angelcare-marketplace/jobkix/server/repository';
import { JobkixFault } from '@/angelcare-marketplace/jobkix/contracts';
import { text,integer,countryCode } from '@/angelcare-marketplace/jobkix/validation';
import { failure,PRIVATE_HEADERS } from '@/angelcare-marketplace/jobkix/server/http';
export async function GET(request:Request){try{const params=new URL(request.url).searchParams;for(const key of params.keys())if(!['q','country','page'].includes(key)||params.getAll(key).length!==1)throw new JobkixFault('INVALID_INPUT');const raw=params.get('page')||'1';if(!/^\d{1,5}$/.test(raw))throw new JobkixFault('INVALID_INPUT');const country=params.get('country')?countryCode(params.get('country')):null;return Response.json({ok:true,result:await publicEmployerPage(country,text(params.get('q')||'','q',0,300),integer(Number(raw),'page',1,10000))},{headers:PRIVATE_HEADERS});}catch(error){return failure(error);}}

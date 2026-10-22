import { studioRows } from '@/angelcare-marketplace/jobkix/server/repository';
import { failure,PRIVATE_HEADERS } from '@/angelcare-marketplace/jobkix/server/http';
import { uuid,text,choice,integer,timezone } from '@/angelcare-marketplace/jobkix/validation';
import { JobkixFault,type Interview } from '@/angelcare-marketplace/jobkix/contracts';
import { interviewCalendar } from '@/angelcare-marketplace/jobkix/domain';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{
 const id=uuid((await params).id),rows=await studioRows('interviews',{id}),row=rows[0];if(!row)throw new JobkixFault('NOT_FOUND');
 const instant=(value:unknown)=>{const raw=text(value,'instant',1,100);if(!Number.isFinite(Date.parse(raw)))throw new JobkixFault('DEPENDENCY_UNAVAILABLE');return new Date(raw).toISOString();};
 const interview:Interview={id,applicationId:uuid(row.application_id),organizationId:uuid(row.organization_id),candidateUserId:uuid(row.candidate_user_id),version:integer(row.version,'version',1,1000000),state:choice(row.state,['proposed','scheduled','completed','cancelled','declined'],'state'),startsAt:instant(row.starts_at),endsAt:instant(row.ends_at),timezone:timezone(row.timezone),format:choice(row.format,['video','phone','in_person'],'format'),location:text(row.location,'location',0,1500),panelUserIds:[],candidateResponse:choice(row.candidate_response,['pending','accepted','declined','reschedule_requested'],'candidateResponse')};
 return new Response(interviewCalendar(interview,'JOBKIX',instant(row.updated_at)),{headers:{...PRIVATE_HEADERS,'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':'attachment; filename="jobkix-interview.ics"'}});
 }catch(error){return failure(error);}}

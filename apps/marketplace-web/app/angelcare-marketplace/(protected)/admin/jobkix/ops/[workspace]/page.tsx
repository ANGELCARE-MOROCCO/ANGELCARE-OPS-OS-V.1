import {notFound} from 'next/navigation';
import {loadOps} from '../../../../../../../angelcare-marketplace/jobkix/admin/global-operations/server';
import {OperationsScreen} from '../../../../../../../angelcare-marketplace/jobkix/admin/global-operations/Screen';
export const dynamic='force-dynamic';
export default async function JobkixGlobalOperationsPage({params,searchParams}:{params:Promise<{workspace:string}>;searchParams:Promise<{tab?:string;page?:string}>}){
 const resolved=await params;const query=await searchParams;const pageValue=Number(query?.page??'1');const page=Number.isInteger(pageValue)&&pageValue>0&&pageValue<=10000?pageValue:1;
 if(!['executive','employment','people','trust','global','intelligence','platform'].includes(resolved.workspace))notFound();
 const data=await loadOps(resolved.workspace,page);
 return <OperationsScreen data={data} initialTab={query?.tab||''} page={page}/>;
}

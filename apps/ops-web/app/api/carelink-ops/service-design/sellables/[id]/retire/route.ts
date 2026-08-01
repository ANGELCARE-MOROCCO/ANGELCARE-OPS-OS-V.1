import{state}from'@/lib/homeservice-commercial/server/api-command'
export async function POST(r:Request,c:{params:Promise<{id:string}>}){const p=await c.params;return state(r,{table:'hsd_sellables',id:p.id,next:'retired',permission:'homeservice_design.retire_sellables',event:'homeservice.sellable.retired'})}

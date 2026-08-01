import{state}from'@/lib/homeservice-commercial/server/api-command'
export async function POST(r:Request,c:{params:Promise<{id:string}>}){const p=await c.params;return state(r,{table:'hsd_sellables',id:p.id,next:'published',permission:'homeservice_design.publish_sellables',event:'homeservice.sellable.published'})}

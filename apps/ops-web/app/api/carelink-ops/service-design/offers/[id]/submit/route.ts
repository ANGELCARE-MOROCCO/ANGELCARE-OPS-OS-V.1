import{state}from'@/lib/homeservice-commercial/server/api-command'
export async function POST(r:Request,c:{params:Promise<{id:string}>}){const p=await c.params;return state(r,{table:'hsd_offer_drafts',id:p.id,next:'approval_requested',permission:'homeservice_design.review_offers',event:'homeservice.commercial.offer_submitted'})}

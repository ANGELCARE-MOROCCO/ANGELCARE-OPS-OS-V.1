import{command}from'@/lib/homeservice-commercial/server/api-command'
export async function POST(r:Request,c:{params:Promise<{id:string}>}){const p=await c.params;return command('calculate_scenario',p.id,r)}

import{command}from'@/lib/homeservice-commercial/server/api-command'
export async function GET(r:Request,c:{params:Promise<{id:string}>}){const p=await c.params;return command('sellable_versions',p.id,r)}

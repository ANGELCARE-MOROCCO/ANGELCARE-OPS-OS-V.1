import {handleHotlineAdmin} from '@/angelcare-marketplace/hotline-os/server'
export const runtime='nodejs'
export const dynamic='force-dynamic'
async function handle(request:Request,context:{params:Promise<{path?:string[]}>}){return handleHotlineAdmin(request,(await context.params).path||[])}
export {handle as GET,handle as POST,handle as DELETE}

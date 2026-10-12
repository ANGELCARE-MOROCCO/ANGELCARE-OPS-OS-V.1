import {handleHotlineChatPublic} from '@/angelcare-marketplace/hotline-os/chat-server'
export const runtime='nodejs'
export const dynamic='force-dynamic'
async function handle(request:Request,context:{params:Promise<{path?:string[]}>}){return handleHotlineChatPublic(request,(await context.params).path||[])}
export {handle as GET,handle as POST}

import { handleHomepageAdmin } from '@/angelcare-marketplace/homepage-flagship/api-handlers'
const action=(request:Request,{params}:{params:Promise<{kind:string}>})=>params.then(({kind})=>handleHomepageAdmin(request,kind));export const GET=action;export const POST=action;export const PATCH=action;export const DELETE=action

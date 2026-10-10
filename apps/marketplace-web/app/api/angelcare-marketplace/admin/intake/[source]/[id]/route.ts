import {handleIntakeRecord} from '@/angelcare-marketplace/operational-intake/api-handlers'
export function GET(r:Request,c:{params:Promise<{source:string;id:string}>}){return handleIntakeRecord(r,c.params)}
export function PATCH(r:Request,c:{params:Promise<{source:string;id:string}>}){return handleIntakeRecord(r,c.params)}

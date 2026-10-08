import { handleSavedSegment } from '@/angelcare-marketplace/enterprise-command/sovereign-api-handlers'
type Context={params:Promise<{segmentId:string}>}
export async function PATCH(request:Request,context:Context){return handleSavedSegment(request,(await context.params).segmentId)}
export async function DELETE(request:Request,context:Context){return handleSavedSegment(request,(await context.params).segmentId)}

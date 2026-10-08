import {handleBooking} from '@/angelcare-marketplace/enterprise-closure/api-handlers'
export async function PATCH(request:Request,{params}:{params:Promise<{bookingId:string}>}){const{bookingId}=await params;return handleBooking(request,bookingId)}

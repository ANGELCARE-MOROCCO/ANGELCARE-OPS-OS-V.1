import {handleBasketCheckout} from '@/angelcare-marketplace/conversion-universe/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{basketId:string}>}){return handleBasketCheckout(request,(await params).basketId)}

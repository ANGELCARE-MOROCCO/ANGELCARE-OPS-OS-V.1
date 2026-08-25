import {handleBookings} from '@/angelcare-marketplace/enterprise-closure/api-handlers'
export async function GET(request:Request){return handleBookings(request)}
export async function POST(request:Request){return handleBookings(request)}

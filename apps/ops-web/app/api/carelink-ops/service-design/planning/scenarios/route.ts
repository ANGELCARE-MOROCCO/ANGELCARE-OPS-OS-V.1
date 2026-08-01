import { NextResponse } from 'next/server'
const response=(request:Request,method:string)=>NextResponse.json({ok:true,method,path:new URL(request.url).pathname,boundary:'HomeService Design OS UMZ2',carelinkWrite:false,providerRoute:'openrouter/free'})
export async function GET(request:Request){return response(request,'GET')}
export async function POST(request:Request){return response(request,'POST')}
export async function PATCH(request:Request){return response(request,'PATCH')}

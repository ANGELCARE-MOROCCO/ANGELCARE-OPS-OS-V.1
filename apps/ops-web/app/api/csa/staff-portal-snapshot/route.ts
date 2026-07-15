import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/getUser'
import { csaPortalData } from '@/lib/csa/csa-staff-portal-data'
export const dynamic='force-dynamic'
export async function GET(){ const user=await getCurrentUser(); if(!user) return NextResponse.json({ok:false,error:'Unauthorized'},{status:401}); return NextResponse.json({ok:true,loadedAt:new Date().toISOString(),snapshot:csaPortalData}) }

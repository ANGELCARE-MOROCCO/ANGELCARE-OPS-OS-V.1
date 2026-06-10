import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET(){ return NextResponse.json({ ok:true, data:[{ name:'CIN', status:'valid' },{ name:'Contrat', status:'valid' },{ name:'Certificat Academy', status:'valid' }] }) }

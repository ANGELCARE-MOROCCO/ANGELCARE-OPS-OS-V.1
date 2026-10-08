import { publicAngelcare360Error } from '@/lib/angelcare360/server/public-error'
import { NextResponse } from 'next/server'
import { executeProductConstitutionOperation, loadProductConstitutionSnapshot } from '@/lib/angelcare360/operator/product-constitution'
export async function GET(){try{return NextResponse.json({ok:true,snapshot:await loadProductConstitutionSnapshot()})}catch(error){return NextResponse.json({ok:false,error:publicAngelcare360Error(error)},{status:500})}}
export async function POST(request:Request){try{const body=await request.json();return NextResponse.json(await executeProductConstitutionOperation(String(body.operation||''),body.payload))}catch(error){return NextResponse.json({ok:false,error:publicAngelcare360Error(error)},{status:400})}}

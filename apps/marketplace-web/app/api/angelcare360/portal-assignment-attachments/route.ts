import { NextResponse } from 'next/server'
import { discardPendingStudentAssignmentAttachment, uploadStudentAssignmentAttachment } from '@/lib/angelcare360/portal/documents'

export const dynamic='force-dynamic'
export const runtime='nodejs'
export async function POST(request:Request){
  try{const form=await request.formData();const file=form.get('file');if(!(file instanceof File))return NextResponse.json({ok:false,error:'Fichier requis.'},{status:400});const result=await uploadStudentAssignmentAttachment({assignmentId:String(form.get('assignmentId')||''),file});return NextResponse.json(result,{status:201})}catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'Téléversement impossible.'},{status:400})}
}

export async function DELETE(request:Request){
  try{const url=new URL(request.url);const documentId=String(url.searchParams.get('documentId')||'').trim();if(!documentId)return NextResponse.json({ok:false,error:'Document requis.'},{status:400});const result=await discardPendingStudentAssignmentAttachment(documentId);return NextResponse.json(result)}catch(error){return NextResponse.json({ok:false,error:error instanceof Error?error.message:'Suppression impossible.'},{status:400})}
}

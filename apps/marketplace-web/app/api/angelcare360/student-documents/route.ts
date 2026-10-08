import { NextResponse } from 'next/server'
import { deleteAngelcare360StudentDocument, uploadAngelcare360StudentDocument } from '@/lib/angelcare360/server/student-document-vault'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return NextResponse.json({ ok: false, error: 'Fichier requis.' }, { status: 400 })
    const result = await uploadAngelcare360StudentDocument({
      studentId: String(form.get('studentId') || ''),
      title: String(form.get('title') || ''),
      category: String(form.get('category') || 'dossier-eleve'),
      visibility: String(form.get('visibility') || 'internal') as 'internal' | 'family' | 'student' | 'restricted',
      file,
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Téléversement impossible.' }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const result = await deleteAngelcare360StudentDocument(String(body?.documentId || ''))
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Suppression impossible.' }, { status: 400 })
  }
}

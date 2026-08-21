import { governRoute } from '@/lib/runtime/governor/route'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { loadCommercialDocument } from '@/lib/flashcards-os/revenue/server/repository'
import { generateRevenuePdf } from '@/lib/flashcards-os/revenue/server/pdf'
import type { CommercialDocumentType } from '@/lib/flashcards-os/revenue/types'
async function GET__angelcareGovernedImpl(_request:Request,{params}:{params:Promise<{documentType:string;documentId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.view_revenue');if(!access.ok)return new Response(access.message,{status:access.status});const {documentType,documentId}=await params;const type=documentType as CommercialDocumentType;const document=await loadCommercialDocument(type,documentId);if(!document)return new Response('Document not found.',{status:404});const result=await generateRevenuePdf(type,document);return new Response(result.bytes,{headers:{'content-type':'application/pdf','content-disposition':`inline; filename="${result.filename}"`,'cache-control':'private, no-store'}})}

export const GET = governRoute(
  {
    workloadClass: 'heavy',
    operation: 'GET:/api/flashcards-os/revenue/documents/[documentType]/[documentId]/pdf',
  },
  GET__angelcareGovernedImpl,
)

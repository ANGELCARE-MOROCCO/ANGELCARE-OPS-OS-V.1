import sharp from 'sharp'
import { createHash } from 'node:crypto'
import { PDFDocument } from 'pdf-lib'
import { createMarketplaceMediaDeliveryUrl, fetchMarketplaceGatewayAsset } from '../commerce-studio/media-storage'
import { MarketplaceError } from '../server/errors'
import { object, type Data } from './types'
export async function inspectMediaSource(id:string):Promise<Data>{
 const gateway=await fetchMarketplaceGatewayAsset(id);if(gateway.sizeBytes>32*1024*1024)throw new MarketplaceError('NOT_READY','This source exceeds the bounded 32 MiB metadata processor; use native large-file processing.');
 const details:Data={sourceId:id,checksum:gateway.sha256,mime:gateway.mimeType,bytes:gateway.sizeBytes,processingVersion:1,checkedAt:new Date().toISOString(),conversionPerformed:false};
 if(gateway.mimeType.startsWith('image/')||gateway.mimeType==='application/pdf'){
  const response=await fetch(createMarketplaceMediaDeliveryUrl(id,60000),{cache:'no-store',signal:AbortSignal.timeout(25000)});if(!response.ok)throw new MarketplaceError('NOT_READY','Native source delivery unavailable.');const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length!==gateway.sizeBytes||bytes.length>32*1024*1024)throw new MarketplaceError('DATA_INTEGRITY','Source size changed during metadata inspection.');
  if(createHash('sha256').update(bytes).digest('hex')!==gateway.sha256)throw new MarketplaceError('DATA_INTEGRITY','Source checksum changed during inspection.');
  if(gateway.mimeType==='application/pdf'){const pdf=await PDFDocument.load(bytes,{ignoreEncryption:false,updateMetadata:false});details.pages=pdf.getPageCount();details.textExtraction='not_produced';details.rendition='native_pdf_reader'}else{const image=await sharp(bytes,{limitInputPixels:32000000}).metadata();details.width=image.width||null;details.height=image.height||null;details.frames=image.pages||1;details.format=image.format||''}
 }else if(gateway.mimeType.startsWith('audio/')||gateway.mimeType.startsWith('video/')){const source=object(gateway);details.duration=source.durationSeconds||source.duration||null;details.transcoding='not_requested';details.seekable='native_media_delivery'}
 return details
}

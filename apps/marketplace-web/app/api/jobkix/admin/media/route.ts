import { readEditorialMedia, verifyEditorialMediaAsset } from '@/angelcare-marketplace/jobkix/server/admin-repository';
import { failure,PRIVATE_HEADERS } from '@/angelcare-marketplace/jobkix/server/http';
export async function GET(request:Request){try{return Response.json({ok:true,result:await (new URL(request.url).searchParams.get('validate') ? verifyEditorialMediaAsset(new URL(request.url).searchParams.get('validate')!) : readEditorialMedia(new URL(request.url).searchParams.get('q')||''))},{headers:PRIVATE_HEADERS});}catch(error){return failure(error);}}

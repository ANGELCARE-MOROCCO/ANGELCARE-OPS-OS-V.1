import { assertAdminLoginSameOrigin } from '@/angelcare-marketplace/auth/admin/admin-auth';
import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context';
import { authorize } from '@/angelcare-marketplace/digital-customer-experience/repository';
import {
  importPackage, adminPackageInfo, listStudioPackages,
  readStudioSource, deriveStudioPackage, exportStudioArchive, cloneStudioPackage,
} from '@/angelcare-marketplace/kidflix/interactive/service';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const headers={'Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff'};
function deny(code:string,status=400){return Response.json({error:code},{status,headers})}
async function actor(){
  const c=await requireMarketplaceApiContext('marketplace.digital_experience.view');
  authorize(c,'manage');return c;
}
function sameOrigin(req:Request){
  return !!req.headers.get('origin')&&assertAdminLoginSameOrigin(req)&&req.headers.get('sec-fetch-site')!=='cross-site';
}
export async function GET(req:Request){
  try{
    const c=await actor(),q=new URL(req.url).searchParams,operation=q.get('operation')||'info';
    if(operation==='list'){
      const family=q.get('family')||'',locale=q.get('locale')||'';
      return Response.json({data:await listStudioPackages(c,family,locale)},{headers});
    }
    const id=q.get('id');if(!id)return deny('PACKAGE_ID_REQUIRED');
    if(operation==='archive'){
      const archive=await exportStudioArchive(c,id);
      return new Response(new Uint8Array(archive),{headers:{...headers,
        'Content-Type':'application/zip',
        'Content-Disposition':'attachment; filename="kidflix-experience-'+id+'.zip"'}});
    }
    if(operation==='file'){
      const pathname=q.get('path')||'';
      return Response.json({data:await readStudioSource(c,id,pathname)},{headers});
    }
    if(operation!=='info')return deny('UNKNOWN_STUDIO_OPERATION');
    return Response.json({data:await adminPackageInfo(c,id)},{headers});
  }catch(e){return deny(String((e as Error).message||'PACKAGE_READ_FAILED'),403)}
}
export async function POST(req:Request){
  try{
    const c=await actor();
    if(!sameOrigin(req))return deny('CROSS_ORIGIN_IMPORT_DENIED',403);
    const length=Number(req.headers.get('content-length')||'0');
    if(!Number.isFinite(length)||length<0||length>66*1024*1024)return deny('PACKAGE_UPLOAD_TOO_LARGE',413);
    const form=await req.formData(),action=form.get('action')||'create';
    if(action==='clone'){
      const id=form.get('id');if(typeof id!=='string')return deny('SOURCE_PACKAGE_REQUIRED');
      return Response.json({data:await cloneStudioPackage(c,id)},{status:201,headers});
    }
    if(action==='derive'){
      const id=form.get('id'),path=form.get('path'),checksum=form.get('checksum'),replacement=form.get('replacement');
      if(typeof id!=='string'||typeof path!=='string'||typeof checksum!=='string'||!(replacement instanceof File))return deny('REPLACEMENT_FIELDS_REQUIRED');
      if(replacement.size>36*1024*1024)return deny('REPLACEMENT_TOO_LARGE',413);
      const data=await deriveStudioPackage(c,id,path,Buffer.from(await replacement.arrayBuffer()),checksum);
      return Response.json({data},{status:201,headers});
    }
    if(action!=='create')return deny('UNKNOWN_PACKAGE_ACTION');
    const input=form.get('package'),family=form.get('family'),locale=form.get('locale');
    if(!(input instanceof File)||typeof family!=='string'||typeof locale!=='string')return deny('PACKAGE_FIELDS_REQUIRED');
    if(input.size>64*1024*1024||input.size<22)return deny('PACKAGE_SIZE_OUT_OF_RANGE',413);
    const data=await importPackage(c,Buffer.from(await input.arrayBuffer()),family,locale);
    return Response.json({data},{status:201,headers});
  }catch(e){return deny(String((e as Error).message||'PACKAGE_IMPORT_FAILED'),400)}
}

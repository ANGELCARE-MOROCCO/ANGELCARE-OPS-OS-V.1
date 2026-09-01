import { createServiceClient, createUserClient } from '@/lib/supabase/server'

const PATCH_MARKER = 'ANGELCARE_MARKETPLACE_CUSTOMER_CONFIRM_V1'

const publicOrigin=(request:Request)=>{
  const configured=String(
    process.env.NEXT_PUBLIC_SITE_URL||
    process.env.NEXT_PUBLIC_APP_URL||
    ''
  ).trim()

  if(configured){
    try{
      const candidate=new URL(configured)

      if(candidate.protocol==='https:'||candidate.protocol==='http:'){
        return candidate.origin
      }
    }catch{}
  }

  return new URL(request.url).origin
}

const safeLocale=(value:unknown)=>{
  const locale=String(value||'fr').toLowerCase()

  return locale==='en'||locale==='ar' ? locale : 'fr'
}

const verifiedDestination=(
  request:Request,
  locale:string,
  state:'confirmed'|'invalid',
)=>{
  const target=new URL(
    `/angelcare-marketplace/${locale}/auth/verified`,
    publicOrigin(request),
  )

  target.searchParams.set('state',state)

  return target
}

export async function GET(request:Request){
  void PATCH_MARKER

  const url=new URL(request.url)

  const tokenHash=String(
    url.searchParams.get('token_hash')||''
  ).trim()

  const type=String(
    url.searchParams.get('type')||''
  ).trim()

  if(!tokenHash||type!=='email'){
    return Response.redirect(
      verifiedDestination(request,'fr','invalid'),
      303,
    )
  }

  const supabase=await createUserClient()

  const {data,error}=await supabase.auth.verifyOtp({
    token_hash:tokenHash,
    type:'email',
  })

  if(error||!data.user){
    return Response.redirect(
      verifiedDestination(request,'fr','invalid'),
      303,
    )
  }

  const locale=safeLocale(
    data.user.user_metadata?.locale
  )

  const verifiedAt=
    data.user.email_confirmed_at||
    new Date().toISOString()

  const db=await createServiceClient()

  const {error:syncError}=await db
    .from('angelcare_marketplace_customer_accounts')
    .update({
      status:'active',
      email_verified_at:verifiedAt,
      updated_at:new Date().toISOString(),
    })
    .eq('auth_user_id',data.user.id)

  const target=verifiedDestination(
    request,
    locale,
    'confirmed',
  )

  if(syncError){
    target.searchParams.set('sync','pending')
  }

  return Response.redirect(target,303)
}

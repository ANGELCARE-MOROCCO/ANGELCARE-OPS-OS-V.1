import { redirect } from 'next/navigation'
import { authenticatePortalCredentials } from '@/lib/angelcare360/portal/auth'
import type { Angelcare360PortalKind } from '@/types/angelcare360/role-portals'

export default async function Page({ searchParams }: { searchParams?: Promise<{ error?: string; next?: string; portal?: string; audience?: string }> }) {
  const p = searchParams ? await searchParams : {}
  const error = p.error

  async function login(fd: FormData) {
    'use server'
    const requestedRaw=String(fd.get('portal')||p.portal||p.audience||'').trim()
    const requestedKind=(['teacher','parent','student','staff'].includes(requestedRaw)?requestedRaw:null) as Angelcare360PortalKind|null
    const result=await authenticatePortalCredentials({username:String(fd.get('username')||''),password:String(fd.get('password')||''),requestedKind,next:String(fd.get('next')||'')})
    if(!result.ok){const qs=new URLSearchParams({error:result.error});if(fd.get('next'))qs.set('next',String(fd.get('next')));if(requestedKind)qs.set('portal',requestedKind);redirect(`/angelcare-360-portal/login?${qs.toString()}`)}
    redirect(result.redirectTo)
  }

  const msg = error === 'missing' ? 'Saisissez vos identifiants.' : error === 'invalid' ? 'Identifiants incorrects.' : error === 'inactive' ? 'Ce compte est suspendu ou inactif.' : error === 'role' ? 'Aucun profil portail actif n’est lié à ce compte pour cet espace.' : error === 'server' ? 'Connexion indisponible. Réessayez.' : null
  const requested=String(p.portal||p.audience||'')
  return <main style={{minHeight:'100vh',display:'grid',gridTemplateColumns:'minmax(0,1.1fr) minmax(420px,.9fr)',background:'#f4f7fa',fontFamily:'Inter,system-ui,sans-serif',color:'#16263a'}}><section style={{padding:'clamp(38px,7vw,96px)',display:'flex',flexDirection:'column',justifyContent:'space-between',background:'linear-gradient(145deg,#fff 0%,#f5f8fb 72%,#e9f0f6 100%)'}}><div><div style={{display:'inline-flex',border:'1px solid #dce6ef',borderRadius:999,padding:'7px 11px',fontSize:10,fontWeight:900,letterSpacing:'.12em',color:'#47617a'}}>SANILA · ROLE PORTALS</div><h1 style={{fontSize:'clamp(42px,6vw,76px)',letterSpacing:'-.055em',lineHeight:.95,margin:'28px 0 18px'}}>Votre espace.<br/>Votre rôle.<br/>Votre établissement.</h1><p style={{maxWidth:650,color:'#697b8f',fontSize:15,lineHeight:1.75}}>Une identité peut porter plusieurs responsabilités et plusieurs établissements. SANILA vous demandera de choisir le contexte exact lorsqu’il existe plusieurs possibilités légitimes.</p></div></section><section style={{display:'grid',placeItems:'center',padding:28}}><form action={login} style={{width:'100%',maxWidth:460,background:'#fff',border:'1px solid #dce5ed',borderRadius:24,padding:32,boxShadow:'0 28px 90px rgba(24,47,71,.12)'}}><div style={{fontSize:10,fontWeight:900,letterSpacing:'.12em',color:'#718096'}}>CONNEXION ÉTABLISSEMENT</div><h2 style={{fontSize:28,margin:'12px 0 7px'}}>Ouvrir mon espace</h2>{msg?<div style={{background:'#fff5f5',border:'1px solid #eccaca',color:'#9a3232',borderRadius:12,padding:11,fontSize:11,marginBottom:15}}>{msg}</div>:null}<input type="hidden" name="next" value={p.next||''}/><input type="hidden" name="portal" value={requested}/><label style={{display:'grid',gap:6,marginBottom:14}}><span style={{fontSize:10,fontWeight:850}}>E-mail / identifiant</span><input name="username" required autoComplete="username" style={{height:48,border:'1px solid #d5e0e8',borderRadius:12,padding:'0 13px',fontSize:13}}/></label><label style={{display:'grid',gap:6,marginBottom:18}}><span style={{fontSize:10,fontWeight:850}}>Mot de passe</span><input name="password" type="password" required autoComplete="current-password" style={{height:48,border:'1px solid #d5e0e8',borderRadius:12,padding:'0 13px',fontSize:13}}/></label><button style={{height:50,width:'100%',border:0,borderRadius:12,background:'#173f63',color:'#fff',fontWeight:900,cursor:'pointer'}}>Continuer</button></form></section></main>
}

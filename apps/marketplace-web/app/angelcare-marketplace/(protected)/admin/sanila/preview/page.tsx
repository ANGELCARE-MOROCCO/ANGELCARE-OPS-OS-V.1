import Link from 'next/link'
import {notFound} from 'next/navigation'
import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {getSanilaWorldState} from '@/angelcare-marketplace/sanila-world/repository'
import {SanilaPublishedPage} from '@/angelcare-marketplace/sanila-public/SanilaPublishedPage'
import {sanilaInitialPuckData} from '@/angelcare-marketplace/sanila-studio/initial-data'
import {SANILA_DEFAULT_THEMES,SANILA_DEFAULT_THEME_KEY} from '@/angelcare-marketplace/sanila-world/world-engine'
export const dynamic='force-dynamic'
export default async function SanilaWorldPreview({searchParams}:{searchParams:Promise<{route?:string}>}){
 await requireMarketplacePageContext('marketplace.public.inquiries.manage')
 const params=await searchParams
 const world=await getSanilaWorldState()
 const slug=params.route||'accueil'
 const page=world.pages[slug]
 if(!page||page.deletedAt)notFound()
 const theme=world.themes?.[page.themeKey||world.themeKey||SANILA_DEFAULT_THEME_KEY]||SANILA_DEFAULT_THEMES[SANILA_DEFAULT_THEME_KEY]
 return <div style={{minHeight:'100vh',background:'#f2f5f8'}}>
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,flexWrap:'wrap',padding:'14px 26px',background:'#102c48',color:'#fff'}}>
   <div><strong>SANILA · Prévisualisation privée</strong><small style={{display:'block',opacity:.72,marginTop:5}}>{page.slug} · brouillon non publié · révision {world.revision}</small></div>
   <Link href={'/angelcare-marketplace/admin/sanila/studio?route='+encodeURIComponent(slug)} style={{background:'#fff',color:'#102c48',padding:'9px 16px',borderRadius:9,fontWeight:800}}>Retour au Studio</Link>
  </div>
  <SanilaPublishedPage data={page.data||sanilaInitialPuckData(slug)} theme={theme} eyebrow={page.nav}/>
 </div>
}

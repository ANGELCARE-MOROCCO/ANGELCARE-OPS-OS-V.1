import { getSanilaPublicPage } from './content'
import { SanilaFooter, SanilaHeader } from './components/SanilaShell'
import { SANILA_PAGE_COMPONENTS } from './pageRegistry'
import { SanilaPublishedPage } from './SanilaPublishedPage'
import { getSanilaWorldState } from '../sanila-world/repository'
import { SANILA_DEFAULT_THEMES, SANILA_LOCKED_ROUTES } from '../sanila-world/world-engine'
import styles from './SanilaPublic.module.css'

export async function SanilaPublicUniverse({slug,locale}:{slug:string;locale:string}){
  if(locale!=='fr')return null
  const world=await getSanilaWorldState().catch(()=>null)
  const page=world?.pages[slug]
  const isLocked=SANILA_LOCKED_ROUTES.has(slug)
  const published=!isLocked&&!page?.deletedAt&&page?.publishedData
  const Source=SANILA_PAGE_COMPONENTS[slug]
  if(!published&&!Source)return null
  const themeKey=(page?.publishedThemeKey&&world?.publishedThemes?.[page.publishedThemeKey]&&!world.publishedThemes[page.publishedThemeKey].archivedAt)?page.publishedThemeKey:(world?.publishedThemeKey||'sanila-signature')
  const theme=world?.publishedThemes?.[themeKey]||SANILA_DEFAULT_THEMES['sanila-signature']
  const sourcePage=getSanilaPublicPage(slug)
  const shell=world?.publishedShell||{header:true,footer:true,navigation:true}
  return <div className={styles.site} data-accent={sourcePage?.accent||'navy'} data-page={slug}>
    <a className={styles.skipLink} href="#contenu-sanila">Aller au contenu</a>
    {shell.header?<SanilaHeader extraLinks={shell.navigation?world?.publishedNavigation||[]:[]}/>:null}
    <main id="contenu-sanila" className={styles.pageMain}>
      {published?<SanilaPublishedPage data={published} theme={theme} eyebrow={page?.nav}/>:Source?<Source/>:null}
    </main>
    {shell.footer?<SanilaFooter/>:null}
  </div>
}

import { getSanilaPublicPage } from './content'
import { SanilaFooter, SanilaHeader } from './components/SanilaShell'
import { PageHero } from './components/SanilaSections'
import { SANILA_PAGE_COMPONENTS } from './pageRegistry'
import styles from './SanilaPublic.module.css'

export function SanilaPublicUniverse({ slug, locale }: { slug: string; locale: string }) {
  if (locale !== 'fr') return null
  const page = getSanilaPublicPage(slug)
  const PageComposition = SANILA_PAGE_COMPONENTS[slug]
  if (!page || !PageComposition) return null

  return (
    <div className={styles.site} data-accent={page.accent} data-page={page.slug}>
      <a className={styles.skipLink} href="#contenu-sanila">Aller au contenu</a>
      <SanilaHeader />
      <main id="contenu-sanila">
        <PageHero page={page} />
        <PageComposition />
      </main>
      <SanilaFooter />
    </div>
  )
}

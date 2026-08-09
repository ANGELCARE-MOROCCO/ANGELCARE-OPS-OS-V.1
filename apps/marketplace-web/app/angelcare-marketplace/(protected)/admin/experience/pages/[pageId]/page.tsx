import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { PageHeader, ButtonLink, StatusChip } from '@/angelcare-marketplace/design-system/ui'
import { getPageDetail } from '@/angelcare-marketplace/experience-builder/repository'

export default async function Page({ params }: { params: Promise<{ pageId: string }> }) {
  await requireMarketplacePageContext('marketplace.cms.view')
  const { pageId } = await params
  const bundle = await getPageDetail(pageId)
  return <><PageHeader eyebrow="PAGE DOSSIER" title={bundle.page.title} description={`/${bundle.page.locale}/${bundle.page.slug} · version ${bundle.page.current_version}`} actions={<ButtonLink href={`/angelcare-marketplace/admin/experience/pages/${pageId}/builder`}>Ouvrir le builder</ButtonLink>} /><section style={{background:'#fff',border:'1px solid #dbe4ef',borderRadius:22,padding:24}}><StatusChip status={bundle.page.status}/><p>{bundle.page.description || 'Aucune description.'}</p><p>{bundle.blocks.length} blocs structurés · {bundle.versions.length} versions conservées.</p></section></>
}

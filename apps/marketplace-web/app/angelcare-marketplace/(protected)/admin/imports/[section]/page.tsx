import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { categoryNativeStudioData } from '@/angelcare-marketplace/category-native/repository'
import { CsvImportStudio } from '@/angelcare-marketplace/category-native/components/CsvImportStudio'
import { commerceStudioData } from '@/angelcare-marketplace/commerce-studio/repository'
import { ImportExportStudio } from '@/angelcare-marketplace/commerce-studio/components/ImportExportStudio'
import { MediaLibraryStudio } from '@/angelcare-marketplace/commerce-studio/components/MediaLibraryStudio'
import { ProductImportStudio } from '@/angelcare-marketplace/enterprise-command/components/ProductImportStudio'
import { CsvCenter } from '@/angelcare-marketplace/localization-intelligence/components/CsvCenter'
import { WalletPolicyImportStudio } from '@/angelcare-marketplace/customer-commerce/components/WalletPolicyImportStudio'
import { ImportCommandOverview, ImportCommandWorkspace, type ImportCommandSection } from '@/angelcare-marketplace/import-command/ImportCommandWorkspace'

export const dynamic='force-dynamic'
const SECTIONS = new Set<ImportCommandSection>(['overview','product','category-native','media','localization','wallet','expert-commerce'])

export default async function Page({params}:{params:Promise<{section:string}>}){
  const {section:raw}=await params
  if(!SECTIONS.has(raw as ImportCommandSection))notFound()
  const section=raw as ImportCommandSection
  let content:ReactNode

  if(section==='overview'){
    await requireMarketplacePageContext('marketplace.admin.access')
    content=<ImportCommandOverview/>
  }else if(section==='product'){
    await requireMarketplacePageContext('marketplace.admin.access')
    content=<ProductImportStudio/>
  }else if(section==='category-native'){
    const context=await requireMarketplacePageContext('marketplace.category_native_import.view')
    const data=await categoryNativeStudioData()
    content=<CsvImportStudio schemas={data.schemas} initialImports={data.imports} canManage={hasMarketplacePermission(context,'marketplace.category_native_import.manage')}/>
  }else if(section==='media'){
    const context=await requireMarketplacePageContext('marketplace.media.view')
    const data=await commerceStudioData(context)
    content=<MediaLibraryStudio initialMedia={data.media} initialFolders={data.mediaFolders} catalogItems={data.catalogItems} mode="ingestion" canManage={hasMarketplacePermission(context,'marketplace.media.manage')}/>
  }else if(section==='localization'){
    await requireMarketplacePageContext('marketplace.localization.access')
    content=<CsvCenter/>
  }else if(section==='wallet'){
    await requireMarketplacePageContext('marketplace.finance.price_books.manage')
    content=<WalletPolicyImportStudio/>
  }else{
    await requireMarketplacePageContext('marketplace.commerce.import')
    content=<ImportExportStudio/>
  }

  return <ImportCommandWorkspace section={section}>{content}</ImportCommandWorkspace>
}

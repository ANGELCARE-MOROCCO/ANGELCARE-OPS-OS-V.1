import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listPriceBooks,listPriceRules } from '@/angelcare-marketplace/finance-authority/repository'
import { PriceBookAuthority } from '@/angelcare-marketplace/finance-authority/components/PriceBookAuthority'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.finance.view');const [books,rules]=await Promise.all([listPriceBooks(context),listPriceRules(context)]);return <PriceBookAuthority books={books} rules={rules} canManage={hasMarketplacePermission(context,'marketplace.finance.price_books.approve')}/>}

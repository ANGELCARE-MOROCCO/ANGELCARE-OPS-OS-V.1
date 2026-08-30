import{hasMarketplacePermission,requireMarketplacePageContext}from '@/angelcare-marketplace/auth/context'
import{listInvoices,listReceipts}from '@/angelcare-marketplace/enterprise-closure/repository'
import{adminPaymentSummary}from '@/angelcare-marketplace/admin-control-plane/repository'
import{ReceiptCommand}from '@/angelcare-marketplace/enterprise-closure/components/ReceiptCommand'
export const dynamic='force-dynamic'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.finance.view');const[initial,invoices,summary]=await Promise.all([listReceipts(),listInvoices(),adminPaymentSummary()]);const payments=summary.payments.map(p=>({id:p.id,public_reference:p.public_reference,customer_account_id:p.customer_account_id,captured_amount:p.captured_amount,currency_label:p.currency_label,selected_method:p.selected_method,provider_reference:p.provider_reference,status:p.status}));return <ReceiptCommand initial={initial} invoices={invoices} payments={payments} canIssue={hasMarketplacePermission(context,'marketplace.finance.manage')}/>}

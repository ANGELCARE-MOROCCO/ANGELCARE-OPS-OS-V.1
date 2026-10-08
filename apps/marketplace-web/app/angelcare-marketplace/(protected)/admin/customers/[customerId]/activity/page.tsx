import { CustomerDossierPage } from '@/angelcare-marketplace/customer-relationship-command/admin-pages'
export const dynamic = 'force-dynamic'
export default async function Page({ params }: { params: Promise<{ customerId: string }> }) { return CustomerDossierPage({ customerId: (await params).customerId, tab: 'Activité' }) }

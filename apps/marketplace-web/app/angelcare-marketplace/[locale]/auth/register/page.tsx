import { CustomerAccessPage, type CustomerAccessPageProps } from '@/angelcare-marketplace/customer-commerce/customer-access-page'
export const dynamic = 'force-dynamic'
export default async function Page(props: CustomerAccessPageProps) { return CustomerAccessPage({ ...props, mode: 'register' }) }

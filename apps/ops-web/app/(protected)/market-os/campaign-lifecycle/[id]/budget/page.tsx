import { BudgetPage } from "@/components/market-os/campaign-lifecycle/campaign-execution-v2"
export const dynamic = "force-dynamic"
export default function Page({ params }: { params: { id: string } }){ return <BudgetPage id={params.id} /> }

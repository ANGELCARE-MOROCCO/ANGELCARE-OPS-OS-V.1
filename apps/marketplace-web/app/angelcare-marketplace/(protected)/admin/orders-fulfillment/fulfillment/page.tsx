import { transactionFlightDeckSnapshot } from '@/angelcare-marketplace/transaction-flight-deck/repository'
import { FlightDeckWorkspace } from '@/angelcare-marketplace/transaction-flight-deck/components/FlightDeckWorkspace'
export const dynamic='force-dynamic'
export default async function Page(){const data=await transactionFlightDeckSnapshot();return <FlightDeckWorkspace initial={data} mode="fulfillment"/>}

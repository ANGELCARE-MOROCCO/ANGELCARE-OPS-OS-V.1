import {handleFinancialControlLedgerSnapshot} from '@/angelcare-marketplace/financial-control-ledger/api-handlers'
export async function GET(request:Request){return handleFinancialControlLedgerSnapshot(request)}

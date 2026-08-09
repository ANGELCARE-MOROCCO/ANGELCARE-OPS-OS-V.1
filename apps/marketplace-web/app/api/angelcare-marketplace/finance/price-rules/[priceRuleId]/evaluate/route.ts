import { handleFinancialRuleEvaluation } from '@/angelcare-marketplace/finance-authority/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{priceRuleId:string}>}){return handleFinancialRuleEvaluation(request,(await params).priceRuleId)}

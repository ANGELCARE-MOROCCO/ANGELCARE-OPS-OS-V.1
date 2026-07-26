import { fail, ok, cleanNumber, cleanString } from "@/lib/revenue-command-center/canonical-server"
import { revenueAccessFailure } from "@/lib/revenue-command-center/api-access"
import { b2cContext, loadB2CPortfolio } from "@/lib/revenue-command-center/b2c-enterprise/server"

export async function GET(request:Request){
  try{
    const {access,supabase}=await b2cContext("revenue.b2c.read")
    const caseId=new URL(request.url).searchParams.get("caseId")
    const portfolio=await loadB2CPortfolio(supabase,caseId)
    return ok({data:{...portfolio,currentUser:{id:(access.user as any).id||null,email:(access.user as any).email||null,role:access.role}}})
  }catch(error){const access=revenueAccessFailure(error);return access?fail(access.message,access.status):fail(error)}
}

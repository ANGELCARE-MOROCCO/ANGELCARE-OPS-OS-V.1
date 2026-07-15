import {
  factoryJsonError,
  factoryJsonOk,
  getLiveFactoryOptions,
  parseFactoryBody,
  saveLiveFactoryOption,
} from "@/lib/saas-factory/phase4-live-options";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const group = url.searchParams.get("group") || "cities";
  const moduleKey = url.searchParams.get("module") || undefined;

  try {
    const data = await getLiveFactoryOptions(group, moduleKey);
    return factoryJsonOk(data);
  } catch (error) {
    return factoryJsonError(error instanceof Error ? error.message : String(error));
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseFactoryBody(request);
    const result = await saveLiveFactoryOption(body as any);
    return factoryJsonOk({
      saved: true,
      option: result.row,
      result: result.result,
    });
  } catch (error) {
    return factoryJsonError(error instanceof Error ? error.message : String(error));
  }
}

import {
  factoryJsonError,
  factoryJsonOk,
  parseFactoryBody,
  saveLiveFactoryOption,
} from "@/lib/saas-factory/phase4-live-options";

export const dynamic = "force-dynamic";

type BulkOption = {
  group_key?: string;
  group?: string;
  label?: string;
  value?: string;
  modules?: string[];
  availability_scope?: string[];
  metadata_json?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const body = await parseFactoryBody<{ options?: BulkOption[]; group_key?: string }>(request);
  const options = Array.isArray(body.options) ? body.options : [];

  if (options.length === 0) {
    return factoryJsonOk({
      saved: 0,
      message: "No options supplied.",
    });
  }

  try {
    const results = [];
    for (const option of options) {
      results.push(
        await saveLiveFactoryOption({
          group_key: option.group_key ?? option.group ?? body.group_key ?? "general",
          ...option,
        })
      );
    }

    return factoryJsonOk({
      saved: results.length,
      results,
    });
  } catch (error) {
    return factoryJsonError(error instanceof Error ? error.message : String(error));
  }
}

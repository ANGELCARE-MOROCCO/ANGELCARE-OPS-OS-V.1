import {
  FACTORY_MODULE_KEYS,
  factoryJsonError,
  factoryJsonOk,
  saveLiveFactoryOption,
} from "@/lib/saas-factory/phase4-live-options";

export const dynamic = "force-dynamic";

const modules = [
  FACTORY_MODULE_KEYS.revenue,
  FACTORY_MODULE_KEYS.market,
  FACTORY_MODULE_KEYS.academy,
  FACTORY_MODULE_KEYS.hr,
  FACTORY_MODULE_KEYS.service,
  FACTORY_MODULE_KEYS.contracts,
  FACTORY_MODULE_KEYS.missions,
];

const seed = [
  { group_key: "cities", label: "Casablanca", metadata_json: { country: "Morocco", region: "Grand Casablanca" } },
  { group_key: "cities", label: "Rabat", metadata_json: { country: "Morocco", region: "Rabat-Salé-Kénitra" } },
  { group_key: "cities", label: "Marrakech", metadata_json: { country: "Morocco", region: "Marrakech-Safi" } },
  { group_key: "departments", label: "Operations" },
  { group_key: "departments", label: "Human Resources" },
  { group_key: "departments", label: "Academy" },
  { group_key: "departments", label: "Revenue" },
  { group_key: "service_categories", label: "Childcare" },
  { group_key: "service_categories", label: "Academy Training" },
  { group_key: "lead_sources", label: "B2B Partnership" },
  { group_key: "lead_sources", label: "Market Activation" },
  { group_key: "task_priorities", label: "Urgent" },
  { group_key: "task_priorities", label: "High" },
  { group_key: "task_priorities", label: "Normal" },
];

export async function POST() {
  try {
    const results = [];
    for (const item of seed) {
      results.push(
        await saveLiveFactoryOption({
          ...item,
          availability_scope: modules,
          is_enabled: true,
        })
      );
    }

    return factoryJsonOk({
      bootstrapped: true,
      saved: results.length,
      groups: Array.from(new Set(seed.map((item) => item.group_key))),
      modules,
    });
  } catch (error) {
    return factoryJsonError(error instanceof Error ? error.message : String(error));
  }
}

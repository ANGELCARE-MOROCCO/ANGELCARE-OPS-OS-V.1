const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "lib/service-os/engine.ts");
if (!fs.existsSync(file)) throw new Error("Missing lib/service-os/engine.ts");

let src = fs.readFileSync(file, "utf8");

const start = src.indexOf("export function recommendServiceForNeed(");
if (start === -1) throw new Error("recommendServiceForNeed not found in lib/service-os/engine.ts");

const endMarker = "\n\nexport function getServiceOSSnapshot";
const end = src.indexOf(endMarker, start);
if (end === -1) throw new Error("Could not locate end of recommendServiceForNeed block");

const replacement = `export function recommendServiceForNeed(input: string | {
  city?: string
  specialNeeds?: boolean
  urgency?: string
  segment?: string
  query?: string
} = {}) {
  const normalizedInput =
    typeof input === "string"
      ? { query: input, specialNeeds: /special|spécial|besoin|handicap|autism|autisme/i.test(input) }
      : input

  const blueprints = getServiceBlueprints()
  const city = normalizeCode(normalizedInput.city)
  const segment = normalizeCode(normalizedInput.segment ?? normalizedInput.query)

  return blueprints
    .map((blueprint) => {
      let score = 62

      if (city && blueprint.cities?.map(normalizeCode).includes(city)) score += 14
      if (normalizedInput.specialNeeds && blueprint.modules?.includes("special_needs")) score += 16
      if (normalizedInput.urgency && blueprint.modules?.includes("emergency_protocol")) score += 10
      if (segment && normalizeCode(blueprint.marketSegment).includes(segment)) score += 8
      if (segment && normalizeCode(blueprint.name).includes(segment)) score += 6
      if (segment && normalizeCode(blueprint.description).includes(segment)) score += 4

      return {
        score: Math.min(score, 99),
        blueprint,
        price: calculateServicePrice({
          blueprintCode: blueprint.serviceCode ?? blueprint.code ?? blueprint.id,
          city: normalizedInput.city,
          urgent: normalizedInput.urgency === "urgent" || normalizedInput.urgency === "same_day",
          specialNeeds: normalizedInput.specialNeeds,
        }),
      }
    })
    .sort((a, b) => b.score - a.score)
}`;

src = src.slice(0, start) + replacement + src.slice(end);

fs.writeFileSync(file, src, "utf8");
console.log("patched lib/service-os/engine.ts: recommendServiceForNeed now accepts string or object input");

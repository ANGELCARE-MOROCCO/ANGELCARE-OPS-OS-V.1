import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const key = process.env.GEMINI_API_KEY;
const models = [
  process.env.GEMINI_PRIMARY_MODEL,
  process.env.GEMINI_FALLBACK_MODEL,
].filter((value, index, values) => value && values.indexOf(value) === index);

if (!key || key.includes("YOUR_")) {
  console.error("GEMINI_API_KEY is missing or still contains a placeholder.");
  process.exit(2);
}
if (models.length === 0) {
  console.error("GEMINI_PRIMARY_MODEL or GEMINI_FALLBACK_MODEL is required.");
  process.exit(2);
}

const ai = new GoogleGenAI({ apiKey: key });
let lastError;

for (const model of models) {
  try {
    console.log(`Testing Gemini model: ${model}`);
    const response = await ai.models.generateContent({
      model,
      contents: "Return exactly this identifier and nothing else: MZ10_1_GEMINI_OK",
      config: {
        maxOutputTokens: 256,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const text = response.text?.trim() ?? "";
    if (!text.includes("MZ10_1_GEMINI_OK")) {
      const finishReason = response.candidates?.[0]?.finishReason ?? "unknown";
      throw new Error(`Unexpected or incomplete output: ${JSON.stringify(text)}; finishReason=${finishReason}`);
    }

    console.log(JSON.stringify({
      provider: "gemini",
      model,
      connection: "passed",
      response: text,
      inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      thinkingTokens: response.usageMetadata?.thoughtsTokenCount ?? 0,
      externalActions: 0,
    }, null, 2));
    process.exit(0);
  } catch (error) {
    lastError = error;
    console.error(`${model} failed:`, error?.status ?? error?.message ?? error);
  }
}

console.error("No configured Gemini model passed the MZ10.1 live smoke test.");
if (lastError?.stack) console.error(lastError.stack);
process.exit(1);

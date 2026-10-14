import OpenAI from "openai";
const client = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export function containsSensitivePromptData(prompt: string) {
  return /(?:0x[a-fA-F0-9]{40}|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\+?\d[\d\s().-]{8,}\d)/.test(prompt);
}
export async function moderatePrompt(prompt: string) {
  if (!process.env.OPENAI_API_KEY) throw new Error("MODERATION_UNAVAILABLE");
  const result = await client().moderations.create({ model: "omni-moderation-latest", input: prompt });
  const containsPersonalData = containsSensitivePromptData(prompt);
  return { approved: !result.results[0]?.flagged && !containsPersonalData, categories: result.results[0]?.categories, containsPersonalData };
}
export async function moderateImage(bytes: Buffer, mimeType: string) {
  if (!process.env.OPENAI_API_KEY) throw new Error("MODERATION_UNAVAILABLE");
  const input = [{ type: "image_url" as const, image_url: { url: `data:${mimeType};base64,${bytes.toString("base64")}` } }];
  const result = await client().moderations.create({ model: "omni-moderation-latest", input });
  return { approved: !result.results[0]?.flagged, categories: result.results[0]?.categories };
}

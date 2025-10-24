import OpenAI from "openai";
import { OPENAI_API_KEY, OPENAI_EMBEDDING_MODEL } from "../config/env";

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

// Batch size to avoid big payloads
const BATCH_SIZE = 100;

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];

  // Trim/clean text
  const cleaned = texts.map((t) => (t ?? "").toString().trim());

  // Batch chunks with BATCH_SIZE
  const batches: string[][] = [];
  for (let i = 0; i < cleaned.length; i += BATCH_SIZE) {
    batches.push(cleaned.slice(i, i + BATCH_SIZE));
  }

  // Create embeddings for each batch
  const all: number[][] = [];
  for (const batch of batches) {
    const res = await client.embeddings.create({
      model: OPENAI_EMBEDDING_MODEL,
      input: batch,
    });

    // Loop through each embedding and add to the "all" array
    for (const item of res.data) {
      all.push(item.embedding as unknown as number[]);
    }
  }

  return all;
}

/*

if (query.includes("recent") || query.includes("latest") || query.includes("today")) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  filter.must.push({
    key: "date",
    range: { gte: sevenDaysAgo.toISOString() },
  });
}

*/

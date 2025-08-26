import { qdrant } from "../lib/qdrant";
import { embedTexts } from "./embeddings.service";
import { QDRANT_COLLECTION_NAME, QDRANT_VECTOR_SIZE } from "../config/env";
import { v5 as uuidv5 } from "uuid";

export type Chunk = { url: string; content: string };

const UPSERT_BATCH_SIZE = 100;

export async function indexChunks(chunks: Chunk[]) {
  // Clean up the text
  const filtered = chunks.map((c) => ({ url: c.url.trim(), content: (c.content ?? "").trim() }));

  if (!filtered.length) {
    return { upserted: 0 };
  }

  const texts = filtered.map((c) => c.content);
  const embeddings = await embedTexts(texts);

  // Check if embedding dim doesnt match collection schema
  const dim = embeddings[0]?.length;
  if (dim !== QDRANT_VECTOR_SIZE) {
    throw new Error(`Embedding dimension ${dim} does not match vector size: ${QDRANT_VECTOR_SIZE}`);
  }

  const NAMESPACE = "673938f9-f9cf-448f-a03d-fa958684217a";

  // Build points
  const points = filtered.map((chunk, i) => ({
    id: uuidv5(`${chunk.url}::${i}`, NAMESPACE),
    vector: embeddings[i],
    payload: {
      url: chunk.url,
      content: chunk.content,
      chunkIndex: i,
    },
  }));

  // Upsert in batches
  let upserted = 0;
  for (let i = 0; i < points.length; i += UPSERT_BATCH_SIZE) {
    const batch = points.slice(i, i + UPSERT_BATCH_SIZE);
    await qdrant.upsert(QDRANT_COLLECTION_NAME, { wait: true, points: batch });
    upserted += batch.length;
  }

  return { upserted };
}

// Update chunks for a specific URL
export async function reindexUrl(url: string, chunks: Chunk[]) {
  // Deletes existing points for this url
  await qdrant.delete(QDRANT_COLLECTION_NAME, {
    wait: true,
    filter: { must: [{ key: "url", match: { value: url } }] },
  });

  // Reinsert with new chunks
  const scoped = chunks.filter((c) => c.url === url);
  return indexChunks(scoped);
}

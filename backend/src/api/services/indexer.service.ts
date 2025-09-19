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

// Delete all vectors in Qdrant that match a single URL
export async function deleteUrlFromIndex(
  url: string
): Promise<{ ok: boolean; error?: string; status?: string; operationId?: number | null }> {
  try {
    // Call Qdrant delete with a filter on the "url" payload
    const resp = await qdrant.delete(QDRANT_COLLECTION_NAME, {
      wait: true,
      filter: { must: [{ key: "url", match: { value: url } }] },
    });
    return {
      ok: true,
      status: resp.status,
      operationId: resp.operation_id ?? null,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message ?? "Delete Failed",
    };
  }
}

// Delete all vectors in Qdrant that match any of the given URLs
export async function deleteUrlsFromIndex(
  urls: string[]
): Promise<{ ok: boolean; error?: string; status?: string; operationId?: number | null }> {
  if (!urls.length) {
    return { ok: false, error: "No URLs provided" };
  }

  // Delete the given URLs from Qdrant DB
  try {
    const resp = await qdrant.delete(QDRANT_COLLECTION_NAME, {
      wait: true,
      filter: {
        should: urls.map((u) => ({ key: "url", match: { value: u } })),
        // @ts-expect-error Qdrant REST API uses "minimum_should"
        minimum_should: 1,
      },
    });

    // Return success with operation info
    return {
      ok: true,
      status: resp.status,
      operationId: resp.operation_id ?? null,
    };
  } catch (err: any) {
    // Return false if error
    return {
      ok: false,
      error: err?.message ?? "Bulk delete failed",
    };
  }
}

export async function deleteAllFromIndex() {
  try {
    const response = await qdrant.delete("umd_docs", {
      filter: {},
    });
    return { ok: true, response };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

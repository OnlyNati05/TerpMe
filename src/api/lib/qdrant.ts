import { QdrantClient } from "@qdrant/js-client-rest";
import { QDRANT_API_KEY } from "../config/env";
import { QDRANT_URL } from "../config/env";

// Start a Qdrant client
export const qdrant = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
});

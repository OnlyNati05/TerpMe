import { config } from "dotenv";
import { mustGetEnv } from "../utils/get.env";

config({ path: `.env.${process.env.NODE_ENV || "development"}.local` });

export const PORT = process.env.PORT;
export const NODE_ENV = process.env.NODE_ENV;
export const QDRANT_URL = mustGetEnv("QDRANT_URL");
export const QDRANT_API_KEY = mustGetEnv("QDRANT_API_KEY");
export const QDRANT_COLLECTION_NAME = mustGetEnv("QDRANT_COLLECTION_NAME");
export const QDRANT_VECTOR_SIZE = Number(mustGetEnv("QDRANT_VECTOR_SIZE"));
export const OPENAI_API_KEY = mustGetEnv("OPENAI_API_KEY");
export const OPENAI_EMBEDDING_MODEL = mustGetEnv("OPENAI_EMBEDDING_MODEL");

export type Distance = "Cosine" | "Dot" | "Euclid";
export const QDRANT_DISTANCE = mustGetEnv("QDRANT_DISTANCE") as Distance;

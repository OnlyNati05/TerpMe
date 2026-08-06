import { qdrant } from "../src/api/lib/qdrant";
import { QDRANT_COLLECTION_NAME, QDRANT_VECTOR_SIZE, QDRANT_DISTANCE } from "../src/api/config/env";

async function main() {
  // Check if the collection already exists
  const { collections } = await qdrant.getCollections();
  const exists = (collections || []).some((c) => c.name === QDRANT_COLLECTION_NAME);

  // If collection doesnt exist create a new one
  if (!exists) {
    await qdrant.createCollection(QDRANT_COLLECTION_NAME, {
      vectors: { size: QDRANT_VECTOR_SIZE, distance: QDRANT_DISTANCE },
    });
  }

  // Qdrant requires a datetime payload index before date_iso can be used in a range filter.
  const details = await qdrant.getCollection(QDRANT_COLLECTION_NAME);
  const dateIndex = details.payload_schema?.date_iso;

  if (dateIndex?.data_type !== "datetime") {
    await qdrant.createPayloadIndex(QDRANT_COLLECTION_NAME, {
      wait: true,
      field_name: "date_iso",
      field_schema: "datetime",
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(0);
  });

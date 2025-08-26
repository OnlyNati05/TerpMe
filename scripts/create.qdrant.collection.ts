import { qdrant } from "../src/api/lib/qdrant";
import { QDRANT_COLLECTION_NAME, QDRANT_VECTOR_SIZE, QDRANT_DISTANCE } from "../src/api/config/env";

async function main() {
  // Check if the collection already exists
  const { collections } = await qdrant.getCollections();
  const exists = (collections || []).some((c) => c.name === QDRANT_COLLECTION_NAME);

  // If collection doesnt exist create a new one
  if (!exists) {
    console.log(`Creating new collection ${QDRANT_COLLECTION_NAME}...`);

    await qdrant.createCollection(QDRANT_COLLECTION_NAME, {
      vectors: { size: QDRANT_VECTOR_SIZE, distance: QDRANT_DISTANCE },
    });

    console.log(`Created collection ${QDRANT_COLLECTION_NAME}`);
  } else {
    console.log(`Collection ${QDRANT_COLLECTION_NAME} already exists, skipping creation`);
  }

  //Get collection and log for verification
  const details = await qdrant.getCollection(QDRANT_COLLECTION_NAME);
  console.log("Collections is ready: ", JSON.stringify(details, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(0);
  });

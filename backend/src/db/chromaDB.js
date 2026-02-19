import "dotenv/config";
import { ChromaClient } from "chromadb";

const COLLECTION_NAME = process.env.CHROMA_COLLECTION || "philosophy_docs";

//create client wrapper, host server
const client = new ChromaClient({
  host: process.env.CHROMA_HOST || "localhost",
  port: Number(process.env.CHROMA_PORT || 8000),
  ssl: process.env.CHROMA_SSL === "true",
});

let collectionPromise;

//QUERYING BASED ON name given in env (philosophy docs)
export async function getCollection() {
  if (!collectionPromise) {
    collectionPromise = client.getOrCreateCollection({
      name: COLLECTION_NAME,
    });
  }

  return collectionPromise;
}

export async function upsertEmbedding({
  id,
  document,
  embedding,
  metadata = {},
}) {
  const collection = await getCollection();

  await collection.upsert({
    ids: [id],
    embeddings: [embedding],
    documents: [document],
    metadatas: [metadata],
  });

  return {
    collection: COLLECTION_NAME,
    id,
  };
}

export async function getEmbeddings({ ids, limit = 10 } = {}) {
  const collection = await getCollection();

  const query = ids?.length
    ? { ids, include: ["documents", "metadatas", "embeddings"] }
    : { limit, include: ["documents", "metadatas", "embeddings"] };

  const result = await collection.get(query);
  return result;
}

import "dotenv/config";
import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { askChat, createEmbedding } from "../services/llm.js";
import {
  getEmbeddings,
  querySimilarEmbeddings,
  upsertEmbedding,
} from "../db/chromaDB.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function parseIdsQuery(idsParam) {
  if (!idsParam) return undefined;
  return String(idsParam)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Server is running",
  });
});

app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "question is required" });
    }

    const questionEmbedding = await createEmbedding(question);
    const matches = await querySimilarEmbeddings({
      queryEmbedding: questionEmbedding,
      limit: 1,
    });
    const topMatch = matches[0] || null;

    const prompt = topMatch?.document
      ? [
          "Answer the user question using the retrieved context.",
          "If the context is not enough, say what is missing.",
          "",
          `Context:\n${topMatch.document}`,
          "",
          `Question:\n${question}`,
        ].join("\n")
      : question;

    const answer = await askChat(prompt);
    res.json({
      ok: true,
      answer,
      match: topMatch,
    });
  } catch (error) {
    console.error("LLM request failed:", error.message);
    res.status(500).json({ error: "Failed to get LLM response" });
  }
});

app.post("/createEmbedding", async (req, res) => {
  try {
    // Destructure request body fields used to build upsertEmbedding params
    const { data, id, metadata } = req.body;
    if (!data) {
      return res.status(400).json({ error: "data is required" });
    }

    //SDK hits api and returns embeddings, leveraging that function
    const embedding = await createEmbedding(data);
    const recordId = id || randomUUID();

    //returns the collection name and ID
    //stores in chromaDB
    const stored = await upsertEmbedding({
      id: recordId,
      document: data,
      embedding,
      metadata: {
        source: "createEmbedding_endpoint",
        createdAt: new Date().toISOString(),
        ...(metadata || {}),
      },
    });

    res.json({
      ok: true,
      id: stored.id,
      collection: stored.collection,
      dimensions: embedding.length,
    });
  } catch (error) {
    console.error("Embedding pipeline failed:", error.message);
    res.status(500).json({ error: "Failed to create/store embedding" });
  }
});

app.get("/getCollections", async (req, res) => {
  try {
    const ids = parseIdsQuery(req.query.ids);
    const records = await getEmbeddings({ ids });
    res.json({ ok: true, documents: records.documents });
  } catch (error) {
    console.error("Chroma read failed:", error.message);
    res.status(500).json({ error: "Failed to read from Chroma" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

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

async function getRandomQuoteFromDb() {
  const records = await getEmbeddings({ limit: 200 });
  const documents = records.documents || [];
  const metadatas = records.metadatas || [];

  if (!Array.isArray(documents) || documents.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * documents.length);
  const document = documents[randomIndex];
  const metadata = metadatas[randomIndex] || {};

  return {
    quote: document,
    author: metadata.author || "Unknown",
    explanation: metadata.explanation || "",
    match: {
      id: records.ids?.[randomIndex] || null,
      metadata,
    },
  };
}

app.get("/quote", async (req, res) => {
  try {
    const result = await getRandomQuoteFromDb();
    if (!result) {
      return res.status(404).json({ error: "No quotes found in database" });
    }

    res.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("Quote retrieval failed:", error.message);
    res.status(500).json({ error: "Failed to retrieve quote from database" });
  }
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
      limit: 3,
    });
    const topMatch = matches[0] || null;

    const prompt = topMatch?.document
      ? [
          "You are a compassionate philosophy guide.",
          "Help the user with their issue using only the single retrieved quote below.",
          "Keep the tone encouraging, clear, and practical.",
          "Start your response by writing the quote verbatim in quotation marks.",
          "Do not reference any other philosophers, quotes, or sources.",
          "After the quote, explain how it applies to the user's question.",
          "End with one short actionable step the user can try today.",
          "",
          `Retrieved quote: "${topMatch.document}"`,
          `Author: ${topMatch.metadata?.author || "Unknown"}`,
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

app.post("/createEmbeddingsBulk", async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : req.body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items must be a non-empty array" });
    }

    const results = [];

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index] || {};
      const { data, id, metadata } = item;

      if (!data) {
        results.push({
          index,
          ok: false,
          error: "data is required",
        });
        continue;
      }

      try {
        const embedding = await createEmbedding(data);
        const recordId = id || randomUUID();

        const stored = await upsertEmbedding({
          id: recordId,
          document: data,
          embedding,
          metadata: {
            source: "createEmbeddingsBulk_endpoint",
            createdAt: new Date().toISOString(),
            ...(metadata || {}),
          },
        });

        results.push({
          index,
          ok: true,
          id: stored.id,
          collection: stored.collection,
          dimensions: embedding.length,
        });
      } catch (error) {
        results.push({
          index,
          ok: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.ok).length;
    const failureCount = results.length - successCount;

    res.json({
      ok: failureCount === 0,
      total: results.length,
      successCount,
      failureCount,
      results,
    });
  } catch (error) {
    console.error("Bulk embedding pipeline failed:", error.message);
    res.status(500).json({ error: "Failed to bulk create/store embeddings" });
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

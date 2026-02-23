import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createEmbedding } from "../src/services/llm.js";
import { getCollection, getEmbeddings, upsertEmbedding } from "../src/db/chromaDB.js";

const DATA_FILE_PATH = resolve(process.cwd(), "data/nondual_philosophy_quotes.json");
const MAX_CONNECTION_RETRIES = 20;
const RETRY_DELAY_MS = 1500;

function sleep(ms) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

async function waitForChroma() {
  for (let attempt = 1; attempt <= MAX_CONNECTION_RETRIES; attempt += 1) {
    try {
      await getCollection();
      return;
    } catch (error) {
      if (attempt === MAX_CONNECTION_RETRIES) {
        throw error;
      }
      console.log(
        `[ingest-quotes] Waiting for Chroma (${attempt}/${MAX_CONNECTION_RETRIES})...`,
      );
      await sleep(RETRY_DELAY_MS);
    }
  }
}

function normalizeItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];

  return rawItems
    .map((item, index) => {
      const data = typeof item?.data === "string" ? item.data.trim() : "";
      if (!data) return null;

      const id =
        typeof item?.id === "string" && item.id.trim()
          ? item.id.trim()
          : `quote-${index + 1}`;

      return {
        id,
        data,
        metadata:
          item?.metadata && typeof item.metadata === "object" ? item.metadata : {},
      };
    })
    .filter(Boolean);
}

async function getExistingIds(ids) {
  if (!ids.length) return new Set();
  const existing = await getEmbeddings({ ids });
  const storedIds = Array.isArray(existing?.ids) ? existing.ids : [];
  return new Set(storedIds.filter(Boolean));
}

async function main() {
  console.log("[ingest-quotes] Starting quote ingestion...");
  await waitForChroma();

  const file = await readFile(DATA_FILE_PATH, "utf8");
  const raw = JSON.parse(file);
  const items = normalizeItems(raw);

  if (items.length === 0) {
    console.log("[ingest-quotes] No valid quote records found. Skipping.");
    return;
  }

  const existingIds = await getExistingIds(items.map((item) => item.id));
  const missingItems = items.filter((item) => !existingIds.has(item.id));

  if (missingItems.length === 0) {
    console.log("[ingest-quotes] All quotes already exist in Chroma. Nothing to ingest.");
    return;
  }

  console.log(
    `[ingest-quotes] Ingesting ${missingItems.length} new quote(s) out of ${items.length} total...`,
  );

  let successCount = 0;
  let failureCount = 0;

  for (const item of missingItems) {
    try {
      const embedding = await createEmbedding(item.data);
      await upsertEmbedding({
        id: item.id,
        document: item.data,
        embedding,
        metadata: {
          source: "quotes_seed_file",
          ingestedAt: new Date().toISOString(),
          ...item.metadata,
        },
      });
      successCount += 1;
    } catch (error) {
      failureCount += 1;
      console.error(
        `[ingest-quotes] Failed for id=${item.id}: ${error?.message || String(error)}`,
      );
    }
  }

  console.log(
    `[ingest-quotes] Complete. Success: ${successCount}, Failed: ${failureCount}.`,
  );
}

main().catch((error) => {
  console.error("[ingest-quotes] Fatal error:", error?.message || String(error));
  process.exit(1);
});

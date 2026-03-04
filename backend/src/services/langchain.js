import "dotenv/config";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { querySimilarEmbeddings } from "../db/chromaDB.js";

const chatModel = new ChatOpenAI({
  model: "gpt-4",
  temperature: 0.7,
});

const embeddingModel = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});

function buildPrompt(context, question) {
  return `You are a compassionate philosophy guide.
Help the user with their issue using only the single retrieved quote below.
Keep the tone encouraging, clear, and practical.
Do not reference any other philosophers, quotes, or sources.
Begin your response by explaining how it applies to the user's question.
End with one short actionable step the user can try today.
Keep the responses brief, and the actionable step quick.

Retrieved quote: ${context}

Question:
${question}`;
}

/**
 * Ask the retrieval pipeline a question.
 * We embed the question, fetch the best matching quote from Chroma,
 * and ask the chat model to answer using that quote as context.
 */
export async function askWithLangchain(question) {
  const topMatch = await getTopMatch(question);
  const context = topMatch?.document || "No matching quote was retrieved.";
  const prompt = buildPrompt(context, question);
  const response = await chatModel.invoke(prompt);
  return typeof response.content === "string"
    ? response.content
    : JSON.stringify(response.content);
}

/**
 * Return the single best Chroma match for a question.
 */
export async function getTopMatch(question) {
  const queryEmbedding = await embeddingModel.embedQuery(question);
  const matches = await querySimilarEmbeddings({
    queryEmbedding,
    limit: 1,
  });

  if (!matches.length) return null;
  const doc = matches[0];
  return {
    document: doc.document,
    metadata: doc.metadata,
  };
}

import "dotenv/config";
import OpenAI from "openai";

//creates SDK client
const client = new OpenAI();

//automatically reads env vars for API Key
export const askChat = async (prompt) => {
  const response = await client.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });
  return response.choices[0].message.content;
};

export const createEmbedding = async (embedding) => {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: embedding,
    encoding_format: "float",
  });

  return response.data[0].embedding;
};

//Automatically hitting an api endpoint

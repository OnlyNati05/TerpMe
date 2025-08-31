import { qdrant } from "../lib/qdrant";
import { QDRANT_COLLECTION_NAME } from "../config/env";
import { embedTexts } from "./embeddings.service";
import { cosineSimilarity } from "../utils/similarity";
import { openai, CHAT_MODEL } from "../lib/openai";
import { classifyQuestion } from "./classifier.service";
import { getConversation, addToConversation } from "./memory.service";

export type RetrievedChunk = { content: string; url: string; score: number };

export async function embedQuery(question: string): Promise<number[]> {
  const [vec] = await embedTexts([question]);
  if (!vec) throw new Error("Failed to embed question");
  return vec;
}

// Search Qdrant DB for chunks that are similar to the users question
export async function searchQdrant(queryEmbedding: number[], limit = 5): Promise<RetrievedChunk[]> {
  const hits = await qdrant.search(QDRANT_COLLECTION_NAME, {
    vector: queryEmbedding,
    limit,
    with_payload: true,
  });

  return hits
    .map((h) => ({
      content: (h.payload as any)?.content ?? "",
      url: (h.payload as any)?.url ?? "",
      score: h.score ?? 0,
    }))
    .filter((c) => c.content && c.url);
}

/**
 * Build a context string (and source list) from retrieved chunks.
 * Deduplicates by embedding similarity and trims overly long text.
 */
export async function buildContext(
  chunks: RetrievedChunk[],
  maxChars = 7000,
  similarityThreshold = 0.9
): Promise<{ context: string; sources: string[] }> {
  const sources: string[] = [];
  let context = "";
  const cutoff = 1800;

  // store embeddings of accepted chunks for deduplication
  const seenEmbeddings: number[][] = [];

  for (const c of chunks) {
    // Skip empty chunks
    if (!c.content?.trim()) continue;

    // Embed the chunk
    const [embedding] = await embedTexts([c.content]);
    if (!embedding) continue;

    const isDuplicate = seenEmbeddings.some(
      (e) => cosineSimilarity(embedding, e) > similarityThreshold
    );
    if (isDuplicate) continue;

    // Truncate long content
    const slice = c.content.slice(0, cutoff);
    const lastPeriod = slice.lastIndexOf(".");
    const snippet = lastPeriod > 0 ? slice.slice(0, lastPeriod + 1) : slice;

    const block = `Source: ${c.url}\n${snippet}\n---\n`;

    // If adding this block would go over the max char length, dont add it
    if ((context + block).length > maxChars) break;

    // Accept this chunk
    context += block;
    sources.push(c.url);
    seenEmbeddings.push(embedding);
  }

  return { context, sources };
}

// Get a general LLM answer (no context), while preserving conversation history.
async function normalLLMAnswer(
  question: string,
  sessionId: string,
  conversationId: string
): Promise<string> {
  const history = getConversation(sessionId, conversationId);

  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: history.concat({ role: "user", content: question }),
    temperature: 0.7,
  });

  const answer = completion.choices[0]?.message?.content?.trim() ?? "";

  addToConversation(sessionId, conversationId, [
    { role: "user", content: question },
    { role: "assistant", content: answer },
  ]);

  return answer;
}

/**
 * Main entrypoint: answer a user question.
 * - Embeds the query
 * - Retrieves context from Qdrant DB
 * - Falls back to general LLM if no context
 * - Maintains conversation history
 */
export async function askQuestion(
  question: string,
  opts?: { k?: number; sessionId?: string; conversationId?: string }
): Promise<{
  answer: string;
  sources: string[];
  hitCount: number;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}> {
  const sessionId = opts?.sessionId ?? "defaultUser";
  const conversationId = opts?.conversationId ?? "defaultConversation";

  const embedding = await embedQuery(question);
  const chunks = await searchQdrant(embedding, opts?.k ?? 5);

  // If no relevant context chunks found, fallback
  if (chunks.length === 0) {
    const type = await classifyQuestion(question);
    const generalAnswer = await normalLLMAnswer(question, sessionId, conversationId);

    if (type === "UMD") {
      return {
        answer:
          "I couldn't find this in my sources. Here's what I know more generally:\n\n" +
          generalAnswer,
        sources: [],
        hitCount: 0,
      };
    }

    return {
      answer: generalAnswer,
      sources: [],
      hitCount: 0,
    };
  }

  // Otherwise, build context from chunks
  const { context, sources } = await buildContext(chunks);
  const history = getConversation(sessionId, conversationId);

  const messages = [
    ...history,
    {
      role: "user" as const,
      content:
        `Question: ${question}\n\n` +
        `Context (multiple sources):\n${context}\n` +
        `Answer using the provided context.` +
        `Provide a clear, complete answer in full sentences. Include relevant details from the context when possible.`,
    },
  ];

  console.log(context);

  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages,
    temperature: 0.7,
  });

  const answer = completion.choices[0]?.message?.content?.trim() ?? "";

  addToConversation(sessionId, conversationId, [
    { role: "user", content: question },
    { role: "assistant", content: answer },
  ]);

  return {
    answer,
    sources,
    hitCount: chunks.length,
    usage: completion.usage,
  };
}

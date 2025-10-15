import { qdrant } from "../lib/qdrant";
import { QDRANT_COLLECTION_NAME, OPENAI_CHAT_MODEL } from "../config/env";
import { embedTexts } from "./embeddings.service";
import { cosineSimilarity } from "../utils/similarity";
import { openai, CHAT_MODEL } from "../lib/openai";
import { classifyQuestion } from "./classifier.service";
import * as messageService from "./messages.service";
import { prisma } from "../lib/prisma";

const MAX_CONTEXT_MESSAGES = 20; // how many messages to keep
const SUMMARIZE_THRESHOLD = 50; // when to summarize

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

async function summarizeMessages(
  uid: string,
  conversationId: string,
  messages: any[]
): Promise<void> {
  const textBlock = messages.map((m) => `${m.role}: ${m.content}`).join("\n");

  const completion = await openai.chat.completions.create({
    model: OPENAI_CHAT_MODEL,
    messages: [
      {
        role: "system",
        content: "Summarize this chat history in a concise way that preserves important details. ",
      },
      { role: "user", content: textBlock },
    ],
  });

  const summary = completion.choices[0]?.message?.content ?? "";

  // Append to exisiting summary
  const convo = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: uid },
    select: { summary: true },
  });

  await prisma.conversation.update({
    where: { id: conversationId, userId: uid },
    data: {
      summary: convo?.summary ? convo.summary + "\n" + summary : summary,
    },
  });

  // Mark summarized messages
  await prisma.message.updateMany({
    where: {
      conversationId: conversationId,
      id: { in: messages.map((m) => m.id) },
    },
    data: { summarized: true },
  });
}

// Get a general LLM answer (no context), while preserving conversation history.
async function normalLLMAnswer(
  uid: string,
  conversationId: string,
  question: string
): Promise<string> {
  const history = await messageService.listMessages(uid, conversationId);

  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
    temperature: 0.7,
  });

  const answer = completion.choices[0]?.message?.content?.trim() ?? "";

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
  opts: { uid: string; conversationId: string },
  k?: number,
  onDelta?: (delta: string) => void
): Promise<{
  answer: string;
  sources: string[];
  hitCount: number;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}> {
  const { uid, conversationId } = opts;

  try {
    const curr_conv = await prisma.conversation.findMany({
      where: { id: conversationId, userId: uid },
      include: {
        messages: {
          where: { role: "user" },
        },
      },
    });

    if (curr_conv && !(curr_conv[0].messages.length === 1)) {
      await messageService.createMessage({
        uid,
        conversationId,
        role: "user",
        content: question,
      });
    }
  } catch (error) {
    console.log(error);
  }

  // If first message in chat, add it to preview
  const converse = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { preview: true },
  });

  if (!converse?.preview) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { preview: question },
    });
  }

  // Summarization check
  const unsummarized = await prisma.message.findMany({
    where: { conversationId, summarized: false },
    orderBy: { createdAt: "asc" },
  });

  if (unsummarized.length > SUMMARIZE_THRESHOLD) {
    const oldMessages = unsummarized.slice(0, -MAX_CONTEXT_MESSAGES);
    if (oldMessages.length > 0) {
      await summarizeMessages(uid, conversationId, oldMessages);
    }
  }

  const embedding = await embedQuery(question);
  const chunks = await searchQdrant(embedding, k ?? 5);

  // If no relevant context chunks found, fallback
  if (chunks.length === 0) {
    const type = await classifyQuestion(question);
    const generalAnswer = await normalLLMAnswer(uid, conversationId, question);

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

  const convo = await prisma.conversation.findFirst({
    where: { id: conversationId },
    select: { summary: true },
  });

  const recentMessages = await prisma.message.findMany({
    where: { conversationId, summarized: false },
    orderBy: { createdAt: "asc" },
    take: MAX_CONTEXT_MESSAGES,
  });

  const now = new Date();
  const today = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;

  const messages = [
    ...(convo?.summary
      ? [{ role: "system" as const, content: `Conversation so far (summary): ${convo.summary}` }]
      : []),
    {
      role: "system" as const,
      content:
        `Context (multiple sources):\n${context}\n` +
        `Todays Date: ${today}` +
        `Instructions:
        - Use only the provided context to answer.
        - If multiple dates or events are present, choose the one that best matches the user's question and is most recent to Todays Date.
        - If the question is about the future, prefer upcoming events.
        - Write in a clear, professional tone.
        - Responses may be up to 500 tokens if needed. If an answer would require much more than that, summarize instead and end gracefully. 
        Formatting:
        - Use **bold** for important names, dates, or key details.
        - Use bullet points or numbered lists for multiple items.
        - Keep paragraphs concise (2-3 sentences max).
        - Always include relevant context details rather than short answers.`,
    },
    ...recentMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages,
    temperature: 0.5,
    max_completion_tokens: 500,
    stream: true,
  });

  let answer = "";

  for await (const chunk of completion) {
    const delta = chunk.choices[0]?.delta?.content || "";
    if (delta) {
      answer += delta;
      if (onDelta) onDelta(delta);
    }
  }

  // Save assistant reply
  await messageService.createMessage({
    uid,
    conversationId,
    role: "assistant",
    content: answer,
  });

  return {
    answer,
    sources,
    hitCount: chunks.length,
  };
}

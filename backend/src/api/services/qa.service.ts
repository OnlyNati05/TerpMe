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

export type RetrievedChunk = { content: string; url: string; title: string; score: number };

export async function embedQuery(question: string): Promise<number[]> {
  const [vec] = await embedTexts([question]);
  if (!vec) throw new Error("Failed to embed question");
  return vec;
}

// Search Qdrant DB for chunks that are similar to the users question
export async function searchQdrant(
  queryEmbedding: number[],
  limit = 5,
  queryText?: string
): Promise<RetrievedChunk[]> {
  const filter: any = { must: [] };

  // Detect recency intent
  if (queryText) {
    const lower = queryText.toLowerCase();
    if (/(recent|latest|today|this week|this month)/.test(lower)) {
      const now = new Date();

      let since = new Date();
      if (lower.includes("today")) since.setDate(now.getDate() - 1);
      else if (lower.includes("week")) since.setDate(now.getDate() - 7);
      else if (lower.includes("month")) since.setMonth(now.getMonth() - 1);
      else since.setDate(now.getDate() - 14);

      filter.must.push({
        key: "date_iso",
        range: { gte: since.toISOString() },
      });
    }
  }

  // Run Qdrant search
  const hits = await qdrant.search(QDRANT_COLLECTION_NAME, {
    vector: queryEmbedding,
    limit,
    with_payload: true,
    ...(filter.must.length ? { filter } : {}),
  });

  return hits
    .map((h) => ({
      content: (h.payload as any)?.content ?? "",
      title: (h.payload as any)?.title ?? "",
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
): Promise<{ context: string; sources: { title: string; url: string; description: string }[] }> {
  const sources: { title: string; url: string; description: string }[] = [];
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

    sources.push({
      title: c.title,
      url: c.url,
      description: snippet.trim(),
    });

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
  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [{ role: "user", content: question }],
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
  sources: { title: string; url: string; description: string }[];
  hitCount: number;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}> {
  const now = new Date();
  const today = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
  const { uid, conversationId } = opts;

  // If first_message -> dont run logic -> set first_message false
  const current_conv = await prisma.conversation.findUnique({
    where: { id: conversationId, userId: uid },
  });

  if (!current_conv?.firstM) {
    await messageService.createMessage({
      uid,
      conversationId,
      role: "user",
      content: question,
    });
  } else if (current_conv?.firstM) {
    await prisma.conversation.update({
      where: { id: conversationId, userId: uid },
      data: { firstM: false },
    });
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
  const chunks = await searchQdrant(embedding, k ?? 5, question);
  const filteredChunks = chunks.filter((c) => c.score > 0.2);

  // If no relevant context chunks found, fallback
  if (filteredChunks.length === 0) {
    const type = await classifyQuestion(question);

    if (type === "UMD" && onDelta) {
      const prefix = "I couldn't find this in my sources. Here's what I know more generally:\n\n";
      onDelta(prefix);
    }

    const convo = await prisma.conversation.findFirst({
      where: { id: conversationId },
      select: { summary: true },
    });

    const recentMessages = await prisma.message.findMany({
      where: { conversationId, summarized: false },
      orderBy: { createdAt: "asc" },
      take: MAX_CONTEXT_MESSAGES,
    });

    const messages = [
      ...(convo?.summary
        ? [
            {
              role: "system" as const,
              content: `Conversation so far (summary): ${convo.summary}`,
            },
          ]
        : []),

      ...(type === "GENERAL"
        ? [
            {
              role: "system" as const,
              content: `# Role
                  You are a helpful and conversational assistant. Respond naturally and use prior messages for context when appropriate.

                  # Current Date
                  Today's Date: ${today}

                  # Response Formatting
                  - Use **bold** for important dates and key details
                  - Use bullet points or numbered lists when appropriate
                  - Keep paragraphs concise (2-3 sentences maximum)`,
            },
          ]
        : [
            {
              role: "system" as const,
              content: `# Role
                  You are a helpful and conversational assistant. Respond naturally and use prior messages for context when appropriate.

                  # Current Date
                  Today's Date: ${today}

                  # Instructions
                  - If multiple dates or events are present, choose the one that best matches the user's question and is most recent to today's date
                  - Prioritize relevant context details over short answers

                  # Response Formatting
                  - Use **bold** for important dates and key details
                  - Use bullet points or numbered lists when appropriate
                  - Keep paragraphs concise (2-3 sentences maximum)`,
            },
          ]),

      ...recentMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),

      { role: "user" as const, content: question },
    ];

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages,
      temperature: 0.7,
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

    await messageService.createMessage({
      uid,
      conversationId,
      role: "assistant",
      content: answer,
      metadata: [],
    });

    return {
      answer,
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
        - Use **bold** on important dates and key details.
        - Use bullet points or numbered lists if needed.
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
    metadata: sources,
  });

  return {
    answer,
    sources,
    hitCount: chunks.length,
  };
}

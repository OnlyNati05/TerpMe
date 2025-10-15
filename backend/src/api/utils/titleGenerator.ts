import { OPENAI_CHAT_MODEL } from "../config/env";
import { openai } from "../lib/openai";

export async function generateConversationTitle(question?: string): Promise<string> {
  const prompt = `
You are an assistant that names chat conversations.
Given the user's first message, respond with a short, clear, 3-6 word title that summarizes the topic.
Do NOT include quotes or punctuation at the start or end.
Do NOT prefix with "Title:".

User message:
"${question}"
  `.trim();

  const completion = await openai.chat.completions.create({
    model: OPENAI_CHAT_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_completion_tokens: 20,
    temperature: 0.5,
  });

  return completion.choices[0]?.message?.content?.trim() || "New Conversation";
}

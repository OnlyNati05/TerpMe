import { openai, CHAT_MODEL } from "../lib/openai";

/**
 * Classify a user question into one of two categories:
 * - "UMD" -> most likely needs retrieval from Qdrant DB
 * - "GENERAL" -> just general talk / fallback to LLM
 */

export async function classifyQuestion(question: string): Promise<"UMD" | "GENERAL"> {
  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are a classifier. Answer with a single token: 'UMD' if the question is likely about the University of Maryland (campus, admissions, courses, fees, orientation, professors, housing, etc.), otherwise 'GENERAL'. No explanation.",
      },
      { role: "user", content: question },
    ],
  });

  const label = completion.choices[0]?.message?.content?.trim().toUpperCase();

  if (label === "UMD") {
    return "UMD";
  } else {
    return "GENERAL";
  }
}

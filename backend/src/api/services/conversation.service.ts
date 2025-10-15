import { prisma } from "../lib/prisma";
import { generateConversationTitle } from "../utils/titleGenerator";

export async function getConversationById(uid: string, id: string) {
  return prisma.conversation.findFirst({
    where: { id, userId: uid },
    include: {
      messages: {
        orderBy: { createdAt: "asc" }, // ensures chat history shows in order
      },
    },
  });
}

export async function getUserConversations(uid: string) {
  return prisma.conversation.findMany({
    where: { userId: uid },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      preview: true,
    },
  });
}

export async function createConversation(uid: string, initialMessage?: string) {
  const title = await generateConversationTitle(initialMessage?.trim());

  return prisma.conversation.create({
    data: {
      userId: uid,
      title,
      preview: initialMessage,
      messages: initialMessage
        ? {
            create: {
              role: "user",
              content: initialMessage,
            },
          }
        : undefined,
    },
    include: { messages: true },
  });
}

export async function deleteConversation(uid: string, id: string) {
  return prisma.conversation.deleteMany({
    where: { id, userId: uid },
  });
}

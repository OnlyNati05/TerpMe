import { prisma } from "../lib/prisma";

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
  });
}

export async function createConversation(uid: string) {
  return prisma.conversation.create({
    data: {
      userId: uid,
      title: "New Conversation", // default title
    },
  });
}

export async function deleteConversation(uid: string, id: string) {
  return prisma.conversation.deleteMany({
    where: { id, userId: uid },
  });
}

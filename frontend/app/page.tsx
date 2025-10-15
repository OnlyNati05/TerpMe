"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import api from "@/lib/axios";
import { Volleyball, Newspaper, Megaphone } from "lucide-react";
import ChatInput from "@/components/ui/ChatInput";

const prompts = {
  prompt1: "What was the score of the most recent football game at UMD?",
  prompt2: "What events took place at UMD recently?",
  prompt3:
    "Has UMD announced any class cancellations or schedule changes today?",
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  async function createConversation(initialMessage: string) {
    if (!initialMessage.trim() || isCreating) return;
    setIsCreating(true);

    try {
      const res = await api.post("/conversations", { initialMessage });
      const conversation = res.data;

      // Refresh sidebar conversations
      mutate("/conversations");

      // Navigate to new chat
      router.push(`/chat/${conversation.id}`);
    } catch (err) {
      console.error("Error creating conversation: ", err);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div
        className={`flex flex-col items-center gap-4 p-8 bg-[rgb(250,250,250)] rounded-2xl border-1 border-gray-200 shadow-[0_4px_60px_rgba(0,0,0,0.08)] transition-all duration-300 ${
          isCreating ? "opacity-70 pointer-events-none" : "opacity-100"
        }`}
      >
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome Terp, how can I help?
        </h1>
        <p className="text-center text-sm text-gray-600 max-w-[500px] mx-auto mb-6">
          TerpMe is a tool for students at the University of Maryland to help
          them keep up to date with the latest news. Try one of the prompts
          below!
        </p>
        {/* Prompts */}
        <div className="flex flex-row justify-between w-full gap-3 mb-14">
          <div
            onClick={() => createConversation(prompts.prompt1)}
            className="text-center bg-blue-50 p-5 rounded-2xl hover:bg-blue-100 hover:shadow-sm cursor-pointer transition-all duration-300 border-1 shadow-xs w-[250px]"
          >
            <p className="text-[17px] mb-3 flex items-center justify-center gap-2">
              <Volleyball className="h-5 w-5 text-blue-600" /> Sports
            </p>
            <p className="text-[13px] text-gray-600">{prompts.prompt1}</p>
          </div>

          <div
            onClick={() => createConversation(prompts.prompt2)}
            className="text-center bg-blue-50 p-5 rounded-2xl hover:bg-blue-100 hover:shadow-sm cursor-pointer transition-all duration-300 border-1 shadow-xs w-[250px]"
          >
            <p className="text-[16px] mb-3 flex items-center justify-center gap-2">
              <Newspaper className="h-5 w-5 text-blue-600" /> Recent Events
            </p>
            <p className="text-[13px] text-gray-600">{prompts.prompt2}</p>
          </div>

          <div
            onClick={() => createConversation(prompts.prompt3)}
            className="text-center bg-blue-50 p-5 rounded-2xl hover:bg-blue-100 hover:shadow-sm cursor-pointer transition-all duration-300 border-1 shadow-xs w-[250px]"
          >
            <p className="text-[16px] mb-3 flex items-center justify-center gap-2">
              <Megaphone className="h-5 w-5 text-blue-600" /> Campus Updates
            </p>
            <p className="text-[13px] text-gray-600">{prompts.prompt3}</p>
          </div>
        </div>
        {/* Input + Submit */}
        <ChatInput
          className="border-t"
          onSend={async (msg) => {
            setIsCreating(true);
            try {
              const res = await api.post("/conversations", {
                initialMessage: msg,
              });
              mutate("/conversations");
              router.push(`/chat/${res.data.id}`);
            } finally {
              setIsCreating(false);
            }
          }}
          isLoading={isCreating}
          placeholder="How can I help you today?"
        />
      </div>
    </div>
  );
}

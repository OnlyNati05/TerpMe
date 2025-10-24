"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import api from "@/lib/axios";
import { Volleyball, Newspaper, Megaphone, Square } from "lucide-react";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
  PromptInputTools,
  PromptInputButton,
} from "@/components/ui/shadcn-io/ai/prompt-input";
import { MicIcon, Brain } from "lucide-react";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";

const prompts = {
  prompt1: "What was the score of the most recent football game at UMD?",
  prompt2: "What events took place at UMD recently?",
  prompt3:
    "Has UMD announced any class cancellations or schedule changes today?",
};

export default function Home() {
  const [input, setInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [userLimit, setUserLimit] = useState(false);
  const router = useRouter();

  const { isListening, transcript, startListening, stoptListening } =
    useSpeechRecognition();

  const startStopListening = () => {
    isListening ? stopVoiceInput() : startListening();
  };

  const stopVoiceInput = () => {
    setInput(
      (prev) =>
        prev + (transcript.length ? (prev.length ? " " : "") + transcript : "")
    );
    stoptListening();
  };

  useEffect(() => {
    const getUserLimit = async () => {
      try {
        const res = await api.get("/user/limit");
        if (res.data.limit === true) {
          setUserLimit(true);
        }
      } catch (err) {
        console.log("Error fetching user limit: ", err);
      }
    };
    getUserLimit();
  }, []);

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
        className={`flex flex-col items-center gap-4 p-8 bg-[rgb(250,250,250)] rounded-2xl border-1 border-gray-200 shadow-[0_4px_60px_rgba(0,0,0,0.08)] transition-all duration-300 dark:bg-neutral-800 dark:border-none ${
          isCreating ? "opacity-70 pointer-events-none" : "opacity-100"
        }`}
      >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Welcome Terp, how can I help?
        </h1>
        <p className="text-center text-sm text-gray-600 dark:text-gray-300 max-w-[500px] mx-auto mb-6">
          TerpMe is a tool for students at the University of Maryland to help
          them keep up to date with the latest news. Try one of the prompts
          below!
        </p>
        {/* Prompts */}
        <div className="flex flex-row justify-between w-full gap-3 mb-14">
          <div
            onClick={() => {
              if (userLimit) return;
              createConversation(prompts.prompt1);
            }}
            className="text-center bg-blue-50 p-5 rounded-2xl hover:bg-blue-100 hover:shadow-sm dark:bg-neutral-700 dark:hover:bg-neutral-600 cursor-pointer transition-transform duration-300 border-1 shadow-xs w-[250px]"
          >
            <p className="text-[17px] mb-3 flex items-center justify-center gap-2 text-black dark:text-white">
              <Volleyball className="h-5 w-5 text-blue-600 dark:text-blue-500" />
              Sports
            </p>
            <p className="text-[13px] text-gray-600 dark:text-neutral-300">
              {prompts.prompt1}
            </p>
          </div>

          <div
            onClick={() => {
              if (userLimit) return;
              createConversation(prompts.prompt2);
            }}
            className="text-center bg-blue-50 p-5 rounded-2xl hover:bg-blue-100 dark:bg-neutral-700 dark:hover:bg-neutral-600 hover:shadow-sm cursor-pointer transition-all duration-300 border-1 shadow-xs w-[250px]"
          >
            <p className="text-[16px] mb-3 flex items-center justify-center gap-2 text-black dark:text-white">
              <Newspaper className="h-5 w-5 text-blue-600 dark:text-blue-500" />
              Recent Events
            </p>
            <p className="text-[13px] text-gray-600 dark:text-neutral-300">
              {prompts.prompt2}
            </p>
          </div>

          <div
            onClick={() => {
              if (userLimit) return;
              createConversation(prompts.prompt3);
            }}
            className="text-center bg-blue-50 p-5 rounded-2xl hover:bg-blue-100 dark:bg-neutral-700 dark:hover:bg-neutral-600 hover:shadow-sm cursor-pointer transition-all duration-300 border-1 shadow-xs w-[250px]"
          >
            <p className="text-[16px] mb-3 flex items-center justify-center gap-2 text-black dark:text-white">
              <Megaphone className="h-5 w-5 text-blue-600 dark:text-blue-500" />
              Campus Updates
            </p>
            <p className="text-[13px] text-gray-600 dark:text-neutral-300">
              {prompts.prompt3}
            </p>
          </div>
        </div>

        <PromptInput
          onSubmit={async (e) => {
            e.preventDefault();
            const trimmed = input.trim();
            if (!trimmed || isCreating || userLimit) return;
            setIsCreating(true);
            try {
              const res = await api.post("/conversations", {
                initialMessage: trimmed,
              });
              mutate("/conversations");
              router.push(`/chat/${res.data.id}`);
            } finally {
              setIsCreating(false);
            }
          }}
          className="dark:bg-neutral-700"
        >
          <PromptInputTextarea
            value={
              isListening
                ? input +
                  (transcript.length
                    ? (input.length ? " " : "") + transcript
                    : "")
                : input
            }
            onChange={(e: any) => setInput(e.currentTarget.value)}
            placeholder={
              userLimit ? "Daily message limit reached" : "Type your message..."
            }
            className="
              px-5
            placeholder-gray-400 
            dark:placeholder-neutral-400 
            dark:text-white"
            disabled={userLimit}
          />
          <PromptInputToolbar>
            <PromptInputTools className="px-0.5">
              <PromptInputButton
                className="cursor-pointer dark:text-white"
                disabled={!!userLimit}
                onClick={() => startStopListening()}
              >
                {isListening ? (
                  <Square size={13} fill="red" color="red" />
                ) : (
                  <MicIcon size={16} />
                )}
                {isListening ? (
                  <span className="text-red-600">Listening...</span>
                ) : (
                  <span>Voice</span>
                )}
              </PromptInputButton>
              <PromptInputButton
                className="cursor-pointer dark:text-white"
                disabled={!!userLimit}
              >
                <Brain size={16} />
                <span>GPT 4o-mini</span>
              </PromptInputButton>
            </PromptInputTools>
            <PromptInputSubmit
              className="bg-blue-500 cursor-pointer hover:bg-blue-600"
              disabled={userLimit || !input.trim()}
              status={isCreating ? "submitted" : "idle"}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}

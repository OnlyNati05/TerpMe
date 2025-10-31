"use client";

import { useEffect, useRef, useState } from "react";
import MessageBubble from "@/components/ui/messageBubble";
import api from "@/lib/axios";
import { API_URL } from "@/lib/config";
import { use } from "react";
import { notFound } from "next/navigation";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
  PromptInputTools,
  PromptInputButton,
} from "@/components/ui/shadcn-io/ai/prompt-input";
import { MicIcon, Brain, Square } from "lucide-react";
import { PulseLoader } from "react-spinners";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";

type Source = {
  title: string;
  url: string;
  description: string;
};

type Msg = {
  id: string;
  createdAt: string | Date;
  content: string;
  role: "user" | "assistant" | string;
  summarized: boolean;
  conversationId: string;
  metadata?: {
    type?: string;
    sources?: Source[];
    hitCount?: number;
  };
};

type Conversation = {
  id: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  title: string;
  userId: string;
  summary: string | null;
  messages: Msg[];
};

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [conv, setConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<any>(null);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [conv]);

  // Get user Limit
  useEffect(() => {
    const getUserLimit = async () => {
      try {
        const res = await api.get("/user/limit");
        if (res.data.limit === true) {
          setLimitError("Daily limit reached.");
        }
      } catch (err) {
        console.log("Error fetching user limit: ", err);
      }
    };
    getUserLimit();
  }, []);

  // Load conversation + messages
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await api.get(`/conversations/${id}`);
        if (!cancelled) setConv(res.data as Conversation);
      } catch (err: any) {
        const status = err?.response?.status;

        if (status === 404) {
          notFound();
        }

        if (!cancelled) setErr(err?.response?.data ?? err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!loading && conv) {
      const userMsgs = conv.messages.filter((m) => m.role === "user");
      const asstMsgs = conv.messages.filter((m) => m.role === "assistant");

      if (userMsgs.length === 1 && asstMsgs.length === 0) {
        streamAssistant(userMsgs[0].content);
      }
    }
  }, [loading]);

  async function streamAssistant(question: string) {
    const msgId = `asst-${Date.now()}`;
    controllerRef.current = new AbortController();

    try {
      setStreaming(true);

      const resp = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, conversationId: id }),
        credentials: "include",
        signal: controllerRef.current.signal,
      });

      if (resp.status === 429) {
        const errorJson = await resp.json().catch(() => ({}));
        setLimitError(errorJson?.error || "Daily message limit reached");
        return;
      }

      if (!resp.ok) {
        const errorJson = await resp.json().catch(() => ({}));
        setErr(errorJson?.error || "Request failed");
        return;
      }

      if (!resp.body) throw new Error("No response body");

      setConv((prev) =>
        prev
          ? {
              ...prev,
              messages: [
                ...prev.messages,
                {
                  id: msgId,
                  role: "assistant",
                  content: "",
                  createdAt: new Date().toISOString(),
                  summarized: false,
                  conversationId: prev.id,
                } as Msg,
              ],
            }
          : prev
      );

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      let firstChunk = true;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const event = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);

          // Each SSE event can have multiple "data:" lines
          const dataLines = event
            .split("\n")
            .filter((l) => l.startsWith("data:"))
            .map((l) => l.replace(/^data:\s?/, "")); // remove only "data:", keep spaces

          const payload = dataLines.join("\n");

          // Check for control signal
          if (payload.trim() === "[DONE]") {
            reader.cancel();
            return;
          }

          if (firstChunk) {
            setSending(false);
            firstChunk = false;
          }

          const isJsonLike =
            payload.trim().startsWith("{") && payload.trim().endsWith("}");

          if (isJsonLike) {
            try {
              const json = JSON.parse(payload);

              if (json.type === "metadata") {
                setConv((prev) =>
                  prev
                    ? {
                        ...prev,
                        messages: prev.messages.map((m) =>
                          m.id === msgId ? { ...m, metadata: json } : m
                        ),
                      }
                    : prev
                );
                return;
              }
            } catch (err) {
              console.warn("JSON parse failed for:", payload);
            }
          }

          setConv((prev) =>
            prev
              ? {
                  ...prev,
                  messages: prev.messages.map((m) =>
                    m.id === msgId
                      ? { ...m, content: (m.content || "") + payload }
                      : m
                  ),
                }
              : prev
          );
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Stream aborted by user");
        return;
      }
      console.error("Streaming error:", err);
      setErr(err);
    } finally {
      setStreaming(false);
      controllerRef.current = null;
    }
  }

  // Send a message using POST /chat
  async function onSend(message: string) {
    if (!message.trim() || sending) return;

    setLimitError(null);
    setSending(true);

    // Show the user message
    setConv((prev) =>
      prev
        ? {
            ...prev,
            messages: [
              ...prev.messages,
              {
                id: `tmp-${Date.now()}`,
                content: message,
                role: "user",
                createdAt: new Date().toISOString(),
                summarized: false,
                conversationId: prev.id,
              } as Msg,
            ],
          }
        : prev
    );

    try {
      await streamAssistant(message);
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setLimitError(
          err.response.data?.error || "Daily message limit reached."
        );
      } else {
        setErr(err?.response?.data ?? err);
      }
    }
  }

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden">
      {/* Messages area */}
      <h1 className="relative top-6 right-16 text-center text-[15px] font-medium ">
        {conv?.title}
      </h1>
      <div className="flex-1 overflow-y-auto px-6 py-12 mt-12">
        <div className="max-w-3xl mx-auto w-full space-y-3">
          {conv?.messages.map((m, i) => (
            <MessageBubble
              key={m.id}
              role={m.role}
              content={m.content}
              metadata={m.metadata}
              isLast={i === conv.messages.length - 1}
              streaming={streaming}
              sending={sending}
              onRetry={() => {
                const index = conv?.messages.findIndex(
                  (msg) => msg.id === m.id
                );
                if (index && index > 0) {
                  const prevUserMsg = conv.messages[index - 1];
                  if (prevUserMsg.role === "user") {
                    streamAssistant(prevUserMsg.content);
                  }
                }
              }}
            />
          ))}
          <div ref={messagesEndRef}></div>
        </div>
        <div className="w-20 mx-35">
          {sending && (
            <PulseLoader color="#d4d2d2" size={10} speedMultiplier={0.7} />
          )}
        </div>
      </div>

      <div className="sticky bottom-0">
        <div className="max-w-[800px] mx-auto w-full pb-8">
          <PromptInput
            onSubmit={async (e) => {
              e.preventDefault();
              const trimmed = input.trim();
              if (!trimmed || sending || streaming || loading || limitError)
                return;

              setInput("");
              await onSend(trimmed);
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
              onChange={(e) => setInput(e.currentTarget.value)}
              placeholder={
                limitError
                  ? "Daily message limit reached"
                  : "Type your message..."
              }
              className="
              px-5
            placeholder-gray-400 
            dark:placeholder-neutral-400 
            dark:text-white"
              disabled={!!limitError || isListening}
            />
            <PromptInputToolbar>
              <PromptInputTools className="px-0.5">
                <PromptInputButton
                  className="cursor-pointer dark:text-white"
                  disabled={!!limitError}
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
                  disabled={!!limitError}
                >
                  <Brain size={16} />
                  <span>GPT 4o-mini</span>
                </PromptInputButton>
              </PromptInputTools>
              <PromptInputSubmit
                onClick={(e) => {
                  if (streaming) {
                    e.preventDefault();
                    controllerRef.current?.abort();
                    setStreaming(false);
                    return;
                  }
                }}
                className="bg-blue-500 cursor-pointer hover:bg-blue-600"
                disabled={
                  loading || !!limitError || (!streaming && !input.trim())
                }
                status={
                  sending ? "submitted" : streaming ? "streaming" : "idle"
                }
              />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}

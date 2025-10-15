"use client";

import { useEffect, useRef, useState } from "react";
import MessageBubble from "@/components/ui/messageBubble";
import api from "@/lib/axios";
import { API_URL } from "@/lib/config";
import { use } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ChatInput from "@/components/ui/ChatInput";
import { notFound } from "next/navigation";

type Msg = {
  id: string;
  createdAt: string | Date;
  content: string;
  role: "user" | "assistant" | string;
  summarized: boolean;
  conversationId: string;
  sources?: string[];
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
  const controllerRef = useRef<AbortController | null>(null);

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

          // Append token text (preserving spacing + markdown)
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
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="relative flex flex-col h-[97vh] mx-25">
      {/* Messages */}
      <div className=" flex-1 overflow-y-auto p-6 space-y-3">
        {/* {sending && } */}
        {conv?.messages.map((m) => (
          <MessageBubble
            key={m.id}
            role={m.role}
            content={m.content}
            sources={m.sources}
          />
        ))}
        <div className="pointer-events-none absolute bottom-20 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent z-10" />
      </div>

      <div className="grid w-full max-w-xl items-start gap-4 m-10">
        {/* Daily limit error */}
        {limitError && (
          <Alert variant="destructive">
            <AlertTitle>Daily Limit Reached</AlertTitle>
            <AlertDescription>
              {"You have used up today's messages. Try again in 24 hours."}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Chat input */}
      <div>
        <ChatInput
          onSend={onSend}
          onStop={() => controllerRef.current?.abort()}
          isStreaming={sending}
          isLoading={loading}
          disabled={limitError !== null}
        />
      </div>
    </div>
  );
}

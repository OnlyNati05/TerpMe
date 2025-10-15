"use client";

import { useState } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatInputProps = {
  onSend: (message: string) => Promise<void> | void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  onStop?: () => void;
  isStreaming?: boolean;
};

export default function ChatInput({
  onSend,
  onStop,
  isStreaming,
  placeholder = "Type a message…",
  isLoading = false,
  disabled = false,
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || isLoading || disabled || isStreaming) return;

    setMessage("");
    await onSend(trimmed);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("relative w-full flex items-center gap-2 p-4", className)}
    >
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={isLoading ? "Sending..." : placeholder}
        disabled={isLoading || disabled}
        className={`pr-12 py-6 rounded-2xl transition ${
          isLoading
            ? "bg-gray-100 animate-pulse cursor-not-allowed"
            : "bg-white"
        }`}
      />

      {isStreaming ? (
        <Button
          type="button"
          onClick={onStop}
          className="absolute right-5 top-1/2 -translate-y-1/2 !px-3 !rounded-3xl cursor-pointer bg-blue-500 hover:bg-blue-600 transition"
        >
          <Square className="h-5 w-5" fill="white" />
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={!message.trim() || isLoading || disabled || isStreaming}
          className="absolute right-5 top-1/2 -translate-y-1/2 !px-2.5 !rounded-3xl cursor-pointer bg-blue-500 hover:bg-blue-400 transition disabled:opacity-50"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <ArrowUp className="!h-5 !w-5 text-white" />
          )}
        </Button>
      )}
    </form>
  );
}

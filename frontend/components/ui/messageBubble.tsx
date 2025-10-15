"use client";
import ReactMarkdown from "react-markdown";

type Props = {
  role: "user" | "assistant" | string;
  content: string;
  sources?: string[];
  createdAt?: string | Date;
  className?: string;
};

export default function MessageBubble({
  role,
  content,
  sources,
  createdAt,
  className,
}: Props) {
  const isUser = role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} ${
        className ?? ""
      }`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 whitespace-pre-wrap
          ${isUser ? "bg-primary text-primary-foreground" : "bg-muted"}`}
      >
        <div className="text-[11px] opacity-60 mb-1">
          {isUser ? "You" : "Assistant"}
          {createdAt ? (
            <span className="ml-2 opacity-50">
              {new Date(createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : null}
        </div>
        <ReactMarkdown key={content}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
